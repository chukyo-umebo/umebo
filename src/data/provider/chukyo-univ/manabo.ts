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
import { httpClient, HttpClientOptions } from "@/data/clients/httpClient";
import { AbstractChukyoProvider } from "./abstractChukyoProvider";

class ManaboProvider extends AbstractChukyoProvider {
    protected readonly baseUrl = MANABO_URLS.base;
    protected readonly authEnterPath = "/auth/shibboleth/";
    protected readonly authGoalPath = "/auth/shibboleth/";

    /**
     * Manaboサービスから認証付きでデータを取得
     * @param path - 取得対象のAPIパス(例: "/api/v1/class/12345/")
     * @param options - HTTPリクエストのオプション（ヘッダーなど）
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
     * MaNaBoから時間割データを取得する
     * @returns パース済みの時間割データ
     */
    public async getTimetable() {
        return parseManaboTimetable(
            await this.fetch("/", {
                method: "POST",
                body: new URLSearchParams({
                    action: "glexa_ajax_timetable_view",
                }),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            })
        );
    }

    /**
     * MaNaBoからお知らせ一覧を取得する
     * @returns パース済みのお知らせデータ
     */
    public async getNews() {
        return parseManaboNews(
            await this.fetch("/", {
                method: "POST",
                body: new URLSearchParams({
                    action: "glexa_ajax_news_list",
                }),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            })
        );
    }

    /**
     * MaNaBoから受信メール一覧を取得する
     * @param page - ページ番号（デフォルト: 1）
     * @returns パース済みの受信メール一覧
     */
    public async getReceivedMailList(page: number = 1) {
        return parseManaboReceivedMail(
            await this.fetch("/", {
                method: "POST",
                body: new URLSearchParams({
                    p: page.toString(),
                    action: "glexa_ajax_mail_receive_list",
                }),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            })
        );
    }

    /**
     * MaNaBoから送信メール一覧を取得する
     * @param page - ページ番号（デフォルト: 1）
     * @returns パース済みの送信メール一覧
     */
    public async getSentMailList(page: number = 1) {
        return parseManaboSentMail(
            await this.fetch("/", {
                method: "POST",
                body: new URLSearchParams({
                    p: page.toString(),
                    action: "glexa_ajax_mail_send_list",
                }),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            })
        );
    }

    /**
     * MaNaBoからメールの詳細を取得する
     * @param mailId - メールID
     * @returns パース済みのメール詳細データ
     */
    public async getMailDetail(mailId: string) {
        return parseManaboMailView(
            await this.fetch(`/?mail_id=${mailId}&action=glexa_modal_mail_view&_=${Date.now()}`, {
                method: "GET",
            })
        );
    }

    /**
     * MaNaBoのメール送信フォーム情報を取得する
     * @returns パース済みのメール送信フォームデータ
     */
    public async getMailSendForm() {
        return parseManaboMailSend(
            await this.fetch("", {
                method: "POST",
                body: new URLSearchParams({
                    action: "glexa_modal_mail_form",
                }),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            })
        );
    }

    /**
     * MaNaBoからメール送信先メンバーを検索する
     * @param query - 検索クエリ
     * @returns パース済みのメンバー一覧
     */
    public async getMailMember(query: string) {
        return parseManaboMailMember(
            await this.fetch("/", {
                method: "POST",
                body: new URLSearchParams({
                    q: query,
                    action: "glexa_modal_mail_ajax_member_list",
                }),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            })
        );
    }

    /**
     * MaNaBoから授業のお知らせを取得する
     * @param classId - 授業ID
     * @param directoryId - ディレクトリID（デフォルト: "0"）
     * @returns パース済みの授業お知らせデータ
     */
    public async getClassNews(classId: string, directoryId: string = "0") {
        return parseManaboClassNews(
            await this.fetch("/", {
                method: "POST",
                body: new URLSearchParams({
                    class_id: classId,
                    directory_id: directoryId,
                    action: "glexa_ajax_class_news_list",
                }),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            })
        );
    }

