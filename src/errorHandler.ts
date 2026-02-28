import { Alert } from "react-native";
import { toast } from "@backpackapp-io/react-native-toast";

import { AuthService } from "@/domain/services/auth";
import { ShouldReSignInError } from "./common/errors/auth";

/**
 * グローバルなJavaScript例外を処理する
 * @param error - 発生したエラーオブジェクト
 * @param isFatal - 致命的なエラーかどうか
 */
export function handleError(error: Error, isFatal: boolean) {
    console.log("JS Exception:", error, isFatal);
    if (error.cause instanceof Error) console.log("Caused by:", error.cause);
    if (isFatal) {
        Alert.alert(
            "アプリ内で深刻なエラーが発生しました",
            `アプリの再起動をお願いします。

Error: ${error.name} ${error.message}
${error.stack}`
        );
        return;
    }

    let realError = error;
    if (error.message && error.message.includes("in promise") && error.cause instanceof Error) {
        realError = error.cause;
    }

    if (typeof realError.message === "string") {
        toast.error(`エラー: ${realError.message}`);
    }

    if (realError instanceof ShouldReSignInError) {
        // TODO: ログアウト処理を呼び出す
        AuthService.signOut();
    }

    // Send to error monitoring service
}
