import { parseCubicsAsTimetable } from "@chukyo-umebo/web_parser";

import { CUBICS_URLS } from "@/common/constants/urls";
import { ExpiredSessionError } from "@/common/errors/auth";
import { shibbolethWebViewAuthFunction } from "@/data/clients/chukyo-shibboleth";
import { httpClient, HttpClientOptions } from "@/data/clients/httpClient";
import { AbstractChukyoProvider } from "./abstractChukyoProvider";

class CubicsProvider extends AbstractChukyoProvider {
    protected readonly baseUrl = CUBICS_URLS.base;
    protected readonly authEnterPath = "/unias/UnSSOLoginControl2";
    protected readonly authGoalPath = "/unias/UnSSOLoginControl2";

    protected readonly retryAuthCount = 3;
    protected readonly retryAuthDelayMs = 200;
    protected readonly retryAuthDelayRandomMs = 300;

    /**
     * Cubicsサービスから認証付きでデータを取得
     * @param userId - 中京大学の学籍番号
     * @param password - ユーザーのパスワード
     * @param path - 取得対象のAPIパス(例: "/api/v1/class/12345/")
     * @param options - HTTPリクエストのオプション（ヘッダーなど）
     * @param authFunc - Shibboleth認証を行うコールバック関数
     * @returns レスポンスのテキストデータ
     */
    private async fetch(
        userId: string,
        password: string,
        path: string,
        options: HttpClientOptions,
        authFunc: shibbolethWebViewAuthFunction
    ): Promise<string> {
        const { headers: headerOptions, ...othersOptions } = options;

        for (let attempt = 0; attempt <= this.retryAuthCount; attempt++) {
            const response = await httpClient(`${this.baseUrl}${path}`, {
                clientMode: "portal",
                credentials: "omit",
                headers: {
                    cookie: await this.getAuthedCookie(userId, password, authFunc),
                    "Accept-Language": "ja",
                    ...headerOptions,
                },
                ...othersOptions,
            });

            const responseText = await response.text();
            if (this.isSessionValid(response, responseText)) {
                return responseText;
            }

            // セッションが無効なら再認証を試みる
            console.warn(`Cubics session expired. Attempting re-fetch (${attempt + 1}/${this.retryAuthCount})`);
            await this.waitForRetryDelay();
        }
        throw new ExpiredSessionError();
    }

    /**
     * 再認証試行間にランダムな遅延を挿入します。
     * @returns 遅延完了時に解決するPromise
     */
    private async waitForRetryDelay(): Promise<void> {
        const baseDelay = this.retryAuthDelayMs;
        const randomDelay = Math.floor(Math.random() * this.retryAuthDelayRandomMs);
        const totalDelay = baseDelay + randomDelay;
        return new Promise((resolve) => setTimeout(resolve, totalDelay));
    }

    /**
     * レスポンスからセッションが有効かどうかを判定します。
     * @param res HTTPレスポンスオブジェクト
     * @param responseText 判定対象のHTML文字列
     * @returns セッションが有効ならtrue
     */
    private isSessionValid(res: Response, responseText: string): boolean {
        const invalidTitles = ["<title>Missing cookie</title>", "<title>クッキーが見つかりません</title>"];
        // リダイレクト先のURLがベースURLと異なる場合、セッションが無効と判断
        if (!res.url.startsWith(this.baseUrl)) {
            return false;
        }
        // セッションが無効な場合に返されるタイトルをチェック
        for (const title of invalidTitles) {
            if (responseText.includes(title)) {
                return false;
            }
        }
        return true;
    }

    /**
     * CUBICSから時間割データを取得する
     * @param userId - 学籍番号
     * @param password - パスワード
     * @param authFunc - Shibboleth認証関数
     * @returns パース済みの時間割データ
     */
    public async getTimetable(userId: string, password: string, authFunc: shibbolethWebViewAuthFunction) {
        return parseCubicsAsTimetable(
            await this.fetch(
                userId,
                password,
                "/unias/UnSSOLoginControl2?REQ_ACTION_DO=/ARF010.do&REQ_PRFR_MNU_ID=MNUIDSTD0103",
                {
                    method: "GET",
                },
                authFunc
            )
        );
    }
}

export const cubicsProvider = new CubicsProvider();
