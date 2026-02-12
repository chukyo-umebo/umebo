import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { updateAuthState } from "@/contexts/AuthStateContext";
import { authRepository } from "@/data/repositories/auth";

class authService {
    private authRepository: typeof authRepository;
    constructor(_authRepository = authRepository) {
        this.authRepository = _authRepository;
    }

    public async signOut(): Promise<void> {
        await GoogleSignin.signOut();
        await this.authRepository.clearCredentials();
        updateAuthState(false);
    }

    public async loginChukyo(studentId: string, password: string): Promise<boolean> {
        await this.authRepository.saveCredentials(studentId, password);
        updateAuthState(true);
        return true;
    }
}

export const AuthService = new authService();
