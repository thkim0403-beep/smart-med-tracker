import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useMedStore } from "../../src/store/medStore";
import {
    cancelAllReminders,
    getScheduledReminders,
    requestNotificationPermissions,
} from "../../src/services/notifications";

export default function SettingsScreen() {
    const { meds, loadMeds, deleteMed } = useMedStore();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [scheduledCount, setScheduledCount] = useState(0);

    useEffect(() => {
        loadMeds();
        checkNotificationStatus();
    }, []);

    const checkNotificationStatus = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        setNotificationsEnabled(status === "granted");

        const scheduled = await getScheduledReminders();
        setScheduledCount(scheduled.length);
    };

    const handleNotificationToggle = async (value: boolean) => {
        if (value) {
            const granted = await requestNotificationPermissions();
            setNotificationsEnabled(granted);
        } else {
            Alert.alert(
                "알림 비활성화",
                "알림을 끄시면 복약 시간을 놓칠 수 있어요.",
                [
                    { text: "취소", style: "cancel" },
                    {
                        text: "알림 끄기",
                        style: "destructive",
                        onPress: async () => {
                            await cancelAllReminders();
                            setNotificationsEnabled(false);
                            setScheduledCount(0);
                        },
                    },
                ]
            );
        }
    };

    const handleDeleteMed = (id: number, name: string) => {
        Alert.alert("약 삭제", `${name}을(를) 삭제하시겠습니까?\n관련 알림도 함께 삭제됩니다.`, [
            { text: "취소", style: "cancel" },
            {
                text: "삭제",
                style: "destructive",
                onPress: async () => {
                    await deleteMed(id);
                    await checkNotificationStatus();
                },
            },
        ]);
    };

    const handleClearAllReminders = () => {
        Alert.alert(
            "모든 알림 삭제",
            "예약된 모든 알림을 삭제하시겠습니까?",
            [
                { text: "취소", style: "cancel" },
                {
                    text: "삭제",
                    style: "destructive",
                    onPress: async () => {
                        await cancelAllReminders();
                        await checkNotificationStatus();
                        Alert.alert("완료", "모든 알림이 삭제되었습니다.");
                    },
                },
            ]
        );
    };

    return (
        <ScrollView className="flex-1 bg-gray-50">
            {/* Notifications Section */}
            <View className="mt-4 mx-4">
                <Text className="text-gray-500 font-semibold mb-2 uppercase text-xs">
                    알림 설정
                </Text>
                <View className="bg-white rounded-2xl overflow-hidden">
                    <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
                        <View className="flex-row items-center">
                            <View className="bg-red-100 w-10 h-10 rounded-xl items-center justify-center">
                                <Ionicons name="notifications" size={22} color="#FF3B30" />
                            </View>
                            <View className="ml-3">
                                <Text className="text-gray-800 font-semibold">복약 알림</Text>
                                <Text className="text-gray-500 text-sm">
                                    예약된 알림: {scheduledCount}개
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={handleNotificationToggle}
                            trackColor={{ false: "#E5E5EA", true: "#34C759" }}
                            thumbColor="white"
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleClearAllReminders}
                        className="flex-row items-center p-4"
                    >
                        <View className="bg-orange-100 w-10 h-10 rounded-xl items-center justify-center">
                            <Ionicons name="trash" size={22} color="#FF9500" />
                        </View>
                        <Text className="ml-3 text-gray-800 font-medium flex-1">
                            모든 알림 삭제
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Medications List */}
            <View className="mt-6 mx-4">
                <Text className="text-gray-500 font-semibold mb-2 uppercase text-xs">
                    등록된 약 ({meds.length}개)
                </Text>
                <View className="bg-white rounded-2xl overflow-hidden">
                    {meds.length === 0 ? (
                        <View className="p-6 items-center">
                            <Text className="text-gray-400">등록된 약이 없습니다</Text>
                        </View>
                    ) : (
                        meds.map((med, index) => (
                            <TouchableOpacity
                                key={med.id}
                                onPress={() => handleDeleteMed(med.id!, med.name)}
                                className={`flex-row items-center p-4 ${index < meds.length - 1 ? "border-b border-gray-100" : ""
                                    }`}
                            >
                                <View className="bg-primary/10 w-10 h-10 rounded-xl items-center justify-center">
                                    <Ionicons name="medical" size={22} color="#007AFF" />
                                </View>
                                <View className="ml-3 flex-1">
                                    <Text className="text-gray-800 font-semibold">{med.name}</Text>
                                    <Text className="text-gray-500 text-sm">
                                        1일 {med.daily_freq}회 • {med.duration_days}일분
                                    </Text>
                                </View>
                                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </View>

            {/* App Info */}
            <View className="mt-6 mx-4 mb-8">
                <Text className="text-gray-500 font-semibold mb-2 uppercase text-xs">
                    앱 정보
                </Text>
                <View className="bg-white rounded-2xl overflow-hidden">
                    <View className="flex-row items-center p-4 border-b border-gray-100">
                        <View className="bg-primary/10 w-10 h-10 rounded-xl items-center justify-center">
                            <Ionicons name="information-circle" size={22} color="#007AFF" />
                        </View>
                        <Text className="ml-3 text-gray-800 font-medium flex-1">버전</Text>
                        <Text className="text-gray-500">1.0.0</Text>
                    </View>

                    <View className="flex-row items-center p-4">
                        <View className="bg-green-100 w-10 h-10 rounded-xl items-center justify-center">
                            <Ionicons name="heart" size={22} color="#34C759" />
                        </View>
                        <View className="ml-3 flex-1">
                            <Text className="text-gray-800 font-medium">
                                Smart Med Tracker
                            </Text>
                            <Text className="text-gray-500 text-sm">
                                당신의 건강한 복약 습관을 위해 💊
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}
