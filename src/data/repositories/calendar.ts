import { z } from "zod";



import { ShouldReSignInError } from "@/common/errors/auth";
import { V1TimetableSchema } from "@/common/types/umebo-api-schema";
import { shibbolethWebViewAuthFunction } from "../clients/chukyo-shibboleth";
import { cacheProvider } from "../provider/cache";
import { alboProvider } from "../provider/chukyo-univ/albo";
import { cubicsProvider } from "../provider/chukyo-univ/cubics";
import { manaboProvider } from "../provider/chukyo-univ/manabo";
import { firebaseProvider } from "../provider/firebase";
import { umeboapiProvider } from "../provider/umebo-api";
import { authRepository } from "./auth";
import { AlboCalendarDTO } from "@chukyo-umebo/web_parser";


class CalendarRepository {
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

    public async getCalendar(authFunc: shibbolethWebViewAuthFunction, cacheOnly = false) {
        if (cacheOnly) {
            const cached = await this.cacheProvider.get<AlboCalendarDTO>("chukyo-calender");
            if (cached) {
                return cached.value;
            } else {
                return null;
            }
        }

        const studentId = await this.authRepository.getStudentId();
        const password = await this.authRepository.getPassword();
        if (!studentId || !password) {
            throw new ShouldReSignInError();
        }

        try {
            const calendar = await this.alboProvider.getCalendar(studentId, password, authFunc);
            this.cacheProvider.set("chukyo-calender", calendar);
            return calendar.data;
        } catch (e) {
            const cached = await this.cacheProvider.get<AlboCalendarDTO>("chukyo-calender");
            if (cached) {
                return cached.value;
            }
            throw e;
        }
    }
}

export const calendarRepository = new CalendarRepository();
