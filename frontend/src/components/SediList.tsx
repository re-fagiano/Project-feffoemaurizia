"use client";

import { useState } from "react";
import DataTable, { Column } from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import SedeModal, { SedeFormData } from "@/components/SedeModal";
import { fetchWithAuth } from "@/lib/auth";

export interface Sede {
    id: string;
    nome_sede: string;
    indirizzo: string;
    citta: string;
    cap: string;
    provincia: string;
    sede_principale: boolean;
    referente_nome?: string;
    attiva: boolean;
}

interface SediListProps {
    sedi: Sede[];
    clienteId: string;
    onUpdate: () => void;
}

export default function SediList({ sedi, clienteId, onUpdate }: SediListProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSede, setEditingSede] = useState<Sede | null>(null);

    const handleCreate = async (data: SedeFormData) => {
        await fetchWithAuth(`/api/clienti/${clienteId}/sedi`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        onUpdate();
    };

    const handleDelete = async (sedeId: string) => {
        if (!confirm("Sei sicuro di voler eliminare questa sede?")) return;

        await fetchWithAuth(`/api/clienti/${clienteId}/sedi/${sedeId}`, {
            method: "DELETE",
        });
        onUpdate();
    };

    const columns: Column<Sede>[] = [
        {
            header: "Nome Sede",
            accessor: (sede) => (
                <div>
                    <div className="font-medium flex items-center gap-2">
                        {sede.nome_sede}
                        {sede.sede_principale && (
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30">
                                PRINCIPALE
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-gray-500">
                        {sede.indirizzo}, {sede.cap} {sede.citta} ({sede.provincia})
                    </div>
                </div>
            ),
        },
        {
            header: "Referente",
            accessor: (sede) => sede.referente_nome || "-",
            className: "text-gray-400",
        },
        {
            header: "Stato",
            accessor: (sede) => <StatusBadge status={sede.attiva} />,
            className: "text-center",
        },
        {
            header: "Azioni",
            accessor: (sede) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => handleDelete(sede.id)}
                        className="p-1.5 hover:bg-red-500/10 text-red-500 rounded transition-colors"
                        title="Elimina"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                    {/* Edit not strictly requested in plan but good to have, skipping for now to stick to minimal scope, can easily add later given Modal supports initialData */}
                </div>
            ),
            className: "text-right",
        },
    ];

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Elenco Sedi</h2>
                <button
                    onClick={() => { setEditingSede(null); setIsModalOpen(true); }}
                    className="btn btn-outline btn-sm"
                >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Aggiungi Sede
                </button>
            </div>

            <DataTable
                data={sedi}
                columns={columns}
                emptyMessage="Nessuna sede configurata."
            />

            <SedeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreate}
                title="Aggiungi Sede"
            />
        </div>
    );
}
