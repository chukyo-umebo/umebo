import React from "react";
import { Stack, Tabs } from "expo-router";

export default function TabsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0000" } }}>
            <Tabs.Screen name="index" />
        </Stack>
    );
}
