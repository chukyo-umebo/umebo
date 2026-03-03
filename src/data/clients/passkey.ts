/**
 * WebAuthn 疑似Passkey生成・アサーションモジュール
 *
 * ES256 (P-256/ECDSA with SHA-256) を使用して鍵ペアの生成と署名を行う。
 * Expo Crypto と @noble/curves のみを使用し、Node.js crypto は使わない。
 */

import * as Crypto from "expo-crypto";
import { p256 } from "@noble/curves/nist.js";

import { CHUKYO_SHIBBOLETH_URLS } from "@/common/constants/urls";

// ============================================
// 型定義
// ============================================

/** SecureStoreに保存すべき疑似Passkey認証情報 */
export interface PasskeyCredential {
    /** Credential ID (base64url) */
    credentialId: string;
    /** 秘密鍵 (hex文字列) */
    privateKeyHex: string;
    /** 署名カウンター */
    signCount: number;
    /** サーバーから付与された User Handle (base64url) */
    userHandle: string;
}

// ============================================
// Base64url ユーティリティ
// ============================================

/** Uint8Array → base64url文字列 */
export function toBase64url(data: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < data.length; i++) {
        binary += String.fromCharCode(data[i]!);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** base64url文字列 → Uint8Array */
export function fromBase64url(str: string): Uint8Array {
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

// ============================================
// 最小 CBOR エンコーダー
// WebAuthn attestationObject と COSE Key に必要な型のみ対応
// ============================================

type CborValue = number | string | Uint8Array | Map<CborValue, CborValue>;

/** CBOR major type + additional info のヘッダーをエンコード */
function cborHeader(majorType: number, value: number): Uint8Array {
    const mt = majorType << 5;
    if (value < 24) return new Uint8Array([mt | value]);
    if (value < 0x100) return new Uint8Array([mt | 24, value]);
    if (value < 0x10000) return new Uint8Array([mt | 25, (value >> 8) & 0xff, value & 0xff]);
    throw new Error("CBOR: value too large");
}

/** 任意の CborValue を CBOR バイト列にエンコード */
function cborEncode(value: CborValue): Uint8Array {
    if (typeof value === "number") {
        // 正の整数: major type 0, 負の整数: major type 1 (-1-n)
        return value >= 0 ? cborHeader(0, value) : cborHeader(1, -1 - value);
    }
    if (typeof value === "string") {
        const bytes = new TextEncoder().encode(value);
        return concatBytes(cborHeader(3, bytes.length), bytes);
    }
    if (value instanceof Uint8Array) {
        return concatBytes(cborHeader(2, value.length), value);
    }
    if (value instanceof Map) {
        const parts: Uint8Array[] = [cborHeader(5, value.size)];
        for (const [k, v] of value) {
            parts.push(cborEncode(k));
            parts.push(cborEncode(v));
        }
        return concatAllBytes(parts);
    }
    throw new Error(`CBOR: unsupported type ${typeof value}`);
}

// ============================================
// バイト操作ユーティリティ
// ============================================

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
    const result = new Uint8Array(a.length + b.length);
    result.set(a);
    result.set(b, a.length);
    return result;
}

function concatAllBytes(arrays: Uint8Array[]): Uint8Array {
    const len = arrays.reduce((sum, a) => sum + a.length, 0);
    const result = new Uint8Array(len);
    let offset = 0;
    for (const a of arrays) {
        result.set(a, offset);
        offset += a.length;
    }
    return result;
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

/**
 * ECDSA compact 署名 (r||s, 64 bytes) を DER エンコードに変換する。
 * WebAuthn は DER 形式の署名を要求する。
 */
function compactSignatureToDER(compact: Uint8Array): Uint8Array {
    const r = compact.slice(0, 32);
    const s = compact.slice(32, 64);

    function encodeInteger(bytes: Uint8Array): Uint8Array {
        // 先頭のゼロを除去
        let start = 0;
        while (start < bytes.length - 1 && bytes[start] === 0) start++;
        let trimmed = bytes.slice(start);
        // 最上位ビットが立っている場合、正の整数を示すためにゼロバイトを前置
        if (trimmed[0]! & 0x80) {
            const padded = new Uint8Array(trimmed.length + 1);
            padded.set(trimmed, 1);
            trimmed = padded;
        }
        // 0x02 [length] [value]
        const result = new Uint8Array(2 + trimmed.length);
        result[0] = 0x02;
        result[1] = trimmed.length;
        result.set(trimmed, 2);
        return result;
    }

    const rDer = encodeInteger(r);
    const sDer = encodeInteger(s);

    // 0x30 [total_length] [r_integer] [s_integer]
    const der = new Uint8Array(2 + rDer.length + sDer.length);
    der[0] = 0x30;
    der[1] = rDer.length + sDer.length;
    der.set(rDer, 2);
    der.set(sDer, 2 + rDer.length);
    return der;
}

// ============================================
// 暗号ヘルパー
// ============================================

/** SHA-256 ハッシュを計算 */
async function sha256(data: Uint8Array): Promise<Uint8Array> {
    const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data.buffer as ArrayBuffer);
    return new Uint8Array(digest);
}

// ============================================
// 定数
// ============================================

const BROWSER_INFO =
    "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.0.0 Mobile Safari/537.36";

// ============================================
// 登録 (Registration)
// ============================================

/**
 * WebAuthn finish-registration 用のレスポンスを構築する。
 * 新しい ES256 鍵ペアを生成し、attestation "none" の擬似Passkey を作成する。
 *
 * @param challenge - start-registration レスポンスの challenge (base64url)
 * @param userIdB64 - start-registration レスポンスの user.id (base64url)
 * @param displayName - 認証器の表示名
 * @returns 保存用の PasskeyCredential と finish-registration リクエストボディ
 */
export async function buildRegistrationResponse(
    challenge: string,
    userIdB64: string,
    displayName: string
): Promise<{
    credential: PasskeyCredential;
    finishRegistrationBody: object;
}> {
    // ES256 鍵ペア生成
    const privateKey = p256.utils.randomSecretKey();
    const publicKeyUncompressed = p256.getPublicKey(privateKey, false); // 65 bytes: 04 || x(32) || y(32)
    const publicKeyX = publicKeyUncompressed.slice(1, 33);
    const publicKeyY = publicKeyUncompressed.slice(33, 65);

    // ランダムな Credential ID (32 bytes)
    const credentialIdBytes = Crypto.getRandomBytes(32);
    const credentialIdB64 = toBase64url(credentialIdBytes);

    // ─── AuthenticatorData 構築 (attested credential data 付き) ───
    const rpIdHash = await sha256(new TextEncoder().encode(CHUKYO_SHIBBOLETH_URLS.rpId));

    // flags: bit0=UP(1), bit2=UV(1), bit6=AT(1) → 0x45
    const flags = 0x45;

    // COSE Key (EC2, P-256, ES256)
    const coseKey = new Map<CborValue, CborValue>([
        [1, 2], // kty: EC2
        [3, -7], // alg: ES256
        [-1, 1], // crv: P-256
        [-2, publicKeyX],
        [-3, publicKeyY],
    ]);
    const coseKeyBytes = cborEncode(coseKey);

    // credentialIdLength (2 bytes, big-endian)
    const credIdLenBytes = new Uint8Array([(credentialIdBytes.length >> 8) & 0xff, credentialIdBytes.length & 0xff]);

    const authData = concatAllBytes([
        rpIdHash, // 32 bytes: RP ID の SHA-256
        new Uint8Array([flags]), // 1 byte: フラグ
        new Uint8Array([0, 0, 0, 0]), // 4 bytes: signCount = 0
        new Uint8Array(16), // 16 bytes: AAGUID (ゼロ埋め)
        credIdLenBytes, // 2 bytes: credential ID 長
        credentialIdBytes, // 32 bytes: credential ID
        coseKeyBytes, // 可変長: COSE 公開鍵
    ]);

    // ─── AttestationObject 構築 (fmt: "none") ───
    const attestationObject = cborEncode(
        new Map<CborValue, CborValue>([
            ["fmt", "none"],
            ["attStmt", new Map<CborValue, CborValue>()],
            ["authData", authData],
        ])
    );

    // ─── ClientDataJSON 構築 ───
    const clientDataJSON = JSON.stringify({
        type: "webauthn.create",
        challenge: challenge,
        origin: CHUKYO_SHIBBOLETH_URLS.origin,
        crossOrigin: false,
    });
    const clientDataJSONBytes = new TextEncoder().encode(clientDataJSON);

    // ─── 返却データ ───
    const credential: PasskeyCredential = {
        credentialId: credentialIdB64,
        privateKeyHex: bytesToHex(privateKey),
        signCount: 0,
        userHandle: userIdB64,
    };

    const finishRegistrationBody = {
        method: "finish-registration",
        sessioninfo: {},
        params: {
            getClientExtensionResults: {},
            toJSON: {},
            rawId: credentialIdB64,
            response: {
                getTransports: {},
                getAuthenticatorData: {},
                getPublicKey: {},
                getPublicKeyAlgorithm: {},
                attestationObject: toBase64url(attestationObject),
                clientDataJSON: toBase64url(clientDataJSONBytes),
            },
            authenticatorAttachment: "platform",
            id: credentialIdB64,
            type: "public-key",
            browserInfo: BROWSER_INFO,
            authenticatorName: displayName,
        },
    };

    return { credential, finishRegistrationBody };
}

// ============================================
// 認証 (Assertion / Authentication)
// ============================================

/**
 * WebAuthn finish-authentication 用のアサーションレスポンスを構築する。
 * 保存された秘密鍵でチャレンジに署名する。
 *
 * @param challenge - start-authentication レスポンスの challenge (base64url)
 * @param credential - 保存済みの PasskeyCredential
 * @param authState - Shibboleth AuthState 文字列
 * @returns finish-authentication リクエストボディと更新後の signCount
 */
export async function buildAssertionResponse(
    challenge: string,
    credential: PasskeyCredential,
    authState: string
): Promise<{
    finishAuthenticationBody: object;
    updatedSignCount: number;
}> {
    const newSignCount = credential.signCount + 1;

    // ─── AuthenticatorData 構築 (attested credential data なし) ───
    const rpIdHash = await sha256(new TextEncoder().encode(CHUKYO_SHIBBOLETH_URLS.rpId));

    // flags: bit0=UP(1), bit2=UV(1), bit3=BE(1), bit4=BS(1) → 0x1d
    const flags = 0x1d;

    const signCountBytes = new Uint8Array([
        (newSignCount >> 24) & 0xff,
        (newSignCount >> 16) & 0xff,
        (newSignCount >> 8) & 0xff,
        newSignCount & 0xff,
    ]);

    const authData = concatAllBytes([
        rpIdHash, // 32 bytes
        new Uint8Array([flags]), // 1 byte
        signCountBytes, // 4 bytes
    ]);

    // ─── ClientDataJSON 構築 ───
    const clientDataJSON = JSON.stringify({
        type: "webauthn.get",
        challenge: challenge,
        origin: CHUKYO_SHIBBOLETH_URLS.origin,
        crossOrigin: false,
    });
    const clientDataJSONBytes = new TextEncoder().encode(clientDataJSON);

    // ─── 署名 ───
    // WebAuthn: signature = ECDSA_SHA256(authenticatorData || SHA-256(clientDataJSON))
    const clientDataHash = await sha256(clientDataJSONBytes);
    const signedData = concatBytes(authData, clientDataHash);

    // @noble/curves の p256.sign() は msgHash (事前ハッシュ済み) を期待する
    // prehash: true を指定すると内部で SHA-256 してくれる
    const privateKeyBytes = hexToBytes(credential.privateKeyHex);
    const signatureCompact = p256.sign(signedData, privateKeyBytes, { prehash: true });
    const signatureDER = compactSignatureToDER(signatureCompact);

    // ─── リクエストボディ ───
    const finishAuthenticationBody = {
        method: "finish-authentication",
        sessioninfo: { AuthState: authState },
        params: {
            id: credential.credentialId,
            rawId: credential.credentialId,
            type: "public-key",
            response: {
                authenticatorData: toBase64url(authData),
                clientDataJSON: toBase64url(clientDataJSONBytes),
                signature: toBase64url(signatureDER),
                userHandle: credential.userHandle,
            },
            getClientExtensionResults: {},
            authenticatorAttachment: "platform",
            toJSON: {},
            browserInfo: BROWSER_INFO,
        },
    };

    return { finishAuthenticationBody, updatedSignCount: newSignCount };
}
