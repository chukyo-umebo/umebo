import { ErrorFactory } from "@praha/error-factory";

export class ShouldRefreshTimetableError extends ErrorFactory({
    name: "ShouldRefreshTimetableError",
    message: "時間割を更新する必要があります",
}) {}
