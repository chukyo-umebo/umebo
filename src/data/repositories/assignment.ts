import { z } from "zod";

import { V1AssignmentsSchema, V1PostAssignmentsSchema } from "@/common/types/umebo-api-schema";
import { cacheProvider } from "../provider/cache";
import { firebaseProvider } from "../provider/firebase";
import { umeboapiProvider } from "../provider/umebo-api";
import { classDataRepository } from "./class-data";
import { timetableRepository } from "./timetable";

class AssignmentRepository {
    private readonly cacheProvider: typeof cacheProvider;
    private readonly firebaseProvider: typeof firebaseProvider;
    private readonly umeboApiRepository: typeof umeboapiProvider;
    private readonly classDataRepository: typeof classDataRepository;
    private readonly timetableRepository: typeof timetableRepository;
    constructor(
        _cacheProvider = cacheProvider,
        _firebaseProvider = firebaseProvider,
        _umeboApiRepository = umeboapiProvider,
        _classDataRepository = classDataRepository,
        _timetableRepository = timetableRepository
    ) {
        this.cacheProvider = _cacheProvider;
        this.firebaseProvider = _firebaseProvider;
        this.umeboApiRepository = _umeboApiRepository;
        this.classDataRepository = _classDataRepository;
        this.timetableRepository = _timetableRepository;
    }

    /**
     * 課題一覧を取得する（キャッシュフォールバック付き）
     * @param cacheOnly - trueの場合キャッシュのみ参照する
     * @returns 課題データ一覧
     */
    public async getAssignments(cacheOnly = false): Promise<z.infer<typeof V1AssignmentsSchema>> {
        const firebaseIdToken = await this.firebaseProvider.getFirebaseIdToken();
        if (cacheOnly) {
            const cached = await this.cacheProvider.get<z.infer<typeof V1AssignmentsSchema>>(`assignments`);
            if (cached) {
                return cached.value;
            } else {
                return { assignments: [] };
            }
        }

        try {
            const apiAssignments = await this.umeboApiRepository.getAssignments(firebaseIdToken);
            this.cacheProvider.set(`assignments`, apiAssignments);
            return apiAssignments;
        } catch (e) {
            const cached = await this.cacheProvider.get<z.infer<typeof V1AssignmentsSchema>>(`assignments`);
            if (cached) {
                return cached.value;
            }
            throw e;
        }
    }

    /**
     * MaNaBoから最新の課題を取得し、未登録の課題をUMEBO APIに登録する
     * @param shibAuth - Shibboleth認証関数
     * @throws {ShouldReSignInError} 認証情報が未設定の場合
     */
    public async updateAssignments() {
        const firebaseIdToken = await this.firebaseProvider.getFirebaseIdToken();

        const savedAssignmentsRaw = await this.umeboApiRepository.getAssignments(firebaseIdToken);
        const savedAssignments = savedAssignmentsRaw.assignments.filter((e) => e.classDetail);
        const savedAssignmentHash = savedAssignments.map(
            (a) => `${a.manaboId}-${a.classDetail?.directoryId}-${a.classDetail?.contentId}`
        );
        const newAssignments: z.infer<typeof V1PostAssignmentsSchema> = { assignments: [] };
        const timetable = await this.timetableRepository.getTimetable();
        const manaboClassIds = timetable.classes.map((c) => c.manaboId);

        for (const manaboClassId of manaboClassIds) {
            const dirContents = await this.classDataRepository.getContents(manaboClassId);
            for (const dir of dirContents) {
                const assignments = dir.contents.filter((content) => content.type === "report");
                for (const asg of assignments) {
                    const hash = `${manaboClassId}-${dir.directoryId}-${asg.contentId}`;
                    if (asg.contentId === "") {
                        continue;
                    }
                    if (savedAssignmentHash.includes(hash)) {
                        continue;
                    }
                    newAssignments.assignments.push({
                        manaboId: manaboClassId,
                        dueAt: asg.duration.deadline.end
                            ? new Date(asg.duration.deadline.end).toISOString()
                            : undefined,
                        classDetail: {
                            directoryId: dir.directoryId,
                            contentId: asg.contentId,
                            name: asg.title,
                        },
                        appData: {
                            directoryName: dir.directoryName,
                            title: asg.title,
                            description: asg.description,
                        },
                    });
                }
            }
        }

        if (newAssignments.assignments.length > 0) {
            await this.umeboApiRepository.postAssignment(firebaseIdToken, newAssignments);
        }
    }
}

export const assignmentRepository = new AssignmentRepository();
