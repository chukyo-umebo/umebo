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
            </Stack>
        </>
    );
}
