import { View } from "react-native";

import { Text } from "@/presentation/components/ui/text";

export default function MaintenanceScreen() {
    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
            }}
        >
            <Text className="text-2xl font-bold">メンテナンス中</Text>
            <Text className="text-center text-gray-500">
                現在、システムのメンテナンスを行っております。ご不便をおかけして申し訳ありません。しばらくしてから再度アクセスしてください。
            </Text>
        </View>
    );
}
