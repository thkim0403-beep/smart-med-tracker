import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Med, Log } from "../database/schema";

interface MedCardProps {
    med: Med;
    logs: Log[];
    onMarkTaken: (alarmId: number) => void;
}

export function MedCard({ med, logs, onMarkTaken }: MedCardProps) {
    // 오늘 복용 완료 횟수
    const takenCount = logs.filter(log => log.status === "taken").length;
    const totalToday = med.daily_freq;
    const isComplete = takenCount >= totalToday;

    // 진행률 계산
    const progress = totalToday > 0 ? (takenCount / totalToday) * 100 : 0;

    const getStatusColor = () => {
        if (isComplete) return "#10B981"; // 완료 - 초록
        if (takenCount > 0) return "#F59E0B"; // 진행중 - 주황
        return "#6B7280"; // 미시작 - 회색
    };

    return (
        <View style={{
            backgroundColor: "white",
            borderRadius: 20,
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
            borderLeftWidth: 5,
            borderLeftColor: getStatusColor(),
        }}>
            {/* 약 이름과 상태 */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 20, fontWeight: "bold", color: "#1F2937" }}>
                        💊 {med.name}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>
                        1일 {med.daily_freq}회 • {med.duration_days}일분
                    </Text>
                </View>

                {/* 완료 상태 배지 */}
                <View style={{
                    backgroundColor: isComplete ? "#D1FAE5" : (takenCount > 0 ? "#FEF3C7" : "#F3F4F6"),
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                }}>
                    <Text style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: isComplete ? "#059669" : (takenCount > 0 ? "#D97706" : "#6B7280"),
                    }}>
                        {isComplete ? "✅ 완료" : `${takenCount}/${totalToday}회`}
                    </Text>
                </View>
            </View>

            {/* 진행 바 */}
            <View style={{
                height: 8,
                backgroundColor: "#E5E7EB",
                borderRadius: 4,
                marginTop: 16,
                overflow: "hidden",
            }}>
                <View style={{
                    height: "100%",
                    width: `${Math.min(progress, 100)}%`,
                    backgroundColor: getStatusColor(),
                    borderRadius: 4,
                }} />
            </View>

            {/* 복용 버튼 */}
            {!isComplete && (
                <TouchableOpacity
                    onPress={() => {
                        // 가장 최근 미복용 알람 찾기 (임시로 첫 번째 사용)
                        onMarkTaken(med.id!);
                    }}
                    style={{
                        backgroundColor: "#007AFF",
                        paddingVertical: 14,
                        borderRadius: 14,
                        alignItems: "center",
                        marginTop: 16,
                        flexDirection: "row",
                        justifyContent: "center",
                    }}
                >
                    <Ionicons name="checkmark-circle" size={22} color="white" />
                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 16, marginLeft: 8 }}>
                        복용 완료
                    </Text>
                </TouchableOpacity>
            )}

            {isComplete && (
                <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 16,
                    paddingVertical: 12,
                    backgroundColor: "#D1FAE5",
                    borderRadius: 14,
                }}>
                    <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                    <Text style={{ color: "#059669", fontWeight: "600", fontSize: 16, marginLeft: 8 }}>
                        오늘 복용 완료! 🎉
                    </Text>
                </View>
            )}
        </View>
    );
}
