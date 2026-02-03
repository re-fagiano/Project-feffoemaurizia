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
    const wrapperRef = useRef<HTMLDivElement>(null);

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

            // Solo se il dropdown è aperto (ovvero l'utente sta cercando attivamente) o vuole cercare
            // Ma evitiamo fetch se ha appena selezionato (gestito da handleSelect)
            // Per semplicità facciamo fetch sempre se query cambia ed è valida? 
            // Meglio: fetch solo se l'utente digita.

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
        }, 300); // 300ms debounce

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

    return (
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
                </div>
            )}
        </div>
    );
}
