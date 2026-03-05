import { Image, useColorScheme, View } from "react-native";

import { googleSignInService } from "@/domain/services/google-signin";
import { GoogleLoginButton } from "@/presentation/components/parts/google-login-button";
import { LoginTemplate } from "@/presentation/components/template/login";
import { Text } from "@/presentation/components/ui/text";

export default function Index() {
    const colorScheme = useColorScheme();

    const handleGoogleLogin = () => {
        googleSignInService.signInWithGoogle();
    };

    return (
        <LoginTemplate>
            <View className="flex-1 justify-between pb-24 pt-40">
                <View className="gap-3 px-9">
                    <View
                        className="items-center justify-center self-start rounded-[23px] bg-white"
                        style={{
                            shadowColor: "rgba(94, 124, 156, 0.2)",
                            shadowOpacity: 1,
                            shadowRadius: 7.4,
                            shadowOffset: { width: 0, height: 1.8 },
                            elevation: 5,
                        }}
                    >
                        <Image
                            source={
                                colorScheme === "dark"
                                    ? require("@/assets/imgs/app-icon-dark.png")
                                    : require("@/assets/imgs/app-icon.png")
                            }
                            style={{
                                width: 89,
                                height: 89,
                                borderRadius: 23,
                                borderWidth: 1,
                                backgroundColor: colorScheme === "dark" ? "#000000" : "#ffffff",
                                borderColor: colorScheme === "dark" ? "#000000" : "#ffffff",
                            }}
                            resizeMode="contain"
                        />
                    </View>

                    <View>
                        <Text className="font-['Noto_Sans_JP:Black'] text-[1.8rem] font-black text-[#1b1a19]">
                            ようこそ
                        </Text>
                        <View className="mt-1">
                            {/* ふりがな「うめぼ」 */}
                            <Text className="absolute -top-2 left-[96px] font-['Noto_Sans_JP:Bold'] text-[12px] font-bold tracking-[15px] text-[#e50120]">
                                うめぼ
                            </Text>
                            <Text className="font-['Noto_Sans_JP:Black'] text-[3rem] font-black leading-tight text-[#e50120]">
                                中京UMEBO
                                <Text className="font-['Noto_Sans_JP:Black'] text-[1.8rem] font-black text-[#1b1a19]">
                                    へ！
                                </Text>
                            </Text>
                        </View>
                        <Text className="mt-3 font-['Noto_Sans_JP:Medium'] text-[1rem] font-medium text-[#626160]">
                            続行するには、ログインしてください
                        </Text>
                    </View>
                </View>

                <View className="mb-8 items-center">
                    <GoogleLoginButton onPress={handleGoogleLogin} />
                </View>
            </View>
        </LoginTemplate>
    );
}
