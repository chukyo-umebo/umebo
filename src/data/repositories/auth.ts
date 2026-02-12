import { firebaseProvider } from "../provider/firebase";
import { umeboapiProvider } from "../provider/umeboapi";

class AuthRepository {
    private umeboapiProvider: typeof umeboapiProvider;
    private firebaseProvider: typeof firebaseProvider;
    constructor(_umeboapiProvider = umeboapiProvider, _firebaseProvider = firebaseProvider) {
        this.umeboapiProvider = _umeboapiProvider;
        this.firebaseProvider = _firebaseProvider;
    }

    public async login(): Promise<Response> {
        const firebaseIdToken = await this.firebaseProvider.getFirebaseIdToken();

        return this.umeboapiProvider.login(firebaseIdToken);
    }
}

export const authRepository = new AuthRepository();
