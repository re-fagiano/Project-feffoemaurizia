"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/auth";

interface ContrattoCliente {
    id: string;
    nome_contratto_custom: string | null;
    tipo: string;
    stato: string;
    data_attivazione: string;
    data_scadenza: string | null;
    ore_totali: number | null;
    ore_utilizzate: number;
    ore_residue: number | null;
    importo_canone: number | null;
    cliente_id: string;
}

export default function ContrattiPage() {
    const router = useRouter();
    const [contratti, setContratti] = useState<ContrattoCliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterTipo, setFilterTipo] = useState<string>("tutti");

    useEffect(() => {
        fetchWithAuth(`/api/contratti`)
            .then((data) => {
                setContratti(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Errore caricamento contratti:", error);
                setLoading(false);
            });
    }, [router]);

    const filteredContratti = contratti.filter((c) => {
        if (filterTipo === "tutti") return true;
        return c.tipo === filterTipo;
    });

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

    const formatCurrency = (value: number | null) => {
        if (value === null) return "-";
        return new Intl.NumberFormat("it-IT", {
            style: "currency",
            currency: "EUR",
        }).format(value);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Contratti Clienti</h1>
                    <p className="text-gray-400">Gestisci i contratti assegnati ai clienti</p>
                </div>
                <Link href="/contratti/new" className="btn btn-primary">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuovo Contratto
                </Link>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="flex flex-wrap gap-4">
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
            </div>

            {/* Contratti Grid */}
            {filteredContratti.length === 0 ? (
                <div className="card text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-400 mb-4">Nessun contratto trovato</p>
                    <Link href="/contratti/new" className="btn btn-primary">
                        Crea il primo contratto
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredContratti.map((contratto) => (
                        <div key={contratto.id} className="card card-hover">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold">
                                        {contratto.nome_contratto_custom || `Contratto ${contratto.tipo}`}
                                    </h3>
                                    <p className="text-sm text-gray-400 capitalize">{contratto.tipo.replace("_", " ")}</p>
                                </div>
                                <span className={`badge ${getStatoBadge(contratto.stato)}`}>
                                    {contratto.stato}
                                </span>
                            </div>

                            {contratto.tipo === "monte_ore" && contratto.ore_totali && (
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-400">Ore utilizzate</span>
                                        <span>{contratto.ore_utilizzate || 0} / {contratto.ore_totali}h</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-indigo-500 h-2 rounded-full"
                                            style={{
                                                width: `${Math.min(100, ((contratto.ore_utilizzate || 0) / contratto.ore_totali) * 100)}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {contratto.tipo === "forfettario" && (
                                <div className="mb-4">
                                    <p className="text-2xl font-bold text-indigo-400">
                                        {formatCurrency(contratto.importo_canone)}
                                    </p>
                                    <p className="text-sm text-gray-400">Canone</p>
                                </div>
                            )}

                            <div className="text-sm text-gray-400 space-y-1">
                                <p>Attivato: {new Date(contratto.data_attivazione).toLocaleDateString("it-IT")}</p>
                                {contratto.data_scadenza && (
                                    <p>Scadenza: {new Date(contratto.data_scadenza).toLocaleDateString("it-IT")}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
