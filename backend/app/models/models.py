"""
SQLAlchemy Models per la Piattaforma Gestione Ticket
"""
import uuid
from datetime import datetime, date
from typing import List, Optional
from sqlalchemy import (
    Column, String, Boolean, Text, Integer, Numeric, 
    DateTime, Date, ForeignKey, Enum as SQLEnum, JSON
)
# Usiamo String per ID per compatibilità SQLite
# In produzione con PostgreSQL, usare UUID
from sqlalchemy.orm import relationship
import enum

from ..database import Base


# =============================================
# ENUMS
# =============================================
class UserRole(str, enum.Enum):
    admin = "admin"
    supervisore = "supervisore"
    tecnico = "tecnico"
    cliente = "cliente"


class StatoRichiesta(str, enum.Enum):
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


class OrigineRichiesta(str, enum.Enum):
    cliente = "cliente"
    tecnico = "tecnico"
    admin = "admin"
    monitoraggio = "monitoraggio"
    centralino = "centralino"
    email = "email"
    schedulatore = "schedulatore"


class StatoAttivita(str, enum.Enum):
    programmata = "programmata"
    in_lavorazione = "in_lavorazione"
    in_standby = "in_standby"
    completata = "completata"


class TipoAddebito(str, enum.Enum):
    a_pagamento = "a_pagamento"
    contratto = "contratto"
    monte_ore = "monte_ore"
    incluso = "incluso"


class TipoContratto(str, enum.Enum):
    forfettario = "forfettario"
    monte_ore = "monte_ore"


class StatoContratto(str, enum.Enum):
    attivo = "attivo"
    scaduto = "scaduto"
    sospeso = "sospeso"
    disdetto = "disdetto"
    esaurito = "esaurito"


class FrequenzaCanone(str, enum.Enum):
    mensile = "mensile"
    trimestrale = "trimestrale"
    semestrale = "semestrale"
    annuale = "annuale"


class TipoEntitaSchedule(str, enum.Enum):
    contratto = "contratto"
    licenza = "licenza"
    prodotto = "prodotto"
    certificazione = "certificazione"
    voce_contratto = "voce_contratto"
    custom = "custom"


class TipoAzioneSchedule(str, enum.Enum):
    crea_richiesta = "crea_richiesta"
    invia_notifica = "invia_notifica"
    genera_alert = "genera_alert"
    custom = "custom"


class FrequenzaSchedule(str, enum.Enum):
    giornaliera = "giornaliera"
    settimanale = "settimanale"
    mensile = "mensile"
    bimestrale = "bimestrale"
    trimestrale = "trimestrale"
    semestrale = "semestrale"
    annuale = "annuale"
    custom = "custom"


# =============================================
# MODEL: Utenti
# =============================================
class Utente(Base):
    __tablename__ = "utenti"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    nome = Column(String(100), nullable=False)
    cognome = Column(String(100), nullable=False)
    ruolo = Column(SQLEnum(UserRole), nullable=False)
    telefono = Column(String(50))
    attivo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    clienti_riferimento = relationship("Cliente", back_populates="tecnico_riferimento")
    ambiti_supervisionati = relationship("Ambito", back_populates="supervisore")


# =============================================
# MODEL: Clienti
# =============================================
class Cliente(Base):
    __tablename__ = "clienti"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ragione_sociale = Column(String(255), nullable=False)
    partita_iva = Column(String(20))
    codice_fiscale = Column(String(20))
    email_principale = Column(String(255), nullable=False)
    email_secondarie = Column(JSON)  # Lista di email come JSON
    telefoni = Column(JSON)  # Lista di telefoni come JSON
    gestione_interna = Column(Boolean, default=False)
    tecnico_riferimento_id = Column(String(36), ForeignKey("utenti.id"))
    note = Column(Text)
    attivo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tecnico_riferimento = relationship("Utente", back_populates="clienti_riferimento")
    sedi = relationship("SedeCliente", back_populates="cliente", cascade="all, delete-orphan")
    richieste = relationship("Richiesta", back_populates="cliente")
    contratti = relationship("ContrattoCliente", back_populates="cliente")


# =============================================
# MODEL: Sedi Clienti
# =============================================
class SedeCliente(Base):
    __tablename__ = "sedi_clienti"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cliente_id = Column(String(36), ForeignKey("clienti.id", ondelete="CASCADE"))
    nome_sede = Column(String(255), nullable=False)
    indirizzo = Column(String(500), nullable=False)
    citta = Column(String(100))
    cap = Column(String(10))
    provincia = Column(String(50))
    latitudine = Column(Numeric(10, 8))
    longitudine = Column(Numeric(11, 8))
    referente_nome = Column(String(100))
    referente_telefono = Column(String(50))
    referente_email = Column(String(255))
    sede_principale = Column(Boolean, default=False)
    attiva = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    cliente = relationship("Cliente", back_populates="sedi")


