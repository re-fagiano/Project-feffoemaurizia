"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailPendingContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "la tua email";

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 -left-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-violet-500/15 rounded-full blur-3xl" />
            </div>

            <div className="relative card glass max-w-md text-center">
                {/* Icon */}
                <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold mb-4">Verifica la tua email</h1>

                <p className="text-gray-400 mb-4">
                    Abbiamo inviato un'email di verifica a:
                </p>
                <p className="text-white font-semibold mb-6">{email}</p>

                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-300">
                        Clicca sul link nell'email per completare la registrazione e attivare il tuo account.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="text-sm text-gray-400">
                        <p className="mb-2">Non hai ricevuto l'email?</p>
                        <ul className="text-xs space-y-1">
                            <li>• Controlla la cartella spam</li>
                            <li>• Verifica che l'indirizzo email sia corretto</li>
                            <li>• L'email potrebbe impiegare qualche minuto</li>
                        </ul>
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 text-sm">
                            Torna al login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPendingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        }>
            <VerifyEmailPendingContent />
        </Suspense>
    );
}
