"""
Router autenticazione
"""
from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
import secrets

from ..database import get_db
from ..models import Utente, UserRole
from ..schemas import Token, UtenteCreate, UtenteResponse
from ..utils import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    require_admin,
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

class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8)


@router.get("/setup-status", response_model=SetupStatus)
async def check_setup_status():
    """Verifica se il sistema necessita di setup iniziale (nessun utente presente)"""
    try:
        # Crea sessione manualmente per evitare problemi dependency
        from ..database import SessionLocal
        from sqlalchemy import text
        db = SessionLocal()
        try:
            # Usa raw SQL per evitare problemi ORM
            result = db.execute(text("SELECT COUNT(*) FROM utenti"))
            user_count = result.scalar()
            
            if user_count == 0:
                return SetupStatus(
                    needs_setup=True,
                    message="Benvenuto! Configura il primo account amministratore per iniziare."
                )
            return SetupStatus(
                needs_setup=False,
                message="Sistema già configurato"
            )
        finally:
            db.close()
    except Exception as e:
        # Se il database non esiste o ha problemi, serve setup
        print(f"⚠️  Setup status check failed: {e}")
        return SetupStatus(
            needs_setup=True,
            message="Benvenuto! Configura il primo account amministratore per iniziare."
        )


@router.post("/setup", response_model=UtenteResponse, status_code=status.HTTP_201_CREATED)
async def initial_setup(
    setup_data: InitialSetup,
    db: Session = Depends(get_db)
):
    """Setup iniziale: crea il primo utente admin e invia email di verifica."""
    try:
        # Verifica che non ci siano già utenti
        user_count = db.query(Utente).count()
        if user_count > 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Setup già completato. Usa /login per accedere."
            )
        
        # Genera token di verifica
        verification_token = secrets.token_urlsafe(32)
        token_expires = datetime.utcnow() + timedelta(hours=24)
        
        # Crea primo admin (NON verificato, MA super admin)
        password_hash = get_password_hash(setup_data.password)
        admin = Utente(
            email=setup_data.email,
            password_hash=password_hash,
            nome=setup_data.nome,
            cognome=setup_data.cognome,
            ruolo=UserRole.admin,
            attivo=True,
            is_super_admin=True,  # Primo utente = Super Admin
            email_verified=False,
            email_verification_token=verification_token,
            email_verification_token_expires=token_expires
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        # Invia email di verifica
        try:
            from ..services.email import send_verification_email
            await send_verification_email(
                email=admin.email,
                token=verification_token,
                nome=admin.nome
            )
        except Exception as e:
            # Se l'invio email fallisce, elimina l'utente creato
            db.delete(admin)
            db.commit()
            print(f"Errore invio email: {type(e).__name__}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Impossibile inviare email di verifica. Verifica la configurazione SMTP."
            )
        
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


@router.get("/verify-email")
async def verify_email(
    token: str,
    db: Session = Depends(get_db)
):
    """Verifica email tramite token"""
    # Cerca utente con questo token
    user = db.query(Utente).filter(
        Utente.email_verification_token == token
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token di verifica non valido"
        )
    
    # Verifica scadenza token
    if user.email_verification_token_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token di verifica scaduto"
        )
    
    # Aggiorna utente
    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_token_expires = None
    db.commit()
    
    return {"message": "Email verificata con successo"}


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
    
    # Verifica email verificata
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email non verificata. Controlla la tua casella di posta."
        )
    
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "ruolo": user.ruolo.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UtenteResponse)
async def get_current_user_info(
    current_user: Utente = Depends(get_current_user)
):
    """Restituisce i dati dell'utente corrente"""
    return current_user


@router.post("/register", response_model=UtenteResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UtenteCreate,
    current_user: Utente = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Registrazione nuovo utente (solo per admin in produzione)"""
    # Normalizza email
    email = user_data.email.strip().lower()
    
    # Verifica email unica
    existing = db.query(Utente).filter(Utente.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email già registrata"
        )
    
    # Crea utente
    new_user = Utente(
        email=email,
        password_hash=get_password_hash(user_data.password),
        nome=user_data.nome,
        cognome=user_data.cognome,
        ruolo=user_data.ruolo,
        telefono=user_data.telefono,

        email_verified=False,  # User must verify email
        force_password_change=True, # User must change password
        email_verification_token=secrets.token_urlsafe(32),
        email_verification_token_expires=datetime.utcnow() + timedelta(hours=24)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Invia email di verifica
    try:
        from ..services.email import send_verification_email
        await send_verification_email(
            email=new_user.email,
            token=new_user.email_verification_token,
            nome=new_user.nome
        )
    except Exception as e:
        print(f"Errore invio email: {e}")
        # Non falliamo la creazione, ma l'utente dovrà richiedere nuova email o admin dovrà intervenire
        # O forse meglio rollback? Per ora lasciamo creato ma logghiamo errore.
    
    return new_user


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_user: Utente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cambio password utente corrente"""
    if not verify_password(payload.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password attuale non corretta"
        )
    
    current_user.password_hash = get_password_hash(payload.new_password)
    current_user.force_password_change = False
    db.commit()
    return {"message": "Password aggiornata con successo"}
