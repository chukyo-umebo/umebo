import React, { useEffect } from "react";
import { Image, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { toast } from "@backpackapp-io/react-native-toast";
import { Ionicons } from "@expo/vector-icons";

import { googleSignInService } from "@/domain/services/google-signin";
import { Button, ButtonText } from "@/presentation/components/ui/button";
import { Text } from "@/presentation/components/ui/text";

export default function LoginScreen() {
    const router = useRouter();

    useEffect(() => {
        googleSignInService.silentSignIn().then((isSuccess) => {
            if (isSuccess) {
                router.push("/login/campus");
            }
        });
    }, [router]);

    const handleGoogleLogin = async () => {
        const signInResult = await googleSignInService.signInWithGoogle();
        if (signInResult.kind === "success") {
            router.push("/login/campus");
        } else if (signInResult.kind === "invalid-domain") {
            toast.error(
                `大学のメールアドレス（${signInResult.allowedDomain}）を使用してください。${signInResult.email}は使用できません。`
            );
            googleSignInService.signOut();
        } else if (signInResult.kind === "error") {
            toast.error("Googleサインイン中にエラーが発生しました。もう一度お試しください。");
            console.error("Googleサインインエラー:", signInResult.error);
        }
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
