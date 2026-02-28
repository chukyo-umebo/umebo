import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";

export interface CacheEntry<T> {
    storedAt: number;
    value: T;
}

export const CACHE_KEYS = [
    "bus-diagram",
    "bus-timetable",
    "class-timetable",
    "chukyo-calender",
    "assignments",
] as const;
export const CacheKeySchema = z.enum(CACHE_KEYS);
export type CacheKey = (typeof CACHE_KEYS)[number];

export class CacheProvider {
    private readonly namespace: string;

    /**
     * @param namespace キャッシュストレージ内でのキーのプレフィックス。異なる用途でキャッシュを分けたい場合に指定します。(英数字 or _ or -)の文字列を推奨します。
     */
    constructor(namespace = "umebo-cache") {
        this.namespace = namespace;
    }

    /**
     * キャッシュからデータを取得する
     * @param key - キャッシュキー
     * @returns キャッシュエントリ、存在しないか無効な場合はnull
     */
    public async get<T>(key: CacheKey): Promise<CacheEntry<T> | null> {
        const raw = await AsyncStorage.getItem(this.makeKey(key));
        if (!raw) return null;

        try {
            const parsed = JSON.parse(raw) as CacheEntry<T>;
            if (typeof parsed?.storedAt !== "number" || parsed.value === undefined) {
                await this.remove(key);
                return null;
            }
            return parsed;
        } catch {
            await this.remove(key);
            return null;
        }
    }

    /**
     * データをキャッシュに保存する
     * @param key - キャッシュキー
     * @param value - 保存するデータ
     */
    public async set<T>(key: CacheKey, value: T): Promise<void> {
        const payload: CacheEntry<T> = {
            storedAt: Date.now(),
            value,
        };
        await AsyncStorage.setItem(this.makeKey(key), JSON.stringify(payload));
    }

    /**
     * キャッシュからデータを削除する
     * @param key - 削除対象のキャッシュキー
     */
    public async remove(key: CacheKey): Promise<void> {
        await AsyncStorage.removeItem(this.makeKey(key));
    }

    /**
     * ネームスペース付きのキャッシュキーを生成する
     * @param key - 元のキー名
     * @returns ネームスペースをプレフィックスとしたキー文字列
     */
    private makeKey(key: string): string {
        return `${this.namespace}.${key}`;
    }
}

export const cacheProvider = new CacheProvider();
