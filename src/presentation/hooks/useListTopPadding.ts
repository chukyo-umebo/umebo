import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePathname } from "expo-router";

export function useListTopPadding() {
    const insets = useSafeAreaInsets();

    const path = usePathname();

    const [topPadding, setTopPadding] = useState(insets.top);

    // TODO: Remove this logic after the Expo 55 update.
    // https://github.com/facebook/react-native/issues/54183
    useEffect(() => {
        const timeout = setTimeout(() => {
            setTopPadding(insets.top + (Math.random() * 0.2 - 0.1));
        }, 50);

        return () => {
            clearTimeout(timeout);
        };
    }, [insets.top, path]);

    return topPadding;
}
