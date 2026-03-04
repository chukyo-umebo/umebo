import { Platform } from "react-native";
import { Cookies } from "@react-native-cookies/cookies";
import { getRemoteConfig, getValue } from "@react-native-firebase/remote-config";
import { z } from "zod";

import { PasskeyNotRegisteredError, ShouldReSignInError } from "@/common/errors/auth";
import {
    loginWithPasskey,
    loginWithPassword,
    PasswordLoginSession,
    registerPasskeyWithOTP,
} from "@/data/clients/chukyo-shibboleth-http";
import { PasskeyCredential } from "@/data/clients/passkey";
import { V1MessageSchema } from "../../common/types/umebo-api-schema";
import { firebaseProvider } from "../provider/firebase";
import { storageProvider } from "../provider/storage";
import { umeboapiProvider } from "../provider/umebo-api";



class AuthRepository {
    private umeboapiProvider: typeof umeboapiProvider;
    private firebaseProvider: typeof firebaseProvider;
    private storageProvider: typeof storageProvider;
    private passkeyLoginQueue: Promise<void> = Promise.resolve();
    /**
     * @param _umeboapiProvider - UMEBO APIプロバイダー
     * @param _firebaseProvider - Firebaseプロバイダー
     * @param _storageProvider - ストレージプロバイダー
     */
    constructor(
        _umeboapiProvider = umeboapiProvider,
        _firebaseProvider = firebaseProvider,
        _storageProvider = storageProvider
    ) {
        this.umeboapiProvider = _umeboapiProvider;
        this.firebaseProvider = _firebaseProvider;
        this.storageProvider = _storageProvider;
    }

    /** Remote Configから許可されたメールドメインを取得する */
    get allowedMailDomain(): string {
        return getValue(getRemoteConfig(), "allowedMailDomain").asString();
    }

    /** Remote ConfigからGoogle認証用のWebクライアントIDを取得する */
    get webClientId(): string {
        return getValue(getRemoteConfig(), "webClientId").asString();
    }

    /**
     * Firebase IDトークンを使用してUMEBO APIにログインする
     * @returns ログイン結果メッセージ
     */
    public async loginUmeboAPI(): Promise<z.infer<typeof V1MessageSchema>> {
        const firebaseIdToken = await this.firebaseProvider.getFirebaseIdToken();

        return this.umeboapiProvider.login(firebaseIdToken);
    }

    /**
     * 認証情報をセキュアストレージに保存する
     * @param studentId - 学籍番号
     * @param password - パスワード
     */
    public async saveIdPass(studentId: string, password: string): Promise<void> {
        await Promise.all([this.storageProvider.setStudentId(studentId), this.storageProvider.setPassword(password)]);
    }

    /** セキュアストレージから認証情報を削除する */
    public async clearCredentials(): Promise<void> {
        await Promise.all([
            this.storageProvider.removeStudentId(),
            this.storageProvider.removePassword(),
            this.storageProvider.removePasskey(),
        ]);
    }

    /**
     * Passkey を登録するために、ID/PW で Shibboleth 認証を行い
     * OTP 入力待ち状態のセッション情報を返す。
     *
     * CloudLink SP Agent (CLSP) の SAML ログインを開始し、
     * ID/PW 認証まで進める。
     * この関数の後に {@link registerPasskeyWithOTP} を呼び出して
     * OTP 認証と Passkey 登録を行う。
     *
     * @returns OTP 入力待ちのセッション情報
     * @throws UnauthorizedError ID/PW が正しくない場合
     * @throws OtpNotEnabledError OTP 認証が有効化されていない場合
     * @throws AuthProcessError 認証処理中にエラーが発生した場合
     */
    public async getLoginSession(): Promise<PasswordLoginSession> {
        const userId = await this.storageProvider.getStudentId();
        const password = await this.storageProvider.getPassword();
        if (!userId || !password) {
            throw new ShouldReSignInError();
        }
        return await loginWithPassword(userId, password);
    }

    /**
     * OTP を入力して Shibboleth 認証を完了し、擬似 Passkey を生成・登録する。
     *
     * @param session - {@link loginWithPassword} の戻り値
     * @param otp - ワンタイムパスワード
     * @returns 登録された擬似 Passkey
     * @throws UnauthorizedError OTP が正しくない場合
     * @throws AuthProcessError 認証処理中にエラーが発生した場合
     */
    public async shibRegisterPasskeyWithOTP(session: PasswordLoginSession, otp: string): Promise<PasskeyCredential> {
        const displayName = this.makePasskeyDisplayName();
        const passkey = await registerPasskeyWithOTP(session, otp, displayName);
        await this.storageProvider.setPasskey(passkey);
        return passkey;
    }

    /**
     * 擬似 Passkey を使用して Shibboleth 認証を行い、サービスの Cookie を取得する。
     *
     * @param credential - サービスへのログイン情報 (enterUrl, goalUrl, userId, password)
     * @param storedPasskey - {@link registerPasskeyWithOTP} で取得した擬似 Passkey
     * @returns 認証後のサービス Cookie
     * @throws UnauthorizedError 認証に失敗した場合
     * @throws AuthProcessError 認証処理中にエラーが発生した場合
     */
    public async shibLoginWithPasskey(enterUrl: string, goalUrl: string): Promise<Cookies> {
        const userId = await this.storageProvider.getStudentId();
        if (!userId) {
            throw new ShouldReSignInError();
        }
        const password = await this.storageProvider.getPassword();
        if (!password) {
            throw new ShouldReSignInError();
        }
        const queuedLogin = this.passkeyLoginQueue.then(async () => {
            const storedPasskey = await this.storageProvider.getPasskey();
            if (!storedPasskey) {
                throw new PasskeyNotRegisteredError();
            }
            const cookie = await loginWithPasskey({ enterUrl, goalUrl, userId, password }, storedPasskey);
            await this.storageProvider.setPasskey(storedPasskey);
            return cookie;
        });

        this.passkeyLoginQueue = queuedLogin.then(
            () => undefined,
            () => undefined
        );

        return await queuedLogin;
    }

    private makePasskeyDisplayName(): string {
        const os = Platform.OS;
        return `umebo for ${os}`;
    }
}

export const authRepository = new AuthRepository();
