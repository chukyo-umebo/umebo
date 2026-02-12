import { Alert } from "react-native";
import { toast } from "@backpackapp-io/react-native-toast";

import { ShouldReSignInError } from "./errors/auth";

export function handleError(error: Error, isFatal: boolean) {
    console.log("JS Exception:", error, isFatal);
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

    console.log("Non-fatal error occurred:", realError.cause, realError.message, realError.name);
    if (typeof realError.message === "string") {
        toast.error(`エラー: ${realError.message}`);
    }

    if (error instanceof ShouldReSignInError) {
        // TODO: ログアウト処理を呼び出す
    }

    // Send to error monitoring service
}
