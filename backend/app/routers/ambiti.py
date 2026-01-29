"""
Router CRUD Ambiti
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Ambito, Utente
from ..schemas import AmbitoCreate, AmbitoUpdate, AmbitoResponse
from ..utils import get_current_user, require_admin

router = APIRouter()


@router.get("/", response_model=List[AmbitoResponse])
async def list_ambiti(
    attivo: Optional[bool] = None,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lista ambiti"""
    query = db.query(Ambito)
    if attivo is not None:
        query = query.filter(Ambito.attivo == attivo)
    return query.all()


@router.get("/{ambito_id}", response_model=AmbitoResponse)
async def get_ambito(
    ambito_id: str,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Dettaglio ambito"""
    ambito = db.query(Ambito).filter(Ambito.id == ambito_id).first()
    if not ambito:
        raise HTTPException(status_code=404, detail="Ambito non trovato")
    return ambito


@router.post("/", response_model=AmbitoResponse, status_code=status.HTTP_201_CREATED)
async def create_ambito(
    ambito_data: AmbitoCreate,
    current_user: Utente = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Crea nuovo ambito (solo admin)"""
    existing = db.query(Ambito).filter(Ambito.nome == ambito_data.nome).first()
    if existing:
        raise HTTPException(status_code=400, detail="Nome ambito già in uso")
    
    new_ambito = Ambito(
        nome=ambito_data.nome,
        descrizione=ambito_data.descrizione,
        supervisore_id=ambito_data.supervisore_id
    )
    db.add(new_ambito)
    db.commit()
    db.refresh(new_ambito)
    return new_ambito


@router.put("/{ambito_id}", response_model=AmbitoResponse)
async def update_ambito(
    ambito_id: str,
    ambito_data: AmbitoUpdate,
    current_user: Utente = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Aggiorna ambito (solo admin)"""
    ambito = db.query(Ambito).filter(Ambito.id == ambito_id).first()
    if not ambito:
        raise HTTPException(status_code=404, detail="Ambito non trovato")
    
    update_data = ambito_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(ambito, key, value)
    
    db.commit()
    db.refresh(ambito)
    return ambito


@router.delete("/{ambito_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ambito(
    ambito_id: str,
    current_user: Utente = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Disattiva ambito (solo admin)"""
    ambito = db.query(Ambito).filter(Ambito.id == ambito_id).first()
    if not ambito:
        raise HTTPException(status_code=404, detail="Ambito non trovato")
    
    ambito.attivo = False
    db.commit()
