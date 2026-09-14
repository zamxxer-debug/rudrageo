from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.guardian import GuardianProfile, GuardianAssignment
from models.incident import SOSIncident, IncidentEvent
from schemas.guardian import GuardianProfileResponse, GuardianAlertResponse, GuardianStatusUpdate
from services.auth_service import get_current_user, require_roles
from services.geofence_service import geofence_service
from websocket_manager import ws_manager

router = APIRouter(prefix="/api/guardian", tags=["Community Guardian Network"])

@router.get("/profile", response_model=GuardianProfileResponse)
def get_guardian_profile(
    current_user: User = Depends(require_roles(["guardian", "admin"])),
    db: Session = Depends(get_db)
):
    profile = current_user.guardian_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Guardian profile not found.")
    return GuardianProfileResponse(
        id=profile.id,
        user_id=current_user.id,
        full_name=current_user.full_name,
        phone=profile.phone,
        verification_status=profile.verification_status,
        service_radius_km=profile.service_radius_km,
        current_lat=profile.current_lat,
        current_lng=profile.current_lng,
        is_available=profile.is_available,
        volunteer_type=profile.volunteer_type,
        badges_count=profile.badges_count
    )

@router.get("/nearby-alerts", response_model=List[GuardianAlertResponse])
def get_nearby_alerts(
    current_user: User = Depends(require_roles(["guardian", "admin"])),
    db: Session = Depends(get_db)
):
    profile = current_user.guardian_profile
    guardian_lat = profile.current_lat if profile else 11.4102
    guardian_lng = profile.current_lng if profile else 76.6950
    radius_km = profile.service_radius_km if profile else 5.0

    active_incidents = db.query(SOSIncident).filter(
        SOSIncident.status.in_(["triggered", "acknowledged", "assigned", "responding"])
    ).all()

    alerts: List[GuardianAlertResponse] = []
    for inc in active_incidents:
        dist_m = geofence_service.haversine_distance_meters(guardian_lat, guardian_lng, inc.lat, inc.lng)
        dist_km = dist_m / 1000.0

        if dist_km <= radius_km:
            t_user = inc.tourist.user if inc.tourist else None
            t_name = t_user.full_name if t_user else "Tourist in Distress"
            zone_name = inc.active_risk_zone.name if inc.active_risk_zone else "Ghats Road"

            alerts.append(GuardianAlertResponse(
                incident_id=inc.id,
                incident_code=inc.incident_code,
                tourist_name=t_name,
                lat=inc.lat,
                lng=inc.lng,
                distance_km=round(dist_km, 2),
                initial_risk_score=inc.initial_risk_score,
                active_zone_name=zone_name,
                triggered_at=inc.triggered_at.isoformat(),
                status=inc.status
            ))

    return alerts

@router.post("/respond")
async def respond_to_alert(
    data: GuardianStatusUpdate,
    current_user: User = Depends(require_roles(["guardian", "admin"])),
    db: Session = Depends(get_db)
):
    inc = db.query(SOSIncident).filter(SOSIncident.id == data.incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")

    profile = current_user.guardian_profile
    if not profile:
        raise HTTPException(status_code=400, detail="User has no guardian profile.")

    # Check assignment
    assignment = db.query(GuardianAssignment).filter(
        GuardianAssignment.incident_id == inc.id,
        GuardianAssignment.guardian_id == profile.id
    ).first()

    if not assignment:
        assignment = GuardianAssignment(
            incident_id=inc.id,
            guardian_id=profile.id,
            assigned_at=datetime.utcnow(),
            status=data.status,
            notes=data.notes
        )
        db.add(assignment)
    else:
        assignment.status = data.status
        assignment.notes = data.notes

    if data.status == "accepted":
        inc.status = "responding"

    evt = IncidentEvent(
        incident_id=inc.id,
        timestamp=datetime.utcnow(),
        event_type=f"guardian_{data.status}",
        actor_id=current_user.id,
        actor_name=f"Guardian: {current_user.full_name}",
        description=f"Volunteer Guardian {current_user.full_name} reported status: {data.status.upper()}. {data.notes or ''}"
    )
    db.add(evt)
    db.commit()

    await ws_manager.broadcast("GUARDIAN_STATUS_CHANGED", {
        "incident_id": inc.id,
        "guardian_name": current_user.full_name,
        "status": data.status
    })

    return {"success": True, "status": data.status}
