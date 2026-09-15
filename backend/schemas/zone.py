from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class RiskZoneCreate(BaseModel):
    destination_id: Optional[str] = None
    zone_code: str
    name: str
    description: Optional[str] = None
    zone_type: str = "landslide"
    risk_level: str = "high"
    geometry_type: str = "circle"
    coordinates_json: str
    radius_meters: Optional[float] = 250.0
    warning_distance_meters: Optional[float] = 100.0
    is_restricted: Optional[bool] = False
    safety_instructions: Optional[str] = None

class RiskZoneResponse(BaseModel):
    id: str
    destination_id: str
    zone_code: str
    name: str
    description: Optional[str] = None
    zone_type: str
    risk_level: str
    geometry_type: str
    coordinates_json: str
    radius_meters: float
    warning_distance_meters: float
    is_restricted: bool
    safety_instructions: Optional[str] = None

    class Config:
        from_attributes = True


class DestinationResponse(BaseModel):
    id: str
    name: str
    state: str
    country: str
    center_lat: float
    center_lng: float
    default_zoom: int
    emergency_helpline: str

    class Config:
        from_attributes = True

class EmergencyFacilityResponse(BaseModel):
    id: str
    name: str
    facility_type: str
    lat: float
    lng: float
    contact_number: str
    is_24x7: bool

    class Config:
        from_attributes = True

class ProximityCheckRequest(BaseModel):
    lat: float
    lng: float
    destination_id: Optional[str] = None

class ProximityCheckResponse(BaseModel):
    current_risk_score: int
    risk_category: str  # safe, caution, high, critical
    inside_zone: Optional[RiskZoneResponse] = None
    nearest_warning_zone: Optional[RiskZoneResponse] = None
    distance_to_danger_meters: float
    alert_triggered: bool
    alert_severity: Optional[str] = None  # None, warning, critical
    instructions: Optional[str] = None
