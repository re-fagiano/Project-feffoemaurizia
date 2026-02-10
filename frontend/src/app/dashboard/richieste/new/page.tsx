"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/config";

interface Cliente {
    id: string;
    ragione_sociale: string;
}

export default function NuovaRichiestaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingClienti, setLoadingClienti] = useState(true);
    const [error, setError] = useState("");
    const [clienti, setClienti] = useState<Cliente[]>([]);

    const [formData, setFormData] = useState({
        cliente_id: "",
        descrizione: "",
        priorita: "normale",
        data_appuntamento: "",
        origine: "admin",
    });

    useEffect(() => {
        // Carica lista clienti
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        fetch(`${API_URL}/api/clienti`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setClienti(Array.isArray(data) ? data : []);
                setLoadingClienti(false);
            })
            .catch(() => {
                setLoadingClienti(false);
            });
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
                cliente_id: formData.cliente_id,
                descrizione: formData.descrizione,
                priorita: formData.priorita,
                data_appuntamento: formData.data_appuntamento || null,
                origine: formData.origine,
            };

            const res = await fetch(`${API_URL}/api/richieste`, {
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

            router.push("/dashboard/richieste");
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
                    <Link href="/dashboard/richieste" className="btn btn-ghost p-2">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Nuova Richiesta</h1>
                        <p className="text-gray-400">Crea una nuova richiesta di intervento</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Cliente e Priorità */}
                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4">Dettagli Richiesta</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Cliente *
                                </label>
                                {loadingClienti ? (
                                    <div className="input flex items-center justify-center">
                                        <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
                                    </div>
                                ) : (
                                    <select
                                        name="cliente_id"
                                        value={formData.cliente_id}
                                        onChange={handleChange}
                                        className="input"
                                        required
                                    >
                                        <option value="">Seleziona cliente...</option>
                                        {clienti.map((cliente) => (
                                            <option key={cliente.id} value={cliente.id}>
                                                {cliente.ragione_sociale}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Priorità
                                </label>
                                <select
                                    name="priorita"
                                    value={formData.priorita}
                                    onChange={handleChange}
                                    className="input"
                                >
                                    <option value="bassa">Bassa</option>
                                    <option value="normale">Normale</option>
                                    <option value="alta">Alta</option>
                                    <option value="urgente">Urgente</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Origine
                                </label>
                                <select
                                    name="origine"
                                    value={formData.origine}
                                    onChange={handleChange}
                                    className="input"
                                >
                                    <option value="cliente">Cliente</option>
                                    <option value="tecnico">Tecnico</option>
                                    <option value="admin">Admin</option>
                                    <option value="email">Email</option>
                                    <option value="centralino">Centralino</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Data Appuntamento
                                </label>
                                <input
                                    type="datetime-local"
                                    name="data_appuntamento"
                                    value={formData.data_appuntamento}
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Descrizione */}
                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4">Descrizione</h2>
                        <textarea
                            name="descrizione"
                            value={formData.descrizione}
                            onChange={handleChange}
                            className="input min-h-[150px]"
                            placeholder="Descrivi il problema o la richiesta del cliente..."
                            required
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <Link href="/dashboard/richieste" className="btn btn-outline flex-1">
                            Annulla
                        </Link>
                        <button
                            type="submit"
                            disabled={loading || loadingClienti}
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Crea Richiesta
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
