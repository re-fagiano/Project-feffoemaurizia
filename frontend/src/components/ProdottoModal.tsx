"use client";

import { useState, useEffect } from "react";

export interface ProdottoFormData {
    codice: string;
    nome: string;
    descrizione: string;
    categoria: string;
    prezzo: number;
    iva: number;
    unita_misura: string;
    attivo: boolean;
}

interface ProdottoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ProdottoFormData) => Promise<void>;
    initialData?: Partial<ProdottoFormData>;
    title?: string;
}

const defaultData: ProdottoFormData = {
    codice: "",
    nome: "",
    descrizione: "",
    categoria: "",
    prezzo: 0,
    iva: 22,
    unita_misura: "pz",
    attivo: true,
};

export default function ProdottoModal({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    title = "Nuovo Prodotto"
}: ProdottoModalProps) {
    const [formData, setFormData] = useState<ProdottoFormData>(defaultData);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData ? { ...defaultData, ...initialData } : defaultData);
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = e.target;
        const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
        const name = target.name;

        setFormData(prev => ({
            ...prev,
            [name]: name === "prezzo" || name === "iva" ? parseFloat(value as string) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
            <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-sm">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Codice (SKU) *
                            </label>
                            <input
                                type="text"
                                name="codice"
                                value={formData.codice}
                                onChange={handleChange}
                                className="input font-mono uppercase"
                                placeholder="ES. HARD-001"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Nome Prodotto *
                            </label>
                            <input
                                type="text"
                                name="nome"
                                value={formData.nome}
                                onChange={handleChange}
                                className="input"
                                placeholder="Es. Notebook Dell XPS 15"
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Descrizione
                            </label>
                            <textarea
                                name="descrizione"
                                value={formData.descrizione}
                                onChange={handleChange}
                                className="input resize-none"
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Categoria
                            </label>
                            <input
                                type="text"
                                name="categoria"
                                value={formData.categoria}
                                onChange={handleChange}
                                className="input"
                                placeholder="Es. Hardware, Licenze..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Unità Misura
                            </label>
                            <select
                                name="unita_misura"
                                value={formData.unita_misura}
                                onChange={handleChange}
                                className="input"
                            >
                                <option value="pz">Pezzi (pz)</option>
                                <option value="kg">Chilogrammi (kg)</option>
                                <option value="m">Metri (m)</option>
                                <option value="l">Litri (l)</option>
                                <option value="kit">Kit</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Prezzo Base (€)
                            </label>
                            <input
                                type="number"
                                name="prezzo"
                                value={formData.prezzo}
                                onChange={handleChange}
                                className="input"
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                IVA (%)
                            </label>
                            <input
                                type="number"
                                name="iva"
                                value={formData.iva}
                                onChange={handleChange}
                                className="input"
                                min="0"
                                step="0.5"
                            />
                        </div>

                        <div className="md:col-span-2 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="attivo"
                                    checked={formData.attivo}
                                    onChange={handleChange}
                                    className="checkbox"
                                />
                                <span className="text-sm text-gray-300">Prodotto Attivo</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-ghost flex-1"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary flex-1"
                            disabled={submitting}
                        >
                            {submitting ? "Salvataggio..." : "Salva"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
