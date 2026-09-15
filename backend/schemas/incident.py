from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class SOSTriggerRequest(BaseModel):
    lat: float
    lng: float
    accuracy_meters: Optional[float] = 10.0
    battery_level: Optional[int] = 80
    offline_event_id: Optional[str] = None
    notes: Optional[str] = None
    image_data: Optional[str] = None
    connectivity_mode: Optional[str] = "online"  # online, synced_from_offline, sms_fallback


class TimelineEventResponse(BaseModel):
    id: str
    timestamp: datetime
    event_type: str
    actor_name: str
    description: str
    payload_json: Optional[str] = None

    class Config:
        from_attributes = True

class SOSIncidentResponse(BaseModel):
    id: str
    incident_code: str
    tourist_id: str
    tourist_name: str
    nationality: str
    phone: Optional[str] = None
    triggered_at: datetime
    lat: float
    lng: float
    accuracy_meters: float
    battery_level: int
    connectivity_mode: str
    status: str
    initial_risk_score: int
    active_risk_zone_name: Optional[str] = None
    assigned_team_name: Optional[str] = None
    assigned_guardian_name: Optional[str] = None
    blockchain_tx_hash: Optional[str] = None
    closed_at: Optional[datetime] = None
    timeline_events: List[TimelineEventResponse] = []

    class Config:
        from_attributes = True

class IncidentStatusUpdate(BaseModel):
    status: str  # acknowledged, assigned, responding, rescued, closed, cancelled
    notes: Optional[str] = None
    reason: Optional[str] = None

class AssignTeamRequest(BaseModel):
    team_id: str
    notes: Optional[str] = None

class AssignGuardianRequest(BaseModel):
    guardian_id: str
    notes: Optional[str] = None
