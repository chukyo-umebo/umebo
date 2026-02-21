import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { toast } from "@backpackapp-io/react-native-toast";
import { z } from "zod";

import { V1TimetableSchema } from "@/common/types/umebo-api-schema";
import { timetableRepository } from "@/data/repositories/timetable";
import { ClassCard } from "@/presentation/components/parts/class-card";
import { MainTemplate } from "@/presentation/components/template/main";
import { Text } from "@/presentation/components/ui/text";
import { useChukyoShibboleth } from "@/presentation/contexts/ChukyoShibbolethContext";

const DAYS = ["mon", "tue", "wed", "thu", "fri"];
const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI"];
const PERIODS = [1, 2, 3, 4, 5];
const PERIOD_TIMES = [
    { start: "09:30", end: "11:00" },
    { start: "11:10", end: "12:40" },
    { start: "13:40", end: "15:10" },
    { start: "15:20", end: "16:50" },
    { start: "17:00", end: "18:30" },
];

const COLORS = [
    "#f36e88", // Pink
    "#ad5ddc", // Purple
    "#ff852e", // Orange
    "#77d03b", // Green
    "#2e6bff", // Blue
    "#ff6ab0", // Pink2
];

function getClassColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % COLORS.length;
    return COLORS[index];
}

type TimetableData = z.infer<typeof V1TimetableSchema>;

export default function TimetableScreen() {
    const { chukyoShibbolethAuth } = useChukyoShibboleth();
    const [timetable, setTimetable] = useState<TimetableData | null>(null);

    const onRefresh = useCallback(async () => {
        try {
            await toast.promise(timetableRepository.updateTimetable(chukyoShibbolethAuth), {
                loading: "時間割を更新中...",
                success: "時間割が更新されました",
                error: "時間割の更新に失敗しました",
            });
        } catch (e) {
            console.error("Failed to refresh timetable", e);
        }
    }, [chukyoShibbolethAuth]);

    const fetchTimetable = useCallback(async () => {
        try {
            let chacheData = await timetableRepository.getTimetable(true);
            setTimetable(chacheData);

            let data = await timetableRepository.getTimetable();
            if (data.classes.length === 0) {
                await onRefresh();
                data = await timetableRepository.getTimetable();
            }
            setTimetable(data);
        } catch (e) {
            console.error("Failed to fetch timetable", e);
        }
    }, [onRefresh]);

    useEffect(() => {
        fetchTimetable();
    }, [fetchTimetable]);

    const getClassForSlot = (day: string, period: number) => {
        if (!timetable) return null;
        const slotId = `${day}-${period}`;
        // Note: The schema defines timetable strings like "mon-1", "tue-3"
        // Ensure "day" matches keys used in timetable.ts (which maps "日"->"sun", "月"->"mon")
        return timetable.classes.find((c) => c.timetable && c.timetable.includes(slotId));
    };

    return (
        <MainTemplate
            title="時間割"
            subtitle="現在自分が履修している授業の時間割を確認できます"
            refreshFunction={async () => {
                await onRefresh();
                await fetchTimetable();
            }}
        >
            <View className="w-full items-center">
                {/* Timetable Grid Container */}
                <View className="w-[380px] rounded-[16px] border-[3px] border-[#f9f7f6] bg-white p-[12px]">
                    {/* Header Row */}
                    <View className="mb-1 w-full flex-row">
                        <View className="mr-1 w-[30px]" />
                        {DAY_LABELS.map((label) => (
                            <View
                                key={label}
                                className="ml-[2px] h-[16px] flex-1 items-center justify-center rounded-[44px] bg-[#f9f7f6]"
                            >
                                <Text className="text-[10px] font-bold text-[#1b1a19]">{label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Periods Rows */}
                    {PERIODS.map((period, pIndex) => (
                        <View key={period} className="mt-1 min-h-[80px] w-full flex-row">
                            {/* Time Column */}
                            <View className="mr-1 w-[30px] items-center justify-center rounded-[44px] bg-[#f9f7f6] py-1">
                                <Text className="text-[8px] font-semibold text-[#5d5b59]">
                                    {PERIOD_TIMES[pIndex]!.start}
                                </Text>
                                <Text className="my-0.5 text-[10px] font-bold text-[#1b1a19]">{period}</Text>
                                <Text className="text-[8px] font-semibold text-[#5d5b59]">
                                    {PERIOD_TIMES[pIndex]!.end}
                                </Text>
                            </View>

                            {/* Days Columns */}
                            {DAYS.map((day) => {
                                const classInfo = getClassForSlot(day, period);
                                const color = classInfo
                                    ? getClassColor(classInfo.name) || "transparent"
                                    : "transparent";

                                return (
                                    <ClassCard
                                        key={`${day}-${period}`}
                                        className="ml-[2px] h-full flex-1"
                                        subject={
                                            classInfo
                                                ? {
                                                      subject: classInfo ? classInfo.name : "",
                                                      room: classInfo ? classInfo.appData?.room || "" : "",
                                                      color,
                                                  }
                                                : undefined
                                        }
                                    />
                                );
                            })}
                        </View>
                    ))}
                </View>

                {/* Today's items - Placeholder based on design */}
                <View className="mt-4 w-[380px] flex-row items-center gap-2">
                    <View className="rounded-[21px] bg-[#eff3fd] px-3 py-1">
                        <Text className="text-[12px] font-semibold text-[#2e6bff]">本日持ち物</Text>
                    </View>
                    <Text className="text-[14px] font-medium text-[#1b1a19]">体育館シューズ、数学教科書</Text>
                </View>
            </View>
        </MainTemplate>
    );
}
