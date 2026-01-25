const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export interface ParsedMedicineInfo {
    name: string;
    times_per_day: number;
    times: string[]; // Array of times in HH:mm format
    duration: number;
}

export interface AIParseResult {
    success: boolean;
    data?: ParsedMedicineInfo;
    error?: string;
}

const SYSTEM_PROMPT = `You are a medical assistant specialized in parsing Korean medicine bag text.
Parse the following OCR text from a medicine bag into JSON format.
Extract the following information:
- name: The medicine name (약 이름)
- times_per_day: Number of times to take per day (1일 복용 횟수)
- times: Array of suggested times in HH:mm 24-hour format (복용 시간). 
  Common patterns: 
  - 1회: ["08:00"]
  - 2회: ["08:00", "20:00"]  
  - 3회: ["08:00", "13:00", "19:00"]
  - 식전/식후 indicates before/after meals
- duration: Number of days to take the medicine (투약 일수)

If information is unclear or missing, make reasonable assumptions based on common medical practices.
ONLY respond with valid JSON, no markdown or explanation.
Example response:
{"name": "타이레놀 500mg", "times_per_day": 3, "times": ["08:00", "13:00", "19:00"], "duration": 7}`;

/**
 * Parse OCR text using GPT-4o-mini to extract medicine information
 * @param ocrText - Raw text extracted from medicine bag via OCR
 * @returns Parsed medicine information
 */
export async function parseMedicineText(ocrText: string): Promise<AIParseResult> {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === "your_api_key_here") {
        return {
            success: false,
            error: "OpenAI API key not configured. Please set EXPO_PUBLIC_OPENAI_API_KEY in .env file.",
        };
    }

    try {
        const response = await fetch(OPENAI_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: ocrText },
                ],
                temperature: 0.3,
                max_tokens: 500,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("OpenAI API Error:", errorData);
            return {
                success: false,
                error: `API Error: ${errorData.error?.message || response.statusText}`,
            };
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            return {
                success: false,
                error: "No response from AI",
            };
        }

        // Parse JSON response
        const parsed: ParsedMedicineInfo = JSON.parse(content);

        // Validate required fields
        if (!parsed.name || !parsed.times_per_day || !parsed.times || !parsed.duration) {
            return {
                success: false,
                error: "Incomplete data parsed from text",
            };
        }

        return {
            success: true,
            data: parsed,
        };
    } catch (error) {
        console.error("AI Parse Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to parse medicine information",
        };
    }
}
