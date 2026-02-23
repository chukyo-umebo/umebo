import {
    ManaboClassContentDTO,
    parseManaboClassContent,
    parseManaboClassDirectory,
    parseManaboClassEntry,
    parseManaboClassNews,
    parseManaboClassQuizResult,
    parseManaboClassSyllabus,
    parseManaboEntryForm,
    parseManaboEntryResponse,
    parseManaboMailMember,
    parseManaboMailSend,
    parseManaboMailView,
    parseManaboNews,
    parseManaboReceivedMail,
    parseManaboSentMail,
    parseManaboTimetable,
} from "@chukyo-umebo/web_parser";
import { ZodSafeParseResult } from "zod";

import { MANABO_URLS } from "@/common/constants/urls";
import { shibbolethWebViewAuthFunction } from "@/data/clients/chukyo-shibboleth";
import { httpClient, HttpClientOptions } from "@/data/clients/httpClient";
import { AbstractChukyoProvider } from "./abstractChukyoProvider";

class ManaboProvider extends AbstractChukyoProvider {
    protected readonly baseUrl = MANABO_URLS.base;
    protected readonly authEnterPath = "/auth/shibboleth/";
    protected readonly authGoalPath = "/auth/shibboleth/";

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

    public async getTimetable(userId: string, password: string, authFunc: shibbolethWebViewAuthFunction) {
        return parseManaboTimetable(
            await this.fetch(
                userId,
                password,
                "/",
                {
                    method: "POST",
                    body: new URLSearchParams({
                        action: "glexa_ajax_timetable_view",
                    }),
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                },
                authFunc
            )
        );
    }

    public async getNews(userId: string, password: string, authFunc: shibbolethWebViewAuthFunction) {
        return parseManaboNews(
            await this.fetch(
                userId,
                password,
                "/",
                {
                    method: "POST",
                    body: new URLSearchParams({
                        action: "glexa_ajax_news_list",
                    }),
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                },
                authFunc
            )
        );
    }

    public async getReceivedMailList(
        userId: string,
        password: string,
        authFunc: shibbolethWebViewAuthFunction,
        page: number = 1
    ) {
        return parseManaboReceivedMail(
            await this.fetch(
                userId,
                password,
                "/",
                {
                    method: "POST",
                    body: new URLSearchParams({
                        p: page.toString(),
                        action: "glexa_ajax_mail_receive_list",
                    }),
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                },
                authFunc
            )
        );
    }

    public async getSentMailList(
        userId: string,
        password: string,
        authFunc: shibbolethWebViewAuthFunction,
        page: number = 1
    ) {
        return parseManaboSentMail(
            await this.fetch(
                userId,
                password,
                "/",
                {
                    method: "POST",
                    body: new URLSearchParams({
                        p: page.toString(),
                        action: "glexa_ajax_mail_send_list",
                    }),
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                },
                authFunc
            )
        );
    }

    public async getMailDetail(
        userId: string,
        password: string,
        authFunc: shibbolethWebViewAuthFunction,
        mailId: string
    ) {
        return parseManaboMailView(
            await this.fetch(
                userId,
                password,
                `/?mail_id=${mailId}&action=glexa_modal_mail_view&_=${Date.now()}`,
                {
                    method: "GET",
                },
                authFunc
            )
        );
    }

    public async getMailSendForm(userId: string, password: string, authFunc: shibbolethWebViewAuthFunction) {
        return parseManaboMailSend(
            await this.fetch(
                userId,
                password,
                "",
                {
                    method: "POST",
                    body: new URLSearchParams({
                        action: "glexa_modal_mail_form",
                    }),
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                },
                authFunc
            )
        );
    }

    public async getMailMember(
        userId: string,
        password: string,
        authFunc: shibbolethWebViewAuthFunction,
        query: string
    ) {
        return parseManaboMailMember(
            await this.fetch(
                userId,
                password,
                "/",
                {
                    method: "POST",
                    body: new URLSearchParams({
                        q: query,
                        action: "glexa_modal_mail_ajax_member_list",
                    }),
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                },
                authFunc
            )
        );
    }

    public async getClassNews(
        userId: string,
        password: string,
        authFunc: shibbolethWebViewAuthFunction,
        classId: string,
        directoryId: string = "0"
    ) {
        return parseManaboClassNews(
            await this.fetch(
                userId,
                password,
                "/",
                {
                    method: "POST",
                    body: new URLSearchParams({
                        class_id: classId,
                        directory_id: directoryId,
                        action: "glexa_ajax_class_news_list",
                    }),
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                },
                authFunc
            )
        );
    }

