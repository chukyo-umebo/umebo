import { getRemoteConfig, getValue } from "@react-native-firebase/remote-config";
import { z } from "zod";

import { firebaseProvider } from "../provider/firebase";
import { storageProvider } from "../provider/storage";
import { umeboapiProvider } from "../provider/umebo-api";
import { V1MessageSchema } from "../types/umebo-api-schema";

class AuthRepository {
    private umeboapiProvider: typeof umeboapiProvider;
    private firebaseProvider: typeof firebaseProvider;
    private storageProvider: typeof storageProvider;
    constructor(
        _umeboapiProvider = umeboapiProvider,
        _firebaseProvider = firebaseProvider,
        _storageProvider = storageProvider
    ) {
        this.umeboapiProvider = _umeboapiProvider;
        this.firebaseProvider = _firebaseProvider;
        this.storageProvider = _storageProvider;
    }

    get allowedMailDomain(): string {
        return getValue(getRemoteConfig(), "allowedMailDomain").asString();
    }

    get webClientId(): string {
        return getValue(getRemoteConfig(), "webClientId").asString();
    }

    public async loginUmeboAPI(): Promise<z.infer<typeof V1MessageSchema>> {
        const firebaseIdToken = await this.firebaseProvider.getFirebaseIdToken();

        return this.umeboapiProvider.login(firebaseIdToken);
    }

    public async isLoggedIn(): Promise<boolean> {
        const studentId = await this.storageProvider.getStudentId();
        const password = await this.storageProvider.getPassword();
        return studentId !== null && password !== null;
    }

    public async saveCredentials(studentId: string, password: string): Promise<void> {
        await Promise.all([this.storageProvider.setStudentId(studentId), this.storageProvider.setPassword(password)]);
    }

    public async clearCredentials(): Promise<void> {
        await Promise.all([this.storageProvider.removeStudentId(), this.storageProvider.removePassword()]);
    }

    public async getStudentId(): Promise<string | null> {
        return this.storageProvider.getStudentId();
    }

    public async getPassword(): Promise<string | null> {
        return this.storageProvider.getPassword();
    }
}

export const authRepository = new AuthRepository();
