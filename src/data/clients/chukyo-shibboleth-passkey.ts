/**
 * 中京大学 Shibboleth 疑似パスキー認証モジュール
 *
 * 二段階認証 (ID/PW + OTP/Passkey) に対応した Shibboleth 認証を
 * react-native-blob-util を使ってプログラム的に行う。
 *
 * 提供する主な関数:
 * - {@link authenticateWithPassword} — ID/PW で一次認証し、OTP入力待ちの状態を返す
 * - {@link registerPasskeyWithOtp} — OTP を入力しログイン後、疑似パスキーを生成・登録する
 * - {@link authenticateWithPasskey} — 登録済み疑似パスキーでサービスにログインする
 */

import { Platform } from "react-native";
import ReactNativeBlobUtil from "react-native-blob-util";
import * as Application from "expo-application";
import { p256 } from "@noble/curves/nist.js";
import { sha256 } from "@noble/hashes/sha2.js";

import { CHUKYO_SHIBBOLETH_URLS } from "@/common/constants/urls";
import { AuthProcessError, UnauthorizedError } from "@/common/errors/auth";

// ============================================
// 型定義
// ============================================

/** ドメイン単位のクッキー保持用 */
type DomainCookies = Record<string, string>;

/** 永続化用の疑似パスキー資格情報 */
export interface PasskeyCredential {
    /** base64url エンコードされた credentialId */
    credentialId: string;
    /** hex エンコードされた ECDSA P-256 秘密鍵 */
    privateKeyHex: string;
    /** Relying Party ID */
    rpId: string;
    /** 大学ユーザーID */
    userId: string;
    /** base64url エンコードされたサーバー発行 user.id */
    userHandle: string;
    /** パスキー表示名 */
    displayName: string;
}

/** ID/PW 認証後、OTP 入力待ちの中間状態 */
export interface PasswordAuthResult {
    /** Shibboleth AuthState トークン */
    authState: string;
    /** 認証中に蓄積されたクッキー (ドメイン別) */
    cookieJar: CookieJar;
    /** ユーザーID */
    username: string;
    /** パスワード (パスキーログインでも必要) */
    password: string;
}

/** 認証完了後のサービスクッキー */
export type ServiceCookies = Record<string, string>;

// ============================================
// 定数
// ============================================

const USER_AGENT = (() => {
    const appName = "UMEBO";
    const appVersion = Application.nativeApplicationVersion ?? "unknown";
    const os = Platform.OS ?? "unknown";
    return `${appName}/${appVersion} (${os})`;
})();

const BROWSER_INFO = `Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.0.0 Mobile Safari/537.36 ${USER_AGENT}`;

const MAX_REDIRECTS = 20;
const REQUEST_TIMEOUT = 30_000;

/** パスキー登録用メニュー種別 */
const FIDO2_MENU_TYPE = "U25-001";

// ============================================
// base64url ユーティリティ
// ============================================

