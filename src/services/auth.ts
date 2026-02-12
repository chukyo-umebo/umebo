import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { authRepository } from "@/data/repositories/auth";

class authService {
    private authRepository: typeof authRepository;
    constructor(_authRepository = authRepository) {
        this.authRepository = _authRepository;
    }

    public async signOut(): Promise<void> {
        await GoogleSignin.signOut();
    }

    public async saveCredentials(studentId: string, password: string): Promise<void> {
        await this.authRepository.saveCredentials(studentId, password);
    }

    public async isLoggedIn(): Promise<boolean> {
        const studentId = await this.authRepository.getStudentId();
        const password = await this.authRepository.getPassword();
        return studentId !== null && password !== null;
    }
}

export const AuthService = new authService();
