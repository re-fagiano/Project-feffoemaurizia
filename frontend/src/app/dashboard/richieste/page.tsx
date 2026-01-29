"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Richiesta {
    id: string;
    numero_richiesta: number;
    descrizione: string;
    stato: string;
    priorita: string;
    created_at: string;
}

const statoColors: Record<string, string> = {
    da_verificare: "badge-warning",
    da_gestire: "badge-info",
    in_gestione: "badge-info",
    risolta: "badge-success",
    validata: "badge-success",
    chiusa: "badge-default",
    nulla: "badge-danger",
};

const statoLabels: Record<string, string> = {
    da_verificare: "Da Verificare",
    da_gestire: "Da Gestire",
    in_gestione: "In Gestione",
    risolta: "Risolta",
    riaperta: "Riaperta",
    validata: "Validata",
    da_fatturare: "Da Fatturare",
    fatturata: "Fatturata",
    chiusa: "Chiusa",
    nulla: "Annullata",
};

export default function RichiestePage() {
    const [richieste, setRichieste] = useState<Richiesta[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroStato, setFiltroStato] = useState<string>("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const url = filtroStato
            ? `http://localhost:8000/api/richieste/?stato=${filtroStato}`
            : "http://localhost:8000/api/richieste/";

        fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setRichieste(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [filtroStato]);

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
                <div className="p-6 border-b border-gray-800">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold gradient-text">Ticket Platform</span>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <Link href="/dashboard" className="sidebar-link">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Dashboard
                    </Link>
                    <Link href="/dashboard/richieste" className="sidebar-link active">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Richieste
                    </Link>
                    <Link href="/dashboard/clienti" className="sidebar-link">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Clienti
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="bg-gray-900/50 border-b border-gray-800 px-8 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Richieste</h1>
                        <p className="text-gray-400">Gestisci le richieste di intervento</p>
                    </div>

                    <Link href="/dashboard/richieste/new" className="btn btn-primary">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nuova Richiesta
                    </Link>
                </header>

                <div className="p-8 animate-fade-in">
                    {/* Filters */}
                    <div className="flex gap-4 mb-6">
                        <select
                            value={filtroStato}
                            onChange={(e) => setFiltroStato(e.target.value)}
                            className="input max-w-xs"
                        >
                            <option value="">Tutti gli stati</option>
                            <option value="da_verificare">Da Verificare</option>
                            <option value="da_gestire">Da Gestire</option>
                            <option value="in_gestione">In Gestione</option>
                            <option value="risolta">Risolta</option>
                            <option value="validata">Validata</option>
                            <option value="chiusa">Chiusa</option>
                        </select>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid gap-4">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" />
                            </div>
                        ) : richieste.length === 0 ? (
                            <div className="card text-center py-12 text-gray-400">
                                <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <p>Nessuna richiesta trovata</p>
                            </div>
                        ) : (
                            richieste.map((richiesta) => (
                                <Link
                                    key={richiesta.id}
                                    href={`/dashboard/richieste/${richiesta.id}`}
                                    className="card card-hover flex items-start gap-4"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                                        #{richiesta.numero_richiesta}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`badge ${statoColors[richiesta.stato] || "badge-default"}`}>
                                                {statoLabels[richiesta.stato] || richiesta.stato}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(richiesta.created_at).toLocaleDateString("it-IT")}
                                            </span>
                                        </div>
                                        <p className="text-gray-300 line-clamp-2">{richiesta.descrizione}</p>
                                    </div>

                                    <svg className="w-5 h-5 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
