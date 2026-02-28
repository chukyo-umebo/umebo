import { GoogleSignin, isSuccessResponse, SignInSuccessResponse } from "@react-native-google-signin/google-signin";
import { jwtDecode } from "jwt-decode";

import { authRepository } from "@/data/repositories/auth";

export type GoogleSignInFlowResult =
    | { kind: "success"; studentId: string; firebaseUser: SignInSuccessResponse["data"] }
    | { kind: "cancelled" }
    | { kind: "invalid-domain"; email: string; allowedDomain: string }
    | { kind: "error"; error: unknown };

class GoogleSignInService {
    private authRepository: typeof authRepository;
    /** @param _authRepository - 認証リポジトリのインスタンス */
    constructor(_authRepository = authRepository) {
        this.authRepository = _authRepository;
    }

    /** Google Sign-Inの設定を初期化する */
    public async init() {
        GoogleSignin.configure({
            hostedDomain: authRepository.allowedMailDomain,
            webClientId: authRepository.webClientId,
            offlineAccess: true,
        });
    }

    /** Googleアカウントからサインアウトする */
    public async signOut(): Promise<void> {
        await GoogleSignin.signOut();
    }

    /**
     * サイレントサインインを試みる
     * @returns サインイン成功時にtrue、失敗時にfalseを返す
     */
    public async silentSignIn(): Promise<boolean> {
        try {
            const response = await GoogleSignin.signInSilently();

            if (response.type === "success") {
                return true;
            }
        } catch (error) {
            console.error("Googleサイレントサインインに失敗しました:", error);
        }
        return false;
    }

    /**
     * 現在ログイン中のユーザーの学籍番号を取得する
     * @returns 学籍番号、取得失敗時はnull
     */
    public async getLoggedInStudentId(): Promise<string | null> {
        try {
            const tokens = await GoogleSignin.getTokens();
            const parsed = jwtDecode<{ email: string }>(tokens.idToken);
            return this.extractStudentId(parsed.email);
        } catch (error) {
            console.error("ログイン中のユーザーの学生IDの取得に失敗しました:", error);
            return null;
        }
    }

    /**
     * Googleアカウントでサインインフローを実行する
     * @returns サインイン結果（成功、キャンセル、ドメイン不正、エラーのいずれか）
     */
    public async signInWithGoogle(): Promise<GoogleSignInFlowResult> {
        try {
            await this.signOut();
            const response = await GoogleSignin.signIn();

            // ユーザーがキャンセルした場合
            if (!isSuccessResponse(response)) {
                return { kind: "cancelled" };
            }

            // メールドメインの検証
            const email = response.data.user.email;
            if (!email.endsWith(authRepository.allowedMailDomain)) {
                return {
                    kind: "invalid-domain",
                    email,
                    allowedDomain: authRepository.allowedMailDomain,
                };
            }

            // ユーザー情報を取得
            const firebaseUser = response.data;
            // UMEBOにログイン
            await this.authRepository.loginUmeboAPI();

            return {
                kind: "success",
                firebaseUser,
                studentId: this.extractStudentId(firebaseUser.user.email),
            };
        } catch (error) {
            console.error("Googleサインインに失敗しました:", error);
            return { kind: "error", error };
        }
    }

    /**
     * メールアドレスから学籍番号を抽出する
     * @param email - メールアドレス
     * @returns @より前の文字列（学籍番号）
     */
    private extractStudentId(email: string): string {
        return email.split("@")[0] ?? email;
    }
}

export const googleSignInService = new GoogleSignInService();
