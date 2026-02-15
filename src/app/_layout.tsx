import React, { useEffect, useLayoutEffect, useRef } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, useGlobalSearchParams, usePathname, useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { Toasts } from "@backpackapp-io/react-native-toast";
import { getAnalytics, logEvent } from "@react-native-firebase/analytics";
import * as firebase from "@react-native-firebase/app";

import { GluestackUIProvider } from "@/presentation/components/ui/gluestack-ui-provider";
import { AuthStateProvider, useAuthState } from "@/presentation/contexts/AuthStateContext";
import { ChukyoShibbolethProvider } from "@/presentation/contexts/ChukyoShibbolethContext";

import "./global.css";

import ChukyoShibbolethWebView, { shibbolethWebViewRef } from "@/data/clients/chukyo-shibboleth";
import { appInfoRepository } from "@/data/repositories/app-info";
import { googleSignInService } from "@/domain/services/google-signin";

// @@iconify-code-gen

function Routes() {
    const { isLoggedIn } = useAuthState();
    const router = useRouter();

    // すぐにやるとios版でrouteが設定されておらずエラーを吐くことがあるため仕方なくsetTimeoutする
    setTimeout(() => {
        // 開発モード時はメンテナンス・強制アップデート画面にリダイレクトしない
        if (__DEV__) {
            return;
        }

        if (appInfoRepository.isUnderMaintenance()) {
            if (router.canDismiss()) {
                router.dismissAll();
            }
            router.replace("/maintenance");
        }

        if (appInfoRepository.isNeededUpdate()) {
            if (router.canDismiss()) {
                router.dismissAll();
            }
            router.replace("/force-update");
        }
    }, 10);

    return (
        <Stack
            screenOptions={{
                contentStyle: { backgroundColor: "#0000" },
                headerShown: false,
            }}
        >
            <Stack.Protected guard={isLoggedIn}>
                <Stack.Screen name="(tabs)" />
            </Stack.Protected>
            <Stack.Screen name="login" />
            <Stack.Screen name="maintenance" />
            <Stack.Screen name="force-update" />
        </Stack>
    );
}

export default function RootLayout() {
    const pathname = usePathname();
    const params = useGlobalSearchParams();
    const colorMode = useColorScheme();
    const isDarkMode = colorMode === "dark";

    const shibbolethRef = useRef<shibbolethWebViewRef>(null);

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
        SystemUI.setBackgroundColorAsync(isDarkMode ? "#000" : "#F9F7F6");
        setStatusBarStyle(isDarkMode ? "light" : "dark");
    }, [isDarkMode]);
    // 初期設定
    useEffect(() => {
        googleSignInService.init();
        googleSignInService.silentSignIn().then((isSuccess) => {
            if (isSuccess) {
                // TODO: FCMトークンの更新処理を別サービスから呼び出す
            }
        });
    }, []);

    return (
        <GestureHandlerRootView>
            <GluestackUIProvider mode={colorMode ?? "light"}>
                <AuthStateProvider>
                    <ChukyoShibbolethProvider authRef={shibbolethRef}>
                        <ChukyoShibbolethWebView ref={shibbolethRef} />
                        <Toasts />
                        <Routes />
                    </ChukyoShibbolethProvider>
                </AuthStateProvider>
            </GluestackUIProvider>
        </GestureHandlerRootView>
    );
}
