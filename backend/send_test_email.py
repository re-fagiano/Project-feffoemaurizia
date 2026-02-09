"""
Script per testare l'invio email via SMTP
Uso: python send_test_email.py <destinatario>
"""
import sys
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path

# Carica configurazione da .env
env_path = Path(__file__).parent / ".env"
config = {}

if env_path.exists():
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                config[key.strip()] = value.strip()

SMTP_HOST = config.get("SMTP_HOST", "localhost")
SMTP_PORT = int(config.get("SMTP_PORT", "1025"))
SMTP_USER = config.get("SMTP_USER", "")
SMTP_PASSWORD = config.get("SMTP_PASSWORD", "")
EMAIL_FROM = config.get("EMAIL_FROM", "noreply@example.com")


def send_test_email(to_email: str):
    """Invia email di test"""
    
    # Template HTML
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }}
            .info {{
                background: #fff;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Test Email - Ticket Platform</h1>
            </div>
            <div class="content">
                <h2>Email di Test Inviata con Successo!</h2>
                <p>Questa è un'email di test per verificare la configurazione SMTP.</p>
                
                <div class="info">
                    <h3>Configurazione SMTP:</h3>
                    <ul>
                        <li><strong>Host:</strong> {SMTP_HOST}</li>
                        <li><strong>Porta:</strong> {SMTP_PORT}</li>
                        <li><strong>User:</strong> {SMTP_USER or '(nessuno)'}</li>
                        <li><strong>From:</strong> {EMAIL_FROM}</li>
                        <li><strong>To:</strong> {to_email}</li>
                    </ul>
                </div>
                
                <p>Se ricevi questa email, la configurazione SMTP è corretta!</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Versione testo
    text = f"""
    Test Email - Ticket Platform
    
    Email di test inviata con successo!
    
    Configurazione SMTP:
    - Host: {SMTP_HOST}
    - Porta: {SMTP_PORT}
    - User: {SMTP_USER or '(nessuno)'}
    - From: {EMAIL_FROM}
    - To: {to_email}
    
    Se ricevi questa email, la configurazione SMTP è corretta!
    """
    
    # Crea messaggio
    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'Test Email - Ticket Platform'
    msg['From'] = EMAIL_FROM
    msg['To'] = to_email
    
    part1 = MIMEText(text, 'plain')
    part2 = MIMEText(html, 'html')
    msg.attach(part1)
    msg.attach(part2)
    
    # Invia email
    print(f"\n{'='*60}")
    print(f"Invio email di test...")
    print(f"{'='*60}")
    print(f"Host:     {SMTP_HOST}")
    print(f"Porta:    {SMTP_PORT}")
    print(f"User:     {SMTP_USER or '(nessuno)'}")
    print(f"From:     {EMAIL_FROM}")
    print(f"To:       {to_email}")
    print(f"{'='*60}\n")
    
    try:
        # Connessione SMTP
        print(f"Connessione a {SMTP_HOST}:{SMTP_PORT}...")
        
        # Porta 465 usa SSL diretto (SMTP_SSL)
        if SMTP_PORT == 465:
            print("Usando SMTP_SSL (porta 465)...")
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10)
        else:
            # Porte 25, 587 usano SMTP normale con STARTTLS
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
            
            # STARTTLS se porta 587 o 25
            if SMTP_PORT in [25, 587]:
                print("Avvio STARTTLS...")
                try:
                    server.starttls()
                except Exception as e:
                    print(f"STARTTLS non supportato o fallito: {e}")
                    print("Continuo senza TLS...")
        
        # Debug mode
        server.set_debuglevel(1)
        
        # Login se credenziali presenti
        if SMTP_USER and SMTP_PASSWORD:
            print(f"Login come {SMTP_USER}...")
            server.login(SMTP_USER, SMTP_PASSWORD)
        
        # Invia
        print("Invio messaggio...")
        server.send_message(msg)
        server.quit()
        
        print(f"\n{'='*60}")
        print(f"✓ Email inviata con successo!")
        print(f"{'='*60}\n")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"\n✗ ERRORE: Autenticazione fallita")
        print(f"  Verifica SMTP_USER e SMTP_PASSWORD nel file .env")
        print(f"  Dettagli: {e}")
        return False
        
    except smtplib.SMTPConnectError as e:
        print(f"\n✗ ERRORE: Impossibile connettersi al server SMTP")
        print(f"  Verifica SMTP_HOST e SMTP_PORT nel file .env")
        print(f"  Dettagli: {e}")
        return False
        
    except Exception as e:
        print(f"\n✗ ERRORE: {type(e).__name__}")
        print(f"  {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("\nUso: python send_test_email.py <email-destinatario>")
        print("\nEsempio:")
        print("  python send_test_email.py test@example.com")
        print("\nConfigurazione attuale (.env):")
        print(f"  SMTP_HOST: {SMTP_HOST}")
        print(f"  SMTP_PORT: {SMTP_PORT}")
        print(f"  SMTP_USER: {SMTP_USER or '(non configurato)'}")
        print(f"  EMAIL_FROM: {EMAIL_FROM}")
        sys.exit(1)
    
    to_email = sys.argv[1]
    success = send_test_email(to_email)
    sys.exit(0 if success else 1)
