import {
    signInWithCredential as firebaseSignInInWithCredential,
    getAuth,
    getIdToken,
    GoogleAuthProvider,
} from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { jwtDecode } from "jwt-decode";

import { ShouldGoogleSignInError } from "@/errors/auth";

class FirebaseProvider {
    public async getFirebaseIdToken(): Promise<string> {
        try {
            // 1. Google Sign-Inからトークンを取得
            let idToken: string, accessToken: string;
            try {
                const tokens = await GoogleSignin.getTokens();
                idToken = tokens.idToken;
                accessToken = tokens.accessToken;
            } catch {
                throw new ShouldGoogleSignInError();
            }
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
            console.log("Firebase ID Token:", jwtDecode(firebaseIdToken));
            return firebaseIdToken;
        } catch (e) {
            throw new Error(e instanceof Error ? e.message : "不明なエラー");
        }
    }
}
export const firebaseProvider = new FirebaseProvider();
