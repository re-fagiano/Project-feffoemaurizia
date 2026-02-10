"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Cliente {
    id: string;
    ragione_sociale: string;
    email_principale: string;
    gestione_interna: boolean;
    attivo: boolean;
}

export default function ClientiPage() {
    const { token, isLoading: authLoading } = useAuth();
    const [clienti, setClienti] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(timeout);
    }, [search]);

    const fetchClienti = useMemo(
        () => async () => {
            if (!token) return;
            setLoading(true);
            setError(null);

            try {
                const query = debouncedSearch.trim();
                const data = await apiFetch<Cliente[]>(
                    `/api/clienti/?search=${encodeURIComponent(query)}`,
                    { token }
                );
                setClienti(Array.isArray(data) ? data : []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Impossibile caricare, riprova");
            } finally {
                setLoading(false);
            }
        },
        [debouncedSearch, token]
    );

    useEffect(() => {
        if (!authLoading) {
            fetchClienti();
        }
    }, [authLoading, fetchClienti]);

    return (
        <div className="p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Clienti</h1>
                    <p className="text-gray-400">Gestisci i tuoi clienti</p>
                </div>
                <Link href="/dashboard/clienti/new" className="btn btn-primary">
                    Nuovo Cliente
                </Link>
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Cerca cliente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input max-w-md"
                />
            </div>

            {error ? (
                <div className="card p-6 text-center">
                    <p className="text-red-400 mb-4">Impossibile caricare, riprova</p>
                    <p className="text-sm text-gray-400 mb-4">{error}</p>
                    <button onClick={fetchClienti} className="btn btn-primary">Riprova</button>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Ragione Sociale</th>
                                <th>Email</th>
                                <th>Tipo</th>
                                <th>Stato</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-8">Caricamento...</td>
                                </tr>
                            ) : clienti.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-gray-400">
                                        Nessun cliente trovato
                                    </td>
                                </tr>
                            ) : (
                                clienti.map((cliente) => (
                                    <tr key={cliente.id}>
                                        <td>{cliente.ragione_sociale}</td>
                                        <td>{cliente.email_principale}</td>
                                        <td>
                                            <span className={`badge ${cliente.gestione_interna ? "badge-info" : "badge-default"}`}>
                                                {cliente.gestione_interna ? "Interno" : "Esterno"}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${cliente.attivo ? "badge-success" : "badge-danger"}`}>
                                                {cliente.attivo ? "Attivo" : "Inattivo"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
