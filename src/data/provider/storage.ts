import * as SecureStore from "expo-secure-store";

class StorageProvider {
    private readonly namespace: string;

    /**
     * @param namespace ストレージ内でのキーのプレフィックス。異なる用途でキャッシュを分けたい場合に指定します。(英数字 or _ or -)の文字列を推奨します。
     */
    constructor(namespace = "umebo-storage") {
        this.namespace = namespace;
    }

    /* --- Secure Store --- */
    async getStudentId(): Promise<string | null> {
        const key = this.makeKey("student_id");
        return await SecureStore.getItemAsync(key);
    }
    async setStudentId(value: string): Promise<void> {
        const key = this.makeKey("student_id");
        await SecureStore.setItemAsync(key, value);
    }
    async removeStudentId(): Promise<void> {
        const key = this.makeKey("student_id");
        await SecureStore.deleteItemAsync(key);
    }

    async getPassword(): Promise<string | null> {
        const key = this.makeKey("password");
        return await SecureStore.getItemAsync(key);
    }
    async setPassword(value: string): Promise<void> {
        const key = this.makeKey("password");
        await SecureStore.setItemAsync(key, value, {
            keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
        });
    }
    async removePassword(): Promise<void> {
        const key = this.makeKey("password");
        await SecureStore.deleteItemAsync(key);
    }

    private makeKey(key: string): string {
        return `${this.namespace}.${key}`;
    }
}

export const storageProvider = new StorageProvider();
