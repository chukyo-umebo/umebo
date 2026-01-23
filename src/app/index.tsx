import { ScrollView, Text } from "react-native";

export default function Index() {
    return (
        <ScrollView contentContainerStyle={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: "red" }}>Edit app/index.tsx to edit this screen.</Text>
        </ScrollView>
    );
}
