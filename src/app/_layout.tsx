import React, { useEffect, useLayoutEffect } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, useGlobalSearchParams, usePathname } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { getAnalytics, logEvent } from "@react-native-firebase/analytics";
import * as firebase from "@react-native-firebase/app";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";

import "./global.css";

export default function RootLayout() {
    const pathname = usePathname();
    const params = useGlobalSearchParams();
    const colorMode = useColorScheme();
    const isDarkMode = colorMode === "dark";

    // Firebase Analytics で画面遷移を記録
    useEffect(() => {
        const analytics = getAnalytics(firebase.getApp());
        logEvent(analytics, "screen_view", {
            screen_name: pathname,
            screen_class: pathname,
            params: JSON.stringify(params),
        });
    }, [pathname, params]);
    // ダークモード対応
    useLayoutEffect(() => {
        SystemUI.setBackgroundColorAsync(isDarkMode ? "#000" : "#fff");
        setStatusBarStyle(isDarkMode ? "light" : "dark");
    }, [isDarkMode]);

    return (
        <GestureHandlerRootView>
            <GluestackUIProvider mode={colorMode ?? "light"}>
                <Stack
                    screenOptions={{
                        contentStyle: { backgroundColor: "#0000" },
                        headerShown: false,
                    }}
                >
                    <Stack.Screen name="(tabs)" />
                </Stack>
            </GluestackUIProvider>
        </GestureHandlerRootView>
    );
}
