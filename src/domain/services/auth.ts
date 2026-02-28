import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { authRepository } from "@/data/repositories/auth";
import { updateAuthState } from "@/presentation/contexts/AuthStateContext";

class authService {
    private authRepository: typeof authRepository;
    /** @param _authRepository - 認証リポジトリのインスタンス */
    constructor(_authRepository = authRepository) {
        this.authRepository = _authRepository;
    }

    /** ユーザーをサインアウトし、認証情報をクリアする */
    public async signOut(): Promise<void> {
        await GoogleSignin.signOut();
        await this.authRepository.clearCredentials();
        updateAuthState(false);
    }

    /**
     * 中京大学の認証情報でログインする
     * @param studentId - 学籍番号
     * @param password - パスワード
     * @returns ログイン成功時にtrueを返す
     */
    public async loginChukyo(studentId: string, password: string): Promise<boolean> {
        await this.authRepository.saveCredentials(studentId, password);
        updateAuthState(true);
        return true;
    }
}

export const AuthService = new authService();
