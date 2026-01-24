import { useEffect, useLayoutEffect } from "react";
import { useColorScheme } from "react-native";
import { Stack, useGlobalSearchParams, usePathname } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import analytics from "@react-native-firebase/analytics";

import "./global.css";

export default function RootLayout() {
    const pathname = usePathname();
    const params = useGlobalSearchParams();
    const colorMode = useColorScheme();

    // Firebase Analytics で画面遷移を記録
    useEffect(() => {
        analytics().logScreenView({
            screen_name: pathname,
            screen_class: pathname,
            params: JSON.stringify(params),
        });
    }, [pathname, params]);
    // ダークモード対応
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
