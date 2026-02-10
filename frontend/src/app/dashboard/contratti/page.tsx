"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface ContrattoCliente {
    id: string;
    nome_contratto_custom: string | null;
    tipo: string;
    stato: string;
    data_attivazione: string;
    data_scadenza: string | null;
    ore_totali: number | null;
    ore_utilizzate: number;
    importo_canone: number | null;
}

export default function ContrattiPage() {
    const { token, isLoading: authLoading } = useAuth();
    const [contratti, setContratti] = useState<ContrattoCliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterTipo, setFilterTipo] = useState<string>("tutti");

    const fetchContratti = useMemo(
        () => async () => {
            if (!token) return;
            setLoading(true);
            setError(null);

            try {
                const data = await apiFetch<ContrattoCliente[]>("/api/contratti/clienti", { token });
                setContratti(Array.isArray(data) ? data : []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Impossibile caricare, riprova");
            } finally {
                setLoading(false);
            }
        },
        [token]
    );

    useEffect(() => {
        if (!authLoading) {
            fetchContratti();
        }
    }, [authLoading, fetchContratti]);

    const filteredContratti = contratti.filter((c) => filterTipo === "tutti" || c.tipo === filterTipo);

    const getStatoBadge = (stato: string) => {
        const badges: Record<string, string> = {
            attivo: "badge-success",
            scaduto: "badge-danger",
            sospeso: "badge-warning",
            disdetto: "badge-default",
            esaurito: "badge-warning",
        };
        return badges[stato] || "badge-default";
    };

    return (
        <div className="min-h-screen bg-gray-950 p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Contratti Clienti</h1>
                    <p className="text-gray-400">Gestisci i contratti assegnati ai clienti</p>
                </div>
                <Link href="/dashboard/contratti/new" className="btn btn-primary">Nuovo Contratto</Link>
            </div>

            <div className="card mb-6">
                <select
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value)}
                    className="input w-auto"
                >
                    <option value="tutti">Tutti i tipi</option>
                    <option value="forfettario">Forfettario</option>
                    <option value="monte_ore">Monte Ore</option>
                </select>
            </div>

            {error ? (
                <div className="card p-6 text-center">
                    <p className="text-red-400 mb-4">Impossibile caricare, riprova</p>
                    <p className="text-sm text-gray-400 mb-4">{error}</p>
                    <button onClick={fetchContratti} className="btn btn-primary">Riprova</button>
                </div>
            ) : loading ? (
                <div className="text-center py-8">Caricamento...</div>
            ) : filteredContratti.length === 0 ? (
                <div className="card text-center py-12 text-gray-400">Nessun contratto trovato</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredContratti.map((contratto) => (
                        <div key={contratto.id} className="card card-hover">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold">{contratto.nome_contratto_custom || `Contratto ${contratto.tipo}`}</h3>
                                    <p className="text-sm text-gray-400 capitalize">{contratto.tipo.replace("_", " ")}</p>
                                </div>
                                <span className={`badge ${getStatoBadge(contratto.stato)}`}>{contratto.stato}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
