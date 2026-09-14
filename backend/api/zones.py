from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.zone import Destination, RiskZone, EmergencyFacility
from schemas.zone import (
    RiskZoneResponse,
    DestinationResponse,
    EmergencyFacilityResponse,
    ProximityCheckRequest,
    ProximityCheckResponse
)
from services.auth_service import get_current_user, require_roles
from services.geofence_service import geofence_service
from services.risk_service import risk_service

router = APIRouter(prefix="/api/zones", tags=["Geofencing & Risk Zones"])

@router.get("", response_model=List[RiskZoneResponse])
def get_zones(destination_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(RiskZone)
    if destination_id:
        query = query.filter(RiskZone.destination_id == destination_id)
    return query.all()

@router.get("/destinations", response_model=List[DestinationResponse])
def get_destinations(db: Session = Depends(get_db)):
    return db.query(Destination).filter(Destination.is_active == True).all()

@router.get("/facilities", response_model=List[EmergencyFacilityResponse])
def get_facilities(destination_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(EmergencyFacility)
    if destination_id:
        query = query.filter(EmergencyFacility.destination_id == destination_id)
    return query.all()

@router.post("/check-proximity", response_model=ProximityCheckResponse)
def check_proximity(data: ProximityCheckRequest, db: Session = Depends(get_db)):
    query = db.query(RiskZone)
    if data.destination_id:
        query = query.filter(RiskZone.destination_id == data.destination_id)
    zones = query.all()

    eval_result = geofence_service.evaluate_location(data.lat, data.lng, zones)

    # Compute risk score
    risk_eval = risk_service.calculate_risk(eval_result)

    inside_z = eval_result.get("inside_zone")
    nearest_z = eval_result.get("nearest_warning_zone")

    inside_resp = RiskZoneResponse.from_orm(inside_z) if inside_z else None
    nearest_resp = RiskZoneResponse.from_orm(nearest_z) if nearest_z else None

    return ProximityCheckResponse(
        current_risk_score=risk_eval["total_score"],
        risk_category=risk_eval["category"],
        inside_zone=inside_resp,
        nearest_warning_zone=nearest_resp,
        distance_to_danger_meters=eval_result["distance_to_danger_meters"],
        alert_triggered=(eval_result["alert_severity"] is not None),
        alert_severity=eval_result["alert_severity"],
        instructions=eval_result["instructions"]
    )
