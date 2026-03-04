import { useRef, useState } from "react";
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";

import { LoginTemplate } from "@/presentation/components/template/login";
import { Text } from "@/presentation/components/ui/text";

const { width } = Dimensions.get("window");

export default function OptionScreen() {
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [selectedCampus, setSelectedCampus] = useState<"nagoya" | "toyota">("nagoya");
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const x = event.nativeEvent.contentOffset.x;
        const currentIndex = Math.round(x / width);
        setActiveIndex(currentIndex);
    };

    const scrollToNext = () => {
        if (activeIndex < 2) {
            scrollViewRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
        } else {
            router.replace("/(tabs)"); // 最後の完了からは遷移先が指定されていないが、通常はホームへ行くはず
        }
    };

    return (
        <LoginTemplate>
            <View className="flex-1">
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    className="flex-1"
                >
                    {/* Page 1 */}
                    <View style={{ width }} className="flex-1 justify-between px-7 pt-40">
                        <View className="items-start">
                            <Text className="font-['Noto_Sans_JP:Black'] text-[1.5rem] font-black leading-tight text-[#1b1a19]">
                                現在どちらの
                            </Text>
                            <Text className="font-['Noto_Sans_JP:Black'] text-[2rem] font-black leading-tight text-[#2e6bff]">
                                キャンパス
                                <Text className="font-['Noto_Sans_JP:Black'] text-[1.5rem] font-black text-[#1b1a19]">
                                    に
                                </Text>
                            </Text>
                            <Text className="font-['Noto_Sans_JP:Black'] text-[1.5rem] font-black leading-tight text-[#1b1a19]">
                                在籍していますか？
                            </Text>
                            <Text className="mt-4 font-['Noto_Sans_JP:Medium'] text-[0.875rem] font-medium text-[#626160]">
                                交通情報などあなたにあった情報を{"\n"}お届けできます
                            </Text>
                        </View>

                        <View className="pb-24">
                            <View
                                className="items-center rounded-[36px] bg-white p-4"
                                style={{
                                    elevation: 2,
                                    shadowColor: "#000",
                                    shadowOpacity: 0.1,
                                    shadowRadius: 10,
                                    shadowOffset: { width: 0, height: 4 },
                                }}
                            >
                                <Text className="mb-4 mt-2 font-['Noto_Sans_JP:Medium'] text-[0.875rem] font-medium text-[#1b1a19]">
                                    どちらか選択してください
                                </Text>

                                <View className="mb-6 w-full gap-2">
                                    <TouchableOpacity
                                        onPress={() => setSelectedCampus("nagoya")}
                                        className={`h-14 flex-row items-center justify-center rounded-[20px] ${selectedCampus === "nagoya" ? "border border-[#eff3fd] bg-[#eff3fd]" : "bg-[#f9f7f6]"}`}
                                    >
                                        <Text
                                            className={`font-['Noto_Sans_JP:Bold'] text-[1rem] font-bold ${selectedCampus === "nagoya" ? "text-[#2e6bff]" : "text-[#626160]"}`}
                                        >
                                            名古屋キャンパス
                                        </Text>
                                        {selectedCampus === "nagoya" && (
                                            <View className="absolute right-4">
                                                <Ionicons name="checkmark-circle" size={24} color="#2e6bff" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setSelectedCampus("toyota")}
                                        className={`h-14 flex-row items-center justify-center rounded-[20px] ${selectedCampus === "toyota" ? "border border-[#eff3fd] bg-[#eff3fd]" : "bg-[#f9f7f6]"}`}
                                    >
                                        <Text
                                            className={`font-['Noto_Sans_JP:Bold'] text-[1rem] font-bold ${selectedCampus === "toyota" ? "text-[#2e6bff]" : "text-[#626160]"}`}
                                        >
                                            豊田キャンパス
                                        </Text>
                                        {selectedCampus === "toyota" && (
                                            <View className="absolute right-4">
                                                <Ionicons name="checkmark-circle" size={24} color="#2e6bff" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    onPress={scrollToNext}
                                    className="h-[52px] w-full items-center justify-center rounded-[20px] bg-[#1b1a19]"
                                >
                                    <Text className="font-['Noto_Sans_JP:Medium'] text-[1rem] font-medium text-white">
                                        次へ
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Page 2 */}
                    <View style={{ width }} className="flex-1 justify-between px-7 pt-40">
                        <View className="items-start">
                            <Text className="font-['Noto_Sans_JP:Black'] text-[2rem] font-black leading-tight text-[#2e6bff]">
                                通知
                                <Text className="font-['Noto_Sans_JP:Black'] text-[1.5rem] font-black text-[#1b1a19]">
                                    を受け取りますか？
                                </Text>
                            </Text>
                            <Text className="mt-4 font-['Noto_Sans_JP:Medium'] text-[0.875rem] font-medium text-[#626160]">
                                課題、授業スケジュール、重要なお知らせをすぐに{"\n"}お知らせします
                            </Text>
                        </View>

                        <View className="pb-24">
                            <View
                                className="items-center rounded-[36px] bg-white p-4"
                                style={{
                                    elevation: 2,
                                    shadowColor: "#000",
                                    shadowOpacity: 0.1,
                                    shadowRadius: 10,
                                    shadowOffset: { width: 0, height: 4 },
                                }}
                            >
                                <Text className="mb-1 mt-2 text-center font-['Noto_Sans_JP:Bold'] text-[0.875rem] font-bold text-[#1b1a19]">
                                    通知を許可すると以下のお知らせが届きます
                                </Text>

                                <View className="mb-6 w-full gap-2 px-2 py-2">
                                    <View className="flex-row items-center gap-2">
                                        <View className="rounded-full bg-[#eff3fd] px-3 py-1">
                                            <Text>📅</Text>
                                        </View>
                                        <Text className="font-['Noto_Sans_JP:Bold'] text-[1rem] font-bold text-[#2e6bff]">
                                            課題提出のお知らせ
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center gap-2">
                                        <View className="rounded-full bg-[#eff3fd] px-3 py-1">
                                            <Text>⏰</Text>
                                        </View>
                                        <Text className="font-['Noto_Sans_JP:Bold'] text-[1rem] font-bold text-[#2e6bff]">
                                            授業開始時間のお知らせ
                                        </Text>
                                    </View>
                                </View>

                                <View className="w-full gap-2">
                                    <TouchableOpacity
                                        onPress={scrollToNext}
                                        className="h-[52px] w-full items-center justify-center rounded-[20px] bg-[#1b1a19]"
                                    >
                                        <Text className="font-['Noto_Sans_JP:Medium'] text-[1rem] font-medium text-white">
                                            通知を許可する
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={scrollToNext}
                                        className="h-[54px] w-full items-center justify-center rounded-[20px]"
                                    >
                                        <Text className="font-['Noto_Sans_JP:Bold'] text-[1rem] font-bold text-[#626160]">
                                            また後で
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Page 3 */}
                    <View style={{ width }} className="flex-1 justify-between px-7 pt-40">
                        <View className="items-start">
                            <Text className="font-['Noto_Sans_JP:Black'] text-[1.5rem] font-black leading-tight text-[#1a1a1c]">
                                セットアップ
                                <Text className="font-['Noto_Sans_JP:Black'] text-[2rem] font-black text-[#2e6bff]">
                                    完了！
                                </Text>
                            </Text>
                            <Text className="mt-4 font-['Noto_Sans_JP:Medium'] text-[0.875rem] font-medium text-[#626160]">
                                PassPalと一緒に、シンプルなキャンパスライフを
                            </Text>
                        </View>

                        <View className="pb-24">
                            <View
                                className="items-center rounded-[36px] bg-white p-4"
                                style={{
                                    elevation: 2,
                                    shadowColor: "#000",
                                    shadowOpacity: 0.1,
                                    shadowRadius: 10,
                                    shadowOffset: { width: 0, height: 4 },
                                }}
                            >
                                <View className="mb-6 mt-2 w-full flex-row items-center gap-3 px-2">
                                    <TouchableOpacity
                                        onPress={() => setAgreedToTerms(!agreedToTerms)}
                                        className={`flex h-5 w-5 items-center justify-center rounded border ${agreedToTerms ? "border-[#2e6bff] bg-[#2e6bff]" : "border-gray-300 bg-white"}`}
                                    >
                                        {agreedToTerms && <Ionicons name="checkmark" size={16} color="white" />}
                                    </TouchableOpacity>
                                    <Text className="flex-1 font-['Noto_Sans_JP:Bold'] text-[0.75rem] font-bold text-[#1a1a1c]">
                                        <Text
                                            onPress={() => WebBrowser.openBrowserAsync("https://expo.dev")}
                                            className="text-[#2e6bff]"
                                        >
                                            利用規約
                                        </Text>
                                        {" 及び "}
                                        <Text
                                            onPress={() => WebBrowser.openBrowserAsync("https://expo.dev")}
                                            className="text-[#2e6bff]"
                                        >
                                            プライバシーポリシー
                                        </Text>
                                        {" に同意します"}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    onPress={scrollToNext}
                                    disabled={!agreedToTerms}
                                    className={`h-[52px] w-full items-center justify-center rounded-[20px] ${agreedToTerms ? "bg-[#1b1a19]" : "bg-[#f9f7f6]"}`}
                                >
                                    <Text
                                        className={`font-['Noto_Sans_JP:Medium'] text-[1rem] font-medium ${agreedToTerms ? "text-white" : "text-[#626160]"}`}
                                    >
                                        次へ
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Pagination Dots (Fixed at bottom) */}
                <View className="pointer-events-none absolute bottom-12 left-0 right-0 flex-row items-center justify-center gap-2">
                    <View
                        className={`h-2 rounded-full ${activeIndex === 0 ? "w-10 bg-[#1b1a19]" : "w-2 bg-[#ece9e7]"}`}
                    />
                    <View
                        className={`h-2 rounded-full ${activeIndex === 1 ? "w-10 bg-[#1b1a19]" : "w-2 bg-[#ece9e7]"}`}
                    />
                    <View
                        className={`h-2 rounded-full ${activeIndex === 2 ? "w-10 bg-[#1b1a19]" : "w-2 bg-[#ece9e7]"}`}
                    />
                </View>
            </View>
        </LoginTemplate>
    );
}
