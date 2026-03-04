import React from "react";
import { Stack } from "expo-router";





export default function TabsLayout() {
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
