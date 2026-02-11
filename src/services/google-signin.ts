import {
    signInWithCredential as firebaseSignInInWithCredential,
    getAuth,
    getIdToken,
    GoogleAuthProvider,
} from "@react-native-firebase/auth";
import { GoogleSignin, isSuccessResponse, SignInSuccessResponse } from "@react-native-google-signin/google-signin";

export type GoogleSignInFlowResult =
    | { kind: "success"; studentId: string; firebaseUser: SignInSuccessResponse["data"] }
    | { kind: "cancelled" }
    | { kind: "invalid-domain"; email: string; allowedDomain: string }
    | { kind: "error"; error: unknown };

class GoogleSignInService {
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
            const firebaseIdToken = await this.getFirebaseIdToken();
            const firebaseUser = response.data;
            // PalAPIにログイン
            // this.authRepository.login(firebaseIdToken);
            console.log("Firebase ID Token:", firebaseIdToken);
            // Firebaseユーザー情報をストアに保存
            // useAuth.getState().setFirebaseUser(firebaseUser);

            return {
                kind: "success",
                firebaseUser,
                studentId: this.extractStudentId(firebaseUser.user.email),
            };
        } catch (error) {
            return { kind: "error", error };
        }
    }

    public async getFirebaseIdToken(): Promise<string> {
        try {
            // 1. Google Sign-Inからトークンを取得
            const { idToken, accessToken } = await GoogleSignin.getTokens();
            // 2. IDトークンからFirebase認証用Credentialを作成
            const googleCredential = GoogleAuthProvider.credential(idToken, accessToken);
            // 3. Firebaseにサインイン
            const auth = getAuth();
            await firebaseSignInInWithCredential(auth, googleCredential);
            // 4. Firebase発行のIDトークンを取得
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("Firebaseの現在のユーザーが存在しません");
            const firebaseIdToken = await getIdToken(currentUser);
            if (!firebaseIdToken) throw new Error("FirebaseのIDトークンが取得できません");
            return firebaseIdToken;
        } catch (e) {
            console.error("Firebase IDトークンの取得に失敗しました:", e);
            throw new Error(e instanceof Error ? e.message : "不明なエラー");
        }
    }

    private extractStudentId(email: string): string {
        return email.split("@")[0] ?? email;
    }
}

export const googleSignInService = new GoogleSignInService();