function base64urlEncode(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]!);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _base64urlDecode(str: string): Uint8Array {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const pad = (4 - (base64.length % 4)) % 4;
    const padded = base64 + "=".repeat(pad);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
    const total = arrays.reduce((sum, a) => sum + a.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

// ============================================
// 簡易 CBOR エンコーダ (WebAuthn 用途に必要な型のみ)
// ============================================

function cborEncodeUint(value: number): Uint8Array {
    if (value < 24) return new Uint8Array([value]);
    if (value < 256) return new Uint8Array([0x18, value]);
    if (value < 65536) return new Uint8Array([0x19, (value >> 8) & 0xff, value & 0xff]);
    // 4 byte
    return new Uint8Array([0x1a, (value >> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff]);
}

function cborEncodeNegInt(value: number): Uint8Array {
    // CBOR negative int encodes -1-n as major type 1
    const n = -1 - value;
    if (n < 24) return new Uint8Array([0x20 | n]);
    if (n < 256) return new Uint8Array([0x38, n]);
    return new Uint8Array([0x39, (n >> 8) & 0xff, n & 0xff]);
}

function cborEncodeInt(value: number): Uint8Array {
    return value >= 0 ? cborEncodeUint(value) : cborEncodeNegInt(value);
}

function cborEncodeBytes(bytes: Uint8Array): Uint8Array {
    const len = bytes.length;
    let header: Uint8Array;
    if (len < 24) {
        header = new Uint8Array([0x40 | len]);
    } else if (len < 256) {
        header = new Uint8Array([0x58, len]);
    } else {
        header = new Uint8Array([0x59, (len >> 8) & 0xff, len & 0xff]);
    }
    return concatBytes(header, bytes);
}

function cborEncodeText(text: string): Uint8Array {
    const encoded = new TextEncoder().encode(text);
    const len = encoded.length;
    let header: Uint8Array;
    if (len < 24) {
        header = new Uint8Array([0x60 | len]);
    } else if (len < 256) {
        header = new Uint8Array([0x78, len]);
    } else {
        header = new Uint8Array([0x79, (len >> 8) & 0xff, len & 0xff]);
    }
    return concatBytes(header, encoded);
}

function cborEncodeMapHeader(count: number): Uint8Array {
    if (count < 24) return new Uint8Array([0xa0 | count]);
    return new Uint8Array([0xb8, count]);
}

// ============================================
// WebAuthn データ構築
// ============================================

/**
 * COSE Key (P-256 公開鍵) をエンコードする
 * @param publicKeyUncompressed 65バイトの非圧縮公開鍵 (0x04 || x || y)
 */
function buildCoseKey(publicKeyUncompressed: Uint8Array): Uint8Array {
    const x = publicKeyUncompressed.slice(1, 33);
    const y = publicKeyUncompressed.slice(33, 65);

    return concatBytes(
        cborEncodeMapHeader(5),
        cborEncodeInt(1),
        cborEncodeInt(2), // kty: EC2
        cborEncodeInt(3),
        cborEncodeInt(-7), // alg: ES256
        cborEncodeInt(-1),
        cborEncodeInt(1), // crv: P-256
        cborEncodeInt(-2),
        cborEncodeBytes(x), // x
        cborEncodeInt(-3),
        cborEncodeBytes(y) // y
    );
}

/**
 * 登録用の authData を構築する
 * @param rpIdHash RP ID の SHA-256 ハッシュ (32バイト)
 * @param credentialId credentialId バイト列
 * @param publicKeyUncompressed 非圧縮公開鍵
 * @param counter 署名カウンタ
 */
function buildRegistrationAuthData(
    rpIdHash: Uint8Array,
    credentialId: Uint8Array,
    publicKeyUncompressed: Uint8Array,
    counter: number = 0
): Uint8Array {
    // flags: UP(0x01) | UV(0x04) | AT(0x40) = 0x45
    const flags = new Uint8Array([0x45]);
    const counterBytes = new Uint8Array([
        (counter >> 24) & 0xff,
        (counter >> 16) & 0xff,
        (counter >> 8) & 0xff,
        counter & 0xff,
    ]);
    // AAGUID: all zeros (ソフトウェア認証器)
    const aaguid = new Uint8Array(16);
    // credentialIdLength (2 bytes big-endian)
    const credIdLen = new Uint8Array([(credentialId.length >> 8) & 0xff, credentialId.length & 0xff]);
    const coseKey = buildCoseKey(publicKeyUncompressed);

    return concatBytes(rpIdHash, flags, counterBytes, aaguid, credIdLen, credentialId, coseKey);
}

/**
 * 認証用の authData を構築する
 * @param rpIdHash RP ID の SHA-256 ハッシュ
 * @param counter 署名カウンタ
 */
function buildAuthenticationAuthData(rpIdHash: Uint8Array, counter: number = 0): Uint8Array {
    // flags: UP(0x01) | UV(0x04) | BE(0x08) | BS(0x10) = 0x1d
    const flags = new Uint8Array([0x1d]);
    const counterBytes = new Uint8Array([
        (counter >> 24) & 0xff,
        (counter >> 16) & 0xff,
        (counter >> 8) & 0xff,
        counter & 0xff,
    ]);
    return concatBytes(rpIdHash, flags, counterBytes);
}

/**
 * attestationObject (fmt=none) を CBOR エンコードする
 */
function buildAttestationObject(authData: Uint8Array): Uint8Array {
    return concatBytes(
        cborEncodeMapHeader(3),
        cborEncodeText("fmt"),
        cborEncodeText("none"),
        cborEncodeText("attStmt"),
        cborEncodeMapHeader(0), // empty map
        cborEncodeText("authData"),
        cborEncodeBytes(authData)
    );
}

/**
 * clientDataJSON を構築する
 * @param type "webauthn.create" または "webauthn.get"
 * @param challenge サーバーから受け取ったチャレンジ (base64url)
 */
function buildClientDataJSON(type: "webauthn.create" | "webauthn.get", challenge: string): string {
    return JSON.stringify({
        type,
        challenge,
        origin: CHUKYO_SHIBBOLETH_URLS.origin,
        crossOrigin: false,
    });
}

// ============================================
// クッキー管理
// ============================================

class CookieJar {
    private store: Record<string, DomainCookies> = {};

    private getDomain(url: string): string {
        try {
            return new URL(url).hostname;
        } catch {
            // フォールバック: URL からホスト名を抽出
            const match = url.match(/^https?:\/\/([^/]+)/);
            return match?.[1] ?? "";
        }
    }

    /** Set-Cookie ヘッダーを解析してストアに追加 */
    parseSetCookieHeader(url: string, setCookieValue: string | undefined): void {
        if (!setCookieValue) return;
        const domain = this.getDomain(url);
        if (!this.store[domain]) {
            this.store[domain] = {};
        }

        // react-native-blob-util は複数の Set-Cookie を ", " で結合する場合がある
        // ただし Expires の日付にも ", " が含まれるため、正規表現で慎重に分割
        const cookieStrings = setCookieValue.split(/,\s(?=[A-Za-z_\-]+=)/);

        for (const cookie of cookieStrings) {
            const nameValue = cookie.split(";")[0]?.trim() ?? "";
            const eqIdx = nameValue.indexOf("=");
            if (eqIdx > 0) {
                const name = nameValue.substring(0, eqIdx).trim();
                const value = nameValue.substring(eqIdx + 1).trim();
                this.store[domain][name] = value;
            }
        }
    }

    /** リクエスト用の Cookie ヘッダー文字列を取得 */
    getCookieString(url: string): string {
        const domain = this.getDomain(url);
        const cookies = this.store[domain];
        if (!cookies) return "";
        return Object.entries(cookies)
            .map(([k, v]) => `${k}=${v}`)
            .join("; ");
    }

    /** 特定ドメインのクッキーをすべて取得 */
    getCookies(url: string): DomainCookies {
        const domain = this.getDomain(url);
        return { ...(this.store[domain] ?? {}) };
    }

    /** 内部ストアのクローンを返す */
    clone(): CookieJar {
        const jar = new CookieJar();
        jar.store = JSON.parse(JSON.stringify(this.store));
        return jar;
    }
}

// ============================================
// HTTP ヘルパー
// ============================================

/** ヘッダーオブジェクトからキーを大小文字無視で取得 */
function getHeader(headers: Record<string, string>, name: string): string | undefined {
    const lower = name.toLowerCase();
    for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === lower) return value;
    }
    return undefined;
}

interface FetchResult {
    status: number;
    headers: Record<string, string>;
    body: string;
    finalUrl: string;
}

/**
 * react-native-blob-util でリクエストし、リダイレクトを手動追跡してクッキーを収集する
 */
async function fetchWithCookies(
    method: "GET" | "POST",
    url: string,
    cookieJar: CookieJar,
    options?: {
        body?: string;
        contentType?: string;
        followRedirects?: boolean;
    }
): Promise<FetchResult> {
    const followRedirects = options?.followRedirects ?? true;
    let currentUrl = url;
    let currentMethod = method;
    let currentBody = options?.body;
    let currentContentType = options?.contentType;

    for (let i = 0; i < MAX_REDIRECTS; i++) {
        const headers: Record<string, string> = {
            "User-Agent": USER_AGENT,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        };

        const cookieStr = cookieJar.getCookieString(currentUrl);
        if (cookieStr) {
            headers["Cookie"] = cookieStr;
        }

        if (currentContentType) {
            headers["Content-Type"] = currentContentType;
        }

        const res = await ReactNativeBlobUtil.config({
            followRedirect: false,
            trusty: true,
            timeout: REQUEST_TIMEOUT,
        }).fetch(currentMethod, currentUrl, headers, currentBody ?? undefined);

        const status = res.info().status;
        const resHeaders = res.info().headers;

        // クッキーを収集
        cookieJar.parseSetCookieHeader(currentUrl, getHeader(resHeaders, "Set-Cookie"));
        // Android では "set-cookie" が分かれる場合もある
        cookieJar.parseSetCookieHeader(currentUrl, getHeader(resHeaders, "set-cookie"));

        // リダイレクト判定
        if (followRedirects && [301, 302, 303, 307, 308].includes(status)) {
            const location = getHeader(resHeaders, "Location") ?? getHeader(resHeaders, "location");
            if (!location) {
                return { status, headers: resHeaders, body: res.data, finalUrl: currentUrl };
            }

            // 相対 URL を絶対 URL に変換
            currentUrl = location.startsWith("http") ? location : new URL(location, currentUrl).toString();

            // 303 は GET に変換、307/308 はメソッド維持
            if (status === 303 || status === 301 || status === 302) {
                currentMethod = "GET";
                currentBody = undefined;
                currentContentType = undefined;
            }
            continue;
        }

        return { status, headers: resHeaders, body: res.data, finalUrl: currentUrl };
    }

    throw new AuthProcessError({ cause: new Error("リダイレクト回数の上限に達しました") });
}

/**
 * JSON を POST して JSON レスポンスを取得
 */
async function postJson(url: string, cookieJar: CookieJar, data: object): Promise<{ status: number; json: any }> {
    const result = await fetchWithCookies("POST", url, cookieJar, {
        body: JSON.stringify(data),
        contentType: "application/json",
        followRedirects: false,
    });
    try {
        return { status: result.status, json: JSON.parse(result.body) };
    } catch {
        throw new AuthProcessError({ cause: new Error("JSONレスポンスの解析に失敗しました") });
    }
}

/**
 * フォームデータを POST
 */
async function postForm(
    url: string,
    cookieJar: CookieJar,
    params: Record<string, string>,
    followRedirects = false
): Promise<FetchResult> {
    const body = Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");

    return fetchWithCookies("POST", url, cookieJar, {
        body,
        contentType: "application/x-www-form-urlencoded",
        followRedirects,
    });
}

// ============================================
// HTML パーサー
// ============================================

/** HTML から hidden input の AuthState 値を抽出 */
function extractAuthState(html: string): string {
    const match = html.match(/name="AuthState"[^>]*value="([^"]+)"/);
    if (!match) {
        throw new AuthProcessError({ cause: new Error("AuthState が見つかりません") });
    }
    // HTML エンティティをデコード
    return match[1]!
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"');
}

