import React, { useEffect } from "react";
import { LayoutAnimation, Platform, Pressable, UIManager, View } from "react-native";
import { Iconify } from "react-native-iconify";

type AccordionItemProps = {
    id: string;
    header: React.ReactNode;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    expanded?: boolean;
    onToggle?: (id: string, isExpanded: boolean) => void;
    headerClassName?: string;
    contentClassName?: string;
    showChevron?: boolean;
    chevronColor?: string;
    chevronSize?: number;
    rightAccessory?: React.ReactNode;
    animationEnabled?: boolean;
};

export function AccordionItem({
    id,
    header,
    children,
    defaultExpanded = true,
    expanded,
    onToggle,
    headerClassName,
    contentClassName,
    showChevron = true,
    chevronColor = "#1b1a19",
    chevronSize = 24,
    rightAccessory,
    animationEnabled = true,
}: AccordionItemProps) {
    const [internalExpanded, setInternalExpanded] = React.useState(defaultExpanded);
    const isControlled = expanded !== undefined;
    const isExpanded = isControlled ? expanded : internalExpanded;

    useEffect(() => {
        if (!animationEnabled) {
            return;
        }
        if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [animationEnabled, isExpanded]);

    useEffect(() => {
        if (isControlled) {
            setInternalExpanded(expanded ?? defaultExpanded);
        }
    }, [defaultExpanded, expanded, isControlled]);

    const handleToggle = () => {
        const next = !isExpanded;
        if (!isControlled) {
            setInternalExpanded(next);
        }
        onToggle?.(id, next);
    };

    return (
        <View className="gap-1.5">
            <Pressable
                onPress={handleToggle}
                className={`flex-row items-center justify-between ${headerClassName ?? ""}`}
                accessibilityRole="button"
            >
                <View className="flex-1">{header}</View>
                <View className="flex-row items-center gap-2">
                    {rightAccessory}
                    {showChevron ? (
                        <Iconify
                            icon="octicon:chevron-down-12"
                            size={chevronSize}
                            color={chevronColor}
                            style={{ transform: [{ rotate: isExpanded ? "0deg" : "-180deg" }] }}
                        />
                    ) : null}
                </View>
            </Pressable>
            {isExpanded ? <View className={contentClassName}>{children}</View> : null}
        </View>
    );
}

type AccordionProps = {
    children: React.ReactNode;
    className?: string;
};

export function Accordion({ children, className }: AccordionProps) {
    return <View className={className}>{children}</View>;
}
