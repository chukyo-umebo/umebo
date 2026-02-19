import React from "react";
import { View } from "react-native";
import { Stack, useSegments } from "expo-router";

import { MainFooter } from "@/presentation/components/parts/footer";
import HeaderGradient from "@/presentation/components/template/main/HeaderGradient";
import { Text } from "@/presentation/components/ui/text";

export default function TabsLayout() {
    const segments = useSegments();
    const lastSegment = segments[segments.length - 1];

    // 取得内容は適宜調整
    const notification = {
        message: "今日が期限の課題が2つあります",
        color: "#e90000"
    };

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


            {(
                <View className="absolute bottom-[92px] left-0 right-0 items-center pointer-events-none z-50">

                    {/*バナー本体*/}
                    <View
                        style={{ backgroundColor: notification.color }}
                        className="px-6 py-2 rounded-full shadow-sm flex-row items-center mb-1"
                    >
                        <Text className="text-white font-bold text-xs text-center">
                            {notification.message}
                        </Text>
                    </View>

                    {/*吹き出しの三角*/}
                    <View
                        className="absolute bottom-0 left-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px]"
                        style={{ borderTopColor: notification.color, transform: [{ translateX: -6 }] }}
                    />
                </View>
            )}

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
