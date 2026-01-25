import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface MedFormData {
    name: string;
    timesPerDay: number;
    times: string[];
    duration: number;
}

interface MedFormProps {
    initialData?: Partial<MedFormData>;
    onSubmit: (data: MedFormData) => void;
    isLoading?: boolean;
}

const DEFAULT_TIMES: Record<number, string[]> = {
    1: ["08:00"],
    2: ["08:00", "20:00"],
    3: ["08:00", "13:00", "19:00"],
    4: ["08:00", "12:00", "18:00", "22:00"],
};

// 시간 프리셋 (어르신들이 선택하기 쉽게)
const TIME_PRESETS = [
    { label: "아침 7시", value: "07:00", icon: "🌅" },
    { label: "아침 8시", value: "08:00", icon: "🌅" },
    { label: "점심 12시", value: "12:00", icon: "☀️" },
    { label: "오후 1시", value: "13:00", icon: "☀️" },
    { label: "저녁 6시", value: "18:00", icon: "🌆" },
    { label: "저녁 7시", value: "19:00", icon: "🌆" },
    { label: "밤 9시", value: "21:00", icon: "🌙" },
    { label: "밤 10시", value: "22:00", icon: "🌙" },
];

// 일수 프리셋
const DURATION_PRESETS = [3, 5, 7, 14, 21, 30];

