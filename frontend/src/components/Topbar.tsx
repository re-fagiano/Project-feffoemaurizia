"use client";

import { useAuth } from "@/context/AuthContext";

export default function Topbar() {
    const { logout } = useAuth();

    return (
        <header className="bg-gray-900/50 border-b border-gray-800 px-6 py-3 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center justify-end">
                <button
                    onClick={logout}
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
        </header>
    );
}
