import {
    parseAlboCalendar,
    parseAlboInformation,
    parseAlboPersonal,
    parseAlboTimetable,
} from "@chukyo-umebo/web_parser";

import { ALBO_URLS } from "@/common/constants/urls";
import { httpClient, HttpClientOptions } from "@/data/clients/httpClient";
import { AbstractChukyoProvider } from "./abstractChukyoProvider";

class AlboProvider extends AbstractChukyoProvider {
    protected readonly baseUrl = ALBO_URLS.base;
    protected readonly authEnterPath = "/api/saml/login";
    protected readonly authGoalPath = "/dashboard";

    /**
     * Alboサービスから認証付きでデータを取得
     * @param path - 取得対象のAPIパス(例: "/api/v1/class/12345/")
     * @param options - HTTPリクエストのオプション（ヘッダーなど）
     * @param authFunc - Shibboleth認証を行うコールバック関数
     * @returns レスポンスのテキストデータ
     */
    private async fetch(path: string, options: HttpClientOptions): Promise<string> {
        const { headers: headerOptions, ...othersOptions } = options;
        const response = await httpClient(`${this.baseUrl}${path}`, {
            clientMode: "portal",
            credentials: "omit",
            headers: {
                cookie: await this.getAuthedCookie(),
                "Accept-Language": "ja",
                ...headerOptions,
            },
            ...othersOptions,
        });

        return await response.text();
    }

    /**
     * Alboから学年暦カレンダーデータを取得する
     * @param authFunc - Shibboleth認証関数
     * @returns パース済みのカレンダーデータ
     */
    public async getCalendar() {
        return parseAlboCalendar(
            await this.fetch(
                "/api/calendar/?page_size=1000&calendar_source_uuid=ac304d66-b0a8-11f0-afed-06347f3ce845",
                {
                    method: "GET",
                }
            )
        );
    }

    /**
     * Alboからユーザーの個人情報を取得する
     * @param authFunc - Shibboleth認証関数
     * @returns パース済みの個人情報データ
     */
    public async getPersonal() {
        return parseAlboPersonal(
            await this.fetch("/api/auth/check-logged-in", {
                method: "GET",
            })
        );
    }

    /**
     * Alboからお知らせ一覧を取得する
     * @param authFunc - Shibboleth認証関数
     * @returns パース済みのお知らせデータ
     */
    public async getInformation() {
        return parseAlboInformation(
            await this.fetch(
                "/api/information/1?page_size=20&category_uuid=",
                // "/api/information/1?status=unread&page_size=10&category_uuid=&recursive=1",
                {
                    method: "GET",
                }
            )
        );
    }

    /**
     * Alboから時間割データを取得する
     * @param authFunc - Shibboleth認証関数
     * @returns パース済みの時間割データ
     */
    public async getTimetable() {
        return parseAlboTimetable(
            await this.fetch("/api/class/time-table/", {
                method: "GET",
            })
        );
    }
}

export const alboProvider = new AlboProvider();
