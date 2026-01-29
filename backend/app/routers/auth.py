"""
Router autenticazione
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field

from ..database import get_db
from ..models import Utente, UserRole
from ..schemas import Token, UtenteCreate, UtenteResponse
from ..utils import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
)
from ..config import get_settings

settings = get_settings()
router = APIRouter()


class SetupStatus(BaseModel):
    needs_setup: bool
    message: str


class InitialSetup(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    nome: str
    cognome: str
    nome_azienda: str = Field(default="")


@router.get("/setup-status", response_model=SetupStatus)
async def check_setup_status(db: Session = Depends(get_db)):
    """Verifica se il sistema necessita di setup iniziale (nessun utente presente)"""
    user_count = db.query(Utente).count()
    if user_count == 0:
        return SetupStatus(
            needs_setup=True,
            message="Benvenuto! Configura il primo account amministratore per iniziare."
        )
    return SetupStatus(
        needs_setup=False,
        message="Sistema già configurato"
    )


@router.post("/setup", response_model=UtenteResponse, status_code=status.HTTP_201_CREATED)
async def initial_setup(
    setup_data: InitialSetup,
    db: Session = Depends(get_db)
):
    """Setup iniziale: crea il primo utente admin. Funziona solo se non ci sono utenti."""
    try:
        # Verifica che non ci siano già utenti
        user_count = db.query(Utente).count()
        if user_count > 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Setup già completato. Usa /login per accedere."
            )
        
        # Crea primo admin
        password_hash = get_password_hash(setup_data.password)
        admin = Utente(
            email=setup_data.email,
            password_hash=password_hash,
            nome=setup_data.nome,
            cognome=setup_data.cognome,
            ruolo=UserRole.admin,
            attivo=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        return admin
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"ERROR in setup: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore durante la creazione: {str(e)}"
        )


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login con email e password, ritorna JWT token"""
    user = db.query(Utente).filter(Utente.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o password non corretti",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.attivo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Utente disattivato"
        )
    
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "ruolo": user.ruolo.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=UtenteResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UtenteCreate,
    db: Session = Depends(get_db)
):
    """Registrazione nuovo utente (solo per admin in produzione)"""
    # Verifica email unica
    existing = db.query(Utente).filter(Utente.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email già registrata"
        )
    
    # Crea utente
    new_user = Utente(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        nome=user_data.nome,
        cognome=user_data.cognome,
        ruolo=user_data.ruolo,
        telefono=user_data.telefono
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("/me", response_model=UtenteResponse)
async def get_me(current_user: Utente = Depends(get_current_user)):
    """Ritorna info utente corrente"""
    return current_user


@router.post("/change-password")
async def change_password(
    old_password: str,
    new_password: str,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cambio password utente corrente"""
    if not verify_password(old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password attuale non corretta"
        )
    
    current_user.password_hash = get_password_hash(new_password)
    db.commit()
    return {"message": "Password aggiornata con successo"}
