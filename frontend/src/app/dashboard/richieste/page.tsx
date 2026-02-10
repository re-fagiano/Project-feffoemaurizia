"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Richiesta {
    id: string;
    numero_richiesta: number;
    descrizione: string;
    stato: string;
    priorita: string;
    created_at: string;
}

const RICHIESTA_STATO: Record<string, { label: string; badgeClass: string }> = {
    da_verificare: { label: "Da Verificare", badgeClass: "badge-warning" },
    da_gestire: { label: "Da Gestire", badgeClass: "badge-info" },
    in_gestione: { label: "In Gestione", badgeClass: "badge-info" },
    risolta: { label: "Risolta", badgeClass: "badge-success" },
    riaperta: { label: "Riaperta", badgeClass: "badge-warning" },
    validata: { label: "Validata", badgeClass: "badge-success" },
    da_fatturare: { label: "Da Fatturare", badgeClass: "badge-warning" },
    fatturata: { label: "Fatturata", badgeClass: "badge-default" },
    chiusa: { label: "Chiusa", badgeClass: "badge-default" },
    nulla: { label: "Annullata", badgeClass: "badge-danger" },
};

function getStatoUi(stato: string) {
    return RICHIESTA_STATO[stato] ?? {
        label: `Sconosciuto (${stato})`,
        badgeClass: "badge-default",
    };
}

export default function RichiestePage() {
    const { token, isLoading: authLoading } = useAuth();
    const [richieste, setRichieste] = useState<Richiesta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtroStato, setFiltroStato] = useState<string>("");

    const fetchRichieste = useMemo(
        () => async () => {
            if (!token) return;
            setLoading(true);
            setError(null);

            try {
                const query = filtroStato ? `?stato=${encodeURIComponent(filtroStato)}` : "";
                const data = await apiFetch<Richiesta[]>(`/api/richieste/${query}`, { token });
                setRichieste(Array.isArray(data) ? data : []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Impossibile caricare, riprova");
            } finally {
                setLoading(false);
            }
        },
        [filtroStato, token]
    );

    useEffect(() => {
        if (!authLoading) {
            fetchRichieste();
        }
    }, [authLoading, fetchRichieste]);

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Richieste</h1>
                    <p className="text-gray-400">Gestisci le richieste di intervento</p>
                </div>
                <Link href="/dashboard/richieste/new" className="btn btn-primary">Nuova Richiesta</Link>
            </div>

            <div className="card mb-6">
                <select value={filtroStato} onChange={(e) => setFiltroStato(e.target.value)} className="input w-auto">
                    <option value="">Tutti gli stati</option>
                    {Object.entries(RICHIESTA_STATO).map(([key, value]) => (
                        <option key={key} value={key}>{value.label}</option>
                    ))}
                </select>
            </div>

            {error ? (
                <div className="card p-6 text-center">
                    <p className="text-red-400 mb-4">Impossibile caricare, riprova</p>
                    <p className="text-sm text-gray-400 mb-4">{error}</p>
                    <button onClick={fetchRichieste} className="btn btn-primary">Riprova</button>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Descrizione</th>
                                <th>Stato</th>
                                <th>Priorità</th>
                                <th>Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-8">Caricamento...</td></tr>
                            ) : richieste.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nessuna richiesta trovata</td></tr>
                            ) : (
                                richieste.map((richiesta) => {
                                    const statoUi = getStatoUi(richiesta.stato);
                                    return (
                                        <tr key={richiesta.id}>
                                            <td>#{richiesta.numero_richiesta}</td>
                                            <td>{richiesta.descrizione}</td>
                                            <td><span className={`badge ${statoUi.badgeClass}`}>{statoUi.label}</span></td>
                                            <td>{richiesta.priorita}</td>
                                            <td>{new Date(richiesta.created_at).toLocaleDateString("it-IT")}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
