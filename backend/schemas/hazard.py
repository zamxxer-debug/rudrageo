from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class HazardReportCreate(BaseModel):
    hazard_type: str  # landslide, flood, broken_road, unsafe_bridge, wildlife, suspicious_activity, lost_person, medical_emergency, infrastructure_damage, other
    description: str
    lat: float
    lng: float
    image_url: Optional[str] = None

class HazardReportResponse(BaseModel):
    id: str
    reporter_name: str
    hazard_type: str
    description: str
    lat: float
    lng: float
    image_url: Optional[str] = None
    ai_classification: Optional[str] = None
    ai_confidence: float
    status: str
    verified_by_authority: bool
    created_at: datetime

    class Config:
        from_attributes = True
