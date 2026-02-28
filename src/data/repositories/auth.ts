import { getRemoteConfig, getValue } from "@react-native-firebase/remote-config";
import { z } from "zod";

import { V1MessageSchema } from "../../common/types/umebo-api-schema";
import { firebaseProvider } from "../provider/firebase";
import { storageProvider } from "../provider/storage";
import { umeboapiProvider } from "../provider/umebo-api";

class AuthRepository {
    private umeboapiProvider: typeof umeboapiProvider;
    private firebaseProvider: typeof firebaseProvider;
    private storageProvider: typeof storageProvider;
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
     * ユーザーがログイン済みかどうかを確認する
     * @returns 学籍番号とパスワードが保存されていればtrue
     */
    public async isLoggedIn(): Promise<boolean> {
        const studentId = await this.storageProvider.getStudentId();
        const password = await this.storageProvider.getPassword();
        return studentId !== null && password !== null;
    }

    /**
     * 認証情報をセキュアストレージに保存する
     * @param studentId - 学籍番号
     * @param password - パスワード
     */
    public async saveCredentials(studentId: string, password: string): Promise<void> {
        await Promise.all([this.storageProvider.setStudentId(studentId), this.storageProvider.setPassword(password)]);
    }

    /** セキュアストレージから認証情報を削除する */
    public async clearCredentials(): Promise<void> {
        await Promise.all([this.storageProvider.removeStudentId(), this.storageProvider.removePassword()]);
    }

    /**
     * 保存された学籍番号を取得する
     * @returns 学籍番号、未保存の場合はnull
     */
    public async getStudentId(): Promise<string | null> {
        return this.storageProvider.getStudentId();
    }

    /**
     * 保存されたパスワードを取得する
     * @returns パスワード、未保存の場合はnull
     */
    public async getPassword(): Promise<string | null> {
        return this.storageProvider.getPassword();
    }
}

export const authRepository = new AuthRepository();
