"""
Pydantic Schemas per validazione input/output API
"""
from datetime import datetime, date
from typing import List, Optional, Any
from pydantic import BaseModel, EmailStr, Field
from enum import Enum

# Usiamo str per tutti gli ID per compatibilità con SQLite
# In produzione con PostgreSQL si può usare UUID


# =============================================
# ENUMS (allineati con i modelli)
# =============================================
class UserRole(str, Enum):
    admin = "admin"
    supervisore = "supervisore"
    tecnico = "tecnico"
    cliente = "cliente"


class StatoRichiesta(str, Enum):
    da_verificare = "da_verificare"
    nulla = "nulla"
    da_gestire = "da_gestire"
    in_gestione = "in_gestione"
    risolta = "risolta"
    riaperta = "riaperta"
    validata = "validata"
    da_fatturare = "da_fatturare"
    fatturata = "fatturata"
    chiusa = "chiusa"


class OrigineRichiesta(str, Enum):
    cliente = "cliente"
    tecnico = "tecnico"
    admin = "admin"
    monitoraggio = "monitoraggio"
    centralino = "centralino"
    email = "email"
    schedulatore = "schedulatore"


class StatoAttivita(str, Enum):
    programmata = "programmata"
    in_lavorazione = "in_lavorazione"
    in_standby = "in_standby"
    completata = "completata"


class TipoAddebito(str, Enum):
    a_pagamento = "a_pagamento"
    contratto = "contratto"
    monte_ore = "monte_ore"
    incluso = "incluso"


class TipoContratto(str, Enum):
    forfettario = "forfettario"
    monte_ore = "monte_ore"


class StatoContratto(str, Enum):
    attivo = "attivo"
    scaduto = "scaduto"
    sospeso = "sospeso"
    disdetto = "disdetto"
    esaurito = "esaurito"


class FrequenzaCanone(str, Enum):
    mensile = "mensile"
    trimestrale = "trimestrale"
    semestrale = "semestrale"
    annuale = "annuale"


# =============================================
# BASE SCHEMAS
# =============================================
class BaseSchema(BaseModel):
    """Schema base con configurazione comune"""
    class Config:
        from_attributes = True


# =============================================
# AUTH SCHEMAS
# =============================================
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    ruolo: Optional[UserRole] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# =============================================
# UTENTE SCHEMAS
# =============================================
class UtenteBase(BaseModel):
    email: EmailStr
    nome: str = Field(..., min_length=1, max_length=100)
    cognome: str = Field(..., min_length=1, max_length=100)
    ruolo: UserRole
    telefono: Optional[str] = None


class UtenteCreate(UtenteBase):
    password: str = Field(..., min_length=8)


class UtenteUpdate(BaseModel):
    nome: Optional[str] = None
    cognome: Optional[str] = None
    telefono: Optional[str] = None
    attivo: Optional[bool] = None


class UtenteResponse(UtenteBase, BaseSchema):
    id: str
    attivo: bool
    created_at: datetime


class UtenteInDB(UtenteResponse):
    password_hash: str


# =============================================
# CLIENTE SCHEMAS
# =============================================
class SedeClienteBase(BaseModel):
    nome_sede: str = Field(..., min_length=1, max_length=255)
    indirizzo: str = Field(..., min_length=1, max_length=500)
    citta: Optional[str] = None
    cap: Optional[str] = None
    provincia: Optional[str] = None
    latitudine: Optional[float] = None
    longitudine: Optional[float] = None
    referente_nome: Optional[str] = None
    referente_telefono: Optional[str] = None
    referente_email: Optional[EmailStr] = None
    sede_principale: bool = False


class SedeClienteCreate(SedeClienteBase):
    pass


class SedeClienteResponse(SedeClienteBase, BaseSchema):
    id: str
    cliente_id: str
    attiva: bool
    created_at: datetime


class ClienteBase(BaseModel):
    ragione_sociale: str = Field(..., min_length=1, max_length=255)
    partita_iva: Optional[str] = None
    codice_fiscale: Optional[str] = None
    email_principale: EmailStr
    email_secondarie: Optional[List[str]] = None
    telefoni: Optional[List[str]] = None
    gestione_interna: bool = False
    tecnico_riferimento_id: Optional[str] = None
    note: Optional[str] = None


class ClienteCreate(ClienteBase):
    sedi: Optional[List[SedeClienteCreate]] = None


class ClienteUpdate(BaseModel):
    ragione_sociale: Optional[str] = None
    partita_iva: Optional[str] = None
    codice_fiscale: Optional[str] = None
    email_principale: Optional[EmailStr] = None
    email_secondarie: Optional[List[str]] = None
    telefoni: Optional[List[str]] = None
    gestione_interna: Optional[bool] = None
    tecnico_riferimento_id: Optional[str] = None
    note: Optional[str] = None
    attivo: Optional[bool] = None


