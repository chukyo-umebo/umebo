import { tva } from "@gluestack-ui/utils/nativewind-utils";

export const cardStyle = tva({
    base: "overflow-hidden bg-background",
    variants: {
        size: {
            lg: "rounded-2xl",
        },
        variant: {
            outline: "border-[3px] border-[#F9F7F6]",
        },
    },
});