    public async getClassSyllabus(
        userId: string,
        password: string,
        authFunc: shibbolethWebViewAuthFunction,
        classId: string
    ) {
        return parseManaboClassSyllabus(
            await this.fetch(
                userId,
                password,
                "/",
                {
                    method: "POST",
                    body: new URLSearchParams({
                        class_id: classId,
                        action: "glexa_ajax_class_syllabus_view",
                    }),
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                },
                authFunc
            )
        );
    }

    public async getClassEntry(
        userId: string,
        password: string,
        authFunc: shibbolethWebViewAuthFunction,
        classId: string
    ) {
        return parseManaboClassEntry(
            await this.fetch(
                userId,
                password,
                "/",
                {
                    method: "POST",
                    body: new URLSearchParams({
                        class_id: classId,
                        action: "glexa_modal_entry_view",
                    }),
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                },
                authFunc
            )
        );
    }

    public async getClassDirectory(
        userId: string,
        password: string,
        authFunc: shibbolethWebViewAuthFunction,
        classId: string,
        directoryId: string = "0"
    ) {
        const fetched = await this.fetch(
            userId,
            password,
            "/",
            {
                method: "POST",
                body: new URLSearchParams({
                    class_id: classId,
                    directory_id: directoryId,
                    action: "glexa_ajax_class_directory_list",
                }),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            },
            authFunc
        );
        return parseManaboClassDirectory(fetched);
    }

    public async getClassContent(
        userId: string,
        password: string,
        authFunc: shibbolethWebViewAuthFunction,
        classId: string,
        directoryId: string,
        viewType?: string
    ): Promise<ZodSafeParseResult<ManaboClassContentDTO>> {
        return parseManaboClassContent(
            await this.fetch(
                userId,
                password,
                "/",
                {
                    method: "POST",
                    body: new URLSearchParams({
                        class_id: classId,
                        directory_id: directoryId,
                        action: "glexa_ajax_class_content_list",
                        ...(viewType && { view_type: viewType }),
                    }),
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                },
                authFunc
            )
        );
    }

    public async getEntryExist(
        userId: string,
        password: string,
        authFunc: shibbolethWebViewAuthFunction,
        classId: string
    ) {
        return parseManaboEntryResponse(
            await this.fetch(
                userId,
                password,
                "/",
                {
                    method: "POST",
                    body: new URLSearchParams({
                        class_id: classId,
                        is_ajax: "1",
                        action: "glexa_modal_entry_form",
                    }),
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                },
                authFunc
            )
        );
    }

    public async getEntryForm(
        userId: string,
        password: string,
        authFunc: shibbolethWebViewAuthFunction,
        classId: string
    ) {
        return parseManaboEntryForm(
            await this.fetch(
                userId,
                password,
                `/?class_id=${classId}&action=glexa_modal_entry_form&_=${Date.now()}`,
                {
                    method: "GET",
                },
                authFunc
            )
        );
    }

    public async submitEntry(
        userId: string,
        password: string,
        authFunc: shibbolethWebViewAuthFunction,
        classId: string,
        directoryId: string,
        entryId: string,
        uniqueId: string
    ) {
        return parseManaboEntryResponse(
            await this.fetch(
                userId,
                password,
                `/?action=glexa_modal_entry_form_accept&class_id=${classId}&directory_id=${directoryId}&entry_id=${entryId}&uniqid=${uniqueId}&_=${Date.now()}`,
                {
                    method: "GET",
                },
                authFunc
            )
        );
    }

    public async getQuizResult(
        userId: string,
        password: string,
        authFunc: shibbolethWebViewAuthFunction,
        pluginId: string,
        classId: string,
        id: string,
        directoryId: string,
        attendId: string,
        result: string = "0",
        page: number = 0
    ) {
        return parseManaboClassQuizResult(
            await this.fetch(
                userId,
                password,
                `/?plugin_id=${pluginId}&classId=${classId}&id=${id}&directory_id=${directoryId}&attend_id=${attendId}&result=${result}&p=${page}&action=plugin_quiz_ajax_result_list&_=${Date.now()}`,
                {
                    method: "GET",
                },
                authFunc
            )
        );
    }
}

export const manaboProvider = new ManaboProvider();
