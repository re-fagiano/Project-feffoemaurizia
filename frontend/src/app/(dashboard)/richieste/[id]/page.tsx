"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/auth";

interface Attivita {
    id: string;
    descrizione: string;
    stato: string;
    priorita: string;
    data_prevista: string | null;
    ore_addebitate: number | null;
    tipo_addebito: string | null;
    risolutiva: boolean;
    created_at: string;
}

interface Cliente {
    id: string;
    ragione_sociale: string;
    email_principale: string;
    gestione_interna: boolean;
    attivo: boolean;
}

interface RichiestaDetail {
    id: string;
    numero_richiesta: number;
    descrizione: string;
    stato: string;
    priorita: string;
    origine: string;
    created_at: string;
    updated_at: string;
    cliente: Cliente;
    attivita: Attivita[];
}

interface NewAttivitaRow {
    descrizione: string;
    ora_inizio: string;
    ora_fine: string;
    addebitabile: boolean;
}

const statoColors: Record<string, string> = {
    da_verificare: "badge-warning",
    da_gestire: "badge-info",
    in_gestione: "badge-info",
    risolta: "badge-success",
    validata: "badge-success",
    riaperta: "badge-warning",
    da_fatturare: "badge-info",
    fatturata: "badge-default",
    chiusa: "badge-default",
    nulla: "badge-danger",
};

const statoLabels: Record<string, string> = {
    da_verificare: "Da Verificare",
    da_gestire: "Da Gestire",
    in_gestione: "In Gestione",
    risolta: "Risolta",
    riaperta: "Riaperta",
    validata: "Validata",
    da_fatturare: "Da Fatturare",
    fatturata: "Fatturata",
    chiusa: "Chiusa",
    nulla: "Annullata",
};

const statoAttivitaColors: Record<string, string> = {
    programmata: "badge-info",
    in_corso: "badge-warning",
    completata: "badge-success",
    annullata: "badge-danger",
};

const statoAttivitaLabels: Record<string, string> = {
    programmata: "Programmata",
    in_corso: "In Corso",
    completata: "Completata",
    annullata: "Annullata",
};

