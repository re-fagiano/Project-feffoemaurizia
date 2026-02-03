"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/auth";
import PageHeader from "@/components/common/PageHeader";
import DataTable, { Column } from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";

interface Cliente {
    id: string;
    ragione_sociale: string;
    email_principale: string;
    gestione_interna: boolean;
    attivo: boolean;
}

export default function ClientiPage() {
    const router = useRouter();
    const [clienti, setClienti] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchWithAuth(`/api/clienti/?search=${search}`)
            .then((data) => {
                setClienti(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Errore caricamento clienti:", error);
                setLoading(false);
            });
    }, [search]);

    const columns: Column<Cliente>[] = [
        {
            header: "Ragione Sociale",
            accessor: "ragione_sociale",
            className: "font-medium",
        },
        {
            header: "Email",
            accessor: "email_principale",
            className: "text-gray-400",
        },
        {
            header: "Tipo",
            accessor: (cliente) => (
                <StatusBadge
                    status={cliente.gestione_interna ? "info" : "default"}
                    label={cliente.gestione_interna ? "Interno" : "Esterno"}
                />
            ),
        },
        {
            header: "Stato",
            accessor: (cliente) => (
                <StatusBadge status={cliente.attivo} />
            ),
        },
        {
            header: "Azioni",
            accessor: (cliente) => (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/clienti/${cliente.id}`} className="btn btn-ghost btn-sm text-indigo-400 hover:text-indigo-300">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Modifica
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Clienti"
                description="Gestisci i tuoi clienti"
            >
                <Link href="/clienti/new" className="btn btn-primary">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuovo Cliente
                </Link>
            </PageHeader>

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
                <div className="card">
                    <DataTable
                        data={clienti}
                        columns={columns}
                        loading={loading}
                        emptyMessage="Nessun cliente trovato. Inizia creando il primo!"
                        onRowClick={(cliente) => router.push(`/clienti/${cliente.id}`)}
                    />
                </div>
            </div>
        </>
    );
}
