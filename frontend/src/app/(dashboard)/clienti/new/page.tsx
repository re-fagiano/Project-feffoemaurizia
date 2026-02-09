"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import ClientForm, { ClientFormData } from "@/components/ClientForm";
import PageHeader from "@/components/common/PageHeader";

export default function NuovoClientePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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
                sedi: formData.sede_indirizzo ? [{
                    nome_sede: formData.sede_nome,
                    indirizzo: formData.sede_indirizzo,
                    citta: formData.sede_citta || null,
                    cap: formData.sede_cap || null,
                    provincia: formData.sede_provincia || null,
                    sede_principale: true,
                }] : null,
            };

            const res = await fetch(`${API_BASE_URL}/api/clienti`, {
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

            router.push("/clienti");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Errore di connessione");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Nuovo Cliente"
                description="Inserisci i dati del nuovo cliente"
            />
            <div className="p-8 max-w-4xl mx-auto animate-fade-in">
                <ClientForm
                    title="Nuovo Cliente"
                    subtitle="Inserisci i dati del nuovo cliente"
                    onSubmit={handleSubmit}
                    loading={loading}
                    error={error}
                    submitLabel="Crea Cliente"
                />
            </div>
        </>
    );
}
