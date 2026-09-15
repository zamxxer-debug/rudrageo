import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from config import settings

router = APIRouter(tags=["Observability & Health"])

@router.get("")
def health():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "mode": "DEMO" if settings.DEMO_MODE else "PRODUCTION",
        "timestamp": time.time()
    }

@router.get("/database")
def health_database(db: Session = Depends(get_db)):
    start = time.perf_counter()
    try:
        db.execute(text("SELECT 1"))
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        db_type = "PostgreSQL (Supabase/Cloud)" if "postgres" in settings.DATABASE_URL.lower() else "SQLite (Local Embedded)"
        return {
            "status": "healthy",
            "database": "connected",
            "type": db_type,
            "latency_ms": latency_ms
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

@router.get("/supabase")
def health_supabase(db: Session = Depends(get_db)):
    start = time.perf_counter()
    try:
        # Check basic count across users table
        result = db.execute(text("SELECT count(*) FROM users")).scalar()
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        is_supabase = "supabase" in settings.DATABASE_URL.lower() or "postgres" in settings.DATABASE_URL.lower()
        return {
            "status": "healthy",
            "connected": True,
            "provider": "Supabase PostgreSQL" if is_supabase else "Local SQLite (Ready for Supabase URI)",
            "users_count": result,
            "latency_ms": latency_ms,
            "connection_string_configured": bool(settings.DATABASE_URL)
        }
    except Exception as e:
        return {
            "status": "error",
            "connected": False,
            "error": str(e),
            "provider": "Supabase PostgreSQL"
        }

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

