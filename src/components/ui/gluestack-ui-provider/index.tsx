import React from "react";
import { View, ViewProps } from "react-native";
import { OverlayProvider } from "@gluestack-ui/core/overlay/creator";
import { ToastProvider } from "@gluestack-ui/core/toast/creator";

import { config } from "./config";

export type ModeType = "light" | "dark";

export function GluestackUIProvider({
    mode = "light",
    ...props
}: {
    mode?: ModeType;
    children?: React.ReactNode;
    style?: ViewProps["style"];
}) {
    return (
        <View style={[config[mode], { flex: 1, height: "100%", width: "100%" }, props.style]}>
            <OverlayProvider>
                <ToastProvider>{props.children}</ToastProvider>
            </OverlayProvider>
        </View>
    );
}
