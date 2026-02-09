"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/auth";

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
        const endpoint = filtroStato
            ? `/api/richieste/?stato=${filtroStato}`
            : `/api/richieste/`;

        fetchWithAuth(endpoint)
            .then((data) => {
                setRichieste(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Errore caricamento richieste:", error);
                setLoading(false);
            });
    }, [filtroStato]);

    return (
        <>
            <header className="bg-gray-900/50 border-b border-gray-800 px-8 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                <div>
                    <h1 className="text-2xl font-bold">Richieste</h1>
                    <p className="text-gray-400">Gestisci le richieste di intervento</p>
                </div>

                <Link href="/richieste/new" className="btn btn-primary">
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
                                href={`/richieste/${richiesta.id}`}
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
        </>
    );
}
