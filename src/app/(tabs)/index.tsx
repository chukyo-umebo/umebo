import { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { ClassCard } from "@/components/parts/class-card";
import { MainTemplate } from "@/components/template/main";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

export default function Index() {
    return (
        <MainTemplate title="ホーム" subtitle="すぐに使いたい機能が揃ってます">
            <InfoView />

            <TimetableView />

            <BusTimeView />

            <QuickAccessIcons />
        </MainTemplate>
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
        <View className="">
            <View className="mb-2.5 flex-row items-center justify-between pl-1">
                <Text className="text-lg font-bold">お知らせ</Text>
                <Button>
                    <ButtonText>もっと見る</ButtonText>
                </Button>
            </View>

            <Card variant="outline" style={{ maxHeight: maxHeight }}>
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
            </Card>
        </View>
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
        <View>
            <View className="flex-row items-center justify-between pl-1">
                <Text className="text-lg font-bold text-[#1b1a19]">時間割</Text>
                <Button>
                    <ButtonText>全て確認</ButtonText>
                </Button>
            </View>

            <Card variant="outline" className="gap-2">
                {/* Timetable Grid */}
                <View className="h-[120px] flex-row gap-0.5">
                    {timetableData.map((item) => (
                        <View key={item.period} className="flex-1 gap-0.5">
                            <View className="h-4 items-center justify-center rounded-full bg-[#f9f7f6]">
                                <Text className="text-[10px] font-bold text-[#1b1a19]">{item.period}</Text>
                            </View>
                            <ClassCard
                                subject={
                                    item.subject
                                        ? { color: item.color!, subject: item.subject, room: item.room! }
                                        : undefined
                                }
                                className="flex-1"
                            />
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
            </Card>
        </View>
    );
}

function BusTimeView() {
    const nextBusTime = "15分30秒";

    return (
        <Card variant="outline" className="flex-row gap-4">
            <View className="justify-center gap-2 px-2">
                <Text className="pl-1 text-lg font-bold text-[#1b1a19]">次のバス時間</Text>
                <Button>
                    <ButtonText>
                        <Text className="text-xs font-bold text-[#2e6bff]">他の時間も見る</Text>
                    </ButtonText>
                </Button>
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
