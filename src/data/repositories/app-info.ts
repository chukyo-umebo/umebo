import * as Application from "expo-application";
import * as Updates from "expo-updates";
import { getRemoteConfig, getValue } from "@react-native-firebase/remote-config";

import { remoteConfigProvider } from "../provider/remote-config";

class AppInfoRepository {
    private readonly remoteConfigProvider: typeof remoteConfigProvider;
    constructor(_remoteConfigProvider = remoteConfigProvider) {
        this.remoteConfigProvider = _remoteConfigProvider;
    }

    get currentVersion(): string {
        return Application.nativeApplicationVersion ?? "0.0.0";
    }

    get minimumVersion(): string {
        return getValue(getRemoteConfig(), "minimumVersion").asString();
    }

    get versionInfo(): string {
        const updateCreatedAt = Updates.createdAt ?? new Date(0);
        const formatter = new Intl.DateTimeFormat("ja-JP", {
            timeZone: "Asia/Tokyo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
        const date = formatter.format(updateCreatedAt).replace(/\D/g, "");
        return `Version ${this.currentVersion} (${date})`;
    }

    public isNeededUpdate(): boolean {
        return this.compareVersions(this.currentVersion, this.minimumVersion) < 0;
    }

    public isUnderMaintenance(): boolean {
        return getValue(getRemoteConfig(), "maintenanceMode").asBoolean();
    }

    public async fetchFirebaseRemoteConfig(): Promise<void> {
        return this.remoteConfigProvider.fetchAndActivate();
    }

    private compareVersions(version1: string, version2: string): number {
        const v1Parts = version1.split(".").map((part) => parseInt(part, 10));
        const v2Parts = version2.split(".").map((part) => parseInt(part, 10));

        const maxLength = Math.max(v1Parts.length, v2Parts.length);

        for (let i = 0; i < maxLength; i++) {
            const v1Part = v1Parts[i] ?? 0;
            const v2Part = v2Parts[i] ?? 0;

            if (v1Part < v2Part) {
                return -1;
            }
            if (v1Part > v2Part) {
                return 1;
            }
        }

        return 0;
    }
}

export const appInfoRepository = new AppInfoRepository();