export function MedForm({ initialData, onSubmit, isLoading }: MedFormProps) {
    const [name, setName] = useState(initialData?.name || "");
    const [timesPerDay, setTimesPerDay] = useState(
        initialData?.timesPerDay?.toString() || "3"
    );
    const [times, setTimes] = useState<string[]>(
        initialData?.times || DEFAULT_TIMES[3]
    );
    const [duration, setDuration] = useState(
        initialData?.duration?.toString() || "7"
    );
    const [selectedTimeIndex, setSelectedTimeIndex] = useState<number | null>(null);

    const handleTimesPerDayChange = (value: string) => {
        setTimesPerDay(value);
        const num = parseInt(value) || 1;
        if (num >= 1 && num <= 4) {
            setTimes(DEFAULT_TIMES[num] || DEFAULT_TIMES[1]);
        }
    };

    const updateTime = (index: number, value: string) => {
        const newTimes = [...times];
        newTimes[index] = value;
        setTimes(newTimes);
        setSelectedTimeIndex(null);
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            Alert.alert("입력 필요", "💊 약 이름을 입력해주세요.");
            return;
        }

        const numTimesPerDay = parseInt(timesPerDay) || 1;
        const numDuration = parseInt(duration) || 7;

        if (numTimesPerDay < 1 || numTimesPerDay > 10) {
            Alert.alert("오류", "복용 횟수는 1~10 사이여야 합니다.");
            return;
        }

        if (numDuration < 1 || numDuration > 365) {
            Alert.alert("오류", "투약 일수는 1~365 사이여야 합니다.");
            return;
        }

        onSubmit({
            name: name.trim(),
            timesPerDay: numTimesPerDay,
            times: times.slice(0, numTimesPerDay),
            duration: numDuration,
        });
    };

    const getTimeLabel = (time: string) => {
        const preset = TIME_PRESETS.find(p => p.value === time);
        return preset ? `${preset.icon} ${preset.label}` : time;
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <View style={{ padding: 20 }}>
                {/* Medicine Name */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: '#374151',
                        marginBottom: 12
                    }}>
                        💊 약 이름
                    </Text>
                    <TextInput
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 16,
                            paddingHorizontal: 20,
                            paddingVertical: 18,
                            fontSize: 20,
                            color: '#1F2937',
                            borderWidth: 2,
                            borderColor: name ? '#007AFF' : '#E5E7EB',
                        }}
                        placeholder="예: 혈압약"
                        value={name}
                        onChangeText={setName}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                {/* Times Per Day */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: '#374151',
                        marginBottom: 12
                    }}>
                        🕐 하루에 몇 번 드시나요?
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        {[1, 2, 3, 4].map((num) => (
                            <TouchableOpacity
                                key={num}
                                onPress={() => handleTimesPerDayChange(num.toString())}
                                style={{
                                    flex: 1,
                                    paddingVertical: 20,
                                    borderRadius: 16,
                                    alignItems: 'center',
                                    backgroundColor: timesPerDay === num.toString() ? '#007AFF' : 'white',
                                    borderWidth: 2,
                                    borderColor: timesPerDay === num.toString() ? '#007AFF' : '#E5E7EB',
                                }}
                            >
                                <Text style={{
                                    fontSize: 24,
                                    fontWeight: 'bold',
                                    color: timesPerDay === num.toString() ? 'white' : '#374151',
                                }}>
                                    {num}번
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Times - 시간 선택 */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: '#374151',
                        marginBottom: 12
                    }}>
                        ⏰ 언제 드시나요?
                    </Text>
                    <View style={{ gap: 12 }}>
                        {times.slice(0, parseInt(timesPerDay) || 1).map((time, index) => (
                            <View key={index}>
                                <TouchableOpacity
                                    onPress={() => setSelectedTimeIndex(selectedTimeIndex === index ? null : index)}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: 'white',
                                        borderRadius: 16,
                                        paddingHorizontal: 20,
                                        paddingVertical: 18,
                                        borderWidth: 2,
                                        borderColor: selectedTimeIndex === index ? '#007AFF' : '#E5E7EB',
                                    }}
                                >
                                    <Text style={{ fontSize: 18, color: '#374151' }}>
                                        {index + 1}번째 복용
                                    </Text>
                                    <View style={{ flex: 1 }} />
                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#007AFF' }}>
                                        {getTimeLabel(time)}
                                    </Text>
                                    <Ionicons
                                        name={selectedTimeIndex === index ? "chevron-up" : "chevron-down"}
                                        size={24}
                                        color="#9CA3AF"
                                        style={{ marginLeft: 8 }}
                                    />
                                </TouchableOpacity>

                                {/* 시간 선택 패널 */}
                                {selectedTimeIndex === index && (
                                    <View style={{
                                        backgroundColor: 'white',
                                        borderRadius: 16,
                                        marginTop: 8,
                                        padding: 12,
                                        borderWidth: 1,
                                        borderColor: '#E5E7EB',
                                    }}>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                            {TIME_PRESETS.map((preset) => (
                                                <TouchableOpacity
                                                    key={preset.value}
                                                    onPress={() => updateTime(index, preset.value)}
                                                    style={{
                                                        paddingHorizontal: 16,
                                                        paddingVertical: 14,
                                                        borderRadius: 12,
                                                        backgroundColor: time === preset.value ? '#007AFF' : '#F3F4F6',
                                                        minWidth: '45%',
                                                    }}
                                                >
                                                    <Text style={{
                                                        fontSize: 16,
                                                        fontWeight: '600',
                                                        color: time === preset.value ? 'white' : '#374151',
                                                        textAlign: 'center',
                                                    }}>
                                                        {preset.icon} {preset.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>

                                        {/* 직접 시간 입력 */}
                                        <View style={{
                                            marginTop: 16,
                                            paddingTop: 16,
                                            borderTopWidth: 1,
                                            borderTopColor: '#E5E7EB',
                                        }}>
                                            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
                                                ✏️ 직접 입력 (예: 09:30)
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <TextInput
                                                    style={{
                                                        backgroundColor: '#F3F4F6',
                                                        borderRadius: 12,
                                                        paddingHorizontal: 20,
                                                        paddingVertical: 14,
                                                        fontSize: 20,
                                                        fontWeight: 'bold',
                                                        color: '#1F2937',
                                                        textAlign: 'center',
                                                        flex: 1,
                                                    }}
                                                    placeholder="09:30"
                                                    value={time}
                                                    onChangeText={(value) => updateTime(index, value)}
                                                    keyboardType="numbers-and-punctuation"
                                                    placeholderTextColor="#9CA3AF"
                                                />
                                                <TouchableOpacity
                                                    onPress={() => setSelectedTimeIndex(null)}
                                                    style={{
                                                        backgroundColor: '#10B981',
                                                        paddingHorizontal: 20,
                                                        paddingVertical: 14,
                                                        borderRadius: 12,
                                                    }}
                                                >
                                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                                                        확인
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Duration */}
                <View style={{ marginBottom: 32 }}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: '#374151',
                        marginBottom: 12
                    }}>
                        📅 며칠 동안 드시나요?
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        {DURATION_PRESETS.map((days) => (
                            <TouchableOpacity
                                key={days}
                                onPress={() => setDuration(days.toString())}
                                style={{
                                    paddingHorizontal: 24,
                                    paddingVertical: 16,
                                    borderRadius: 16,
                                    backgroundColor: duration === days.toString() ? '#10B981' : 'white',
                                    borderWidth: 2,
                                    borderColor: duration === days.toString() ? '#10B981' : '#E5E7EB',
                                    minWidth: '30%',
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{
                                    fontSize: 20,
                                    fontWeight: 'bold',
                                    color: duration === days.toString() ? 'white' : '#374151',
                                }}>
                                    {days}일
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* 직접 입력 */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 12,
                    }}>
                        <Text style={{ fontSize: 16, color: '#6B7280', marginRight: 8 }}>
                            직접 입력:
                        </Text>
                        <TextInput
                            style={{
                                backgroundColor: 'white',
                                borderRadius: 12,
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                                fontSize: 18,
                                color: '#1F2937',
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                width: 80,
                                textAlign: 'center',
                            }}
                            value={duration}
                            onChangeText={setDuration}
                            keyboardType="number-pad"
                            placeholder="7"
                            placeholderTextColor="#9CA3AF"
                        />
                        <Text style={{ fontSize: 18, color: '#374151', marginLeft: 8 }}>일</Text>
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isLoading}
                    style={{
                        backgroundColor: isLoading ? '#9CA3AF' : '#007AFF',
                        paddingVertical: 22,
                        borderRadius: 20,
                        alignItems: 'center',
                        shadowColor: '#007AFF',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6,
                    }}
                >
                    {isLoading ? (
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 22 }}>
                            저장 중...
                        </Text>
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="checkmark-circle" size={28} color="white" />
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 22, marginLeft: 10 }}>
                                ✅ 약 저장하기
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
