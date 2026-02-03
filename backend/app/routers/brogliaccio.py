from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.models import Brogliaccio, Utente
from ..schemas import schemas
from .auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[schemas.BrogliaccioResponse])
async def get_brogliaccio(
    status: Optional[str] = "draft",  # Default to showing drafts
    db: Session = Depends(get_db),
    current_user: Utente = Depends(get_current_user)
):
    """
    Recupera le voci del brogliaccio dell'utente corrente.
    Default: mostra solo 'draft'.
    """
    query = db.query(Brogliaccio).filter(Brogliaccio.utente_id == current_user.id)
    
    if status != "all":
        query = query.filter(Brogliaccio.stato == status)
        
    return query.order_by(Brogliaccio.created_at.desc()).all()


@router.post("/", response_model=schemas.BrogliaccioResponse, status_code=status.HTTP_201_CREATED)
async def create_brogliaccio_entry(
    entry: schemas.BrogliaccioCreate,
    db: Session = Depends(get_db),
    current_user: Utente = Depends(get_current_user)
):
    """
    Crea una nuova voce nel brogliaccio
    """
    new_entry = Brogliaccio(
        utente_id=current_user.id,
        contenuto=entry.contenuto,
        tipo=entry.tipo,
        media_url=entry.media_url,
        metadata_json=entry.metadata_json,
        stato="draft"
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry


@router.put("/{entry_id}", response_model=schemas.BrogliaccioResponse)
async def update_brogliaccio_entry(
    entry_id: str,
    update_data: schemas.BrogliaccioUpdate,
    db: Session = Depends(get_db),
    current_user: Utente = Depends(get_current_user)
):
    """
    Aggiorna una voce del brogliaccio
    """
    entry = db.query(Brogliaccio).filter(
        Brogliaccio.id == entry_id,
        Brogliaccio.utente_id == current_user.id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Voce non trovata")
    
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(entry, key, value)
    
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_brogliaccio_entry(
    entry_id: str,
    db: Session = Depends(get_db),
    current_user: Utente = Depends(get_current_user)
):
    """
    Elimina una voce del brogliaccio
    """
    entry = db.query(Brogliaccio).filter(
        Brogliaccio.id == entry_id,
        Brogliaccio.utente_id == current_user.id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Voce non trovata")
    
    db.delete(entry)
    db.commit()
