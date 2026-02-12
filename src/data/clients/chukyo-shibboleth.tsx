// import { forwardRef, ForwardRefRenderFunction, useImperativeHandle, useRef, useState } from "react";
// import { Platform, View } from "react-native";
// import { WebView, WebViewMessageEvent } from "react-native-webview";
// import CookieManager, { Cookies } from "@react-native-cookies/cookies";

// import { SHIBBOLETH_URLS } from "@/src/utils/urls";
// import { OverlapsError, UnauthorizedError } from "../errors/AuthError";
// import { TimeoutError } from "../errors/NetworkError";

// interface Credential {
//     enterUrl: string;
//     goalUrl: string;
//     username: string;
//     password: string;
// }

// export type shibbolethWebViewAuthFunction = (crd: Credential) => Promise<Cookies>;

// export interface shibbolethWebViewRef {
//     auth: shibbolethWebViewAuthFunction;
// }

// const AuthTimeoutMs = 10_000;

// /**
//  * 中京大学Shibboleth認証用のWebViewコンポーネントをforwardRef経由で提供します。
//  *
//  * ! 中京大学のShibboleth認証を使う際は、必ずルートレイアウトにこのコンポーネントを含めること
//  * @param _ 外部から渡されるprops（利用しないため未使用）
//  * @param ref 認証処理を呼び出すための参照
//  * @returns 認証処理に必要な非表示WebViewを含むReact要素
//  */
// const ShibbolethWebViewBase: ForwardRefRenderFunction<shibbolethWebViewRef, object> = (_, ref) => {
//     const [credential, setCredential] = useState<Credential | null>(null);
//     const [randomKey, setRandomKey] = useState(0);

//     const [authResolve, setAuthResolve] = useState<() => void>(() => {});
//     const [authReject, setAuthReject] = useState<(reason?: any) => void>(() => {});

//     const isProcessingRef = useRef(false);
//     const isProcessing = credential !== null;

//     /**
//      * WebViewから送信されるメッセージを受け取り、認証状態を更新します。
//      * @param event WebViewのmessageイベント
//      */
//     const handleMessage = (event: WebViewMessageEvent) => {
//         switch (event.nativeEvent.data) {
//             case "UNAUTHORIZED":
//                 authReject(new UnauthorizedError());
//                 break;
//             case "SUCCESS":
//                 authResolve();
//                 break;
//         }
//     };

//     // 親から呼ばれる関数を定義
//     useImperativeHandle(ref, () => ({
//         /**
//          * 渡された資格情報を用いてShibboleth認証を行い、Cookieを取得します。
//          *
//          * ! この関数は同じタイミングに1つしか実行できません。必ず前の呼び出しが終わったことを確認してから関数を実行してください。
//          * @param crd 認証に使用する資格情報
//          * @returns 認証後に取得したCookieを解決するPromise
//          */
//         auth(crd: Credential): Promise<Cookies> {
//             // 認証処理後のクリーンアップ。finallyでおこなってしまうとCookieクリアのタイミングが次の呼び出し後になってしまう可能性があるのでthen内で呼び出す
//             const cleanup = async () => {
//                 if (Platform.OS === "ios") {
//                     await CookieManager.clearAll(true);
//                 }
//                 await CookieManager.clearAll();

//                 setCredential(null);
//                 isProcessingRef.current = false;
//             };

//             return new Promise<Cookies>(async (resolve, reject) => {
//                 // 重複呼び出しガード
//                 if (isProcessingRef.current === true) {
//                     throw new OverlapsError();
//                 }
//                 isProcessingRef.current = true;

//                 let timeoutId: number;
//                 await new Promise((res, rej) => {
//                     // WebViewに認証情報を渡し、ログイン処理完了の指示が来るのを待つ
//                     setAuthResolve(() => res);
//                     setAuthReject(() => rej);

//                     setRandomKey((prev) => prev + 1);
//                     setCredential(crd);

//                     timeoutId = setTimeout(() => {
//                         rej(new TimeoutError());
//                     }, AuthTimeoutMs);
//                 })
//                     .then(async () => {
//                         clearTimeout(timeoutId);

//                         // WebViewによってセットされたcookieの取得
//                         const cookieBaseUrl = crd.goalUrl;
//                         let cookies: Cookies;
//                         if (Platform.OS === "ios") {
//                             // iosはWebKitを使えるかもしれないので両方から取る
//                             const cookies1 = await CookieManager.get(cookieBaseUrl);
//                             const cookies2 = await CookieManager.get(cookieBaseUrl, true);
//                             cookies = { ...cookies1, ...cookies2 };
//                         } else {
//                             // androidはWebKitが使えないので通常の方だけで良い
//                             cookies = await CookieManager.get(cookieBaseUrl);
//                         }

//                         await cleanup();
//                         resolve(cookies);
//                     })
//                     .catch(async (err) => {
//                         await cleanup();
//                         reject(err);
//                     });
//             });
//         },
//     }));

//     const runFirst = `
// (() => {
//     let url = location.href;
//     let loginFormUrl = "${SHIBBOLETH_URLS.loginForm}";
//     let goalUrl = "${credential?.goalUrl}";
//     let username = "${credential?.username}";
//     let password = "${credential?.password}";

//     // ID/PW入力フォーム時処理
//     if (url.startsWith(loginFormUrl)) {
//         // ログイン情報が違う時の処理
//         if (document.querySelector(".c-message._error") !== null) {
//             window.ReactNativeWebView.postMessage("UNAUTHORIZED");
//             return;
//         }

//         // ログイン情報を入力して送信
//         document.getElementById("username").value = username;
//         document.getElementById("password").value = password;
//         document.getElementById("login").click();
//         return;
//     }

//     // 認証後のリダイレクト処理
//     if (url.startsWith(goalUrl)) {
//         window.ReactNativeWebView.postMessage("SUCCESS");
//         return;
//     }

// })()

// true; // note: this is required, or you'll sometimes get silent failures
// `;

//     return (
//         <>
//             {isProcessing && (
//                 <View style={{ height: 0 }} key={randomKey}>
//                     <WebView
//                         style={{ flex: 1 }}
//                         source={{ uri: credential.enterUrl }}
//                         sharedCookiesEnabled={true}
//                         thirdPartyCookiesEnabled={true}
//                         onMessage={handleMessage}
//                         injectedJavaScript={runFirst}
//                     />
//                 </View>
//             )}
//         </>
//     );
// };
// const ShibbolethWebView = forwardRef(ShibbolethWebViewBase);
// export default ShibbolethWebView;
