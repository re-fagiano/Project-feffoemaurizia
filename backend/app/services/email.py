"""
Servizio per l'invio di email via SMTP
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import get_settings

settings = get_settings()


async def send_verification_email(email: str, token: str, nome: str) -> None:
    """
    Invia email di verifica all'utente
    
    Args:
        email: Indirizzo email destinatario
        token: Token di verifica univoco
        nome: Nome dell'utente
    
    Raises:
        Exception: Se l'invio email fallisce
    """
    # URL di verifica (in produzione usare il dominio reale)
    verification_url = f"http://localhost:3000/verify-email?token={token}"
    
    # Template HTML email
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
            .button {{
                display: inline-block;
                padding: 12px 30px;
                background: #667eea;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }}
            .footer {{
                text-align: center;
                margin-top: 20px;
                color: #666;
                font-size: 12px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Benvenuto in Ticket Platform!</h1>
            </div>
            <div class="content">
                <h2>Ciao {nome},</h2>
                <p>Grazie per esserti registrato su Ticket Platform.</p>
                <p>Per completare la registrazione e attivare il tuo account, clicca sul pulsante qui sotto:</p>
                
                <div style="text-align: center;">
                    <a href="{verification_url}" class="button">Verifica Email</a>
                </div>
                
                <p>Oppure copia e incolla questo link nel tuo browser:</p>
                <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">
                    {verification_url}
                </p>
                
                <p><strong>Nota:</strong> Questo link scadrà tra 24 ore.</p>
                
                <p>Se non hai richiesto questa registrazione, puoi ignorare questa email.</p>
            </div>
            <div class="footer">
                <p>Ticket Platform - Sistema di Gestione Ticket</p>
                <p>Questa è un'email automatica, non rispondere a questo messaggio.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Versione testo plain (fallback)
    text = f"""
    Benvenuto in Ticket Platform, {nome}!
    
    Per completare la registrazione, clicca sul link seguente:
    {verification_url}
    
    Oppure copia e incolla questo link nel tuo browser.
    
    Questo link scadrà tra 24 ore.
    
    Se non hai richiesto questa registrazione, puoi ignorare questa email.
    
    ---
    Ticket Platform - Sistema di Gestione Ticket
    """
    
    # Crea messaggio
    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'Verifica il tuo account - Ticket Platform'
    msg['From'] = settings.EMAIL_FROM
    msg['To'] = email
    
    # Aggiungi entrambe le versioni
    part1 = MIMEText(text, 'plain')
    part2 = MIMEText(html, 'html')
    msg.attach(part1)
    msg.attach(part2)
    
    # Invia email
    try:
        # Porta 465 usa SSL diretto (SMTP_SSL)
        if settings.SMTP_PORT == 465:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
                print(f"Email di verifica inviata a {email}")
        else:
            # Porte 25, 587 usano SMTP con STARTTLS
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
                print(f"Email di verifica inviata a {email}")
    except Exception as e:
        print(f"Errore invio email: {type(e).__name__}: {e}")
        raise


async def send_password_reset_email(email: str, token: str, nome: str) -> None:
    """
    Invia email per reset password
    
    Args:
        email: Indirizzo email destinatario
        token: Token di reset password
        nome: Nome dell'utente
    """
    reset_url = f"http://localhost:3000/reset-password?token={token}"
    
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
            .button {{
                display: inline-block;
                padding: 12px 30px;
                background: #667eea;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }}
            .footer {{
                text-align: center;
                margin-top: 20px;
                color: #666;
                font-size: 12px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Reset Password</h1>
            </div>
            <div class="content">
                <h2>Ciao {nome},</h2>
                <p>Hai richiesto il reset della tua password.</p>
                <p>Clicca sul pulsante qui sotto per impostare una nuova password:</p>
                
                <div style="text-align: center;">
                    <a href="{reset_url}" class="button">Reset Password</a>
                </div>
                
                <p>Oppure copia e incolla questo link nel tuo browser:</p>
                <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">
                    {reset_url}
                </p>
                
                <p><strong>Nota:</strong> Questo link scadrà tra 1 ora.</p>
                
                <p>Se non hai richiesto il reset della password, ignora questa email.</p>
            </div>
            <div class="footer">
                <p>Ticket Platform - Sistema di Gestione Ticket</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'Reset Password - Ticket Platform'
    msg['From'] = settings.EMAIL_FROM
    msg['To'] = email
    
    msg.attach(MIMEText(html, 'html'))
    
    try:
        # Porta 465 usa SSL diretto (SMTP_SSL)
        if settings.SMTP_PORT == 465:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
                print(f"Email reset password inviata a {email}")
        else:
            # Porte 25, 587 usano SMTP con STARTTLS
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
                print(f"Email reset password inviata a {email}")
    except Exception as e:
        print(f"Errore invio email: {type(e).__name__}: {e}")
        raise
