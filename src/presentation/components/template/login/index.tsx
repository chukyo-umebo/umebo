import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HeaderGradient from "./HeaderGradient";

export function LoginTemplate({ children }: { children?: React.ReactNode }) {
    const insets = useSafeAreaInsets();

    return (
        <View className="flex-1" style={{ paddingLeft: insets.left, paddingRight: insets.right }}>
            <HeaderGradient />
            <View
                className="flex-1"
                style={{
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom,
                }}
            >
                {children}
            </View>
        </View>
    );
}
