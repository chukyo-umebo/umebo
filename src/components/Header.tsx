import { useEffect } from "react";
import { View } from "react-native";
import Animated, { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function Header({ title, subtitle, scrollY }: { title: string; subtitle: string; scrollY: number }) {
    const insets = useSafeAreaInsets();
    const paddingBottom = 16;
    const textOpacity = useSharedValue(1);
    const gradientOpacity = useSharedValue(0);

    useEffect(() => {
        textOpacity.value = Math.max(paddingBottom - scrollY, 0) / paddingBottom;
        gradientOpacity.value = 1 - Math.max(paddingBottom - scrollY, 0) / paddingBottom;
    }, [textOpacity, gradientOpacity, scrollY]);

    const AnimatedHeading = Animated.createAnimatedComponent(Heading);
    const AnimatedText = Animated.createAnimatedComponent(Text);

    return (
        <View>
            <View className="absolute inset-0 top-0" style={{ opacity: gradientOpacity.value }}>
                <LinearGradient
                    // Background Linear Gradient
                    colors={["white", "#fff0"]}
                    style={{ flex: 1 }}
                />
            </View>
            <Animated.View style={{ paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }}>
                <View className="flex items-center gap-1 px-4" style={{ paddingBottom }}>
                    <AnimatedHeading size="2xl" className="font-bold" style={{ opacity: textOpacity }}>
                        {title}
                    </AnimatedHeading>
                    <AnimatedText className="font-medium" style={{ opacity: textOpacity }} sub>
                        {subtitle}
                    </AnimatedText>
                </View>
            </Animated.View>
        </View>
    );
}
