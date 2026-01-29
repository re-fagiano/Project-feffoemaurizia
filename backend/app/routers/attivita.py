"""
Router CRUD Attività con timer
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Attivita, TimeEntry, Richiesta, Utente, StatoAttivita, StatoRichiesta
from ..schemas import (
    AttivitaCreate, AttivitaUpdate, AttivitaResponse,
    AttivitaTransizioneStato, AttivitaAddebito,
    TimeEntryCreate, TimeEntryCheckout, TimeEntryResponse
)
from ..utils import get_current_user, require_tecnico

router = APIRouter()


# Transizioni stato attività
TRANSIZIONI_ATTIVITA = {
    StatoAttivita.programmata: [StatoAttivita.in_lavorazione],
    StatoAttivita.in_lavorazione: [StatoAttivita.in_standby, StatoAttivita.completata],
    StatoAttivita.in_standby: [StatoAttivita.in_lavorazione, StatoAttivita.completata],
}


@router.get("/", response_model=List[AttivitaResponse])
async def list_attivita(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    richiesta_id: Optional[UUID] = None,
    stato: Optional[StatoAttivita] = None,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lista attività con filtri"""
    query = db.query(Attivita)
    
    if richiesta_id:
        query = query.filter(Attivita.richiesta_id == richiesta_id)
    if stato:
        query = query.filter(Attivita.stato == stato)
    
    return query.order_by(Attivita.data_prevista.desc()).offset(skip).limit(limit).all()


