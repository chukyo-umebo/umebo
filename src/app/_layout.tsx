import { useLayoutEffect } from "react";
import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";

export default function RootLayout() {
    // ダークモード対応
    const colorMode = useColorScheme();
    useLayoutEffect(() => {
        SystemUI.setBackgroundColorAsync(colorMode === "dark" ? "#000" : "#ffffff");
        setStatusBarStyle(colorMode === "dark" ? "light" : "dark");
    }, [colorMode]);

    return (
        <Stack
            screenOptions={{
                contentStyle: { backgroundColor: "#0000" },
                headerShown: false,
            }}
        >
            <Stack.Screen name="index" />
        </Stack>
    );
}
