"""
Entry point FastAPI - Piattaforma Gestione Ticket
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .database import engine, Base
from .routers import auth, clienti, ambiti, richieste, attivita, contratti, schedules, chat
# Import models per registrarli con Base
from .models import models  # noqa

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle: crea tabelle all'avvio"""
    Base.metadata.create_all(bind=engine)
    print("[OK] Database tables created/verified")
    yield


# Crea app FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    description="API per la gestione di ticket e interventi tecnici",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
def health_check():
    """Endpoint per verificare che l'API sia attiva"""
    return {"status": "healthy", "app": settings.APP_NAME}


# Include routers
app.include_router(auth, prefix="/api/auth", tags=["Autenticazione"])
app.include_router(clienti, prefix="/api/clienti", tags=["Clienti"])
app.include_router(ambiti, prefix="/api/ambiti", tags=["Ambiti"])
app.include_router(richieste, prefix="/api/richieste", tags=["Richieste"])
app.include_router(attivita, prefix="/api/attivita", tags=["Attività"])
app.include_router(contratti, prefix="/api/contratti", tags=["Contratti"])
app.include_router(schedules, prefix="/api/schedules", tags=["Schedulatore"])
app.include_router(chat, prefix="/api/chat", tags=["Chat"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=settings.DEBUG)
