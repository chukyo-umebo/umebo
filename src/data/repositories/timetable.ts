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
        const firebaseId = await this.firebaseProvider.getFirebaseIdToken();
        const studentId = await this.authRepository.getStudentId();
        const password = await this.authRepository.getPassword();
        if (!studentId || !password) {
            throw new ShouldReSignInError();
        }

        const cubicsTimetable = await this.cubicsProvider.getTimetable(studentId, password, shibAuth);
        const manaboTimetable = await this.manaboProvider.getTimetable(studentId, password, shibAuth);
        const alboTimetable = await this.alboProvider.getTimetable(studentId, password, shibAuth);

        const term = buildTermString();
        let newTimetable: z.infer<typeof V1TimetableSchema> = {
            term,
            classes: [],
        };

        await this.umeboApiRepository.postTimetable(firebaseId, newTimetable);
        return await this.getTimetable();
    }
}

export const timetableRepository = new TimetableRepository();
