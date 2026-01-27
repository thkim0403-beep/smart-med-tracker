import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useAuthStore } from "../src/store/authStore";

export default function RootLayout() {
    const { loadStoredAuth } = useAuthStore();

    useEffect(() => {
        // Load stored authentication on app start
        loadStoredAuth();
    }, []);

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
                <Stack.Screen
                    name="login"
                    options={{
                        headerShown: false,
                        animation: "fade",
                    }}
                />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
        </>
    );
}
