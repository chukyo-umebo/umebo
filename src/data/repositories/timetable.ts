import { z } from "zod";

import { ShouldReSignInError } from "@/common/errors/auth";
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
    readonly cubicsProvider: typeof cubicsProvider;
    readonly manaboProvider: typeof manaboProvider;
    readonly alboProvider: typeof alboProvider;
    readonly cacheProvider: typeof cacheProvider;
    readonly firebaseProvider: typeof firebaseProvider;
    readonly umeboApiRepository: typeof umeboapiProvider;
    readonly authRepository: typeof authRepository;
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

    public async getTimetable() {
        try {
            const apiTimetable = await this.umeboApiRepository.getTimetable(
                await this.firebaseProvider.getFirebaseIdToken()
            );
            cacheProvider.set("class-timetable", apiTimetable);
            return apiTimetable;
        } catch (e) {
            const cached = await cacheProvider.get<z.infer<typeof V1TimetableSchema>>("class-timetable");
            if (cached) {
                return cached.value;
            }
            throw e;
        }
    }

    public async updateTimetable(shibAuth: shibbolethWebViewAuthFunction) {
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
            for (const slot of period.slots) {
                if (slot.className) {
                    const dayStr = slot.day;
                    const dayEnStr = dayOfWeekEnMap[dayStr] || "unknown";
                    const timetableStr = `${dayEnStr}-${periodNum}`;

                    // manaboId の抽出 (例: "course_123456" -> "123456")
                    const manaboIdMatch = slot.href?.match(/course_(\d+)/);
                    const manaboId = manaboIdMatch
                        ? manaboIdMatch[1] || ""
                        : slot.href
                          ? slot.href.split("_").pop() || ""
                          : "";

                    // cubicsId の取得
                    let cubicsId: string | undefined = undefined;
                    if (cubicsTimetable) {
                        const cubicsDayIndex = cubicsTimetable.days.findIndex((d) => d.label === dayStr);
                        if (cubicsDayIndex !== -1) {
                            const cubicsPeriod = cubicsTimetable.periods.find((p) => p.periodLabel === periodNum);
                            if (cubicsPeriod && cubicsPeriod.slots[cubicsDayIndex]) {
                                const cubicsSlot = cubicsPeriod.slots[cubicsDayIndex];
                                if (cubicsSlot.subject) {
                                    cubicsId = cubicsSlot.lessonCode || undefined;
                                }
                            }
                        }
                    }

                    // alboId の取得
                    let alboId: string | undefined = undefined;
                    if (alboTimetable) {
                        const dayOfWeek = dayOfWeekMap[dayStr];
                        if (dayOfWeek !== undefined) {
                            const alboItem = alboTimetable.result.items.find(
                                (item) => item.day_of_week === dayOfWeek && item.time_number.toString() === periodNum
                            );
                            if (alboItem) {
                                alboId = alboItem.class_id;
                            }
                        }
                    }

                    // 既存のクラスがあるかチェック（同じ授業が複数時限にある場合）
                    const existingClass = manaboId
                        ? newTimetable.classes.find((c) => c.manaboId === manaboId)
                        : newTimetable.classes.find((c) => c.name === slot.className);

                    if (existingClass) {
                        if (!existingClass.timetable.includes(timetableStr)) {
                            existingClass.timetable.push(timetableStr);
                        }
                    } else {
                        newTimetable.classes.push({
                            name: slot.className,
                            manaboId: manaboId,
                            alboId: alboId ?? undefined,
                            cubicsId: cubicsId ?? undefined,
                            timetable: [timetableStr],
                        });
                    }
                }
            }
        }
    }
}

export const timetableRepository = new TimetableRepository();
