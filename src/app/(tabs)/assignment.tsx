import { ScrollView, TouchableOpacity, View } from "react-native";

import { MainTemplate } from "@/presentation/components/template/main";
import { Accordion, AccordionItem } from "@/presentation/components/ui/accordion";
import { Text } from "@/presentation/components/ui/text";

export default function Index() {
    const dateStrip = {
        todayLabel: "2025/10/23",
        dates: [
            { id: "2025-10-22", day: "22", weekday: "MON", isSelected: true },
            { id: "2025-10-23", day: "23", weekday: "TUE" },
            { id: "2025-10-24", day: "24", weekday: "WED" },
            { id: "2025-10-25", day: "25", weekday: "THU" },
            { id: "2025-10-26", day: "26", weekday: "FRI" },
            { id: "2025-10-27", day: "27", weekday: "SAT" },
            { id: "2025-10-28", day: "28", weekday: "SUN" },
        ],
    };

    const assignmentGroups: {
        id: string;
        dueDate: string;
        remainingLabel?: string;
        remainingTone?: "default" | "urgent";
        emoji?: string;
        defaultExpanded?: boolean;
        items: AssignmentItemData[];
    }[] = [
        {
            id: "group-urgent",
            dueDate: "2026/02/23",
            remainingLabel: "あと1日",
            remainingTone: "urgent" as const,
            emoji: "😱",
            defaultExpanded: true,
            items: [
                {
                    id: "item-1",
                    title: "レポート提出",
                    subject: "コンピュータネットワーク",
                    isCompleted: true,
                    isHighlighted: true,
                },
                {
                    id: "item-2",
                    title: "レポート提出",
                    subject: "コンピュータネットワーク",
                    dueTimeLabel: "16:00まで",
                },
                {
                    id: "item-3",
                    title: "レポート提出",
                    subject: "コンピュータネットワーク",
                    dueTimeLabel: "16:00まで",
                },
            ],
        },
        {
            id: "group-next",
            dueDate: "2026/02/23",
            remainingLabel: "あと2日",
            remainingTone: "default" as const,
            defaultExpanded: true,
            items: [
                {
                    id: "item-4",
                    title: "レポート提出",
                    subject: "コンピュータネットワーク",
                    dueTimeLabel: "16:00まで",
                },
                {
                    id: "item-5",
                    title: "レポート提出",
                    subject: "コンピュータネットワーク",
                    isCompleted: true,
                    isHighlighted: true,
                },
                {
                    id: "item-6",
                    title: "レポート提出",
                    subject: "コンピュータネットワーク",
                    isCompleted: true,
                    isHighlighted: true,
                },
                {
                    id: "item-7",
                    title: "レポート提出",
                    subject: "コンピュータネットワーク",
                    dueTimeLabel: "16:00まで",
                },
            ],
        },
        {
            id: "group-later",
            dueDate: "2026/02/23",
            remainingLabel: "あと3日",
            remainingTone: "default" as const,
            defaultExpanded: false,
            items: [],
        },
    ];

    return (
        <MainTemplate title="課題" subtitle="現在抱えている課題表示ページです">
            <View className="gap-4 px-4 pb-10">
                <AssignmentDateStrip todayLabel={dateStrip.todayLabel} dates={dateStrip.dates} />
                <Accordion className="gap-3">
                    {assignmentGroups.map((group) => (
                        <AccordionItem
                            key={group.id}
                            id={group.id}
                            defaultExpanded={group.defaultExpanded}
                            headerClassName="px-2"
                            contentClassName="gap-1"
                            header={
                                <AssignmentGroupHeader
                                    dueDate={group.dueDate}
                                    remainingLabel={group.remainingLabel}
                                    remainingTone={group.remainingTone}
                                    emoji={group.emoji}
                                />
                            }
                        >
                            {group.items.map((item) => (
                                <AssignmentItemRow key={item.id} item={item} />
                            ))}
                        </AccordionItem>
                    ))}
                </Accordion>
            </View>
        </MainTemplate>
    );
}

export type AssignmentDateChip = {
    id: string;
    day: string;
    weekday: string;
    isSelected?: boolean;
};

type AssignmentDateStripProps = {
    todayLabel: string;
    dates: AssignmentDateChip[];
    onDatePress?: (date: AssignmentDateChip) => void;
};

