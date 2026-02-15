import React, { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button, ButtonText } from "@/presentation/components/ui/button";
import { Text } from "@/presentation/components/ui/text";

export default function CampusScreen() {
    const router = useRouter();
    const [selectedCampus, setSelectedCampus] = useState<string | null>(null);

    const handleNext = () => {
        if (selectedCampus) {
            router.push("/login/notification");
        }
    };

    return (
        <SafeAreaView className="relative flex-1 bg-[#f9f7f6]">
            <View className="mt-[100px] px-[28px]">
                <View className="mb-8">
                    <Text className="font-black leading-none text-[#1b1a19]">
                        <Text className="text-[1.5rem]">現在どちらの</Text>
                        <Text className="text-[2rem] text-[#2e6bff]">キャンパス</Text>
                        <Text className="text-[1.5rem]">に</Text>
                    </Text>
                    <Text className="text-[1.5rem] font-black text-[#1b1a19]">在籍していますか？</Text>
                </View>

                <View>
                    <Text className="text-[0.875rem] font-medium text-[#626160]">交通情報などあなたにあった情報を</Text>
                    <Text className="text-[0.875rem] font-medium text-[#626160]">お届けできます</Text>
                </View>
            </View>

            <View className="absolute bottom-[100px] left-0 right-0 items-center">
                <View className="w-[385px] max-w-[90%] items-center rounded-[36px] border-2 border-[#f9f7f6] bg-white p-4 shadow-none">
                    <Text className="mb-6 text-[0.875rem] font-medium text-[#1b1a19]">どちらか選択してください</Text>

                    <View className="mb-6 w-full gap-2">
                        <TouchableOpacity
                            onPress={() => setSelectedCampus("nagoya")}
                            className={`h-[56px] w-full flex-row items-center rounded-[20px] px-6 ${
                                selectedCampus === "nagoya" ? "bg-[#eff3fd]" : "bg-[#f9f7f6]"
                            }`}
                        >
                            <Text
                                className={`flex-1 text-center text-[1rem] font-bold ${
                                    selectedCampus === "nagoya" ? "text-[#2e6bff]" : "text-[#626160]"
                                }`}
                            >
                                名古屋キャンパス
                            </Text>
                            {selectedCampus === "nagoya" && (
                                <Ionicons
                                    name="checkmark-circle"
                                    size={24}
                                    color="#2e6bff"
                                    style={{ position: "absolute", right: 16 }}
                                />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setSelectedCampus("toyota")}
                            className={`h-[56px] w-full flex-row items-center rounded-[20px] px-6 ${
                                selectedCampus === "toyota" ? "bg-[#eff3fd]" : "bg-[#f9f7f6]"
                            }`}
                        >
                            <Text
                                className={`flex-1 text-center text-[1rem] font-bold ${
                                    selectedCampus === "toyota" ? "text-[#2e6bff]" : "text-[#626160]"
                                }`}
                            >
                                豊田キャンパス
                            </Text>
                            {selectedCampus === "toyota" && (
                                <Ionicons
                                    name="checkmark-circle"
                                    size={24}
                                    color="#2e6bff"
                                    style={{ position: "absolute", right: 16 }}
                                />
                            )}
                        </TouchableOpacity>
                    </View>

                    <Button
                        className={`h-[52px] w-full rounded-[20px] ${selectedCampus ? "bg-[#1b1a19]" : "bg-[#f9f7f6]"}`}
                        onPress={handleNext}
                        disabled={!selectedCampus}
                    >
                        <ButtonText
                            className={`text-[1rem] font-medium ${selectedCampus ? "text-white" : "text-gray-300"}`}
                        >
                            次へ
                        </ButtonText>
                    </Button>
                </View>

                {/* Dots - Step 1/4 */}
                <View className="mt-8 flex-row gap-2">
                    <View className="h-2 w-10 rounded-full bg-[#1b1a19]" />
                    <View className="h-2 w-2 rounded-full bg-[#ece9e7]" />
                    <View className="h-2 w-2 rounded-full bg-[#ece9e7]" />
                    <View className="h-2 w-2 rounded-full bg-[#ece9e7]" />
                </View>
            </View>
        </SafeAreaView>
    );
}
