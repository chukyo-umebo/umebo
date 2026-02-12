import {
    signInWithCredential as firebaseSignInInWithCredential,
    getAuth,
    getIdToken,
    GoogleAuthProvider,
} from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { jwtDecode } from "jwt-decode";

import { ShouldReSignInError } from "@/errors/auth";

class FirebaseProvider {
    private firebaseIdToken: string | null = null;

    public async getFirebaseIdToken(): Promise<string> {
        if (!this.firebaseIdToken) {
            this.firebaseIdToken = await this.fetchFirebaseIdToken();
            return this.firebaseIdToken;
        }

        const decodedToken = jwtDecode<{ exp: number }>(this.firebaseIdToken);
        const currentTime = Math.floor(Date.now() / 1000);

        if (decodedToken.exp - currentTime < 5 * 60) {
            this.firebaseIdToken = await this.fetchFirebaseIdToken();
        }
        return this.firebaseIdToken;
    }

    private async fetchFirebaseIdToken(): Promise<string> {
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
            console.error("FirebaseのIDトークンの取得に失敗しました:", e);
            throw new ShouldReSignInError();
        }
    }
}
export const firebaseProvider = new FirebaseProvider();
