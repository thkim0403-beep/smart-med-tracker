import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Med, MedGroup, Log } from "../database/schema";
import { MedCard } from "./MedCard";

interface MedGroupCardProps {
    group: MedGroup;
    meds: Med[];
    logs: Log[];
    onMarkGroupTaken: (groupId: number) => void;
    onMarkTaken: (medId: number) => void;
}

export function MedGroupCard({ group, meds, logs, onMarkGroupTaken, onMarkTaken }: MedGroupCardProps) {
    const [expanded, setExpanded] = useState(false);

    // 그룹 전체 진행률 계산
    const totalDoses = meds.reduce((sum, med) => sum + med.daily_freq, 0);
    const completedDoses = meds.reduce((sum, med) => {
        const medLogs = logs.filter(l => l.med_id === med.id && l.status === "taken");
        return sum + Math.min(medLogs.length, med.daily_freq);
    }, 0);
    const isAllComplete = totalDoses > 0 && completedDoses >= totalDoses;
    const progress = totalDoses > 0 ? (completedDoses / totalDoses) * 100 : 0;

    const getStatusColor = () => {
        if (isAllComplete) return "#10B981";
        if (completedDoses > 0) return "#F59E0B";
        return "#6B7280";
    };

    return (
        <View style={{
            backgroundColor: "white",
            borderRadius: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
            borderLeftWidth: 5,
            borderLeftColor: getStatusColor(),
            overflow: "hidden",
        }}>
            {/* 그룹 헤더 */}
            <TouchableOpacity
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.7}
                style={{ padding: 20 }}
            >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Ionicons name="folder" size={20} color={getStatusColor()} />
                            <Text style={{ fontSize: 20, fontWeight: "bold", color: "#1F2937", marginLeft: 8 }}>
                                {group.name}
                            </Text>
                        </View>
                        <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>
                            {meds.length}개의 약
                        </Text>
                    </View>

                    {/* 완료 상태 배지 */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View style={{
                            backgroundColor: isAllComplete ? "#D1FAE5" : (completedDoses > 0 ? "#FEF3C7" : "#F3F4F6"),
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 20,
                        }}>
                            <Text style={{
                                fontSize: 14,
                                fontWeight: "600",
                                color: isAllComplete ? "#059669" : (completedDoses > 0 ? "#D97706" : "#6B7280"),
                            }}>
                                {isAllComplete ? "완료" : `${completedDoses}/${totalDoses}`}
                            </Text>
                        </View>
                        <Ionicons
                            name={expanded ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#9CA3AF"
                        />
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
            </TouchableOpacity>

            {/* 모두 복용 완료 버튼 */}
            {!isAllComplete && (
                <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
                    <TouchableOpacity
                        onPress={() => onMarkGroupTaken(group.id!)}
                        style={{
                            backgroundColor: "#007AFF",
                            paddingVertical: 14,
                            borderRadius: 14,
                            alignItems: "center",
                            flexDirection: "row",
                            justifyContent: "center",
                        }}
                    >
                        <Ionicons name="checkmark-done-circle" size={22} color="white" />
                        <Text style={{ color: "white", fontWeight: "bold", fontSize: 16, marginLeft: 8 }}>
                            모두 복용 완료
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {isAllComplete && (
                <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
                    <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 12,
                        backgroundColor: "#D1FAE5",
                        borderRadius: 14,
                    }}>
                        <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                        <Text style={{ color: "#059669", fontWeight: "600", fontSize: 16, marginLeft: 8 }}>
                            그룹 복용 완료!
                        </Text>
                    </View>
                </View>
            )}

            {/* 개별 약 카드 (접기/펼치기) */}
            {expanded && (
                <View style={{
                    borderTopWidth: 1,
                    borderTopColor: "#F3F4F6",
                    padding: 12,
                    gap: 10,
                    backgroundColor: "#F9FAFB",
                }}>
                    {meds.map((med) => (
                        <MedCard
                            key={med.id}
                            med={med}
                            logs={logs.filter(l => l.med_id === med.id)}
                            onMarkTaken={(medId) => onMarkTaken(medId)}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}
