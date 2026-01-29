"""
Router CRUD Richieste con gestione stati
"""
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Richiesta, Attivita, Utente, StatoRichiesta, OrigineRichiesta, UserRole
from ..schemas import (
    RichiestaCreate, RichiestaUpdate, RichiestaResponse, 
    RichiestaDetailResponse, RichiestaTransizioneStato
)
from ..utils import get_current_user, require_supervisore

router = APIRouter()


# Transizioni di stato valide
TRANSIZIONI_VALIDE = {
    StatoRichiesta.da_verificare: [StatoRichiesta.da_gestire, StatoRichiesta.nulla],
    StatoRichiesta.da_gestire: [StatoRichiesta.in_gestione],
    StatoRichiesta.in_gestione: [StatoRichiesta.risolta],
    StatoRichiesta.risolta: [StatoRichiesta.validata, StatoRichiesta.riaperta],
    StatoRichiesta.riaperta: [StatoRichiesta.in_gestione],
    StatoRichiesta.validata: [StatoRichiesta.da_fatturare],
    StatoRichiesta.da_fatturare: [StatoRichiesta.fatturata],
    StatoRichiesta.fatturata: [StatoRichiesta.chiusa],
}


@router.get("/", response_model=List[RichiestaResponse])
async def list_richieste(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    stato: Optional[StatoRichiesta] = None,
    cliente_id: Optional[str] = None,
    priorita: Optional[str] = None,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lista richieste con filtri"""
    query = db.query(Richiesta)
    
    # Filtro per ruolo cliente: vede solo le sue
    if current_user.ruolo == UserRole.cliente:
        query = query.filter(Richiesta.creato_da_id == current_user.id)
    
    if stato:
        query = query.filter(Richiesta.stato == stato)
    if cliente_id:
        query = query.filter(Richiesta.cliente_id == cliente_id)
    if priorita:
        query = query.filter(Richiesta.priorita == priorita)
    
    return query.order_by(Richiesta.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{richiesta_id}", response_model=RichiestaDetailResponse)
async def get_richiesta(
    richiesta_id: str,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Dettaglio richiesta con attività"""
    richiesta = db.query(Richiesta).filter(Richiesta.id == richiesta_id).first()
    if not richiesta:
        raise HTTPException(status_code=404, detail="Richiesta non trovata")
    return richiesta


@router.post("/", response_model=RichiestaResponse, status_code=status.HTTP_201_CREATED)
async def create_richiesta(
    richiesta_data: RichiestaCreate,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crea nuova richiesta"""
    try:
        # Determina stato iniziale
        stato_iniziale = StatoRichiesta.da_gestire
        if richiesta_data.origine in [OrigineRichiesta.monitoraggio, OrigineRichiesta.centralino, OrigineRichiesta.email]:
            stato_iniziale = StatoRichiesta.da_verificare
        
        new_richiesta = Richiesta(
            cliente_id=richiesta_data.cliente_id,
            sede_id=richiesta_data.sede_id,
            ambito_id=richiesta_data.ambito_id,
            descrizione=richiesta_data.descrizione,
            priorita=richiesta_data.priorita,
            data_appuntamento=richiesta_data.data_appuntamento,
            origine=richiesta_data.origine,
            stato=stato_iniziale,
            creato_da_id=current_user.id,
            scadenza_validazione=datetime.now().date() + timedelta(days=7)
        )
        db.add(new_richiesta)
        db.commit()
        db.refresh(new_richiesta)
        return new_richiesta
    except Exception as e:
        import traceback
        print(f"ERROR create_richiesta: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{richiesta_id}", response_model=RichiestaResponse)
async def update_richiesta(
    richiesta_id: str,
    richiesta_data: RichiestaUpdate,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aggiorna richiesta"""
    richiesta = db.query(Richiesta).filter(Richiesta.id == richiesta_id).first()
    if not richiesta:
        raise HTTPException(status_code=404, detail="Richiesta non trovata")
    
    update_data = richiesta_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(richiesta, key, value)
    
    db.commit()
    db.refresh(richiesta)
    return richiesta


@router.post("/{richiesta_id}/transizione", response_model=RichiestaResponse)
async def transizione_stato(
    richiesta_id: str,
    transizione: RichiestaTransizioneStato,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cambia stato richiesta"""
    richiesta = db.query(Richiesta).filter(Richiesta.id == richiesta_id).first()
    if not richiesta:
        raise HTTPException(status_code=404, detail="Richiesta non trovata")
    
    # Verifica transizione valida
    stati_permessi = TRANSIZIONI_VALIDE.get(richiesta.stato, [])
    if transizione.nuovo_stato not in stati_permessi:
        raise HTTPException(
            status_code=400, 
            detail=f"Transizione non valida da {richiesta.stato.value} a {transizione.nuovo_stato.value}"
        )
    
    # Gestisci casi speciali
    if transizione.nuovo_stato == StatoRichiesta.riaperta:
        richiesta.riaperta_il = datetime.utcnow()
        richiesta.motivazione_riapertura = transizione.motivazione
    elif transizione.nuovo_stato == StatoRichiesta.validata:
        richiesta.validata_da_id = current_user.id
        richiesta.validata_il = datetime.utcnow()
        richiesta.validata_automaticamente = False
    
    richiesta.stato = transizione.nuovo_stato
    db.commit()
    db.refresh(richiesta)
    return richiesta


@router.delete("/{richiesta_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_richiesta(
    richiesta_id: str,
    current_user: Utente = Depends(require_supervisore()),
    db: Session = Depends(get_db)
):
    """Elimina richiesta (solo supervisore/admin)"""
    richiesta = db.query(Richiesta).filter(Richiesta.id == richiesta_id).first()
    if not richiesta:
        raise HTTPException(status_code=404, detail="Richiesta non trovata")
    
    db.delete(richiesta)
    db.commit()
