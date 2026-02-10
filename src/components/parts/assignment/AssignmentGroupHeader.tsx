import { View } from "react-native";

import { Text } from "@/components/ui/text";

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
