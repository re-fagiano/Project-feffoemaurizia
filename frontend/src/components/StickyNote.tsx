"use client";

import { useState } from "react";
import { X, Edit2, Check } from "lucide-react";

interface StickyNoteProps {
    id: string;
    content: string;
    color: "yellow" | "blue" | "pink" | "green" | "purple";
    onUpdate: (id: string, content: string, color: string) => void;
    onDelete: (id: string) => void;
}

const colorClasses = {
    yellow: "bg-yellow-200 border-yellow-300",
    blue: "bg-blue-200 border-blue-300",
    pink: "bg-pink-200 border-pink-300",
    green: "bg-green-200 border-green-300",
    purple: "bg-purple-200 border-purple-300",
};

const colorOptions = [
    { value: "yellow", label: "🟡", class: "bg-yellow-200" },
    { value: "blue", label: "🔵", class: "bg-blue-200" },
    { value: "pink", label: "🩷", class: "bg-pink-200" },
    { value: "green", label: "🟢", class: "bg-green-200" },
    { value: "purple", label: "🟣", class: "bg-purple-200" },
];

export default function StickyNote({ id, content, color, onUpdate, onDelete }: StickyNoteProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(content);
    const [selectedColor, setSelectedColor] = useState(color);
    const [showColorPicker, setShowColorPicker] = useState(false);

    // Random rotation for realistic post-it effect
    const rotation = Math.random() * 4 - 2; // -2 to +2 degrees

    const handleSave = () => {
        if (editContent.trim()) {
            onUpdate(id, editContent.trim(), selectedColor);
            setIsEditing(false);
        }
    };

    const handleColorChange = (newColor: string) => {
        setSelectedColor(newColor as any);
        onUpdate(id, content, newColor);
        setShowColorPicker(false);
    };

    return (
        <div
            className={`relative p-4 rounded-sm shadow-md border-2 transition-all duration-200 ${colorClasses[color]}`}
            style={{
                transform: `rotate(${rotation}deg)`,
                minHeight: "120px",
                maxWidth: "200px",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "rotate(0deg) translateY(-2px)";
                e.currentTarget.style.boxShadow = "4px 4px 12px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = `rotate(${rotation}deg) translateY(0)`;
                e.currentTarget.style.boxShadow = "2px 2px 8px rgba(0,0,0,0.1)";
            }}
        >
            {/* Header with actions */}
            <div className="flex items-start justify-between mb-2">
                <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                    title="Change color"
                >
                    🎨
                </button>
                <div className="flex gap-1">
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-1 hover:bg-black/5 rounded transition-colors"
                            title="Edit"
                        >
                            <Edit2 className="w-3 h-3" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            className="p-1 hover:bg-black/5 rounded transition-colors text-green-600"
                            title="Save"
                        >
                            <Check className="w-3 h-3" />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(id)}
                        className="p-1 hover:bg-black/5 rounded transition-colors text-red-600"
                        title="Delete"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Color picker */}
            {showColorPicker && (
                <div className="absolute top-8 left-0 z-10 flex gap-1 p-2 bg-white rounded-lg shadow-lg border border-gray-200">
                    {colorOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => handleColorChange(opt.value)}
                            className={`w-6 h-6 rounded-full ${opt.class} border-2 ${selectedColor === opt.value ? "border-gray-800" : "border-transparent"
                                } hover:scale-110 transition-transform`}
                            title={opt.value}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Content */}
            {isEditing ? (
                <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-transparent border-none outline-none resize-none text-sm font-handwriting"
                    style={{ minHeight: "60px" }}
                    autoFocus
                    onBlur={handleSave}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && e.ctrlKey) {
                            handleSave();
                        }
                    }}
                />
            ) : (
                <p className="text-sm whitespace-pre-wrap break-words font-handwriting">
                    {content}
                </p>
            )}
        </div>
    );
}
