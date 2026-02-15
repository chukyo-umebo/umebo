import { TouchableOpacity, View } from "react-native";

import { Text } from "../../ui/text";

type QuickAccessIconProps = {
    name: string;
    icon: string;
    onPress?: () => void;
};

export function QuickAccessIcon({ name, icon, onPress }: QuickAccessIconProps) {
    return (
        <TouchableOpacity onPress={onPress} className="items-center gap-2.5 rounded-lg bg-[#eff3fd] px-3 py-2.5">
            <View className="h-[35px] w-[35px] items-center justify-center rounded-full bg-blue-200">
                <Text className="text-[5px] font-semibold text-[#2e6bff]">{icon}</Text>
            </View>
            <Text className="text-[10px] font-semibold text-[#2e6bff]">{name}</Text>
        </TouchableOpacity>
    );
}
