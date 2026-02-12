import { Platform } from "react-native";
import * as Application from "expo-application";
import { fetch } from "expo/fetch";

import { ChukyoMaintenanceError, NetworkError, TimeoutError, UMEBOAPIMaintenanceError } from "@/errors/network";

const DEFAULT_TIMEOUT_MS = 10000;

type HttpClientMode = "default" | "portal" | "umeboapi";

type HttpClientOptions = RequestInit & {
    timeoutMs?: number;
    clientMode?: HttpClientMode;
};

/**
 * User-Agent用の文字列を組み立てます。
 * @returns `アプリ名/バージョン (OS)`形式のUser-Agent文字列
 */
const buildUserAgent = (): string => {
    const appName = Application.applicationName ?? "UMEBO";
    const appVersion = Application.nativeApplicationVersion ?? "unknown";
    const os = Platform.OS ?? "unknown";

    return `${appName}/${appVersion} (${os})`;
};

const userAgent = buildUserAgent();

/**
 * エラーがAbortErrorであるかを判定するユーティリティ関数
 * @param error 判定対象のエラー
 * @returns AbortErrorならtrue、それ以外はfalse
 */
const isAbortError = (error: unknown): boolean => {
    if (!error) {
        return false;
    }

    if (error instanceof Error) {
        return error.name === "AbortError";
    }

    return false;
};

/**
 * 共通のHTTPクライアントとしてfetchを呼び出し、タイムアウトやエラーハンドリングを統一します。
 * @param input リクエストURLまたはURLオブジェクト
 * @param options リクエストオプションとPassPal固有の設定 clientModeの設定によって個別のエラー処理などを行う。
 * @returns 成功したHTTPレスポンス
 * @throws MaintenanceError|NetworkError|TimeoutError
 */
export const httpClient = async (input: string | URL, options: HttpClientOptions = {}): Promise<Response> => {
    // __DEV__ && console.log(`HTTP Request: ${input}, Options: ${JSON.stringify(options)}`);
    const {
        timeoutMs: timeoutOverride = DEFAULT_TIMEOUT_MS,
        clientMode,
        mode,
        headers,
        signal,
        ...requestInit
    } = options;

    const timeoutMs = timeoutOverride ?? DEFAULT_TIMEOUT_MS;
    const httpClientMode: HttpClientMode = clientMode ?? "default";

    const controller = new AbortController();
    let timedOut = false;

    const timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, timeoutMs);

    /**
     * 親シグナルの中断通知をリレーするためのコールバック
     */
    const abortCallback = () => controller.abort();
    if (signal) {
        if (signal.aborted) {
            controller.abort();
        } else {
            signal.addEventListener("abort", abortCallback);
        }
    }

    const finalHeaders = new Headers(headers);
    finalHeaders.set("User-Agent", userAgent);

    try {
        const url = typeof input === "string" ? input : input.toString();
        const { body, ...restInit } = requestInit as typeof requestInit & {
            body?: BodyInit | null;
        };

        const response = await fetch(url, {
            ...restInit,
            ...(body != null ? { body } : {}),
            headers: finalHeaders,
            signal: controller.signal,
            mode,
        });

        if (!response.ok) {
            if (httpClientMode === "portal" && response.status === 503) {
                throw new ChukyoMaintenanceError();
            }

            if (httpClientMode === "umeboapi" && response.status === 503) {
                throw new UMEBOAPIMaintenanceError();
            }

            if (__DEV__) console.error(`HTTP error: ${response.status} ${response.statusText} URL: ${url}`);

            throw new NetworkError({
                cause: new Error(`HTTP error: ${response.status} ${response.statusText}`),
            });
        }

        return response;
    } catch (error) {
        if (
            error instanceof ChukyoMaintenanceError ||
            error instanceof NetworkError ||
            error instanceof TimeoutError ||
            error instanceof UMEBOAPIMaintenanceError
        ) {
            throw error;
        }

        if (isAbortError(error) && timedOut) {
            throw new TimeoutError({ cause: error });
        }

        throw new NetworkError({ cause: error });
    } finally {
        clearTimeout(timeoutId);
        if (signal) {
            signal.removeEventListener("abort", abortCallback);
        }
    }
};

export type { HttpClientMode, HttpClientOptions };
