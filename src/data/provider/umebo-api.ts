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

    public async login(firebaseIdToken: string): Promise<z.infer<typeof V1MessageSchema>> {
        return V1MessageSchema.parse(
            await this.fetch("/v1/auth/login", {
                method: "POST",
                firebaseIdToken,
            })
        );
    }

    public async getTimetable(firebaseIdToken: string): Promise<z.infer<typeof V1TimetableSchema>> {
        return V1TimetableSchema.parse(
            await this.fetch("/v1/timetable", {
                method: "GET",
                firebaseIdToken,
            })
        );
    }

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

    public async getSchoolBusTimetable(): Promise<z.infer<typeof SchoolBusTimetableSchema>> {
        return SchoolBusTimetableSchema.parse(
            await this.fetch("/v1/document/school-bus-timetable", {
                method: "GET",
            })
        );
    }

    public async getSchoolBusCalendar(): Promise<z.infer<typeof SchoolBusCalendarSchema>> {
        return SchoolBusCalendarSchema.parse(
            await this.fetch("/v1/document/school-bus-calendar", {
                method: "GET",
            })
        );
    }

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

    public async getAssignments(firebaseIdToken: string): Promise<z.infer<typeof V1AssignmentsSchema>> {
        return V1AssignmentsSchema.parse(
            await this.fetch(`/v1/assignment`, {
                method: "GET",
                firebaseIdToken,
            })
        );
    }

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
