import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";
import { useStyleContext, withStyleContext, type VariantProps } from "@gluestack-ui/utils/nativewind-utils";

import { Text } from "../text";
import { buttonRightIconStyle, buttonStyle, buttonTextStyle } from "./styles";

const SCOPE = "Button";

const ContextView = withStyleContext(TouchableOpacity, SCOPE);
type IButtonProps = React.ComponentPropsWithRef<typeof ContextView> &
    VariantProps<typeof buttonStyle> & {
        showRightIcon?: boolean;
    };
export function Button({
    className,
    children,
    size = "small",
    color = "primary",
    showRightIcon,
    ...props
}: IButtonProps) {
    const ContextValue = useMemo(() => ({ size, color }), [size, color]);
    let shouldShowRightIcon = showRightIcon;
    if (shouldShowRightIcon === undefined) {
        shouldShowRightIcon = size === "small";
    }
    return (
        <ContextView className={buttonStyle({ size, color, class: className })} {...props} context={ContextValue}>
            {children}
            {shouldShowRightIcon && <ButtonRightIcon />}
        </ContextView>
    );
}

type IButtonTextProps = React.ComponentPropsWithRef<typeof Text> & VariantProps<typeof buttonTextStyle>;
export function ButtonText({ className, size, color, ...props }: IButtonTextProps) {
    const { size: parentSize, color: parentColor } = useStyleContext(SCOPE);
    return (
        <Text
            className={buttonTextStyle({
                parentVariants: { size: parentSize, color: parentColor },
                size,
                color,
                class: className,
            })}
            {...props}
        />
    );
}

type IButtonRightIconProps = React.ComponentPropsWithRef<typeof Text> & VariantProps<typeof buttonRightIconStyle>;
export function ButtonRightIcon({ className, size, color, ...props }: IButtonRightIconProps) {
    const { size: parentSize, color: parentColor } = useStyleContext(SCOPE);
    return (
        <Text
            className={buttonRightIconStyle({
                parentVariants: { size: parentSize, color: parentColor },
                size,
                color,
                class: className,
            })}
            {...props}
        >
            ›
        </Text>
    );
}
