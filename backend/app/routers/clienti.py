"""
Router CRUD Clienti
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Cliente, SedeCliente, Utente
from ..schemas import (
    ClienteCreate, ClienteUpdate, ClienteResponse, ClienteListResponse,
    SedeClienteCreate, SedeClienteResponse
)
from ..utils import get_current_user, require_tecnico

router = APIRouter()


@router.get("/", response_model=List[ClienteListResponse])
async def list_clienti(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    attivo: Optional[bool] = None,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lista clienti con paginazione e filtri"""
    query = db.query(Cliente)
    
    if search:
        query = query.filter(Cliente.ragione_sociale.ilike(f"%{search}%"))
    if attivo is not None:
        query = query.filter(Cliente.attivo == attivo)
    
    return query.offset(skip).limit(limit).all()


@router.get("/{cliente_id}", response_model=ClienteResponse)
async def get_cliente(
    cliente_id: UUID,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Dettaglio cliente con sedi"""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente non trovato")
    return cliente


@router.post("/", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
async def create_cliente(
    cliente_data: ClienteCreate,
    current_user: Utente = Depends(require_tecnico()),
    db: Session = Depends(get_db)
):
    """Crea nuovo cliente"""
    # Verifica email unica
    existing = db.query(Cliente).filter(Cliente.email_principale == cliente_data.email_principale).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email già in uso")
    
    # Crea cliente
    new_cliente = Cliente(
        ragione_sociale=cliente_data.ragione_sociale,
        partita_iva=cliente_data.partita_iva,
        codice_fiscale=cliente_data.codice_fiscale,
        email_principale=cliente_data.email_principale,
        email_secondarie=cliente_data.email_secondarie,
        telefoni=cliente_data.telefoni,
        gestione_interna=cliente_data.gestione_interna,
        tecnico_riferimento_id=cliente_data.tecnico_riferimento_id,
        note=cliente_data.note
    )
    db.add(new_cliente)
    db.flush()
    
    # Aggiungi sedi se presenti
    if cliente_data.sedi:
        for sede_data in cliente_data.sedi:
            sede = SedeCliente(
                cliente_id=new_cliente.id,
                **sede_data.model_dump()
            )
            db.add(sede)
    
    db.commit()
    db.refresh(new_cliente)
    return new_cliente


@router.put("/{cliente_id}", response_model=ClienteResponse)
async def update_cliente(
    cliente_id: UUID,
    cliente_data: ClienteUpdate,
    current_user: Utente = Depends(require_tecnico()),
    db: Session = Depends(get_db)
):
    """Aggiorna cliente"""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente non trovato")
    
    update_data = cliente_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(cliente, key, value)
    
    db.commit()
    db.refresh(cliente)
    return cliente


@router.delete("/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cliente(
    cliente_id: UUID,
    current_user: Utente = Depends(require_tecnico()),
    db: Session = Depends(get_db)
):
    """Disattiva cliente (soft delete)"""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente non trovato")
    
    cliente.attivo = False
    db.commit()


# =============================================
# SEDI CLIENTE
# =============================================
@router.post("/{cliente_id}/sedi", response_model=SedeClienteResponse, status_code=status.HTTP_201_CREATED)
async def add_sede(
    cliente_id: UUID,
    sede_data: SedeClienteCreate,
    current_user: Utente = Depends(require_tecnico()),
    db: Session = Depends(get_db)
):
    """Aggiungi sede a cliente"""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente non trovato")
    
    sede = SedeCliente(cliente_id=cliente_id, **sede_data.model_dump())
    db.add(sede)
    db.commit()
    db.refresh(sede)
    return sede


@router.delete("/{cliente_id}/sedi/{sede_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sede(
    cliente_id: UUID,
    sede_id: UUID,
    current_user: Utente = Depends(require_tecnico()),
    db: Session = Depends(get_db)
):
    """Rimuovi sede da cliente"""
    sede = db.query(SedeCliente).filter(
        SedeCliente.id == sede_id,
        SedeCliente.cliente_id == cliente_id
    ).first()
    if not sede:
        raise HTTPException(status_code=404, detail="Sede non trovata")
    
    db.delete(sede)
    db.commit()
