import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: "#007AFF",
                tabBarInactiveTintColor: "#8E8E93",
                tabBarStyle: {
                    backgroundColor: "#FFFFFF",
                    borderTopWidth: 1,
                    borderTopColor: "#E5E5EA",
                    paddingTop: 8,
                    paddingBottom: 8,
                    height: 60,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: "500",
                },
                headerStyle: {
                    backgroundColor: "#007AFF",
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                    fontWeight: "bold",
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "홈",
                    headerTitle: "💊 Smart Med Tracker",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    title: "약 추가",
                    headerTitle: "약 추가하기",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="add-circle" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: "설정",
                    headerTitle: "설정",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="settings" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
