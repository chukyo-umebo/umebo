import { ScrollView, TouchableOpacity, View } from "react-native";

import { Text } from "@/components/ui/text";

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
