import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { extractTextFromImage, cleanOCRText } from "../../src/services/ocr";
import { parseMedicineText, ParsedMedicineInfo } from "../../src/services/medicineParser";
import { useMedStore } from "../../src/store/medStore";
import { scheduleMedicationReminders, requestNotificationPermissions } from "../../src/services/notifications";
import { MedForm, MedFormData } from "../../src/components/MedForm";

type Step = "choose" | "ocr-result" | "review" | "form";

export default function AddMedicineScreen() {
    const [step, setStep] = useState<Step>("choose");
    const [ocrText, setOcrText] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [parsedData, setParsedData] = useState<ParsedMedicineInfo | null>(null);
    const [reviewGroupName, setReviewGroupName] = useState("");
    const [reviewSelectedGroupId, setReviewSelectedGroupId] = useState<number | null>(null);
    const [reviewMemo, setReviewMemo] = useState("");

    const { addMed, addGroup, isLoading, groups, loadGroups } = useMedStore();

    React.useEffect(() => {
        loadGroups();
    }, []);

    const handleCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("권한 필요", "카메라 권한이 필요합니다.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 1.0,
        });

        if (!result.canceled && result.assets[0]) {
            await processImage(result.assets[0].uri);
        }
    };

    const handleGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("권한 필요", "사진 라이브러리 접근 권한이 필요합니다.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 1.0,
        });

        if (!result.canceled && result.assets[0]) {
            await processImage(result.assets[0].uri);
        }
    };

    const processImage = async (uri: string) => {
        setIsProcessing(true);
        try {
            const ocrResult = await extractTextFromImage(uri);

            if (!ocrResult.success || !ocrResult.fullText) {
                Alert.alert("인식 실패", ocrResult.error || "텍스트를 인식할 수 없습니다.");
                setIsProcessing(false);
                return;
            }

            const cleanedText = cleanOCRText(ocrResult.fullText);
            setOcrText(cleanedText);
            setStep("ocr-result");
            console.log("OCR Result:", cleanedText);
        } catch (error) {
            Alert.alert("오류", "이미지 처리 중 오류가 발생했습니다.");
        }
        setIsProcessing(false);
    };

    const handleAIParse = () => {
        setIsProcessing(true);
        try {
            const result = parseMedicineText(ocrText);

            if (!result.success || !result.data) {
                Alert.alert("분석 실패", result.error || "데이터 분석에 실패했습니다.\n직접 입력해주세요.", [
                    { text: "직접 입력", onPress: handleManualInput },
                    { text: "취소", style: "cancel" },
                ]);
                setIsProcessing(false);
                return;
            }

            setParsedData(result.data);
            setStep("review");
        } catch (error) {
            Alert.alert("오류", "텍스트 분석 중 오류가 발생했습니다.");
        }
        setIsProcessing(false);
    };

    const handleManualInput = () => {
        setParsedData(null);
        setOcrText("");
        setStep("form");
    };

    const handleSubmit = async (data: MedFormData) => {
        try {
            // Request notification permissions
            await requestNotificationPermissions();

            const startDate = new Date().toISOString();

            // Determine group_id: explicit groupId > new group name > null
            let groupId = data.groupId ?? null;
            if (!groupId && reviewGroupName.trim()) {
                groupId = await addGroup(reviewGroupName.trim());
            }

            const medId = await addMed(
                {
                    name: data.name,
                    daily_freq: data.timesPerDay,
                    duration_days: data.duration,
                    start_date: startDate,
                    group_id: groupId,
                    ocr_text: ocrText || null,
                    memo: data.memo || null,
                },
                data.times
            );

            // Schedule notifications
            await scheduleMedicationReminders(
                medId,
                data.name,
                data.times,
                data.duration,
                startDate
            );

            Alert.alert(
                "저장 완료! 💊",
                `${data.name}이(가) 등록되었습니다.\n알림이 설정되었습니다.`,
                [
                    {
                        text: "확인",
                        onPress: () => {
                            setStep("choose");
                            setOcrText("");
                            setParsedData(null);
                            setReviewGroupName("");
                            setReviewSelectedGroupId(null);
                            setReviewMemo("");
                            router.replace("/(tabs)");
                        },
                    },
                ]
            );
        } catch (error) {
            Alert.alert("오류", "약 저장 중 오류가 발생했습니다.");
        }
    };

    const renderChooseStep = () => (
        <View className="flex-1 p-5">
            <Text className="text-gray-700 text-lg font-semibold mb-2">
                약 봉투를 촬영하거나{"\n"}직접 정보를 입력하세요
            </Text>
            <Text className="text-gray-400 text-sm mb-6">
                원하는 방법을 선택해주세요
            </Text>

            <View className="gap-4">
                {/* 카메라 촬영 - 파란색 */}
                <TouchableOpacity
                    onPress={handleCamera}
                    style={{
                        backgroundColor: '#007AFF',
                        padding: 20,
                        borderRadius: 20,
                        flexDirection: 'row',
                        alignItems: 'center',
                        shadowColor: '#007AFF',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6,
                    }}
                >
                    <View style={{
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Ionicons name="camera" size={28} color="white" />
                    </View>
                    <View style={{ marginLeft: 16, flex: 1 }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                            📷 카메라로 촬영
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 4 }}>
                            약 봉투를 촬영하면 자동으로 인식해요
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="white" />
                </TouchableOpacity>

                {/* 갤러리 선택 - 보라색 */}
                <TouchableOpacity
                    onPress={handleGallery}
                    style={{
                        backgroundColor: '#8B5CF6',
                        padding: 20,
                        borderRadius: 20,
                        flexDirection: 'row',
                        alignItems: 'center',
                        shadowColor: '#8B5CF6',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6,
                    }}
                >
                    <View style={{
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Ionicons name="images" size={28} color="white" />
                    </View>
                    <View style={{ marginLeft: 16, flex: 1 }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                            🖼️ 갤러리에서 선택
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 4 }}>
                            저장된 사진에서 약 봉투를 선택해요
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="white" />
                </TouchableOpacity>

                {/* 직접 입력 - 초록색 */}
                <TouchableOpacity
                    onPress={handleManualInput}
                    style={{
                        backgroundColor: '#10B981',
                        padding: 20,
                        borderRadius: 20,
                        flexDirection: 'row',
                        alignItems: 'center',
                        shadowColor: '#10B981',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6,
                    }}
                >
                    <View style={{
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Ionicons name="create" size={28} color="white" />
                    </View>
                    <View style={{ marginLeft: 16, flex: 1 }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                            ✏️ 직접 입력
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 4 }}>
                            약 정보를 수동으로 입력해요
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderOCRResultStep = () => (
        <ScrollView className="flex-1 p-5">
            <View className="flex-row items-center mb-4">
                <TouchableOpacity onPress={() => setStep("choose")}>
                    <Ionicons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text className="text-gray-800 text-xl font-bold ml-3">
                    텍스트 인식 결과
                </Text>
            </View>

            <View className="bg-gray-100 p-4 rounded-2xl mb-4">
                <Text className="text-gray-700 leading-6">{ocrText}</Text>
            </View>

            <Text className="text-gray-500 text-sm mb-4">
                💡 위 텍스트에서 약 정보를 자동으로 추출합니다.
            </Text>

            <TouchableOpacity
                onPress={handleAIParse}
                disabled={isProcessing}
                className={`py-4 rounded-xl items-center flex-row justify-center ${isProcessing ? "bg-gray-400" : "bg-primary"
                    }`}
            >
                {isProcessing ? (
                    <>
                        <ActivityIndicator color="white" />
                        <Text className="text-white font-bold text-lg ml-2">
                            분석 중...
                        </Text>
                    </>
                ) : (
                    <>
                        <Ionicons name="search" size={24} color="white" />
                        <Text className="text-white font-bold text-lg ml-2">
                            자동 분석하기
                        </Text>
                    </>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                onPress={handleManualInput}
                className="py-4 rounded-xl items-center mt-3"
            >
                <Text className="text-gray-500 font-medium">직접 입력할게요</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    const getTimeLabel = (time: string) => {
        const [h] = time.split(":").map(Number);
        if (h < 10) return `아침 ${time}`;
        if (h < 14) return `점심 ${time}`;
        if (h < 19) return `저녁 ${time}`;
        return `밤 ${time}`;
    };

    const renderReviewStep = () => {
        if (!parsedData) return null;

        const reviewItems = [
            {
                icon: "medical" as const,
                label: "약 이름",
                value: parsedData.name,
                color: "#007AFF",
                bgColor: "#EFF6FF",
            },
            {
                icon: "time" as const,
                label: "복용 횟수",
                value: `하루 ${parsedData.times_per_day}회`,
                color: "#8B5CF6",
                bgColor: "#F5F3FF",
            },
            {
                icon: "alarm" as const,
                label: "복용 시간",
                value: parsedData.times.map(getTimeLabel).join(", "),
                color: "#F59E0B",
                bgColor: "#FFFBEB",
            },
            {
                icon: "calendar" as const,
                label: "투약 일수",
                value: `${parsedData.duration}일`,
                color: "#10B981",
                bgColor: "#ECFDF5",
            },
        ];

        return (
            <ScrollView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
                <View style={{ padding: 20 }}>
                    {/* Header */}
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                        <TouchableOpacity onPress={() => setStep("ocr-result")}>
                            <Ionicons name="arrow-back" size={24} color="#007AFF" />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 22, fontWeight: "bold", color: "#1F2937", marginLeft: 12 }}>
                            인식 결과 확인
                        </Text>
                    </View>

                    {/* Notice banner */}
                    <View style={{
                        backgroundColor: "#FEF3C7",
                        borderRadius: 16,
                        padding: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 24,
                    }}>
                        <Ionicons name="information-circle" size={22} color="#D97706" />
                        <Text style={{ color: "#92400E", fontSize: 14, marginLeft: 10, flex: 1, lineHeight: 20 }}>
                            자동 인식 결과입니다. 틀린 부분이 있으면{"\n"}
                            아래 "수정하기" 버튼을 눌러 수정해주세요.
                        </Text>
                    </View>

                    {/* Parsed result cards */}
                    <View style={{ gap: 12 }}>
                        {reviewItems.map((item) => (
                            <View
                                key={item.label}
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: 20,
                                    padding: 20,
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 4,
                                    elevation: 2,
                                }}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <View style={{
                                        backgroundColor: item.bgColor,
                                        width: 44,
                                        height: 44,
                                        borderRadius: 14,
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}>
                                        <Ionicons name={item.icon} size={22} color={item.color} />
                                    </View>
                                    <View style={{ marginLeft: 14, flex: 1 }}>
                                        <Text style={{ fontSize: 13, color: "#9CA3AF", fontWeight: "500" }}>
                                            {item.label}
                                        </Text>
                                        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1F2937", marginTop: 2 }}>
                                            {item.value}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Group selection */}
                    <View style={{
                        backgroundColor: "white",
                        borderRadius: 20,
                        padding: 20,
                        marginTop: 16,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 2,
                    }}>
                        <Text style={{ fontSize: 15, fontWeight: "bold", color: "#1F2937", marginBottom: 12 }}>
                            📁 그룹에 추가 (선택)
                        </Text>

                        {groups.length > 0 && (
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                                {groups.map((g) => (
                                    <TouchableOpacity
                                        key={g.id}
                                        onPress={() => {
                                            if (reviewSelectedGroupId === g.id) {
                                                setReviewSelectedGroupId(null);
                                            } else {
                                                setReviewSelectedGroupId(g.id);
                                                setReviewGroupName("");
                                            }
                                        }}
                                        style={{
                                            backgroundColor: reviewSelectedGroupId === g.id ? "#007AFF" : "#F3F4F6",
                                            paddingHorizontal: 14,
                                            paddingVertical: 8,
                                            borderRadius: 12,
                                        }}
                                    >
                                        <Text style={{
                                            color: reviewSelectedGroupId === g.id ? "white" : "#4B5563",
                                            fontWeight: "600",
                                            fontSize: 14,
                                        }}>
                                            {g.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <TextInput
                            value={reviewGroupName}
                            onChangeText={(text) => {
                                setReviewGroupName(text);
                                if (text.trim()) {
                                    setReviewSelectedGroupId(null);
                                }
                            }}
                            placeholder="새 그룹명 입력 (예: 아침약)"
                            placeholderTextColor="#9CA3AF"
                            style={{
                                backgroundColor: "#F9FAFB",
                                borderWidth: 1,
                                borderColor: reviewGroupName ? "#007AFF" : "#E5E7EB",
                                borderRadius: 12,
                                padding: 14,
                                fontSize: 15,
                                color: "#1F2937",
                            }}
                        />

                        {!reviewGroupName.trim() && !reviewSelectedGroupId && (
                            <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 8 }}>
                                비워두면 그룹 없이 저장됩니다
                            </Text>
                        )}
                    </View>

                    {/* Memo input */}
                    <View style={{
                        backgroundColor: "white",
                        borderRadius: 20,
                        padding: 20,
                        marginTop: 16,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 2,
                    }}>
                        <Text style={{ fontSize: 15, fontWeight: "bold", color: "#1F2937", marginBottom: 12 }}>
                            📝 메모 (선택)
                        </Text>
                        <TextInput
                            value={reviewMemo}
                            onChangeText={setReviewMemo}
                            placeholder="예: 감기약, 혈압약"
                            placeholderTextColor="#9CA3AF"
                            style={{
                                backgroundColor: "#F9FAFB",
                                borderWidth: 1,
                                borderColor: reviewMemo ? "#8B5CF6" : "#E5E7EB",
                                borderRadius: 12,
                                padding: 14,
                                fontSize: 15,
                                color: "#1F2937",
                            }}
                        />
                        <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 8 }}>
                            나중에 이 약이 뭔지 기억하기 쉽게 메모해두세요
                        </Text>
                    </View>

                    {/* Action buttons */}
                    <View style={{ marginTop: 28, gap: 12 }}>
                        {/* Confirm button */}
                        <TouchableOpacity
                            onPress={() => handleSubmit({
                                name: parsedData.name,
                                timesPerDay: parsedData.times_per_day,
                                times: parsedData.times,
                                duration: parsedData.duration,
                                groupId: reviewSelectedGroupId,
                                memo: reviewMemo.trim() || undefined,
                            })}
                            disabled={isLoading}
                            style={{
                                backgroundColor: isLoading ? "#9CA3AF" : "#007AFF",
                                paddingVertical: 20,
                                borderRadius: 20,
                                alignItems: "center",
                                flexDirection: "row",
                                justifyContent: "center",
                                shadowColor: "#007AFF",
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 6,
                            }}
                        >
                            <Ionicons name="checkmark-circle" size={26} color="white" />
                            <Text style={{ color: "white", fontWeight: "bold", fontSize: 20, marginLeft: 10 }}>
                                {isLoading ? "저장 중..." : "이대로 저장하기"}
                            </Text>
                        </TouchableOpacity>

                        {/* Edit button */}
                        <TouchableOpacity
                            onPress={() => setStep("form")}
                            style={{
                                backgroundColor: "white",
                                paddingVertical: 18,
                                borderRadius: 20,
                                alignItems: "center",
                                flexDirection: "row",
                                justifyContent: "center",
                                borderWidth: 2,
                                borderColor: "#F59E0B",
                            }}
                        >
                            <Ionicons name="create-outline" size={24} color="#F59E0B" />
                            <Text style={{ color: "#D97706", fontWeight: "bold", fontSize: 18, marginLeft: 8 }}>
                                수정하기
                            </Text>
                        </TouchableOpacity>

                        {/* Rescan button */}
                        <TouchableOpacity
                            onPress={() => setStep("choose")}
                            style={{
                                paddingVertical: 14,
                                alignItems: "center",
                            }}
                        >
                            <Text style={{ color: "#9CA3AF", fontSize: 15 }}>
                                다시 촬영하기
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        );
    };

    const renderFormStep = () => (
        <View className="flex-1">
            <View className="flex-row items-center p-4 border-b border-gray-200">
                <TouchableOpacity onPress={() => parsedData ? setStep("review") : setStep("choose")}>
                    <Ionicons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text className="text-gray-800 text-xl font-bold ml-3">
                    약 정보 수정
                </Text>
            </View>

            <MedForm
                initialData={
                    parsedData
                        ? {
                            name: parsedData.name,
                            timesPerDay: parsedData.times_per_day,
                            times: parsedData.times,
                            duration: parsedData.duration,
                            memo: reviewMemo || undefined,
                        }
                        : undefined
                }
                onSubmit={handleSubmit}
                isLoading={isLoading}
                groups={groups}
            />
        </View>
    );

    if (isProcessing && step === "choose") {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#007AFF" />
                <Text className="text-gray-600 mt-4">이미지 처리 중...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            {step === "choose" && renderChooseStep()}
            {step === "ocr-result" && renderOCRResultStep()}
            {step === "review" && renderReviewStep()}
            {step === "form" && renderFormStep()}
        </View>
    );
}
