import { Cookies } from "@react-native-cookies/cookies";

import { AuthProcessError } from "@/common/errors/auth";
import { shibbolethWebViewAuthFunction } from "@/data/clients/chukyo-shibboleth";

export interface CookieCredentials {
    cookies: Cookies;
    lastRefreshedAt: Date;
}

export abstract class AbstractChukyoProvider {
    protected abstract readonly baseUrl: string;
    protected abstract readonly authEnterPath: string;
    protected abstract readonly authGoalPath: string;
    protected credentialsRottenTime: number = 25 * 60 * 1000; // 25分

    private authCookie: CookieCredentials = {
        cookies: {},
        lastRefreshedAt: new Date(0),
    };
    /**
     * 認証クッキーを更新し、最終更新時刻を記録する
     * @param cookies - 保存するクッキー
     */
    private setAuthCookie(cookies: Cookies) {
        this.authCookie.cookies = cookies;
        this.authCookie.lastRefreshedAt = new Date();
    }
    /** 認証クッキーをクリアして初期状態に戻す */
    public clearAuthCookie() {
        this.authCookie = {
            cookies: {},
            lastRefreshedAt: new Date(0),
        };
    }

    /**
     * CookieオブジェクトをHTTPヘッダーで利用できる文字列表現へ変換します。
     * @param cookies 変換対象のCookieマップ
     * @returns `name=value`形式を`; `区切りで連結した文字列
     */
    private cookiesToString(cookies: Cookies): string {
        return Object.entries(cookies)
            .map(([name, cookie]) => `${name}=${cookie.value}`)
            .join("; ");
    }

    /**
     * ユーザー情報をもとにShibboleth認証を行い、利用可能なクッキーを返します。
     * @param userId 認証に利用するユーザーID
     * @param password 認証に利用するパスワード
     * @param authFunc shibboleth認証を行う関数
     * @returns 認証後に利用可能なクッキー集合
     */
    private async authentication(
        userId: string,
        password: string,
        authFunc: shibbolethWebViewAuthFunction
    ): Promise<Cookies> {
        // SSOログイン
        // const authFunc = this.auth.authService.shibAuth;
        const cookies = await authFunc({
            enterUrl: `${this.baseUrl}${this.authEnterPath}`,
            goalUrl: `${this.baseUrl}${this.authGoalPath}`,
            userId,
            password,
        });

        if (Object.keys(cookies).length === 0) {
            if (__DEV__) console.log("クッキーが取得できませんでした。");
            throw new AuthProcessError();
        }

        this.setAuthCookie(cookies);
        return cookies;
    }

    /**
     * 有効期限内のクッキーを取得し、必要に応じて再認証を実行します。
     * @param userId 認証に利用するユーザーID
     * @param password 認証に利用するパスワード
     * @param authFunc shibboleth認証を行う関数
     * @returns HTTPヘッダー用に整形されたクッキー文字列
     */
    protected async getAuthedCookie(userId: string, password: string, authFunc: shibbolethWebViewAuthFunction) {
        let cookies: Cookies;
        if (this.authCookie.lastRefreshedAt.getTime() + this.credentialsRottenTime < Date.now()) {
            cookies = await this.authentication(userId, password, authFunc);
        } else {
            cookies = this.authCookie.cookies;
        }

        return `; ${this.cookiesToString(cookies)}`;
    }

    /**
     * 認証情報を用いてサービスへのアクセスが可能かテストします。
     * @param userId 認証に利用するユーザーID
     * @param password 認証に利用するパスワード
     * @param authFunc shibboleth認証を行う関数
     * @returns 認証成功ならtrueを返すPromise
     * @throws 認証失敗や通信エラーが発生した場合は例外を投げる
     */
    public async authTest(userId: string, password: string, authFunc: shibbolethWebViewAuthFunction): Promise<boolean> {
        try {
            await this.authentication(userId, password, authFunc);
            return true;
        } catch (error) {
            throw error;
        }
    }
}
