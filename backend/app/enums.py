from enum import Enum

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

class TipoEntitaSchedule(str, Enum):
    contratto = "contratto"
    licenza = "licenza"
    prodotto = "prodotto"
    certificazione = "certificazione"
    voce_contratto = "voce_contratto"
    custom = "custom"

class TipoAzioneSchedule(str, Enum):
    crea_richiesta = "crea_richiesta"
    invia_notifica = "invia_notifica"
    genera_alert = "genera_alert"
    custom = "custom"

class FrequenzaSchedule(str, Enum):
    giornaliera = "giornaliera"
    settimanale = "settimanale"
    mensile = "mensile"
    bimestrale = "bimestrale"
    trimestrale = "trimestrale"
    semestrale = "semestrale"
    annuale = "annuale"
    custom = "custom"
