"""
Router Chat richieste
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import MessaggioChat, Richiesta, Utente
from ..schemas import MessaggioCreate, MessaggioResponse
from ..utils import get_current_user

router = APIRouter()


@router.get("/richiesta/{richiesta_id}", response_model=List[MessaggioResponse])
async def get_messaggi_richiesta(
    richiesta_id: str,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lista messaggi di una richiesta"""
    richiesta = db.query(Richiesta).filter(Richiesta.id == richiesta_id).first()
    if not richiesta:
        raise HTTPException(status_code=404, detail="Richiesta non trovata")
    
    messaggi = db.query(MessaggioChat).filter(
        MessaggioChat.richiesta_id == richiesta_id
    ).order_by(MessaggioChat.created_at).all()
    
    return messaggi


@router.post("/", response_model=MessaggioResponse, status_code=status.HTTP_201_CREATED)
async def send_messaggio(
    messaggio_data: MessaggioCreate,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Invia messaggio in chat richiesta"""
    richiesta = db.query(Richiesta).filter(Richiesta.id == messaggio_data.richiesta_id).first()
    if not richiesta:
        raise HTTPException(status_code=404, detail="Richiesta non trovata")
    
    new_messaggio = MessaggioChat(
        richiesta_id=messaggio_data.richiesta_id,
        autore_id=current_user.id,
        messaggio=messaggio_data.messaggio,
        allegati=messaggio_data.allegati
    )
    db.add(new_messaggio)
    db.commit()
    db.refresh(new_messaggio)
    
    # TODO: Inviare notifiche email/push agli altri partecipanti
    
    return new_messaggio


@router.post("/richiesta/{richiesta_id}/mark-read")
async def mark_read(
    richiesta_id: str,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marca tutti i messaggi come letti"""
    db.query(MessaggioChat).filter(
        MessaggioChat.richiesta_id == richiesta_id,
        MessaggioChat.autore_id != current_user.id,
        MessaggioChat.letto == False
    ).update({"letto": True})
    db.commit()
    
    return {"message": "Messaggi marcati come letti"}


@router.get("/non-letti")
async def count_non_letti(
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Conta messaggi non letti per l'utente corrente"""
    count = db.query(MessaggioChat).filter(
        MessaggioChat.autore_id != current_user.id,
        MessaggioChat.letto == False
    ).count()
    
    return {"non_letti": count}
