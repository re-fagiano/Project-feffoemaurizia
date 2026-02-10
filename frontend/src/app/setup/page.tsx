"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/config";

export default function SetupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        nome: "",
        cognome: "",
        email: "",
        password: "",
        confermaPassword: "",
        nome_azienda: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confermaPassword) {
            setError("Le password non coincidono");
            return;
        }

        if (formData.password.length < 8) {
            setError("La password deve essere di almeno 8 caratteri");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/auth/setup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    nome: formData.nome,
                    cognome: formData.cognome,
                    nome_azienda: formData.nome_azienda,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Errore durante il setup");
            }

            // Setup completato, vai al login
            router.push("/login?setup=success");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Errore di connessione");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4 py-12">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-lg">
                {/* Logo e titolo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center pulse-glow">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Benvenuto in <span className="gradient-text">Ticket Platform</span></h1>
                    <p className="text-gray-400 text-lg">Configura il tuo account amministratore per iniziare</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${step >= s
                                    ? "bg-indigo-500 text-white"
                                    : "bg-gray-800 text-gray-500"
                                }`}>
                                {step > s ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : s}
                            </div>
                            {s < 2 && (
                                <div className={`w-16 h-1 rounded ${step > s ? "bg-indigo-500" : "bg-gray-800"}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <div className="card glass">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-3">
                            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div className="space-y-5 animate-fade-in">
                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-semibold">I tuoi dati</h2>
                                    <p className="text-gray-400 text-sm">Inserisci le informazioni dell&apos;amministratore</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Nome</label>
                                        <input
                                            type="text"
                                            name="nome"
                                            value={formData.nome}
                                            onChange={handleChange}
                                            className="input"
                                            placeholder="Mario"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Cognome</label>
                                        <input
                                            type="text"
                                            name="cognome"
                                            value={formData.cognome}
                                            onChange={handleChange}
                                            className="input"
                                            placeholder="Rossi"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="admin@tuaazienda.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Nome Azienda <span className="text-gray-500">(opzionale)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="nome_azienda"
                                        value={formData.nome_azienda}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="La Tua Azienda Srl"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!formData.nome || !formData.cognome || !formData.email) {
                                            setError("Compila tutti i campi obbligatori");
                                            return;
                                        }
                                        setError("");
                                        setStep(2);
                                    }}
                                    className="btn btn-primary w-full py-3 text-lg mt-6"
                                >
                                    Continua
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-5 animate-fade-in">
                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-semibold">Crea la tua password</h2>
                                    <p className="text-gray-400 text-sm">Scegli una password sicura per il tuo account</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="••••••••"
                                        minLength={8}
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Minimo 8 caratteri</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Conferma Password</label>
                                    <input
                                        type="password"
                                        name="confermaPassword"
                                        value={formData.confermaPassword}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="btn btn-outline flex-1 py-3"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                                        </svg>
                                        Indietro
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn btn-primary flex-1 py-3 text-lg"
                                    >
                                        {loading ? (
                                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                        ) : (
                                            <>
                                                Completa Setup
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    Hai già un account?{" "}
                    <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
                        Accedi
                    </Link>
                </p>
            </div>
        </div>
    );
}