    /**
     * MaNaBoから授業のシラバスを取得する
     * @param classId - 授業ID
     * @returns パース済みのシラバスデータ
     */
    public async getClassSyllabus(classId: string) {
        return parseManaboClassSyllabus(
            await this.fetch("/", {
                method: "POST",
                body: new URLSearchParams({
                    class_id: classId,
                    action: "glexa_ajax_class_syllabus_view",
                }),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            })
        );
    }

    /**
     * MaNaBoから授業の出席情報を取得する
     * @param classId - 授業ID
     * @returns パース済みの出席情報データ
     */
    public async getClassEntry(classId: string) {
        return parseManaboClassEntry(
            await this.fetch("/", {
                method: "POST",
                body: new URLSearchParams({
                    class_id: classId,
                    action: "glexa_modal_entry_view",
                }),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            })
        );
    }

    /**
     * MaNaBoから授業のディレクトリ一覧を取得する
     * @param classId - 授業ID
     * @param directoryId - 親ディレクトリID（デフォルト: "0"）
     * @returns パース済みのディレクトリ一覧
     */
    public async getClassDirectory(classId: string, directoryId: string = "0") {
        const fetched = await this.fetch("/", {
            method: "POST",
            body: new URLSearchParams({
                class_id: classId,
                directory_id: directoryId,
                action: "glexa_ajax_class_directory_list",
            }),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        return parseManaboClassDirectory(fetched);
    }

    /**
     * MaNaBoから授業のコンテンツ一覧を取得する
     * @param classId - 授業ID
     * @param directoryId - ディレクトリID
     * @param viewType - 表示タイプ（省略可）
     * @returns パース済みのコンテンツ一覧
     */
    public async getClassContent(
        classId: string,
        directoryId: string,
        viewType?: string
    ): Promise<ZodSafeParseResult<ManaboClassContentDTO>> {
        return parseManaboClassContent(
            await this.fetch("/", {
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
            })
        );
    }

    /**
     * MaNaBoで出席登録が存在するか確認する
     * @param classId - 授業ID
     * @returns 出席登録の確認結果
     */
    public async getEntryExist(classId: string) {
        return parseManaboEntryResponse(
            await this.fetch("/", {
                method: "POST",
                body: new URLSearchParams({
                    class_id: classId,
                    is_ajax: "1",
                    action: "glexa_modal_entry_form",
                }),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            })
        );
    }

    /**
     * MaNaBoの出席登録フォームを取得する
     * @param classId - 授業ID
     * @returns パース済みの出席登録フォームデータ
     */
    public async getEntryForm(classId: string) {
        return parseManaboEntryForm(
            await this.fetch(`/?class_id=${classId}&action=glexa_modal_entry_form&_=${Date.now()}`, {
                method: "GET",
            })
        );
    }

    /**
     * MaNaBoで出席を登録する
     * @param classId - 授業ID
     * @param directoryId - ディレクトリID
     * @param entryId - 出席登録ID
     * @param uniqueId - ユニークID
     * @returns 出席登録の結果
     */
    public async submitEntry(classId: string, directoryId: string, entryId: string, uniqueId: string) {
        return parseManaboEntryResponse(
            await this.fetch(
                `/?action=glexa_modal_entry_form_accept&class_id=${classId}&directory_id=${directoryId}&entry_id=${entryId}&uniqid=${uniqueId}&_=${Date.now()}`,
                {
                    method: "GET",
                }
            )
        );
    }

    /**
     * MaNaBoからクイズの結果を取得する
     * @param pluginId - プラグインID
     * @param classId - 授業ID
     * @param id - クイズID
     * @param directoryId - ディレクトリID
     * @param attendId - 出席ID
     * @param result - 結果フィルタ（デフォルト: "0"）
     * @param page - ページ番号（デフォルト: 0）
     * @returns パース済みのクイズ結果データ
     */
    public async getQuizResult(
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
                `/?plugin_id=${pluginId}&classId=${classId}&id=${id}&directory_id=${directoryId}&attend_id=${attendId}&result=${result}&p=${page}&action=plugin_quiz_ajax_result_list&_=${Date.now()}`,
                {
                    method: "GET",
                }
            )
        );
    }
}

export const manaboProvider = new ManaboProvider();
