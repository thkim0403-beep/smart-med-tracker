export interface ParsedMedicineInfo {
    name: string;
    times_per_day: number;
    times: string[];
    duration: number;
}

export interface ParseResult {
    success: boolean;
    data?: ParsedMedicineInfo;
    error?: string;
}

const DEFAULT_TIMES: Record<number, string[]> = {
    1: ["08:00"],
    2: ["08:00", "20:00"],
    3: ["08:00", "13:00", "19:00"],
    4: ["08:00", "12:00", "18:00", "22:00"],
};

// Korean native number mapping
const KOREAN_NUMBERS: Record<string, number> = {
    "한": 1, "두": 2, "세": 3, "네": 4,
    "다섯": 5, "여섯": 6, "일곱": 7, "여덟": 8,
};

// Medical abbreviation to frequency mapping
const FREQ_ABBREVIATIONS: Record<string, number> = {
    "qd": 1, "q.d.": 1, "QD": 1,
    "bid": 2, "b.i.d.": 2, "BID": 2,
    "tid": 3, "t.i.d.": 3, "TID": 3,
    "qid": 4, "q.i.d.": 4, "QID": 4,
};

// Fields to filter out when extracting medicine name
const NOISE_LABELS = [
    "약국", "병원", "의원", "클리닉", "의료", "처방",
    "환자", "성명", "주소", "전화", "조제", "약사",
    "교부", "보관", "주의", "부작용", "효능", "복약안내",
    "실온", "냉장", "차광", "습기",
];

/**
 * Parse OCR text from a Korean medicine bag using local pattern matching
 */
