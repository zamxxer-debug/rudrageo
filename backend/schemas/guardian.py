from typing import Optional, List
from pydantic import BaseModel

class GuardianProfileResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    phone: str
    verification_status: str
    service_radius_km: float
    current_lat: float
    current_lng: float
    is_available: bool
    volunteer_type: str
    badges_count: int

    class Config:
        from_attributes = True

class GuardianAlertResponse(BaseModel):
    incident_id: str
    incident_code: str
    tourist_name: str
    lat: float
    lng: float
    distance_km: float
    initial_risk_score: int
    active_zone_name: Optional[str] = None
    triggered_at: str
    status: str

class GuardianStatusUpdate(BaseModel):
    incident_id: str
    status: str  # accepted, declined, on_scene, completed
    notes: Optional[str] = None
