"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/config";

interface ContrattoTemplate {
    id: string;
    nome_contratto: string;
    tipo: string;
}

interface Cliente {
    id: string;
    ragione_sociale: string;
}

export default function NuovoContrattoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState("");
    const [clienti, setClienti] = useState<Cliente[]>([]);
    const [templates, setTemplates] = useState<ContrattoTemplate[]>([]);

    const [formData, setFormData] = useState({
        cliente_id: "",
        contratto_template_id: "",
        nome_contratto_custom: "",
        tipo: "forfettario",
        data_attivazione: new Date().toISOString().split("T")[0],
        data_scadenza: "",
        // Forfettario
        importo_canone: "",
        frequenza_canone: "mensile",
        // Monte ore
        ore_totali: "",
        soglia_alert_ore: "20",
        note: "",
    });

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        // Carica clienti e templates contratto
        Promise.all([
            fetch(`${API_URL}/api/clienti`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then((r) => r.json()),
            fetch(`${API_URL}/api/contratti`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then((r) => r.json()).catch(() => []),
        ])
            .then(([clientiData, templatesData]) => {
                setClienti(Array.isArray(clientiData) ? clientiData : []);
                setTemplates(Array.isArray(templatesData) ? templatesData : []);
                setLoadingData(false);
            })
            .catch(() => setLoadingData(false));
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
                contratto_template_id: formData.contratto_template_id || null,
                nome_contratto_custom: formData.nome_contratto_custom || null,
                tipo: formData.tipo,
                data_attivazione: formData.data_attivazione,
                data_scadenza: formData.data_scadenza || null,
                importo_canone: formData.tipo === "forfettario" && formData.importo_canone ? parseFloat(formData.importo_canone) : null,
                frequenza_canone: formData.tipo === "forfettario" ? formData.frequenza_canone : null,
                ore_totali: formData.tipo === "monte_ore" && formData.ore_totali ? parseInt(formData.ore_totali) : null,
                soglia_alert_ore: parseInt(formData.soglia_alert_ore) || 20,
                note: formData.note || null,
            };

            const res = await fetch(`${API_URL}/api/contratti/clienti`, {
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

            router.push("/dashboard/contratti");
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
                    <Link href="/dashboard/contratti" className="btn btn-ghost p-2">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Nuovo Contratto</h1>
                        <p className="text-gray-400">Assegna un contratto ad un cliente</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Cliente e Template */}
                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4">Associazione</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Cliente *
                                </label>
                                {loadingData ? (
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
                                        {clienti.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.ragione_sociale}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Template Contratto
                                </label>
                                <select
                                    name="contratto_template_id"
                                    value={formData.contratto_template_id}
                                    onChange={handleChange}
                                    className="input"
                                >
                                    <option value="">Nessun template</option>
                                    {templates.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.nome_contratto} ({t.tipo})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Nome Contratto Personalizzato
                                </label>
                                <input
                                    type="text"
                                    name="nome_contratto_custom"
                                    value={formData.nome_contratto_custom}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Es: Assistenza Annuale 2026"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tipo e Date */}
                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4">Configurazione</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Tipo Contratto *
                                </label>
                                <select
                                    name="tipo"
                                    value={formData.tipo}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                >
                                    <option value="forfettario">Forfettario</option>
                                    <option value="monte_ore">Monte Ore</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Data Attivazione *
                                </label>
                                <input
                                    type="date"
                                    name="data_attivazione"
                                    value={formData.data_attivazione}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Data Scadenza
                                </label>
                                <input
                                    type="date"
                                    name="data_scadenza"
                                    value={formData.data_scadenza}
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Specifico per tipo */}
                    {formData.tipo === "forfettario" && (
                        <div className="card">
                            <h2 className="text-lg font-semibold mb-4">Dettagli Forfettario</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Importo Canone (€)
                                    </label>
                                    <input
                                        type="number"
                                        name="importo_canone"
                                        value={formData.importo_canone}
                                        onChange={handleChange}
                                        className="input"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Frequenza Canone
                                    </label>
                                    <select
                                        name="frequenza_canone"
                                        value={formData.frequenza_canone}
                                        onChange={handleChange}
                                        className="input"
                                    >
                                        <option value="mensile">Mensile</option>
                                        <option value="trimestrale">Trimestrale</option>
                                        <option value="semestrale">Semestrale</option>
                                        <option value="annuale">Annuale</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {formData.tipo === "monte_ore" && (
                        <div className="card">
                            <h2 className="text-lg font-semibold mb-4">Dettagli Monte Ore</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Ore Totali
                                    </label>
                                    <input
                                        type="number"
                                        name="ore_totali"
                                        value={formData.ore_totali}
                                        onChange={handleChange}
                                        className="input"
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Soglia Alert (% rimanente)
                                    </label>
                                    <input
                                        type="number"
                                        name="soglia_alert_ore"
                                        value={formData.soglia_alert_ore}
                                        onChange={handleChange}
                                        className="input"
                                        min="1"
                                        max="100"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Note */}
                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4">Note</h2>
                        <textarea
                            name="note"
                            value={formData.note}
                            onChange={handleChange}
                            className="input min-h-[100px]"
                            placeholder="Note aggiuntive sul contratto..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <Link href="/dashboard/contratti" className="btn btn-outline flex-1">
                            Annulla
                        </Link>
                        <button
                            type="submit"
                            disabled={loading || loadingData}
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
                                    Crea Contratto
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
