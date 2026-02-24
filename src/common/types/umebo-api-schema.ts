import { z } from "zod";

/* ----- 一般 ----- */
export const V1MessageSchema = z.object({
    message: z.string(),
});

/* ----- 時間割関連 ----- */

export const V1TimetableAppDataSchema = z.object({
    color: z.string(),
    teacher: z.string().optional(),
    room: z.string().optional(),
    campus: z.string().optional(),
    material: z.array(
        z.object({
            name: z.string(),
        })
    ),
    alboId: z.string().optional(),
    alboUUID: z.string().optional(),
    cubicsDetailUrl: z.string().optional(),
});

export const V1TimetableSchema = z.object({
    term: z.string(),
    classes: z.array(
        z.object({
            name: z.string(),
            manaboId: z.string(),
            alboId: z.string().optional(),
            cubicsId: z.string().optional(),
            timetable: z.array(z.string()),
            appData: V1TimetableAppDataSchema,
        })
    ),
});

export const V1PatchTimetableSchema = z.object({
    term: z.string(),
    manaboId: z.string(),
    appData: V1TimetableAppDataSchema.optional(),
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

export const V1AssignmentClassDetailSchema = z
    .object({
        directoryId: z.string(),
        contentId: z.string(),
        name: z.string(),
    })
    .optional()
    .nullable();

export const V1AssignmentAppDataSchema = z.object({
    directoryName: z.string(),
    title: z.string(),
    description: z.string().optional(),
});

export const V1BaseAssignmentSchema = z.object({
    manaboId: z.string(),
    dueAt: z.string().optional(),
    doneAt: z.string().optional(),
    classDetail: V1AssignmentClassDetailSchema,
    appData: V1AssignmentAppDataSchema,
});

export const V1PostAssignmentsSchema = z.object({
    assignments: z.array(V1BaseAssignmentSchema),
});

export const V1PatchAssignmentSchema = z.object({
    dueAt: z.string().optional(),
    doneAt: z.string().optional(),
    appData: V1AssignmentAppDataSchema.optional(),
});

export const V1AssignmentsSchema = z.object({
    assignments: z.array(
        z.object({
            id: z.string(),
            ...V1BaseAssignmentSchema.shape,
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
