import { View } from "react-native";

import { Text } from "@/components/ui/text";

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
