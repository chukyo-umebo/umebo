import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { PasswordLoginSession } from "@/data/clients/chukyo-shibboleth-http";
import { storageProvider } from "@/data/provider/storage";
import { authRepository } from "@/data/repositories/auth";
import { updateAuthState } from "@/presentation/contexts/AuthStateContext";
import { googleSignInService } from "./google-signin";

export enum LoginStep {
    NotLoggedIn,
    GoogleSignIn,
    IdPass,
    LoggedIn,
}

class AuthService {
    private authRepository: typeof authRepository;
    private storageProvider: typeof storageProvider;
    private googleSignInService: typeof googleSignInService;
    constructor(
        _authRepository = authRepository,
        _storageProvider = storageProvider,
        _googleSignInService = googleSignInService
    ) {
        this.authRepository = _authRepository;
        this.storageProvider = _storageProvider;
        this.googleSignInService = _googleSignInService;
    }

    /** ユーザーをサインアウトし、認証情報をクリアする */
    public async signOut(): Promise<void> {
        await GoogleSignin.signOut();
        await this.authRepository.clearCredentials();
        updateAuthState(LoginStep.NotLoggedIn);
    }

    /**
     * ユーザーがログイン済みかどうかを確認する
     * @returns 学籍番号とパスワードが保存されていればtrue
     */
    public async getLoginStep(): Promise<LoginStep> {
        const hasStudentId = (await this.storageProvider.getStudentId()) !== null;
        const hasPassword = (await this.storageProvider.getPassword()) !== null;
        const hasPasskey = (await this.storageProvider.getPasskey()) !== null;
        const hasGoogleSignIn = (await this.googleSignInService.getLoggedInStudentId()) !== null;

        if (hasPasskey) {
            return LoginStep.LoggedIn;
        }
        if (!hasPasskey && hasStudentId && hasPassword) {
            return LoginStep.IdPass;
        }
        if (hasGoogleSignIn) {
            return LoginStep.GoogleSignIn;
        }
        return LoginStep.NotLoggedIn;
    }

    /**
     * 中京大学の認証情報でログインする
     * @param studentId - 学籍番号
     * @param password - パスワード
     * @returns ログイン成功時にtrueを返す
     */
    public async loginIdPass(studentId: string, password: string) {
        await this.authRepository.saveIdPass(studentId, password);
        updateAuthState(LoginStep.IdPass);
        return await this.authRepository.getLoginSession();
    }

    public async refreshLoginSession() {
        return await this.authRepository.getLoginSession();
    }

    /**
     * 中京大学のワンタイムパスコードでログインする
     * @param session - パスワード認証後のセッション情報
     * @param otp - ワンタイムパスコード
     */
    public async loginOTP(session: PasswordLoginSession, otp: string) {
        await this.authRepository.shibRegisterPasskeyWithOTP(session, otp);
        updateAuthState(LoginStep.LoggedIn);
    }
}

export const authService = new AuthService();
