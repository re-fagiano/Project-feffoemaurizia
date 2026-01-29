"""
Router CRUD Contratti
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Contratto, VoceContratto, ContrattoCliente, Utente, StatoContratto
from ..schemas import (
    ContrattoCreate, ContrattoUpdate, ContrattoResponse,
    VoceContrattoCreate, VoceContrattoResponse,
    ContrattoClienteCreate, ContrattoClienteUpdate, ContrattoClienteResponse
)
from ..utils import get_current_user, require_admin, require_supervisore

router = APIRouter()


# =============================================
# CONTRATTI (Template)
# =============================================
@router.get("/templates", response_model=List[ContrattoResponse])
async def list_contratti_templates(
    attivo: Optional[bool] = None,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lista contratti template"""
    query = db.query(Contratto)
    if attivo is not None:
        query = query.filter(Contratto.attivo == attivo)
    return query.all()


@router.get("/templates/{contratto_id}", response_model=ContrattoResponse)
async def get_contratto_template(
    contratto_id: UUID,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Dettaglio contratto template con voci"""
    contratto = db.query(Contratto).filter(Contratto.id == contratto_id).first()
    if not contratto:
        raise HTTPException(status_code=404, detail="Contratto non trovato")
    return contratto


@router.post("/templates", response_model=ContrattoResponse, status_code=status.HTTP_201_CREATED)
async def create_contratto_template(
    contratto_data: ContrattoCreate,
    current_user: Utente = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Crea nuovo contratto template (solo admin)"""
    new_contratto = Contratto(
        nome_contratto=contratto_data.nome_contratto,
        tipo=contratto_data.tipo,
        descrizione=contratto_data.descrizione
    )
    db.add(new_contratto)
    db.flush()
    
    # Aggiungi voci se presenti
    if contratto_data.voci:
        for i, voce_data in enumerate(contratto_data.voci):
            voce = VoceContratto(
                contratto_id=new_contratto.id,
                ordine=i,
                **voce_data.model_dump()
            )
            db.add(voce)
    
    db.commit()
    db.refresh(new_contratto)
    return new_contratto


@router.put("/templates/{contratto_id}", response_model=ContrattoResponse)
async def update_contratto_template(
    contratto_id: UUID,
    contratto_data: ContrattoUpdate,
    current_user: Utente = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Aggiorna contratto template (solo admin)"""
    contratto = db.query(Contratto).filter(Contratto.id == contratto_id).first()
    if not contratto:
        raise HTTPException(status_code=404, detail="Contratto non trovato")
    
    update_data = contratto_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(contratto, key, value)
    
    db.commit()
    db.refresh(contratto)
    return contratto


# =============================================
# VOCI CONTRATTO
# =============================================
@router.post("/templates/{contratto_id}/voci", response_model=VoceContrattoResponse, status_code=status.HTTP_201_CREATED)
async def add_voce_contratto(
    contratto_id: UUID,
    voce_data: VoceContrattoCreate,
    current_user: Utente = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Aggiungi voce a contratto template"""
    contratto = db.query(Contratto).filter(Contratto.id == contratto_id).first()
    if not contratto:
        raise HTTPException(status_code=404, detail="Contratto non trovato")
    
    voce = VoceContratto(contratto_id=contratto_id, **voce_data.model_dump())
    db.add(voce)
    db.commit()
    db.refresh(voce)
    return voce


@router.delete("/templates/{contratto_id}/voci/{voce_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_voce_contratto(
    contratto_id: UUID,
    voce_id: UUID,
    current_user: Utente = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Rimuovi voce da contratto template"""
    voce = db.query(VoceContratto).filter(
        VoceContratto.id == voce_id,
        VoceContratto.contratto_id == contratto_id
    ).first()
    if not voce:
        raise HTTPException(status_code=404, detail="Voce non trovata")
    
    db.delete(voce)
    db.commit()


# =============================================
# CONTRATTI CLIENTI (Istanze)
# =============================================
@router.get("/", response_model=List[ContrattoClienteResponse])
async def list_contratti_clienti(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    cliente_id: Optional[UUID] = None,
    stato: Optional[StatoContratto] = None,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lista contratti attivi dei clienti"""
    query = db.query(ContrattoCliente)
    
    if cliente_id:
        query = query.filter(ContrattoCliente.cliente_id == cliente_id)
    if stato:
        query = query.filter(ContrattoCliente.stato == stato)
    
    return query.offset(skip).limit(limit).all()


@router.get("/{contratto_cliente_id}", response_model=ContrattoClienteResponse)
async def get_contratto_cliente(
    contratto_cliente_id: UUID,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Dettaglio contratto cliente"""
    contratto = db.query(ContrattoCliente).filter(ContrattoCliente.id == contratto_cliente_id).first()
    if not contratto:
        raise HTTPException(status_code=404, detail="Contratto non trovato")
    return contratto


@router.post("/", response_model=ContrattoClienteResponse, status_code=status.HTTP_201_CREATED)
async def create_contratto_cliente(
    contratto_data: ContrattoClienteCreate,
    current_user: Utente = Depends(require_supervisore()),
    db: Session = Depends(get_db)
):
    """Assegna contratto a cliente"""
    new_contratto = ContrattoCliente(**contratto_data.model_dump())
    db.add(new_contratto)
    db.commit()
    db.refresh(new_contratto)
    return new_contratto


@router.put("/{contratto_cliente_id}", response_model=ContrattoClienteResponse)
async def update_contratto_cliente(
    contratto_cliente_id: UUID,
    contratto_data: ContrattoClienteUpdate,
    current_user: Utente = Depends(require_supervisore()),
    db: Session = Depends(get_db)
):
    """Aggiorna contratto cliente"""
    contratto = db.query(ContrattoCliente).filter(ContrattoCliente.id == contratto_cliente_id).first()
    if not contratto:
        raise HTTPException(status_code=404, detail="Contratto non trovato")
    
    update_data = contratto_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(contratto, key, value)
    
    db.commit()
    db.refresh(contratto)
    return contratto


@router.post("/{contratto_cliente_id}/ricarica")
async def ricarica_ore(
    contratto_cliente_id: UUID,
    ore_aggiuntive: int,
    current_user: Utente = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Ricarica ore per contratto monte ore"""
    contratto = db.query(ContrattoCliente).filter(ContrattoCliente.id == contratto_cliente_id).first()
    if not contratto:
        raise HTTPException(status_code=404, detail="Contratto non trovato")
    
    if contratto.tipo.value != "monte_ore":
        raise HTTPException(status_code=400, detail="Solo contratti monte ore possono essere ricaricati")
    
    contratto.ore_totali = (contratto.ore_totali or 0) + ore_aggiuntive
    if contratto.stato == StatoContratto.esaurito:
        contratto.stato = StatoContratto.attivo
    
    db.commit()
    return {"message": f"Aggiunte {ore_aggiuntive} ore. Totale ore: {contratto.ore_totali}"}
