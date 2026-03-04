/**
 * プログラム的な Shibboleth 認証クライアント
 *
 * WebView を使わず、react-native-blob-util による HTTP リクエストで
 * Shibboleth 認証フローを処理する。
 *
 * 提供する3つの関数:
 * 1. loginWithPassword - ID/PW でログインし OTP 入力待ち状態を返す
 * 2. registerPasskeyWithOTP - OTP 認証後に擬似 Passkey を登録する
 * 3. loginWithPasskey - 擬似 Passkey でサービスにログインし Cookie を取得する
 */

import { Platform } from "react-native";
import ReactNativeBlobUtil from "react-native-blob-util";
import CookieManager, { Cookies } from "@react-native-cookies/cookies";

import { CHUKYO_SHIBBOLETH_URLS } from "@/common/constants/urls";
import { AuthProcessError, OtpNotEnabledError, UnauthorizedError } from "@/common/errors/auth";
import { buildAssertionResponse, buildRegistrationResponse, type PasskeyCredential } from "./passkey";

// ============================================
// 型定義
// ============================================

/** loginWithPassword の戻り値: OTP 入力待ちセッション */
export interface PasswordLoginSession {
    /** Shibboleth AuthState (SAML フローのセッション識別子) */
    authState: string;
    /** ログインユーザー名 (学籍番号) */
    username: string;
}

// ============================================
// 内部定数
// ============================================

const USER_AGENT =
    "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.0.0 Mobile Safari/537.36";

// ============================================
// HTTP ヘルパー
// ============================================

interface HttpResponse {
    status: number;
    url: string;
    body: string;
    headers: Record<string, string>;
}

function devDebug(label: string, payload?: Record<string, unknown>): void {
    if (!__DEV__) return;
    if (payload) {
        console.log(`[ShibHTTP] ${label}`, payload);
        return;
    }
    console.log(`[ShibHTTP] ${label}`);
}

/** ヘッダーを case-insensitive で取得する */
function getHeader(headers: Record<string, string>, name: string): string | undefined {
    const lower = name.toLowerCase();
    for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === lower) return value;
    }
    return undefined;
}

/** 相対 URL を絶対 URL に解決する */
function resolveUrl(base: string, relative: string): string {
    if (relative.startsWith("http://") || relative.startsWith("https://")) {
        return relative;
    }
    return new URL(relative, base).toString();
}

/** form-urlencoded ボディを構築する */
function formEncode(params: Record<string, string>): string {
    return Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join("&");
}

/** [key, value] ペア配列から form-urlencoded ボディを構築する (重複キー対応) */
function formEncodeArray(params: [string, string][]): string {
    return params.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
}

/**
 * react-native-blob-util を使って HTTP リクエストを送信する。
 * ネイティブ HTTP スタックの Cookie ストアを利用するため Cookie は自動管理される。
 *
 * @param config.followRedirects - true の場合リダイレクトを手動追跡する (最大20回)
 */
async function httpRequest(config: {
    method: "GET" | "POST";
    url: string;
    body?: string;
    contentType?: string;
    origin?: string;
    followRedirects?: boolean;
}): Promise<HttpResponse> {
    let currentUrl = config.url;
    let currentMethod: "GET" | "POST" = config.method;
    let currentBody = config.body;
    const maxRedirects = config.followRedirects ? 20 : 0;

    for (let attempt = 0; attempt <= maxRedirects; attempt++) {
        devDebug("httpRequest:send", {
            attempt,
            method: currentMethod,
            url: currentUrl,
            hasBody: currentBody !== undefined,
            followRedirects: config.followRedirects ?? false,
        });

        const headers: Record<string, string> = {
            "User-Agent": USER_AGENT,
        };

        if (currentBody !== undefined && config.contentType) {
            headers["Content-Type"] = config.contentType;
        }
        if (config.origin) {
            headers["Origin"] = config.origin;
        }

        const response = await ReactNativeBlobUtil.config({
            followRedirect: false,
            trusty: true,
        }).fetch(currentMethod, currentUrl, headers, currentBody);

        const info = response.info();
        devDebug("httpRequest:response", {
            status: info.status,
            url: currentUrl,
            location: getHeader(info.headers, "location") ?? null,
        });

        // リダイレクト処理
        if (info.status >= 300 && info.status < 400 && attempt < maxRedirects) {
            const location = getHeader(info.headers, "location");
            if (!location) break;

            currentUrl = resolveUrl(currentUrl, location);

            // 301/302/303: ブラウザと同様に GET に変更
            if (info.status === 301 || info.status === 302 || info.status === 303) {
                currentMethod = "GET" as const;
                currentBody = undefined;
            }
            // 307/308: メソッドとボディを維持
            continue;
        }

        return {
            status: info.status,
            url: currentUrl,
            body: response.text() as string,
            headers: info.headers,
        };
    }

    throw new AuthProcessError();
}

