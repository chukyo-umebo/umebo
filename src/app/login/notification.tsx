import React from "react";
import { TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

export default function NotificationScreen() {
    const router = useRouter();

    const handleNext = () => {
        router.push("/login/password");
    };

    return (
        <SafeAreaView className="relative flex-1 bg-[#f9f7f6]">
            <View className="mt-[100px] px-[28px]">
                <View className="mb-8">
                    <Text className="font-black leading-none text-[#1b1a19]">
                        <Text className="text-[2rem] text-[#2e6bff]">通知</Text>
                        <Text className="text-[1.5rem]">を受け取りますか？</Text>
                    </Text>
                </View>

                <View>
                    <Text className="text-[0.875rem] font-medium text-[#626160]">
                        課題、授業スケジュール、重要なお知らせをすぐに
                    </Text>
                    <Text className="text-[0.875rem] font-medium text-[#626160]">お知らせします</Text>
                </View>
            </View>

            <View className="absolute bottom-[100px] left-0 right-0 items-center">
                <View className="w-[385px] max-w-[90%] items-center rounded-[36px] border-2 border-[#f9f7f6] bg-white p-4 shadow-none">
                    <Text className="mb-4 text-center text-[0.875rem] font-bold text-[#1b1a19]">
                        通知を許可すると以下のお知らせが届きます
                    </Text>

                    <View className="mb-8 w-full gap-3">
                        {/* Item 1 */}
                        <View className="flex-row items-center gap-2 pl-2">
                            <View className="items-center justify-center rounded-full bg-[#eff3fd] px-3 py-1">
                                <Ionicons name="calendar-outline" size={18} color="#2e6bff" />
                            </View>
                            <Text className="text-[1rem] font-bold text-[#2e6bff]">課題提出のお知らせ</Text>
                        </View>
                        {/* Item 2 */}
                        <View className="flex-row items-center gap-2 pl-2">
                            <View className="items-center justify-center rounded-full bg-[#eff3fd] px-3 py-1">
                                <Ionicons name="time-outline" size={18} color="#2e6bff" />
                            </View>
                            <Text className="text-[1rem] font-bold text-[#2e6bff]">授業開始時間のお知らせ</Text>
                        </View>
                    </View>

                    <View className="w-full gap-2">
                        <Button className="h-[52px] w-full rounded-[20px] bg-[#1b1a19]" onPress={handleNext}>
                            <ButtonText className="text-[1rem] font-medium text-white">通知を許可する</ButtonText>
                        </Button>

                        <TouchableOpacity
                            className="h-[54px] w-full items-center justify-center rounded-[20px]"
                            onPress={handleNext}
                        >
                            <Text className="text-[1rem] font-bold text-[#626160]">また後で</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Dots - Step 2/4 */}
                <View className="mt-8 flex-row gap-2">
                    <View className="h-2 w-2 rounded-full bg-[#ece9e7]" />
                    <View className="h-2 w-10 rounded-full bg-[#1b1a19]" />
                    <View className="h-2 w-2 rounded-full bg-[#ece9e7]" />
                    <View className="h-2 w-2 rounded-full bg-[#ece9e7]" />
                </View>
            </View>
        </SafeAreaView>
    );
}
