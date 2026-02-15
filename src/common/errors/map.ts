import { ErrorFactory } from "@praha/error-factory";

export class MapError extends ErrorFactory({
    name: "MapError",
    message: "データ変換中にエラーが発生しました。",
}) {}
