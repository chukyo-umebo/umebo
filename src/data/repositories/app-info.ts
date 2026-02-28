import * as Application from "expo-application";
import * as Updates from "expo-updates";
import { getRemoteConfig, getValue } from "@react-native-firebase/remote-config";

import { remoteConfigProvider } from "../provider/remote-config";

class AppInfoRepository {
    private readonly remoteConfigProvider: typeof remoteConfigProvider;
    /** @param _remoteConfigProvider - リモート設定プロバイダーのインスタンス */
    constructor(_remoteConfigProvider = remoteConfigProvider) {
        this.remoteConfigProvider = _remoteConfigProvider;
    }

    /** アプリの現在のバージョンを取得する */
    get currentVersion(): string {
        return Application.nativeApplicationVersion ?? "0.0.0";
    }

    /** Remote Configから最低必要バージョンを取得する */
    get minimumVersion(): string {
        return getValue(getRemoteConfig(), "minimumVersion").asString();
    }

    /** 表示用のバージョン情報文字列を生成する */
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

    /**
     * アプリのアップデートが必要かどうかを判定する
     * @returns 現在のバージョンが最低バージョン未満ならtrue
     */
    public isNeededUpdate(): boolean {
        return this.compareVersions(this.currentVersion, this.minimumVersion) < 0;
    }

    /**
     * アプリがメンテナンスモードかどうかを判定する
     * @returns メンテナンス中ならtrue
     */
    public isUnderMaintenance(): boolean {
        return getValue(getRemoteConfig(), "maintenanceMode").asBoolean();
    }

    /** Firebase Remote Configの設定を取得して反映する */
    public async fetchFirebaseRemoteConfig(): Promise<void> {
        return this.remoteConfigProvider.fetchAndActivate();
    }

    /**
     * セマンティックバージョニングで2つのバージョンを比較する
     * @param version1 - 比較元のバージョン文字列
     * @param version2 - 比較先のバージョン文字列
     * @returns version1が小さければ-1、等しければ0、大きければ1
     */
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
