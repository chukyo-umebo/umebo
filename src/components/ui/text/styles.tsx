import { tva } from "@gluestack-ui/utils/nativewind-utils";

export const textStyle = tva({
    base: `text-typography-500 font-body text-base`,

    variants: {
        isTruncated: {
            true: "web:truncate",
        },
        bold: {
            true: "font-bold",
        },
        underline: {
            true: "underline",
        },
        strikeThrough: {
            true: "line-through",
        },
        sub: {
            true: "text-xs text-typography-400",
        },
        italic: {
            true: "italic",
        },
        highlight: {
            true: "bg-yellow-500",
        },
    },
});
