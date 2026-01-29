"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Schedule {
    id: string;
    nome_descrittivo: string;
    tipo_entita: string;
    tipo_azione: string;
    frequenza: string;
    prossimo_trigger: string | null;
    ultimo_trigger: string | null;
    attivo: boolean;
}

export default function SchedulesPage() {
    const router = useRouter();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        fetch("http://localhost:8000/api/schedules", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setSchedules(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [router]);

    const getAzioneBadge = (azione: string) => {
        const badges: Record<string, string> = {
            crea_richiesta: "badge-info",
            invia_notifica: "badge-warning",
            genera_alert: "badge-danger",
            custom: "badge-default",
        };
        return badges[azione] || "badge-default";
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Schedulatore</h1>
                    <p className="text-gray-400">Gestisci azioni automatizzate e scadenze</p>
                </div>
                <Link href="/dashboard/schedules/new" className="btn btn-primary">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuovo Schedule
                </Link>
            </div>

            {/* Schedules List */}
            {schedules.length === 0 ? (
                <div className="card text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-400 mb-4">Nessuno schedule configurato</p>
                    <Link href="/dashboard/schedules/new" className="btn btn-primary">
                        Crea il primo schedule
                    </Link>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Entità</th>
                                <th>Azione</th>
                                <th>Frequenza</th>
                                <th>Prossimo Trigger</th>
                                <th>Stato</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedules.map((schedule) => (
                                <tr key={schedule.id}>
                                    <td className="font-medium">{schedule.nome_descrittivo}</td>
                                    <td className="text-gray-400 capitalize">
                                        {schedule.tipo_entita.replace("_", " ")}
                                    </td>
                                    <td>
                                        <span className={`badge ${getAzioneBadge(schedule.tipo_azione)}`}>
                                            {schedule.tipo_azione.replace("_", " ")}
                                        </span>
                                    </td>
                                    <td className="capitalize">{schedule.frequenza}</td>
                                    <td className="text-gray-400">
                                        {schedule.prossimo_trigger
                                            ? new Date(schedule.prossimo_trigger).toLocaleDateString("it-IT")
                                            : "-"}
                                    </td>
                                    <td>
                                        <span className={`badge ${schedule.attivo ? "badge-success" : "badge-default"}`}>
                                            {schedule.attivo ? "Attivo" : "Disattivo"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
