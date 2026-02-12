import { ScrollView, View } from "react-native";
import { ErrorBoundaryProps, useRouter } from "expo-router";

import { ClassCard } from "@/components/parts/class-card";
import { QuickAccessIcon } from "@/components/parts/quick-access-icon";
import { MainTemplate } from "@/components/template/main";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ContentScrollView } from "@/components/ui/content-scroll-view";
import { Text } from "@/components/ui/text";
import { NetworkError } from "@/errors/network";

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
    return (
        <View style={{ flex: 1, backgroundColor: "red" }}>
            <Text>{error.message}</Text>
            <Text onPress={retry}>Try Again?</Text>
        </View>
    );
}

export default function Index() {
    const router = useRouter();
    return (
        <MainTemplate title="ホーム" subtitle="すぐに使いたい機能が揃ってます">
            <View className="gap-2">
                <Button
                    onPress={() => {
                        router.push("/login");
                    }}
                >
                    <ButtonText>ログイン画面を見る</ButtonText>
                </Button>
                <Button
                    onPress={() => {
                        throw new NetworkError();
                    }}
                >
                    <ButtonText>エラーを起こす</ButtonText>
                </Button>
            </View>

            <View className="gap-4">
                <InfoView />

                <TimetableView />

                <BusTimeView />

                <QuickAccessIconsView />
            </View>
        </MainTemplate>
    );
}

function MainHeader({
    title,
    buttonText,
    onButtonPress,
}: {
    title: string;
    buttonText: string;
    onButtonPress?: () => void;
}) {
    return (
        <View className="mb-2 flex-row items-center justify-between pl-3 pr-2">
            <Text className="text-lg font-bold">{title}</Text>
            <Button onPress={onButtonPress}>
                <ButtonText>{buttonText}</ButtonText>
            </Button>
        </View>
    );
}

function InfoView() {
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
        <View className="mx-3">
            <MainHeader title="お知らせ" buttonText="もっと見る" onButtonPress={() => {}} />

            <Card variant="outline">
                <ContentScrollView className="max-h-[183px] p-3">
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
                </ContentScrollView>
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
        <View className="mx-3">
            <MainHeader title="時間割" buttonText="すべて確認" onButtonPress={() => {}} />

            <Card variant="outline" className="gap-2 p-3">
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
                    <Badge>
                        <BadgeText>本日持ち物</BadgeText>
                    </Badge>
                    <Text className="text-sm font-medium text-[#1b1a19]">{belongings}</Text>
                </View>
            </Card>
        </View>
    );
}

function BusTimeView() {
    const nextBusTime = "15分30秒";

    return (
        <Card variant="outline" className="mx-3 flex-row gap-4 p-3">
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

function QuickAccessIconsView() {
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
        <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2.5">
                <View className="flex-row gap-2.5">
                    <View className="w-3" />
                    {icons.map((item, index) => (
                        <QuickAccessIcon key={index} name={item.name} icon={item.icon} />
                    ))}
                    <View className="w-3" />
                </View>
            </ScrollView>
        </View>
    );
}
