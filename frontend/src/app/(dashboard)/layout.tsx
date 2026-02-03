"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import GlobalSearch from "@/components/GlobalSearch";
import MonitorScreen from "@/components/MonitorScreen";

interface User {
    id: string;
    email: string;
    nome: string;
    cognome: string;
    ruolo: string;
    force_password_change: boolean;
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (!res.ok) throw new Error("Unauthorized");
                return res.json();
            })
            .then((data) => {
                setUser(data);

                // Check if password change is required
                if (data.force_password_change && pathname !== "/change-password") {
                    router.push("/change-password");
                }

                setLoading(false);
            })
            .catch(() => {
                localStorage.removeItem("token");
                router.push("/login");
            });
    }, [router, pathname]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-gray-950 text-white">
            {/* Sidebar Sinistra */}
            <Sidebar user={user} />

            {/* Area Centrale */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar con Search */}
                <header className="bg-gray-900/50 border-b border-gray-800 px-6 py-3 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        {/* Global Search */}
                        <GlobalSearch />

                        {/* User Menu */}
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-medium text-sm">
                                {user?.nome?.[0]}{user?.cognome?.[0]}
                            </div>
                            <div className="hidden md:block">
                                <p className="text-sm font-medium">
                                    {user?.nome} {user?.cognome}
                                </p>
                                <p className="text-xs text-gray-400 capitalize">{user?.ruolo}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                title="Esci"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-auto bg-gray-950">{children}</main>
            </div>

            {/* Monitor Screen Destra */}
            <MonitorScreen />
        </div>
    );
}
