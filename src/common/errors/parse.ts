import { ErrorFactory } from "@praha/error-factory";

export class ParseError extends ErrorFactory({
    name: "ParseError",
    message: "データ解析中にエラーが発生しました。",
}) {}
