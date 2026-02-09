"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const token = searchParams.get("token");

        if (!token) {
            setStatus("error");
            setMessage("Token mancante");
            return;
        }

        fetch(`${API_BASE_URL}/api/auth/verify-email?token=${token}`)
            .then(res => res.json())
            .then(data => {
                if (data.message) {
                    setStatus("success");
                    setMessage(data.message);
                    setTimeout(() => router.push("/login?verified=success"), 3000);
                } else {
                    setStatus("error");
                    setMessage(data.detail || "Errore durante la verifica");
                }
            })
            .catch(() => {
                setStatus("error");
                setMessage("Errore di connessione");
            });
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 -left-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-violet-500/15 rounded-full blur-3xl" />
            </div>

            <div className="relative card glass max-w-md text-center">
                {status === "loading" && (
                    <>
                        <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
                        <h1 className="text-xl font-bold">Verifica in corso...</h1>
                        <p className="text-gray-400 mt-2">Attendere prego</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Email verificata!</h1>
                        <p className="text-gray-400 mb-4">{message}</p>
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                            <p className="text-sm text-gray-300">
                                Il tuo account è stato attivato con successo.
                            </p>
                        </div>
                        <p className="text-sm text-gray-500 mt-4">
                            Reindirizzamento al login tra pochi secondi...
                        </p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Verifica fallita</h1>
                        <p className="text-gray-400 mb-6">{message}</p>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                            <p className="text-sm text-gray-300">
                                Il link potrebbe essere scaduto o non valido.
                            </p>
                        </div>
                        <button
                            onClick={() => router.push("/login")}
                            className="btn btn-primary w-full"
                        >
                            Torna al login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
