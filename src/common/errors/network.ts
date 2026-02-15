import { ErrorFactory } from "@praha/error-factory";

export class ChukyoMaintenanceError extends ErrorFactory({
    name: "ChukyoMaintenanceError",
    message: "ポータルサイトがメンテナンス中です。時間をおいて再度お試しください。",
}) {}

export class UMEBOAPIMaintenanceError extends ErrorFactory({
    name: "UMEBOAPIMaintenanceError",
    message: "UMEBOがメンテナンス中です。時間をおいて再度お試しください。",
}) {}
export class TimeoutError extends ErrorFactory({
    name: "TimeoutError",
    message: "リクエストがタイムアウトしました。",
}) {}

export class NetworkError extends ErrorFactory({
    name: "NetworkError",
    message: "ネットワークエラーが発生しました",
}) {}
