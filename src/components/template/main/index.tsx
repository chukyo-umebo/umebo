import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, useColorScheme, View } from "react-native";
import Animated, { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { Text } from "@/components/ui/text";
import { useListTopPadding } from "@/hooks/useListTopPadding";

function dummyRefresh() {
    return new Promise((resolve) => setTimeout(resolve, 2000));
}

const AnimatedText = Animated.createAnimatedComponent(Text);

export function MainTemplate({
    refreshFunction = dummyRefresh,
    title,
    subtitle,
    children,
}: {
    refreshFunction?: () => Promise<any>;
    title: string;
    subtitle: string;
    children?: React.ReactNode;
}) {
    const insets = useSafeAreaInsets();
    const colorMode = useColorScheme();
    const isDarkMode = colorMode === "dark";

    const [refreshing, setRefreshing] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const topPadding = useListTopPadding();
    const overScrollHeight = useSharedValue(0);

    useEffect(() => {
        overScrollHeight.value = scrollY + 100;
    }, [overScrollHeight, scrollY]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        refreshFunction().finally(() => setRefreshing(false));
    }, [refreshFunction]);

    const headerPaddingBottom = 16;
    const headerTextOpacity = useSharedValue(1);
    const headerGradientOpacity = useSharedValue(0);

    useEffect(() => {
        headerTextOpacity.value = Math.max(headerPaddingBottom - scrollY, 0) / headerPaddingBottom;
        headerGradientOpacity.value = 1 - Math.max(headerPaddingBottom - scrollY, 0) / headerPaddingBottom;
    }, [scrollY, headerTextOpacity, headerGradientOpacity]);

    const [scrollViewHeight, setScrollViewHeight] = useState(0);
    const [headerHeight, setHeaderHeight] = useState(0);

    const mainViewMinHeight = scrollViewHeight - headerHeight;

    return (
        <View className="flex-1">
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[0]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} progressViewOffset={topPadding} />
                }
                onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
                onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height)}
            >
                {/* ヘッダー */}
                <View>
                    <Animated.View className="absolute inset-0 top-0" style={{ opacity: headerGradientOpacity }}>
                        <LinearGradient
                            // Background Linear Gradient
                            colors={isDarkMode ? ["black", "#0000"] : ["white", "#fff0"]}
                            style={{ flex: 1 }}
                        />
                    </Animated.View>
                    <Animated.View
                        style={{ paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }}
                        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
                    >
                        <View className="flex items-center gap-1 px-4" style={{ paddingBottom: headerPaddingBottom }}>
                            <AnimatedText className="text-2xl font-bold" style={{ opacity: headerTextOpacity }}>
                                {title}
                            </AnimatedText>
                            <AnimatedText className="font-medium" style={{ opacity: headerTextOpacity }} sub>
                                {subtitle}
                            </AnimatedText>
                        </View>
                    </Animated.View>
                </View>
                {/* メイン部分 */}
                <View className="flex-1" style={{ paddingLeft: insets.left, paddingRight: insets.right }}>
                    <View
                        className="flex-1 rounded-[36px_36px_0_0] bg-background pt-10"
                        style={{ minHeight: mainViewMinHeight }}
                    >
                        {children}
                    </View>
                </View>
            </ScrollView>
            {/* メイン画面をオーバースクロールした際に、背景色が表示されるようにするためのView */}
            <Animated.View
                className="absolute bottom-0 -z-10 h-[1px] w-screen bg-background"
                style={{ height: overScrollHeight }}
            />
        </View>
    );
}
