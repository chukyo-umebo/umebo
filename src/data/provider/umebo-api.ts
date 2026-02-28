import { z } from "zod";

import { UMEBO_API_URLS } from "@/common/constants/urls";
import {
    SchoolBusCalendarSchema,
    SchoolBusTimetableSchema,
    V1AssignmentsSchema,
    V1AttendanceListSchema,
    V1MessageSchema,
    V1PatchAssignmentSchema,
    V1PatchTimetableSchema,
    V1PostAssignmentsSchema,
    V1PostAttendanceSchema,
    V1TimetableSchema,
} from "@/common/types/umebo-api-schema";
import { httpClient, HttpClientOptions } from "../clients/httpClient";

class UMEBOAPIProvider {
    /**
     * UMEBO APIへの共通リクエスト処理
     * @param path - APIのパス
     * @param options - HTTPリクエストオプション（firebaseIdTokenを含む）
     * @returns レスポンスのJSONデータ
     */
    private async fetch(path: string, options: HttpClientOptions & { firebaseIdToken?: string }): Promise<unknown> {
        const { firebaseIdToken, headers, ...httpOptions } = options || {};
        const response = await httpClient(`${UMEBO_API_URLS.base}${path}`, {
            clientMode: "umeboapi",
            headers: {
                "content-type": "application/json",
                ...headers,
                ...(firebaseIdToken ? { Authorization: `Bearer ${firebaseIdToken}` } : {}),
            },
            ...httpOptions,
        });
        return await response.json();
    }

    /**
     * UMEBO APIにログインする
     * @param firebaseIdToken - Firebase IDトークン
     * @returns ログイン結果メッセージ
     */
    public async login(firebaseIdToken: string): Promise<z.infer<typeof V1MessageSchema>> {
        return V1MessageSchema.parse(
            await this.fetch("/v1/auth/login", {
                method: "POST",
                firebaseIdToken,
            })
        );
    }

    /**
     * 時間割データを取得する
     * @param firebaseIdToken - Firebase IDトークン
     * @returns 時間割データ
     */
    public async getTimetable(firebaseIdToken: string): Promise<z.infer<typeof V1TimetableSchema>> {
        return V1TimetableSchema.parse(
            await this.fetch("/v1/timetable", {
                method: "GET",
                firebaseIdToken,
            })
        );
    }

    /**
     * 時間割データを部分更新する
     * @param firebaseIdToken - Firebase IDトークン
     * @param timetableData - 更新する時間割データ
     * @returns 更新結果メッセージ
     */
    public async patchTimetable(
        firebaseIdToken: string,
        timetableData: z.infer<typeof V1PatchTimetableSchema>
    ): Promise<z.infer<typeof V1MessageSchema>> {
        return V1MessageSchema.parse(
            await this.fetch("/v1/timetable", {
                method: "PATCH",
                body: JSON.stringify(timetableData),
                firebaseIdToken,
            })
        );
    }

    /**
     * 時間割データを新規登録する
     * @param firebaseIdToken - Firebase IDトークン
     * @param timetableData - 登録する時間割データ
     * @returns 登録結果メッセージ
     */
    public async postTimetable(
        firebaseIdToken: string,
        timetableData: z.infer<typeof V1TimetableSchema>
    ): Promise<z.infer<typeof V1MessageSchema>> {
        return V1MessageSchema.parse(
            await this.fetch("/v1/timetable", {
                method: "POST",
                body: JSON.stringify(timetableData),
                firebaseIdToken,
            })
        );
    }

    /** スクールバスの時刻表データを取得する */
    public async getSchoolBusTimetable(): Promise<z.infer<typeof SchoolBusTimetableSchema>> {
        return SchoolBusTimetableSchema.parse(
            await this.fetch("/v1/document/school-bus-timetable", {
                method: "GET",
            })
        );
    }

    /** スクールバスのカレンダーデータを取得する */
    public async getSchoolBusCalendar(): Promise<z.infer<typeof SchoolBusCalendarSchema>> {
        return SchoolBusCalendarSchema.parse(
            await this.fetch("/v1/document/school-bus-calendar", {
                method: "GET",
            })
        );
    }

    /**
     * 出席データを取得する
     * @param firebaseIdToken - Firebase IDトークン
     * @param manaboId - MaNaBo授業ID
     * @returns 出席データ一覧
     */
    public async getAttendance(
        firebaseIdToken: string,
        manaboId: string
    ): Promise<z.infer<typeof V1AttendanceListSchema>> {
        return V1AttendanceListSchema.parse(
            await this.fetch(`/v1/attendance/${encodeURIComponent(manaboId)}`, {
                method: "GET",
                firebaseIdToken,
            })
        );
    }

