from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.zone import RiskZone
from schemas.risk import (
    RiskEvaluateRequest,
    RiskEvaluateResponse,
    RiskFactorBreakdown,
    AIAssistantRequest,
    AIAssistantResponse
)
from services.geofence_service import geofence_service
from services.risk_service import risk_service
from services.weather_service import weather_service
from services.ai_assistant_service import ai_assistant_service

router = APIRouter(prefix="/api/risk", tags=["AI Risk Intelligence"])

@router.post("/evaluate", response_model=RiskEvaluateResponse)
async def evaluate_risk(data: RiskEvaluateRequest, db: Session = Depends(get_db)):
    zones = db.query(RiskZone).all()
    proximity_eval = geofence_service.evaluate_location(data.lat, data.lng, zones)

    weather = await weather_service.get_current_weather(data.lat, data.lng)

    risk_result = risk_service.calculate_risk(
        proximity_eval=proximity_eval,
        weather_data=weather,
        altitude_m=data.altitude_m or 2200.0
    )

    return RiskEvaluateResponse(
        total_score=risk_result["total_score"],
        category=risk_result["category"],
        factors=RiskFactorBreakdown(**risk_result["factors"]),
        explanation=risk_result["explanation"],
        action_advisory=risk_result["action_advisory"]
    )

@router.post("/assistant", response_model=AIAssistantResponse)
async def ask_assistant(data: AIAssistantRequest):
    result = await ai_assistant_service.get_response(
        message=data.message,
        current_lat=data.current_lat,
        current_lng=data.current_lng,
        current_risk_score=data.current_risk_score,
        language=data.language or "en"
    )
    return AIAssistantResponse(
        reply=result["reply"],
        emergency_alert_required=result["emergency_alert_required"],
        suggested_actions=result["suggested_actions"],
        source=result["source"]
    )

@router.get("/weather")
async def get_weather(lat: float = 11.4102, lng: float = 76.6950):
    return await weather_service.get_current_weather(lat, lng)
