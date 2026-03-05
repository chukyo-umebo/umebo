import { useEffect } from "react";
import { Stack, usePathname, useRouter } from "expo-router";

import { LoginStep } from "@/domain/services/auth";
import { useAuthState } from "@/presentation/contexts/AuthStateContext";

export default function TabsLayout() {
    const { loginStep } = useAuthState();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Only strictly enforce routes within the /login stack itself
        if (!pathname.startsWith("/login")) return;

        if (loginStep === LoginStep.NotLoggedIn && pathname !== "/login" && pathname !== "/login/") {
            router.replace("/login");
        } else if (loginStep === LoginStep.GoogleSignIn && pathname !== "/login/chukyo-pass") {
            router.replace("/login/chukyo-pass");
        } else if (loginStep === LoginStep.IdPass && pathname !== "/login/chukyo-otp") {
            router.replace("/login/chukyo-otp");
        } else if (loginStep === LoginStep.LoggedIn && pathname !== "/login/option") {
            router.replace("/login/option");
        }
    }, [loginStep, pathname, router]);

    return (
        <>
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: "#0000" },
                    animation: "none",
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="chukyo-pass" />
                <Stack.Screen name="chukyo-otp" />
                <Stack.Screen name="option" />
            </Stack>
        </>
    );
}
