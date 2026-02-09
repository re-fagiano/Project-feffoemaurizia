"use client";

import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "@/lib/api";

interface ClientSearchProps {
    onSelect: (cliente: { id: string; ragione_sociale: string }) => void;
    initialValue?: string;
    required?: boolean;
}

export default function ClientSearch({ onSelect, initialValue = "", required = false }: ClientSearchProps) {
    const [query, setQuery] = useState(initialValue);
    const [results, setResults] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    const [newClient, setNewClient] = useState({
        ragione_sociale: "",
        email_principale: "",
        telefono_principale: "",
        partita_iva: "",
    });

    // Gestione click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Search logic with debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length === 0) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${API_BASE_URL}/api/clienti?search=${encodeURIComponent(query)}&limit=5`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setResults(Array.isArray(data) ? data : []);
                    setIsOpen(true);
                }
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (cliente: any) => {
        const displayValue = cliente.nome_alternativo
            ? `${cliente.ragione_sociale} (${cliente.nome_alternativo})`
            : cliente.ragione_sociale;
        setQuery(displayValue);
        onSelect(cliente);
        setIsOpen(false);
    };

    const handleFocus = () => {
        if (query.length > 0 && results.length > 0) {
            setIsOpen(true);
        }
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setCreating(true);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/api/clienti`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ragione_sociale: newClient.ragione_sociale,
                    email_principale: newClient.email_principale,
                    partita_iva: newClient.partita_iva || null,
                    telefoni: newClient.telefono_principale ? [newClient.telefono_principale] : [],
                    gestione_interna: false,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Errore durante la creazione");
            }

            const createdClient = await res.json();

            // Auto-select the newly created client
            handleSelect(createdClient);

            // Reset and close modal
            setShowModal(false);
            setNewClient({
                ragione_sociale: "",
                email_principale: "",
                telefono_principale: "",
                partita_iva: "",
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Errore di connessione");
        } finally {
            setCreating(false);
        }
    };

    return (
        <>
            <div className="relative" ref={wrapperRef}>
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={handleFocus}
                        className="input w-full pr-10"
                        placeholder="Cerca cliente..."
                        required={required}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {loading ? (
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        )}
                    </div>
                </div>

                {isOpen && query.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {results.length === 0 ? (
                            <div className="px-4 py-3 text-gray-500 text-sm">
                                Nessun risultato trovato
                            </div>
                        ) : (
                            results.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => handleSelect(c)}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-800 border-b border-gray-800 last:border-0 transition-colors group"
                                >
                                    <div className="font-medium text-gray-200 group-hover:text-white">
                                        {c.ragione_sociale}
                                        {c.nome_alternativo && (
                                            <span className="ml-2 text-indigo-400 font-normal text-sm">
                                                ({c.nome_alternativo})
                                            </span>
                                        )}
                                    </div>
                                    {(c.partita_iva || c.codice_gestionale_esterno) && (
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {c.partita_iva && <span>P.IVA: {c.partita_iva}</span>}
                                            {c.partita_iva && c.codice_gestionale_esterno && <span className="mx-2">•</span>}
                                            {c.codice_gestionale_esterno && <span>Cod: {c.codice_gestionale_esterno}</span>}
                                        </div>
                                    )}
                                </button>
                            ))
                        )}

                        {/* Nuovo Cliente Button */}
                        <button
                            type="button"
                            onClick={() => {
                                setShowModal(true);
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border-t-2 border-indigo-500/30 transition-colors flex items-center gap-2 text-indigo-400 font-medium"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nuovo Cliente
                        </button>
                    </div>
                )}
            </div>

            {/* Modal Creazione Cliente */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Nuovo Cliente</h3>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleCreateClient} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Ragione Sociale *
                                </label>
                                <input
                                    type="text"
                                    value={newClient.ragione_sociale}
                                    onChange={(e) => setNewClient({ ...newClient, ragione_sociale: e.target.value })}
                                    className="input w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={newClient.email_principale}
                                    onChange={(e) => setNewClient({ ...newClient, email_principale: e.target.value })}
                                    className="input w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Telefono
                                </label>
                                <input
                                    type="tel"
                                    value={newClient.telefono_principale}
                                    onChange={(e) => setNewClient({ ...newClient, telefono_principale: e.target.value })}
                                    className="input w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Partita IVA
                                </label>
                                <input
                                    type="text"
                                    value={newClient.partita_iva}
                                    onChange={(e) => setNewClient({ ...newClient, partita_iva: e.target.value })}
                                    className="input w-full"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn btn-outline flex-1"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="btn btn-primary flex-1"
                                >
                                    {creating ? (
                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : (
                                        "Crea Cliente"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