// ============================================
// HTML パーシングヘルパー
// ============================================

/** SAML Response フォームのデータを抽出する */
function extractSamlForm(html: string): { action: string; samlResponse: string; relayState: string } | null {
    const actionMatch = html.match(/<form[^>]+action="([^"]+)"/);
    const samlMatch = html.match(/name="SAMLResponse"\s+value="([^"]+)"/);
    const relayMatch = html.match(/name="RelayState"\s+value="([^"]*)"/);

    if (!actionMatch || !samlMatch) return null;

    return {
        action: actionMatch[1]!,
        samlResponse: samlMatch[1]!,
        relayState: relayMatch?.[1] ?? "",
    };
}

/** URL の AuthState クエリパラメータを抽出する */
function extractAuthState(url: string): string | null {
    try {
        return new URL(url).searchParams.get("AuthState");
    } catch {
        return null;
    }
}

/** HTML の hidden input から AuthState を抽出する */
function extractAuthStateFromHtml(html: string): string | null {
    // name...value 順
    let match = html.match(/name=["']AuthState["'][^>]*value=["']([^"']+)["']/i);
    if (match?.[1]) return match[1].replace(/&amp;/g, "&");
    // value...name 順
    match = html.match(/value=["']([^"']+)["'][^>]*name=["']AuthState["']/i);
    if (match?.[1]) return match[1].replace(/&amp;/g, "&");
    return null;
}

/** HTML から ACEUSER_CSRFTOKEN を抽出する */
function extractCsrfToken(html: string): string | null {
    // name...value 順
    let match = html.match(/name=["']ACEUSER_CSRFTOKEN["'][^>]*value=["']([^"']+)["']/);
    if (match?.[1]) return match[1];
    // value...name 順
    match = html.match(/value=["']([^"']+)["'][^>]*name=["']ACEUSER_CSRFTOKEN["']/);
    if (match?.[1]) return match[1];
    return null;
}

/** 認証エラー (ID/PW 間違い等) をチェックする */
function isAuthError(html: string): boolean {
    return /class=["'][^"']*c-message[^"']*_error[^"']*["']/.test(html);
}

// ============================================
// Cookie ヘルパー
// ============================================

/** 全 Cookie をクリアする */
async function clearAllCookies(): Promise<void> {
    if (Platform.OS === "ios") {
        await CookieManager.clearAll(true);
    }
    await CookieManager.clearAll();
}

/** 指定 URL の Cookie を取得する */
async function getCookies(url: string): Promise<Cookies> {
    if (Platform.OS === "ios") {
        const cookies1 = await CookieManager.get(url);
        const cookies2 = await CookieManager.get(url, true);
        return { ...cookies1, ...cookies2 };
    }
    return CookieManager.get(url);
}

// ============================================
// Function 1: ID/PW ログイン
// ============================================

/**
 * Passkey を登録するために、ID/PW で Shibboleth 認証を行い
 * OTP 入力待ち状態のセッション情報を返す。
 *
 * CloudLink SP Agent (CLSP) の SAML ログインを開始し、
 * ID/PW 認証まで進める。
 * この関数の後に {@link registerPasskeyWithOTP} を呼び出して
 * OTP 認証と Passkey 登録を行う。
 *
 * @param userId - 学籍番号
 * @param password - パスワード
 * @returns OTP 入力待ちのセッション情報
 * @throws UnauthorizedError ID/PW が正しくない場合
 * @throws OtpNotEnabledError OTP 認証が有効化されていない場合
 * @throws AuthProcessError 認証処理中にエラーが発生した場合
 */
export async function loginWithPassword(userId: string, password: string): Promise<PasswordLoginSession> {
    // Cookie をクリア (フレッシュな状態から開始)
    await clearAllCookies();

    const loginStartUrls = [CHUKYO_SHIBBOLETH_URLS.clspSamlLogin, CHUKYO_SHIBBOLETH_URLS.clspLogin];

    // 1. CLSP ログイン開始 → リダイレクト追跡 → loginuserpass.php に到達
    let loginPageResponse: HttpResponse | null = null;
    for (const startUrl of loginStartUrls) {
        devDebug("loginWithPassword:start", { startUrl, userId });
        const response = await httpRequest({
            method: "GET",
            url: startUrl,
            followRedirects: true,
        });

        const authStateFromUrl = extractAuthState(response.url);
        const authStateFromHtml = extractAuthStateFromHtml(response.body);
        devDebug("loginWithPassword:initialResponse", {
            startUrl,
            status: response.status,
            finalUrl: response.url,
            authStateFromUrl: Boolean(authStateFromUrl),
            authStateFromHtml: Boolean(authStateFromHtml),
        });

        if (response.status === 200 && (authStateFromUrl || authStateFromHtml)) {
            loginPageResponse = response;
            break;
        }
    }

    if (!loginPageResponse) {
        devDebug("loginWithPassword:failedToReachLoginPage");
        throw new AuthProcessError();
    }

    if (loginPageResponse.status !== 200) {
        throw new AuthProcessError();
    }

    // 2. AuthState を URL から抽出（なければ HTML hidden input を利用）
    const authState = extractAuthState(loginPageResponse.url) ?? extractAuthStateFromHtml(loginPageResponse.body);
    if (!authState) {
        devDebug("loginWithPassword:authStateMissing", {
            finalUrl: loginPageResponse.url,
        });
        throw new AuthProcessError();
    }
    devDebug("loginWithPassword:authStateResolved", { authStateLength: authState.length });

    // 3. checktype.php で OTP 認証可否を確認
    const checkTypeResponse = await httpRequest({
        method: "POST",
        url: CHUKYO_SHIBBOLETH_URLS.checktype,
        body: JSON.stringify({
            AuthState: authState,
            params: {
                username: userId,
                UserAgent: USER_AGENT,
            },
        }),
        contentType: "application/json",
        origin: CHUKYO_SHIBBOLETH_URLS.origin,
    });

    if (checkTypeResponse.status !== 200) {
        devDebug("loginWithPassword:checkTypeStatusError", { status: checkTypeResponse.status });
        throw new AuthProcessError();
    }

    let authTypes: string[] = [];
    try {
        const parsed: unknown = JSON.parse(checkTypeResponse.body);
        if (typeof parsed === "object" && parsed !== null && "authType" in parsed) {
            const candidate = (parsed as { authType?: unknown }).authType;
            if (Array.isArray(candidate)) {
                authTypes = candidate.filter((value): value is string => typeof value === "string");
            }
        }
    } catch {
        devDebug("loginWithPassword:checkTypeParseError");
        throw new AuthProcessError();
    }

    const otpEnabled = authTypes.some((type) => type.toUpperCase() === "OTP");
    devDebug("loginWithPassword:checkType", {
        authTypes,
        otpEnabled,
    });
    if (!otpEnabled) {
        throw new OtpNotEnabledError();
    }

    // 4. ID/PW でログイン (authtype=0: パスワード認証)
    const passwordResponse = await httpRequest({
        method: "POST",
        url: CHUKYO_SHIBBOLETH_URLS.cloudlinkLoginForm,
        body: formEncode({
            authtype: "0",
            login_exec: "1",
            username: userId,
            password: password,
            AuthState: authState,
        }),
        contentType: "application/x-www-form-urlencoded",
        origin: CHUKYO_SHIBBOLETH_URLS.origin,
    });

    if (passwordResponse.status !== 200) {
        devDebug("loginWithPassword:passwordPostStatusError", { status: passwordResponse.status });
        throw new AuthProcessError();
    }

    // 5. 認証エラーチェック (ID/PW 間違い)
    if (isAuthError(passwordResponse.body)) {
        devDebug("loginWithPassword:unauthorized");
        throw new UnauthorizedError();
    }

    devDebug("loginWithPassword:success", {
        responseUrl: passwordResponse.url,
        otpPageDetected: /Please input a confirmation code|name=["']authtype["'][^>]*value=["']2["']/i.test(
            passwordResponse.body
        ),
    });

    // OTP 入力フォームが表示されているはず
    return {
        authState,
        username: userId,
    };
}

// ============================================
// Function 2: OTP 認証 + Passkey 登録
// ============================================

/**
 * OTP を入力して Shibboleth 認証を完了し、擬似 Passkey を生成・登録する。
 *
 * {@link loginWithPassword} で得たセッション情報を引き継ぎ、以下を実行する:
 * 1. OTP 認証を完了
 * 2. SAML Assertion を処理して CloudLink SP Agent にログイン
 * 3. ユーザーメニューから FIDO2 デバイス追加ページに遷移
 * 4. ES256 擬似 Passkey を生成し、サーバーに登録
 *
 * @param session - {@link loginWithPassword} の戻り値
 * @param otp - ワンタイムパスワード
 * @param displayName - パスキーの表示名 (例: "umebo")
 * @returns 登録された擬似 Passkey (SecureStore に保存すること)
 * @throws UnauthorizedError OTP が正しくない場合
 * @throws AuthProcessError 認証処理中にエラーが発生した場合
 */
export async function registerPasskeyWithOTP(
    session: PasswordLoginSession,
    otp: string,
    displayName: string
): Promise<PasskeyCredential> {
    // ── Step 1: OTP 認証 (authtype=2) ──
    const otpResponse = await httpRequest({
        method: "POST",
        url: CHUKYO_SHIBBOLETH_URLS.cloudlinkLoginForm,
        body: formEncode({
            authtype: "2",
            resend: "0",
            login_exec: "1",
            username: session.username,
            password: otp,
            AuthState: session.authState,
        }),
        contentType: "application/x-www-form-urlencoded",
        origin: CHUKYO_SHIBBOLETH_URLS.origin,
    });

    if (otpResponse.status !== 200) {
        throw new AuthProcessError();
    }

    if (isAuthError(otpResponse.body)) {
        throw new UnauthorizedError();
    }

    // ── Step 2: SAMLResponse を抽出 ──
    const samlForm = extractSamlForm(otpResponse.body);
    if (!samlForm) {
        throw new AuthProcessError();
    }

    // ── Step 3: SAMLResponse を SP ACS に POST → リダイレクト追跡 → /User/Menu ──
    const menuResponse = await httpRequest({
        method: "POST",
        url: samlForm.action,
        body: formEncode({
            SAMLResponse: samlForm.samlResponse,
            RelayState: samlForm.relayState,
        }),
        contentType: "application/x-www-form-urlencoded",
        followRedirects: true,
    });

    if (menuResponse.status !== 200) {
        throw new AuthProcessError();
    }

    // ── Step 4: ACEUSER_CSRFTOKEN を抽出 ──
    const csrfToken = extractCsrfToken(menuResponse.body);
    if (!csrfToken) {
        throw new AuthProcessError();
    }

    // ── Step 5: /User/MenuSelect (認証器管理ページに遷移) ──
    const menuSelectResponse = await httpRequest({
        method: "POST",
        url: CHUKYO_SHIBBOLETH_URLS.userMenuSelect,
        body: formEncode({
            ACEUSER_CSRFTOKEN: csrfToken,
            type: "U25-001",
        }),
        contentType: "application/x-www-form-urlencoded",
        origin: CHUKYO_SHIBBOLETH_URLS.origin,
    });

    if (menuSelectResponse.status !== 200) {
        throw new AuthProcessError();
    }

    // CSRFToken を再取得 (ページ遷移で更新される可能性がある)
    const csrfToken2 = extractCsrfToken(menuSelectResponse.body) ?? csrfToken;

    // ── Step 6: /User/Fido2DeviceAdd (認証器追加ページ) ──
    const deviceAddResponse = await httpRequest({
        method: "POST",
        url: CHUKYO_SHIBBOLETH_URLS.userFido2DeviceAdd,
        body: formEncodeArray([
            ["ACEUSER_CSRFTOKEN", csrfToken2],
            ["procchk", ""],
            ["username", session.username],
            ["procchk", ""],
        ]),
        contentType: "application/x-www-form-urlencoded",
        origin: CHUKYO_SHIBBOLETH_URLS.origin,
    });

    if (deviceAddResponse.status !== 200) {
        throw new AuthProcessError();
    }

    // ── Step 7: WebAuthn start-registration ──
    const startRegResponse = await httpRequest({
        method: "POST",
        url: CHUKYO_SHIBBOLETH_URLS.userWebauthn,
        body: JSON.stringify({
            method: "start-registration",
            sessioninfo: {},
            params: {
                username: session.username,
                displayName: displayName,
                browserInfo: USER_AGENT,
            },
        }),
        contentType: "application/json",
        origin: CHUKYO_SHIBBOLETH_URLS.origin,
    });

    if (startRegResponse.status !== 200) {
        throw new AuthProcessError();
    }

    const startRegData = JSON.parse(startRegResponse.body);
    if (startRegData.status !== 0) {
        throw new AuthProcessError();
    }

    const challenge: string = startRegData.params.challenge;
    const userIdB64: string = startRegData.params.user.id;

    // ── Step 8: 擬似 Passkey を生成し finish-registration リクエストを構築 ──
    const { credential, finishRegistrationBody } = await buildRegistrationResponse(challenge, userIdB64, displayName);

    // ── Step 9: WebAuthn finish-registration ──
    const finishRegResponse = await httpRequest({
        method: "POST",
        url: CHUKYO_SHIBBOLETH_URLS.userWebauthn,
        body: JSON.stringify(finishRegistrationBody),
        contentType: "application/json",
        origin: CHUKYO_SHIBBOLETH_URLS.origin,
    });

    if (finishRegResponse.status !== 200) {
        throw new AuthProcessError();
    }

    const finishRegData = JSON.parse(finishRegResponse.body);
    if (finishRegData.status !== 0) {
        throw new AuthProcessError();
    }

    return credential;
}

// ============================================
// Function 3: Passkey ログイン
// ============================================

/**
 * 擬似 Passkey を使用して Shibboleth 認証を行い、サービスの Cookie を取得する。
 *
 * ⚠️ この関数は storedPasskey.signCount を直接更新する。
 * 呼び出し後に更新された credential を SecureStore に保存すること。
 *
 * @param credential - サービスへのログイン情報 (enterUrl, goalUrl, userId, password)
 * @param storedPasskey - {@link registerPasskeyWithOTP} で取得した擬似 Passkey
 * @returns 認証後のサービス Cookie
 * @throws UnauthorizedError 認証に失敗した場合
 * @throws AuthProcessError 認証処理中にエラーが発生した場合
 */
export async function loginWithPasskey(
    credential: { enterUrl: string; goalUrl: string; userId: string; password: string },
    storedPasskey: PasskeyCredential
): Promise<Cookies> {
    // Cookie をクリア (フレッシュな状態から開始)
    await clearAllCookies();

    // ── Step 1: ログインページへ遷移 → リダイレクト追跡 → loginuserpass.php 到達 ──
    const loginPageResponse = await httpRequest({
        method: "GET",
        url: credential.enterUrl,
        followRedirects: true,
    });

    if (loginPageResponse.status !== 200) {
        throw new AuthProcessError();
    }

    // ── Step 2: AuthState を抽出 ──
    const authState = extractAuthState(loginPageResponse.url) ?? extractAuthStateFromHtml(loginPageResponse.body);
    if (!authState) {
        devDebug("loginWithPasskey:authStateMissing", {
            finalUrl: loginPageResponse.url,
        });
        throw new AuthProcessError();
    }

    // ── Step 3: WebAuthn start-authentication (チャレンジ取得) ──
    const startAuthResponse = await httpRequest({
        method: "POST",
        url: CHUKYO_SHIBBOLETH_URLS.webauthn,
        body: JSON.stringify({
            method: "start-authentication",
            sessioninfo: { AuthState: authState },
            params: {
                username: credential.userId,
                browserInfo: USER_AGENT,
            },
        }),
        contentType: "application/json",
        origin: CHUKYO_SHIBBOLETH_URLS.origin,
    });

    if (startAuthResponse.status !== 200) {
        throw new AuthProcessError();
    }

    const startAuthData = JSON.parse(startAuthResponse.body);
    if (startAuthData.status !== 0) {
        throw new AuthProcessError();
    }

    const challenge: string = startAuthData.params.challenge;

    // ── Step 4: Assertion を構築 (秘密鍵で署名) ──
    const { finishAuthenticationBody, updatedSignCount } = await buildAssertionResponse(
        challenge,
        storedPasskey,
        authState
    );

    // ── Step 5: WebAuthn finish-authentication ──
    const finishAuthResponse = await httpRequest({
        method: "POST",
        url: CHUKYO_SHIBBOLETH_URLS.webauthn,
        body: JSON.stringify(finishAuthenticationBody),
        contentType: "application/json",
        origin: CHUKYO_SHIBBOLETH_URLS.origin,
    });

    if (finishAuthResponse.status !== 200) {
        throw new AuthProcessError();
    }

    const finishAuthData = JSON.parse(finishAuthResponse.body);
    if (finishAuthData.status !== 0) {
        throw new AuthProcessError();
    }

    // signCount を更新 (呼び出し元で永続化すること)
    storedPasskey.signCount = updatedSignCount;

    // ── Step 6: Passkey 認証でログイン (authtype=3) ──
    const loginResponse = await httpRequest({
        method: "POST",
        url: CHUKYO_SHIBBOLETH_URLS.cloudlinkLoginForm,
        body: formEncode({
            authtype: "3",
            login_exec: "1",
            username: credential.userId,
            password: credential.password,
            AuthState: authState,
            credentialid: storedPasskey.credentialId,
        }),
        contentType: "application/x-www-form-urlencoded",
        origin: CHUKYO_SHIBBOLETH_URLS.origin,
    });

    if (loginResponse.status !== 200) {
        throw new AuthProcessError();
    }

    if (isAuthError(loginResponse.body)) {
        throw new UnauthorizedError();
    }

    // ── Step 7: SAMLResponse を抽出 ──
    const samlForm = extractSamlForm(loginResponse.body);
    if (!samlForm) {
        throw new AuthProcessError();
    }

    // ── Step 8: SAMLResponse を SP ACS に POST → リダイレクト追跡 ──
    await httpRequest({
        method: "POST",
        url: samlForm.action,
        body: formEncode({
            SAMLResponse: samlForm.samlResponse,
            RelayState: samlForm.relayState,
        }),
        contentType: "application/x-www-form-urlencoded",
        followRedirects: true,
    });

    // ── Step 9: Cookie を取得して返す ──
    return getCookies(credential.goalUrl);
}
