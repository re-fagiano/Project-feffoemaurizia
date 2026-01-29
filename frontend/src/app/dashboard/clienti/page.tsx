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
        <div className="min-h-screen flex">
            {/* Sidebar - simplified for this page */}
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
                    <Link href="/dashboard/richieste" className="sidebar-link">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Richieste
                    </Link>
                    <Link href="/dashboard/clienti" className="sidebar-link active">
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
                        <h1 className="text-2xl font-bold">Clienti</h1>
                        <p className="text-gray-400">Gestisci i tuoi clienti</p>
                    </div>

                    <Link href="/dashboard/clienti/new" className="btn btn-primary">
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
                                                <Link href={`/dashboard/clienti/${cliente.id}`} className="btn btn-ghost btn-sm">
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
            </main>
        </div>
    );
}