/** HTML から ACEUSER_CSRFTOKEN を抽出 */
function extractCsrfToken(html: string): string {
    const match = html.match(/name="ACEUSER_CSRFTOKEN"[^>]*value="([^"]+)"/);
    if (!match?.[1]) {
        throw new AuthProcessError({ cause: new Error("CSRF トークンが見つかりません") });
    }
    return match[1];
}

/** HTML から SAMLResponse フォームの action URL, SAMLResponse, RelayState を抽出 */
function extractSamlResponseForm(html: string): {
    action: string;
    samlResponse: string;
    relayState?: string;
} {
    const actionMatch = html.match(/form[^>]*action="([^"]+)"/);
    const samlMatch = html.match(/name="SAMLResponse"[^>]*value="([^"]+)"/);

    if (!actionMatch || !samlMatch) {
        throw new AuthProcessError({ cause: new Error("SAMLResponse フォームが見つかりません") });
    }

    const relayMatch = html.match(/name="RelayState"[^>]*value="([^"]+)"/);

    return {
        action: actionMatch[1]!.replace(/&amp;/g, "&"),
        samlResponse: samlMatch[1]!,
        relayState: relayMatch?.[1],
    };
}

/** HTML にエラーメッセージが含まれているか判定 */
function hasLoginError(html: string): boolean {
    return html.includes("c-message _error") || html.includes("c-message_error");
}