export default function RichiestaDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [richiesta, setRichiesta] = useState<RichiestaDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [newAttivita, setNewAttivita] = useState<NewAttivitaRow>({
        descrizione: "",
        ora_inizio: "",
        ora_fine: "",
        addebitabile: true,
    });
    const [savingAttivita, setSavingAttivita] = useState(false);

    useEffect(() => {
        fetchWithAuth(`/api/richieste/${params.id}`)
            .then((data) => {
                setRichiesta(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Errore caricamento richiesta:", error);
                setError("Richiesta non trovata");
                setLoading(false);
            });
    }, [params.id]);

    const calcolaTempo = (): string => {
        if (!newAttivita.ora_inizio || !newAttivita.ora_fine) return "-";

        const inizio = new Date(`2000-01-01T${newAttivita.ora_inizio}`);
        const fine = new Date(`2000-01-01T${newAttivita.ora_fine}`);

        if (fine <= inizio) return "Errore";

        const diffMs = fine.getTime() - inizio.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const minutes = diffMins % 60;

        return `${hours}h ${minutes}m`;
    };

    const handleSaveAttivita = async () => {
        if (!newAttivita.descrizione.trim()) {
            alert("Inserisci una descrizione per l'attività");
            return;
        }

        setSavingAttivita(true);

        try {
            // Calcola ore addebitate se ci sono orari
            let ore_addebitate = null;
            if (newAttivita.ora_inizio && newAttivita.ora_fine) {
                const inizio = new Date(`2000-01-01T${newAttivita.ora_inizio}`);
                const fine = new Date(`2000-01-01T${newAttivita.ora_fine}`);
                const diffMs = fine.getTime() - inizio.getTime();
                ore_addebitate = diffMs / (1000 * 60 * 60); // Converti in ore
            }

            await fetchWithAuth(`/api/attivita/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    richiesta_id: params.id,
                    descrizione: newAttivita.descrizione,
                    priorita: "normale",
                    ore_addebitate: ore_addebitate,
                    tipo_addebito: newAttivita.addebitabile ? "monte_ore" : "gratuito",
                }),
            });

            // Ricarica richiesta
            const updated = await fetchWithAuth(`/api/richieste/${params.id}`);
            setRichiesta(updated);

            // Reset form per nuova riga
            setNewAttivita({
                descrizione: "",
                ora_inizio: "",
                ora_fine: "",
                addebitabile: true,
            });
        } catch (error) {
            console.error("Errore creazione attività:", error);
            alert("Errore durante la creazione dell'attività");
        } finally {
            setSavingAttivita(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, nextField?: string) => {
        if (e.key === "Tab" && nextField) {
            e.preventDefault();
            const element = document.getElementById(nextField);
            element?.focus();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error || !richiesta) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="card max-w-md text-center">
                    <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-xl font-bold mb-2">Richiesta non trovata</h2>
                    <p className="text-gray-400 mb-6">La richiesta che stai cercando non esiste o è stata eliminata.</p>
                    <Link href="/richieste" className="btn btn-primary">
                        Torna alle richieste
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <header className="bg-gray-900/50 border-b border-gray-800 px-8 py-4 sticky top-0 z-10 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/richieste" className="btn btn-ghost">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold">Richiesta #{richiesta.numero_richiesta}</h1>
                                <span className={`badge ${statoColors[richiesta.stato]}`}>
                                    {statoLabels[richiesta.stato] || richiesta.stato}
                                </span>
                            </div>
                            <p className="text-gray-400">{richiesta.cliente.ragione_sociale}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button className="btn btn-ghost">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Modifica
                        </button>
                    </div>
                </div>
            </header>

            <div className="p-8 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Colonna Principale */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Descrizione */}
                        <div className="card">
                            <h2 className="text-lg font-semibold mb-4">Descrizione</h2>
                            <p className="text-gray-300 whitespace-pre-wrap">{richiesta.descrizione}</p>
                        </div>

                        {/* Attività */}
                        <div className="card">
                            <h2 className="text-lg font-semibold mb-6">
                                Attività ({richiesta.attivita.length})
                            </h2>

                            {/* Tabella Attività */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-gray-400 border-b border-gray-700">
                                        <tr>
                                            <th className="text-left py-3 px-2">Descrizione</th>
                                            <th className="text-left py-3 px-2 w-24">Ora Inizio</th>
                                            <th className="text-left py-3 px-2 w-24">Ora Fine</th>
                                            <th className="text-left py-3 px-2 w-24">Tempo</th>
                                            <th className="text-center py-3 px-2 w-24">Addebitabile</th>
                                            <th className="text-center py-3 px-2 w-20"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Attività esistenti */}
                                        {richiesta.attivita.map((attivita) => (
                                            <tr key={attivita.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                                                <td className="py-3 px-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`badge badge-sm ${statoAttivitaColors[attivita.stato]}`}>
                                                            {statoAttivitaLabels[attivita.stato]}
                                                        </span>
                                                        <span>{attivita.descrizione}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2 text-gray-400">-</td>
                                                <td className="py-3 px-2 text-gray-400">-</td>
                                                <td className="py-3 px-2 text-gray-400">
                                                    {attivita.ore_addebitate ? `${attivita.ore_addebitate}h` : "-"}
                                                </td>
                                                <td className="py-3 px-2 text-center">
                                                    {attivita.tipo_addebito && attivita.tipo_addebito !== "gratuito" ? (
                                                        <svg className="w-4 h-4 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : (
                                                        <span className="text-gray-600">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-2 text-center">
                                                    <button className="text-indigo-400 hover:text-indigo-300 text-xs">
                                                        Dettagli
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Nuova riga per inserimento */}
                                        <tr className="border-b-2 border-indigo-500/30 bg-indigo-500/5">
                                            <td className="py-3 px-2">
                                                <input
                                                    id="descrizione"
                                                    type="text"
                                                    value={newAttivita.descrizione}
                                                    onChange={(e) => setNewAttivita({ ...newAttivita, descrizione: e.target.value })}
                                                    onKeyDown={(e) => handleKeyDown(e, "ora_inizio")}
                                                    placeholder="Descrizione attività..."
                                                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-gray-200 placeholder-gray-600"
                                                />
                                            </td>
                                            <td className="py-3 px-2">
                                                <input
                                                    id="ora_inizio"
                                                    type="time"
                                                    value={newAttivita.ora_inizio}
                                                    onChange={(e) => setNewAttivita({ ...newAttivita, ora_inizio: e.target.value })}
                                                    onKeyDown={(e) => handleKeyDown(e, "ora_fine")}
                                                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-gray-200"
                                                />
                                            </td>
                                            <td className="py-3 px-2">
                                                <input
                                                    id="ora_fine"
                                                    type="time"
                                                    value={newAttivita.ora_fine}
                                                    onChange={(e) => setNewAttivita({ ...newAttivita, ora_fine: e.target.value })}
                                                    onKeyDown={(e) => handleKeyDown(e, "addebitabile")}
                                                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-gray-200"
                                                />
                                            </td>
                                            <td className="py-3 px-2 text-gray-400 font-mono text-xs">
                                                {calcolaTempo()}
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <input
                                                    id="addebitabile"
                                                    type="checkbox"
                                                    checked={newAttivita.addebitabile}
                                                    onChange={(e) => setNewAttivita({ ...newAttivita, addebitabile: e.target.checked })}
                                                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <button
                                                    onClick={handleSaveAttivita}
                                                    disabled={savingAttivita || !newAttivita.descrizione.trim()}
                                                    className="btn btn-primary btn-sm disabled:opacity-50"
                                                >
                                                    {savingAttivita ? "..." : "Salva"}
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {richiesta.attivita.length === 0 && (
                                <p className="text-gray-500 text-sm mt-4 text-center">
                                    Nessuna attività registrata. Inizia compilando la riga sopra.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Info Richiesta */}
                        <div className="card">
                            <h3 className="font-semibold mb-4">Informazioni</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-gray-400">Priorità</span>
                                    <p className="capitalize">{richiesta.priorita}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400">Origine</span>
                                    <p className="capitalize">{richiesta.origine.replace("_", " ")}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400">Creata il</span>
                                    <p>{new Date(richiesta.created_at).toLocaleString("it-IT")}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400">Ultimo aggiornamento</span>
                                    <p>{new Date(richiesta.updated_at).toLocaleString("it-IT")}</p>
                                </div>
                            </div>
                        </div>

                        {/* Cliente */}
                        <div className="card">
                            <h3 className="font-semibold mb-4">Cliente</h3>
                            <div className="space-y-2">
                                <Link
                                    href={`/clienti/${richiesta.cliente.id}`}
                                    className="font-medium text-indigo-400 hover:text-indigo-300"
                                >
                                    {richiesta.cliente.ragione_sociale}
                                </Link>
                                <p className="text-sm text-gray-400">{richiesta.cliente.email_principale}</p>
                                {richiesta.cliente.gestione_interna && (
                                    <span className="badge badge-info">Gestione Interna</span>
                                )}
                            </div>
                        </div>

                        {/* Azioni Rapide */}
                        <div className="card">
                            <h3 className="font-semibold mb-4">Azioni</h3>
                            <div className="space-y-2">
                                <button className="btn btn-ghost w-full justify-start">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                    Cambia Stato
                                </button>
                                <button className="btn btn-ghost w-full justify-start">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                    Messaggi
                                </button>
                                <button className="btn btn-ghost w-full justify-start text-red-400 hover:text-red-300">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Elimina
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
