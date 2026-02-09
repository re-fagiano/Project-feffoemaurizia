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

export default function PriorityNavigator() {
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
        return topItems.map((item, index) => ({
            ...item,
            angle: (360 / topItems.length) * index,
        }));
    };

    if (loading) {
        return (
            <div className="priority-navigator-container">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="priority-navigator-container">
                <div className="text-center text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">Nessuna richiesta attiva</p>
                </div>
            </div>
        );
    }

    const radius = 120; // Radius of the circle in pixels

    return (
        <div className="priority-navigator-container">
            <div className="priority-navigator" style={{ width: radius * 2.5, height: radius * 2.5 }}>
                {/* Center indicator */}
                <div className="priority-center">
                    <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div className="text-xs text-gray-400 mt-1">Priorità</div>
                </div>

                {/* Richieste positioned in circle */}
                {items.map((item, index) => {
                    const angleRad = (item.angle - 90) * (Math.PI / 180); // -90 to start at top
                    const x = radius + radius * Math.cos(angleRad);
                    const y = radius + radius * Math.sin(angleRad);

                    return (
                        <Link
                            key={item.id}
                            href={`/dashboard/richieste/${item.id}`}
                            className={`urgent-item urgent-item-${item.color}`}
                            style={{
                                left: `${x}px`,
                                top: `${y}px`,
                                transform: 'translate(-50%, -50%)',
                                transitionDelay: `${index * 50}ms`,
                            }}
                            title={item.descrizione}
                        >
                            <div className="urgent-item-number">#{item.numero_richiesta}</div>
                            <div className={`urgent-item-indicator urgent-item-indicator-${item.color}`} />
                        </Link>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="priority-legend">
                <div className="priority-legend-item">
                    <div className="legend-dot legend-dot-red" />
                    <span>Urgente</span>
                </div>
                <div className="priority-legend-item">
                    <div className="legend-dot legend-dot-yellow" />
                    <span>In Lavorazione</span>
                </div>
                <div className="priority-legend-item">
                    <div className="legend-dot legend-dot-blue" />
                    <span>Risolta</span>
                </div>
            </div>
        </div>
    );
}