@router.get("/{attivita_id}", response_model=AttivitaResponse)
async def get_attivita(
    attivita_id: UUID,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Dettaglio attività"""
    attivita = db.query(Attivita).filter(Attivita.id == attivita_id).first()
    if not attivita:
        raise HTTPException(status_code=404, detail="Attività non trovata")
    return attivita


@router.post("/", response_model=AttivitaResponse, status_code=status.HTTP_201_CREATED)
async def create_attivita(
    attivita_data: AttivitaCreate,
    current_user: Utente = Depends(require_tecnico()),
    db: Session = Depends(get_db)
):
    """Crea nuova attività"""
    # Verifica richiesta esiste
    richiesta = db.query(Richiesta).filter(Richiesta.id == attivita_data.richiesta_id).first()
    if not richiesta:
        raise HTTPException(status_code=404, detail="Richiesta non trovata")
    
    new_attivita = Attivita(
        richiesta_id=attivita_data.richiesta_id,
        tipologia_id=attivita_data.tipologia_id,
        descrizione=attivita_data.descrizione,
        priorita=attivita_data.priorita,
        data_prevista=attivita_data.data_prevista,
        note_interne=attivita_data.note_interne,
        riferimento_esterno=attivita_data.riferimento_esterno
    )
    db.add(new_attivita)
    
    # Se richiesta era DA_GESTIRE, passa a IN_GESTIONE
    if richiesta.stato == StatoRichiesta.da_gestire:
        richiesta.stato = StatoRichiesta.in_gestione
    
    db.commit()
    db.refresh(new_attivita)
    return new_attivita


@router.put("/{attivita_id}", response_model=AttivitaResponse)
async def update_attivita(
    attivita_id: UUID,
    attivita_data: AttivitaUpdate,
    current_user: Utente = Depends(require_tecnico()),
    db: Session = Depends(get_db)
):
    """Aggiorna attività"""
    attivita = db.query(Attivita).filter(Attivita.id == attivita_id).first()
    if not attivita:
        raise HTTPException(status_code=404, detail="Attività non trovata")
    
    update_data = attivita_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(attivita, key, value)
    
    db.commit()
    db.refresh(attivita)
    return attivita


@router.post("/{attivita_id}/transizione", response_model=AttivitaResponse)
async def transizione_stato_attivita(
    attivita_id: UUID,
    transizione: AttivitaTransizioneStato,
    current_user: Utente = Depends(require_tecnico()),
    db: Session = Depends(get_db)
):
    """Cambia stato attività"""
    attivita = db.query(Attivita).filter(Attivita.id == attivita_id).first()
    if not attivita:
        raise HTTPException(status_code=404, detail="Attività non trovata")
    
    # Verifica transizione valida
    stati_permessi = TRANSIZIONI_ATTIVITA.get(attivita.stato, [])
    if transizione.nuovo_stato not in stati_permessi:
        raise HTTPException(
            status_code=400,
            detail=f"Transizione non valida da {attivita.stato.value} a {transizione.nuovo_stato.value}"
        )
    
    attivita.stato = transizione.nuovo_stato
    
    # Se completata e risolutiva, aggiorna richiesta
    if transizione.nuovo_stato == StatoAttivita.completata and attivita.risolutiva:
        richiesta = db.query(Richiesta).filter(Richiesta.id == attivita.richiesta_id).first()
        if richiesta and richiesta.stato == StatoRichiesta.in_gestione:
            richiesta.stato = StatoRichiesta.risolta
    
    db.commit()
    db.refresh(attivita)
    return attivita


@router.post("/{attivita_id}/addebito", response_model=AttivitaResponse)
async def set_addebito(
    attivita_id: UUID,
    addebito: AttivitaAddebito,
    current_user: Utente = Depends(require_tecnico()),
    db: Session = Depends(get_db)
):
    """Imposta tipo addebito attività"""
    attivita = db.query(Attivita).filter(Attivita.id == attivita_id).first()
    if not attivita:
        raise HTTPException(status_code=404, detail="Attività non trovata")
    
    attivita.tipo_addebito = addebito.tipo_addebito
    attivita.contratto_cliente_id = addebito.contratto_cliente_id
    attivita.voce_contratto_id = addebito.voce_contratto_id
    attivita.ore_addebitate = addebito.ore_addebitate
    
    db.commit()
    db.refresh(attivita)
    return attivita


# =============================================
# TIME ENTRIES (Timer)
# =============================================
@router.post("/{attivita_id}/checkin", response_model=TimeEntryResponse)
async def checkin(
    attivita_id: UUID,
    checkin_data: TimeEntryCreate,
    current_user: Utente = Depends(require_tecnico()),
    db: Session = Depends(get_db)
):
    """Check-in su attività (avvia timer)"""
    attivita = db.query(Attivita).filter(Attivita.id == attivita_id).first()
    if not attivita:
        raise HTTPException(status_code=404, detail="Attività non trovata")
    
    # Verifica non ci siano time entry aperti
    open_entry = db.query(TimeEntry).filter(
        TimeEntry.attivita_id == attivita_id,
        TimeEntry.tecnico_id == current_user.id,
        TimeEntry.fine.is_(None)
    ).first()
    if open_entry:
        raise HTTPException(status_code=400, detail="Timer già attivo per questa attività")
    
    new_entry = TimeEntry(
        attivita_id=attivita_id,
        tecnico_id=current_user.id,
        inizio=datetime.utcnow(),
        latitudine_inizio=checkin_data.latitudine,
        longitudine_inizio=checkin_data.longitudine,
        note=checkin_data.note
    )
    db.add(new_entry)
    
    # Passa attività a in_lavorazione se programmata
    if attivita.stato == StatoAttivita.programmata:
        attivita.stato = StatoAttivita.in_lavorazione
    
    db.commit()
    db.refresh(new_entry)
    return new_entry


@router.post("/{attivita_id}/checkout", response_model=TimeEntryResponse)
async def checkout(
    attivita_id: UUID,
    checkout_data: TimeEntryCheckout,
    current_user: Utente = Depends(require_tecnico()),
    db: Session = Depends(get_db)
):
    """Check-out da attività (stoppa timer)"""
    # Trova time entry aperto
    entry = db.query(TimeEntry).filter(
        TimeEntry.attivita_id == attivita_id,
        TimeEntry.tecnico_id == current_user.id,
        TimeEntry.fine.is_(None)
    ).first()
    if not entry:
        raise HTTPException(status_code=400, detail="Nessun timer attivo per questa attività")
    
    entry.fine = datetime.utcnow()
    entry.durata_minuti = int((entry.fine - entry.inizio).total_seconds() / 60)
    if checkout_data.note:
        entry.note = checkout_data.note
    
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/{attivita_id}/time-entries", response_model=List[TimeEntryResponse])
async def get_time_entries(
    attivita_id: UUID,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lista time entries per attività"""
    entries = db.query(TimeEntry).filter(TimeEntry.attivita_id == attivita_id).all()
    return entries
