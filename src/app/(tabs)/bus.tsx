import React, { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";

import { MainTemplate } from "@/presentation/components/template/main";
import { Button, ButtonText } from "@/presentation/components/ui/button";
import { Card } from "@/presentation/components/ui/card";
import { Text } from "@/presentation/components/ui/text";

export default function Index() {
    // 取得内容、関数は適宜調整
    const univBusTimes= ["15分30秒", "25分30秒"];
    const stationBusTimes = ["10分30秒", "20分30秒"];

    const [activeTab, setActiveTab] = useState<"univ" | "station">("univ");

    return (
        <MainTemplate title="バス" subtitle="豊田キャンパスのバスの時間がわかります">
            <View className="gap-4 px-3 pt-2 pb-10">
                <View className="flex-row gap-4 px-2 mb-2">
                    <TouchableOpacity onPress={() => setActiveTab("univ")}>
                        <Text className={`text-[1.25rem] font-bold ${activeTab === "univ" ? "text-[#1b1a19]" : "text-[#b8b6b4]"}`}>
                            大学から
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab("station")}>
                        <Text className={`text-[1.25rem] font-bold ${activeTab === "station" ? "text-[#1b1a19]" : "text-[#b8b6b4]"}`}>
                            駅から
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ gap: 16 }}>
                    {(activeTab === "univ" ? univBusTimes : stationBusTimes).map((time, index) => (
                        <BusTimeView key={index} time={time} />
                    ))}
                </ScrollView>
            </View>
        </MainTemplate>
    );
}


// ほぼほぼindexのもの。components/parts/に作る？
function BusTimeView({ time }: { time: string }) {
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
                <Text className="text-[28px] font-medium text-[#2e6bff]">{time}</Text>
            </View>
        </Card>
    );
}