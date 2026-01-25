import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
    return (
        <>
            <StatusBar style="dark" />
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: "#007AFF",
                    },
                    headerTintColor: "#fff",
                    headerTitleStyle: {
                        fontWeight: "bold",
                    },
                }}
            >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
        </>
    );
}
