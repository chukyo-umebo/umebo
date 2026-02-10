import { View } from "react-native";

import { Text } from "@/components/ui/text";

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
    return (
        <View {...props}>
            {subject ? (
                <View className="flex-1 justify-between rounded-[10px] p-1" style={{ backgroundColor: subject.color }}>
                    <View className="flex-1 items-center justify-center">
                        <Text className="text-center text-[0.9rem] font-semibold leading-[1rem]">
                            {subject.subject}
                        </Text>
                    </View>
                    <View className="rounded-full bg-background px-1.5 py-0.5">
                        <Text className="text-center text-[0.7rem] font-medium" style={{ color: subject.color }}>
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
