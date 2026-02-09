"use client";

import { useState } from "react";
import { X, Edit2, Check, AlertCircle } from "lucide-react";

interface StickyNoteProps {
    id: string;
    content: string;
    color: string;
    urgency?: "critical" | "high" | "medium" | "low";
    authorName: string;
    onUpdate: (id: string, content: string, urgency?: "critical" | "high" | "medium" | "low") => void;
    onDelete: (id: string) => void;
    onClick: () => void;
}

const colorClasses: Record<string, string> = {
    yellow: "bg-yellow-200 border-yellow-300",
    blue: "bg-blue-200 border-blue-300",
    pink: "bg-pink-200 border-pink-300",
    green: "bg-green-200 border-green-300",
    purple: "bg-purple-200 border-purple-300",
    red: "bg-red-200 border-red-300",
};

const urgencyConfig = {
    critical: { icon: "🔴", label: "Critica", color: "text-red-600" },
    high: { icon: "🟡", label: "Alta", color: "text-yellow-600" },
    medium: { icon: "🔵", label: "Media", color: "text-blue-600" },
    low: { icon: "🟢", label: "Bassa", color: "text-green-600" },
};

export default function StickyNote({
    id,
    content,
    color,
    urgency,
    authorName,
    onUpdate,
    onDelete,
    onClick
}: StickyNoteProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(content);
    const [editUrgency, setEditUrgency] = useState<typeof urgency>(urgency);

    // Random rotation for realistic post-it effect
    const rotation = Math.random() * 4 - 2; // -2 to +2 degrees

    const handleSave = () => {
        if (editContent.trim()) {
            onUpdate(id, editContent.trim(), editUrgency);
            setIsEditing(false);
        }
    };

    // Truncate content to 10 characters
    const truncatedContent = content.length > 10 ? content.substring(0, 10) + "..." : content;

    return (
        <div
            className={`relative p-4 rounded-sm shadow-md border-2 transition-all duration-200 ${colorClasses[color] || colorClasses.yellow} ${!isEditing ? 'cursor-pointer' : ''}`}
            style={{
                transform: `rotate(${rotation}deg)`,
                minHeight: "150px",
                maxWidth: "220px",
            }}
            onMouseEnter={(e) => {
                if (!isEditing) {
                    e.currentTarget.style.transform = "rotate(0deg) translateY(-2px)";
                    e.currentTarget.style.boxShadow = "4px 4px 12px rgba(0,0,0,0.15)";
                }
            }}
            onMouseLeave={(e) => {
                if (!isEditing) {
                    e.currentTarget.style.transform = `rotate(${rotation}deg) translateY(0)`;
                    e.currentTarget.style.boxShadow = "2px 2px 8px rgba(0,0,0,0.1)";
                }
            }}
            onClick={() => !isEditing && onClick()}
        >
            {/* Header with urgency and actions */}
            <div className="flex items-start justify-between mb-3">
                {/* Urgency badge */}
                {urgency && !isEditing && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${urgencyConfig[urgency].color}`}>
                        <span className="text-base">{urgencyConfig[urgency].icon}</span>
                    </div>
                )}
                {isEditing && (
                    <select
                        value={editUrgency || "medium"}
                        onChange={(e) => setEditUrgency(e.target.value as any)}
                        className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="low">🟢 Bassa</option>
                        <option value="medium">🟡 Media</option>
                        <option value="high">🟠 Alta</option>
                        <option value="critical">🔴 Critica</option>
                    </select>
                )}

                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    {!isEditing ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditing(true);
                            }}
                            className="p-1 hover:bg-black/10 rounded transition-colors"
                            title="Modifica"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSave();
                            }}
                            className="p-1 hover:bg-black/10 rounded transition-colors text-green-600"
                            title="Salva"
                        >
                            <Check className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(id);
                        }}
                        className="p-1 hover:bg-black/10 rounded transition-colors text-red-600"
                        title="Elimina"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            {isEditing ? (
                <div onClick={(e) => e.stopPropagation()}>
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-transparent border-none outline-none resize-none text-base font-handwriting"
                        style={{ minHeight: "70px" }}
                        autoFocus
                        onBlur={handleSave}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && e.ctrlKey) {
                                handleSave();
                            }
                        }}
                    />
                </div>
            ) : (
                <>
                    <p className="text-3xl font-bold font-handwriting break-words mb-2">
                        {truncatedContent}
                    </p>
                    {content.length > 10 && (
                        <p className="text-sm text-gray-600 italic">Clicca per leggere tutto</p>
                    )}
                </>
            )}

            {/* Author signature */}
            {!isEditing && (
                <div className="absolute bottom-2 right-3 text-xs opacity-60 font-handwriting">
                    - {authorName}
                </div>
            )}
        </div>
    );
}