# =============================================
# MODEL: Ambiti
# =============================================
class Ambito(Base):
    __tablename__ = "ambiti"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome = Column(String(100), nullable=False, unique=True)
    descrizione = Column(Text)
    supervisore_id = Column(String(36), ForeignKey("utenti.id"))
    attivo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    supervisore = relationship("Utente", back_populates="ambiti_supervisionati")
    tipologie_attivita = relationship("TipologiaAttivita", back_populates="ambito")


# =============================================
# MODEL: Tipologie Attività
# =============================================
class TipologiaAttivita(Base):
    __tablename__ = "tipologie_attivita"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome = Column(String(100), nullable=False, unique=True)
    fatturabile = Column(Boolean, default=True)
    ambito_id = Column(String(36), ForeignKey("ambiti.id"))
    tempo_stimato_minuti = Column(Integer)
    attivo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    ambito = relationship("Ambito", back_populates="tipologie_attivita")


# =============================================
# MODEL: Richieste
# =============================================
class Richiesta(Base):
    __tablename__ = "richieste"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    numero_richiesta = Column(Integer, unique=True, autoincrement=True)
    cliente_id = Column(String(36), ForeignKey("clienti.id"), nullable=False)
    sede_id = Column(String(36), ForeignKey("sedi_clienti.id"))
    ambito_id = Column(String(36), ForeignKey("ambiti.id"))
    descrizione = Column(Text, nullable=False)
    stato = Column(SQLEnum(StatoRichiesta), default=StatoRichiesta.da_gestire)
    origine = Column(SQLEnum(OrigineRichiesta), default=OrigineRichiesta.cliente)
    priorita = Column(String(20), default="normale")
    data_appuntamento = Column(DateTime)
    creato_da_id = Column(String(36), ForeignKey("utenti.id"))
    supervisore_id = Column(String(36), ForeignKey("utenti.id"))
    # Validazione
    validata_automaticamente = Column(Boolean)
    validata_da_id = Column(String(36), ForeignKey("utenti.id"))
    validata_il = Column(DateTime)
    scadenza_validazione = Column(Date)
    # Riapertura
    riaperta_il = Column(DateTime)
    motivazione_riapertura = Column(Text)
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    cliente = relationship("Cliente", back_populates="richieste")
    attivita = relationship("Attivita", back_populates="richiesta", cascade="all, delete-orphan")
    messaggi = relationship("MessaggioChat", back_populates="richiesta", cascade="all, delete-orphan")


# =============================================
# MODEL: Attività
# =============================================
class Attivita(Base):
    __tablename__ = "attivita"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    richiesta_id = Column(String(36), ForeignKey("richieste.id", ondelete="CASCADE"))
    tipologia_id = Column(String(36), ForeignKey("tipologie_attivita.id"))
    descrizione = Column(Text, nullable=False)
    stato = Column(SQLEnum(StatoAttivita), default=StatoAttivita.programmata)
    priorita = Column(String(20), default="normale")
    data_prevista = Column(DateTime)
    note_interne = Column(Text)
    riferimento_esterno = Column(String(255))
    risolutiva = Column(Boolean, default=False)
    # Addebito
    tipo_addebito = Column(SQLEnum(TipoAddebito))
    contratto_cliente_id = Column(String(36), ForeignKey("contratti_clienti.id"))
    voce_contratto_id = Column(String(36))
    ore_addebitate = Column(Numeric(5, 2))
    allegati = Column(JSON)  # Lista allegati come JSON
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    richiesta = relationship("Richiesta", back_populates="attivita")
    time_entries = relationship("TimeEntry", back_populates="attivita", cascade="all, delete-orphan")


# =============================================
# MODEL: Time Entries (Check-in/Check-out)
# =============================================
class TimeEntry(Base):
    __tablename__ = "time_entries"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    attivita_id = Column(String(36), ForeignKey("attivita.id", ondelete="CASCADE"))
    tecnico_id = Column(String(36), ForeignKey("utenti.id"))
    inizio = Column(DateTime, nullable=False)
    fine = Column(DateTime)
    durata_minuti = Column(Integer)
    latitudine_inizio = Column(Numeric(10, 8))
    longitudine_inizio = Column(Numeric(11, 8))
    note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    attivita = relationship("Attivita", back_populates="time_entries")


