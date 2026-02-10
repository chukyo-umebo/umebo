import React, { useEffect, useState } from "react";
import {
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    ScrollViewProps,
    View,
} from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

export function ContentScrollView({ className, style, children, ...props }: ScrollViewProps) {
    const [layoutHeight, setLayoutHeight] = useState(0);
    const [contentHeight, setContentHeight] = useState(0);
    const [scrollY, setScrollY] = useState(0);

    const topOpacity = useSharedValue(0);
    const bottomOpacity = useSharedValue(0);

    const handleLayout = (e: LayoutChangeEvent) => {
        setLayoutHeight(e.nativeEvent.layout.height);
        props.onLayout?.(e);
    };

    const handleContentSizeChange = (w: number, h: number) => {
        setContentHeight(h);
        props.onContentSizeChange?.(w, h);
    };

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        setScrollY(e.nativeEvent.contentOffset.y);
        props.onScroll?.(e);
    };

    // Threshold to detect "scrolled away from edge"
    const threshold = 1;

    const showTopGradient = scrollY > threshold;
    // Check if content is scrollable and we are not at the bottom
    const showBottomGradient = contentHeight > layoutHeight && scrollY + layoutHeight < contentHeight - threshold;

    useEffect(() => {
        topOpacity.value = withTiming(showTopGradient ? 1 : 0, {
            duration: 300,
            easing: Easing.out(Easing.quad),
        });
    }, [showTopGradient]);

    useEffect(() => {
        bottomOpacity.value = withTiming(showBottomGradient ? 1 : 0, {
            duration: 300,
            easing: Easing.out(Easing.quad),
        });
    }, [showBottomGradient]);

    const topStyle = useAnimatedStyle(() => ({
        opacity: topOpacity.value,
    }));

    const bottomStyle = useAnimatedStyle(() => ({
        opacity: bottomOpacity.value,
    }));

    const GRADIENT_HEIGHT = 20;

    return (
        <View style={{ position: "relative" }}>
            <ScrollView
                persistentScrollbar={true}
                {...props}
                style={style}
                className={className}
                onLayout={handleLayout}
                onContentSizeChange={handleContentSizeChange}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {children}
            </ScrollView>

            <Animated.View
                pointerEvents="none"
                style={[
                    {
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: GRADIENT_HEIGHT,
                        zIndex: 1,
                    },
                    topStyle,
                ]}
            >
                <LinearGradient colors={["rgba(0,0,0,0.15)", "transparent"]} style={{ flex: 1 }} />
            </Animated.View>

            <Animated.View
                pointerEvents="none"
                style={[
                    {
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: GRADIENT_HEIGHT,
                        zIndex: 1,
                    },
                    bottomStyle,
                ]}
            >
                <LinearGradient colors={["transparent", "rgba(0,0,0,0.15)"]} style={{ flex: 1 }} />
            </Animated.View>
        </View>
    );
}