export function parseMedicineText(ocrText: string): ParseResult {
    try {
        const text = ocrText.replace(/\s+/g, " ").trim();

        const name = extractMedicineName(text);
        const timesPerDay = extractTimesPerDay(text);
        const duration = extractDuration(text);
        const times = extractTimes(text, timesPerDay);

        if (!name) {
            return {
                success: false,
                error: "약 이름을 인식할 수 없습니다. 직접 입력해주세요.",
            };
        }

        return {
            success: true,
            data: {
                name,
                times_per_day: timesPerDay,
                times,
                duration,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: "텍스트 분석에 실패했습니다. 직접 입력해주세요.",
        };
    }
}

/**
 * Extract medicine name from OCR text
 */
function extractMedicineName(text: string): string {
    // 1) Labeled field: "약품명: ...", "의약품명 - ..." etc.
    const labelPatterns = [
        /(?:약품명|의약품명|약\s*이름|약\s*명|처방약)\s*[:\-=]?\s*(.+?)(?=\s*(?:1일|하루|투약|용법|용량|복용|\d+일분|\d+회|$))/i,
        /(?:약품명|의약품명|약\s*이름|약\s*명|처방약)\s*[:\-=]?\s*(.+?)$/m,
    ];

    for (const pattern of labelPatterns) {
        const match = text.match(pattern);
        if (match?.[1]) {
            const name = match[1].trim();
            if (name.length >= 2 && name.length <= 40 && !isNoiseName(name)) return name;
        }
    }

    // 2) Dosage form suffix pattern (정, 캡슐, 시럽, etc.)
    const formSuffixes = "정|서방정|이알서방정|캡슐|연질캡슐|경질캡슐|산|과립|시럽|현탁액|연고|크림|겔|패치|좌제|점안액|흡입제|츄어블정|필름코팅정|장용정";
    const medNameWithForm = new RegExp(
        `([가-힣A-Za-z]{2,}(?:${formSuffixes}))\\s*(?:\\d+\\.?\\d*\\s*(?:mg|g|mL|ml|mcg|ug|밀리그램|%|IU))?`,
        "i"
    );
    const formMatch = text.match(medNameWithForm);
    if (formMatch?.[0] && !isNoiseName(formMatch[0])) {
        return formMatch[0].trim().slice(0, 30);
    }

    // 3) Name + strength pattern: "타이레놀 500mg"
    const nameStrength = /([가-힣]{2,})\s*(\d+\.?\d*\s*(?:mg|g|mL|ml|mcg|ug|밀리그램|%))/i;
    const strengthMatch = text.match(nameStrength);
    if (strengthMatch?.[0] && !isNoiseName(strengthMatch[1])) {
        return strengthMatch[0].trim();
    }

    // 4) T#N notation: "아목시실린 3T#3" → extract name before T#N
    const tNotation = /([가-힣A-Za-z]{2,})\s*\d+\.?\d*\s*[TC]\s*#\s*\d+/i;
    const tMatch = text.match(tNotation);
    if (tMatch?.[1] && !isNoiseName(tMatch[1])) {
        return tMatch[1].trim();
    }

    // 5) Fallback: first meaningful Korean word (2+ chars, not noise)
    const words = text.split(/[\s,;]+/);
    for (const word of words) {
        const cleaned = word.replace(/[^가-힣a-zA-Z0-9]/g, "");
        if (cleaned.length >= 2 && /[가-힣]/.test(cleaned) && !isNoiseName(cleaned)) {
            return cleaned.slice(0, 20);
        }
    }

    return "";
}

function isNoiseName(name: string): boolean {
    return NOISE_LABELS.some((label) => name.includes(label));
}

/**
 * Extract daily frequency (1일 N회)
 */
function extractTimesPerDay(text: string): number {
    // 1) Standard Korean patterns
    const koreanPatterns = [
        /1일\s*(\d+)\s*회/,
        /하루\s*(\d+)\s*회/,
        /하루\s*(\d+)\s*번/,
        /일\s*(\d+)\s*회/,
        /(\d+)\s*회\s*\/\s*일/,
    ];

    for (const pattern of koreanPatterns) {
        const match = text.match(pattern);
        if (match?.[1]) {
            const freq = parseInt(match[1]);
            if (freq >= 1 && freq <= 10) return freq;
        }
    }

    // 2) Korean native numbers: "하루 세번", "하루 두 번"
    const nativeMatch = text.match(/하루\s*(한|두|세|네|다섯|여섯|일곱|여덟)\s*번/);
    if (nativeMatch?.[1] && KOREAN_NUMBERS[nativeMatch[1]]) {
        return KOREAN_NUMBERS[nativeMatch[1]];
    }

    // 3) T#N notation: "3T#3" → N is the frequency
    const tNotationMatch = text.match(/\d+\.?\d*\s*[TC]\s*#\s*(\d+)/i);
    if (tNotationMatch?.[1]) {
        const freq = parseInt(tNotationMatch[1]);
        if (freq >= 1 && freq <= 10) return freq;
    }

    // 4) Medical abbreviations (BID, TID, QID, etc.)
    for (const [abbr, freq] of Object.entries(FREQ_ABBREVIATIONS)) {
        if (text.includes(abbr)) return freq;
    }

    // 5) q-hour patterns: q8h → 24/8 = 3 times
    const qHourMatch = text.match(/q\s*(\d+)\s*h/i);
    if (qHourMatch?.[1]) {
        const hours = parseInt(qHourMatch[1]);
        if (hours > 0 && hours <= 24) return Math.round(24 / hours);
    }

    // 6) Infer from meal/time-of-day keywords
    const timeKeywords = ["아침", "점심", "저녁", "조식", "중식", "석식"];
    const mealCount = timeKeywords.filter((k) => text.includes(k)).length;
    if (mealCount >= 2) return mealCount;

    // 7) Check for bedtime-only pattern
    if (/취침\s*(전|시)|자기\s*전|h\.?s\.?|HS/.test(text)) {
        if (mealCount === 0) return 1;
    }

    return 3; // Default
}

/**
 * Extract duration in days
 */
function extractDuration(text: string): number {
    const patterns = [
        /총?\s*투약\s*일수\s*[:\-]?\s*(\d+)/,
        /(\d+)\s*일\s*분/,
        /(\d+)\s*일간/,
        /(\d+)\s*days?/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[1]) {
            const days = parseInt(match[1]);
            if (days >= 1 && days <= 365) return days;
        }
    }

    return 7; // Default
}

/**
 * Extract or infer medication times
 */
function extractTimes(text: string, timesPerDay: number): string[] {
    // 1) Explicit time mentions: "08:00", "8시 30분"
    const explicitTimes: string[] = [];

    const colonTime = /(\d{1,2}):(\d{2})/g;
    let match;
    while ((match = colonTime.exec(text)) !== null) {
        const h = parseInt(match[1]);
        const m = parseInt(match[2]);
        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
            explicitTimes.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
        }
    }

    if (explicitTimes.length >= timesPerDay) {
        return explicitTimes.slice(0, timesPerDay);
    }

    // 2) Bedtime patterns
    const isBedtime = /취침\s*(전|시)|자기\s*전|h\.?s\.?|HS/.test(text);
    if (isBedtime && timesPerDay === 1) return ["22:00"];

    // 3) 식전 (before meals)
    const isBeforeMeal = /식전|a\.?c\.?|AC/.test(text);
    if (isBeforeMeal) {
        const beforeMealTimes: Record<number, string[]> = {
            1: ["07:30"],
            2: ["07:30", "18:30"],
            3: ["07:30", "11:30", "18:30"],
            4: ["07:30", "11:30", "18:30", "22:00"],
        };
        return beforeMealTimes[timesPerDay] || beforeMealTimes[3];
    }

    // 4) 식후 (after meals) - most common
    const isAfterMeal = /식후|p\.?c\.?|PC/.test(text);
    if (isAfterMeal) {
        const afterMealTimes: Record<number, string[]> = {
            1: ["08:30"],
            2: ["08:30", "19:30"],
            3: ["08:30", "12:30", "19:30"],
            4: ["08:30", "12:30", "19:30", "22:00"],
        };
        return afterMealTimes[timesPerDay] || afterMealTimes[3];
    }

    // 5) 식간 (between meals) / 공복 (empty stomach)
    const isBetweenMeals = /식간|공복/.test(text);
    if (isBetweenMeals) {
        const betweenTimes: Record<number, string[]> = {
            1: ["10:00"],
            2: ["10:00", "16:00"],
            3: ["10:00", "15:00", "21:00"],
        };
        return betweenTimes[timesPerDay] || betweenTimes[3];
    }

    // 6) Infer from specific meal keywords
    const hasMorning = /아침|조식/.test(text);
    const hasLunch = /점심|중식/.test(text);
    const hasDinner = /저녁|석식/.test(text);
    const hasBed = isBedtime;

    if (hasMorning || hasLunch || hasDinner || hasBed) {
        const inferred: string[] = [];
        if (hasMorning) inferred.push("08:00");
        if (hasLunch) inferred.push("12:30");
        if (hasDinner) inferred.push("19:00");
        if (hasBed) inferred.push("22:00");
        if (inferred.length >= timesPerDay) return inferred.slice(0, timesPerDay);
    }

    // 7) Default
    return DEFAULT_TIMES[timesPerDay] || DEFAULT_TIMES[3];
}
