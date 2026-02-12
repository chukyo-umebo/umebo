import { tva } from "@gluestack-ui/utils/nativewind-utils";

export const buttonStyle = tva({
    base: "flex-row items-center",
    variants: {
        size: {
            small: "px-2.5 py-1 gap-1.5 rounded-full",
        },
        color: {
            primary: "bg-[#eff3fd]",
        },
    },
});

export const buttonTextStyle = tva({
    base: "text-[#2e6bff]",
    parentVariants: {
        size: {
            small: "text-xs font-bold",
        },
        color: {
            primary: "text-[#2e6bff]",
        },
    },
    variants: {},
});

export const buttonRightIconStyle = tva({
    base: "",
    parentVariants: {
        size: {
            small: "text-xs",
        },
        color: {
            primary: "text-[#2e6bff]",
        },
    },
    variants: {},
});
