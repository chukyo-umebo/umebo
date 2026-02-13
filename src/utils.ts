import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

export function buildTermString(): string {
    dayjs.extend(utc);
    dayjs.extend(timezone);
    const jstNow = dayjs().tz("Asia/Tokyo");
    const year = jstNow.year();
    const month = jstNow.month() + 1;
    const day = jstNow.date();

    // 春学期: 2月20日～8月31日
    // 秋学期: 9月1日～翌年2月19日
    if ((month === 2 && day >= 20) || (month >= 3 && month <= 8)) {
        // 春学期
        return `${year}S`;
    } else {
        // 秋学期
        const academicYear = month >= 9 ? year : year - 1;
        return `${academicYear}F`;
    }
}
