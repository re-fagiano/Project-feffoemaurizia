"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Cliente {
    id: string;
    ragione_sociale: string;
    email_principale: string;
    gestione_interna: boolean;
    attivo: boolean;
}

export default function ClientiPage() {
    const [clienti, setClienti] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        fetch(`http://localhost:8000/api/clienti/?search=${search}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setClienti(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [search]);

    return (
        <>
            <header className="bg-gray-900/50 border-b border-gray-800 px-8 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                <div>
                    <h1 className="text-2xl font-bold">Clienti</h1>
                    <p className="text-gray-400">Gestisci i tuoi clienti</p>
                </div>

                <Link href="/clienti/new" className="btn btn-primary">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuovo Cliente
                </Link>
            </header>

            <div className="p-8 animate-fade-in">
                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Cerca cliente..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input max-w-md"
                    />
                </div>

                {/* Table */}
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Ragione Sociale</th>
                                <th>Email</th>
                                <th>Tipo</th>
                                <th>Stato</th>
                                <th>Azioni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8">
                                        <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto" />
                                    </td>
                                </tr>
                            ) : clienti.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-400">
                                        Nessun cliente trovato. Inizia creando il primo!
                                    </td>
                                </tr>
                            ) : (
                                clienti.map((cliente) => (
                                    <tr key={cliente.id}>
                                        <td className="font-medium">{cliente.ragione_sociale}</td>
                                        <td className="text-gray-400">{cliente.email_principale}</td>
                                        <td>
                                            <span className={cliente.gestione_interna ? "badge badge-info" : "badge badge-default"}>
                                                {cliente.gestione_interna ? "Interno" : "Esterno"}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={cliente.attivo ? "badge badge-success" : "badge badge-danger"}>
                                                {cliente.attivo ? "Attivo" : "Inattivo"}
                                            </span>
                                        </td>
                                        <td>
                                            <Link href={`/clienti/${cliente.id}`} className="btn btn-ghost btn-sm">
                                                Dettagli
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
