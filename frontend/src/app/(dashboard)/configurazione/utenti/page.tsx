"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/auth";
import PageHeader from "@/components/common/PageHeader";
import DataTable, { Column } from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";

interface User {
    id: string;
    email: string;
    nome: string;
    cognome: string;
    ruolo: string;
    telefono: string | null;
    attivo: boolean;
    is_super_admin: boolean;
    email_verified: boolean;
    created_at: string;
}

interface NewUser {
    email: string;
    password: string;
    nome: string;
    cognome: string;
    ruolo: string;
    telefono: string;
}

const ruoloLabels: Record<string, string> = {
    admin: "Amministratore",
    supervisore: "Supervisore",
    tecnico: "Tecnico",
};

const ruoloColors: Record<string, string> = {
    admin: "badge-danger",
    supervisore: "badge-warning",
    tecnico: "badge-info",
};

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchFilter, setSearchFilter] = useState("");
    const [ruoloFilter, setRuoloFilter] = useState("");
    const [attivoFilter, setAttivoFilter] = useState("");
    const [showNewUserModal, setShowNewUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [newUser, setNewUser] = useState<NewUser>({
        email: "",
        password: "",
        nome: "",
        cognome: "",
        ruolo: "tecnico",
        telefono: "",
    });

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadUsers();
    }, [searchFilter, ruoloFilter, attivoFilter]);

    const loadUsers = async () => {
        try {
            const params = new URLSearchParams();
            if (searchFilter) params.append("search", searchFilter);
            if (ruoloFilter) params.append("ruolo", ruoloFilter);
            if (attivoFilter) params.append("attivo", attivoFilter);

            const data = await fetchWithAuth(`/api/users?${params.toString()}`);
            setUsers(data);
        } catch (error) {
            console.error("Errore caricamento utenti:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            await fetchWithAuth("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser),
            });
            setShowNewUserModal(false);
            setNewUser({
                email: "",
                password: "",
                nome: "",
                cognome: "",
                ruolo: "tecnico",
                telefono: "",
            });
            loadUsers();
        } catch (error) {
            console.error("Errore creazione utente:", error);
            alert("Errore durante la creazione dell'utente: " + (error instanceof Error ? error.message : "Errore sconosciuto"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser || submitting) return;
        setSubmitting(true);

        try {
            await fetchWithAuth(`/api/users/${editingUser.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: editingUser.email,
                    nome: editingUser.nome,
                    cognome: editingUser.cognome,
                    ruolo: editingUser.ruolo,
                    telefono: editingUser.telefono,
                }),
            });
            setEditingUser(null);
            loadUsers();
        } catch (error) {
            console.error("Errore aggiornamento utente:", error);
            alert("Errore durante l'aggiornamento");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async (userId: string) => {
        try {
            await fetchWithAuth(`/api/users/${userId}/toggle-active`, {
                method: "POST",
            });
            loadUsers();
        } catch (error) {
            console.error("Errore toggle attivo:", error);
            alert("Errore durante l'operazione");
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!confirm(`Sei sicuro di voler eliminare l'utente ${userName}?`)) return;

        try {
            await fetchWithAuth(`/api/users/${userId}`, {
                method: "DELETE",
            });
            loadUsers();
        } catch (error) {
            console.error("Errore eliminazione utente:", error);
            alert("Errore durante l'eliminazione");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const columns: Column<User>[] = [
        {
            header: "Nome",
            accessor: (user) => (
                <div>
                    <div className="font-medium">{user.nome} {user.cognome}</div>
                    <div className="text-xs text-gray-500">
                        Creato: {new Date(user.created_at).toLocaleDateString("it-IT")}
                    </div>
                </div>
            ),
        },
        {
            header: "Email",
            accessor: "email",
            className: "text-gray-300",
        },
        {
            header: "Telefono",
            accessor: (user) => <span className="text-gray-400">{user.telefono || "-"}</span>,
        },
        {
            header: "Ruolo",
            accessor: (user) => (
                <div className="flex items-center gap-2">
                    <span className={`badge ${ruoloColors[user.ruolo]}`}>
                        {ruoloLabels[user.ruolo]}
                    </span>
                    {user.is_super_admin && (
                        <span className="badge badge-sm bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                            ⭐ Super Admin
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: "Stato",
            accessor: (user) => <StatusBadge status={user.attivo} />,
            className: "text-center",
            headerClassName: "text-center",
        },
        {
            header: "Email Verificata",
            accessor: (user) => (
                user.email_verified ? (
                    <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 text-yellow-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                )
            ),
            className: "text-center",
            headerClassName: "text-center",
        },
        {
            header: "Azioni",
            accessor: (user) => (
                user.is_super_admin ? (
                    <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-gray-500 italic">Protetto</span>
                        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                ) : (
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setEditingUser(user)}
                            className="p-2 hover:bg-gray-700 rounded transition-colors"
                            title="Modifica"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => handleToggleActive(user.id)}
                            className="p-2 hover:bg-gray-700 rounded transition-colors"
                            title={user.attivo ? "Disattiva" : "Attiva"}
                        >
                            {user.attivo ? (
                                <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </button>
                        <button
                            onClick={() => handleDeleteUser(user.id, `${user.nome} ${user.cognome}`)}
                            className="p-2 hover:bg-red-900/20 rounded transition-colors"
                            title="Elimina"
                        >
                            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                )
            ),
            className: "text-right",
            headerClassName: "text-right",
        },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Gestione Utenti"
                description="Gestisci gli utenti del sistema"
            >
                <button
                    onClick={() => setShowNewUserModal(true)}
                    className="btn btn-primary"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuovo Utente
                </button>
            </PageHeader>

            <div className="p-8 animate-fade-in">
                {/* Filtri */}
                <div className="card mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Cerca
                            </label>
                            <input
                                type="text"
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                placeholder="Nome, cognome, email..."
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Ruolo
                            </label>
                            <select
                                value={ruoloFilter}
                                onChange={(e) => setRuoloFilter(e.target.value)}
                                className="input"
                            >
                                <option value="">Tutti</option>
                                <option value="admin">Amministratore</option>
                                <option value="supervisore">Supervisore</option>
                                <option value="tecnico">Tecnico</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Stato
                            </label>
                            <select
                                value={attivoFilter}
                                onChange={(e) => setAttivoFilter(e.target.value)}
                                className="input"
                            >
                                <option value="">Tutti</option>
                                <option value="true">Attivi</option>
                                <option value="false">Disattivati</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tabella Utenti */}
                <div className="card">
                    <DataTable
                        data={users}
                        columns={columns}
                        loading={loading}
                        emptyMessage="Nessun utente trovato"
                    />
                </div>
            </div>

            {/* Modal Nuovo Utente */}
            {showNewUserModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card max-w-2xl w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Nuovo Utente</h2>
                            <button
                                onClick={() => setShowNewUserModal(false)}
                                className="btn btn-ghost btn-sm"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Nome *
                                    </label>
                                    <input
                                        type="text"
                                        value={newUser.nome}
                                        onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Cognome *
                                    </label>
                                    <input
                                        type="text"
                                        value={newUser.cognome}
                                        onChange={(e) => setNewUser({ ...newUser, cognome: e.target.value })}
                                        className="input"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    className="input"
                                    minLength={8}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Ruolo *
                                    </label>
                                    <select
                                        value={newUser.ruolo}
                                        onChange={(e) => setNewUser({ ...newUser, ruolo: e.target.value })}
                                        className="input"
                                        required
                                    >
                                        <option value="tecnico">Tecnico</option>
                                        <option value="supervisore">Supervisore</option>
                                        <option value="admin">Amministratore</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Telefono
                                    </label>
                                    <input
                                        type="tel"
                                        value={newUser.telefono}
                                        onChange={(e) => setNewUser({ ...newUser, telefono: e.target.value })}
                                        className="input"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowNewUserModal(false)}
                                    className="btn btn-ghost flex-1"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary flex-1"
                                    disabled={submitting}
                                >
                                    {submitting ? "Creazione..." : "Crea Utente"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Modifica Utente */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card max-w-2xl w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Modifica Utente</h2>
                            <button
                                onClick={() => setEditingUser(null)}
                                className="btn btn-ghost btn-sm"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Nome *
                                    </label>
                                    <input
                                        type="text"
                                        value={editingUser.nome}
                                        onChange={(e) => setEditingUser({ ...editingUser, nome: e.target.value })}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Cognome *
                                    </label>
                                    <input
                                        type="text"
                                        value={editingUser.cognome}
                                        onChange={(e) => setEditingUser({ ...editingUser, cognome: e.target.value })}
                                        className="input"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={editingUser.email}
                                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Ruolo *
                                    </label>
                                    <select
                                        value={editingUser.ruolo}
                                        onChange={(e) => setEditingUser({ ...editingUser, ruolo: e.target.value })}
                                        className="input"
                                        required
                                    >
                                        <option value="tecnico">Tecnico</option>
                                        <option value="supervisore">Supervisore</option>
                                        <option value="admin">Amministratore</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Telefono
                                    </label>
                                    <input
                                        type="tel"
                                        value={editingUser.telefono || ""}
                                        onChange={(e) => setEditingUser({ ...editingUser, telefono: e.target.value })}
                                        className="input"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="btn btn-ghost flex-1"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary flex-1"
                                    disabled={submitting}
                                >
                                    {submitting ? "Salvataggio..." : "Salva Modifiche"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
