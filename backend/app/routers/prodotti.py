from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.models import Prodotto, Utente
from ..schemas import schemas
from .auth import get_current_user, require_admin

router = APIRouter()

@router.get("/", response_model=List[schemas.ProdottoResponse])
async def get_prodotti(
    active_only: bool = True,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lista prodotti. Defalut: solo attivi.
    """
    query = db.query(Prodotto)
    if active_only:
        query = query.filter(Prodotto.attivo == True)
    return query.order_by(Prodotto.nome).all()


@router.post("/", response_model=schemas.ProdottoResponse, status_code=status.HTTP_201_CREATED)
async def create_prodotto(
    prodotto: schemas.ProdottoCreate,
    current_user: Utente = Depends(require_admin), # Only Admin creates master data
    db: Session = Depends(get_db)
):
    """
    Crea un nuovo prodotto
    """
    # Check unique code
    exists = db.query(Prodotto).filter(Prodotto.codice == prodotto.codice).first()
    if exists:
        raise HTTPException(status_code=400, detail="Codice prodotto già esistente")

    new_prodotto = Prodotto(**prodotto.model_dump())
    db.add(new_prodotto)
    db.commit()
    db.refresh(new_prodotto)
    return new_prodotto


@router.put("/{id}", response_model=schemas.ProdottoResponse)
async def update_prodotto(
    id: str,
    update_data: schemas.ProdottoUpdate,
    current_user: Utente = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Modifica un prodotto esistente
    """
    prodotto = db.query(Prodotto).filter(Prodotto.id == id).first()
    if not prodotto:
        raise HTTPException(status_code=404, detail="Prodotto non trovato")

    if update_data.codice and update_data.codice != prodotto.codice:
        exists = db.query(Prodotto).filter(Prodotto.codice == update_data.codice).first()
        if exists:
            raise HTTPException(status_code=400, detail="Codice già in uso da un altro prodotto")

    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(prodotto, key, value)

    db.commit()
    db.refresh(prodotto)
    return prodotto


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prodotto(
    id: str,
    current_user: Utente = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Elimina un prodotto (Hard delete). 
    In futuro potremmo preferire soft delete (attivo=False) se ci sono relazioni storiche.
    Per ora implementiamo Hard Delete ma con controllo integrità DB (che fallirà se ci sono FK).
    Meglio: implementiamo Soft Delete di default cambiando 'attivo' a False se l'utente chiama DELETE?
    Visto che il piano diceva "Soft delete via attivo=False preferred", facciamo quello.
    """
    prodotto = db.query(Prodotto).filter(Prodotto.id == id).first()
    if not prodotto:
        raise HTTPException(status_code=404, detail="Prodotto non trovato")
    
    # Soft delete
    prodotto.attivo = False
    db.commit()
