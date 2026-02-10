import React, { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

export default function TermsScreen() {
    const router = useRouter();
    const [agreed, setAgreed] = useState(false);

    const handleNext = () => {
        if (agreed) {
            router.replace("/(tabs)");
        }
    };

    return (
        <SafeAreaView className="relative flex-1 bg-[#f9f7f6]">
            <View className="mt-[100px] items-center px-[28px]">
                <View className="mb-4 flex-row items-end">
                    <Text className="mb-1 text-[1.5rem] font-black leading-none text-[#1b1a19]">セットアップ</Text>
                    <Text className="text-[2rem] font-black leading-none text-[#2e6bff]">完了！</Text>
                </View>

                <View>
                    <Text className="text-center text-[0.875rem] font-medium text-[#626160]">
                        PassPalと一緒に、シンプルなキャンパスライフを
                    </Text>
                </View>
            </View>

            <View className="absolute bottom-[100px] left-0 right-0 items-center">
                <View className="w-[385px] max-w-[90%] items-center rounded-[36px] border-0 bg-white p-4 shadow-none">
                    {/* Agreement Checkbox */}
                    <View className="mb-8 w-full flex-row items-center justify-center gap-3 px-2">
                        <TouchableOpacity onPress={() => setAgreed(!agreed)}>
                            <Ionicons
                                name={agreed ? "checkbox" : "square-outline"}
                                size={24}
                                color={agreed ? "#2e6bff" : "#626160"}
                            />
                        </TouchableOpacity>
                        <View className="flex-1">
                            <Text className="flex-wrap text-center text-[0.75rem] font-bold text-[#1a1a1c]">
                                <Text className="text-[#2e6bff]">利用規約 </Text>
                                <Text>及び </Text>
                                <Text className="text-[#2e6bff]">プライバシーポリシー </Text>
                                <Text>に同意します</Text>
                            </Text>
                        </View>
                    </View>

                    <Button
                        className={`h-[52px] w-full rounded-[20px] ${agreed ? "bg-[#1b1a19]" : "bg-[#f9f7f6]"}`}
                        onPress={handleNext}
                        disabled={!agreed}
                    >
                        <ButtonText className={`text-[1rem] font-medium ${agreed ? "text-white" : "text-gray-300"}`}>
                            次へ
                        </ButtonText>
                    </Button>
                </View>

                {/* Dots - Step 3/4 (Reuse 3rd active) */}
                <View className="mt-8 flex-row gap-2">
                    <View className="h-2 w-2 rounded-full bg-[#ece9e7]" />
                    <View className="h-2 w-2 rounded-full bg-[#ece9e7]" />
                    <View className="h-2 w-10 rounded-full bg-[#1b1a19]" />
                    <View className="h-2 w-2 rounded-full bg-[#ece9e7]" />
                </View>
            </View>
        </SafeAreaView>
    );
}
