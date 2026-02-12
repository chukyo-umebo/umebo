import { umeboapiProvider } from "../provider/umeboapi";

class AuthRepository {
    private umeboapiProvider: typeof umeboapiProvider;
    constructor(_umeboapiProvider = umeboapiProvider) {
        this.umeboapiProvider = _umeboapiProvider;
    }

    public login(firebaseIdToken: string): Promise<void> {
        return this.umeboapiProvider.login(firebaseIdToken);
    }
}

export const authRepository = new AuthRepository();
