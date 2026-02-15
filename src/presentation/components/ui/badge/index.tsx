import React from "react";
import { View } from "react-native";
import { useStyleContext, withStyleContext, type VariantProps } from "@gluestack-ui/utils/nativewind-utils";

import { Text } from "../text";
import { badgeStyle, badgeTextStyle } from "./styles";

const SCOPE = "Badge";

const ContextView = withStyleContext(View, SCOPE);

type IBadgeProps = React.ComponentPropsWithRef<typeof ContextView> & VariantProps<typeof badgeStyle>;

export function Badge({ className, children, ...props }: IBadgeProps) {
    return (
        <ContextView className={badgeStyle({ class: className })} {...props}>
            {children}
        </ContextView>
    );
}

type IBadgeTextProps = React.ComponentPropsWithRef<typeof Text> & VariantProps<typeof badgeTextStyle>;

export function BadgeText({ className, ...props }: IBadgeTextProps) {
    useStyleContext(SCOPE); // Ensuring context hook is used if needed in future
    return (
        <Text
            className={badgeTextStyle({
                class: className,
            })}
            {...props}
        />
    );
}
