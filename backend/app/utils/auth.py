"""
Utilities per autenticazione e sicurezza
"""
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..models import Utente, UserRole
from ..schemas import TokenData

settings = get_settings()

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica password con hash bcrypt"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )


def get_password_hash(password: str) -> str:
    """Genera hash bcrypt della password"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crea JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[TokenData]:
    """Decodifica e valida JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        ruolo: str = payload.get("ruolo")
        if user_id is None:
            return None
        return TokenData(user_id=UUID(user_id), email=email, ruolo=UserRole(ruolo) if ruolo else None)
    except JWTError:
        return None


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Utente:
    """Dependency per ottenere l'utente corrente dal token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenziali non valide",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = decode_token(token)
    if token_data is None:
        raise credentials_exception
    
    user = db.query(Utente).filter(Utente.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
    if not user.attivo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Utente disattivato"
        )
    return user


async def get_current_active_user(
    current_user: Utente = Depends(get_current_user)
) -> Utente:
    """Dependency per ottenere l'utente corrente attivo"""
    return current_user


def require_roles(*roles: UserRole):
    """Dependency factory per richiedere ruoli specifici"""
    async def role_checker(current_user: Utente = Depends(get_current_user)) -> Utente:
        if current_user.ruolo not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Richiesto ruolo: {', '.join([r.value for r in roles])}"
            )
        return current_user
    return role_checker


# Shortcut per ruoli comuni - chiamate come funzioni
def require_admin():
    """Richiede ruolo admin"""
    return require_roles(UserRole.admin)


def require_supervisore():
    """Richiede ruolo admin o supervisore"""
    return require_roles(UserRole.admin, UserRole.supervisore)


def require_tecnico():
    """Richiede ruolo admin, supervisore o tecnico"""
    return require_roles(UserRole.admin, UserRole.supervisore, UserRole.tecnico)