class ClienteResponse(ClienteBase, BaseSchema):
    id: str
    attivo: bool
    created_at: datetime
    updated_at: datetime
    sedi: List[SedeClienteResponse] = []


class ClienteListResponse(BaseSchema):
    id: str
    ragione_sociale: str
    email_principale: str
    gestione_interna: bool
    attivo: bool


# =============================================
# AMBITO SCHEMAS
# =============================================
class AmbitoBase(BaseModel):
    nome: str = Field(..., min_length=1, max_length=100)
    descrizione: Optional[str] = None
    supervisore_id: Optional[str] = None


class AmbitoCreate(AmbitoBase):
    tecnici_ids: Optional[List[str]] = None


class AmbitoUpdate(BaseModel):
    nome: Optional[str] = None
    descrizione: Optional[str] = None
    supervisore_id: Optional[str] = None
    attivo: Optional[bool] = None


class AmbitoResponse(AmbitoBase, BaseSchema):
    id: str
    attivo: bool
    created_at: datetime


# =============================================
# TIPOLOGIA ATTIVITÀ SCHEMAS
# =============================================
class TipologiaAttivitaBase(BaseModel):
    nome: str = Field(..., min_length=1, max_length=100)
    fatturabile: bool = True
    ambito_id: Optional[str] = None
    tempo_stimato_minuti: Optional[int] = None


class TipologiaAttivitaCreate(TipologiaAttivitaBase):
    pass


class TipologiaAttivitaResponse(TipologiaAttivitaBase, BaseSchema):
    id: str
    attivo: bool
    created_at: datetime


# =============================================
# RICHIESTA SCHEMAS
# =============================================
class RichiestaBase(BaseModel):
    cliente_id: str
    descrizione: str = Field(..., min_length=1)
    sede_id: Optional[str] = None
    ambito_id: Optional[str] = None
    priorita: str = "normale"
    data_appuntamento: Optional[datetime] = None


class RichiestaCreate(RichiestaBase):
    origine: OrigineRichiesta = OrigineRichiesta.cliente


class RichiestaUpdate(BaseModel):
    descrizione: Optional[str] = None
    sede_id: Optional[str] = None
    ambito_id: Optional[str] = None
    priorita: Optional[str] = None
    data_appuntamento: Optional[datetime] = None
    supervisore_id: Optional[str] = None


class RichiestaTransizioneStato(BaseModel):
    nuovo_stato: StatoRichiesta
    motivazione: Optional[str] = None  # Per riapertura o note


class RichiestaResponse(RichiestaBase, BaseSchema):
    id: str
    numero_richiesta: int
    stato: StatoRichiesta
    origine: OrigineRichiesta
    creato_da_id: Optional[str]
    supervisore_id: Optional[str]
    created_at: datetime
    updated_at: datetime


class RichiestaDetailResponse(RichiestaResponse):
    cliente: ClienteListResponse
    attivita: List["AttivitaResponse"] = []


# =============================================
# ATTIVITÀ SCHEMAS
# =============================================
class AttivitaBase(BaseModel):
    descrizione: str = Field(..., min_length=1)
    tipologia_id: Optional[str] = None
    priorita: str = "normale"
    data_prevista: Optional[datetime] = None
    note_interne: Optional[str] = None
    riferimento_esterno: Optional[str] = None


class AttivitaCreate(AttivitaBase):
    richiesta_id: str
    tecnici_ids: Optional[List[str]] = None


class AttivitaUpdate(BaseModel):
    descrizione: Optional[str] = None
    tipologia_id: Optional[str] = None
    priorita: Optional[str] = None
    data_prevista: Optional[datetime] = None
    note_interne: Optional[str] = None
    riferimento_esterno: Optional[str] = None
    risolutiva: Optional[bool] = None


class AttivitaTransizioneStato(BaseModel):
    nuovo_stato: StatoAttivita


class AttivitaAddebito(BaseModel):
    tipo_addebito: TipoAddebito
    contratto_cliente_id: Optional[str] = None
    voce_contratto_id: Optional[str] = None
    ore_addebitate: Optional[float] = None


class AttivitaResponse(AttivitaBase, BaseSchema):
    id: str
    richiesta_id: str
    stato: StatoAttivita
    risolutiva: bool
    tipo_addebito: Optional[TipoAddebito]
    ore_addebitate: Optional[float]
    created_at: datetime
    updated_at: datetime