// ============================================
// 共通フロー
// ============================================

/**
 * サービスの enterUrl からリダイレクトをたどり、
 * ログインフォームページまで到達して AuthState を取得する
 *
 * @returns AuthState 文字列とフォームURL
 */
async function navigateToLoginForm(
    enterUrl: string,
    cookieJar: CookieJar
): Promise<{ authState: string; loginFormUrl: string }> {
    // enterUrl → SAML redirect → loginuserpass.php
    const result = await fetchWithCookies("GET", enterUrl, cookieJar, { followRedirects: true });

    if (result.status !== 200) {
        throw new AuthProcessError({
            cause: new Error(`ログインフォームへの到達に失敗しました (status=${result.status})`),
        });
    }

    const authState = extractAuthState(result.body);

    return { authState, loginFormUrl: result.finalUrl };
}

/**
 * ログインフォーム上で webauthn start-authentication と checktype を呼ぶ共通処理
 *
 * @returns checktype のレスポンス (authType 配列)
 */
async function performInitialChecks(
    authState: string,
    username: string,
    cookieJar: CookieJar
): Promise<{ authTypes: string[] }> {
    // start-authentication (username 空で呼ぶ)
    await postJson(CHUKYO_SHIBBOLETH_URLS.webauthn, cookieJar, {
        method: "start-authentication",
        sessioninfo: { AuthState: authState },
        params: { username: "", browserInfo: BROWSER_INFO },
    });

    // checktype
    const checkResult = await postJson(CHUKYO_SHIBBOLETH_URLS.checktype, cookieJar, {
        AuthState: authState,
        params: { username, UserAgent: BROWSER_INFO },
    });

    const authTypes: string[] = checkResult.json?.authType ?? [];
    return { authTypes };
}

