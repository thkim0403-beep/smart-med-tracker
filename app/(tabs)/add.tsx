import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { extractTextFromImage, cleanOCRText } from "../../src/services/ocr";
import { parseMedicineText, ParsedMedicineInfo } from "../../src/services/openai";
import { useMedStore } from "../../src/store/medStore";
import { scheduleMedicationReminders, requestNotificationPermissions } from "../../src/services/notifications";
import { MedForm } from "../../src/components/MedForm";

type Step = "choose" | "ocr-result" | "form";

export default function AddMedicineScreen() {
    const [step, setStep] = useState<Step>("choose");
    const [ocrText, setOcrText] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [parsedData, setParsedData] = useState<ParsedMedicineInfo | null>(null);

    const { addMed, isLoading } = useMedStore();

    const handleCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("권한 필요", "카메라 권한이 필요합니다.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.8,
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
            quality: 0.8,
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

    const handleAIParse = async () => {
        setIsProcessing(true);
        try {
            const result = await parseMedicineText(ocrText);

            if (!result.success || !result.data) {
                Alert.alert("분석 실패", result.error || "데이터 분석에 실패했습니다.");
                setIsProcessing(false);
                return;
            }

            setParsedData(result.data);
            setStep("form");
            console.log("Parsed Data:", result.data);
        } catch (error) {
            Alert.alert("오류", "AI 분석 중 오류가 발생했습니다.");
        }
        setIsProcessing(false);
    };

    const handleManualInput = () => {
        setParsedData(null);
        setStep("form");
    };

    const handleSubmit = async (data: {
        name: string;
        timesPerDay: number;
        times: string[];
        duration: number;
    }) => {
        try {
            // Request notification permissions
            await requestNotificationPermissions();

            const startDate = new Date().toISOString();

            const medId = await addMed(
                {
                    name: data.name,
                    daily_freq: data.timesPerDay,
                    duration_days: data.duration,
                    start_date: startDate,
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
                💡 위 텍스트를 AI가 분석하여 약 정보를 추출합니다.
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
                            AI 분석 중...
                        </Text>
                    </>
                ) : (
                    <>
                        <Ionicons name="sparkles" size={24} color="white" />
                        <Text className="text-white font-bold text-lg ml-2">
                            AI로 분석하기
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

    const renderFormStep = () => (
        <View className="flex-1">
            <View className="flex-row items-center p-4 border-b border-gray-200">
                <TouchableOpacity onPress={() => setStep("choose")}>
                    <Ionicons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text className="text-gray-800 text-xl font-bold ml-3">
                    약 정보 입력
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
                        }
                        : undefined
                }
                onSubmit={handleSubmit}
                isLoading={isLoading}
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
            {step === "form" && renderFormStep()}
        </View>
    );
}