export function AssignmentDateStrip({ todayLabel, dates, onDatePress }: AssignmentDateStripProps) {
    return (
        <View className="gap-1">
            <View className="pl-2">
                <Text className="text-[1.25rem] font-semibold text-[#2e6bff]">{todayLabel}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
                <View className="w-2" />
                <View className="flex-row gap-1">
                    {dates.map((date) => {
                        const isSelected = date.isSelected;
                        return (
                            <TouchableOpacity
                                key={date.id}
                                activeOpacity={0.8}
                                className={`h-[4rem] w-[3.5rem] rounded-[0.625rem] p-1 ${
                                    isSelected ? "bg-[#eff3fd]" : "border-2 border-[#f9f7f6]"
                                }`}
                                onPress={() => onDatePress?.(date)}
                            >
                                <View className="flex-1 items-center justify-center">
                                    <Text
                                        className={`text-[1.5rem] font-semibold ${
                                            isSelected ? "text-[#2e6bff]" : "text-[#626160]"
                                        }`}
                                    >
                                        {date.day}
                                    </Text>
                                </View>
                                <View
                                    className={`items-center rounded-full px-2 py-1 ${
                                        isSelected ? "bg-white" : "bg-transparent"
                                    }`}
                                >
                                    <Text
                                        className={`text-[0.625rem] font-medium ${
                                            isSelected ? "text-[#2e6bff]" : "text-[#626160]"
                                        }`}
                                    >
                                        {date.weekday}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                <View className="w-2" />
            </ScrollView>
        </View>
    );
}

type AssignmentGroupHeaderProps = {
    dueDate: string;
    remainingLabel?: string;
    remainingTone?: "default" | "urgent";
    emoji?: string;
};

export function AssignmentGroupHeader({
    dueDate,
    remainingLabel,
    remainingTone = "default",
    emoji,
}: AssignmentGroupHeaderProps) {
    const remainingColor = remainingTone === "urgent" ? "text-[#e90000]" : "text-[#1b1a19]";
    const dateColor = remainingTone === "urgent" ? "text-[#e90000]" : "text-[#1b1a19]";

    return (
        <View className="flex-row items-center gap-1.5">
            <Text className={`text-[0.875rem] font-semibold ${dateColor}`}>{dueDate}</Text>
            {remainingLabel ? (
                <View className="flex-row items-center gap-0.5">
                    <Text className={`text-[0.875rem] font-semibold ${remainingColor}`}>{remainingLabel}</Text>
                    {emoji ? <Text className="text-[0.875rem]">{emoji}</Text> : null}
                </View>
            ) : null}
        </View>
    );
}

export type AssignmentItemData = {
    id: string;
    title: string;
    subject: string;
    dueTimeLabel?: string;
    isCompleted?: boolean;
    isHighlighted?: boolean;
};

type AssignmentItemRowProps = {
    item: AssignmentItemData;
};

export function AssignmentItemRow({ item }: AssignmentItemRowProps) {
    const isHighlighted = item.isHighlighted;
    const textColor = isHighlighted ? "text-[#2e6bff]" : "text-[#1b1a19]";
    const subjectColor = isHighlighted ? "text-[#2e6bff]" : "text-[#b8b6b4]";

    return (
        <View
            className={`flex-row items-center gap-2 rounded-2xl px-4 py-2 ${
                isHighlighted ? "bg-[#eff3fd]" : "border-2 border-[#f9f7f6] bg-white"
            }`}
        >
            <View
                className={`h-4 w-4 items-center justify-center rounded-full border-2 ${
                    item.isCompleted ? "border-[#2e6bff] bg-[#2e6bff]" : "border-[#e5e5e5] bg-white"
                }`}
            ></View>
            <View className="flex-1">
                <Text className={`text-[1rem] font-semibold ${textColor}`}>{item.title}</Text>
                <Text className={`text-[0.75rem] font-semibold ${subjectColor}`}>{item.subject}</Text>
            </View>
            {item.dueTimeLabel ? (
                <Text className="text-[0.6875rem] font-semibold text-[#e90000]">{item.dueTimeLabel}</Text>
            ) : null}
        </View>
    );
}
