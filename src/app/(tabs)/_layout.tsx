import React from "react";
import { Stack, useSegments } from "expo-router";

import { MainFooter } from "@/components/parts/footer";
import HeaderGradient from "@/components/template/main/HeaderGradient";

export default function TabsLayout() {
    const segments = useSegments();
    const lastSegment = segments[segments.length - 1];

    return (
        <>
            <HeaderGradient />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: "#0000" },
                    animation: "none",
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="bus" />
                <Stack.Screen name="assignment" />
                <Stack.Screen name="calendar" />
                <Stack.Screen name="timetable" />
            </Stack>
            <MainFooter activeTab={getActiveTabFromSegment(lastSegment)} />
        </>
    );
}

function getActiveTabFromSegment(
    segment: string | undefined
): "home" | "bus" | "assignment" | "calendar" | "timetable" {
    switch (segment) {
        case undefined:
        case "index":
            return "home";
        case "bus":
            return "bus";
        case "assignment":
            return "assignment";
        case "calendar":
            return "calendar";
        case "timetable":
            return "timetable";
        default:
            return "home";
    }
}
