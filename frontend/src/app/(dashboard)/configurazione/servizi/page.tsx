"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import DataTable, { Column } from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import ServizioModal, { ServizioFormData } from "@/components/ServizioModal";
import { fetchWithAuth } from "@/lib/auth";

interface Servizio {
    id: string;
    codice: string;
    nome: string;
    categoria: string;
    prezzo_unitario: number;
    iva: number;
    unita_misura: string;
    attivo: boolean;
}

export default function ServiziPage() {
    const [servizi, setServizi] = useState<Servizio[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingServizio, setEditingServizio] = useState<Servizio | undefined>(undefined);

    const fetchServizi = async () => {
        try {
            const data = await fetchWithAuth("/api/servizi?active_only=false");
            setServizi(data);
        } catch (error) {
            console.error("Errore caricamento servizi:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServizi();
    }, []);

    const handleCreate = () => {
        setEditingServizio(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (servizio: Servizio) => {
        setEditingServizio(servizio);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Sei sicuro di voler eliminare questo servizio?")) return;
        try {
            await fetchWithAuth(`/api/servizi/${id}`, { method: "DELETE" });
            fetchServizi();
        } catch (error) {
            console.error("Errore cancellazione:", error);
            alert("Errore durante la cancellazione");
        }
    };

    const handleSubmit = async (data: ServizioFormData) => {
        try {
            const url = editingServizio
                ? `/api/servizi/${editingServizio.id}`
                : "/api/servizi";

            await fetchWithAuth(url, {
                method: editingServizio ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            fetchServizi();
        } catch (error) {
            console.error("Errore salvataggio:", error);
            alert("Errore durante il salvataggio: " + (error instanceof Error ? error.message : "Unknown error"));
            throw error;
        }
    };

    const columns: Column<Servizio>[] = [
        {
            header: "Codice",
            accessor: "codice",
            className: "font-mono text-sm",
        },
        {
            header: "Nome",
            accessor: (row) => (
                <div>
                    <div className="font-medium text-white">{row.nome}</div>
                    <div className="text-xs text-gray-500">{row.categoria}</div>
                </div>
            ),
        },
        {
            header: "Prezzo Unitario",
            accessor: (row) => (
                <div className="text-right">
                    <div className="font-mono">€ {row.prezzo_unitario?.toFixed(2)}</div>
                    <span className="text-[10px] text-gray-500 uppercase">/ {row.unita_misura}</span>
                </div>
            ),
            className: "text-right",
        },
        {
            header: "Stato",
            accessor: (row) => <StatusBadge status={row.attivo} />,
            className: "text-center",
        },
        {
            header: "Azioni",
            accessor: (row) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => handleEdit(row)}
                        className="p-1.5 hover:bg-gray-800 rounded text-indigo-400 transition-colors"
                        title="Modifica"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="p-1.5 hover:bg-red-500/10 rounded text-red-500 transition-colors"
                        title="Elimina"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            ),
            className: "text-right",
        },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            <PageHeader
                title="Gestione Servizi"
                description="Listino servizi e prestazioni"
                actionLabel="Nuovo Servizio"
                onAction={handleCreate}
            />

            <div className="card">
                <DataTable
                    data={servizi}
                    columns={columns}
                    loading={loading}
                    searchable
                    searchKeys={["codice", "nome", "categoria"]}
                />
            </div>

            <ServizioModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={editingServizio}
                title={editingServizio ? "Modifica Servizio" : "Nuovo Servizio"}
            />
        </div>
    );
}
