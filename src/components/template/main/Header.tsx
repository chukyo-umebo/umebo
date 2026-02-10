import { useColorScheme, View } from "react-native";
import Animated, { SharedValue } from "react-native-reanimated";
import { EdgeInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { Text } from "@/components/ui/text";

const AnimatedText = Animated.createAnimatedComponent(Text);

type Props = {
    title: string;
    subtitle: string;
    headerGradientOpacity: SharedValue<number>;
    headerTextOpacity: SharedValue<number>;
    headerPaddingBottom: number;
    insets: EdgeInsets;
    setHeaderHeight: (height: number) => void;
};

export function Header({
    title,
    subtitle,
    headerGradientOpacity,
    headerTextOpacity,
    headerPaddingBottom,
    insets,
    setHeaderHeight,
}: Props) {
    const colorMode = useColorScheme();
    const isDarkMode = colorMode === "dark";

    return (
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
    );
}
