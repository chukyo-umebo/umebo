import { ManaboClassContentDTO } from "@chukyo-umebo/web_parser";

import { ShouldReSignInError } from "@/common/errors/auth";
import { ParseError } from "@/common/errors/parse";
import { shibbolethWebViewAuthFunction } from "../clients/chukyo-shibboleth";
import { cacheProvider } from "../provider/cache";
import { alboProvider } from "../provider/chukyo-univ/albo";
import { cubicsProvider } from "../provider/chukyo-univ/cubics";
import { manaboProvider } from "../provider/chukyo-univ/manabo";
import { firebaseProvider } from "../provider/firebase";
import { umeboapiProvider } from "../provider/umebo-api";
import { authRepository } from "./auth";

export interface ManaboBaseContentData {
    type: "file" | "report";
    isDone: boolean;
    duration: {
        publish: {
            start?: Date;
            end?: Date;
        };
        deadline: {
            start?: Date;
            end?: Date;
        };
    };
}

export interface ManaboFileContentData extends ManaboBaseContentData {
    type: "file";

    comment: string;
    files: {
        fileName: string;
        href: string;
        icon: string;
    }[];
}

export interface ManaboReportContentData extends ManaboBaseContentData {
    type: "report";

    title: string;
    description: string;
    contentId: string;
    reportType: string;
    isExpired: boolean;
    isNotAvailableYet: boolean;
    actions: {
        title: string;
        href: string;
    }[];
}

export type ManaboContentData = ManaboFileContentData | ManaboReportContentData;

export interface ClassContent {
    directoryId: string;
    directoryName: string;
    contents: ManaboContentData[];
}

class ClassDataRepository {
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

    private async getDirectory(
        manaboClassId: string,
        authFunc: shibbolethWebViewAuthFunction
    ): Promise<{ directoryId: string; title: string }[]> {
        const studentId = await this.authRepository.getStudentId();
        const password = await this.authRepository.getPassword();
        if (!studentId || !password) {
            throw new ShouldReSignInError();
        }

        const data = await this.manaboProvider.getClassDirectory(studentId, password, authFunc, manaboClassId);

        if (data.success) {
            const directories = data.data.directories;
            directories.unshift({
                directoryId: "0",
                title: "クラストップ",
            });
            return directories;
        } else {
            throw new ParseError();
        }
    }

    public async getContents(manaboClassId: string, authFunc: shibbolethWebViewAuthFunction): Promise<ClassContent[]> {
        const studentId = await this.authRepository.getStudentId();
        const password = await this.authRepository.getPassword();
        if (!studentId || !password) {
            throw new ShouldReSignInError();
        }

        const contents: ClassContent[] = [];
        for (const directory of await this.getDirectory(manaboClassId, authFunc)) {
            const fetchedContents = await this.manaboProvider.getClassContent(
                studentId,
                password,
                authFunc,
                manaboClassId,
                directory.directoryId
            );
            if (!fetchedContents.success) {
                __DEV__ &&
                    console.error(
                        "ディレクトリ内コンテンツの取得に失敗:",
                        directory.directoryId,
                        fetchedContents.error
                    );
                continue;
            }
            contents.push({
                directoryId: directory.directoryId,
                directoryName: directory.title,
                contents: this.manaboContentToDomain(fetchedContents.data.contents),
            });
        }

        return contents;
    }

    /**
     * 課題の日付文字列をISO8601形式に変換する
     *
     * 例:
     *  - "9月22日(月) 10:00 ～ 9月22日(月) 23:59"
     *  - "〜 2026年1月31日(土) 00:00"
     *  - "9月22日(月) 10:00 ～"
     */
    private parseJapaneseDatetimeRange(input: string): {
        start: Date | undefined;
        end: Date | undefined;
    } {
        const currentYear = 2025;
        const tzOffset = "+09:00";

        // 日付 + 時刻パターン例: "2026年1月31日(土) 00:00" or "9月22日(月) 10:00"
        const dateTimeRegex = /(?:(\d{4})年)?\s*(\d{1,2})月(\d{1,2})日(?:\([^)]+\))?\s*(\d{1,2}):(\d{2})/;

        // 「～」または「〜」で区切る
        const [startPart, endPart] = input.split(/[～〜]/).map((s) => s.trim());

        const parsePart = (part: string | undefined): string | null => {
            if (!part) return null;
            const match = dateTimeRegex.exec(part);
            if (!match) return null;

            const [, yearStr, monthStr, dayStr, hourStr, minuteStr] = match;
            const year = yearStr ? parseInt(yearStr, 10) : currentYear;
            const month = monthStr ? parseInt(monthStr, 10) : 1;
            const day = dayStr ? parseInt(dayStr, 10) : 1;
            const hour = hourStr ? parseInt(hourStr, 10) : 0;
            const minute = minuteStr ? parseInt(minuteStr, 10) : 0;

            // ISO8601形式の文字列に変換
            const iso = new Date(year, month - 1, day, hour, minute).toISOString();
            // タイムゾーン補正を+09:00で上書き
            return iso.replace("Z", tzOffset);
        };

        const start = parsePart(startPart);
        const end = parsePart(endPart);

        const startDate = start ? new Date(start) : undefined;
        const endDate = end ? new Date(end) : undefined;

        return { start: startDate, end: endDate };
    }

    private manaboContentToDomain(data: ManaboClassContentDTO["contents"]): ManaboContentData[] {
        return data.map((content) => {
            // 期限の計算
            let duration: {
                publish: {
                    start?: Date;
                    end?: Date;
                };
                deadline: {
                    start?: Date;
                    end?: Date;
                };
            } = {
                publish: {},
                deadline: {},
            };

            if (content.type === "file") {
                const publishDuration = content.attachedFile.duration.find((d) => d.label === "公開期間:");
                const deadlineDuration = content.attachedFile.duration.find((d) => d.label === "提出受付期間:");

                duration.publish = this.parseJapaneseDatetimeRange(publishDuration?.value || "");
                duration.deadline = this.parseJapaneseDatetimeRange(deadlineDuration?.value || "");
            } else if (content.type === "report") {
                const publishDuration = content.content.duration.find((d) => d.label === "受講期間:");
                const deadlineDuration = content.content.duration.find((d) => d.label === "提出受付期間:");

                duration.publish = this.parseJapaneseDatetimeRange(publishDuration?.value || "");
                duration.deadline = this.parseJapaneseDatetimeRange(deadlineDuration?.value || "");
            }

            switch (content.type) {
                case "file":
                    return {
                        type: "file",
                        isDone: content.icon.isIconChecked,
                        duration: duration,

                        comment: content.attachedFile.comment,
                        files: content.attachedFile.files.map((file) => ({
                            fileName: file.fileName,
                            href: file.href,
                            icon: file.icon,
                        })),
                    };
                case "report":
                    return {
                        type: "report",
                        isDone: content.icon.isIconChecked,
                        duration: duration,

                        title: content.content.title,
                        description: content.toggleArea.description,
                        contentId: content.content.contentId,
                        reportType: content.content.pluginKey,
                        isExpired: content.toggleArea.isExpired,
                        isNotAvailableYet: content.toggleArea.isNotAvailableYet,
                        actions: content.toggleArea.actions.map((action) => ({
                            title: action.title,
                            href: action.href,
                        })),
                    };
            }
        });
    }
}

export const classDataRepository = new ClassDataRepository();
