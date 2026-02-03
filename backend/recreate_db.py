"""
Script per ricreare il database con schema aggiornato
Elimina il database esistente e lo ricrea con tutte le colonne corrette
"""
import os
import sys

# Aggiungi il path dell'app
sys.path.insert(0, os.path.dirname(__file__))

def recreate_database():
    """Ricrea il database da zero"""
    
    # 1. Elimina database esistente
    db_files = ['ticket_platform.db', 'ticket_platform.db-shm', 'ticket_platform.db-wal']
    for db_file in db_files:
        if os.path.exists(db_file):
            os.remove(db_file)
            print(f"✓ Eliminato: {db_file}")
    
    # 2. Importa modelli e database
    from app.database import Base, engine
    from app.models import models  # Importa tutti i modelli
    
    # 3. Crea tutte le tabelle
    print("\nCreazione tabelle...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tabelle create")
    
    # 4. Verifica schema tabella utenti
    import sqlite3
    conn = sqlite3.connect('ticket_platform.db')
    cursor = conn.execute('PRAGMA table_info(utenti)')
    
    print("\n📋 Colonne tabella 'utenti':")
    columns = []
    for row in cursor:
        col_name = row[1]
        col_type = row[2]
        columns.append(col_name)
        print(f"  ✓ {col_name} ({col_type})")
    
    conn.close()
    
    # 5. Verifica colonne critiche
    required_columns = ['is_super_admin', 'email_verified', 'email_verification_token']
    missing = [col for col in required_columns if col not in columns]
    
    if missing:
        print(f"\n❌ ERRORE: Colonne mancanti: {', '.join(missing)}")
        return False
    else:
        print(f"\n✅ Database ricreato correttamente!")
        print(f"   Tutte le {len(columns)} colonne presenti")
        return True

if __name__ == "__main__":
    success = recreate_database()
    sys.exit(0 if success else 1)
