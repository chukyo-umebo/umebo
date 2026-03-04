import { AlboCalendarDTO } from "@chukyo-umebo/web_parser";

import { cacheProvider } from "../provider/cache";
import { alboProvider } from "../provider/chukyo-univ/albo";

class CalendarRepository {
    private readonly alboProvider: typeof alboProvider;
    private readonly cacheProvider: typeof cacheProvider;
    /**
     * @param _alboProvider - Alboプロバイダー
     * @param _cacheProvider - キャッシュプロバイダー
     * @param _authRepository - 認証リポジトリ
     */
    constructor(_alboProvider = alboProvider, _cacheProvider = cacheProvider) {
        this.alboProvider = _alboProvider;
        this.cacheProvider = _cacheProvider;
    }

    /**
     * 学年暦カレンダーデータを取得する（キャッシュフォールバック付き）
     * @param authFunc - Shibboleth認証関数
     * @param cacheOnly - trueの場合キャッシュのみ参照する
     * @returns カレンダーデータ、キャッシュのみで未取得の場合はnull
     */
    public async getCalendar(cacheOnly = false) {
        if (cacheOnly) {
            const cached = await this.cacheProvider.get<AlboCalendarDTO>("chukyo-calender");
            if (cached) {
                return cached.value;
            } else {
                return null;
            }
        }

        try {
            const calendar = await this.alboProvider.getCalendar();
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
