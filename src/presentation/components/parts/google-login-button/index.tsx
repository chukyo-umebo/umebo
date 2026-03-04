import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Iconify } from "react-native-iconify";

import { Text } from "@/presentation/components/ui/text";

export function GoogleLoginButton({ onPress }: { onPress?: () => void }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="h-[3.375rem] w-[21.25rem] flex-row items-center justify-center gap-3 rounded-[1.25rem] border-2 border-[#f9f7f6] bg-white"
            activeOpacity={0.8}
            style={{
                shadowColor: "rgba(94, 124, 156, 0.2)",
                shadowOpacity: 0.2,
                shadowRadius: 7.4,
                shadowOffset: { width: 0, height: 1.8 },
            }}
        >
            <View className="h-[1.875rem] w-[1.875rem] items-center justify-center">
                <Iconify icon="logos:google-icon" size={24} />
            </View>
            <Text className="mx-2 font-['Noto_Sans_JP:Medium'] text-[1rem] font-medium text-[#1b1a19]">
                Googleでログイン
            </Text>
        </TouchableOpacity>
    );
}
