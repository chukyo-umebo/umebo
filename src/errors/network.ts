import { ErrorFactory } from "@praha/error-factory";

export class ChukyoMaintenanceError extends ErrorFactory({
    name: "ChukyoMaintenanceError",
    message: "ポータルサイトがメンテナンス中です。",
}) {}

export class PalAPIMaintenanceError extends ErrorFactory({
    name: "PalAPIMaintenanceError",
    message: "PassPalがメンテナンス中です。",
}) {}
export class TimeoutError extends ErrorFactory({
    name: "TimeoutError",
    message: "リクエストがタイムアウトしました。",
}) {}

export class NetworkError extends ErrorFactory({
    name: "NetworkError",
    message: "ネットワークエラーが発生しました",
}) {}
