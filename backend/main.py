import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import engine, Base, SessionLocal
import models  # Ensures all models are registered
from websocket_manager import ws_manager

# Import API routers
from api.auth import router as auth_router
from api.tourists import router as tourists_router
from api.digital_id import router as digital_id_router
from api.zones import router as zones_router
from api.risk import router as risk_router
from api.sos import router as sos_router
from api.sync import router as sync_router
from api.guardian import router as guardian_router
from api.hazards import router as hazards_router
from api.payment import router as payment_router
from api.blockchain import router as blockchain_router
from api.analytics import router as analytics_router
from api.audit import router as audit_router
from api.health import router as health_router

from seed import seed_demo_data

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=f"{settings.APP_NAME} - Tourist Safety & Emergency Response Platform",
    description="Offline-First Smart Tourist Safety, Geofencing, AI Risk Intelligence & Blockchain Incident Ledger",
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(auth_router)
app.include_router(tourists_router)
app.include_router(digital_id_router)
app.include_router(zones_router)
app.include_router(risk_router)
app.include_router(sos_router)
app.include_router(sync_router)
app.include_router(guardian_router)
app.include_router(hazards_router)
app.include_router(payment_router)
app.include_router(blockchain_router)
app.include_router(analytics_router)
app.include_router(audit_router)
app.include_router(health_router, prefix="/api/health")
app.include_router(health_router, prefix="/health")

# Real-time WebSocket Endpoint
@app.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep-alive receive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

@app.get("/")
def root():
    return {
        "platform": "Rudra - Tourist Safety & Emergency Response Platform",
        "api_docs": "/docs",
        "status": "online",
        "version": settings.APP_VERSION
    }

if __name__ == "__main__":


    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
