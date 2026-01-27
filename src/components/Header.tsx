import { Image, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function Header({ title, subtitle }: { title: string; subtitle: string }) {
    const windowDimensions = useWindowDimensions();
    return (
        <View className="px-4 pb-4">
            <View className="items-center">
                <View
                    style={{
                        width: windowDimensions.width,
                        position: "absolute",
                    }}
                >
                    <Image
                        source={require("@/assets/imgs/header-gradiation.png")}
                        style={{ width: "100%", resizeMode: "stretch" }}
                        blurRadius={4}
                    />
                </View>
                <SafeAreaView edges={["top", "left", "right"]}>
                    <View className="flex items-center gap-1">
                        <Heading size="2xl" className="font-bold">
                            {title}
                        </Heading>
                        <Text className="font-medium text-[#5d5b59]" sub>
                            {subtitle}
                        </Text>
                    </View>
                </SafeAreaView>
            </View>
        </View>
    );
}
