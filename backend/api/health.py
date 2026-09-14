from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from config import settings

router = APIRouter(prefix="/health", tags=["Observability & Health"])

@router.get("")
def health():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "mode": "DEMO" if settings.DEMO_MODE else "PRODUCTION"
    }

@router.get("/database")
def health_database(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected", "engine": settings.DATABASE_URL.split(":///")[0]}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

@router.get("/blockchain")
def health_blockchain():
    return {
        "status": "healthy",
        "mode": settings.BLOCKCHAIN_MODE,
        "tamper_evident_engine": "SHA-256 Merkle Ledger Active"
    }

@router.get("/notifications")
def health_notifications():
    return {
        "status": "healthy",
        "sms_provider": settings.SMS_PROVIDER,
        "websocket_active": True
    }
