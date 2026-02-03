# 📋 DOCUMENTO SPECIFICA PROGETTO
## Piattaforma Gestione Ticket e Interventi Tecnici

---

## ✅ RIEPILOGO ACQUISITO - Versione Corretta

### Struttura Gerarchica CORRETTA
```
RICHIESTA DI INTERVENTO (User Story / Contenitore)
├── Descrizione generale del problema/necessità
├── Cliente associato
├── CHAT (comunicazione con cliente/team)
└── Contiene 1+ ATTIVITÀ
    ├── Attività FATTURABILI (determinate da tipo attività)
    └── Attività NON FATTURABILI (tempo interno, preparazione, ecc.)

CASO SPECIALE: Creazione ATTIVITÀ DIRETTA
→ Richiesta creata implicitamente con singola attività (caso semplificato)
```

### Logica Assegnazione (in ordine di priorità)
```
1. Referente tecnico personale (da anagrafica cliente)
2. Ambito (categoria) → notifica tecnici dell'ambito → auto-assegnazione o supervisore
3. Assegnazione manuale supervisore
```

### Ruoli e Permessi
- **Cliente**: Crea richieste, visualizza stato, comunica via chat, valida chiusure
- **Tecnico**: Lavora su attività, crea attività (fatturabili e non), usa app mobile con GPS/timer
- **Supervisore**: Vede dashboard aggregata dei suoi tecnici, assegna attività, gestisce riaperture, valida richieste
- **Amministratore**: Gestione completa sistema, configurazioni, validazione richieste

### Tipologie Richieste
- **Standard**: da cliente/tecnico/admin → sempre con cliente associato
- **Interne**: cliente speciale con flag "Gestione Interna" (la ditta stessa)
  - Le attività vengono tracciate ma NON generano fatturato esterno
- **Da monitoraggio**: webhook/email/sistemi automatici → necessitano verifica
- **Da centralino/email**: pre-richieste → necessitano verifica prima di diventare richieste effettive
- **Programmate da Schedulatore**: generate automaticamente da contratti/licenze/prodotti

### Stati Attività (operativi - per tecnici)
```
PROGRAMMATA (con data/ora appuntamento)
↓
IN LAVORAZIONE (tecnico ci sta lavorando)
↓
IN STANDBY (bloccata temporaneamente)
↓
COMPLETATA (tecnico ha finito)
```

### Stati Richiesta (amministrativi - per gestione)
```
DA VERIFICARE → richieste da sistemi automatici/non presidiate
↓ (validazione admin/supervisore)
DA GESTIRE → nessuna attività presente
↓
IN GESTIONE → almeno 1 attività presente (programmata o in lavorazione)
↓
RISOLTA → almeno 1 attività ha flag "Risolutiva" = TRUE
           + invio email cliente con:
             - Messaggio configurabile
             - Link per riaprire richiesta
             - Scadenza validazione automatica (es. 7 giorni)
↓
[Validazione automatica dopo X giorni OPPURE validazione manuale admin/supervisore]
↓
VALIDATA → pronta per fatturazione
           (se validazione manuale: salva nome utente che ha validato + timestamp)
↓
DA FATTURARE → in coda per emissione fattura
↓
FATTURATA → fattura emessa
↓
CHIUSA → processo completato, archiviata
```

**Stati paralleli/alternativi:**
- **RIAPERTA** (dal cliente via link email, con descrizione motivazione)
  → torna a IN GESTIONE, supervisore gestisce
- **NULLA** (scartata se era "da verificare")

### Stack Tecnologico
- **Frontend**: Next.js + React + Tailwind CSS
- **Backend**: FastAPI (Python) o Next.js API routes
- **Database**: PostgreSQL (consigliato per relazioni complesse)
- **Mobile**: Progressive Web App + App Android nativa (GPS, notifiche push, timer)
- **Schedulatore**: Cron job / Task scheduler per automazioni

---

## 📊 ANAGRAFICHE E ENTITÀ

### Anagrafica CLIENTE
**Dati base:**
- Ragione sociale / Nome
- Partita IVA / Codice fiscale
- Email principale
- Email secondarie (array)
- Telefoni (array)
- **Flag "Gestione Interna"** (boolean)
  - Se TRUE: cliente = la ditta stessa
  - Attività NON generano fatturato esterno
  - Usato per: lavori interni, manutenzioni, riordino magazzino, formazione, ecc.

**Tecnico di riferimento:**
- Campo opzionale
- Tecnico unico per tutto il cliente
- Se presente, viene usato come priorità 1 nell'assegnazione

**Sedi operative:**
- Un cliente può avere multiple sedi
- Ogni sede ha:
  - Indirizzo completo (per geolocalizzazione)
  - Referente cliente per quella sede (nome, tel, email)

**Contratti attivi:**
- Un cliente può avere N contratti attivi contemporaneamente
- Relazione: CLIENTE → N CONTRATTI_CLIENTI (istanze)

---

