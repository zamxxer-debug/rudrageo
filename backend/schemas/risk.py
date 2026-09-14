from typing import Optional, Dict, Any, List
from pydantic import BaseModel

class RiskEvaluateRequest(BaseModel):
    lat: float
    lng: float
    destination_id: Optional[str] = None
    altitude_m: Optional[float] = 2200.0

class RiskFactorBreakdown(BaseModel):
    location_proximity_score: int
    environmental_weather_score: int
    terrain_elevation_score: int
    historical_frequency_score: int
    connectivity_isolation_score: int

class RiskEvaluateResponse(BaseModel):
    total_score: int  # 0 - 100
    category: str     # SAFE, CAUTION, HIGH, CRITICAL
    factors: RiskFactorBreakdown
    explanation: str
    action_advisory: str

class AIAssistantRequest(BaseModel):
    message: str
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    current_risk_score: Optional[int] = None
    language: Optional[str] = "en"

class AIAssistantResponse(BaseModel):
    reply: str
    emergency_alert_required: bool
    suggested_actions: List[str]
    source: str = "drishti_ai_engine"
