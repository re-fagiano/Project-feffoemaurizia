"""
Router gestione utenti (CRUD completo) con protezioni Super Admin
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from ..database import get_db
from ..models import Utente, UserRole
from ..schemas import UtenteResponse, UtenteCreate
from ..utils import get_current_user, require_admin, get_password_hash

router = APIRouter(prefix="/api/users", tags=["users"])


class UtenteUpdate(BaseModel):
    email: Optional[EmailStr] = None
    nome: Optional[str] = None
    cognome: Optional[str] = None
    ruolo: Optional[UserRole] = None
    telefono: Optional[str] = None
    attivo: Optional[bool] = None


@router.get("/", response_model=List[UtenteResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    ruolo: Optional[UserRole] = None,
    attivo: Optional[bool] = None,
    current_user: Utente = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Lista utenti con filtri e paginazione (solo admin)"""
    query = db.query(Utente)
    
    # Filtro ricerca
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Utente.nome.ilike(search_filter)) |
            (Utente.cognome.ilike(search_filter)) |
            (Utente.email.ilike(search_filter))
        )
    
    # Filtro ruolo
    if ruolo:
        query = query.filter(Utente.ruolo == ruolo)
    
    # Filtro attivo
    if attivo is not None:
        query = query.filter(Utente.attivo == attivo)
    
    # Ordinamento
    query = query.order_by(Utente.created_at.desc())
    
    # Paginazione
    users = query.offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UtenteResponse)
async def get_user(
    user_id: str,
    current_user: Utente = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Dettaglio singolo utente (solo admin)"""
    user = db.query(Utente).filter(Utente.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente non trovato"
        )
    return user


@router.put("/{user_id}", response_model=UtenteResponse)
async def update_user(
    user_id: str,
    user_data: UtenteUpdate,
    current_user: Utente = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Aggiorna utente (solo admin) con protezioni Super Admin"""
    user = db.query(Utente).filter(Utente.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente non trovato"
        )
    
    # PROTEZIONE: Super Admin non può essere modificato
    if user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Il Super Admin non può essere modificato. Solo il Super Admin può trasferire il suo ruolo."
        )
    
    # Verifica email unica se modificata
    if user_data.email and user_data.email != user.email:
        existing = db.query(Utente).filter(Utente.email == user_data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email già in uso"
            )
    
    # Aggiorna campi
    update_data = user_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user: Utente = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Elimina utente (solo admin) con protezioni"""
    user = db.query(Utente).filter(Utente.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente non trovato"
        )
    
    # PROTEZIONE: Super Admin non può essere eliminato
    if user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Il Super Admin non può essere eliminato"
        )
    
    # Impedisci auto-eliminazione
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Non puoi eliminare il tuo stesso account"
        )
    
    db.delete(user)
    db.commit()
    return {"message": "Utente eliminato con successo"}


@router.post("/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: str,
    current_user: Utente = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Attiva/disattiva utente (solo admin) con protezioni"""
    user = db.query(Utente).filter(Utente.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente non trovato"
        )
    
    # PROTEZIONE: Super Admin non può essere disattivato
    if user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Il Super Admin non può essere disattivato"
        )
    
    # Impedisci auto-disattivazione
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Non puoi disattivare il tuo stesso account"
        )
    
    user.attivo = not user.attivo
    db.commit()
    db.refresh(user)
    return {"message": f"Utente {'attivato' if user.attivo else 'disattivato'}", "attivo": user.attivo}


@router.post("/{user_id}/transfer-super-admin")
async def transfer_super_admin(
    user_id: str,
    current_user: Utente = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Trasferisce il ruolo Super Admin (solo Super Admin corrente)"""
    # PROTEZIONE: Solo Super Admin può trasferire
    if not current_user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo il Super Admin può trasferire il suo ruolo"
        )
    
    # Verifica utente destinazione
    target_user = db.query(Utente).filter(Utente.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente non trovato"
        )
    
    # Verifica che sia admin
    if target_user.ruolo != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Il destinatario deve essere un Amministratore"
        )
    
    # Impedisci auto-trasferimento
    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sei già il Super Admin"
        )
    
    # Trasferimento
    current_user.is_super_admin = False
    target_user.is_super_admin = True
    
    db.commit()
    db.refresh(current_user)
    db.refresh(target_user)
    
    return {
        "message": f"Ruolo Super Admin trasferito a {target_user.nome} {target_user.cognome}",
        "new_super_admin": {
            "id": target_user.id,
            "nome": target_user.nome,
            "cognome": target_user.cognome,
            "email": target_user.email
        }
    }
