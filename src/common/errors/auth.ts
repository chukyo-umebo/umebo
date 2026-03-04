import { ErrorFactory } from "@praha/error-factory";

export class UnauthorizedError extends ErrorFactory({
    name: "UnauthorizedError",
    message: "ログインに失敗しました。IDまたはパスワードが正しくありません。",
}) {}

export class ExpiredSessionError extends ErrorFactory({
    name: "ExpiredSessionError",
    message: "セッションの有効期限が切れました。キャッシュクリアして再度試してください。",
}) {}

export class PasskeyNotRegisteredError extends ErrorFactory({
    name: "PasskeyNotRegisteredError",
    message: "Passkeyが登録されていません。ID/PWでログインしてからPasskeyを登録してください。",
}) {}

export class AuthProcessError extends ErrorFactory({
    name: "AuthProcessError",
    message: "認証処理中にエラーが発生しました。",
}) {}

export class OtpNotEnabledError extends ErrorFactory({
    name: "OtpNotEnabledError",
    message:
        "OTP認証が有効ではありません。中京大学認証画面の「Configure 2FA or Biometrics」からOTPを有効化してください。",
}) {}

export class ShouldReSignInError extends ErrorFactory({
    name: "ShouldReSignInError",
    message: "認証に失敗しました。再度サインインしてください。",
}) {}
