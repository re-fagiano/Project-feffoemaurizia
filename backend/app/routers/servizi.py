from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.models import Servizio, Utente
from ..schemas import schemas
from .auth import get_current_user, require_admin

router = APIRouter()

@router.get("/", response_model=List[schemas.ServizioResponse])
async def get_servizi(
    active_only: bool = True,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lista servizi. Defalut: solo attivi.
    """
    query = db.query(Servizio)
    if active_only:
        query = query.filter(Servizio.attivo == True)
    return query.order_by(Servizio.nome).all()


@router.post("/", response_model=schemas.ServizioResponse, status_code=status.HTTP_201_CREATED)
async def create_servizio(
    servizio: schemas.ServizioCreate,
    current_user: Utente = Depends(require_admin), 
    db: Session = Depends(get_db)
):
    """
    Crea un nuovo servizio
    """
    exists = db.query(Servizio).filter(Servizio.codice == servizio.codice).first()
    if exists:
        raise HTTPException(status_code=400, detail="Codice servizio già esistente")

    new_servizio = Servizio(**servizio.model_dump())
    db.add(new_servizio)
    db.commit()
    db.refresh(new_servizio)
    return new_servizio


@router.put("/{id}", response_model=schemas.ServizioResponse)
async def update_servizio(
    id: str,
    update_data: schemas.ServizioUpdate,
    current_user: Utente = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Modifica un servizio esistente
    """
    servizio = db.query(Servizio).filter(Servizio.id == id).first()
    if not servizio:
        raise HTTPException(status_code=404, detail="Servizio non trovato")

    if update_data.codice and update_data.codice != servizio.codice:
        exists = db.query(Servizio).filter(Servizio.codice == update_data.codice).first()
        if exists:
            raise HTTPException(status_code=400, detail="Codice già in uso da un altro servizio")

    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(servizio, key, value)

    db.commit()
    db.refresh(servizio)
    return servizio


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_servizio(
    id: str,
    current_user: Utente = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Soft delete servizio
    """
    servizio = db.query(Servizio).filter(Servizio.id == id).first()
    if not servizio:
        raise HTTPException(status_code=404, detail="Servizio non trovato")
    
    servizio.attivo = False
    db.commit()
