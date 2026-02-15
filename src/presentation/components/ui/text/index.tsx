import React from "react";
import { Text as RNText } from "react-native";
import type { VariantProps } from "@gluestack-ui/utils/nativewind-utils";

import { textStyle } from "./styles";

type ITextProps = React.ComponentPropsWithRef<typeof RNText> & VariantProps<typeof textStyle>;

export function Text({
    className,
    isTruncated,
    bold,
    underline,
    strikeThrough,
    sub,
    italic,
    highlight,
    ...props
}: ITextProps) {
    return (
        <RNText
            className={textStyle({
                isTruncated,
                bold,
                underline,
                strikeThrough,
                sub,
                italic,
                highlight,
                class: className,
            })}
            {...props}
        />
    );
}
