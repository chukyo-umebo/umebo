import { Button, Linking, View } from "react-native";

import { STORE_URLS } from "@/common/constants/urls";
import { appInfoRepository } from "@/data/repositories/app-info";
import { Text } from "@/presentation/components/ui/text";

export default function ForceUpdateScreen() {
    const handleUpdate = () => {
        const storeUrl = STORE_URLS.device();
        Linking.openURL(storeUrl);
    };

    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
            }}
        >
            <Text className="text-center">アップデートが必要です</Text>

            <Text className="text-center">
                新しいバージョンのアプリが利用可能です。{"\n"}
                継続して利用するには、アプリを最新版にアップデートしてください。
            </Text>

            <Text className="text-center">現在のバージョン: {appInfoRepository.currentVersion}</Text>

            <Button title="アップデートする" onPress={handleUpdate} />
        </View>
    );
}
