import { useColorScheme, View } from "react-native";

import { resolveThemeColor } from "../../ui/gluestack-ui-provider/theme-colors";
import { Text } from "../../ui/text";

type IClassCardProps = Omit<
    React.ComponentPropsWithRef<typeof View> & {
        subject?: {
            color: string;
            subject: string;
            room: string;
        };
    },
    "children"
>;
export function ClassCard({ subject, ...props }: IClassCardProps) {
    const colorMode = useColorScheme();
    const mode = colorMode === "dark" ? "dark" : "light";
    const resolvedColor = subject ? resolveThemeColor(subject.color, mode) : undefined;

    return (
        <View {...props}>
            {subject ? (
                <View className="flex-1 justify-between rounded-[10px] p-1" style={{ backgroundColor: resolvedColor }}>
                    <View className="flex-1 items-center justify-center">
                        <Text className="text-center text-[0.9rem] font-semibold leading-[1rem] text-white">
                            {subject.subject}
                        </Text>
                    </View>
                    <View className="rounded-full bg-background px-1.5 py-0.5">
                        <Text
                            className="text-center text-[0.7rem] font-medium"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={{ color: resolvedColor }}
                        >
                            {subject.room}
                        </Text>
                    </View>
                </View>
            ) : (
                <View className="flex-1 items-center justify-center rounded-lg bg-transparent">
                    <View className="h-5 w-5 rounded-full bg-[#f9f7f6]" />
                </View>
            )}
        </View>
    );
}
