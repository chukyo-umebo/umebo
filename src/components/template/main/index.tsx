import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import Animated, { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useListTopPadding } from "@/hooks/useListTopPadding";
import { Header } from "./Header";

function dummyRefresh() {
    return new Promise((resolve) => setTimeout(resolve, 2000));
}

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
                <Header
                    title={title}
                    subtitle={subtitle}
                    headerGradientOpacity={headerGradientOpacity}
                    headerTextOpacity={headerTextOpacity}
                    headerPaddingBottom={headerPaddingBottom}
                    insets={insets}
                    setHeaderHeight={setHeaderHeight}
                />
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
