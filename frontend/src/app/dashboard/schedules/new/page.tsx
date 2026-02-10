"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/config";

interface Cliente {
    id: string;
    ragione_sociale: string;
}

interface ContrattoCliente {
    id: string;
    nome_contratto_custom: string | null;
    tipo: string;
}

export default function NuovoSchedulePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState("");
    const [clienti, setClienti] = useState<Cliente[]>([]);
    const [contratti, setContratti] = useState<ContrattoCliente[]>([]);

    const [formData, setFormData] = useState({
        nome_descrittivo: "",
        tipo_entita: "contratto",
        entita_id: "",
        tipo_azione: "genera_alert",
        frequenza: "una_volta",
        giorno_settimana: "",
        giorno_mese: "",
        ora_esecuzione: "09:00",
        data_trigger: "",
        attivo: true,
        parametri_json: "",
    });

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        Promise.all([
            fetch(`${API_URL}/api/clienti`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then((r) => r.json()),
            fetch(`${API_URL}/api/contratti/clienti`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then((r) => r.json()).catch(() => []),
        ])
            .then(([clientiData, contrattiData]) => {
                setClienti(Array.isArray(clientiData) ? clientiData : []);
                setContratti(Array.isArray(contrattiData) ? contrattiData : []);
                setLoadingData(false);
            })
            .catch(() => setLoadingData(false));
    }, [router]);

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
                nome_descrittivo: formData.nome_descrittivo,
                tipo_entita: formData.tipo_entita,
                entita_id: formData.entita_id || null,
                tipo_azione: formData.tipo_azione,
                frequenza: formData.frequenza,
                giorno_settimana: formData.frequenza === "settimanale" ? parseInt(formData.giorno_settimana) : null,
                giorno_mese: formData.frequenza === "mensile" ? parseInt(formData.giorno_mese) : null,
                ora_esecuzione: formData.ora_esecuzione,
                prossimo_trigger: formData.frequenza === "una_volta" && formData.data_trigger ? formData.data_trigger : null,
                attivo: formData.attivo,
                parametri_json: formData.parametri_json ? JSON.parse(formData.parametri_json) : null,
            };

            const res = await fetch(`${API_URL}/api/schedules`, {
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

            router.push("/dashboard/schedules");
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
                    <Link href="/dashboard/schedules" className="btn btn-ghost p-2">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Nuovo Schedule</h1>
                        <p className="text-gray-400">Configura un&apos;azione automatizzata</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Configurazione Base */}
                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4">Configurazione Base</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Nome Descrittivo *
                                </label>
                                <input
                                    type="text"
                                    name="nome_descrittivo"
                                    value={formData.nome_descrittivo}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Es: Controllo scadenza contratti"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Tipo Entità
                                </label>
                                <select
                                    name="tipo_entita"
                                    value={formData.tipo_entita}
                                    onChange={handleChange}
                                    className="input"
                                >
                                    <option value="contratto">Contratto</option>
                                    <option value="cliente">Cliente</option>
                                    <option value="richiesta">Richiesta</option>
                                    <option value="sistema">Sistema</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Entità Specifica
                                </label>
                                {loadingData ? (
                                    <div className="input flex items-center justify-center">
                                        <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
                                    </div>
                                ) : (
                                    <select
                                        name="entita_id"
                                        value={formData.entita_id}
                                        onChange={handleChange}
                                        className="input"
                                    >
                                        <option value="">Tutte le entità</option>
                                        {formData.tipo_entita === "cliente" &&
                                            clienti.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.ragione_sociale}
                                                </option>
                                            ))}
                                        {formData.tipo_entita === "contratto" &&
                                            contratti.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.nome_contratto_custom || `Contratto ${c.tipo}`}
                                                </option>
                                            ))}
                                    </select>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Azione e Frequenza */}
                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4">Azione e Frequenza</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Tipo Azione *
                                </label>
                                <select
                                    name="tipo_azione"
                                    value={formData.tipo_azione}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                >
                                    <option value="genera_alert">Genera Alert</option>
                                    <option value="crea_richiesta">Crea Richiesta</option>
                                    <option value="invia_notifica">Invia Notifica</option>
                                    <option value="custom">Azione Custom</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Frequenza *
                                </label>
                                <select
                                    name="frequenza"
                                    value={formData.frequenza}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                >
                                    <option value="una_volta">Una Volta</option>
                                    <option value="giornaliera">Giornaliera</option>
                                    <option value="settimanale">Settimanale</option>
                                    <option value="mensile">Mensile</option>
                                </select>
                            </div>
                            {formData.frequenza === "una_volta" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Data Trigger
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="data_trigger"
                                        value={formData.data_trigger}
                                        onChange={handleChange}
                                        className="input"
                                    />
                                </div>
                            )}
                            {formData.frequenza === "settimanale" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Giorno della Settimana
                                    </label>
                                    <select
                                        name="giorno_settimana"
                                        value={formData.giorno_settimana}
                                        onChange={handleChange}
                                        className="input"
                                    >
                                        <option value="1">Lunedì</option>
                                        <option value="2">Martedì</option>
                                        <option value="3">Mercoledì</option>
                                        <option value="4">Giovedì</option>
                                        <option value="5">Venerdì</option>
                                        <option value="6">Sabato</option>
                                        <option value="0">Domenica</option>
                                    </select>
                                </div>
                            )}
                            {formData.frequenza === "mensile" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Giorno del Mese
                                    </label>
                                    <input
                                        type="number"
                                        name="giorno_mese"
                                        value={formData.giorno_mese}
                                        onChange={handleChange}
                                        className="input"
                                        min="1"
                                        max="31"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Ora Esecuzione
                                </label>
                                <input
                                    type="time"
                                    name="ora_esecuzione"
                                    value={formData.ora_esecuzione}
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stato */}
                    <div className="card">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="attivo"
                                checked={formData.attivo}
                                onChange={handleChange}
                                className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-indigo-500"
                            />
                            <div>
                                <span className="font-medium">Attiva Schedule</span>
                                <p className="text-sm text-gray-400">Lo schedule inizierà a funzionare appena creato</p>
                            </div>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <Link href="/dashboard/schedules" className="btn btn-outline flex-1">
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
                                    Crea Schedule
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
