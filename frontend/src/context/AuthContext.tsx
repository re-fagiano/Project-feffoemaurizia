"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { setUnauthorizedHandler } from "@/lib/api";

interface AuthContextValue {
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (nextToken: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        setToken(null);
        router.push("/login");
    }, [router]);

    const login = useCallback((nextToken: string) => {
        localStorage.setItem("token", nextToken);
        setToken(nextToken);
    }, []);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        setToken(storedToken);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        setUnauthorizedHandler(logout);
        return () => setUnauthorizedHandler(null);
    }, [logout]);

    const value = useMemo(
        () => ({
            token,
            isLoading,
            isAuthenticated: Boolean(token),
            login,
            logout,
        }),
        [token, isLoading, login, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth deve essere usato dentro AuthProvider");
    }
    return context;
}