// ============================================
// メイン関数 1: ID/PW で一次認証
// ============================================

/**
 * ID/PW で Shibboleth の一次認証を行い、OTP 入力待ち状態を返す。
 *
 * この関数は Shibboleth ログインフォームにアクセスし、
 * ユーザー名とパスワードで `authtype=0` のログインを実行する。
 * 成功すると OTP 入力フォームが返され、その状態を保持して返す。
 *
 * @param enterUrl SAML 認証開始 URL (例: `/clsp/login`)
 * @param userId 大学ユーザーID
 * @param password パスワード
 * @returns OTP 入力に必要な中間認証状態
 * @throws UnauthorizedError ID/PW が不正な場合
 * @throws AuthProcessError 認証フローが正常に進まない場合
 */
export async function authenticateWithPassword(
    enterUrl: string,
    userId: string,
    password: string
): Promise<PasswordAuthResult> {
    const cookieJar = new CookieJar();

    // ログインフォームまで到達
    const { authState } = await navigateToLoginForm(enterUrl, cookieJar);

    // WebAuthn / checktype 初期チェック
    await performInitialChecks(authState, userId, cookieJar);

    // ID/PW でログイン (authtype=0)
    const loginResult = await postForm(
        CHUKYO_SHIBBOLETH_URLS.cloudlinkLoginForm + "?",
        cookieJar,
        {
            authtype: "0",
            login_exec: "1",
            username: userId,
            password,
            AuthState: authState,
        },
        true
    );

    // エラーチェック: ログインページが再表示された + エラーメッセージ
    if (hasLoginError(loginResult.body)) {
        throw new UnauthorizedError();
    }

    // 成功の場合: OTP 入力フォームが返される (title="Login")
    // SAMLResponse フォーム (title="POST data") が返された場合は OTP 不要 → ありえないはずだが安全チェック
    if (loginResult.body.includes("POST data")) {
        throw new AuthProcessError({
            cause: new Error("OTP なしで認証が完了しました。予期しないフローです。"),
        });
    }

    return {
        authState,
        cookieJar,
        username: userId,
        password,
    };
}

