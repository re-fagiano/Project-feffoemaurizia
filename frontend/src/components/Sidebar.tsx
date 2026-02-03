"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FileQuestion,
    Activity,
    Calendar,
    Receipt,
    BarChart,
    Users,
    Building2,
    FileText,
    Package,
    Wrench,
    Layers,
    Clock,
    Settings,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    LucideIcon
} from "lucide-react";

interface MenuItem {
    id: string;
    label: string;
    icon: LucideIcon;
    href: string;
    badge?: number;
    section: "config" | "operative";
    requiredRoles?: string[];
}

interface SidebarProps {
    user: {
        ruolo: string;
    } | null;
}

const menuItems: MenuItem[] = [
    // AREA OPERATIVA
    {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        section: "operative",
    },
    {
        id: "richieste",
        label: "Richieste",
        icon: FileQuestion,
        href: "/richieste",
        section: "operative",
    },
    {
        id: "attivita",
        label: "Attività",
        icon: Activity,
        href: "/attivita",
        section: "operative",
    },
    {
        id: "calendario",
        label: "Calendario",
        icon: Calendar,
        href: "/calendario",
        section: "operative",
    },
    {
        id: "brogliaccio",
        label: "Brogliaccio",
        icon: FileText,
        href: "/brogliaccio",
        section: "operative",
    },
    {
        id: "fatturazione",
        label: "Fatturazione",
        icon: Receipt,
        href: "/fatturazione",
        section: "operative",
        requiredRoles: ["admin", "supervisore"],
    },
    {
        id: "report",
        label: "Report",
        icon: BarChart,
        href: "/report",
        section: "operative",
        requiredRoles: ["admin", "supervisore"],
    },

    // AREA CONFIGURAZIONE
    {
        id: "config-utenti",
        label: "Utenti",
        icon: Users,
        href: "/configurazione/utenti",
        section: "config",
        requiredRoles: ["admin"],
    },
    {
        id: "config-clienti",
        label: "Clienti",
        icon: Building2,
        href: "/clienti",
        section: "config",
        requiredRoles: ["admin", "supervisore"],
    },
    {
        id: "config-contratti",
        label: "Contratti",
        icon: FileText,
        href: "/contratti",
        section: "config",
        requiredRoles: ["admin", "supervisore"],
    },
    {
        id: "config-ambiti",
        label: "Ambiti & Tipi",
        icon: Layers,
        href: "/configurazione/ambiti",
        section: "config",
        requiredRoles: ["admin"],
    },
    {
        id: "config-prodotti",
        label: "Prodotti",
        icon: Package,
        href: "/configurazione/prodotti",
        section: "config",
        requiredRoles: ["admin"],
    },
    {
        id: "config-servizi",
        label: "Servizi",
        icon: Wrench,
        href: "/configurazione/servizi",
        section: "config",
        requiredRoles: ["admin"],
    },
    {
        id: "config-schedules",
        label: "Ricorrenze",
        icon: Clock,
        href: "/schedules",
        section: "config",
        requiredRoles: ["admin", "supervisore"],
    },
    {
        id: "config-impostazioni",
        label: "Impostazioni",
        icon: Settings,
        href: "/configurazione/impostazioni",
        section: "config",
        requiredRoles: ["admin"],
    },
];

export default function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("sidebarCollapsed") === "true";
        }
        return false;
    });

    const [expandedSections, setExpandedSections] = useState({
        operative: true,
        config: true,
    });

    useEffect(() => {
        localStorage.setItem("sidebarCollapsed", String(collapsed));
    }, [collapsed]);

    const toggleSection = (section: "operative" | "config") => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const canAccessMenuItem = (item: MenuItem): boolean => {
        if (!item.requiredRoles || !user) return true;
        return item.requiredRoles.includes(user.ruolo);
    };

    const operativeItems = menuItems.filter(
        (item) => item.section === "operative" && canAccessMenuItem(item)
    );
    const configItems = menuItems.filter(
        (item) => item.section === "config" && canAccessMenuItem(item)
    );

    return (
        <aside
            className={`bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 transition-all duration-300 ${collapsed ? "w-16" : "w-64"
                }`}
        >
            {/* Logo + Toggle */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                {!collapsed && (
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold gradient-text">Alpha</span>
                    </Link>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    title={collapsed ? "Espandi menu" : "Comprimi menu"}
                >
                    {collapsed ? (
                        <ChevronRight className="w-5 h-5" />
                    ) : (
                        <ChevronLeft className="w-5 h-5" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-6 overflow-y-auto">
                {/* Sezione Operativa */}
                <div>
                    {!collapsed ? (
                        <button
                            onClick={() => toggleSection("operative")}
                            className="w-full px-3 py-2 flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors"
                        >
                            <span>Operativa</span>
                            {expandedSections.operative ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </button>
                    ) : (
                        <div className="w-full h-1 bg-gray-800 mx-auto my-2 rounded" />
                    )}

                    {(!collapsed ? expandedSections.operative : true) && (
                        <div className="space-y-1">
                            {operativeItems.map((item) => {
                                const isActive =
                                    pathname === item.href ||
                                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        className={`sidebar-link ${isActive ? "active" : ""} ${collapsed ? "justify-center" : ""
                                            }`}
                                        title={collapsed ? item.label : undefined}
                                    >
                                        <item.icon className="w-5 h-5 shrink-0" />
                                        {!collapsed && <span>{item.label}</span>}
                                        {!collapsed && item.badge && (
                                            <span className="ml-auto badge badge-sm badge-danger">{item.badge}</span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Sezione Configurazione */}
                {configItems.length > 0 && (
                    <div>
                        {!collapsed ? (
                            <button
                                onClick={() => toggleSection("config")}
                                className="w-full px-3 py-2 flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors"
                            >
                                <span>Configurazione</span>
                                {expandedSections.config ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronRight className="w-4 h-4" />
                                )}
                            </button>
                        ) : (
                            <div className="border-t border-gray-800 my-2" />
                        )}

                        {(!collapsed ? expandedSections.config : true) && (
                            <div className="space-y-1">
                                {configItems.map((item) => {
                                    const isActive =
                                        pathname === item.href ||
                                        (item.href !== "/dashboard" && pathname.startsWith(item.href));
                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            className={`sidebar-link ${isActive ? "active" : ""} ${collapsed ? "justify-center" : ""
                                                }`}
                                            title={collapsed ? item.label : undefined}
                                        >
                                            <item.icon className="w-5 h-5 shrink-0" />
                                            {!collapsed && <span>{item.label}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </nav>
        </aside>
    );
}
