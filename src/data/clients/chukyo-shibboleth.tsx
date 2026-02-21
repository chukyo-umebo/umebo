import { forwardRef, ForwardRefRenderFunction, useImperativeHandle, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import CookieManager, { Cookies } from "@react-native-cookies/cookies";

import { CHUKYO_SHIBBOLETH_URLS } from "@/common/constants/urls";
import { UnauthorizedError } from "@/common/errors/auth";
import { TimeoutError } from "@/common/errors/network";

export interface Credential {
    enterUrl: string;
    goalUrl: string;
    userId: string;
    password: string;
}

/** キューに積まれる認証リクエスト */
interface QueueItem {
    credential: Credential;
    resolve: (cookies: Cookies) => void;
    reject: (reason?: any) => void;
}

export type shibbolethWebViewAuthFunction = (crd: Credential) => Promise<Cookies>;

export interface shibbolethWebViewRef {
    chukyoShibbolethAuth: shibbolethWebViewAuthFunction;
}

const AuthTimeoutMs = 10_000;

/**
 * 中京大学Shibboleth認証用のWebViewコンポーネントをforwardRef経由で提供します。
 *
 * 複数回の認証リクエストはキューに蓄積され、順次処理されます。
 *
 * ! 中京大学のShibboleth認証を使う際は、必ずルートレイアウトにこのコンポーネントを含めること
 * @param _ 外部から渡されるprops（利用しないため未使用）
 * @param ref 認証処理を呼び出すための参照
 * @returns 認証処理に必要な非表示WebViewを含むReact要素
 */
const ChukyoShibbolethWebViewBase: ForwardRefRenderFunction<shibbolethWebViewRef, object> = (_, ref) => {
    const [credential, setCredential] = useState<Credential | null>(null);
    const [randomKey, setRandomKey] = useState(0);

    const isProcessingRef = useRef(false);
    const queueRef = useRef<QueueItem[]>([]);
    const currentResolveRef = useRef<(() => void) | null>(null);
    const currentRejectRef = useRef<((reason?: any) => void) | null>(null);
    const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isProcessing = credential !== null;

    /**
     * キュー内の次のリクエストを取り出して処理を開始します。
     * キューが空の場合は処理状態を解除して終了します。
     */
    const processNext = () => {
        if (queueRef.current.length === 0) {
            isProcessingRef.current = false;
            return;
        }

        isProcessingRef.current = true;
        const item = queueRef.current.shift()!;

        /** 認証処理後のクリーンアップ */
        const cleanup = async () => {
            if (timeoutIdRef.current !== null) {
                clearTimeout(timeoutIdRef.current);
                timeoutIdRef.current = null;
            }
            if (Platform.OS === "ios") {
                await CookieManager.clearAll(true);
            }
            await CookieManager.clearAll();

            setCredential(null);
            currentResolveRef.current = null;
            currentRejectRef.current = null;
        };

        // WebViewからSUCCESSが通知された際のコールバック
        currentResolveRef.current = async () => {
            // WebViewによってセットされたcookieの取得
            const cookieBaseUrl = item.credential.goalUrl;
            let cookies: Cookies;
            if (Platform.OS === "ios") {
                // iosはWebKitを使えるかもしれないので両方から取る
                const cookies1 = await CookieManager.get(cookieBaseUrl);
                const cookies2 = await CookieManager.get(cookieBaseUrl, true);
                cookies = { ...cookies1, ...cookies2 };
            } else {
                // androidはWebKitが使えないので通常の方だけで良い
                cookies = await CookieManager.get(cookieBaseUrl);
            }

            await cleanup();
            item.resolve(cookies);
            processNext();
        };

        // WebViewからUNAUTHORIZEDが通知された、またはタイムアウトした際のコールバック
        currentRejectRef.current = async (err: any) => {
            await cleanup();
            item.reject(err);
            processNext();
        };

        // WebViewに認証情報を渡してログイン処理を開始
        setRandomKey((prev) => prev + 1);
        setCredential(item.credential);

        timeoutIdRef.current = setTimeout(() => {
            currentRejectRef.current?.(new TimeoutError());
        }, AuthTimeoutMs);
    };

    /**
     * WebViewから送信されるメッセージを受け取り、認証状態を更新します。
     * @param event WebViewのmessageイベント
     */
    const handleMessage = (event: WebViewMessageEvent) => {
        switch (event.nativeEvent.data) {
            case "UNAUTHORIZED":
                currentRejectRef.current?.(new UnauthorizedError());
                break;
            case "SUCCESS":
                currentResolveRef.current?.();
                break;
        }
    };

    // 親から呼ばれる関数を定義
    useImperativeHandle(ref, () => ({
        /**
         * 渡された資格情報を用いてShibboleth認証を行い、Cookieを取得します。
         *
         * 複数回呼び出された場合はキューに積まれ、順次処理されます。
         * @param crd 認証に使用する資格情報
         * @returns 認証後に取得したCookieを解決するPromise
         */
        chukyoShibbolethAuth(crd: Credential): Promise<Cookies> {
            return new Promise<Cookies>((resolve, reject) => {
                queueRef.current.push({ credential: crd, resolve, reject });

                // 現在処理中でなければキューの処理を開始
                if (!isProcessingRef.current) {
                    processNext();
                }
            });
        },
    }));

    const runFirst = `
(() => {
    let url = location.href;
    let loginFormUrl = "${CHUKYO_SHIBBOLETH_URLS.loginForm}";
    let goalUrl = "${credential?.goalUrl}";
    let userId = "${credential?.userId}";
    let password = "${credential?.password}";

    // ID/PW入力フォーム時処理
    if (url.startsWith(loginFormUrl)) {
        // ログイン情報が違う時の処理
        if (document.querySelector(".c-message._error") !== null) {
            window.ReactNativeWebView.postMessage("UNAUTHORIZED");
            return;
        }

        // ログイン情報を入力して送信
        document.getElementById("username").value = userId;
        document.getElementById("password").value = password;
        document.getElementById("login").click();
        return;
    }

    // 認証後のリダイレクト処理
    if (url.startsWith(goalUrl)) {
        window.ReactNativeWebView.postMessage("SUCCESS");
        return;
    }

})()

true; // note: this is required, or you'll sometimes get silent failures
`;

    return (
        <>
            {isProcessing && (
                <View style={{ height: 200 }} key={randomKey}>
                    <WebView
                        style={{ flex: 1 }}
                        source={{ uri: credential.enterUrl }}
                        sharedCookiesEnabled={true}
                        thirdPartyCookiesEnabled={true}
                        onMessage={handleMessage}
                        injectedJavaScript={runFirst}
                    />
                </View>
            )}
        </>
    );
};
const ChukyoShibbolethWebView = forwardRef(ChukyoShibbolethWebViewBase);
export default ChukyoShibbolethWebView;
