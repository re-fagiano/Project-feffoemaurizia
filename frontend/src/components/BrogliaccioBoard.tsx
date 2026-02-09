"use client";

import { useState, useEffect } from "react";
import { Plus, StickyNote as StickyNoteIcon } from "lucide-react";
import StickyNote from "./StickyNote";
import { API_BASE_URL } from "@/lib/api";
import UrgencyDropdown from "./UrgencyDropdown";
import { URGENCY_LEVELS, type UrgencyLevel, convertLegacyPriority } from "@/lib/urgency";

interface BrogliacciNote {
    id: string;
    contenuto: string;
    tipo: string;
    utente_id: string;  // Author ID
    autore_nome?: string;  // 🆕
    autore_cognome?: string;  // 🆕
    autore_email?: string;  // 🆕
    metadata_json?: {
        color?: string;  // Still here for backwards compat
        urgenza?: UrgencyLevel | string;  // Updated to match our system
    };
    created_at: string;
}

// Map user email to color
const getUserColor = (email?: string): string => {
    if (!email) return "yellow";

    const colorMap: Record<string, string> = {
        "bongio@gmail.com": "yellow",
        "carlettidavidealessandro@gmail.com": "red",
    };

    if (colorMap[email]) return colorMap[email];

    // Hash-based fallback for unknown users
    const colors = ["blue", "pink", "green", "purple"];
    const hash = email.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
};

interface BrogliaccioBoardProps {
    fullPage?: boolean;
}

export default function BrogliaccioBoard({ fullPage = false }: BrogliaccioBoardProps) {
    const [notes, setNotes] = useState<BrogliacciNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newNoteContent, setNewNoteContent] = useState("");
    const [newNoteUrgency, setNewNoteUrgency] = useState<UrgencyLevel>(URGENCY_LEVELS.NORMAL);

    // Expandable note modal state
    const [selectedNote, setSelectedNote] = useState<BrogliacciNote | null>(null);

    // Fetch notes
    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch(`${API_BASE_URL}/api/brogliaccio`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                const data = await res.json();
                setNotes(data);
            }
        } catch (error) {
            console.error("Error fetching notes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNote = async () => {
        if (!newNoteContent.trim()) return;

        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch(`${API_BASE_URL}/api/brogliaccio`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    contenuto: newNoteContent.trim(),
                    tipo: "text",
                    metadata_json: { urgenza: newNoteUrgency },
                }),
            });

            if (res.ok) {
                const newNote = await res.json();
                setNotes((prev) => [newNote, ...prev]);
                setNewNoteContent("");
                setShowAddForm(false);
            }
        } catch (error) {
            console.error("Error creating note:", error);
        }
    };

    const handleUpdateNote = async (id: string, content: string, urgency?: UrgencyLevel | string) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const currentNote = notes.find(n => n.id === id);
            if (!currentNote) return;

            const res = await fetch(`${API_BASE_URL}/api/brogliaccio/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    contenuto: content,
                    metadata_json: { ...currentNote.metadata_json, urgenza: urgency },
                }),
            });

            if (res.ok) {
                const updatedNote = await res.json();
                setNotes((prev) => prev.map((note) => note.id === id ? updatedNote : note));
            }
        } catch (error) {
            console.error("Error updating note:", error);
        }
    };

    const handleDeleteNote = async (id: string) => {
        if (!confirm("Eliminare questa nota?")) return;

        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch(`${API_BASE_URL}/api/brogliaccio/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                setNotes((prev) => prev.filter((note) => note.id !== id));
            }
        } catch (error) {
            console.error("Error deleting note:", error);
        }
    };

    // Different layouts for sidebar vs full page
    const containerClass = fullPage
        ? "w-full"
        : "w-80 bg-gradient-to-br from-amber-50 to-orange-50 border-r border-amber-200 p-4 overflow-y-auto";

    const gridClass = fullPage
        ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
        : "grid grid-cols-1 gap-4";

    return (
        <div className={containerClass}>
            {/* Header - only show in sidebar mode */}
            {!fullPage && (
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <StickyNoteIcon className="w-5 h-5 text-amber-700" />
                        <h2 className="text-lg font-bold text-amber-900">Brogliaccio</h2>
                    </div>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full transition-colors shadow-md"
                        title="Add note"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Add button for full page mode */}
            {fullPage && (
                <div className="flex justify-end mb-6">
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors shadow-md"
                    >
                        <Plus className="w-5 h-5" />
                        Nuova Nota
                    </button>
                </div>
            )}

            {/* Add form */}
            {showAddForm && (
                <div className={`mb-4 p-3 bg-white rounded-lg shadow-md border border-amber-200 ${fullPage ? 'max-w-md' : ''}`}>
                    <textarea
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        placeholder="Scrivi una nota..."
                        className="w-full p-2 border border-gray-300 rounded resize-none text-sm text-gray-900"
                        rows={3}
                        autoFocus
                    />

                    {/* Urgency Selector */}
                    <div className="mt-3">
                        <label className="text-sm font-medium text-gray-700 block mb-1">Urgenza</label>
                        <UrgencyDropdown
                            value={newNoteUrgency}
                            onChange={setNewNoteUrgency}
                            size="sm"
                            showDescription
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 mt-3">
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={handleCreateNote}
                            className="px-3 py-1 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded"
                        >
                            Aggiungi
                        </button>
                    </div>
                </div>
            )}

            {/* Notes grid */}
            {loading ? (
                <div className="text-center text-gray-500 py-8">Caricamento...</div>
            ) : notes.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                    <p className="text-sm">Nessuna nota</p>
                    <p className="text-xs mt-1">Clicca + per aggiungerne una</p>
                </div>
            ) : (
                <div className={gridClass}>
                    {notes.map((note) => {
                        // Convert urgency value from new system to old system for StickyNote
                        const convertUrgency = (urgency?: UrgencyLevel | string): "critical" | "high" | "medium" | "low" => {
                            if (!urgency) return "medium";
                            const u = urgency.toLowerCase();
                            if (u === "critico") return "critical";
                            if (u === "alta") return "high";
                            if (u === "normale") return "medium";
                            return "medium";
                        };

                        return (
                            <StickyNote
                                key={note.id}
                                id={note.id}
                                content={note.contenuto}
                                color={getUserColor(note.autore_email)}
                                urgency={convertUrgency(note.metadata_json?.urgenza)}
                                authorName={`${note.autore_nome || ''} ${note.autore_cognome || ''}`.trim() || 'Autore'}
                                onUpdate={handleUpdateNote}
                                onDelete={handleDeleteNote}
                                onClick={() => setSelectedNote(note)}
                            />
                        );
                    })}
                </div>
            )}

            {/* Expandable Note Modal */}
            {selectedNote && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedNote(null)}
                >
                    <div
                        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4 border-b pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Nota Completa</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {selectedNote.autore_nome} {selectedNote.autore_cognome} · {new Date(selectedNote.created_at).toLocaleDateString('it-IT')}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedNote(null)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="prose max-w-none">
                            <p className="text-gray-800 whitespace-pre-wrap text-base leading-relaxed">
                                {selectedNote.contenuto}
                            </p>
                        </div>

                        {/* Urgency Badge */}
                        {selectedNote.metadata_json?.urgenza && (
                            <div className="mt-4 pt-4 border-t">
                                <UrgencyDropdown
                                    value={selectedNote.metadata_json.urgenza}
                                    onChange={() => { }} // Read-only in view mode
                                    size="sm"
                                    disabled
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
