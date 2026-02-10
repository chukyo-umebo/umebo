import { Calendar } from "react-native-big-calendar";

import "dayjs/locale/ja";

import React from "react";
import { View } from "react-native";

import { MainTemplate } from "@/components/template/main";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

const events = [
    {
        title: "Meeting",
        start: new Date(new Date().setDate(11)),
        end: new Date(new Date().setDate(11)),
    },
    {
        title: "Coffee break",
        start: new Date(new Date().setDate(14)),
        end: new Date(new Date().setDate(16)),
    },
];
export default function Index() {
    const [calendarDate, setCalendarDate] = React.useState(new Date(2020, 1, 11));
    React.useEffect(() => {}, []);
    return (
        <MainTemplate title="カレンダー" subtitle="中京大学の年間スケジュールが書いてあります" noOverScroll>
            <View className="mb-4 flex-row items-center justify-between px-4">
                <Text>
                    {calendarDate.getFullYear()}年{calendarDate.getMonth() + 1}月
                </Text>
                <Button onPress={() => setCalendarDate(new Date())}>
                    <ButtonText>今日に移動</ButtonText>
                </Button>
            </View>

            <Calendar
                events={events}
                height={300}
                locale="ja"
                mode="month"
                date={calendarDate}
                onSwipeEnd={(date) => {
                    setCalendarDate(date);
                }}
            />
        </MainTemplate>
    );
}
