import React from "react";
import { View, Text } from "react-native";

interface DayStatus {
    date: string; // YYYY-MM-DD
    completed: number;
    total: number;
    percentage: number;
}

interface ComplianceCalendarProps {
    days: DayStatus[];
    periodType: "week" | "month";
}

export function ComplianceCalendar({ days, periodType }: ComplianceCalendarProps) {
    const getStatusColor = (percentage: number, total: number) => {
        if (total === 0) return "#E5E7EB"; // 복용할 약 없음
        if (percentage >= 100) return "#10B981"; // 완료
        if (percentage >= 50) return "#F59E0B"; // 일부 완료
        if (percentage > 0) return "#F97316"; // 조금만 복용
        return "#EF4444"; // 미복용
    };

    const getDayLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.getDate().toString();
    };

    const getWeekdayLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
        return weekdays[date.getDay()];
    };

    const isToday = (dateStr: string) => {
        const today = new Date().toISOString().split("T")[0];
        return dateStr === today;
    };

    if (periodType === "week") {
        // 일주일 뷰 - 가로로 7일 표시
        return (
            <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 12, fontWeight: "600" }}>
                    📅 일별 복용 현황
                </Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    {days.slice(-7).map((day) => (
                        <View key={day.date} style={{ alignItems: "center", flex: 1 }}>
                            <Text style={{
                                fontSize: 11,
                                color: isToday(day.date) ? "#007AFF" : "#9CA3AF",
                                fontWeight: isToday(day.date) ? "bold" : "normal",
                            }}>
                                {getWeekdayLabel(day.date)}
                            </Text>
                            <View style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: getStatusColor(day.percentage, day.total),
                                alignItems: "center",
                                justifyContent: "center",
                                marginTop: 4,
                                borderWidth: isToday(day.date) ? 2 : 0,
                                borderColor: "#007AFF",
                            }}>
                                <Text style={{
                                    color: day.total === 0 ? "#9CA3AF" : "white",
                                    fontWeight: "bold",
                                    fontSize: 13,
                                }}>
                                    {getDayLabel(day.date)}
                                </Text>
                            </View>
                            <Text style={{
                                fontSize: 10,
                                color: "#6B7280",
                                marginTop: 2,
                            }}>
                                {day.total > 0 ? `${day.completed}/${day.total}` : "-"}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* 범례 */}
                <View style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    marginTop: 12,
                    flexWrap: "wrap",
                    gap: 8,
                }}>
                    <LegendItem color="#10B981" label="완료" />
                    <LegendItem color="#F59E0B" label="일부" />
                    <LegendItem color="#EF4444" label="미복용" />
                    <LegendItem color="#E5E7EB" label="없음" />
                </View>
            </View>
        );
    }

    // 30일 뷰 - 격자로 표시
    const weeks: DayStatus[][] = [];
    let currentWeek: DayStatus[] = [];

    // 첫 번째 날의 요일에 맞춰 빈 칸 추가
    if (days.length > 0) {
        const firstDay = new Date(days[0].date).getDay();
        for (let i = 0; i < firstDay; i++) {
            currentWeek.push({ date: "", completed: 0, total: 0, percentage: 0 });
        }
    }

    days.forEach((day) => {
        currentWeek.push(day);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });
    if (currentWeek.length > 0) {
        weeks.push(currentWeek);
    }

    return (
        <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 12, fontWeight: "600" }}>
                📅 일별 복용 현황
            </Text>

            {/* 요일 헤더 */}
            <View style={{ flexDirection: "row", marginBottom: 4 }}>
                {["일", "월", "화", "수", "목", "금", "토"].map((day, i) => (
                    <Text key={day} style={{
                        flex: 1,
                        textAlign: "center",
                        fontSize: 11,
                        color: i === 0 ? "#EF4444" : i === 6 ? "#3B82F6" : "#9CA3AF",
                        fontWeight: "500",
                    }}>
                        {day}
                    </Text>
                ))}
            </View>

            {/* 달력 격자 */}
            {weeks.map((week, weekIndex) => (
                <View key={weekIndex} style={{ flexDirection: "row", marginBottom: 4 }}>
                    {week.map((day, dayIndex) => (
                        <View key={dayIndex} style={{ flex: 1, alignItems: "center", padding: 2 }}>
                            {day.date ? (
                                <View style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    backgroundColor: getStatusColor(day.percentage, day.total),
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderWidth: isToday(day.date) ? 2 : 0,
                                    borderColor: "#007AFF",
                                }}>
                                    <Text style={{
                                        color: day.total === 0 ? "#9CA3AF" : "white",
                                        fontWeight: isToday(day.date) ? "bold" : "500",
                                        fontSize: 12,
                                    }}>
                                        {getDayLabel(day.date)}
                                    </Text>
                                </View>
                            ) : (
                                <View style={{ width: 32, height: 32 }} />
                            )}
                        </View>
                    ))}
                    {/* 마지막 주 빈 칸 채우기 */}
                    {week.length < 7 && Array.from({ length: 7 - week.length }).map((_, i) => (
                        <View key={`empty-${i}`} style={{ flex: 1 }} />
                    ))}
                </View>
            ))}

            {/* 범례 */}
            <View style={{
                flexDirection: "row",
                justifyContent: "center",
                marginTop: 12,
                flexWrap: "wrap",
                gap: 8,
            }}>
                <LegendItem color="#10B981" label="완료" />
                <LegendItem color="#F59E0B" label="일부" />
                <LegendItem color="#EF4444" label="미복용" />
                <LegendItem color="#E5E7EB" label="없음" />
            </View>
        </View>
    );
}

function LegendItem({ color, label }: { color: string; label: string }) {
    return (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{
                width: 12,
                height: 12,
                borderRadius: 4,
                backgroundColor: color,
                marginRight: 4,
            }} />
            <Text style={{ fontSize: 11, color: "#6B7280" }}>{label}</Text>
        </View>
    );
}
