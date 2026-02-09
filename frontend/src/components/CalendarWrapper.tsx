"use client";

import { useMemo, useState, useEffect } from "react";
import { Calendar, momentLocalizer, Views, View } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import moment from "moment";
import "moment/locale/it";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Filter, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import ClientSearch from "./ClientSearch";

// Imposta lingua italiana
moment.locale("it");
const localizer = momentLocalizer(moment);

// Tipi per gli eventi
interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource?: any;
    status: string;
    type: "richiesta" | "attivita";
    color?: string;
    technicianName?: string;
    clientName?: string;
}

// Create DnD Calendar with proper typing
const DnDCalendar = withDragAndDrop<CalendarEvent, object>(Calendar);

interface CalendarWrapperProps {
    users?: any[]; // Per filtro tecnici
}

export default function CalendarWrapper({ users = [] }: CalendarWrapperProps) {
    const router = useRouter();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());
    const [selectedTechnician, setSelectedTechnician] = useState<string>("all");

    // Quick create modal
    const [showQuickCreate, setShowQuickCreate] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
    const [quickFormData, setQuickFormData] = useState({
        cliente_id: "",
        descrizione: "",
        priorita: "normale",
    });
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    // Custom colors (stored in localStorage)
    const [customColors, setCustomColors] = useState<Record<string, string>>({});

    // Colori per stato/tipo
    const getEventColor = (event: CalendarEvent) => {
        // Se c'è un colore specifico assegnato all'evento (es. colore tecnico)
        if (event.color) return event.color;

        // Fallback su colori status base
        switch (event.status) {
            case "da_gestire": return "#f59e0b"; // Amber (Richiesta nuova)
            case "in_carico": return "#3b82f6"; // Blue (In lavorazione)
            case "programmata": return "#8b5cf6"; // Violet (Attività programmata)
            case "completata": return "#10b981"; // Green (Fatto)
            case "annullata": return "#ef4444"; // Red (Annullata)
            default: return "#6b7280"; // Gray
        }
    };

    // Fetch dati
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                // 1. Fetch Richieste
                const reqResponse = await fetch("/api/richieste");
                const richieste = await reqResponse.json();

                // 2. Fetch Attività
                const actResponse = await fetch("/api/attivita");
                const attivita = await actResponse.json();

                // Mappa Richieste
                const reqEvents: CalendarEvent[] = richieste
                    .filter((r: any) => r.data_appuntamento)
                    .map((r: any) => ({
                        id: r.id,
                        title: `Richiesta #${r.numero_richiesta} - ${r.cliente?.ragione_sociale || "Cliente"}`,
                        start: new Date(r.data_appuntamento),
                        end: moment(r.data_appuntamento).add(1, "hour").toDate(), // Default 1h duration if not specified
                        resource: r,
                        status: r.stato,
                        type: "richiesta",
                        // Assegna colore casuale o deterministico per tecnico se presente
                        color: r.supervisore ? stringToColor(r.supervisore.nome + r.supervisore.cognome) : undefined,
                        technicianName: r.supervisore ? `${r.supervisore.nome} ${r.supervisore.cognome}` : undefined,
                        clientName: r.cliente?.ragione_sociale
                    }));

                // Mappa Attività
                const actEvents: CalendarEvent[] = attivita
                    .filter((a: any) => a.data_prevista)
                    .map((a: any) => ({
                        id: a.id,
                        title: `Attività: ${a.descrizione}`,
                        start: new Date(a.data_prevista),
                        end: moment(a.data_prevista).add(a.tipologia?.tempo_stimato_minuti || 60, "minutes").toDate(),
                        resource: a,
                        status: a.stato,
                        type: "attivita",
                        // Colore tecnico assegnato (se esiste time_entries o logica assegnazione)
                        color: "#8b5cf6", // Default violet per attività
                        technicianName: "Tecnico Assegnato" // TODO: recuperare tecnico reale
                    }));

                setEvents([...reqEvents, ...actEvents]);
            } catch (error) {
                console.error("Errore fetch eventi:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    // Helper per generare colore da stringa (nome tecnico)
    const stringToColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00ffffff).toString(16).toUpperCase();
        return "#" + "00000".substring(0, 6 - c.length) + c;
    }

    // Handler: Drag & Drop event
    const handleEventDrop = async ({ event, start, end }: any) => {
        // Optimistic update - update UI immediately
        const previousEvents = [...events];
        setEvents((prev) =>
            prev.map((ev) =>
                ev.id === event.id ? { ...ev, start, end } : ev
            )
        );

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Sessione scaduta. Effettua nuovamente il login.");
                setEvents(previousEvents); // Rollback
                return;
            }

            // Save to backend
            const res = await fetch(`${API_BASE_URL}/api/richieste/${event.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    data_appuntamento: start.toISOString(),
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || `Errore ${res.status}`);
            }

            // Success - data is already updated in UI
            console.log("Evento spostato con successo");
        } catch (error) {
            console.error("Errore aggiornamento evento:", error);
            alert(`Impossibile spostare l'evento: ${error instanceof Error ? error.message : 'Errore di connessione'}`);
            // Rollback to previous state
            setEvents(previousEvents);
        }
    };

    // Handler: Resize event
    const handleEventResize = async ({ event, start, end }: any) => {
        // Optimistic update
        const previousEvents = [...events];
        setEvents((prev) =>
            prev.map((ev) =>
                ev.id === event.id ? { ...ev, start, end } : ev
            )
        );

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Sessione scaduta. Effettua nuovamente il login.");
                setEvents(previousEvents); // Rollback
                return;
            }

            // Save to backend
            const res = await fetch(`${API_BASE_URL}/api/richieste/${event.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    data_appuntamento: start.toISOString(),
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || `Errore ${res.status}`);
            }

            console.log("Evento ridimensionato con successo");
        } catch (error) {
            console.error("Errore resize evento:", error);
            alert(`Impossibile modificare l'evento: ${error instanceof Error ? error.message : 'Errore di connessione'}`);
            // Rollback
            setEvents(previousEvents);
        }
    };

    // Handler: Click on empty slot to create
    const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
        setSelectedSlot({ start, end });
        setShowQuickCreate(true);
    };

    // Handler: Quick create request
    const handleQuickCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlot) return;

        // Validation
        if (!quickFormData.cliente_id) {
            setError("Seleziona un cliente");
            return;
        }
        if (!quickFormData.descrizione.trim()) {
            setError("Inserisci una descrizione");
            return;
        }

        setError("");
        setCreating(true);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Sessione scaduta. Effettua nuovamente il login.");
                setCreating(false);
                return;
            }

            const payload = {
                cliente_id: quickFormData.cliente_id,
                descrizione: quickFormData.descrizione.trim(),
                priorita: quickFormData.priorita,
                data_appuntamento: selectedSlot.start.toISOString(),
                origine: "admin",
            };

            console.log("Creating request with payload:", payload);

            const res = await fetch(`${API_BASE_URL}/api/richieste`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || `Errore ${res.status}: impossibile creare la richiesta`);
            }

            const newRequest = await res.json();
            console.log("Request created successfully:", newRequest);

            // Add to calendar
            const newEvent: CalendarEvent = {
                id: newRequest.id,
                title: `Richiesta #${newRequest.numero_richiesta} - ${newRequest.cliente?.ragione_sociale || "Cliente"}`,
                start: new Date(newRequest.data_appuntamento),
                end: moment(newRequest.data_appuntamento).add(1, "hour").toDate(),
                resource: newRequest,
                status: newRequest.stato,
                type: "richiesta",
                clientName: newRequest.cliente?.ragione_sociale,
            };

            setEvents((prev) => [...prev, newEvent]);

            // Reset and close
            setShowQuickCreate(false);
            setQuickFormData({
                cliente_id: "",
                descrizione: "",
                priorita: "normale",
            });
            setSelectedSlot(null);
        } catch (err) {
            console.error("Error creating request:", err);
            setError(err instanceof Error ? err.message : "Errore di connessione. Verifica che il backend sia avviato.");
        } finally {
            setCreating(false);
        }
    };

    // Filtra eventi
    const filteredEvents = useMemo(() => {
        if (selectedTechnician === "all") return events;
        // Implementare filtro reale quando disponibile ID tecnico negli eventi
        return events;
    }, [events, selectedTechnician]);

    // Custom Components
    const components = {
        toolbar: (toolbarProps: any) => {
            return (
                <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-white border-b border-gray-200 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => toolbarProps.onNavigate("PREV")}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <button
                                onClick={() => toolbarProps.onNavigate("TODAY")}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
                            >
                                Oggi
                            </button>
                            <button
                                onClick={() => toolbarProps.onNavigate("NEXT")}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 capitalize">
                            {moment(date).format("MMMM YYYY")}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => {
                                setView(Views.MONTH);
                                toolbarProps.onView(Views.MONTH);
                            }}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${view === Views.MONTH
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Mese
                        </button>
                        <button
                            onClick={() => {
                                setView(Views.WEEK);
                                toolbarProps.onView(Views.WEEK);
                            }}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${view === Views.WEEK
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Settimana
                        </button>
                        <button
                            onClick={() => {
                                setView(Views.DAY);
                                toolbarProps.onView(Views.DAY);
                            }}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${view === Views.DAY
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Giorno
                        </button>
                    </div>
                </div>
            );
        },
        event: ({ event }: any) => (
            <div
                className="w-full h-full text-xs p-1 overflow-hidden"
                title={event.title}
            >
                <div className="font-semibold truncate">{event.title}</div>
                {event.technicianName && (
                    <div className="flex items-center gap-1 text-[10px] opacity-90 truncate">
                        <User className="w-3 h-3" />
                        {event.technicianName}
                    </div>
                )}
            </div>
        )
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header Filtri */}
            {/* <div className="p-4 border-b border-gray-200 flex items-center justify-end">
                 <select 
                    className="select select-sm select-bordered"
                    value={selectedTechnician}
                    onChange={(e) => setSelectedTechnician(e.target.value)}
                 >
                     <option value="all">Tutti i tecnici</option>
                     {users.map(u => (
                         <option key={u.id} value={u.id}>{u.nome} {u.cognome}</option>
                     ))}
                 </select>
            </div> */}

            <div className="flex-1 min-h-[600px] p-2">
                <DnDCalendar
                    localizer={localizer}
                    events={filteredEvents}
                    startAccessor={(event: CalendarEvent) => event.start}
                    endAccessor={(event: CalendarEvent) => event.end}
                    style={{ height: "100%" }}
                    views={[Views.MONTH, Views.WEEK, Views.DAY]}
                    defaultView={Views.MONTH}
                    view={view}
                    onView={setView}
                    date={date}
                    onNavigate={setDate}
                    components={components}
                    // Drag & Drop
                    onEventDrop={handleEventDrop}
                    onEventResize={handleEventResize}
                    resizable
                    // Click to create
                    selectable
                    onSelectSlot={handleSelectSlot}
                    eventPropGetter={(event: CalendarEvent) => ({
                        style: {
                            backgroundColor: getEventColor(event),
                            borderRadius: "6px",
                            opacity: 0.9,
                            color: "white",
                            border: "0px",
                            display: "block"
                        }
                    })}
                    onSelectEvent={(event: CalendarEvent) => {
                        // Naviga al dettaglio
                        if (event.type === 'richiesta') {
                            router.push(`/richieste/${event.id}`);
                        } else {
                            // router.push(`/attivita/${event.id}`); 
                            // TODO: implementare pagina dettaglio attività se non esiste
                        }
                    }}
                    messages={{
                        next: "Succ",
                        previous: "Prec",
                        today: "Oggi",
                        month: "Mese",
                        week: "Settimana",
                        day: "Giorno",
                        noEventsInRange: "Nessun evento in questo periodo"
                    }}
                />
            </div>

            {/* Quick Create Modal */}
            {showQuickCreate && selectedSlot && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold">Nuova Richiesta</h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    {moment(selectedSlot.start).format("DD MMMM YYYY [alle] HH:mm")}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowQuickCreate(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleQuickCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Cliente *
                                </label>
                                <ClientSearch
                                    required
                                    onSelect={(cliente) => setQuickFormData({ ...quickFormData, cliente_id: cliente.id })}
                                    initialValue=""
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Descrizione *
                                </label>
                                <textarea
                                    value={quickFormData.descrizione}
                                    onChange={(e) => setQuickFormData({ ...quickFormData, descrizione: e.target.value })}
                                    className="input w-full min-h-[100px]"
                                    placeholder="Descrivi la richiesta..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Priorità
                                </label>
                                <select
                                    value={quickFormData.priorita}
                                    onChange={(e) => setQuickFormData({ ...quickFormData, priorita: e.target.value })}
                                    className="input w-full"
                                >
                                    <option value="bassa">Bassa</option>
                                    <option value="normale">Normale</option>
                                    <option value="alta">Alta</option>
                                    <option value="urgente">Urgente</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowQuickCreate(false)}
                                    className="btn btn-outline flex-1"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="btn btn-primary flex-1"
                                >
                                    {creating ? (
                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : (
                                        "Crea Richiesta"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
