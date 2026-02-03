
import sqlite3
import os
import sys

# Determina path DB
DB_FILE = "ticket_platform.db"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, DB_FILE)

def migrate():
    print(f"Checking database at: {DB_PATH}")
    if not os.path.exists(DB_PATH):
        print("❌ Database not found!")
        sys.exit(1)
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(utenti)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "force_password_change" in columns:
            print("INFO: Column 'force_password_change' already exists. Skipping.")
        else:
            print("Adding column 'force_password_change'...")
            cursor.execute("ALTER TABLE utenti ADD COLUMN force_password_change BOOLEAN DEFAULT 0")
            conn.commit()
            print("✅ Migration successful: Column added.")
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
