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
    /** セキュアストレージから学籍番号を取得する */
    async getStudentId(): Promise<string | null> {
        const key = this.makeKey("student_id");
        return await SecureStore.getItemAsync(key);
    }
    /**
     * セキュアストレージに学籍番号を保存する
     * @param value - 保存する学籍番号
     */
    async setStudentId(value: string): Promise<void> {
        const key = this.makeKey("student_id");
        await SecureStore.setItemAsync(key, value);
    }
    /** セキュアストレージから学籍番号を削除する */
    async removeStudentId(): Promise<void> {
        const key = this.makeKey("student_id");
        await SecureStore.deleteItemAsync(key);
    }

    /** セキュアストレージからパスワードを取得する */
    async getPassword(): Promise<string | null> {
        const key = this.makeKey("password");
        return await SecureStore.getItemAsync(key);
    }
    /**
     * セキュアストレージにパスワードを保存する
     * @param value - 保存するパスワード
     */
    async setPassword(value: string): Promise<void> {
        const key = this.makeKey("password");
        await SecureStore.setItemAsync(key, value, {
            keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
        });
    }
    /** セキュアストレージからパスワードを削除する */
    async removePassword(): Promise<void> {
        const key = this.makeKey("password");
        await SecureStore.deleteItemAsync(key);
    }

    /**
     * ネームスペース付きのストレージキーを生成する
     * @param key - 元のキー名
     * @returns ネームスペースをプレフィックスとしたキー文字列
     */
    private makeKey(key: string): string {
        return `${this.namespace}.${key}`;
    }
}

export const storageProvider = new StorageProvider();
