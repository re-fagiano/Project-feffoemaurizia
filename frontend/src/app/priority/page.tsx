"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Richiesta {
    id: string;
    numero_richiesta: number;
    descrizione: string;
    stato: string;
    priorita: string;
    created_at: string;
}

interface UrgentItem extends Richiesta {
    urgencyScore: number;
    color: 'red' | 'yellow' | 'blue';
    angle: number;
}

export default function PriorityPage() {
    const [items, setItems] = useState<UrgentItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRichieste();
        // Poll for updates every 30 seconds
        const interval = setInterval(fetchRichieste, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchRichieste = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch("http://localhost:8000/api/richieste/", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error("Failed to fetch");

            const data: Richiesta[] = await res.json();

            // Filter out closed/completed requests
            const activeRichieste = data.filter(r =>
                !['chiusa', 'fatturata', 'nulla'].includes(r.stato)
            );

            const processedItems = processRichieste(activeRichieste);
            setItems(processedItems);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching richieste:", error);
            setLoading(false);
        }
    };

    const calculateUrgencyScore = (richiesta: Richiesta): number => {
        let score = 0;

        // Priority weight
        if (richiesta.priorita === 'urgente') score += 100;
        else if (richiesta.priorita === 'alta') score += 75;
        else if (richiesta.priorita === 'normale') score += 50;
        else if (richiesta.priorita === 'bassa') score += 25;

        // Status modifiers
        if (richiesta.stato === 'da_verificare') score += 50;
        else if (richiesta.stato === 'da_gestire') score += 40;
        else if (richiesta.stato === 'riaperta') score += 45;
        else if (richiesta.stato === 'in_gestione') score -= 20; // Yellow, lower priority
        else if (richiesta.stato === 'risolta') score -= 100; // Blue, bottom
        else if (richiesta.stato === 'validata') score -= 100;

        return score;
    };

    const determineColor = (richiesta: Richiesta): 'red' | 'yellow' | 'blue' => {
        // Red: Urgent priority OR needs verification
        if (richiesta.priorita === 'urgente' || richiesta.stato === 'da_verificare' || richiesta.stato === 'riaperta') {
            return 'red';
        }

        // Blue: Resolved or validated
        if (richiesta.stato === 'risolta' || richiesta.stato === 'validata') {
            return 'blue';
        }

        // Yellow: In progress (being worked on but not resolved)
        if (richiesta.stato === 'in_gestione') {
            return 'yellow';
        }

        // Default to yellow for other states
        return 'yellow';
    };

    const processRichieste = (richieste: Richiesta[]): UrgentItem[] => {
        // Calculate urgency scores and colors
        const withScores = richieste.map(r => ({
            ...r,
            urgencyScore: calculateUrgencyScore(r),
            color: determineColor(r),
            angle: 0,
        }));

        // Sort by urgency score (highest first)
        const sorted = withScores.sort((a, b) => b.urgencyScore - a.urgencyScore);

        // Limit to top 12 items for better visualization
        const topItems = sorted.slice(0, 12);

        // Distribute around circle, starting at 12 o'clock (0°)
        // IMPORTANT: NO ROTATION - positions are STATIC
        return topItems.map((item, index) => ({
            ...item,
            angle: (360 / topItems.length) * index,
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const radius = 180; // Larger radius for main page

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col">
            {/* Header */}
            <header className="border-b border-gray-800 px-8 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Priority Navigator</h1>
                        <p className="text-gray-400">Visualizzazione priorità richieste</p>
                    </div>
                    <Link href="/dashboard" className="btn btn-outline">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Torna alla Dashboard
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-8">
                {items.length === 0 ? (
                    <div className="text-center text-gray-400">
                        <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-lg">Nessuna richiesta attiva</p>
                    </div>
                ) : (
                    <div className="relative" style={{ width: radius * 2.8, height: radius * 2.8 }}>
                        {/* Center indicator - NO ANIMATION */}
                        <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border-2 border-indigo-500/30 flex flex-col items-center justify-center backdrop-blur-sm"
                            style={{ zIndex: 10 }}
                        >
                            <svg className="w-10 h-10 text-indigo-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <div className="text-sm text-gray-400 font-medium">Priorità</div>
                            <div className="text-xs text-gray-500">{items.length} items</div>
                        </div>

                        {/* Richieste positioned in circle - NO ROTATION */}
                        {items.map((item, index) => {
                            const angleRad = (item.angle - 90) * (Math.PI / 180); // -90 to start at top
                            const x = radius * 1.4 + radius * Math.cos(angleRad);
                            const y = radius * 1.4 + radius * Math.sin(angleRad);

                            return (
                                <Link
                                    key={item.id}
                                    href={`/dashboard/richieste/${item.id}`}
                                    className={`absolute urgent-item-large urgent-item-${item.color}`}
                                    style={{
                                        left: `${x}px`,
                                        top: `${y}px`,
                                        transform: 'translate(-50%, -50%)',
                                        // NO rotation transform!
                                    }}
                                    title={item.descrizione}
                                >
                                    <div className="text-xl font-bold mb-1">#{item.numero_richiesta}</div>
                                    <div className={`w-3 h-3 rounded-full urgent-item-indicator-${item.color}`} />
                                    <div className="text-xs mt-1 opacity-75">{item.priorita}</div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="border-t border-gray-800 px-8 py-6">
                <div className="max-w-4xl mx-auto">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">Leggenda Colori</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <div className="w-4 h-4 rounded-full bg-red-500" />
                            <div>
                                <div className="text-sm font-medium text-red-400">Critico</div>
                                <div className="text-xs text-gray-500">Urgente / Da verificare</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                            <div className="w-4 h-4 rounded-full bg-yellow-500" />
                            <div>
                                <div className="text-sm font-medium text-yellow-400">Alta Priorità</div>
                                <div className="text-xs text-gray-500">In lavorazione</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <div className="w-4 h-4 rounded-full bg-blue-500" />
                            <div>
                                <div className="text-sm font-medium text-blue-400">Bassa Priorità</div>
                                <div className="text-xs text-gray-500">Risolta / Completata</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
