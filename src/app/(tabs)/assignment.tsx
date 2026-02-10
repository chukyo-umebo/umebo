import { View } from "react-native";

import {
    AssignmentDateStrip,
    AssignmentGroupHeader,
    AssignmentItemRow,
    type AssignmentItemData,
} from "@/components/parts/assignment";
import { MainTemplate } from "@/components/template/main";
import { Accordion, AccordionItem } from "@/components/ui/accordion";

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
