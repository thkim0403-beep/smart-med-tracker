import TextRecognition, {
    TextRecognitionResult,
} from "@react-native-ml-kit/text-recognition";

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
        const result: TextRecognitionResult = await TextRecognition.recognize(imageUri);

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
 * Clean and normalize OCR text for better AI parsing
 * @param text - Raw OCR text
 * @returns Cleaned text
 */
export function cleanOCRText(text: string): string {
    return text
        .replace(/\s+/g, " ") // Normalize whitespace
        .replace(/[^\w가-힣\s.,:/()-]/g, "") // Keep Korean, alphanumeric, and basic punctuation
        .trim();
}
