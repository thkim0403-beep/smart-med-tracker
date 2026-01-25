import React, { useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMedStore } from "../../src/store/medStore";
import { MedCard } from "../../src/components/MedCard";

export default function HomeScreen() {
    const { meds, logs, loadMeds, loadTodayLogs, markAsTaken, isLoading } = useMedStore();

    useEffect(() => {
        loadMeds();
        loadTodayLogs();
    }, []);

    const onRefresh = () => {
        loadMeds();
        loadTodayLogs();
    };

    // 오늘 날짜
    const today = new Date();
    const dateString = today.toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
        weekday: "long",
    });

    // 오늘 복용해야 할 총 횟수와 완료 횟수 계산
    const totalDoses = meds.reduce((sum, med) => sum + med.daily_freq, 0);
    const completedDoses = logs.filter(log => log.status === "taken").length;
    const progress = totalDoses > 0 ? (completedDoses / totalDoses) * 100 : 0;

    // 현재 시간 기준으로 다음 복용 약 찾기
    const currentTime = today.toTimeString().slice(0, 5); // "HH:mm" 형식

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: "#F9FAFB" }}
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
            }
        >
            {/* 헤더 */}
            <View style={{
                backgroundColor: "#007AFF",
                paddingTop: 20,
                paddingBottom: 30,
                paddingHorizontal: 20,
                borderBottomLeftRadius: 30,
                borderBottomRightRadius: 30,
            }}>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 16 }}>
                    {dateString}
                </Text>
                <Text style={{ color: "white", fontSize: 28, fontWeight: "bold", marginTop: 4 }}>
                    오늘의 복약 💊
                </Text>

                {/* 진행률 카드 */}
                <View style={{
                    backgroundColor: "white",
                    borderRadius: 20,
                    padding: 20,
                    marginTop: 20,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View>
                            <Text style={{ fontSize: 16, color: "#6B7280" }}>
                                오늘 복용 진행률
                            </Text>
                            <Text style={{ fontSize: 32, fontWeight: "bold", color: "#1F2937", marginTop: 4 }}>
                                {completedDoses} / {totalDoses}
                            </Text>
                        </View>
                        <View style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            borderWidth: 8,
                            borderColor: progress >= 100 ? "#10B981" : "#E5E7EB",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: progress >= 100 ? "#D1FAE5" : "#F9FAFB",
                        }}>
                            <Text style={{
                                fontSize: 20,
                                fontWeight: "bold",
                                color: progress >= 100 ? "#10B981" : "#374151",
                            }}>
                                {Math.round(progress)}%
                            </Text>
                        </View>
                    </View>

                    {/* 진행 바 */}
                    <View style={{
                        height: 12,
                        backgroundColor: "#E5E7EB",
                        borderRadius: 6,
                        marginTop: 16,
                        overflow: "hidden",
                    }}>
                        <View style={{
                            height: "100%",
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor: progress >= 100 ? "#10B981" : "#007AFF",
                            borderRadius: 6,
                        }} />
                    </View>

                    {progress >= 100 && (
                        <View style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 12,
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            backgroundColor: "#D1FAE5",
                            borderRadius: 10,
                        }}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={{ marginLeft: 8, color: "#059669", fontWeight: "600" }}>
                                오늘 복용을 모두 완료했어요! 🎉
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* 등록된 약 목록 */}
            <View style={{ padding: 20 }}>
                <Text style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: "#1F2937",
                    marginBottom: 16,
                }}>
                    나의 약 목록 📋
                </Text>

                {meds.length === 0 ? (
                    <View style={{
                        backgroundColor: "white",
                        borderRadius: 20,
                        padding: 40,
                        alignItems: "center",
                    }}>
                        <Ionicons name="medical-outline" size={64} color="#D1D5DB" />
                        <Text style={{
                            fontSize: 18,
                            color: "#9CA3AF",
                            marginTop: 16,
                            textAlign: "center",
                        }}>
                            등록된 약이 없어요
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: "#D1D5DB",
                            marginTop: 8,
                            textAlign: "center",
                        }}>
                            아래 "약 추가" 탭에서 약을 등록하세요
                        </Text>
                    </View>
                ) : (
                    <View style={{ gap: 12 }}>
                        {meds.map((med) => (
                            <MedCard
                                key={med.id}
                                med={med}
                                logs={logs.filter(l => l.med_id === med.id)}
                                onMarkTaken={(alarmId) => markAsTaken(alarmId)}
                            />
                        ))}
                    </View>
                )}
            </View>

            {/* 하단 여백 */}
            <View style={{ height: 100 }} />
        </ScrollView>
    );
}
