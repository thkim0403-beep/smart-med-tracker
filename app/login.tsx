import React, { useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "../src/store/authStore";

export default function LoginScreen() {
    const router = useRouter();
    const {
        isLoading,
        isAuthenticated,
        error,
        signInWithGoogle,
        signInWithNaver,
        loadStoredAuth,
        clearError,
    } = useAuthStore();

    useEffect(() => {
        // Check if already authenticated
        loadStoredAuth();
    }, []);

    useEffect(() => {
        // Navigate to main screen if authenticated
        if (isAuthenticated) {
            router.replace("/(tabs)");
        }
    }, [isAuthenticated]);

    useEffect(() => {
        // Show error alert
        if (error) {
            Alert.alert("로그인 오류", error, [
                { text: "확인", onPress: clearError },
            ]);
        }
    }, [error]);

    const handleGoogleLogin = async () => {
        await signInWithGoogle();
    };

    const handleNaverLogin = async () => {
        await signInWithNaver();
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#007AFF" />
                <Text className="mt-4 text-gray-600">로그인 중...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gradient-to-b from-blue-50 to-white">
            {/* Header / Logo Section */}
            <View className="flex-1 items-center justify-center px-8">
                <View className="bg-primary/10 w-28 h-28 rounded-3xl items-center justify-center mb-6">
                    <Ionicons name="medical" size={56} color="#007AFF" />
                </View>

                <Text className="text-3xl font-bold text-gray-900 text-center">
                    Smart Med Tracker
                </Text>

                <Text className="text-lg text-gray-500 text-center mt-3 leading-6">
                    당신의 건강한 복약 습관을 위한{"\n"}스마트한 알림 서비스
                </Text>
            </View>

            {/* Social Login Buttons */}
            <View className="px-6 pb-12">
                {/* Google Login Button */}
                <TouchableOpacity
                    onPress={handleGoogleLogin}
                    disabled={isLoading}
                    className="bg-white border border-gray-200 rounded-2xl py-4 px-6 flex-row items-center justify-center mb-4 shadow-sm"
                    style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 8,
                        elevation: 2,
                    }}
                >
                    <Image
                        source={{
                            uri: "https://www.google.com/favicon.ico",
                        }}
                        style={{ width: 24, height: 24 }}
                        resizeMode="contain"
                    />
                    <Text className="ml-3 text-gray-800 font-semibold text-lg">
                        Google로 계속하기
                    </Text>
                </TouchableOpacity>

                {/* Naver Login Button */}
                <TouchableOpacity
                    onPress={handleNaverLogin}
                    disabled={isLoading}
                    className="rounded-2xl py-4 px-6 flex-row items-center justify-center mb-6"
                    style={{
                        backgroundColor: "#03C75A",
                        shadowColor: "#03C75A",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                    }}
                >
                    <Text className="text-white font-bold text-xl">N</Text>
                    <Text className="ml-3 text-white font-semibold text-lg">
                        네이버로 계속하기
                    </Text>
                </TouchableOpacity>

                {/* Terms Notice */}
                <Text className="text-center text-gray-400 text-sm leading-5">
                    로그인하면 서비스 이용약관 및{"\n"}
                    개인정보처리방침에 동의하게 됩니다.
                </Text>
            </View>
        </View>
    );
}