# =============================================
# MODEL: Contratti (Template)
# =============================================
class Contratto(Base):
    __tablename__ = "contratti"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome_contratto = Column(String(255), nullable=False)
    tipo = Column(SQLEnum(TipoContratto), nullable=False)
    descrizione = Column(Text)
    allegato_template = Column(String(500))
    configurabile = Column(Boolean, default=True)
    attivo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    voci = relationship("VoceContratto", back_populates="contratto", cascade="all, delete-orphan")
    istanze = relationship("ContrattoCliente", back_populates="contratto_template")


# =============================================
# MODEL: Voci Contratto
# =============================================
class VoceContratto(Base):
    __tablename__ = "voci_contratto"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    contratto_id = Column(String(36), ForeignKey("contratti.id", ondelete="CASCADE"))
    tipo_voce = Column(String(50), default="servizio")
    nome_voce = Column(String(255), nullable=False)
    descrizione = Column(Text)
    ore_incluse = Column(Integer)  # NULL = illimitate
    importo_voce = Column(Numeric(10, 2))
    ambito_id = Column(String(36), ForeignKey("ambiti.id"))
    tipologia_attivita_id = Column(String(36), ForeignKey("tipologie_attivita.id"))
    ordine = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    contratto = relationship("Contratto", back_populates="voci")


# =============================================
# MODEL: Contratti Clienti (Istanze)
# =============================================
class ContrattoCliente(Base):
    __tablename__ = "contratti_clienti"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cliente_id = Column(String(36), ForeignKey("clienti.id"))
    contratto_template_id = Column(String(36), ForeignKey("contratti.id"))
    nome_contratto_custom = Column(String(255))
    data_attivazione = Column(Date, nullable=False)
    data_scadenza = Column(Date)
    tipo = Column(SQLEnum(TipoContratto), nullable=False)
    # Forfettario
    importo_canone = Column(Numeric(10, 2))
    frequenza_canone = Column(SQLEnum(FrequenzaCanone))
    # Monte ore
    ore_totali = Column(Integer)
    ore_utilizzate = Column(Numeric(7, 2), default=0)
    soglia_alert_ore = Column(Integer, default=20)
    # Stato
    stato = Column(SQLEnum(StatoContratto), default=StatoContratto.attivo)
    allegato_firmato = Column(String(500))
    note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    cliente = relationship("Cliente", back_populates="contratti")
    contratto_template = relationship("Contratto", back_populates="istanze")
    utilizzi = relationship("UtilizzoContratto", back_populates="contratto_cliente")
    
    @property
    def ore_residue(self) -> Optional[float]:
        """Calcola ore residue per contratti monte ore"""
        if self.tipo == TipoContratto.monte_ore and self.ore_totali:
            return float(self.ore_totali) - float(self.ore_utilizzate or 0)
        return None


# =============================================
# MODEL: Utilizzi Contratto
# =============================================
class UtilizzoContratto(Base):
    __tablename__ = "utilizzi_contratto"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    contratto_cliente_id = Column(String(36), ForeignKey("contratti_clienti.id"))
    attivita_id = Column(String(36), ForeignKey("attivita.id"))
    voce_contratto_cliente_id = Column(String(36))
    ore_scalate = Column(Numeric(5, 2), nullable=False)
    data_utilizzo = Column(Date, nullable=False)
    note = Column(Text)
    created_by_id = Column(String(36), ForeignKey("utenti.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    contratto_cliente = relationship("ContrattoCliente", back_populates="utilizzi")


# =============================================
# MODEL: Schedules
# =============================================
class Schedule(Base):
    __tablename__ = "schedules"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tipo_entita = Column(SQLEnum(TipoEntitaSchedule), nullable=False)
    id_entita_riferimento = Column(String(36))
    nome_descrittivo = Column(String(255), nullable=False)
    tipo_azione = Column(SQLEnum(TipoAzioneSchedule), nullable=False)
    frequenza = Column(SQLEnum(FrequenzaSchedule), nullable=False)
    intervallo_custom = Column(String(100))
    preavviso_giorni = Column(Integer, default=7)
    ultimo_trigger = Column(DateTime)
    prossimo_trigger = Column(DateTime)
    attivo = Column(Boolean, default=True)
    configurazione_azione = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# =============================================
# MODEL: Messaggi Chat
# =============================================
class MessaggioChat(Base):
    __tablename__ = "messaggi_chat"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    richiesta_id = Column(String(36), ForeignKey("richieste.id", ondelete="CASCADE"))
    autore_id = Column(String(36), ForeignKey("utenti.id"))
    messaggio = Column(Text, nullable=False)
    letto = Column(Boolean, default=False)
    allegati = Column(JSON)  # Lista allegati come JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    richiesta = relationship("Richiesta", back_populates="messaggi")
