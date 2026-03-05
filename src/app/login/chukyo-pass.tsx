import { useEffect, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

import { authService } from "@/domain/services/auth";
import { googleSignInService } from "@/domain/services/google-signin";
import { LoginTemplate } from "@/presentation/components/template/login";
import { Input } from "@/presentation/components/ui/input";
import { Text } from "@/presentation/components/ui/text";
import { useLoginSession } from "@/presentation/contexts/LoginSessionContext";

export default function ChukyoLogin() {
    const [password, setPassword] = useState("");
    const [studentId, setStudentId] = useState("");
    const { setLoginSession } = useLoginSession();

    const handleLogin = async () => {
        const loginSession = await authService.loginIdPass(studentId, password);
        setLoginSession(loginSession);
    };

    const handleBack = () => {
        authService.signOut();
    };

    useEffect(() => {
        (async () => {
            const loggedInStudentId = await googleSignInService.getLoggedInStudentId();
            if (loggedInStudentId) {
                setStudentId(loggedInStudentId);
            } else {
                alert("Google認証の情報が見つかりませんでした。最初からやり直してください。");
                authService.signOut();
            }
        })();
    }, []);

    return (
        <LoginTemplate>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View className="flex-1 justify-between pb-24 pt-72">
                        <View className="gap-3 px-9">
                            {/* Title */}
                            <Text className="font-['Noto_Sans_JP:Black'] text-[1.5rem] font-black text-[#1b1a19]">
                                <Text className="text-[2rem] text-[#2e6bff]">パスワード</Text>
                                を入力
                            </Text>

                            {/* Subtitle */}
                            <Text className="font-['Noto_Sans_JP:Medium'] text-[0.875rem] font-medium text-[#626160]">
                                CU_ID({studentId})のパスワードを入力してください。
                            </Text>
                        </View>

                        {/* Card Container */}
                        <View className="mb-8 w-full max-w-[385px] items-center gap-6 self-center rounded-[36px] bg-white p-4">
                            {/* Password Input */}
                            <Input
                                value={password}
                                onChangeText={setPassword}
                                placeholder="パスワード"
                                isPassword
                                alphanumeric
                                leftIcon="bxs:lock-alt"
                            />

                            {/* Actions */}
                            <View className="w-full gap-2">
                                <TouchableOpacity
                                    className="h-[52px] w-full flex-row items-center justify-center gap-3 rounded-[20px] bg-[#1b1a19]"
                                    onPress={handleLogin}
                                >
                                    <Text className="font-['Noto_Sans_JP:Medium'] text-[1rem] font-medium text-white">
                                        ログインして続ける
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className="h-[54px] w-full items-center justify-center rounded-[20px]"
                                    onPress={handleBack}
                                >
                                    <Text className="font-['Noto_Sans_JP:Bold'] text-[1rem] font-bold text-[#626160]">
                                        google認証に戻る
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </LoginTemplate>
    );
}
