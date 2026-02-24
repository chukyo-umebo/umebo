import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { z } from "zod";

import { V1AssignmentsSchema } from "@/common/types/umebo-api-schema";
import { assignmentRepository } from "@/data/repositories/assignment";
import { MainTemplate } from "@/presentation/components/template/main";
import { Accordion, AccordionItem } from "@/presentation/components/ui/accordion";
import { Text } from "@/presentation/components/ui/text";

const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_IN_MS = 1000 * 60 * 60 * 24;

type Assignment = z.infer<typeof V1AssignmentsSchema>["assignments"][number];

function pad2(value: number) {
    return value.toString().padStart(2, "0");
}

function toDateKey(date: Date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatDateFromKey(dateKey: string) {
    return dateKey.replace(/-/g, "/");
}

function toDayLabel(dateKey: string) {
    return dateKey.slice(-2);
}

function toWeekdayLabel(dateKey: string) {
    const date = new Date(`${dateKey}T00:00:00`);
    return WEEKDAY_LABELS[date.getDay()] ?? "SUN";
}

function toDueDateKey(assignment: Assignment) {
    if (!assignment.dueAt) {
        return undefined;
    }
    const date = new Date(assignment.dueAt);
    if (Number.isNaN(date.getTime())) {
        return undefined;
    }
    return toDateKey(date);
}

function buildRemainingLabel(dateKey: string) {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dueDate = new Date(`${dateKey}T00:00:00`);
    const diffDays = Math.floor((dueDate.getTime() - todayStart.getTime()) / DAY_IN_MS);

    if (diffDays < 0) {
        return { label: "期限超過", tone: "urgent" as const, emoji: "😱" };
    }
    if (diffDays === 0) {
        return { label: "今日まで", tone: "urgent" as const, emoji: "😱" };
    }
    if (diffDays === 1) {
        return { label: "あと1日", tone: "urgent" as const, emoji: "😱" };
    }
    return { label: `あと${diffDays}日`, tone: "default" as const, emoji: undefined };
}

function toDueTimeLabel(dueAt?: string) {
    if (!dueAt) {
        return undefined;
    }
    const date = new Date(dueAt);
    if (Number.isNaN(date.getTime())) {
        return undefined;
    }
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}まで`;
}

function sortAssignments(items: Assignment[]) {
    return [...items].sort((a, b) => {
        if (a.doneAt && !b.doneAt) return 1;
        if (!a.doneAt && b.doneAt) return -1;
        if (!a.dueAt || !b.dueAt) return 0;
        return a.dueAt.localeCompare(b.dueAt);
    });
}

export default function Index() {
    const [assignmentData, setAssignmentData] = useState<z.infer<typeof V1AssignmentsSchema>>({ assignments: [] });
    const [selectedDateId, setSelectedDateId] = useState<string | undefined>(undefined);
    const [contentStartY, setContentStartY] = useState(0);
    const groupYMapRef = useRef<Record<string, number>>({});
    const mainScrollRef = useRef<ScrollView>(null);

    const fetchAssignments = useCallback(async () => {
        const cache = await assignmentRepository.getAssignments(true);
        if (cache.assignments.length > 0) {
            setAssignmentData(cache);
        }

        const latest = await assignmentRepository.getAssignments();
        setAssignmentData(latest);
    }, []);

    useEffect(() => {
        fetchAssignments().catch((error) => {
            console.error("Failed to fetch assignments", error);
        });
    }, [fetchAssignments]);

    const assignmentsByDate = useMemo(() => {
        const grouped = new Map<string, Assignment[]>();
        for (const assignment of assignmentData.assignments) {
            const dueDateKey = toDueDateKey(assignment);
            if (!dueDateKey) {
                continue;
            }
            const current = grouped.get(dueDateKey) ?? [];
            current.push(assignment);
            grouped.set(dueDateKey, current);
        }
        return grouped;
    }, [assignmentData.assignments]);

    const dueDateKeys = useMemo(() => {
        return Array.from(assignmentsByDate.keys()).sort((a, b) => a.localeCompare(b));
    }, [assignmentsByDate]);

    const undatedAssignments = useMemo(() => {
        return sortAssignments(assignmentData.assignments.filter((assignment) => !toDueDateKey(assignment)));
    }, [assignmentData.assignments]);

    useEffect(() => {
        if (dueDateKeys.length === 0) {
            setSelectedDateId(undefined);
            return;
        }
        if (!selectedDateId || !dueDateKeys.includes(selectedDateId)) {
            setSelectedDateId(dueDateKeys[0]);
        }
    }, [dueDateKeys, selectedDateId]);

    const dateStrip: { todayLabel: string; dates: AssignmentDateChip[] } = useMemo(() => {
        const selectedLabel = selectedDateId ? formatDateFromKey(selectedDateId) : "期限日なし";
        return {
            todayLabel: selectedLabel,
            dates: dueDateKeys.map((dateKey) => ({
                id: dateKey,
                day: toDayLabel(dateKey),
                weekday: toWeekdayLabel(dateKey),
                isSelected: dateKey === selectedDateId,
            })),
        };
    }, [dueDateKeys, selectedDateId]);

    const assignmentGroups = useMemo(() => {
        const dueDateGroups = dueDateKeys.map((dateKey) => {
            const remaining = buildRemainingLabel(dateKey);
            const items = sortAssignments(assignmentsByDate.get(dateKey) ?? []);
            return {
                id: dateKey,
                dueDate: formatDateFromKey(dateKey),
                remainingLabel: remaining.label,
                remainingTone: remaining.tone,
                emoji: remaining.emoji,
                defaultExpanded: true,
                items,
            };
        });

        if (undatedAssignments.length === 0) {
            return dueDateGroups;
        }

        return [
            {
                id: "undated",
                dueDate: "期限未設定",
                remainingLabel: undefined,
                remainingTone: "default" as const,
                emoji: undefined,
                defaultExpanded: true,
                items: undatedAssignments,
            },
            ...dueDateGroups,
        ];
    }, [assignmentsByDate, dueDateKeys, undatedAssignments]);

    const handleDatePress = useCallback(
        (date: AssignmentDateChip) => {
            setSelectedDateId(date.id);
            const targetGroupY = groupYMapRef.current[date.id];
            if (targetGroupY === undefined) {
                return;
            }
            mainScrollRef.current?.scrollTo({ y: contentStartY + targetGroupY - 8, animated: true });
        },
        [contentStartY]
    );

    return (
        <MainTemplate
            title="課題"
            subtitle="現在抱えている課題表示ページです"
            scrollViewRef={mainScrollRef}
            refreshFunction={async () => {
                await fetchAssignments();
            }}
        >
            <View
                className="gap-4 px-4 pb-10"
                onLayout={(event) => {
                    setContentStartY(event.nativeEvent.layout.y);
                }}
            >
                <AssignmentDateStrip
                    todayLabel={dateStrip.todayLabel}
                    dates={dateStrip.dates}
                    onDatePress={handleDatePress}
                />
                <Accordion className="gap-3">
                    {assignmentGroups.map((group) => (
                        <View
                            key={group.id}
                            onLayout={(event) => {
                                groupYMapRef.current[group.id] = event.nativeEvent.layout.y;
                            }}
                        >
                            <AccordionItem
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
                                    <AssignmentItemRow
                                        key={item.id}
                                        assignment={item}
                                        isHighlighted={group.remainingTone === "urgent"}
                                    />
                                ))}
                                {group.items.length === 0 ? (
                                    <View className="items-center justify-center rounded-2xl border-2 border-[#f9f7f6] bg-white py-3">
                                        <Text className="text-[0.875rem] font-medium text-[#b8b6b4]">
                                            この日の課題はありません
                                        </Text>
                                    </View>
                                ) : null}
                            </AccordionItem>
                        </View>
                    ))}
                </Accordion>
                {assignmentGroups.length === 0 ? (
                    <View className="items-center justify-center rounded-2xl border-2 border-[#f9f7f6] bg-white py-4">
                        <Text className="text-[0.875rem] font-medium text-[#b8b6b4]">期限付き課題はありません</Text>
                    </View>
                ) : null}
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

type AssignmentItemRowProps = {
    assignment: Assignment;
    isHighlighted?: boolean;
};

export function AssignmentItemRow({ assignment, isHighlighted }: AssignmentItemRowProps) {
    const textColor = isHighlighted ? "text-[#2e6bff]" : "text-[#1b1a19]";
    const subjectColor = isHighlighted ? "text-[#2e6bff]" : "text-[#b8b6b4]";
    const title = assignment.appData?.title || assignment.classDetail?.name || "課題";
    const subject = assignment.appData?.directoryName || assignment.manaboId;
    const dueTimeLabel = toDueTimeLabel(assignment.dueAt);

    return (
        <View
            className={`flex-row items-center gap-2 rounded-2xl px-4 py-2 ${
                isHighlighted ? "bg-[#eff3fd]" : "border-2 border-[#f9f7f6] bg-white"
            }`}
        >
            <View
                className={`h-4 w-4 items-center justify-center rounded-full border-2 ${
                    assignment.doneAt ? "border-[#2e6bff] bg-[#2e6bff]" : "border-[#e5e5e5] bg-white"
                }`}
            ></View>
            <View className="flex-1">
                <Text className={`text-[1rem] font-semibold ${textColor}`}>{title}</Text>
                <Text className={`text-[0.75rem] font-semibold ${subjectColor}`}>{subject}</Text>
            </View>
            {dueTimeLabel ? (
                <Text className="text-[0.6875rem] font-semibold text-[#e90000]">{dueTimeLabel}</Text>
            ) : null}
        </View>
    );
}
