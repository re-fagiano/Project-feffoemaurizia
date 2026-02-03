"use client";

import { useState, useEffect } from "react";

export interface SedeFormData {
    nome_sede: string;
    indirizzo: string;
    citta: string;
    cap: string;
    provincia: string;
    referente_nome: string;
    referente_telefono: string;
    referente_email: string;
    sede_principale: boolean;
}

interface SedeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: SedeFormData) => Promise<void>;
    initialData?: Partial<SedeFormData>;
    title?: string;
}

const defaultSedeData: SedeFormData = {
    nome_sede: "",
    indirizzo: "",
    citta: "",
    cap: "",
    provincia: "",
    referente_nome: "",
    referente_telefono: "",
    referente_email: "",
    sede_principale: false,
};

export default function SedeModal({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    title = "Nuova Sede"
}: SedeModalProps) {
    const [formData, setFormData] = useState<SedeFormData>(defaultSedeData);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData ? { ...defaultSedeData, ...initialData } : defaultSedeData);
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
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
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Nome Sede *
                            </label>
                            <input
                                type="text"
                                name="nome_sede"
                                value={formData.nome_sede}
                                onChange={handleChange}
                                className="input"
                                placeholder="Es. Uffici Amministrativi, Magazzino..."
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Indirizzo *
                            </label>
                            <input
                                type="text"
                                name="indirizzo"
                                value={formData.indirizzo}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Città
                            </label>
                            <input
                                type="text"
                                name="citta"
                                value={formData.citta}
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
                                    name="cap"
                                    value={formData.cap}
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
                                    name="provincia"
                                    value={formData.provincia}
                                    onChange={handleChange}
                                    className="input"
                                    maxLength={2}
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 border-t border-gray-800 my-2 pt-4">
                            <h3 className="text-sm font-semibold text-gray-400 mb-4">Referente Locale</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Nome Referente
                            </label>
                            <input
                                type="text"
                                name="referente_nome"
                                value={formData.referente_nome}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Telefono
                            </label>
                            <input
                                type="text"
                                name="referente_telefono"
                                value={formData.referente_telefono}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                name="referente_email"
                                value={formData.referente_email}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>

                        <div className="md:col-span-2 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="sede_principale"
                                    checked={formData.sede_principale}
                                    onChange={handleChange}
                                    className="checkbox"
                                />
                                <span className="text-sm text-gray-300">Sede Principale</span>
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
