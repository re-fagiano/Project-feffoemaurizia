import { API_URL } from "@/lib/config";

export const API_BASE_URL = API_URL;

interface FetchOptions extends RequestInit {
    requireAuth?: boolean;
    token?: string | null;
}

export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
    unauthorizedHandler = handler;
}

export async function apiFetch<T>(
    path: string,
    options: FetchOptions = {}
): Promise<T> {
    const { requireAuth = true, token, headers, ...rest } = options;

    const authToken = token ?? (typeof window !== "undefined" ? localStorage.getItem("token") : null);

    if (requireAuth && !authToken) {
        throw new ApiError("Non autenticato", 401);
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...rest,
        headers: {
            "Content-Type": "application/json",
            ...(requireAuth && authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            ...headers,
        },
    });

    if (response.status === 401) {
        unauthorizedHandler?.();
        throw new ApiError("Sessione scaduta. Effettua di nuovo il login.", 401);
    }

    if (!response.ok) {
        let message = `Errore ${response.status}`;
        try {
            const data = await response.json();
            if (data?.detail) {
                message = data.detail;
            }
        } catch {
            // no-op
        }

        throw new ApiError(message, response.status);
    }

    if (response.status === 204) {
        return null as T;
    }

    return response.json();
}


export const api = {
    get: <T>(path: string, options?: FetchOptions) => apiFetch<T>(path, { ...options, method: "GET" }),
    post: <T>(path: string, data?: unknown, options?: FetchOptions) =>
        apiFetch<T>(path, { ...options, method: "POST", body: data ? JSON.stringify(data) : undefined }),
    put: <T>(path: string, data?: unknown, options?: FetchOptions) =>
        apiFetch<T>(path, { ...options, method: "PUT", body: data ? JSON.stringify(data) : undefined }),
    delete: <T>(path: string, options?: FetchOptions) => apiFetch<T>(path, { ...options, method: "DELETE" }),
};
