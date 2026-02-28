import { z } from "zod";

import { ModeType } from "./index";

export const COLOR_NAMES = ["blue", "jelly", "purple", "orange", "green", "pink", "grey"] as const;
export const ColorName = z.enum(COLOR_NAMES);
export type ColorNameType = z.infer<typeof ColorName>;

const TIMETABLE_THEME_COLORS: Record<ModeType, Record<ColorNameType, string>> = {
    light: {
        blue: "#2e6bff",
        jelly: "#f36e88",
        purple: "#ad5ddc",
        orange: "#ff852e",
        green: "#77d03b",
        pink: "#ff6ab0",
        grey: "#cccccc",
    },
    dark: {
        blue: "#5c8cff",
        jelly: "#ff85a7",
        purple: "#bf7de6",
        orange: "#ff9b57",
        green: "#93df5d",
        pink: "#ff82c0",
        grey: "#9a9a9a",
    },
};

const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function normalizeHexColor(color: string): string {
    const normalized = color.toLowerCase();
    if (normalized.length === 4) {
        return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`;
    }
    return normalized;
}

export function resolveThemeColor(colorName: string | null | undefined, mode: ModeType): string {
    const normalized = colorName?.trim().toLowerCase() || "";
    const fallback = TIMETABLE_THEME_COLORS[mode].grey;

    if (!normalized) {
        return fallback;
    }

    if (HEX_COLOR_PATTERN.test(normalized)) {
        return normalizeHexColor(normalized);
    }

    const colorKey = ColorName.safeParse(normalized);
    if (colorKey.success) {
        const themedColor = TIMETABLE_THEME_COLORS[mode][colorKey.data];

        return themedColor;
    }

    return fallback;
}
