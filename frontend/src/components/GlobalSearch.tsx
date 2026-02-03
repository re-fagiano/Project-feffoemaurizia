"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function GlobalSearch() {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+/ (slash) - più universale e non conflitto browser
            if (e.ctrlKey && e.key === "/") {
                e.preventDefault();
                inputRef.current?.focus();
            }
            // ESC per chiudere
            if (e.key === "Escape") {
                setIsOpen(false);
                inputRef.current?.blur();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 8,
                left: rect.left,
                width: rect.width,
            });
        }
    }, [isOpen]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implementare ricerca globale
        console.log("Ricerca:", query);
    };

    return (
        <>
            <div ref={containerRef} className="relative flex-1 max-w-2xl">
                <form onSubmit={handleSearch} className="relative">
                    <div className="relative">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setIsOpen(e.target.value.length > 0);
                            }}
                            onFocus={() => query.length > 0 && setIsOpen(true)}
                            placeholder="Cerca clienti, richieste, contratti... (Ctrl+/)"
                            className="w-full pl-10 pr-20 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-gray-500 bg-gray-900 border border-gray-700 rounded">
                            Ctrl+/
                        </kbd>
                    </div>
                </form>
            </div>

            {/* Dropdown risultati - PORTAL per evitare z-index issues */}
            {isOpen && query && typeof window !== "undefined" && createPortal(
                <div
                    className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-96 overflow-y-auto"
                    style={{
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        width: `${dropdownPosition.width}px`,
                        zIndex: 9999,
                    }}
                >
                    <div className="p-4 text-center text-gray-400 text-sm">
                        Ricerca globale in sviluppo...
                        <br />
                        <span className="text-xs">Query: "{query}"</span>
                        <br />
                        <span className="text-xs text-gray-600 mt-2 block">
                            Premi ESC per chiudere
                        </span>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
