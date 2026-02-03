/**
 * Utility per chiamate API autenticate con gestione automatica della scadenza sessione
 */
import { API_BASE_URL } from "./api";

/**
 * Fetch con autenticazione automatica e gestione errori 401
 * 
 * @param endpoint - Endpoint API (es. "/api/richieste/")
 * @param options - Opzioni fetch standard
 * @returns Promise con i dati JSON
 * @throws Error se la richiesta fallisce
 */
export async function fetchWithAuth(
    endpoint: string,
    options: RequestInit = {}
): Promise<any> {
    const token = localStorage.getItem("token");

    // Nessun token, redirect a login
    if (!token) {
        window.location.href = "/login";
        throw new Error("No authentication token");
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
        },
    });

    // Token scaduto o invalido
    if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login?session=expired";
        throw new Error("Session expired");
    }

    // Altro errore HTTP
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * Controlla se l'utente è autenticato
 * @returns true se c'è un token valido
 */
export function isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
}

/**
 * Effettua logout rimuovendo il token
 */
export function logout(): void {
    localStorage.removeItem("token");
    window.location.href = "/login";
}