# =============================================
# TIME ENTRY SCHEMAS
# =============================================
class TimeEntryCreate(BaseModel):
    attivita_id: str
    latitudine: Optional[float] = None
    longitudine: Optional[float] = None
    note: Optional[str] = None


class TimeEntryCheckout(BaseModel):
    note: Optional[str] = None


class TimeEntryResponse(BaseSchema):
    id: str
    attivita_id: str
    tecnico_id: str
    inizio: datetime
    fine: Optional[datetime]
    durata_minuti: Optional[int]
    latitudine_inizio: Optional[float]
    longitudine_inizio: Optional[float]
    note: Optional[str]
    created_at: datetime


# =============================================
# CONTRATTO SCHEMAS
# =============================================
class VoceContrattoBase(BaseModel):
    tipo_voce: str = "servizio"
    nome_voce: str = Field(..., min_length=1, max_length=255)
    descrizione: Optional[str] = None
    ore_incluse: Optional[int] = None
    importo_voce: Optional[float] = None
    ambito_id: Optional[str] = None
    tipologia_attivita_id: Optional[str] = None
    ordine: int = 0


class VoceContrattoCreate(VoceContrattoBase):
    pass


class VoceContrattoResponse(VoceContrattoBase, BaseSchema):
    id: str
    contratto_id: str
    created_at: datetime


class ContrattoBase(BaseModel):
    nome_contratto: str = Field(..., min_length=1, max_length=255)
    tipo: TipoContratto
    descrizione: Optional[str] = None


class ContrattoCreate(ContrattoBase):
    voci: Optional[List[VoceContrattoCreate]] = None


class ContrattoUpdate(BaseModel):
    nome_contratto: Optional[str] = None
    descrizione: Optional[str] = None
    attivo: Optional[bool] = None


class ContrattoResponse(ContrattoBase, BaseSchema):
    id: str
    configurabile: bool
    attivo: bool
    created_at: datetime
    voci: List[VoceContrattoResponse] = []


# =============================================
# CONTRATTO CLIENTE SCHEMAS
# =============================================
class ContrattoClienteBase(BaseModel):
    cliente_id: str
    contratto_template_id: str
    nome_contratto_custom: Optional[str] = None
    data_attivazione: date
    data_scadenza: Optional[date] = None
    tipo: TipoContratto
    # Forfettario
    importo_canone: Optional[float] = None
    frequenza_canone: Optional[FrequenzaCanone] = None
    # Monte ore
    ore_totali: Optional[int] = None
    soglia_alert_ore: int = 20
    note: Optional[str] = None


class ContrattoClienteCreate(ContrattoClienteBase):
    pass


class ContrattoClienteUpdate(BaseModel):
    nome_contratto_custom: Optional[str] = None
    data_scadenza: Optional[date] = None
    soglia_alert_ore: Optional[int] = None
    stato: Optional[StatoContratto] = None
    note: Optional[str] = None


class ContrattoClienteResponse(ContrattoClienteBase, BaseSchema):
    id: str
    ore_utilizzate: float = 0
    ore_residue: Optional[float] = None
    stato: StatoContratto
    created_at: datetime
    updated_at: datetime


# =============================================
# SCHEDULE SCHEMAS
# =============================================
class ScheduleBase(BaseModel):
    nome_descrittivo: str = Field(..., min_length=1, max_length=255)
    tipo_entita: str
    id_entita_riferimento: Optional[str] = None
    tipo_azione: str
    frequenza: str
    intervallo_custom: Optional[str] = None
    preavviso_giorni: int = 7
    configurazione_azione: Optional[dict] = None


class ScheduleCreate(ScheduleBase):
    prossimo_trigger: datetime


class ScheduleUpdate(BaseModel):
    nome_descrittivo: Optional[str] = None
    frequenza: Optional[str] = None
    preavviso_giorni: Optional[int] = None
    attivo: Optional[bool] = None
    configurazione_azione: Optional[dict] = None


class ScheduleResponse(ScheduleBase, BaseSchema):
    id: str
    ultimo_trigger: Optional[datetime]
    prossimo_trigger: Optional[datetime]
    attivo: bool
    created_at: datetime


# =============================================
# CHAT SCHEMAS
# =============================================
class MessaggioBase(BaseModel):
    messaggio: str = Field(..., min_length=1)
    allegati: Optional[List[str]] = None


class MessaggioCreate(MessaggioBase):
    richiesta_id: str


class MessaggioResponse(MessaggioBase, BaseSchema):
    id: str
    richiesta_id: str
    autore_id: str
    letto: bool
    created_at: datetime


# Forward references
RichiestaDetailResponse.model_rebuild()
