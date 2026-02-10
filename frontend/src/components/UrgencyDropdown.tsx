"use client";

import { URGENCY_LEVELS, type UrgencyLevel, convertLegacyPriority } from "@/lib/urgency";

interface UrgencyDropdownProps {
    value?: UrgencyLevel | string;
    onChange: (value: UrgencyLevel) => void;
    size?: "sm" | "md";
    showDescription?: boolean;
    disabled?: boolean;
}

const URGENCY_OPTIONS: { value: UrgencyLevel; label: string; description: string; emoji: string }[] = [
    {
        value: URGENCY_LEVELS.BASSA,
        label: "Bassa",
        description: "Può attendere",
        emoji: "🟢",
    },
    {
        value: URGENCY_LEVELS.NORMALE,
        label: "Normale",
        description: "Priorità standard",
        emoji: "🔵",
    },
    {
        value: URGENCY_LEVELS.ALTA,
        label: "Alta",
        description: "Da gestire a breve",
        emoji: "🟡",
    },
    {
        value: URGENCY_LEVELS.CRITICO,
        label: "Critico",
        description: "Intervento immediato",
        emoji: "🔴",
    },
];

export default function UrgencyDropdown({
    value,
    onChange,
    size = "md",
    showDescription = false,
    disabled = false,
}: UrgencyDropdownProps) {
    const normalizedValue = convertLegacyPriority(value);

    return (
        <select
            value={normalizedValue}
            onChange={(e) => onChange(e.target.value as UrgencyLevel)}
            disabled={disabled}
            className={`w-full rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                size === "sm" ? "text-sm px-2 py-1.5" : "text-base px-3 py-2"
            } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
        >
            {URGENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                    {showDescription
                        ? `${option.emoji} ${option.label} — ${option.description}`
                        : `${option.emoji} ${option.label}`}
                </option>
            ))}
        </select>
    );
}
