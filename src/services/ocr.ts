import TextRecognition, {
    TextRecognitionScript,
    TextRecognitionResult,
} from "@react-native-ml-kit/text-recognition";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

export interface OCRResult {
    fullText: string;
    blocks: string[];
    success: boolean;
    error?: string;
}

/**
 * Extract text from an image using ML Kit Text Recognition
 * @param imageUri - Local URI of the image to process
 * @returns OCRResult with extracted text
 */
export async function extractTextFromImage(imageUri: string): Promise<OCRResult> {
    try {
        // Preprocess: resize to optimal width for Korean character recognition (min 24x24px per char)
        const preprocessed = await preprocessImage(imageUri);

        // Use KOREAN script for accurate Korean text recognition
        const result: TextRecognitionResult = await TextRecognition.recognize(
            preprocessed,
            TextRecognitionScript.KOREAN
        );

        if (!result || !result.text) {
            return {
                fullText: "",
                blocks: [],
                success: false,
                error: "No text found in image",
            };
        }

        // Extract text blocks for structured access
        const blocks = result.blocks.map((block) => block.text);

        return {
            fullText: result.text,
            blocks,
            success: true,
        };
    } catch (error) {
        console.error("OCR Error:", error);
        return {
            fullText: "",
            blocks: [],
            success: false,
            error: error instanceof Error ? error.message : "Unknown OCR error",
        };
    }
}

/**
 * Preprocess image for better OCR accuracy
 * - Resize to optimal width (1280px) for Korean character recognition
 * - Save as lossless PNG to avoid compression artifacts
 */
async function preprocessImage(imageUri: string): Promise<string> {
    try {
        const context = ImageManipulator.manipulate(imageUri);
        const result = await context.resize({ width: 1280 }).renderAsync();
        const saved = await result.saveAsync({
            format: SaveFormat.PNG,
            compress: 1.0,
        });
        return saved.uri;
    } catch (error) {
        console.warn("Image preprocessing failed, using original:", error);
        return imageUri;
    }
}

/**
 * Clean and normalize OCR text for medicine bag parsing
 * @param text - Raw OCR text
 * @returns Cleaned text
 */
export function cleanOCRText(text: string): string {
    return text
        .replace(/\s+/g, " ")
        .replace(/[^\w가-힣\s.,;:/#()\-+%]/g, "") // Keep medical notation chars (#, %, +)
        .trim();
}
