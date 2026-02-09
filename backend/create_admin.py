import sys
import os

# Aggiungi la directory corrente al path per importare i moduli app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.models import Utente, UserRole
from app.utils.auth import get_password_hash

def create_admin_user():
    db = SessionLocal()
    try:
        # Check if admin already exists
        email = "carlettidavidealessandro@gmail.com"
        password = "1"
        
        existing_user = db.query(Utente).filter(Utente.email == email).first()
        if existing_user:
            print(f"Utente admin già esistente: {email}")
            print("Password: (invariata)")
            return

        # Create new admin user
        hashed_password = get_password_hash(password)
        new_user = Utente(
            email=email,
            password_hash=hashed_password,
            nome="Admin",
            cognome="System",
            ruolo=UserRole.admin,
            is_super_admin=True,
            attivo=True,
            email_verified=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print("\n" + "="*50)
        print("UTENTE ADMIN CREATO CON SUCCESSO")
        print("="*50)
        print(f"Username: {email}")
        print(f"Password: {password}")
        print("="*50 + "\n")
        
    except Exception as e:
        print(f"Errore durante la creazione dell'utente: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
