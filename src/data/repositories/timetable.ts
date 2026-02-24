import { AlboTimetableItemDTO, CubicsAsTimetableSlotDTO } from "@chukyo-umebo/web_parser";
import { z } from "zod";

import { ShouldReSignInError } from "@/common/errors/auth";
import { ShouldRefreshTimetableError } from "@/common/errors/timetable";
import { V1TimetableSchema } from "@/common/types/umebo-api-schema";
import { buildTermString } from "@/utils";
import { shibbolethWebViewAuthFunction } from "../clients/chukyo-shibboleth";
import { cacheProvider } from "../provider/cache";
import { alboProvider } from "../provider/chukyo-univ/albo";
import { cubicsProvider } from "../provider/chukyo-univ/cubics";
import { manaboProvider } from "../provider/chukyo-univ/manabo";
import { firebaseProvider } from "../provider/firebase";
import { umeboapiProvider } from "../provider/umebo-api";
import { authRepository } from "./auth";

class TimetableRepository {
    private readonly cubicsProvider: typeof cubicsProvider;
    private readonly manaboProvider: typeof manaboProvider;
    private readonly alboProvider: typeof alboProvider;
    private readonly cacheProvider: typeof cacheProvider;
    private readonly firebaseProvider: typeof firebaseProvider;
    private readonly umeboApiRepository: typeof umeboapiProvider;
    private readonly authRepository: typeof authRepository;
    constructor(
        _cubicsProvider = cubicsProvider,
        _manaboProvider = manaboProvider,
        _alboProvider = alboProvider,
        _cacheProvider = cacheProvider,
        _firebaseProvider = firebaseProvider,
        _umeboApiRepository = umeboapiProvider,
        _authRepository = authRepository
    ) {
        this.cubicsProvider = _cubicsProvider;
        this.manaboProvider = _manaboProvider;
        this.alboProvider = _alboProvider;
        this.cacheProvider = _cacheProvider;
        this.firebaseProvider = _firebaseProvider;
        this.umeboApiRepository = _umeboApiRepository;
        this.authRepository = _authRepository;
    }

    public async getTimetable(cacheOnly = false): Promise<z.infer<typeof V1TimetableSchema>> {
        const term = buildTermString();
        if (cacheOnly) {
            const cached = await this.cacheProvider.get<z.infer<typeof V1TimetableSchema>>("class-timetable");
            if (!cached || cached.value.term !== term) {
                throw new ShouldRefreshTimetableError();
            }
            return cached.value;
        }

        try {
            const apiTimetable = await this.umeboApiRepository.getTimetable(
                await this.firebaseProvider.getFirebaseIdToken()
            );
            this.cacheProvider.set("class-timetable", apiTimetable);
            return apiTimetable;
        } catch (e) {
            const cached = await this.cacheProvider.get<z.infer<typeof V1TimetableSchema>>("class-timetable");
            if (!cached || cached.value.term !== term) {
                throw e;
            }
            return cached.value;
        }
    }

    public async updateTimetable(shibAuth: shibbolethWebViewAuthFunction) {
        const firebaseId = await this.firebaseProvider.getFirebaseIdToken();
        const studentId = await this.authRepository.getStudentId();
        const password = await this.authRepository.getPassword();
        if (!studentId || !password) {
            throw new ShouldReSignInError();
        }

        let cubicsTimetableResult;
        try {
            cubicsTimetableResult = await this.cubicsProvider.getTimetable(studentId, password, shibAuth);
        } catch (e) {
            __DEV__ && console.log("cubicsから時間割の取得に失敗", e);
            cubicsTimetableResult = { success: false };
        }
        const manaboTimetableResult = await this.manaboProvider.getTimetable(studentId, password, shibAuth);
        const alboTimetableResult = await this.alboProvider.getTimetable(studentId, password, shibAuth);

        if (!manaboTimetableResult.success) {
            throw new Error("Failed to parse manabo timetable");
        }
        const manaboTimetable = manaboTimetableResult.data;
        const cubicsTimetable = cubicsTimetableResult.success ? cubicsTimetableResult.data : null;
        const alboTimetable = alboTimetableResult.success ? alboTimetableResult.data : null;

        const term = buildTermString();
        let newTimetable: z.infer<typeof V1TimetableSchema> = {
            term,
            classes: [],
        };

        const dayOfWeekMap: Record<string, number> = { 日: 0, 月: 1, 火: 2, 水: 3, 木: 4, 金: 5, 土: 6 };
        const dayOfWeekEnMap: Record<string, string> = {
            日: "sun",
            月: "mon",
            火: "tue",
            水: "wed",
            木: "thu",
            金: "fri",
            土: "sat",
        };

        for (const period of manaboTimetable.periods) {
            const periodNum = period.period;
            for (const manabo of period.slots) {
                if (manabo.className) {
                    const dayStr = manabo.day;
                    const dayEnStr = dayOfWeekEnMap[dayStr] || "unknown";
                    const timetableStr = `${dayEnStr}-${periodNum}`;

                    // manaboId の抽出
                    const manaboIdMatch = manabo.href?.match(/class\/(\d+)/);
                    const manaboId = manaboIdMatch ? manaboIdMatch[1] || manabo.href : manabo.href;

                    // cubics の取得
                    let cubics: CubicsAsTimetableSlotDTO | undefined = undefined;
                    if (cubicsTimetable) {
                        const cubicsDayIndex = cubicsTimetable.days.findIndex((d) => d.label === dayStr);
                        if (cubicsDayIndex !== -1) {
                            const cubicsPeriod = cubicsTimetable.periods.find((p) => p.periodLabel === periodNum);
                            if (cubicsPeriod && cubicsPeriod.slots[cubicsDayIndex]) {
                                cubics = cubicsPeriod.slots[cubicsDayIndex];
                            }
                        }
                    }

                    // albo の取得
                    let albo: AlboTimetableItemDTO | undefined = undefined;
                    if (alboTimetable) {
                        const dayOfWeek = dayOfWeekMap[dayStr];
                        if (dayOfWeek !== undefined) {
                            albo = alboTimetable.result.items.find(
                                (item) => item.day_of_week === dayOfWeek && item.time_number.toString() === periodNum
                            );
                        }
                    }

                    // 既存のクラスがあるかチェック（同じ授業が複数時限にある場合）
                    const existingClass = manaboId
                        ? newTimetable.classes.find((c) => c.manaboId === manaboId)
                        : newTimetable.classes.find((c) => c.name === manabo.className);

                    if (existingClass) {
                        if (!existingClass.timetable.includes(timetableStr)) {
                            existingClass.timetable.push(timetableStr);
                        }
                    } else {
                        newTimetable.classes.push({
                            name: manabo.className,
                            manaboId: manaboId || "",
                            alboId: albo?.class_id,
                            cubicsId: cubics?.lessonCode ?? undefined,
                            timetable: [timetableStr],
                            appData: {
                                color: "#CCCCCC", // デフォルトの色
                                teacher: albo?.teacher,
                                room: albo?.room ?? cubics?.classroom ?? undefined,
                                campus: albo?.campus,
                                material: [],
                                alboId: albo?.id,
                                alboUUID: albo?.uuid,
                                cubicsDetailUrl: cubics?.detailUrl ?? undefined,
                            },
                        });
                    }
                }
            }
        }

        await this.umeboApiRepository.postTimetable(firebaseId, newTimetable);
    }
}

export const timetableRepository = new TimetableRepository();