// ============================================
// メイン関数 2: OTP + 疑似パスキー登録
// ============================================

/**
 * OTP を入力してログインし、疑似パスキーを生成・登録する。
 *
 * {@link authenticateWithPassword} で取得した中間認証状態と OTP を使い、
 * 二段階認証を完了してログインする。
 * その後 ACE User ポータルのパスキー管理画面に遷移し、
 * ソフトウェアで生成した疑似パスキーを登録する。
 *
 * @param authResult {@link authenticateWithPassword} の戻り値
 * @param otp ユーザーが入力した OTP コード
 * @param displayName パスキーの表示名
 * @returns 永続化すべき疑似パスキー資格情報
 * @throws UnauthorizedError OTP が不正な場合
 * @throws AuthProcessError 登録フローが正常に進まない場合
 */
export async function registerPasskeyWithOtp(
    authResult: PasswordAuthResult,
    otp: string,
    displayName: string
): Promise<PasskeyCredential> {
    const cookieJar = authResult.cookieJar.clone();
    const { authState, username } = authResult;

    // --- Step 1: OTP でログイン (authtype=2) ---
    const otpResult = await postForm(
        CHUKYO_SHIBBOLETH_URLS.cloudlinkLoginForm + "?",
        cookieJar,
        {
            authtype: "2",
            resend: "0",
            login_exec: "1",
            username,
            password: otp,
            AuthState: authState,
        },
        true
    );

    // OTP 失敗チェック
    if (hasLoginError(otpResult.body)) {
        throw new UnauthorizedError({ cause: new Error("OTP が正しくありません") });
    }

    // 成功: SAMLResponse フォームが返される
    if (!otpResult.body.includes("SAMLResponse")) {
        throw new AuthProcessError({ cause: new Error("OTP 認証後に SAMLResponse が返されませんでした") });
    }

    // --- Step 2: SAMLResponse を ACS に POST ---
    const samlForm = extractSamlResponseForm(otpResult.body);
    const acsParams: Record<string, string> = {
        SAMLResponse: samlForm.samlResponse,
    };
    if (samlForm.relayState) {
        acsParams["RelayState"] = samlForm.relayState;
    }

    // ACS POST → リダイレクトを追跡して /User/Menu まで到達
    await postForm(samlForm.action, cookieJar, acsParams, true);

    // --- Step 3: /User/Menu にアクセスして CSRF トークンを取得 ---
    const menuResult = await fetchWithCookies("GET", CHUKYO_SHIBBOLETH_URLS.userMenu, cookieJar, {
        followRedirects: true,
    });

    const csrfToken = extractCsrfToken(menuResult.body);

    // --- Step 4: パスキー管理メニューを選択 ---
    await postForm(CHUKYO_SHIBBOLETH_URLS.userMenuSelect, cookieJar, {
        ACEUSER_CSRFTOKEN: csrfToken,
        type: FIDO2_MENU_TYPE,
    });

    // --- Step 5: FIDO2 デバイス追加ページに遷移 ---
    await postForm(CHUKYO_SHIBBOLETH_URLS.userFido2DeviceAdd, cookieJar, {
        ACEUSER_CSRFTOKEN: csrfToken,
        procchk: "",
        username,
        // 重複パラメータ (元のリクエストに合わせる)
    });

    // --- Step 6: start-registration ---
    const regStartResult = await postJson(CHUKYO_SHIBBOLETH_URLS.userWebauthn, cookieJar, {
        method: "start-registration",
        sessioninfo: {},
        params: {
            username,
            displayName,
            browserInfo: BROWSER_INFO,
        },
    });

    if (regStartResult.json?.params?.status !== "ok") {
        throw new AuthProcessError({
            cause: new Error(
                `パスキー登録の開始に失敗しました: ${regStartResult.json?.params?.errorMessage ?? "unknown"}`
            ),
        });
    }

    const challenge: string = regStartResult.json.params.challenge;
    const userHandle: string = regStartResult.json.params.user?.id ?? "";
    const rpId: string = regStartResult.json.params.rp?.id ?? CHUKYO_SHIBBOLETH_URLS.rpId;

    // --- Step 7: 疑似パスキーを生成 ---
    const privateKey = p256.utils.randomSecretKey();
    const publicKeyUncompressed = p256.getPublicKey(privateKey, false); // 非圧縮 65 bytes
    const credentialIdBytes = crypto.getRandomValues(new Uint8Array(32));
    const credentialId = base64urlEncode(credentialIdBytes);

    // rpIdHash
    const rpIdHash = sha256(new TextEncoder().encode(rpId));

    // authData (登録用)
    const authData = buildRegistrationAuthData(rpIdHash, credentialIdBytes, publicKeyUncompressed);

    // attestationObject
    const attestationObject = buildAttestationObject(authData);

    // clientDataJSON
    const clientDataJSON = buildClientDataJSON("webauthn.create", challenge);
    const clientDataJSONBytes = new TextEncoder().encode(clientDataJSON);

    // --- Step 8: finish-registration ---
    const regFinishResult = await postJson(CHUKYO_SHIBBOLETH_URLS.userWebauthn, cookieJar, {
        method: "finish-registration",
        sessioninfo: {},
        params: {
            getClientExtensionResults: {},
            toJSON: {},
            rawId: credentialId,
            response: {
                getTransports: {},
                getAuthenticatorData: {},
                getPublicKey: {},
                getPublicKeyAlgorithm: {},
                attestationObject: base64urlEncode(attestationObject),
                clientDataJSON: base64urlEncode(clientDataJSONBytes),
            },
            authenticatorAttachment: "platform",
            id: credentialId,
            type: "public-key",
            browserInfo: BROWSER_INFO,
            authenticatorName: displayName,
        },
    });

    if (regFinishResult.json?.params?.status !== "ok") {
        throw new AuthProcessError({
            cause: new Error(
                `パスキー登録の完了に失敗しました: ${regFinishResult.json?.params?.errorMessage ?? "unknown"}`
            ),
        });
    }

    // --- Step 9: デバイス追加完了 ---
    await postForm(CHUKYO_SHIBBOLETH_URLS.userFido2DeviceAddEnd, cookieJar, {
        ACEUSER_CSRFTOKEN: csrfToken,
        username,
        errorMessage: "",
        displayName,
        procchk: "",
    });

    // --- 資格情報を返す ---
    return {
        credentialId,
        privateKeyHex: bytesToHex(privateKey),
        rpId,
        userId: username,
        userHandle,
        displayName,
    };
}

