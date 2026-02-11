import React from "react";
import { Image, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { googleSignInService } from "@/services/google-signin";

export default function LoginScreen() {
    const router = useRouter();

    const handleGoogleLogin = async () => {
        // Build logic for Google Login here
        await googleSignInService.signInWithGoogle();
        // For now, navigate to the next screen
        router.push("/login/campus");
    };

    return (
        <SafeAreaView className="relative flex-1 items-center justify-center bg-[#f9f7f6]">
            {/* Background Pattern - omitting for simplicity or using pure css if possible, 
                 but keeping it clean as per request */}

            {/* App Icon */}
            <View className="mb-10 h-[89px] w-[89px] items-center justify-center overflow-hidden rounded-[22px] bg-white shadow-sm">
                {/* Placeholder for App Icon from assets */}
                <Image
                    source={require("@/assets/icons/adaptive-icon.png")}
                    className="h-full w-full"
                    resizeMode="contain"
                />
            </View>

            {/* Welcome Text */}
            <View className="mb-16 items-center">
                <Text className="text-[1.8rem] font-black leading-tight text-[#1b1a19]">ようこそ</Text>
                <View className="flex-row items-end">
                    <Text className="text-[3rem] font-black leading-none text-[#e50120]">中京UMEBO</Text>
                    <Text className="mb-1 text-[1.8rem] font-black leading-none text-[#1b1a19]">へ！</Text>
                </View>
                <Text className="mt-4 text-[1rem] font-medium text-[#626160]">続行するには、ログインしてください</Text>
            </View>

            {/* Google Login Button */}
            <View className="absolute bottom-[120px]">
                <Button
                    className="elevation-1 h-[54px] w-[340px] flex-row items-center justify-center gap-3 rounded-[20px] border-2 border-[#f9f7f6] bg-white shadow-sm"
                    onPress={handleGoogleLogin}
                >
                    <Ionicons name="logo-google" size={24} color="#000" />
                    <ButtonText className="text-[1rem] font-medium text-[#1b1a19]">Googleでログイン</ButtonText>
                </Button>
            </View>

            <Text className="absolute bottom-[40px] text-[0.75rem] font-bold tracking-[15px] text-[#e50120]">
                うめぼ
            </Text>
        </SafeAreaView>
    );
}
