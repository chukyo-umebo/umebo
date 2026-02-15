import { MANABO_URLS } from "@/constants/urls";
import { shibbolethWebViewAuthFunction } from "@/data/clients/chukyo-shibboleth";
import { httpClient, HttpClientOptions } from "@/data/clients/httpClient";
import { AbstractChukyoProvider } from "./abstractChukyoProvider";

class ManaboProvider extends AbstractChukyoProvider {
    protected readonly baseUrl = MANABO_URLS.base;
    protected readonly authEnterPath = "/auth/shibboleth/";
    protected readonly authGoalPath = "/auth/shibboleth/";
    protected readonly serviceName = "manabo";

    /**
     * Manaboサービスから認証付きでデータを取得
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
        return await response.text();
    }
}

export const manaboProvider = new ManaboProvider();
