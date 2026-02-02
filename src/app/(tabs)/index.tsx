import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, TouchableOpacity, View } from "react-native";
import Animated, { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useListTopPadding } from "@/hooks/useListTopPadding";

export default function Index() {
    const [refreshing, setRefreshing] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const insets = useSafeAreaInsets();
    const topPadding = useListTopPadding();
    const height = useSharedValue(0);

    useEffect(() => {
        height.value = scrollY;
    }, [height, scrollY]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 2000);
    }, []);

    return (
        <View className="flex-1">
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[0]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} progressViewOffset={topPadding} />
                }
                onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
            >
                <Header title="ホーム" subtitle="すぐに使いたい機能が揃ってます" scrollY={scrollY} />
                <View className="flex-1" style={{ paddingLeft: insets.left, paddingRight: insets.right }}>
                    <View className="gap-3 rounded-[36px_36px_0_0] bg-background px-4 pt-10">
                        <InfoView />

                        <TimetableView />

                        <BusTimeView />

                        <QuickAccessIcons />
                    </View>
                </View>
            </ScrollView>
            <Animated.View className="absolute bottom-0 -z-10 h-[1px] w-screen bg-background" style={{ height }} />
        </View>
    );
}

function InfoView() {
    const [scrollHeight, setScrollHeight] = useState(0);
    const maxHeight = 183;
    const isScrollNeeded = scrollHeight > maxHeight;

    const info = [
        {
            title: "大学でクマが発生しました",
            description: "大学でクマが発生しました。登校時にクマに遭遇する可能性があるので気をつけてください。",
            date: new Date("2026-02-22"),
            department: "学生支援課",
        },
        {
            title: "大学でクマが発生しました",
            description: "大学でクマが発生しました。登校時にクマに遭遇する可能性があるので気をつけてください。",
            date: new Date("2026-02-22"),
            department: "学生支援課",
        },
        {
            title: "大学でクマが発生しました",
            description: "大学でクマが発生しました。登校時にクマに遭遇する可能性があるので気をつけてください。",
            date: new Date("2026-02-22"),
            department: "学生支援課",
        },
        {
            title: "大学でクマが発生しました",
            description: "大学でクマが発生しました。登校時にクマに遭遇する可能性があるので気をつけてください。",
            date: new Date("2026-02-22"),
            department: "学生支援課",
        },
    ].slice(0, 4);

    return (
        <Card className="rounded-2xl p-3">
            <View className="mb-2.5 flex-row items-center justify-between pl-1">
                <Text className="text-lg font-bold text-[#1b1a19]">お知らせ</Text>
                <TouchableOpacity className="flex-row items-center gap-1.5 rounded-full bg-[#eff3fd] px-3 py-1">
                    <Text className="text-xs font-bold text-[#2e6bff]">もっと見る</Text>
                    <Text className="text-xs text-[#2e6bff]">›</Text>
                </TouchableOpacity>
            </View>

            <View className="overflow-hidden rounded-2xl border-4 border-[#F9F7F6]" style={{ maxHeight: maxHeight }}>
                <ScrollView
                    onContentSizeChange={(_, height) => {
                        setScrollHeight(height);
                    }}
                >
                    {info.map((item, index) => {
                        return (
                            <View className="gap-1 px-2 py-1.5" key={index}>
                                <Text numberOfLines={1} className="text-sm font-medium text-[#1b1a19]">
                                    {item.title}
                                </Text>
                                <Text numberOfLines={1} className="text-xs font-medium text-[#1b1a19]">
                                    {item.description}
                                </Text>
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-xs text-[#b8b6b4]">{item.date.toLocaleDateString()}</Text>
                                    <Text className="text-xs text-[#b8b6b4]">{item.department}</Text>
                                </View>
                            </View>
                        );
                    })}
                    {info.length === 0 && (
                        <View className="items-center justify-center py-6">
                            <Text className="text-sm text-[#b8b6b4]">お知らせはありません</Text>
                        </View>
                    )}
                    {isScrollNeeded && <View style={{ height: 50 }} />}
                </ScrollView>
                {isScrollNeeded && (
                    <LinearGradient
                        colors={["#fff0", "white"]}
                        style={{ flex: 1, position: "absolute", bottom: 0, left: 0, right: 0, height: 50 }}
                    />
                )}
            </View>
        </Card>
    );
}

function TimetableView() {
    const timetableData = [
        { period: 1, subject: "コンピュータネットワーク", room: "1425", color: "#2e6bff" },
        { period: 2, subject: "コンピュータネットワーク", room: "1425", color: "#f36e88" },
        { period: 3, subject: null, room: null, color: null },
        { period: 4, subject: null, room: null, color: null },
        { period: 5, subject: "コンピュータネットワーク", room: "1425", color: "#ad5ddc" },
    ];
    const belongings = "体育館シューズ、数学教科書";

    return (
        <Card className="h-[213px] rounded-2xl bg-white p-3">
            <View className="mb-4 flex-row items-center justify-between pl-1">
                <Text className="text-lg font-bold text-[#1b1a19]">時間割</Text>
                <TouchableOpacity className="flex-row items-center gap-1.5 rounded-full bg-[#eff3fd] px-3 py-1">
                    <Text className="text-xs font-bold text-[#2e6bff]">全て確認</Text>
                    <Text className="text-xs text-[#2e6bff]">›</Text>
                </TouchableOpacity>
            </View>

            <View className="gap-2">
                {/* Timetable Grid */}
                <View className="h-[120px] flex-row gap-0.5">
                    {timetableData.map((item) => (
                        <View key={item.period} className="flex-1 gap-0.5">
                            <View className="h-4 items-center justify-center rounded-full bg-[#f9f7f6]">
                                <Text className="text-[10px] font-bold text-[#1b1a19]">{item.period}</Text>
                            </View>
                            {item.subject ? (
                                <View
                                    className="flex-1 justify-between rounded-[10px] p-1"
                                    style={{ backgroundColor: item.color! }}
                                >
                                    <Text className="text-center text-[10px] font-semibold leading-[11px] text-white">
                                        {item.subject}
                                    </Text>
                                    <View className="rounded-full bg-white px-1.5 py-0.5">
                                        <Text
                                            className="text-center text-[10px] font-medium"
                                            style={{ color: item.color! }}
                                        >
                                            {item.room}
                                        </Text>
                                    </View>
                                </View>
                            ) : (
                                <View className="flex-1 items-center justify-center rounded-lg bg-white">
                                    <View className="h-5 w-5 rounded-full bg-[#f9f7f6]" />
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                {/* 本日持ち物 */}
                <View className="flex-row items-center gap-2">
                    <View className="rounded-full bg-[#eff3fd] px-3 py-1">
                        <Text className="text-xs font-semibold text-[#2e6bff]">本日持ち物</Text>
                    </View>
                    <Text className="text-sm font-medium text-[#1b1a19]">{belongings}</Text>
                </View>
            </View>
        </Card>
    );
}

function BusTimeView() {
    const nextBusTime = "15分30秒";

    return (
        <Card className="flex-row gap-4 rounded-2xl bg-white p-3">
            <View className="justify-center gap-2 px-2">
                <Text className="pl-1 text-lg font-bold text-[#1b1a19]">次のバス時間</Text>
                <TouchableOpacity className="flex-row items-center gap-1.5 rounded-full bg-[#eff3fd] px-3 py-1">
                    <Text className="text-xs font-bold text-[#2e6bff]">他の時間も見る</Text>
                    <Text className="text-xs text-[#2e6bff]">›</Text>
                </TouchableOpacity>
            </View>
            <View className="h-[60px] flex-1 items-center justify-center rounded-lg bg-[#eff3fd]">
                <Text className="text-[28px] font-medium text-[#2e6bff]">{nextBusTime}</Text>
            </View>
        </Card>
    );
}

function QuickAccessIcons() {
    const icons = [
        { name: "Albo", icon: "アイコン" },
        { name: "MaNaBo", icon: "アイコン" },
        { name: "Albo", icon: "アイコン" },
        { name: "MaNaBo", icon: "アイコン" },
        { name: "Albo", icon: "アイコン" },
        { name: "Albo", icon: "アイコン" },
        { name: "Albo", icon: "アイコン" },
        { name: "Albo", icon: "アイコン" },
    ];

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2.5">
            <View className="flex-row gap-2.5">
                {icons.map((item, index) => (
                    <TouchableOpacity key={index} className="items-center gap-2.5 rounded-lg bg-[#eff3fd] px-3 py-2.5">
                        <View className="h-[35px] w-[35px] items-center justify-center rounded-full bg-blue-200">
                            <Text className="text-[5px] font-semibold text-[#2e6bff]">{item.icon}</Text>
                        </View>
                        <Text className="text-[10px] font-semibold text-[#2e6bff]">{item.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}
