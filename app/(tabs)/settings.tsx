import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    Switch,
    Image,
    TextInput,
    Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useMedStore } from "../../src/store/medStore";
import { useAuthStore } from "../../src/store/authStore";
import {
    cancelAllReminders,
    getScheduledReminders,
    requestNotificationPermissions,
} from "../../src/services/notifications";

export default function SettingsScreen() {
    const router = useRouter();
    const { meds, loadMeds, deleteMed, groups, loadGroups, addGroup, updateGroup, deleteGroup, assignMedToGroup } = useMedStore();
    const { user, signOut } = useAuthStore();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [scheduledCount, setScheduledCount] = useState(0);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [editingGroup, setEditingGroup] = useState<{ id: number; name: string } | null>(null);
    const [showMedGroupModal, setShowMedGroupModal] = useState(false);
    const [selectedMedForGroup, setSelectedMedForGroup] = useState<{ id: number; name: string; group_id?: number | null } | null>(null);

    useEffect(() => {
        loadMeds();
        loadGroups();
        checkNotificationStatus();
    }, []);

    const handleLogout = () => {
        Alert.alert(
            "로그아웃",
            "정말 로그아웃 하시겠습니까?",
            [
                { text: "취소", style: "cancel" },
                {
                    text: "로그아웃",
                    style: "destructive",
                    onPress: async () => {
                        await signOut();
                        router.replace("/login");
                    },
                },
            ]
        );
    };

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

    const handleAddGroup = async () => {
        if (!groupName.trim()) {
            Alert.alert("입력 필요", "그룹 이름을 입력해주세요.");
            return;
        }
        await addGroup(groupName.trim());
        setGroupName("");
        setShowGroupModal(false);
    };

    const handleEditGroup = (group: { id: number; name: string }) => {
        setEditingGroup(group);
        setGroupName(group.name);
        setShowGroupModal(true);
    };

    const handleUpdateGroup = async () => {
        if (!editingGroup || !groupName.trim()) return;
        await updateGroup(editingGroup.id, groupName.trim());
        setEditingGroup(null);
        setGroupName("");
        setShowGroupModal(false);
    };

    const handleDeleteGroup = (id: number, name: string) => {
        Alert.alert("그룹 삭제", `"${name}" 그룹을 삭제하시겠습니까?\n그룹 내 약은 그룹 없음으로 변경됩니다.`, [
            { text: "취소", style: "cancel" },
            {
                text: "삭제",
                style: "destructive",
                onPress: () => deleteGroup(id),
            },
        ]);
    };

    const handleChangeMedGroup = (med: { id: number; name: string; group_id?: number | null }) => {
        setSelectedMedForGroup(med);
        setShowMedGroupModal(true);
    };

    const handleAssignMedToGroup = async (groupId: number | null) => {
        if (!selectedMedForGroup) return;
        await assignMedToGroup(selectedMedForGroup.id, groupId);
        setShowMedGroupModal(false);
        setSelectedMedForGroup(null);
    };

    return (
        <ScrollView className="flex-1 bg-gray-50">
            {/* User Profile Section */}
            {user && (
                <View className="mt-4 mx-4">
                    <Text className="text-gray-500 font-semibold mb-2 uppercase text-xs">
                        계정
                    </Text>
                    <View className="bg-white rounded-2xl overflow-hidden">
                        <View className="flex-row items-center p-4 border-b border-gray-100">
                            {user.picture ? (
                                <Image
                                    source={{ uri: user.picture }}
                                    className="w-12 h-12 rounded-full"
                                />
                            ) : (
                                <View className="bg-primary/10 w-12 h-12 rounded-full items-center justify-center">
                                    <Ionicons name="person" size={24} color="#007AFF" />
                                </View>
                            )}
                            <View className="ml-3 flex-1">
                                <Text className="text-gray-800 font-semibold text-lg">
                                    {user.name}
                                </Text>
                                <Text className="text-gray-500 text-sm">
                                    {user.email}
                                </Text>
                                <View className="flex-row items-center mt-1">
                                    <View
                                        className="px-2 py-1 rounded-full"
                                        style={{
                                            backgroundColor:
                                                user.provider === "google"
                                                    ? "#4285F4"
                                                    : "#03C75A",
                                        }}
                                    >
                                        <Text className="text-white text-xs font-medium">
                                            {user.provider === "google" ? "Google" : "Naver"}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleLogout}
                            className="flex-row items-center p-4"
                        >
                            <View className="bg-red-100 w-10 h-10 rounded-xl items-center justify-center">
                                <Ionicons name="log-out" size={22} color="#FF3B30" />
                            </View>
                            <Text className="ml-3 text-red-500 font-medium flex-1">
                                로그아웃
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

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

            {/* Group Management */}
            <View className="mt-6 mx-4">
                <Text className="text-gray-500 font-semibold mb-2 uppercase text-xs">
                    그룹 관리
                </Text>
                <View className="bg-white rounded-2xl overflow-hidden">
                    {groups.length === 0 ? (
                        <View className="p-6 items-center">
                            <Text className="text-gray-400">등록된 그룹이 없습니다</Text>
                        </View>
                    ) : (
                        groups.map((group, index) => {
                            const groupMedCount = meds.filter(m => m.group_id === group.id).length;
                            return (
                                <View
                                    key={group.id}
                                    className={`flex-row items-center p-4 ${index < groups.length - 1 ? "border-b border-gray-100" : ""}`}
                                >
                                    <View style={{ backgroundColor: "#F3E8FF" }} className="w-10 h-10 rounded-xl items-center justify-center">
                                        <Ionicons name="folder" size={22} color="#8B5CF6" />
                                    </View>
                                    <View className="ml-3 flex-1">
                                        <Text className="text-gray-800 font-semibold">{group.name}</Text>
                                        <Text className="text-gray-500 text-sm">
                                            {groupMedCount}개의 약
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleEditGroup({ id: group.id!, name: group.name })}
                                        style={{ marginRight: 12 }}
                                    >
                                        <Ionicons name="create-outline" size={20} color="#007AFF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleDeleteGroup(group.id!, group.name)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            );
                        })
                    )}

                    {/* 그룹 추가 버튼 */}
                    <TouchableOpacity
                        onPress={() => {
                            setEditingGroup(null);
                            setGroupName("");
                            setShowGroupModal(true);
                        }}
                        className={`flex-row items-center p-4 ${groups.length > 0 ? "border-t border-gray-100" : ""}`}
                    >
                        <View style={{ backgroundColor: "#ECFDF5" }} className="w-10 h-10 rounded-xl items-center justify-center">
                            <Ionicons name="add-circle" size={22} color="#10B981" />
                        </View>
                        <Text className="ml-3 text-green-600 font-medium flex-1">
                            새 그룹 추가
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
                        meds.map((med, index) => {
                            const medGroup = groups.find(g => g.id === med.group_id);
                            return (
                                <View
                                    key={med.id}
                                    className={`flex-row items-center p-4 ${index < meds.length - 1 ? "border-b border-gray-100" : ""}`}
                                >
                                    <View className="bg-primary/10 w-10 h-10 rounded-xl items-center justify-center">
                                        <Ionicons name="medical" size={22} color="#007AFF" />
                                    </View>
                                    <View className="ml-3 flex-1">
                                        <Text className="text-gray-800 font-semibold">{med.name}</Text>
                                        <Text className="text-gray-500 text-sm">
                                            1일 {med.daily_freq}회 • {med.duration_days}일분
                                            {medGroup ? ` • ${medGroup.name}` : ""}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleChangeMedGroup({ id: med.id!, name: med.name, group_id: med.group_id })}
                                        style={{ marginRight: 12 }}
                                    >
                                        <Ionicons name="folder-outline" size={20} color="#8B5CF6" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleDeleteMed(med.id!, med.name)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            );
                        })
                    )}
                </View>
            </View>

            {/* Group Add/Edit Modal */}
            <Modal
                visible={showGroupModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowGroupModal(false)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 20,
                }}>
                    <View style={{
                        backgroundColor: "white",
                        borderRadius: 20,
                        padding: 24,
                        width: "100%",
                        maxWidth: 340,
                    }}>
                        <Text style={{ fontSize: 20, fontWeight: "bold", color: "#1F2937", marginBottom: 16 }}>
                            {editingGroup ? "그룹 이름 변경" : "새 그룹 추가"}
                        </Text>
                        <TextInput
                            style={{
                                backgroundColor: "#F3F4F6",
                                borderRadius: 12,
                                paddingHorizontal: 16,
                                paddingVertical: 14,
                                fontSize: 18,
                                color: "#1F2937",
                                marginBottom: 20,
                            }}
                            placeholder="예: 아침약, 저녁약"
                            value={groupName}
                            onChangeText={setGroupName}
                            placeholderTextColor="#9CA3AF"
                            autoFocus
                        />
                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowGroupModal(false);
                                    setEditingGroup(null);
                                    setGroupName("");
                                }}
                                style={{
                                    flex: 1,
                                    paddingVertical: 14,
                                    borderRadius: 12,
                                    backgroundColor: "#F3F4F6",
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ fontSize: 16, fontWeight: "600", color: "#6B7280" }}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={editingGroup ? handleUpdateGroup : handleAddGroup}
                                style={{
                                    flex: 1,
                                    paddingVertical: 14,
                                    borderRadius: 12,
                                    backgroundColor: "#007AFF",
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>
                                    {editingGroup ? "변경" : "추가"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Med Group Assignment Modal */}
            <Modal
                visible={showMedGroupModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowMedGroupModal(false)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 20,
                }}>
                    <View style={{
                        backgroundColor: "white",
                        borderRadius: 20,
                        padding: 24,
                        width: "100%",
                        maxWidth: 340,
                    }}>
                        <Text style={{ fontSize: 20, fontWeight: "bold", color: "#1F2937", marginBottom: 4 }}>
                            그룹 변경
                        </Text>
                        <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 20 }}>
                            {selectedMedForGroup?.name}
                        </Text>
                        <View style={{ gap: 8 }}>
                            <TouchableOpacity
                                onPress={() => handleAssignMedToGroup(null)}
                                style={{
                                    paddingVertical: 14,
                                    paddingHorizontal: 16,
                                    borderRadius: 12,
                                    backgroundColor: selectedMedForGroup?.group_id == null ? "#F3F4F6" : "white",
                                    borderWidth: 2,
                                    borderColor: selectedMedForGroup?.group_id == null ? "#6B7280" : "#E5E7EB",
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}
                            >
                                <Ionicons name="close-circle-outline" size={20} color="#6B7280" />
                                <Text style={{ fontSize: 16, color: "#374151", marginLeft: 10, fontWeight: "500" }}>없음</Text>
                            </TouchableOpacity>
                            {groups.map((group) => (
                                <TouchableOpacity
                                    key={group.id}
                                    onPress={() => handleAssignMedToGroup(group.id!)}
                                    style={{
                                        paddingVertical: 14,
                                        paddingHorizontal: 16,
                                        borderRadius: 12,
                                        backgroundColor: selectedMedForGroup?.group_id === group.id ? "#F5F3FF" : "white",
                                        borderWidth: 2,
                                        borderColor: selectedMedForGroup?.group_id === group.id ? "#8B5CF6" : "#E5E7EB",
                                        flexDirection: "row",
                                        alignItems: "center",
                                    }}
                                >
                                    <Ionicons name="folder" size={20} color="#8B5CF6" />
                                    <Text style={{ fontSize: 16, color: "#374151", marginLeft: 10, fontWeight: "500" }}>{group.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity
                            onPress={() => {
                                setShowMedGroupModal(false);
                                setSelectedMedForGroup(null);
                            }}
                            style={{
                                marginTop: 16,
                                paddingVertical: 14,
                                borderRadius: 12,
                                backgroundColor: "#F3F4F6",
                                alignItems: "center",
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: "600", color: "#6B7280" }}>닫기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

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
