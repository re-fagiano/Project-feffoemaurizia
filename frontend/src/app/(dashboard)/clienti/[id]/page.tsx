"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import ClientForm, { ClientFormData } from "@/components/ClientForm";
import PageHeader from "@/components/common/PageHeader";
import SediList, { Sede } from "@/components/SediList";

export default function ModificaClientePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState("");
    const [initialData, setInitialData] = useState<Partial<ClientFormData>>({});
    const [sedi, setSedi] = useState<Sede[]>([]);

    // Simple tab state if we want tabs, or just stack them. Let's stack them for visibility as per plan preference.

    const fetchCliente = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            const res = await fetch(`${API_BASE_URL}/api/clienti/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Cliente non trovato");

            const data = await res.json();
            setSedi(data.sedi || []);

            // Map API data to flat form structure
            // Note: We don't map sede fields anymore for the main form if we manage them in the Sedi list,
            // BUT for backward compatibility or ease of use, we might blank them out or keep them.
            // Since we now have a dedicated Sedi list, the "Sede Principale" fields in ClientForm are less relevant 
            // OR they could refer to the headquarter.
            // For now, I will populate them if a main sede exists, but moving forward users should use the Sedi list.

            const sedePrincipale = data.sedi?.find((s: any) => s.sede_principale) || data.sedi?.[0];

            setInitialData({
                ragione_sociale: data.ragione_sociale,
                nome_alternativo: data.nome_alternativo || "",
                partita_iva: data.partita_iva || "",
                codice_fiscale: data.codice_fiscale || "",
                codice_gestionale_esterno: data.codice_gestionale_esterno || "",
                email_principale: data.email_principale,
                telefono: data.telefoni?.[0] || "",
                gestione_interna: data.gestione_interna,
                note: data.note || "",
                // Keep these for display in form if user wants to see 'main' address quickly
                sede_nome: sedePrincipale?.nome_sede || "",
                sede_indirizzo: sedePrincipale?.indirizzo || "",
                sede_citta: sedePrincipale?.citta || "",
                sede_cap: sedePrincipale?.cap || "",
                sede_provincia: sedePrincipale?.provincia || "",
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Errore caricamento");
        } finally {
            setInitialLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchCliente();
    }, [id, router]);

    const handleSubmit = async (formData: ClientFormData) => {
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
                nome_alternativo: formData.nome_alternativo || null,
                partita_iva: formData.partita_iva || null,
                codice_fiscale: formData.codice_fiscale || null,
                codice_gestionale_esterno: formData.codice_gestionale_esterno || null,
                email_principale: formData.email_principale,
                telefoni: formData.telefono ? [formData.telefono] : [],
                gestione_interna: formData.gestione_interna,
                note: formData.note || null,
            };

            const res = await fetch(`${API_BASE_URL}/api/clienti/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Errore durante l'aggiornamento");
            }

            router.push("/clienti");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Errore di connessione");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Modifica Cliente"
                description={`Modifica i dati di ${initialData.ragione_sociale}`}
            />

            <div className="p-8 max-w-7xl mx-auto animate-fade-in grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Colonna Sinistra: Form Dati */}
                <div className="xl:col-span-2">
                    <ClientForm
                        title="Dati Generali"
                        subtitle="Informazioni anagrafiche"
                        initialData={initialData}
                        onSubmit={handleSubmit}
                        loading={loading}
                        error={error}
                        submitLabel="Salva Modifiche"
                    />
                </div>

                {/* Colonna Destra: Sedi */}
                <div className="xl:col-span-1">
                    <SediList
                        sedi={sedi}
                        clienteId={id}
                        onUpdate={fetchCliente}
                    />
                </div>
            </div>
        </>
    );
}
