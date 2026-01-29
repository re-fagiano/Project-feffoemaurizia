"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NuovoClientePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        ragione_sociale: "",
        partita_iva: "",
        codice_fiscale: "",
        email_principale: "",
        telefono: "",
        gestione_interna: false,
        note: "",
        // Sede principale
        sede_nome: "Sede Principale",
        sede_indirizzo: "",
        sede_citta: "",
        sede_cap: "",
        sede_provincia: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = e.target;
        const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
        setFormData({ ...formData, [target.name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            const payload = {
                ragione_sociale: formData.ragione_sociale,
                partita_iva: formData.partita_iva || null,
                codice_fiscale: formData.codice_fiscale || null,
                email_principale: formData.email_principale,
                telefoni: formData.telefono ? [formData.telefono] : [],
                gestione_interna: formData.gestione_interna,
                note: formData.note || null,
                sedi: formData.sede_indirizzo ? [{
                    nome_sede: formData.sede_nome,
                    indirizzo: formData.sede_indirizzo,
                    citta: formData.sede_citta || null,
                    cap: formData.sede_cap || null,
                    provincia: formData.sede_provincia || null,
                    sede_principale: true,
                }] : null,
            };

            const res = await fetch("http://localhost:8000/api/clienti", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Errore durante la creazione");
            }

            router.push("/dashboard/clienti");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Errore di connessione");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard/clienti" className="btn btn-ghost p-2">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Nuovo Cliente</h1>
                        <p className="text-gray-400">Inserisci i dati del nuovo cliente</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
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

                    {/* Sede Principale */}
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
                        <Link href="/dashboard/clienti" className="btn btn-outline flex-1">
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
                                    Crea Cliente
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
