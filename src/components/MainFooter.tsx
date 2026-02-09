import React from "react";
import { Pressable, View } from "react-native";
import { Iconify } from "react-native-iconify";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Href, useRouter } from "expo-router";

import { Text } from "./ui/text";

type FooterTab = "home" | "bus" | "assignment" | "timetable" | "calendar";

type FooterProps = {
    activeTab?: FooterTab;
};

export default function Footer({ activeTab = "home" }: FooterProps) {
    const router = useRouter();

    const tabs: { id: FooterTab; icon: string; label: string; href: Href }[] = [
        { id: "home", icon: "bxs:home-alt-2", label: "ホーム", href: "/" },
        { id: "bus", icon: "bxs:bus", label: "バス", href: "/bus" },
        { id: "assignment", icon: "bxs:notepad", label: "課題", href: "/assignment" },
        { id: "calendar", icon: "bxs:calendar-alt", label: "カレンダー", href: "/calendar" },
        { id: "timetable", icon: "bxs:time", label: "時間割", href: "/timetable" },
    ];

    const onTabPress = (href: Href) => {
        router.replace(href);
    };

    const insets = useSafeAreaInsets();

    return (
        <View
            style={{ paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }}
            className="bg-white"
        >
            <View className="h-14 max-w-[540px] flex-row items-center justify-between bg-white px-6">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <Pressable
                            key={tab.id}
                            className={`h-[43px] w-[59px] flex-col items-center justify-center rounded-[27px] ${
                                isActive ? "bg-[#eff3fd]" : ""
                            }`}
                            onPress={() => onTabPress?.(tab.href)}
                        >
                            <View>
                                <Iconify icon={tab.icon} size={24} color={isActive ? "#2e6bff" : "#6a6a6d"} />
                            </View>
                            <Text
                                className={`text-center text-[8px] font-semibold ${isActive ? "text-[#2e6bff]" : "text-[#6a6a6d]"}`}
                            >
                                {tab.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