// ============================================
// メイン関数 3: パスキーでサービスにログイン
// ============================================

/**
 * 登録済みの疑似パスキーを使ってサービスにログインし、認証クッキーを取得する。
 *
 * サービスの enterUrl から Shibboleth にリダイレクトし、
 * パスキー認証 (authtype=3) でログインする。
 * 認証完了後、goalUrl ドメインのクッキー (セッション ID 等) を返す。
 *
 * @param enterUrl SAML 認証開始 URL (例: albo の `/api/saml/login`)
 * @param goalUrl 認証完了後のリダイレクト先 URL (例: `/dashboard`)
 * @param credential {@link registerPasskeyWithOtp} で取得した疑似パスキー
 * @param password ユーザーのパスワード (パスキー認証でも Shibboleth に送信が必要)
 * @returns goalUrl ドメインの認証クッキー
 * @throws AuthProcessError 認証フローが正常に進まない場合
 */
export async function authenticateWithPasskey(
    enterUrl: string,
    goalUrl: string,
    credential: PasskeyCredential,
    password: string
): Promise<ServiceCookies> {
    const cookieJar = new CookieJar();

    // --- Step 1: ログインフォームまで到達 ---
    const { authState } = await navigateToLoginForm(enterUrl, cookieJar);

    // --- Step 2: start-authentication (username 空) ---
    await postJson(CHUKYO_SHIBBOLETH_URLS.webauthn, cookieJar, {
        method: "start-authentication",
        sessioninfo: { AuthState: authState },
        params: { username: "", browserInfo: BROWSER_INFO },
    });

    // --- Step 3: checktype ---
    await postJson(CHUKYO_SHIBBOLETH_URLS.checktype, cookieJar, {
        AuthState: authState,
        params: { username: credential.userId, UserAgent: BROWSER_INFO },
    });

    // --- Step 4: start-authentication (username 指定) → チャレンジ取得 ---
    const startAuthResult = await postJson(CHUKYO_SHIBBOLETH_URLS.webauthn, cookieJar, {
        method: "start-authentication",
        sessioninfo: { AuthState: authState },
        params: { username: credential.userId, browserInfo: BROWSER_INFO },
    });

    if (startAuthResult.json?.params?.status !== "ok") {
        throw new AuthProcessError({
            cause: new Error(
                `パスキー認証の開始に失敗しました: ${startAuthResult.json?.params?.errorMessage ?? "unknown"}`
            ),
        });
    }

    const challenge: string = startAuthResult.json.params.challenge;

    // --- Step 5: 疑似パスキーで署名 ---
    const rpIdHash = sha256(new TextEncoder().encode(credential.rpId));
    const authData = buildAuthenticationAuthData(rpIdHash);

    const clientDataJSON = buildClientDataJSON("webauthn.get", challenge);
    const clientDataJSONBytes = new TextEncoder().encode(clientDataJSON);
    const clientDataHash = sha256(clientDataJSONBytes);

    // 署名対象: authData || SHA-256(clientDataJSON)
    const signedData = concatBytes(authData, clientDataHash);
    const signedDataHash = sha256(signedData);

    const privateKeyBytes = hexToBytes(credential.privateKeyHex);
    const signatureDER = p256.sign(signedDataHash, privateKeyBytes, { format: "der" });

    // --- Step 6: finish-authentication ---
    const finishResult = await postJson(CHUKYO_SHIBBOLETH_URLS.webauthn, cookieJar, {
        method: "finish-authentication",
        sessioninfo: { AuthState: authState },
        params: {
            id: credential.credentialId,
            rawId: credential.credentialId,
            type: "public-key",
            response: {
                authenticatorData: base64urlEncode(authData),
                clientDataJSON: base64urlEncode(clientDataJSONBytes),
                signature: base64urlEncode(signatureDER),
                userHandle: credential.userHandle,
            },
            getClientExtensionResults: {},
            authenticatorAttachment: "platform",
            toJSON: {},
            browserInfo: BROWSER_INFO,
        },
    });

    if (finishResult.json?.params?.status !== "ok") {
        throw new AuthProcessError({
            cause: new Error(
                `パスキー認証の完了に失敗しました: ${finishResult.json?.params?.errorMessage ?? "unknown"}`
            ),
        });
    }

    // --- Step 7: loginuserpass.php に authtype=3 で POST ---
    const loginResult = await postForm(
        CHUKYO_SHIBBOLETH_URLS.cloudlinkLoginForm,
        cookieJar,
        {
            authtype: "3",
            login_exec: "1",
            username: credential.userId,
            password,
            AuthState: authState,
            credentialid: credential.credentialId,
        },
        true
    );

    // SAMLResponse フォームチェック
    if (!loginResult.body.includes("SAMLResponse")) {
        throw new AuthProcessError({
            cause: new Error("パスキー認証後に SAMLResponse が返されませんでした"),
        });
    }

    // --- Step 8: SAMLResponse を ACS に POST ---
    const samlForm = extractSamlResponseForm(loginResult.body);
    const acsParams: Record<string, string> = {
        SAMLResponse: samlForm.samlResponse,
    };
    if (samlForm.relayState) {
        acsParams["RelayState"] = samlForm.relayState;
    }

    // ACS POST → goalUrl までリダイレクトを追跡
    await postForm(samlForm.action, cookieJar, acsParams, true);

    // goalUrl ドメインのクッキーを返す
    return cookieJar.getCookies(goalUrl);
}
