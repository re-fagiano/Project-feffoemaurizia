"use client";

import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "@/lib/api";

interface BrogliaccioEntry {
    id: string;
    contenuto: string;
    tipo: "text" | "voice" | "image" | "gps";
    created_at: string;
    metadata_json?: any;
}

export default function MonitorScreen() {
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("monitorCollapsed") === "true";
        }
        return false;
    });

    const [entries, setEntries] = useState<BrogliaccioEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [newContent, setNewContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const toggleCollapse = () => {
        const newState = !collapsed;
        setCollapsed(newState);
        localStorage.setItem("monitorCollapsed", String(newState));
    };

    const fetchEntries = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return; // Silent fail if not logged in

            const res = await fetch(`${API_BASE_URL}/api/brogliaccio?status=draft`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEntries(data);
            }
        } catch (error) {
            console.error("Failed to fetch brogliaccio", error);
        }
    };

    useEffect(() => {
        if (!collapsed) {
            fetchEntries();
        }
    }, [collapsed]);

    const handleQuickSave = async () => {
        if (!newContent.trim()) return;
        setSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/brogliaccio/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    contenuto: newContent,
                    tipo: "text"
                })
            });

            if (res.ok) {
                setNewContent("");
                fetchEntries();
                // Optional: Focus back
                textareaRef.current?.focus();
            }
        } catch (error) {
            console.error("Error saving draft", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.ctrlKey && e.key === "Enter") {
            handleQuickSave();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Eliminare questa nota?")) return;
        try {
            const token = localStorage.getItem("token");
            await fetch(`${API_BASE_URL}/api/brogliaccio/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            setEntries(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error("Error deleting draft", error);
        }
    };

    const handleGPS = async () => {
        if (!navigator.geolocation) {
            alert("Geolocalizzazione non supportata");
            return;
        }

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const coords = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                acc: pos.coords.accuracy
            };

            // Create GPS entry
            try {
                const token = localStorage.getItem("token");
                await fetch(`${API_BASE_URL}/api/brogliaccio/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        contenuto: `Posizione GPS: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
                        tipo: "gps",
                        metadata_json: coords
                    })
                });
                fetchEntries();
            } catch (error) {
                console.error("Error saving GPS", error);
            }
        });
    }

    if (collapsed) {
        return (
            <div className="w-12 bg-gray-900 border-l border-gray-800 flex flex-col items-center py-4">
                <button
                    onClick={toggleCollapse}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    title="Espandi Brogliaccio"
                >
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <aside className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0 transition-all duration-300">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Brogliaccio
                </h2>
                <button
                    onClick={toggleCollapse}
                    className="p-1 hover:bg-gray-800 rounded transition-colors"
                    title="Nascondi"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Quick Input */}
            <div className="p-4 border-b border-gray-800 bg-gray-800/20">
                <textarea
                    ref={textareaRef}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none transition-all placeholder-gray-600"
                    placeholder="Scrivi una nota veloce... (Ctrl+Enter per salvare)"
                    rows={3}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={submitting}
                />
                <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-1">
                        <button
                            className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-indigo-400 transition-colors"
                            title="Aggiungi Foto (mock)"
                            onClick={() => alert("Feature foto in arrivo")}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                        <button
                            className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400 transition-colors"
                            title="Tag GPS"
                            onClick={handleGPS}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>
                    <button
                        onClick={handleQuickSave}
                        disabled={!newContent.trim() || submitting}
                        className="btn btn-primary btn-xs"
                    >
                        {submitting ? "..." : "Salva"}
                    </button>
                </div>
            </div>

            {/* Drafts List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {entries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-xs">
                        Nessuna nota nel brogliaccio.
                    </div>
                ) : (
                    entries.map((entry) => (
                        <div key={entry.id} className="card p-3 bg-gray-800/40 hover:bg-gray-800/60 transition-colors group relative border-l-2 border-l-indigo-500/50">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">
                                    {new Date(entry.created_at).toLocaleString('it-IT', {
                                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        className="text-gray-500 hover:text-red-400"
                                        onClick={() => handleDelete(entry.id)}
                                        title="Elimina"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {entry.contenuto}
                            </p>

                            {entry.tipo === "gps" && (
                                <div className="mt-2 text-xs text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded inline-block">
                                    📍 Posizione acquisita
                                </div>
                            )}

                            {/* Actions Footer (Convert) */}
                            <div className="mt-3 pt-2 border-t border-gray-700/50 flex justify-end">
                                <button
                                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                                    onClick={() => alert("Funzione conversione in arrivo")}
                                >
                                    Converti
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
}
