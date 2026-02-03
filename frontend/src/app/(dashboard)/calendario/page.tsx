"use client";

import CalendarWrapper from "@/components/CalendarWrapper";
import PageHeader from "@/components/common/PageHeader";
import { Plus } from "lucide-react";
import Link from "next/link";
import BrogliaccioBoard from "@/components/BrogliaccioBoard";

export default function CalendarioPage() {
    return (
        <div className="h-screen flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Calendario Interventi</h1>
                    <p className="text-gray-500">Gestisci la pianificazione di richieste e attività</p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/richieste/nuova"
                        className="btn btn-primary gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Nuova Richiesta
                    </Link>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Brogliaccio Sidebar */}
                <BrogliaccioBoard />

                {/* Calendar */}
                <div className="flex-1 p-6">
                    <CalendarWrapper />
                </div>
            </div>
        </div>
    );
}
