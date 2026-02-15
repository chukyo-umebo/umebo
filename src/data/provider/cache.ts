import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";

export interface CacheEntry<T> {
    storedAt: number;
    value: T;
}

export const CACHE_KEYS = ["bus-diagram", "bus-timetable"] as const;
export const CacheKeySchema = z.enum(CACHE_KEYS);
export type CacheKey = (typeof CACHE_KEYS)[number];

export interface FetchWithCacheOptions<T> {
    key: CacheKey;
    fetcher: () => Promise<T>;
    maxAgeMs?: number;
    staleAgeMs?: number;
}

export class CacheProvider {
    private readonly namespace: string;
    private static readonly DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
    private static readonly DEFAULT_STALE_AGE_MS = CacheProvider.DEFAULT_MAX_AGE_MS * 2;

    /**
     * @param namespace キャッシュストレージ内でのキーのプレフィックス。異なる用途でキャッシュを分けたい場合に指定します。(英数字 or _ or -)の文字列を推奨します。
     */
    constructor(namespace = "umebo-cache") {
        this.namespace = namespace;
    }

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

    public async set<T>(key: CacheKey, value: T): Promise<void> {
        const payload: CacheEntry<T> = {
            storedAt: Date.now(),
            value,
        };
        await AsyncStorage.setItem(this.makeKey(key), JSON.stringify(payload));
    }

    public async remove(key: CacheKey): Promise<void> {
        await AsyncStorage.removeItem(this.makeKey(key));
    }

    public async fetchWithCache<T>({
        key,
        fetcher,
        maxAgeMs = CacheProvider.DEFAULT_MAX_AGE_MS,
        staleAgeMs = CacheProvider.DEFAULT_STALE_AGE_MS,
    }: FetchWithCacheOptions<T>): Promise<T> {
        if (staleAgeMs < maxAgeMs) {
            staleAgeMs = maxAgeMs;
        }

        const cached = await this.get<T>(key);
        const now = Date.now();
        const age = cached ? now - cached.storedAt : null;

        if (cached && age !== null && age < maxAgeMs) {
            return cached.value;
        }

        try {
            const fresh = await fetcher();
            await this.set(key, fresh);
            return fresh;
        } catch (error) {
            if (cached) {
                return cached.value;
            }
            throw error;
        }
    }

    private makeKey(key: string): string {
        return `${this.namespace}.${key}`;
    }
}

export const cacheProvider = new CacheProvider();