### AMBITI (Categorie di intervento)
**Caratteristiche:**
- Configurabili da Admin
- Esempi: Server, Centralino, Stampanti, Rete, Software, Hardware, ecc.
- Ogni ambito ha:
  - Lista di tecnici assegnati
  - Supervisore (opzionale)
  - Se supervisore presente → assegnato automaticamente alle richieste
  - Se supervisore assente → assegnazione manuale sulla richiesta

**Logica tecnici:**
- Un tecnico può appartenere a più ambiti contemporaneamente
- Quando arriva richiesta in un ambito → tutti i tecnici dell'ambito vengono notificati
- Possibilità di auto-assegnazione o intervento supervisore

---

### RICHIESTE "DA VERIFICARE"
**Origine:**
- Segreteria telefonica
- Sistemi di monitoraggio automatico (webhook, email da sistemi backup, alert spazio disco, ecc.)
- Email/centralino non presidiati
- Inserimento volontario (quando necessita ricontatto cliente per conferma)

**Comportamento:**
- Stato: "DA VERIFICARE"
- Visibili ad Admin e Supervisori
- Richieste inserite da operatore umano = automaticamente verificate (stato DA GESTIRE)

**Validazione:**
- Chi può validare: Admin e Supervisori
- Azione: cambio stato → "DA GESTIRE"

**Scarto:**
- Chi può scartare: Admin e Supervisori
- Azione: stato → "NULLA"
- Le richieste scartate vengono archiviate e restano consultabili (tracciabilità completa)

---

## 🎯 ATTIVITÀ - Struttura Dettagliata

### Campi Attività
**Campi obbligatori:**
- Descrizione
- Cliente (ereditato dalla richiesta)
- Tipo di attività (configurabile da menu admin)
- Stato (Programmata, In Lavorazione, In Standby, Completata)

**Campi opzionali:**
- Note interne
- Riferimento esterno (es. numero ticket fornitore)
- Priorità (Urgente, Alta, Normale, Bassa)
- Data/ora prevista intervento
- Allegati (foto, documenti, PDF)
- Flag "Risolutiva" (boolean - determina chiusura richiesta)

**Campi addebito:**
- Tipo addebito (enum: a_pagamento, contratto, monte_ore, incluso)
- Contratto_cliente_id (FK, se addebito a contratto)
- Voce_contratto_id (FK, se addebito a voce specifica)
- Ore_addebitate (per monte ore)

