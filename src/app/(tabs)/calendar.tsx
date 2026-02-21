import { Calendar } from "react-native-big-calendar";

import "dayjs/locale/ja";

import React, { useEffect, useState } from "react";
import { View } from "react-native";

import { calendarRepository } from "@/data/repositories/calendar";
import { MainTemplate } from "@/presentation/components/template/main";
import { Button, ButtonText } from "@/presentation/components/ui/button";
import { Text } from "@/presentation/components/ui/text";
import { useChukyoShibboleth } from "@/presentation/contexts/ChukyoShibbolethContext";

export default function Index() {
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [events, setEvents] = useState<{ title: string; start: Date; end: Date }[]>([]);
    const { chukyoShibbolethAuth } = useChukyoShibboleth();

    useEffect(() => {
        const fetchCalendar = async () => {
            try {
                const data = await calendarRepository.getCalendar(chukyoShibbolethAuth);
                if (data && data.result && data.result.items) {
                    const formattedEvents = data.result.items.map((item) => ({
                        title: item.summary,
                        start: new Date(item.start_at > 10000000000 ? item.start_at : item.start_at * 1000),
                        end: new Date(item.end_at > 10000000000 ? item.end_at : item.end_at * 1000),
                    }));
                    setEvents(formattedEvents);
                }
            } catch (error) {
                console.error("Failed to fetch calendar:", error);
            }
        };

        fetchCalendar();
    }, [chukyoShibbolethAuth]);

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
