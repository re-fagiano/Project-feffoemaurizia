"""
Router CRUD Schedules (Pianificazioni automatiche)
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Schedule, Utente
from ..schemas import ScheduleCreate, ScheduleUpdate, ScheduleResponse
from ..utils import get_current_user, require_admin

router = APIRouter()


@router.get("/", response_model=List[ScheduleResponse])
async def list_schedules(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    attivo: Optional[bool] = None,
    tipo_entita: Optional[str] = None,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lista pianificazioni"""
    query = db.query(Schedule)
    
    if attivo is not None:
        query = query.filter(Schedule.attivo == attivo)
    if tipo_entita:
        query = query.filter(Schedule.tipo_entita == tipo_entita)
    
    return query.order_by(Schedule.prossimo_trigger).offset(skip).limit(limit).all()


@router.get("/prossimi")
async def get_prossimi_trigger(
    giorni: int = Query(7, ge=1, le=90),
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Schedules in scadenza nei prossimi X giorni"""
    from datetime import timedelta
    limite = datetime.utcnow() + timedelta(days=giorni)
    
    schedules = db.query(Schedule).filter(
        Schedule.attivo == True,
        Schedule.prossimo_trigger <= limite
    ).order_by(Schedule.prossimo_trigger).all()
    
    return schedules


@router.get("/{schedule_id}", response_model=ScheduleResponse)
async def get_schedule(
    schedule_id: UUID,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Dettaglio schedule"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule non trovato")
    return schedule


@router.post("/", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    schedule_data: ScheduleCreate,
    current_user: Utente = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Crea nuovo schedule (solo admin)"""
    new_schedule = Schedule(**schedule_data.model_dump())
    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)
    return new_schedule


@router.put("/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    schedule_id: UUID,
    schedule_data: ScheduleUpdate,
    current_user: Utente = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Aggiorna schedule (solo admin)"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule non trovato")
    
    update_data = schedule_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(schedule, key, value)
    
    db.commit()
    db.refresh(schedule)
    return schedule


@router.post("/{schedule_id}/toggle")
async def toggle_schedule(
    schedule_id: UUID,
    current_user: Utente = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Attiva/disattiva schedule"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule non trovato")
    
    schedule.attivo = not schedule.attivo
    db.commit()
    return {"attivo": schedule.attivo}


@router.post("/{schedule_id}/trigger")
async def trigger_schedule(
    schedule_id: UUID,
    current_user: Utente = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Forza esecuzione manuale schedule (solo admin)"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule non trovato")
    
    # TODO: Implementare logica trigger effettivo (crea_richiesta, invia_notifica, etc.)
    schedule.ultimo_trigger = datetime.utcnow()
    db.commit()
    
    return {"message": "Trigger eseguito", "ultimo_trigger": schedule.ultimo_trigger}


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(
    schedule_id: UUID,
    current_user: Utente = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Elimina schedule (solo admin)"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule non trovato")
    
    db.delete(schedule)
    db.commit()
