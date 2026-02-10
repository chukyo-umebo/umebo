import React from "react";
import { View } from "react-native";
import { type VariantProps } from "@gluestack-ui/utils/nativewind-utils";

import { cardStyle } from "./styles";

type IButtonProps = React.ComponentPropsWithRef<typeof View> &
    VariantProps<typeof cardStyle> & {
        showRightIcon?: boolean;
    };
export function Card({ className, size = "lg", variant, showRightIcon, ...props }: IButtonProps) {
    return <View className={cardStyle({ size, variant, class: className })} {...props} />;
}
