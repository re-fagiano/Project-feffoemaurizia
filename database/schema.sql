-- =============================================
-- SCHEMA DATABASE: Piattaforma Gestione Ticket
-- Database: PostgreSQL
-- =============================================

-- Estensioni necessarie
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELLA: UTENTI
-- =============================================
CREATE TYPE user_role AS ENUM ('admin', 'supervisore', 'tecnico', 'cliente');

CREATE TABLE utenti (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    cognome VARCHAR(100) NOT NULL,
    ruolo user_role NOT NULL,
    telefono VARCHAR(50),
    attivo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELLA: CLIENTI
-- =============================================
CREATE TABLE clienti (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ragione_sociale VARCHAR(255) NOT NULL,
    partita_iva VARCHAR(20),
    codice_fiscale VARCHAR(20),
    email_principale VARCHAR(255) NOT NULL,
    email_secondarie TEXT[], -- Array di email
    telefoni TEXT[], -- Array di telefoni
    gestione_interna BOOLEAN DEFAULT FALSE, -- Flag per lavori interni
    tecnico_riferimento_id UUID REFERENCES utenti(id),
    note TEXT,
    attivo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELLA: SEDI CLIENTI
-- =============================================
CREATE TABLE sedi_clienti (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clienti(id) ON DELETE CASCADE,
    nome_sede VARCHAR(255) NOT NULL,
    indirizzo VARCHAR(500) NOT NULL,
    citta VARCHAR(100),
    cap VARCHAR(10),
    provincia VARCHAR(50),
    latitudine DECIMAL(10, 8),
    longitudine DECIMAL(11, 8),
    referente_nome VARCHAR(100),
    referente_telefono VARCHAR(50),
    referente_email VARCHAR(255),
    sede_principale BOOLEAN DEFAULT FALSE,
    attiva BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELLA: AMBITI (Categorie intervento)
-- =============================================
CREATE TABLE ambiti (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descrizione TEXT,
    supervisore_id UUID REFERENCES utenti(id),
    attivo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella associativa: Tecnici per Ambito
CREATE TABLE tecnici_ambito (
    ambito_id UUID REFERENCES ambiti(id) ON DELETE CASCADE,
    tecnico_id UUID REFERENCES utenti(id) ON DELETE CASCADE,
    PRIMARY KEY (ambito_id, tecnico_id)
);

-- =============================================
-- TABELLA: TIPOLOGIE ATTIVITÀ
-- =============================================
CREATE TABLE tipologie_attivita (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    fatturabile BOOLEAN DEFAULT TRUE,
    ambito_id UUID REFERENCES ambiti(id),
    tempo_stimato_minuti INTEGER,
    attivo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELLA: RICHIESTE
-- =============================================
CREATE TYPE stato_richiesta AS ENUM (
    'da_verificare',
    'nulla',
    'da_gestire',
    'in_gestione',
    'risolta',
    'riaperta',
    'validata',
    'da_fatturare',
    'fatturata',
    'chiusa'
);

CREATE TYPE origine_richiesta AS ENUM (
    'cliente',
    'tecnico',
    'admin',
    'monitoraggio',
    'centralino',
    'email',
    'schedulatore'
);

CREATE TABLE richieste (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_richiesta SERIAL UNIQUE, -- Numero progressivo leggibile
    cliente_id UUID REFERENCES clienti(id) NOT NULL,
    sede_id UUID REFERENCES sedi_clienti(id),
    ambito_id UUID REFERENCES ambiti(id),
    descrizione TEXT NOT NULL,
    stato stato_richiesta DEFAULT 'da_gestire',
    origine origine_richiesta DEFAULT 'cliente',
    priorita VARCHAR(20) DEFAULT 'normale', -- urgente, alta, normale, bassa
    data_appuntamento TIMESTAMP,
    creato_da_id UUID REFERENCES utenti(id),
    supervisore_id UUID REFERENCES utenti(id),
    -- Campi validazione
    validata_automaticamente BOOLEAN,
    validata_da_id UUID REFERENCES utenti(id),
    validata_il TIMESTAMP,
    scadenza_validazione DATE,
    -- Campi riapertura
    riaperta_il TIMESTAMP,
    motivazione_riapertura TEXT,
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELLA: ATTIVITÀ
-- =============================================
CREATE TYPE stato_attivita AS ENUM (
    'programmata',
    'in_lavorazione',
    'in_standby',
    'completata'
);

CREATE TYPE tipo_addebito AS ENUM (
    'a_pagamento',
    'contratto',
    'monte_ore',
    'incluso'
);

CREATE TABLE attivita (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    richiesta_id UUID REFERENCES richieste(id) ON DELETE CASCADE,
    tipologia_id UUID REFERENCES tipologie_attivita(id),
    descrizione TEXT NOT NULL,
    stato stato_attivita DEFAULT 'programmata',
    priorita VARCHAR(20) DEFAULT 'normale',
    data_prevista TIMESTAMP,
    note_interne TEXT,
    riferimento_esterno VARCHAR(255), -- Es. numero ticket fornitore
    risolutiva BOOLEAN DEFAULT FALSE, -- Determina chiusura richiesta
    -- Campi addebito
    tipo_addebito tipo_addebito,
    contratto_cliente_id UUID, -- FK definita dopo
    voce_contratto_id UUID, -- FK definita dopo
    ore_addebitate DECIMAL(5, 2),
    -- Allegati (paths relativi o URLs)
    allegati TEXT[],
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella associativa: Tecnici assegnati ad Attività
CREATE TABLE tecnici_attivita (
    attivita_id UUID REFERENCES attivita(id) ON DELETE CASCADE,
    tecnico_id UUID REFERENCES utenti(id) ON DELETE CASCADE,
    PRIMARY KEY (attivita_id, tecnico_id)
);

-- =============================================
-- TABELLA: TIME ENTRIES (Check-in/Check-out)
-- =============================================
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attivita_id UUID REFERENCES attivita(id) ON DELETE CASCADE,
    tecnico_id UUID REFERENCES utenti(id),
    inizio TIMESTAMP NOT NULL,
    fine TIMESTAMP,
    durata_minuti INTEGER, -- Calcolato automaticamente
    latitudine_inizio DECIMAL(10, 8),
    longitudine_inizio DECIMAL(11, 8),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELLA: CONTRATTI (Template)
-- =============================================
CREATE TYPE tipo_contratto AS ENUM ('forfettario', 'monte_ore');

CREATE TABLE contratti (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_contratto VARCHAR(255) NOT NULL,
    tipo tipo_contratto NOT NULL,
    descrizione TEXT,
    allegato_template VARCHAR(500), -- Path al PDF template
    configurabile BOOLEAN DEFAULT TRUE,
    attivo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELLA: VOCI CONTRATTO
-- =============================================
CREATE TABLE voci_contratto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contratto_id UUID REFERENCES contratti(id) ON DELETE CASCADE,
    tipo_voce VARCHAR(50) DEFAULT 'servizio', -- prodotto, servizio
    nome_voce VARCHAR(255) NOT NULL,
    descrizione TEXT,
    ore_incluse INTEGER, -- NULL = illimitate
    importo_voce DECIMAL(10, 2),
    ambito_id UUID REFERENCES ambiti(id),
    tipologia_attivita_id UUID REFERENCES tipologie_attivita(id),
    ordine INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELLA: CONTRATTI CLIENTI (Istanze)
-- =============================================
CREATE TYPE stato_contratto AS ENUM (
    'attivo',
    'scaduto',
    'sospeso',
    'disdetto',
    'esaurito'
);

CREATE TYPE frequenza_canone AS ENUM (
    'mensile',
    'trimestrale',
    'semestrale',
    'annuale'
);

CREATE TABLE contratti_clienti (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clienti(id),
    contratto_template_id UUID REFERENCES contratti(id),
    nome_contratto_custom VARCHAR(255),
    data_attivazione DATE NOT NULL,
    data_scadenza DATE, -- NULL se monte ore senza scadenza
    tipo tipo_contratto NOT NULL,
    -- Campi forfettario
    importo_canone DECIMAL(10, 2),
    frequenza_canone frequenza_canone,
    -- Campi monte ore
    ore_totali INTEGER,
    ore_utilizzate DECIMAL(7, 2) DEFAULT 0,
    soglia_alert_ore INTEGER DEFAULT 20,
    -- Stato e allegato
    stato stato_contratto DEFAULT 'attivo',
    allegato_firmato VARCHAR(500), -- Path al PDF firmato
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ora possiamo aggiungere le FK mancanti su attivita
ALTER TABLE attivita 
    ADD CONSTRAINT fk_contratto_cliente 
    FOREIGN KEY (contratto_cliente_id) REFERENCES contratti_clienti(id);

-- =============================================
-- TABELLA: VOCI CONTRATTO CLIENTE (Personalizzazioni)
-- =============================================
CREATE TABLE voci_contratto_cliente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contratto_cliente_id UUID REFERENCES contratti_clienti(id) ON DELETE CASCADE,
    voce_contratto_id UUID REFERENCES voci_contratto(id),
    nome_voce_custom VARCHAR(255),
    descrizione_custom TEXT,
    ore_incluse_custom INTEGER,
    importo_custom DECIMAL(10, 2),
    attiva BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FK mancante su attivita
ALTER TABLE attivita 
    ADD CONSTRAINT fk_voce_contratto 
    FOREIGN KEY (voce_contratto_id) REFERENCES voci_contratto_cliente(id);

-- =============================================
-- TABELLA: UTILIZZI CONTRATTO (Storico scalature)
-- =============================================
CREATE TABLE utilizzi_contratto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contratto_cliente_id UUID REFERENCES contratti_clienti(id),
    attivita_id UUID REFERENCES attivita(id),
    voce_contratto_cliente_id UUID REFERENCES voci_contratto_cliente(id),
    ore_scalate DECIMAL(5, 2) NOT NULL,
    data_utilizzo DATE NOT NULL,
    note TEXT,
    created_by_id UUID REFERENCES utenti(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELLA: SCHEDULES (Pianificazioni automatiche)
-- =============================================
CREATE TYPE tipo_entita_schedule AS ENUM (
    'contratto',
    'licenza',
    'prodotto',
    'certificazione',
    'voce_contratto',
    'custom'
);

CREATE TYPE tipo_azione_schedule AS ENUM (
    'crea_richiesta',
    'invia_notifica',
    'genera_alert',
    'custom'
);

CREATE TYPE frequenza_schedule AS ENUM (
    'giornaliera',
    'settimanale',
    'mensile',
    'bimestrale',
    'trimestrale',
    'semestrale',
    'annuale',
    'custom'
);

CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_entita tipo_entita_schedule NOT NULL,
    id_entita_riferimento UUID, -- FK generica all'entità
    nome_descrittivo VARCHAR(255) NOT NULL,
    tipo_azione tipo_azione_schedule NOT NULL,
    frequenza frequenza_schedule NOT NULL,
    intervallo_custom VARCHAR(100), -- Es. "ogni 45 giorni"
    preavviso_giorni INTEGER DEFAULT 7,
    ultimo_trigger TIMESTAMP,
    prossimo_trigger TIMESTAMP,
    attivo BOOLEAN DEFAULT TRUE,
    configurazione_azione JSONB, -- Parametri specifici azione
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABELLA: MESSAGGI CHAT
-- =============================================
CREATE TABLE messaggi_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    richiesta_id UUID REFERENCES richieste(id) ON DELETE CASCADE,
    autore_id UUID REFERENCES utenti(id),
    messaggio TEXT NOT NULL,
    letto BOOLEAN DEFAULT FALSE,
    allegati TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDICI PER PERFORMANCE
-- =============================================
CREATE INDEX idx_richieste_cliente ON richieste(cliente_id);
CREATE INDEX idx_richieste_stato ON richieste(stato);
CREATE INDEX idx_richieste_data ON richieste(created_at);
CREATE INDEX idx_attivita_richiesta ON attivita(richiesta_id);
CREATE INDEX idx_attivita_stato ON attivita(stato);
CREATE INDEX idx_contratti_clienti_cliente ON contratti_clienti(cliente_id);
CREATE INDEX idx_contratti_clienti_stato ON contratti_clienti(stato);
CREATE INDEX idx_time_entries_attivita ON time_entries(attivita_id);
CREATE INDEX idx_schedules_prossimo_trigger ON schedules(prossimo_trigger);
CREATE INDEX idx_messaggi_richiesta ON messaggi_chat(richiesta_id);

-- =============================================
-- TRIGGER: Updated_at automatico
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Applica trigger a tutte le tabelle con updated_at
CREATE TRIGGER update_utenti_updated_at BEFORE UPDATE ON utenti FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clienti_updated_at BEFORE UPDATE ON clienti FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sedi_updated_at BEFORE UPDATE ON sedi_clienti FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ambiti_updated_at BEFORE UPDATE ON ambiti FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_richieste_updated_at BEFORE UPDATE ON richieste FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attivita_updated_at BEFORE UPDATE ON attivita FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contratti_updated_at BEFORE UPDATE ON contratti FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contratti_clienti_updated_at BEFORE UPDATE ON contratti_clienti FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- TRIGGER: Calcolo ore_residue contratti
-- =============================================
CREATE OR REPLACE FUNCTION calcola_ore_residue()
RETURNS TRIGGER AS $$
BEGIN
    -- Aggiorna ore_utilizzate nel contratto cliente
    UPDATE contratti_clienti
    SET ore_utilizzate = (
        SELECT COALESCE(SUM(ore_scalate), 0)
        FROM utilizzi_contratto
        WHERE contratto_cliente_id = NEW.contratto_cliente_id
    )
    WHERE id = NEW.contratto_cliente_id;
    
    -- Verifica se esaurito
    UPDATE contratti_clienti
    SET stato = 'esaurito'
    WHERE id = NEW.contratto_cliente_id
    AND tipo = 'monte_ore'
    AND ore_totali IS NOT NULL
    AND ore_utilizzate >= ore_totali;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_calcola_ore_residue 
AFTER INSERT ON utilizzi_contratto 
FOR EACH ROW EXECUTE FUNCTION calcola_ore_residue();
