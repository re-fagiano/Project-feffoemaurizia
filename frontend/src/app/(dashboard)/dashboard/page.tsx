"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

interface User {
    id: string;
    email: string;
    nome: string;
    cognome: string;
    ruolo: string;
}

interface DashboardStats {
    richieste_aperte: number;
    attivita_oggi: number;
    contratti_attivi: number;
    messaggi_non_letti: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<DashboardStats>({
        richieste_aperte: 0,
        attivita_oggi: 0,
        contratti_attivi: 0,
        messaggi_non_letti: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        // Fetch user info
        fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (!res.ok) throw new Error("Unauthorized");
                return res.json();
            })
            .then((data) => {
                setUser(data);
                setLoading(false);
            })
            .catch(() => {
                localStorage.removeItem("token");
                router.push("/login");
            });

        // Mock stats for now
        setStats({
            richieste_aperte: 12,
            attivita_oggi: 5,
            contratti_attivi: 28,
            messaggi_non_letti: 3,
        });
    }, [router]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <header className="bg-gray-900/50 border-b border-gray-800 px-8 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-gray-400">Bentornato, {user?.nome}!</p>
                </div>

                <div className="flex items-center gap-4">
                    <button className="relative btn btn-ghost p-2">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {stats.messaggi_non_letti > 0 && (
                            <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                                {stats.messaggi_non_letti}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="p-8 animate-fade-in">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Richieste Aperte"
                        value={stats.richieste_aperte}
                        icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        color="indigo"
                    />
                    <StatCard
                        title="Attività Oggi"
                        value={stats.attivita_oggi}
                        icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        color="sky"
                    />
                    <StatCard
                        title="Contratti Attivi"
                        value={stats.contratti_attivi}
                        icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        color="green"
                    />
                    <StatCard
                        title="Messaggi Non Letti"
                        value={stats.messaggi_non_letti}
                        icon="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        color="yellow"
                    />
                </div>

                {/* Quick Actions */}
                <div className="card mb-8">
                    <h2 className="text-lg font-semibold mb-4">Azioni Rapide</h2>
                    <div className="flex flex-wrap gap-4">
                        <Link href="/richieste/new" className="btn btn-primary">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nuova Richiesta
                        </Link>
                        <Link href="/clienti/new" className="btn btn-secondary">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Nuovo Cliente
                        </Link>
                        <button className="btn btn-outline">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Esporta Report
                        </button>
                    </div>
                </div>

                {/* Recent Activity Placeholder */}
                <div className="card">
                    <h2 className="text-lg font-semibold mb-4">Attività Recenti</h2>
                    <div className="text-center py-12 text-gray-400">
                        <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>Connetti il database per vedere le attività recenti</p>
                    </div>
                </div>
            </div>
        </>
    );
}

function StatCard({
    title,
    value,
    icon,
    color,
}: {
    title: string;
    value: number;
    icon: string;
    color: "indigo" | "sky" | "green" | "yellow";
}) {
    const colorClasses = {
        indigo: "bg-indigo-500/10 text-indigo-400",
        sky: "bg-sky-500/10 text-sky-400",
        green: "bg-green-500/10 text-green-400",
        yellow: "bg-yellow-500/10 text-yellow-400",
    };

    return (
        <div className="card card-hover">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-gray-400 text-sm">{title}</p>
                    <p className="text-3xl font-bold mt-1">{value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                    </svg>
                </div>
            </div>
        </div>
    );
}
