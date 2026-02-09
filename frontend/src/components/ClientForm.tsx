"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export interface ClientFormData {
    ragione_sociale: string;
    nome_alternativo: string;
    partita_iva: string;
    codice_fiscale: string;
    codice_gestionale_esterno: string;
    email_principale: string;
    telefono: string;
    gestione_interna: boolean;
    note: string;
    // Sede principale fields (flat structure for form simplicity)
    sede_nome: string;
    sede_indirizzo: string;
    sede_citta: string;
    sede_cap: string;
    sede_provincia: string;
}

interface ClientFormProps {
    initialData?: Partial<ClientFormData>;
    onSubmit: (data: ClientFormData) => Promise<void>;
    loading: boolean;
    error?: string;
    submitLabel?: string;
    cancelHref?: string;
    title: string;
    subtitle: string;
}

export const defaultClientData: ClientFormData = {
    ragione_sociale: "",
    nome_alternativo: "",
    partita_iva: "",
    codice_fiscale: "",
    codice_gestionale_esterno: "",
    email_principale: "",
    telefono: "",
    gestione_interna: false,
    note: "",
    sede_nome: "Sede Principale",
    sede_indirizzo: "",
    sede_citta: "",
    sede_cap: "",
    sede_provincia: "",
};

export default function ClientForm({
    initialData,
    onSubmit,
    loading,
    error,
    submitLabel = "Salva",
    cancelHref = "/clienti",
    title,
    subtitle
}: ClientFormProps) {
    const [formData, setFormData] = useState<ClientFormData>(defaultClientData);

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = e.target;
        const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
        setFormData({ ...formData, [target.name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                    {error}
                </div>
            )}

            {/* Dati Azienda */}
            <div className="card">
                <h2 className="text-lg font-semibold mb-4">Dati Azienda</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Ragione Sociale *
                        </label>
                        <input
                            type="text"
                            name="ragione_sociale"
                            value={formData.ragione_sociale}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Nome Alternativo (Alias Ricerca)
                        </label>
                        <input
                            type="text"
                            name="nome_alternativo"
                            value={formData.nome_alternativo}
                            onChange={handleChange}
                            className="input"
                            placeholder="Es. Nome Hotel, Società controllante..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Partita IVA
                        </label>
                        <input
                            type="text"
                            name="partita_iva"
                            value={formData.partita_iva}
                            onChange={handleChange}
                            className="input"
                            maxLength={11}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Codice Fiscale
                        </label>
                        <input
                            type="text"
                            name="codice_fiscale"
                            value={formData.codice_fiscale}
                            onChange={handleChange}
                            className="input"
                            maxLength={16}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Codice Gestionale
                        </label>
                        <input
                            type="text"
                            name="codice_gestionale_esterno"
                            value={formData.codice_gestionale_esterno}
                            onChange={handleChange}
                            className="input"
                            maxLength={50}
                            placeholder="Es. COD-123"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            name="email_principale"
                            value={formData.email_principale}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Telefono
                        </label>
                        <input
                            type="tel"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                            className="input"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="gestione_interna"
                                checked={formData.gestione_interna}
                                onChange={handleChange}
                                className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-indigo-500"
                            />
                            <span className="text-gray-300">Gestione interna (cliente interno/affiliato)</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Sede Principale - Only show if not specifically hidden or if we want to support editing simple main address here. 
                For New Client it's fine. For Edit it might be redundant if we have Sedi List.
                Let's keep it for now as "Sede Principale Rapida" or similar. */}
            <div className="card">
                <h2 className="text-lg font-semibold mb-4">Sede Principale</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Indirizzo
                        </label>
                        <input
                            type="text"
                            name="sede_indirizzo"
                            value={formData.sede_indirizzo}
                            onChange={handleChange}
                            className="input"
                            placeholder="Via, numero civico"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Città
                        </label>
                        <input
                            type="text"
                            name="sede_citta"
                            value={formData.sede_citta}
                            onChange={handleChange}
                            className="input"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                CAP
                            </label>
                            <input
                                type="text"
                                name="sede_cap"
                                value={formData.sede_cap}
                                onChange={handleChange}
                                className="input"
                                maxLength={5}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Provincia
                            </label>
                            <input
                                type="text"
                                name="sede_provincia"
                                value={formData.sede_provincia}
                                onChange={handleChange}
                                className="input"
                                maxLength={2}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Note */}
            <div className="card">
                <h2 className="text-lg font-semibold mb-4">Note</h2>
                <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    className="input min-h-[100px]"
                    placeholder="Note aggiuntive sul cliente..."
                />
            </div>

            {/* Actions */}
            <div className="flex gap-4">
                <Link href={cancelHref} className="btn btn-outline flex-1">
                    Annulla
                </Link>
                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary flex-1"
                >
                    {loading ? (
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {submitLabel}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
