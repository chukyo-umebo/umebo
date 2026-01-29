import { Image, useColorScheme, useWindowDimensions, View } from "react-native";

export default function HeaderGradient() {
    const windowDimensions = useWindowDimensions();

    const colorMode = useColorScheme();
    const isDarkMode = colorMode === "dark";

    return (
        <View
            style={{
                width: windowDimensions.width,
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
            }}
        >
            <Image
                source={
                    isDarkMode
                        ? require("@/assets/imgs/header-gradiation-dark.png")
                        : require("@/assets/imgs/header-gradiation.png")
                }
                style={{ width: "100%", resizeMode: "stretch" }}
                blurRadius={4}
            />
        </View>
    );
}
