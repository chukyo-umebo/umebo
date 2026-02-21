import { z } from "zod";

/* ----- 一般 ----- */
export const V1MessageSchema = z.object({
    message: z.string(),
});

/* ----- 時間割関連 ----- */

export const V1TimetableSchema = z.object({
    term: z.string(),
    classes: z.array(
        z.object({
            name: z.string(),
            manaboId: z.string(),
            alboId: z.string().optional(),
            cubicsId: z.string().optional(),
            timetable: z.array(z.string()),
            appData: z.any().optional(),
        })
    ),
});

export const V1PatchTimetableSchema = z.object({
    term: z.string(),
    manaboId: z.string(),
    appData: z.any(),
});

/* ----- 出席関連 ----- */

export const V1PostAttendanceSchema = z.object({
    appData: z.any(),
});

export const V1AttendanceListSchema = z.object({
    manaboId: z.string(),
    attendances: z.array(
        z.object({
            id: z.string(),
            appData: z.any(),
        })
    ),
});

/* ----- 課題関連 ----- */

export const V1ClassAssignmentDetailSchema = z.object({
    directory_id: z.string(),
    content_id: z.string(),
    name: z.string(),
});

export const V1PostAssignmentSchema = z.object({
    due_at: z.string(),
    done_at: z.string(),
    classAssignmentDetail: V1ClassAssignmentDetailSchema.optional(),
    app_data: z.any(),
});

export const V1PatchAssignmentSchema = z.object({
    due_at: z.string(),
    done_at: z.string(),
    app_data: z.any(),
});

export const V1AssignmentListSchema = z.object({
    manabo_id: z.string(),
    assignments: z.array(
        z.object({
            id: z.string(),
            due_at: z.string().nullable(),
            done_at: z.string().nullable(),
            app_data: z.any(),
            class_assignment: z
                .object({
                    id: z.string(),
                    directory_id: z.string(),
                    content_id: z.string(),
                    name: z.string(),
                    due_at: z.string().nullable(),
                })
                .nullable(),
        })
    ),
});

/* ----- ドキュメント関連 ----- */

const ScheduleSchema = z.object({
    minute: z.number(),
    via: z.string().optional(),
});

const HourScheduleSchema = z.object({
    hour: z.number(),
    schedules: z.array(ScheduleSchema),
});

const DiagramSchema = z.object({
    diagram: z.string(),
    forward: z.array(HourScheduleSchema),
    reverse: z.array(HourScheduleSchema),
});

export const SchoolBusTimetableSchema = z.object({
    timetable: z.array(DiagramSchema),
});

const DaySchema = z.object({
    day: z.number(),
    diagram: z.string(),
});

const MonthSchema = z.object({
    month: z.number(),
    days: z.array(DaySchema),
});

const YearSchema = z.object({
    year: z.number(),
    months: z.array(MonthSchema),
});

export const SchoolBusCalendarSchema = z.object({
    calendar: z.array(YearSchema),
});