    /**
     * 出席データを登録する
     * @param firebaseIdToken - Firebase IDトークン
     * @param manaboId - MaNaBo授業ID
     * @param attendanceData - 登録する出席データ
     * @returns 登録結果メッセージ
     */
    public async postAttendance(
        firebaseIdToken: string,
        manaboId: string,
        attendanceData: z.infer<typeof V1PostAttendanceSchema>
    ): Promise<z.infer<typeof V1MessageSchema>> {
        return V1MessageSchema.parse(
            await this.fetch(`/v1/attendance/${encodeURIComponent(manaboId)}`, {
                method: "POST",
                body: JSON.stringify(attendanceData),
                firebaseIdToken,
            })
        );
    }

    /**
     * 出席データを更新する
     * @param firebaseIdToken - Firebase IDトークン
     * @param manaboId - MaNaBo授業ID
     * @param attendanceId - 出席ID
     * @param attendanceData - 更新する出席データ
     * @returns 更新結果メッセージ
     */
    public async patchAttendance(
        firebaseIdToken: string,
        manaboId: string,
        attendanceId: string,
        attendanceData: z.infer<typeof V1PostAttendanceSchema>
    ): Promise<z.infer<typeof V1MessageSchema>> {
        return V1MessageSchema.parse(
            await this.fetch(`/v1/attendance/${encodeURIComponent(manaboId)}/${encodeURIComponent(attendanceId)}`, {
                method: "PATCH",
                body: JSON.stringify(attendanceData),
                firebaseIdToken,
            })
        );
    }

    /**
     * 出席データを削除する
     * @param firebaseIdToken - Firebase IDトークン
     * @param manaboId - MaNaBo授業ID
     * @param attendanceId - 削除対象の出席ID
     * @returns 削除結果メッセージ
     */
    public async deleteAttendance(
        firebaseIdToken: string,
        manaboId: string,
        attendanceId: string
    ): Promise<z.infer<typeof V1MessageSchema>> {
        return V1MessageSchema.parse(
            await this.fetch(`/v1/attendance/${encodeURIComponent(manaboId)}/${encodeURIComponent(attendanceId)}`, {
                method: "DELETE",
                firebaseIdToken,
            })
        );
    }

    /**
     * 課題データ一覧を取得する
     * @param firebaseIdToken - Firebase IDトークン
     * @returns 課題データ一覧
     */
    public async getAssignments(firebaseIdToken: string): Promise<z.infer<typeof V1AssignmentsSchema>> {
        return V1AssignmentsSchema.parse(
            await this.fetch(`/v1/assignment`, {
                method: "GET",
                firebaseIdToken,
            })
        );
    }

    /**
     * 課題データを登録する
     * @param firebaseIdToken - Firebase IDトークン
     * @param assignmentData - 登録する課題データ
     * @returns 登録結果メッセージ
     */
    public async postAssignment(
        firebaseIdToken: string,
        assignmentData: z.infer<typeof V1PostAssignmentsSchema>
    ): Promise<z.infer<typeof V1MessageSchema>> {
        return V1MessageSchema.parse(
            await this.fetch(`/v1/assignment`, {
                method: "POST",
                body: JSON.stringify(assignmentData),
                firebaseIdToken,
            })
        );
    }

    /**
     * 課題データを更新する
     * @param firebaseIdToken - Firebase IDトークン
     * @param assignmentId - 課題ID
     * @param assignmentData - 更新する課題データ
     * @returns 更新結果メッセージ
     */
    public async patchAssignment(
        firebaseIdToken: string,
        assignmentId: string,
        assignmentData: z.infer<typeof V1PatchAssignmentSchema>
    ): Promise<z.infer<typeof V1MessageSchema>> {
        return V1MessageSchema.parse(
            await this.fetch(`/v1/assignment/${encodeURIComponent(assignmentId)}`, {
                method: "PATCH",
                body: JSON.stringify(assignmentData),
                firebaseIdToken,
            })
        );
    }

    /**
     * 課題データを削除する
     * @param firebaseIdToken - Firebase IDトークン
     * @param assignmentId - 削除対象の課題ID
     * @returns 削除結果メッセージ
     */
    public async deleteAssignment(
        firebaseIdToken: string,
        assignmentId: string
    ): Promise<z.infer<typeof V1MessageSchema>> {
        return V1MessageSchema.parse(
            await this.fetch(`/v1/assignment/${encodeURIComponent(assignmentId)}`, {
                method: "DELETE",
                firebaseIdToken,
            })
        );
    }
}

export const umeboapiProvider = new UMEBOAPIProvider();