**Campi automatici:**
- Tecnico/i assegnato/i
- Supervisore (se presente nell'ambito o assegnato manualmente)
- Timestamp creazione
- Timestamp ultima modifica
- Sede (se richiesta associata a sede specifica)

### Tipologie di Attività (Configurabili)
**Esempi fatturabili:**
- Sopralluogo
- Riparazione
- Installazione
- Manutenzione programmata
- Assistenza telefonica (se a consumo)
- Configurazione

**Esempi non fatturabili:**
- Spostamento/viaggio
- Scelta componenti (ufficio)
- Analisi interna
- Redazione documentazione
- Preparazione preventivo
- Riunione interna

**Configurazione tipo attività:**
- Nome
- Flag "Fatturabile" (boolean)
- Categoria/Ambito associato (opzionale)
- Tempo stimato default (opzionale)

### Logica Addebito Attività
```
Quando attività viene completata, sistema propone:

1. Cliente ha contratti attivi?
   ├── NO → Tipo addebito = "A pagamento"
   └── SI → Verifica copertura
       ├── Contratto forfettario con voce che copre questa attività?
       │   └── SI → Proponi "Contratto #X - Voce Y"
       ├── Contratto monte ore attivo con ore residue?
       │   └── SI → Proponi "Monte ore #X (residue: Z ore)"
       └── Nessuna copertura → Proponi "A pagamento"

2. Tecnico può modificare manualmente:
   - Se attività esula dai termini contrattuali
   - Se richiede addebito diverso da quello proposto
   - Se vuole scalare da contratto diverso

3. Sistema registra:
   - Se addebito a contratto → crea record in UTILIZZI_CONTRATTO
   - Se monte ore → scala ore_residue, crea record storico
   - Se a pagamento → marca attività per fatturazione
```

### Fatturabilità - Logica Generale
```
ATTIVITÀ genera addebito SE:
├── Tipo attività ha flag "Fatturabile" = TRUE
└── AND Cliente NON ha flag "Gestione Interna" = TRUE
└── AND Tipo addebito != "Incluso" (copertura contrattuale)

ATTIVITÀ NON genera addebito SE:
├── Tipo attività ha flag "Fatturabile" = FALSE
└── OR Cliente ha flag "Gestione Interna" = TRUE
└── OR Tipo addebito = "Contratto" (già pagato nel canone)
└── OR Tipo addebito = "Monte ore" (scalato da credito prepagato)
```

### Modalità di Lavoro
**Assegnazione attività:**
- Singolo tecnico
- Multi-tecnico cooperativo (più tecnici sulla stessa attività)
- Delega (tecnico A passa ad B)

**Chi può creare attività:**
- Tutti i ruoli (Admin, Supervisore, Tecnico)
- Quando si crea richiesta → richiesta inizialmente vuota
- Attività vengono aggiunte dopo (da chiunque abbia accesso alla richiesta)

**Data/Ora Appuntamento:**
- Può essere inserita sulla richiesta per comodità
- Genera automaticamente la prima attività con quella data/ora
- Proprietà effettiva dell'attività, non della richiesta

---

## 📱 TRACKING TEMPO E GEOLOCALIZZAZIONE

### Widget Android - Timer Intervento
**Funzionalità:**
- Check-in manuale (tecnico avvia timer quando inizia lavoro)
- Check-out manuale (tecnico stoppa timer)
- Timer registra tempo per singola attività (non per richiesta intera)
- Salvataggio automatico coordinate GPS al check-in

**Dati salvati:**
- Timestamp inizio
- Timestamp fine
- Durata totale
- Coordinate GPS punto inizio
- Tecnico
- Attività associata

### Geolocalizzazione
**Funzionamento:**
- GPS attivo durante check-in iniziale (punto arrivo intervento)
- Non traccia percorso continuo (solo snapshot)
- Incrocio con indirizzo sede cliente (da anagrafica)
- Visibile ad Admin/Supervisori in tempo reale (dove sono i tecnici ora)

**Privacy/Permessi:**
- GPS attivo solo durante orario lavorativo
- Tecnico può disattivare se non in intervento
- Dati GPS visibili solo a Admin/Supervisori

---

## 💬 SISTEMA CHAT E NOTIFICHE

### Chat Richiesta
**Caratteristiche:**
- Una chat per richiesta (non per singola attività)
- Partecipanti:
  - Cliente che ha aperto la richiesta
  - Tecnico/i assegnati
  - Supervisore (se presente)
  - Admin (può entrare in qualsiasi chat)

**Notifiche:**
- Email: tutti i partecipanti con email configurata
- Push Android: solo utenti con app installata
- Badge/counter: messaggi non letti nella dashboard

### Email Automatiche
**Trigger principali:**
1. **Richiesta creata** → email a tecnici ambito (se assegnazione via ambito)
2. **Attività assegnata** → email a tecnico assegnato
3. **Richiesta risolta** → email a cliente con:
   - Messaggio configurabile
   - Link per riaprire richiesta (con form motivazione)
   - Scadenza validazione automatica (es. 7 giorni)
4. **Messaggio chat** → email a tutti i partecipanti
5. **Richiesta riaperta** → email a supervisore e tecnico assegnato
6. **Schedulatore trigger** → email preavviso manutenzione programmata
7. **Contratto in scadenza** → email ad admin/cliente (X giorni prima)
8. **Monte ore in esaurimento** → email ad admin (quando residue < soglia)

### Validazione Richiesta - Dettagli

**Validazione Automatica:**
- Dopo X giorni (configurabile) dalla ricezione email
- Richiesta passa automaticamente a VALIDATA
- Campo: `validata_automaticamente = TRUE`

**Validazione Manuale:**
- Admin o Supervisore può validare prima della scadenza
- Campi salvati:
  - `validata_da` (ID utente)
  - `validata_il` (timestamp)
  - `validata_automaticamente = FALSE`

**Riapertura Cliente:**
- Click su link email → form per inserire motivazione
- Campi salvati:
  - `riaperta_il` (timestamp)
  - `motivazione_riapertura` (testo cliente)
- Stato → RIAPERTA
- Notifica a supervisore/tecnico assegnato

---

## ⏰ MODULO SCHEDULATORE (Pianificazioni Automatiche)

### Funzionalità Trasversale
Lo schedulatore è un modulo generico che gestisce TUTTE le ricorrenze del sistema, indipendentemente dal tipo di entità.

**Use cases:**
- Contratti → Manutenzioni periodiche programmate
- Licenze Software → Scadenze rinnovo
- Prodotti → Manutenzioni obbligatorie
- Certificazioni → Scadenze verifiche
- Abbonamenti → Rinnovi automatici
- Custom → Qualsiasi altra pianificazione futura

---

### Entità: SCHEDULE (Pianificazione)

**Campi:**
- `id` (UUID)
- `tipo_entità` (enum: contratto, licenza, prodotto, certificazione, custom)
- `id_entità_riferimento` (FK all'entità specifica)
- `nome_descrittivo` (string) - es. "Manutenzione trimestrale Backup Azienda XYZ"
- `tipo_azione` (enum: crea_richiesta, invia_notifica, genera_alert, custom)
- `frequenza` (enum: giornaliera, settimanale, mensile, bimestrale, trimestrale, semestrale, annuale, custom)
- `intervallo_custom` (string, opzionale) - es. "ogni 45 giorni", "ogni 2° martedì del mese"
- `preavviso_giorni` (integer) - es. 7 (notifica 7 giorni prima)
- `ultimo_trigger` (timestamp) - ultima esecuzione
- `prossimo_trigger` (timestamp) - prossima esecuzione (calcolato automaticamente)
- `attivo` (boolean)
- `configurazione_azione` (JSON) - parametri specifici per l'azione
  - Es. per "crea_richiesta": `{ "ambito_id": 5, "priorita": "alta", "template_descrizione": "..." }`
- `created_at`, `updated_at`

---

### Relazioni
```
CONTRATTO → N SCHEDULE
LICENZA → N SCHEDULE
PRODOTTO → N SCHEDULE
CERTIFICAZIONE → N SCHEDULE
```

Esempio pratico:
```
Contratto "Manutenzione Server XYZ"
├── Schedule 1: "Backup trimestrale" → ogni 3 mesi → crea richiesta
├── Schedule 2: "Controllo hardware" → ogni 6 mesi → crea richiesta
└── Schedule 3: "Rinnovo contratto" → annuale → invia notifica admin
```

---

### Funzionamento Automatico

**Cron Job giornaliero (es. ogni notte alle 02:00):**

1. Query: `SELECT * FROM schedules WHERE prossimo_trigger <= OGGI AND attivo = TRUE`
2. Per ogni schedule trovato:
   - Esegue `tipo_azione`:
     - **crea_richiesta**: genera richiesta con stato PROGRAMMATA + prima attività
     - **invia_notifica**: email/push a destinatari configurati
     - **genera_alert**: crea alert in dashboard admin/supervisore
   - Aggiorna `ultimo_trigger` = OGGI
   - Ricalcola `prossimo_trigger` in base a `frequenza`
   - Salva modifiche

**Preavviso:**
- Cron job separato (es. ogni mattina alle 08:00):
  - Query: `SELECT * FROM schedules WHERE (prossimo_trigger - preavviso_giorni) = OGGI AND attivo = TRUE`
  - Invia notifica preavviso a supervisore/admin/tecnico assegnato

---

### Configurazione Azione - Esempi JSON

**Tipo azione: crea_richiesta**
```json
{
  "ambito_id": 5,
  "priorita": "alta",
  "template_descrizione": "Manutenzione programmata trimestrale server backup",
  "tecnico_preferito_id": 12,
  "note_interne": "Verificare spazio disco e log backup ultimi 3 mesi",
  "tipo_addebito_proposto": "contratto",
  "contratto_cliente_id": 456,
  "voce_contratto_id": 78
}
```

**Tipo azione: invia_notifica**
```json
{
  "destinatari": ["admin@azienda.com", "supervisore@azienda.com"],
  "oggetto": "Scadenza rinnovo licenza software",
  "template_corpo": "La licenza {nome_licenza} scade il {data_scadenza}"
}
```

---

### Gestione Manuale

**Admin/Supervisore può:**
- Creare nuovi schedule
- Attivare/disattivare schedule esistenti
- Modificare frequenza/preavviso
- Eliminare schedule (soft delete)
- Vedere storico trigger eseguiti
- Forzare trigger manuale (esegui ora)

**Dashboard Schedule:**
- Lista schedule attivi/inattivi
- Filtri per tipo_entità
- Prossimi trigger in arrivo (calendario)
- Storico esecuzioni

---

## 📄 MODULO CONTRATTI

### Architettura: Contratto come Contenitore (Template + Istanze)

Il sistema contratti usa un'architettura **template/istanza**:
- **CONTRATTI** = template riutilizzabili
- **CONTRATTI_CLIENTI** = istanze attive assegnate ai clienti
- **VOCI_CONTRATTO** = dettaglio servizi/prodotti del template
- **UTILIZZI_CONTRATTO** = storico scalature e addebiti

---

### Tipologie Contratti

**1. FORFETTARIO**
- Canone fisso periodico (mensile/trimestrale/annuale)
- Include servizi/prodotti specifici definiti nelle voci
- Attività coperte da contratto NON generano addebiti aggiuntivi
- Esempi:
  - Manutenzione backup trimestrale (4 interventi/anno)
  - Assistenza telefonica illimitata
  - Controllo server mensile

**2. MONTE ORE**
- Pacchetto di ore prepagato
- Attività scalano ore dal monte disponibile
- Non ha scadenza temporale (scade al termine ore)
- Sistema traccia: ore totali, ore utilizzate, ore residue
- Alert automatico quando ore residue < soglia configurabile
- Esempi:
  - 100 ore assistenza annuale
  - 50 ore sviluppo/configurazione
  - 200 ore manutenzione generale

---

### Entità: CONTRATTI (Templates)

**Campi:**
- `id` (UUID)
- `nome_contratto` (string) - es. "Contratto Manutenzione Server Standard"
- `tipo` (enum: forfettario, monte_ore)
- `descrizione` (text)
- `allegato_template` (file PDF) - contratto vuoto/template da compilare
- `configurabile` (boolean) - se TRUE può essere riutilizzato come template
- `attivo` (boolean) - se FALSE non può più essere assegnato a nuovi clienti
- `created_at`, `updated_at`

**Note:**
- Un contratto template può essere assegnato a N clienti
- Modifiche al template NON influenzano istanze già attive
- Se template viene modificato, admin può scegliere se applicare modifiche a istanze attive

---

### Entità: VOCI_CONTRATTO (Dettaglio servizi/prodotti)

**Campi:**
- `id` (UUID)
- `contratto_id` (FK a CONTRATTI)
- `tipo_voce` (enum: prodotto, servizio)
- `nome_voce` (string) - es. "Backup trimestrale", "Controllo hardware"
- `descrizione` (text)
- `ore_incluse` (integer, NULL = illimitate)
- `importo_voce` (decimal, opzionale) - se fatturato separatamente nel canone
- `ambito_id` (FK a AMBITI, opzionale) - per auto-match attività
- `tipo_attivita_id` (FK a TIPOLOGIE_ATTIVITA, opzionale) - per auto-match
- `schedulatore_id` (FK a SCHEDULES, opzionale) - se genera richieste automatiche
- `ordine` (integer) - ordinamento voci nel contratto
- `created_at`, `updated_at`

**Logica auto-match:**
```
Quando attività viene completata:
1. Sistema cerca voci contratto del cliente con:
   - ambito_id = ambito attività
   - tipo_attivita_id = tipo attività
2. Se trova match → propone addebito a quella voce
3. Tecnico può confermare o modificare manualmente
```

---

### Entità: CONTRATTI_CLIENTI (Istanze attive)

**Campi:**
- `id` (UUID)
- `cliente_id` (FK a CLIENTI)
- `contratto_template_id` (FK a CONTRATTI)
- `nome_contratto_custom` (string, opzionale) - override nome template
- `data_attivazione` (date)
- `data_scadenza` (date, NULL se monte ore)
- `tipo` (enum: forfettario, monte_ore) - ereditato da template
- `importo_canone` (decimal) - se forfettario
- `frequenza_canone` (enum: mensile, trimestrale, semestrale, annuale) - se forfettario
- `ore_totali` (integer) - se monte ore
- `ore_utilizzate` (integer, default 0) - se monte ore
- `ore_residue` (integer, calcolato) - se monte ore
- `soglia_alert_ore` (integer) - quando avvisare per ore in esaurimento
- `stato` (enum: attivo, scaduto, sospeso, disdetto, esaurito)
- `allegato_firmato` (file PDF) - contratto specifico firmato dal cliente
- `note` (text)
- `created_at`, `updated_at`

**Stati contratto:**
- **ATTIVO**: contratto valido e utilizzabile
- **SCADUTO**: data_scadenza passata (se forfettario)
- **SOSPESO**: temporaneamente non utilizzabile (es. morosità)
- **DISDETTO**: chiuso anticipatamente
- **ESAURITO**: ore_residue = 0 (se monte ore)

**Calcolo automatico ore_residue:**
```
ore_residue = ore_totali - ore_utilizzate
```

**Alert automatico:**
```
Se ore_residue <= soglia_alert_ore:
  → Email ad admin + cliente
  → Alert in dashboard
  → Proposta rinnovo/ricarica monte ore
```

---

### Entità: VOCI_CONTRATTO_CLIENTE (Personalizzazioni istanza)

**Campi:**
- `id` (UUID)
- `contratto_cliente_id` (FK a CONTRATTI_CLIENTI)
- `voce_contratto_id` (FK a VOCI_CONTRATTO, NULL se voce custom aggiunta)
- `nome_voce_custom` (string, opzionale) - override nome template
- `descrizione_custom` (text, opzionale)
- `ore_incluse_custom` (integer, opzionale) - override ore template
- `importo_custom` (decimal, opzionale) - override importo template
- `attiva` (boolean) - se FALSE, voce non utilizzabile
- `created_at`, `updated_at`

**Note:**
- Permette personalizzazione per singolo cliente
- Se campo custom è NULL → usa valore da template
- Può aggiungere voci non presenti nel template (voce_contratto_id = NULL)

---

### Entità: UTILIZZI_CONTRATTO (Storico scalature)

**Campi:**
- `id` (UUID)
- `contratto_cliente_id` (FK a CONTRATTI_CLIENTI)
- `attivita_id` (FK a ATTIVITA)
- `voce_contratto_cliente_id` (FK a VOCI_CONTRATTO_CLIENTE, opzionale)
- `ore_scalate` (decimal) - ore addebitate al contratto
- `data_utilizzo` (date)
- `note` (text)
- `created_by` (FK a UTENTI) - tecnico che ha registrato utilizzo
- `created_at`

**Funzionamento:**
1. Attività completata con tipo_addebito = "contratto"
2. Sistema crea record in UTILIZZI_CONTRATTO
3. Se monte ore → aggiorna `ore_utilizzate` in CONTRATTI_CLIENTI
4. Ricalcola `ore_residue`
5. Verifica soglia alert

---

### Flusso Completo - Esempio Pratico

#### Scenario 1: Contratto Forfettario
```
1. CREAZIONE TEMPLATE
Admin crea CONTRATTO:
├── Nome: "Manutenzione Backup Standard"
├── Tipo: Forfettario
├── Configurabile: TRUE
└── Voci:
    ├── Voce 1: "Controllo backup trimestrale"
    │   ├── Ore incluse: 4
    │   ├── Ambito: Server
    │   └── Schedule: ogni 3 mesi → crea richiesta
    └── Voce 2: "Assistenza telefonica backup"
        └── Ore incluse: NULL (illimitate)

2. ASSEGNAZIONE CLIENTE
Admin assegna a Cliente XYZ:
├── CONTRATTO_CLIENTE creato:
│   ├── Template: "Manutenzione Backup Standard"
│   ├── Data attivazione: 01/01/2026
│   ├── Data scadenza: 31/12/2026
│   ├── Canone: 1200€/anno
│   ├── Stato: ATTIVO
│   └── Voci ereditate (con possibili personalizzazioni)
└── Schedule attivati automaticamente

3. SCHEDULATORE GENERA RICHIESTA (01/04/2026)
Richiesta auto-creata:
├── Cliente: XYZ
├── Descrizione: "Manutenzione programmata backup trimestrale"
├── Stato: DA GESTIRE
└── Attività pre-generata:
    ├── Tipo: "Controllo backup"
    ├── Stato: PROGRAMMATA
    ├── Data: 05/04/2026
    ├── Tipo addebito proposto: "Contratto #123 - Voce Backup"
    └── Ambito: Server → notifica tecnici

4. TECNICO ESEGUE INTERVENTO
├── Accetta richiesta
├── Check-in: 05/04/2026 09:00
├── Lavora 3.5 ore
├── Check-out: 12:30
├── Completa attività
├── Conferma addebito: "Contratto #123 - Voce Backup"

5. SISTEMA REGISTRA
UTILIZZI_CONTRATTO:
├── Contratto: #123
├── Attività: #456
├── Voce: "Backup trimestrale"
├── Ore scalate: 3.5h
└── Note: "Controllo trimestrale completato, tutto ok"

6. CHIUSURA RICHIESTA
├── Attività marcata "Risolutiva"
├── Email a cliente → validazione/riapertura
├── Dopo 7 giorni → VALIDATA automaticamente
├── Passa a DA FATTURARE (canone già fatturato, nessun addebito extra)
```

---

#### Scenario 2: Contratto Monte Ore

1. CONTRATTO_CLIENTE:
├── Nome: "Pacchetto 100 ore assistenza"
├── Tipo: Monte ore
├── Ore totali: 100
├── Ore utilizzate: 0
├── Ore residue: 100
├── Soglia alert: 20
├── Data attivazione: 01/01/2026
├── Data scadenza: NULL (scade a ore finite)
└── Stato: ATTIVO
2. CLIENTE APRE RICHIESTA
Richiesta: "Problema stampante ufficio"
└── Attività:
├── Descrizione: "Riparazione stampante"
├── Tecnico: Mario Rossi
└── Tipo addebito proposto: "Monte ore #789"

3. TECNICO LAVORA SU ATTIVITÀ
├── Check-in: 10/01/2026 14:00
├── Risolve problema stampante
├── Check-out: 10/01/2026 16:30
├── Tempo effettivo: 2.5 ore
├── Completa attività
└── Conferma addebito: "Monte ore #789"

4. SISTEMA SCALA ORE
CONTRATTI_CLIENTI aggiornato:
├── Ore utilizzate: 0 → 2.5
├── Ore residue: 100 → 97.5

UTILIZZI_CONTRATTO creato:
├── Contratto: #789
├── Attività: #234
├── Ore scalate: 2.5
├── Data: 10/01/2026
└── Note: "Riparazione stampante ufficio"

5. SUCCESSIVE ATTIVITÀ
[...varie attività nel corso dell'anno...]

Ore utilizzate: 82
Ore residue: 18 ← SOTTO SOGLIA (20)

6. ALERT AUTOMATICO
Sistema invia email:
├── Destinatari: admin@azienda.com, cliente@xyz.com
├── Oggetto: "Monte ore in esaurimento - Cliente XYZ"
├── Corpo: "Attenzione: residuano solo 18 ore su 100.
│           Consigliamo di valutare il rinnovo."
└── Dashboard: badge rosso su contratto #789

7. ESAURIMENTO ORE
Ore residue: 0
Stato contratto: ATTIVO → ESAURITO

8. NUOVA RICHIESTA POST-ESAURIMENTO
Cliente apre richiesta:
└── Attività proposta con tipo addebito: "A PAGAMENTO"
    (monte ore esaurito, nessun altro contratto attivo)

9. RINNOVO/RICARICA
Admin può:
├── Creare nuovo contratto monte ore
└── Oppure ricaricare contratto esistente:
    ├── Aggiungi 50 ore → ore_totali: 100 → 150
    ├── Stato: ESAURITO → ATTIVO
    └── ore_residue ricalcolate: 50
```

---

#### Scenario 3: Contratto con Prodotto/Servizio Venduto
```
1. CLIENTE ACQUISTA PRODOTTO CON ASSISTENZA
Prodotto: "Sistema Backup Enterprise"
├── Prezzo vendita: 5000€
└── Include: assistenza 1° anno (50 ore)

2. ADMIN CREA CONTRATTO SPECIFICO
CONTRATTO_CLIENTE:
├── Nome: "Assistenza Backup Enterprise - Cliente XYZ"
├── Tipo: Monte ore
├── Ore totali: 50
├── Data attivazione: 15/01/2026
├── Data scadenza: 14/01/2027
├── Stato: ATTIVO
└── Voci:
    ├── Voce 1: "Assistenza tecnica backup"
    │   ├── Ambito: Server
    │   └── Tipo attività: Assistenza, Configurazione
    └── Voce 2: "Formazione utilizzo sistema"
        └── Ore incluse: 8 (delle 50 totali)

3. RICHIESTE RELATIVE AL PRODOTTO
Quando cliente apre richiesta relativa al backup:
└── Sistema propone automaticamente:
    ├── Tipo addebito: "Monte ore #456 - Assistenza Backup"
    └── Voce: "Assistenza tecnica backup"

4. SCADENZA CONTRATTO
Data: 14/01/2027
├── Ore residue: 12 (utilizzate 38/50)
├── Stato: ATTIVO → SCADUTO
└── Email automatica:
    ├── A: cliente@xyz.com
    ├── Oggetto: "Scadenza contratto assistenza Backup"
    └── Corpo: "Il contratto è scaduto. Residuavano 12 ore non utilizzate.
                Desiderate rinnovare l'assistenza?"

5. POST-SCADENZA
Nuova richiesta backup:
└── Tipo addebito proposto: "A PAGAMENTO"
    (contratto scaduto, ore residue non più utilizzabili)
```

---

### Gestione Dashboard Contratti

**Vista Admin:**
```
CONTRATTI ATTIVI
├── Filtri:
│   ├── Per cliente
│   ├── Per tipo (forfettario/monte ore)
│   ├── Per stato
│   └── In scadenza (prossimi 30/60/90 giorni)
├── Lista contratti:
│   ├── Cliente
│   ├── Nome contratto
│   ├── Tipo
│   ├── Scadenza / Ore residue
│   ├── Stato
│   └── Azioni (visualizza, modifica, sospendi, disdici)
└── Alert:
    ├── Monte ore < soglia (badge rosso)
    ├── In scadenza < 30 giorni (badge giallo)
    └── Scaduti non rinnovati (badge grigio)
```

**Vista Cliente (portale):**
```
I MIEI CONTRATTI
├── Contratti attivi:
│   ├── Nome contratto
│   ├── Scadenza / Ore residue
│   ├── Storico utilizzi (ultimi 3 mesi)
│   └── Pulsante: "Richiedi rinnovo"
└── Contratti scaduti:
    └── Archivio consultabile
```

**Statistiche Contratti:**
```
REPORT ADMIN
├── Contratti attivi per tipo
├── Fatturato mensile da canoni
├── Ore utilizzate vs disponibili (monte ore)
├── Tasso rinnovo contratti
├── Contratti in scadenza (forecast prossimi 90 giorni)
└── Export Excel/PDF
```

---

### Relazioni Contratto ↔ Schedulatore

**Creazione automatica schedule:**
```
Quando viene creata VOCE_CONTRATTO con ricorrenza:
1. Admin configura voce:
   ├── Nome: "Controllo backup trimestrale"
   ├── Frequenza: Trimestrale
   ├── Preavviso: 7 giorni
   └── Template descrizione richiesta

2. Sistema crea SCHEDULE automaticamente:
   ├── tipo_entità: "voce_contratto"
   ├── id_entità_riferimento: voce_id
   ├── frequenza: "trimestrale"
   ├── tipo_azione: "crea_richiesta"
   └── configurazione_azione: {
       "template_descrizione": "...",
       "contratto_cliente_id": X,
       "voce_contratto_id": Y,
       "tipo_addebito_proposto": "contratto"
     }

3. Quando contratto viene assegnato a cliente:
   └── Schedule vengono attivati per quel cliente specifico

4. Quando contratto scade/viene disdetto:
   └── Schedule vengono disattivati automaticamente
```

---

### Validazioni e Regole Business

**Creazione contratto cliente:**
```
Validazioni:
├── Cliente non può avere 2 contratti monte ore attivi contemporaneamente
│   (oppure sì, ma con ambiti diversi - da definire policy)
├── Data scadenza > data attivazione
├── Se monte ore: ore_totali > 0
├── Se forfettario: importo_canone > 0 e frequenza definita
└── Almeno 1 voce contratto deve essere presente
```

**Scalatura ore:**
```
Validazioni:
├── Ore da scalare <= ore_residue
├── Contratto deve essere ATTIVO
├── Se forfettario: verificare che voce copra tipo attività
└── Ore effettive lavorate <= ore incluse voce (warning se sforamento)

Se ore_residue diventa 0:
└── Stato: ATTIVO → ESAURITO
```

**Modifica contratto attivo:**
```
Admin può modificare:
├── Date (con warning se retroattive)
├── Note
├── Soglia alert
├── Stato (sospendi/riattiva)

Admin NON può modificare direttamente:
├── Ore totali (deve creare ricarica/estensione)
├── Tipo contratto (forfettario ↔ monte ore)
└── Template di riferimento (crea nuovo contratto)





## 📱 STRUTTURA MENU APPLICAZIONE

### Principi Organizzativi
- Menu diviso in **2 macro-aree**: Configurazione (statica) e Operativa (quotidiana)
- Per configurazine statica si intendono tutte le entità di inserimento trasversali a moduli, quindi alla base del funzionamento dell'applicazione
- Per operativa si intendono i menu in cui vengono registrate le operazioni che sono un misto di informazioni prese dalle entità statiche e combintate al fine di creare un informazione complessa (es. richiesta assistenza con i suoi aspetti di pagamento, note, etc.)
- Le anagrafiche principali sono: clienti, prodotti, servizi, contratti, tipi attività, ambiti attività, utenti
- C'è un sistema di acl per le pagine e i menu, quindi devono esser predisposti sistemi che permettono la visione e l'accesso ai menu e pagine in base ai ruoli, ma anche con possiblità di personalizzazione quindi alla fine possono esserci supervisori con permessi amministrativi e supervisori puri oppure amministratori limitati.
- Badge numerici per notifiche/contatori
- Ricerca globale cross-menu, rappresentata da una barra di ricerca presente in tutte le pagine in alto 


### LAYOUT STANDARD GENERALE
 - Ispirato a ide come visual studio code
 - La navigazione menu manuale è fatta a sinistra in un trafiletto che può rimanere espanso o compresso. quando è compresso, si visualizzano solo le icone dei menu.
 - Elemento di ricerca sempre presente in alto nelle pagine, questa è la searchbar globale e mostra sia i risultati della ricerca ai fini di navigazione nel menu, che risultati di azioni rapide.
 - Le azioni rapide sono voci del menu che permettono di eseguire azioni rapide, come creare nuove richieste, eseguire ricerca cliente, eseguire ricerca id, etc.
 - Il trafiletto a destra lo possiamo chiamare 'monitor screen' ed è predisposto per mostrare informazioni dinamiche e di orientamento al lavoro, quindi chat, appuntamenti, note eventi in corso e altro riguardanti l'untente specifico e altro. E' configurarbile a widget questa parte proprio per permettere agli admin, tecnici e supervisori di personalizzare le informazioni che vogliono vedere in questo monitor screen.
 - La parte centrale dello schermo rimane il desk principale di lavoro, quindi assumerà gli elementi grafici necessari all'ambito in cui ci si trova. 


### LAYOUT VISUALIZZAZIONE ANAGRAFICHE BASE
 - Le anagrafiche base sono: clienti, prodotti, servizi, contratti, tipi attività, ambiti attività, utenti
 - Vengono visualizzate con stile inline e le colonne di visualizzazione sono configurabili e mostrano i campi principali dell'entità. 
 - Ogni riga ha appesa una serie di pulsanti per l'esecuzione di azioni rapide, come modifica, eliminazione, visualizzazione dettagliata, etc. con delle icone standardizzate e piccole. 
 - nell'intestazione delle colonne è possible inserire dei partter di ricerca all'interno di text box, in modo da filtrare i risultati in base al campo specifico. 
 - per non appesantire la visualizzazione, la visualizzazione è divisa in pagine e la paginazione è gestita automaticamente questo quando i record sono più di 50 per pagina.
 
 
---

## 🔧 AREA CONFIGURAZIONE - Menu Sistema



**Accesso: Solo Admin (o ruoli con ACL specifici)**

### Principi di Design Menu Configurazione
- le voci 'gestione' indicano la configurazione di una determinata entità(es. gestione utenti, gestione clienti, etc.)
- Ogni pagina di gestione include: Lista + Aggiungi + Modifica + Elimina + ricerca contestuale all'entità 
- Layout standard: Tabella/Grid + Form laterale o modale
- Azioni massive disponibili dove applicabile
- Import/Export per dati bulk


## 👤 1. GESTIONE UTENTI E PERMESSI
## 📋 2. GESTIONE CLIENTI
## 📍 3. GESTIONE SEDI
## 📦 4. GESTIONE PRODOTTI
## 🛠️ 5. GESTIONE SERVIZI
## 🤝 6. GESTIONE CONTRATTI
## 📊 7. GESTIONE TIPI ATTIVITÀ
## 🎯 8. GESTIONE AMBITI ATTIVITÀ
## 🔄 9. GESTIONE RICORRENZE
## 💰 10. GESTIONE FATTURAZIONE
## 📈 11. GESTIONE REPORT
## ⚙️ 12. GESTIONE IMPOSTAZIONI

---