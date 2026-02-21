import {
    parseAlboCalendar,
    parseAlboInformation,
    parseAlboPersonal,
    parseAlboTimetable,
} from "@chukyo-umebo/web_parser";

import { ALBO_URLS } from "@/common/constants/urls";
import { shibbolethWebViewAuthFunction } from "@/data/clients/chukyo-shibboleth";
import { httpClient, HttpClientOptions } from "@/data/clients/httpClient";
import { AbstractChukyoProvider } from "./abstractChukyoProvider";

class AlboProvider extends AbstractChukyoProvider {
    protected readonly baseUrl = ALBO_URLS.base;
    protected readonly authEnterPath = "/api/saml/login";
    protected readonly authGoalPath = "/dashboard";

    /**
     * Alboサービスから認証付きでデータを取得
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

    public async getCalendar(userId: string, password: string, authFunc: shibbolethWebViewAuthFunction) {
        return parseAlboCalendar(
            await this.fetch(
                userId,
                password,
                "/api/calendar/?page_size=1000&calendar_source_uuid=ac304d66-b0a8-11f0-afed-06347f3ce845",
                {
                    method: "GET",
                },
                authFunc
            )
        );
    }

    public async getPersonal(userId: string, password: string, authFunc: shibbolethWebViewAuthFunction) {
        return parseAlboPersonal(
            await this.fetch(
                userId,
                password,
                "/api/auth/check-logged-in",
                {
                    method: "GET",
                },
                authFunc
            )
        );
    }

    public async getInformation(userId: string, password: string, authFunc: shibbolethWebViewAuthFunction) {
        return parseAlboInformation(
            await this.fetch(
                userId,
                password,
                "/api/information/1?page_size=20&category_uuid=",
                // "/api/information/1?status=unread&page_size=10&category_uuid=&recursive=1",
                {
                    method: "GET",
                },
                authFunc
            )
        );
    }

    public async getTimetable(userId: string, password: string, authFunc: shibbolethWebViewAuthFunction) {
        return parseAlboTimetable(
            await this.fetch(
                userId,
                password,
                "/api/class/time-table/",
                {
                    method: "GET",
                },
                authFunc
            )
        );
    }
}

export const alboProvider = new AlboProvider();
