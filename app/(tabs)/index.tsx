import React, { useEffect, useState } from "react";
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
import { ComplianceCalendar } from "../../src/components/ComplianceCalendar";
import * as dbOps from "../../src/database/operations";
import { DailyStats } from "../../src/database/operations";

type PeriodType = "today" | "week" | "month";

export default function HomeScreen() {
    const { meds, logs, loadMeds, loadTodayLogs, markAsTaken, isLoading } = useMedStore();
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("today");
    const [periodStats, setPeriodStats] = useState({
        completed: 0,
        total: 0,
        progress: 0,
    });
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);

    useEffect(() => {
        loadMeds();
        loadTodayLogs();
    }, []);

    useEffect(() => {
        calculatePeriodStats();
    }, [selectedPeriod, meds, logs]);

    const calculatePeriodStats = async () => {
        const today = new Date();
        let startDate: string;
        let endDate: string = today.toISOString().split("T")[0];

        if (selectedPeriod === "today") {
            // 오늘 복용률 (기존 로직)
            const totalDoses = meds.reduce((sum, med) => sum + med.daily_freq, 0);
            const completedDoses = logs.filter(log => log.status === "taken").length;
            const progress = totalDoses > 0 ? (completedDoses / totalDoses) * 100 : 0;
            setPeriodStats({ completed: completedDoses, total: totalDoses, progress });
            return;
        } else if (selectedPeriod === "week") {
            // 일주일 전
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 6);
            startDate = weekAgo.toISOString().split("T")[0];
        } else {
            // 한달 전
            const monthAgo = new Date(today);
            monthAgo.setDate(monthAgo.getDate() - 29);
            startDate = monthAgo.toISOString().split("T")[0];
        }

        try {
            const periodLogs = await dbOps.getLogsByDateRange(startDate, endDate);
            const expectedDoses = await dbOps.getExpectedDosesByDateRange(startDate, endDate);
            const completedDoses = periodLogs.filter(log => log.status === "taken").length;
            const progress = expectedDoses > 0 ? (completedDoses / expectedDoses) * 100 : 0;
            setPeriodStats({ completed: completedDoses, total: expectedDoses, progress });

            // 일별 통계 가져오기 (달력용)
            const daily = await dbOps.getDailyComplianceStats(startDate, endDate);
            setDailyStats(daily);
        } catch (error) {
            console.error("Failed to calculate period stats:", error);
        }
    };

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

    // 현재 시간 기준으로 다음 복용 약 찾기
    const currentTime = today.toTimeString().slice(0, 5); // "HH:mm" 형식

    const periodLabels = {
        today: "오늘",
        week: "7일",
        month: "30일",
    };

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
                    {/* 기간 선택 버튼 */}
                    <View style={{
                        flexDirection: "row",
                        backgroundColor: "#F3F4F6",
                        borderRadius: 12,
                        padding: 4,
                        marginBottom: 16,
                    }}>
                        {(["today", "week", "month"] as PeriodType[]).map((period) => (
                            <TouchableOpacity
                                key={period}
                                onPress={() => setSelectedPeriod(period)}
                                style={{
                                    flex: 1,
                                    paddingVertical: 10,
                                    borderRadius: 10,
                                    backgroundColor: selectedPeriod === period ? "white" : "transparent",
                                    shadowColor: selectedPeriod === period ? "#000" : "transparent",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: selectedPeriod === period ? 0.1 : 0,
                                    shadowRadius: 4,
                                    elevation: selectedPeriod === period ? 2 : 0,
                                }}
                            >
                                <Text style={{
                                    textAlign: "center",
                                    fontWeight: selectedPeriod === period ? "bold" : "500",
                                    color: selectedPeriod === period ? "#007AFF" : "#6B7280",
                                    fontSize: 15,
                                }}>
                                    {periodLabels[period]}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View>
                            <Text style={{ fontSize: 16, color: "#6B7280" }}>
                                {periodLabels[selectedPeriod]} 복용 진행률
                            </Text>
                            <Text style={{ fontSize: 32, fontWeight: "bold", color: "#1F2937", marginTop: 4 }}>
                                {periodStats.completed} / {periodStats.total}
                            </Text>
                        </View>
                        <View style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            borderWidth: 8,
                            borderColor: periodStats.progress >= 100 ? "#10B981" : periodStats.progress >= 70 ? "#007AFF" : "#F59E0B",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: periodStats.progress >= 100 ? "#D1FAE5" : "#F9FAFB",
                        }}>
                            <Text style={{
                                fontSize: 20,
                                fontWeight: "bold",
                                color: periodStats.progress >= 100 ? "#10B981" : periodStats.progress >= 70 ? "#007AFF" : "#F59E0B",
                            }}>
                                {Math.round(periodStats.progress)}%
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
                            width: `${Math.min(periodStats.progress, 100)}%`,
                            backgroundColor: periodStats.progress >= 100 ? "#10B981" : periodStats.progress >= 70 ? "#007AFF" : "#F59E0B",
                            borderRadius: 6,
                        }} />
                    </View>

                    {periodStats.progress >= 100 && selectedPeriod === "today" && (
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

                    {selectedPeriod !== "today" && periodStats.progress >= 80 && (
                        <View style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 12,
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            backgroundColor: "#DBEAFE",
                            borderRadius: 10,
                        }}>
                            <Ionicons name="star" size={20} color="#3B82F6" />
                            <Text style={{ marginLeft: 8, color: "#1D4ED8", fontWeight: "600" }}>
                                훌륭해요! 복용률이 {Math.round(periodStats.progress)}%입니다! ⭐
                            </Text>
                        </View>
                    )}

                    {/* 달력 (7일, 30일 선택 시) */}
                    {selectedPeriod !== "today" && dailyStats.length > 0 && (
                        <ComplianceCalendar
                            days={dailyStats}
                            periodType={selectedPeriod}
                        />
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
