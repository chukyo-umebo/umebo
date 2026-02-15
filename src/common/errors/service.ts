import { ErrorFactory } from "@praha/error-factory";

export class NotSetError extends ErrorFactory({
    name: "NotSetError",
    message: "内部的に必要な値が設定されていません",
}) {}

export class DataBuildError extends ErrorFactory({
    name: "DataBuildError",
    message: "データの構築に失敗しました",
}) {}
