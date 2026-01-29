/**
 * API Client per comunicazione con backend FastAPI
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
    requireAuth?: boolean;
}

/**
 * Wrapper per fetch con gestione token e errori
 */
export async function apiFetch<T>(
    endpoint: string,
    options: FetchOptions = {}
): Promise<T> {
    const { requireAuth = true, ...fetchOptions } = options;

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
    };

    if (requireAuth) {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("Non autenticato");
        }
        (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `Errore ${response.status}`);
    }

    return response.json();
}

// Shortcuts per metodi comuni
export const api = {
    get: <T>(endpoint: string, options?: FetchOptions) =>
        apiFetch<T>(endpoint, { ...options, method: "GET" }),

    post: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
        apiFetch<T>(endpoint, {
            ...options,
            method: "POST",
            body: data ? JSON.stringify(data) : undefined,
        }),

    put: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
        apiFetch<T>(endpoint, {
            ...options,
            method: "PUT",
            body: data ? JSON.stringify(data) : undefined,
        }),

    delete: <T>(endpoint: string, options?: FetchOptions) =>
        apiFetch<T>(endpoint, { ...options, method: "DELETE" }),
};

// Tipi principali
export interface User {
    id: string;
    email: string;
    nome: string;
    cognome: string;
    ruolo: "admin" | "supervisore" | "tecnico" | "cliente";
    attivo: boolean;
}

export interface Cliente {
    id: string;
    ragione_sociale: string;
    email_principale: string;
    partita_iva?: string;
    gestione_interna: boolean;
    attivo: boolean;
}

export interface Richiesta {
    id: string;
    numero_richiesta: number;
    cliente_id: string;
    descrizione: string;
    stato: string;
    priorita: string;
    origine: string;
    created_at: string;
}

export interface Attivita {
    id: string;
    richiesta_id: string;
    descrizione: string;
    stato: string;
    priorita: string;
    risolutiva: boolean;
    tipo_addebito?: string;
    ore_addebitate?: number;
    created_at: string;
}

export interface Contratto {
    id: string;
    nome_contratto: string;
    tipo: "forfettario" | "monte_ore";
    descrizione?: string;
    attivo: boolean;
}

export interface ContrattoCliente {
    id: string;
    cliente_id: string;
    nome_contratto_custom?: string;
    tipo: "forfettario" | "monte_ore";
    stato: string;
    ore_totali?: number;
    ore_utilizzate: number;
    ore_residue?: number;
}
