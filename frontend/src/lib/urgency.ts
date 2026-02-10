export const URGENCY_LEVELS = {
    BASSA: "bassa",
    NORMALE: "normale",
    ALTA: "alta",
    CRITICO: "critico",
} as const;

export type UrgencyLevel = (typeof URGENCY_LEVELS)[keyof typeof URGENCY_LEVELS];

const LEGACY_TO_URGENCY: Record<string, UrgencyLevel> = {
    low: URGENCY_LEVELS.BASSA,
    medium: URGENCY_LEVELS.NORMALE,
    high: URGENCY_LEVELS.ALTA,
    critical: URGENCY_LEVELS.CRITICO,
};

export function convertLegacyPriority(value?: string): UrgencyLevel {
    if (!value) return URGENCY_LEVELS.NORMALE;

    const normalized = value.toLowerCase().trim();

    if (Object.values(URGENCY_LEVELS).includes(normalized as UrgencyLevel)) {
        return normalized as UrgencyLevel;
    }

    return LEGACY_TO_URGENCY[normalized] ?? URGENCY_LEVELS.NORMALE;
}
