"use client";

import { useState, useEffect } from "react";
import { Plus, StickyNote as StickyNoteIcon } from "lucide-react";
import StickyNote from "./StickyNote";
import { API_BASE_URL } from "@/lib/api";

interface BrogliacciNote {
    id: string;
    contenuto: string;
    tipo: string;
    metadata_json?: {
        color?: string;
    };
    created_at: string;
}

export default function BrogliaccioBoard() {
    const [notes, setNotes] = useState<BrogliacciNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newNoteContent, setNewNoteContent] = useState("");
    const [newNoteColor, setNewNoteColor] = useState("yellow");

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
                    metadata_json: { color: newNoteColor },
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

    const handleUpdateNote = async (id: string, content: string, color: string) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch(`${API_BASE_URL}/api/brogliaccio/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    contenuto: content,
                    metadata_json: { color },
                }),
            });

            if (res.ok) {
                setNotes((prev) =>
                    prev.map((note) =>
                        note.id === id
                            ? { ...note, contenuto: content, metadata_json: { color } }
                            : note
                    )
                );
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

    return (
        <div className="w-80 bg-gradient-to-br from-amber-50 to-orange-50 border-r border-amber-200 p-4 overflow-y-auto">
            {/* Header */}
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

            {/* Add form */}
            {showAddForm && (
                <div className="mb-4 p-3 bg-white rounded-lg shadow-md border border-amber-200">
                    <textarea
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        placeholder="Scrivi una nota..."
                        className="w-full p-2 border border-gray-300 rounded resize-none text-sm"
                        rows={3}
                        autoFocus
                    />
                    <div className="flex items-center justify-between mt-2">
                        <select
                            value={newNoteColor}
                            onChange={(e) => setNewNoteColor(e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                            <option value="yellow">🟡 Giallo</option>
                            <option value="blue">🔵 Blu</option>
                            <option value="pink">🩷 Rosa</option>
                            <option value="green">🟢 Verde</option>
                            <option value="purple">🟣 Viola</option>
                        </select>
                        <div className="flex gap-2">
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
                <div className="grid grid-cols-1 gap-4">
                    {notes.map((note) => (
                        <StickyNote
                            key={note.id}
                            id={note.id}
                            content={note.contenuto}
                            color={(note.metadata_json?.color as any) || "yellow"}
                            onUpdate={handleUpdateNote}
                            onDelete={handleDeleteNote}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
