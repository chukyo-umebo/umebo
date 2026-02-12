
import { GoogleSignin, isSuccessResponse, SignInSuccessResponse } from "@react-native-google-signin/google-signin";

import { authRepository } from "@/data/repositories/auth";

export type GoogleSignInFlowResult =
    | { kind: "success"; studentId: string; firebaseUser: SignInSuccessResponse["data"] }
    | { kind: "cancelled" }
    | { kind: "invalid-domain"; email: string; allowedDomain: string }
    | { kind: "error"; error: unknown };

class GoogleSignInService {
    private authRepository;
    constructor(_authRepository = authRepository) {
        this.authRepository = _authRepository;
    }

    public configure() {
        GoogleSignin.configure({
            hostedDomain: "m.chukyo-u.ac.jp",
            webClientId: "293922024536-gji1lfv0ij6m36posdfodh5k3n79260n.apps.googleusercontent.com",
            offlineAccess: true,
        });
    }

    public async signInWithGoogle(): Promise<GoogleSignInFlowResult> {
        try {
            await GoogleSignin.signOut();
            const response = await GoogleSignin.signIn();

            // ユーザーがキャンセルした場合
            if (!isSuccessResponse(response)) {
                return { kind: "cancelled" };
            }

            // メールドメインの検証
            const email = response.data.user.email;
            if (!email.endsWith("m.chukyo-u.ac.jp")) {
                return {
                    kind: "invalid-domain",
                    email,
                    allowedDomain: "m.chukyo-u.ac.jp",
                };
            }

            // ユーザー情報を取得
            const firebaseUser = response.data;
            // PalAPIにログイン
            await this.authRepository.login();

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

    private extractStudentId(email: string): string {
        return email.split("@")[0] ?? email;
    }
}

export const googleSignInService = new GoogleSignInService();
