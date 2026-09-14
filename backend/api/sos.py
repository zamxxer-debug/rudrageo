import random
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.tourist import TouristProfile, DigitalIdentity
from models.zone import RiskZone
from models.incident import SOSIncident, IncidentEvent
from models.rescue import RescueTeam, RescueDispatch
from models.guardian import GuardianProfile, GuardianAssignment
from schemas.incident import (
    SOSTriggerRequest,
    SOSIncidentResponse,
    TimelineEventResponse,
    IncidentStatusUpdate,
    AssignTeamRequest,
    AssignGuardianRequest
)
from services.auth_service import get_current_user, require_roles
from services.geofence_service import geofence_service
from services.risk_service import risk_service
from services.blockchain_service import blockchain_service
from services.sms_service import sms_service
from websocket_manager import ws_manager

router = APIRouter(prefix="/api/sos", tags=["Emergency SOS Operations"])

def build_incident_response(inc: SOSIncident) -> SOSIncidentResponse:
    tourist_user = inc.tourist.user if inc.tourist else None
    t_name = tourist_user.full_name if tourist_user else "Anonymous Tourist"
    nat = inc.tourist.nationality if inc.tourist else "Unknown"
    phone = tourist_user.phone if tourist_user else None

    zone_name = inc.active_risk_zone.name if inc.active_risk_zone else None

    team_name = None
    if inc.rescue_dispatches:
        team_name = inc.rescue_dispatches[0].team.name

    guardian_name = None
    if inc.guardian_assignments:
        guardian_name = inc.guardian_assignments[0].guardian.user.full_name

    tx_hash = None
    if inc.blockchain_records:
        tx_hash = inc.blockchain_records[-1].blockchain_tx_hash

    timeline_resps = [
        TimelineEventResponse(
            id=ev.id,
            timestamp=ev.timestamp,
            event_type=ev.event_type,
            actor_name=ev.actor_name,
            description=ev.description,
            payload_json=ev.payload_json
        ) for ev in inc.timeline_events
    ]

    return SOSIncidentResponse(
        id=inc.id,
        incident_code=inc.incident_code,
        tourist_id=inc.tourist_id,
        tourist_name=t_name,
        nationality=nat,
        phone=phone,
        triggered_at=inc.triggered_at,
        lat=inc.lat,
        lng=inc.lng,
        accuracy_meters=inc.accuracy_meters,
        battery_level=inc.battery_level,
        connectivity_mode=inc.connectivity_mode,
        status=inc.status,
        initial_risk_score=inc.initial_risk_score,
        active_risk_zone_name=zone_name,
        assigned_team_name=team_name,
        assigned_guardian_name=guardian_name,
        blockchain_tx_hash=tx_hash,
        closed_at=inc.closed_at,
        timeline_events=timeline_resps
    )

@router.post("/trigger", response_model=SOSIncidentResponse)
async def trigger_sos(
    data: SOSTriggerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.tourist_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current user account does not have an active tourist profile."
        )

    profile = current_user.tourist_profile

    # Idempotency check for offline sync retries
    if data.offline_event_id:
        existing = db.query(SOSIncident).filter(SOSIncident.offline_event_id == data.offline_event_id).first()
        if existing:
            return build_incident_response(existing)

    # Check active risk zones
    zones = db.query(RiskZone).all()
    eval_res = geofence_service.evaluate_location(data.lat, data.lng, zones)
    active_zone = eval_res.get("inside_zone") or eval_res.get("nearest_warning_zone")
    zone_id = active_zone.id if active_zone else None

    # Calculate risk
    risk_res = risk_service.calculate_risk(eval_res)
    initial_score = max(risk_res["total_score"], 80)  # SOS indicates high/critical emergency

    code = f"DRS-INC-{random.randint(10000, 99999)}"

    incident = SOSIncident(
        incident_code=code,
        tourist_id=profile.id,
        triggered_at=datetime.utcnow(),
        lat=data.lat,
        lng=data.lng,
        accuracy_meters=data.accuracy_meters or 10.0,
        battery_level=data.battery_level or 85,
        connectivity_mode=data.connectivity_mode or "online",
        status="triggered",
        initial_risk_score=initial_score,
        active_risk_zone_id=zone_id,
        offline_event_id=data.offline_event_id
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    # Timeline event: SOS Triggered
    sos_notes = data.notes if data.notes else "Emergency assistance requested"
    evt = IncidentEvent(
        incident_id=incident.id,
        timestamp=datetime.utcnow(),
        event_type="sos_triggered",
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        description=f"SOS triggered by {current_user.full_name} at coordinates ({data.lat:.5f}, {data.lng:.5f}) via {data.connectivity_mode} channel.",
        payload_json=json.dumps({"battery": data.battery_level, "notes": sos_notes})
    )
    db.add(evt)

    # Blockchain anchoring
    drishti_id = profile.digital_identity.drishti_id if profile.digital_identity else "UNVERIFIED"
    bc_rec = blockchain_service.record_sos(
        db=db,
        incident_id=incident.id,
        sos_payload={
            "incident_code": incident.incident_code,
            "drishti_id": drishti_id,
            "tourist_name": current_user.full_name,
            "lat": incident.lat,
            "lng": incident.lng,
            "initial_risk_score": incident.initial_risk_score,
            "status": "triggered"
        }
    )

    # Generate Emergency SMS dispatch payload
    sms_payload = sms_service.generate_sos_sms_payload(
        tourist_id=profile.id,
        drishti_id=drishti_id,
        incident_code=incident.incident_code,
        lat=incident.lat,
        lng=incident.lng,
        risk_score=incident.initial_risk_score,
        active_zone_name=active_zone.name if active_zone else "Nilgiris Mountain Sector"
    )

    db.commit()
    db.refresh(incident)

    response_data = build_incident_response(incident)

    # Broadcast to Police Command Center and Guardians in Real-Time
    await ws_manager.broadcast("NEW_SOS_INCIDENT", response_data.dict())

    return response_data

@router.get("/active", response_model=List[SOSIncidentResponse])
def get_active_incidents(
    current_user: User = Depends(require_roles(["police", "tourism_officer", "guardian", "admin"])),
    db: Session = Depends(get_db)
):
    incidents = db.query(SOSIncident).filter(
        SOSIncident.status.in_(["triggered", "acknowledged", "assigned", "responding"])
    ).order_by(SOSIncident.triggered_at.desc()).all()

    return [build_incident_response(inc) for inc in incidents]

@router.get("/{incident_id}", response_model=SOSIncidentResponse)
def get_incident_detail(
    incident_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inc = db.query(SOSIncident).filter(SOSIncident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")
    return build_incident_response(inc)

@router.put("/{incident_id}/status", response_model=SOSIncidentResponse)
async def update_incident_status(
    incident_id: str,
    data: IncidentStatusUpdate,
    current_user: User = Depends(require_roles(["police", "admin", "tourism_officer"])),
    db: Session = Depends(get_db)
):
    inc = db.query(SOSIncident).filter(SOSIncident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")

    old_status = inc.status
    inc.status = data.status

    if data.status in ["closed", "rescued"]:
        inc.closed_at = datetime.utcnow()

    # Log timeline event
    evt = IncidentEvent(
        incident_id=inc.id,
        timestamp=datetime.utcnow(),
        event_type=f"status_{data.status}",
        actor_id=current_user.id,
        actor_name=f"{current_user.full_name} ({current_user.role.upper()})",
        description=f"Status advanced from {old_status.upper()} to {data.status.upper()}. {data.notes or ''}",
        payload_json=json.dumps({"reason": data.reason or ""})
    )
    db.add(evt)

    # Blockchain anchor
    blockchain_service.record_incident_update(
        db=db,
        incident_id=inc.id,
        update_payload={
            "incident_code": inc.incident_code,
            "status": data.status,
            "actor": current_user.full_name,
            "role": current_user.role,
            "notes": data.notes or ""
        }
    )

    db.commit()
    db.refresh(inc)

    resp = build_incident_response(inc)
    await ws_manager.broadcast("INCIDENT_UPDATED", resp.dict())
    return resp

@router.post("/{incident_id}/assign-team", response_model=SOSIncidentResponse)
async def assign_rescue_team(
    incident_id: str,
    data: AssignTeamRequest,
    current_user: User = Depends(require_roles(["police", "admin"])),
    db: Session = Depends(get_db)
):
    inc = db.query(SOSIncident).filter(SOSIncident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")

    team = db.query(RescueTeam).filter(RescueTeam.id == data.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Rescue team not found.")

    dispatch = RescueDispatch(
        incident_id=inc.id,
        team_id=team.id,
        dispatched_at=datetime.utcnow(),
        status="dispatched",
        notes=data.notes
    )
    db.add(dispatch)

    team.status = "assigned"
    inc.status = "assigned"

    evt = IncidentEvent(
        incident_id=inc.id,
        timestamp=datetime.utcnow(),
        event_type="rescue_dispatched",
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        description=f"Rescue team '{team.name}' ({team.specialization}) dispatched to coordinates ({inc.lat:.5f}, {inc.lng:.5f}).",
        payload_json=f'{{"team_name": "{team.name}", "contact": "{team.contact_number}"}}'
    )
    db.add(evt)

    blockchain_service.record_incident_update(
        db=db,
        incident_id=inc.id,
        update_payload={
            "incident_code": inc.incident_code,
            "action": "RESCUE_DISPATCHED",
            "team": team.name,
            "by": current_user.full_name
        }
    )

    db.commit()
    db.refresh(inc)

    resp = build_incident_response(inc)
    await ws_manager.broadcast("INCIDENT_UPDATED", resp.dict())
    return resp

@router.post("/{incident_id}/assign-guardian", response_model=SOSIncidentResponse)
async def assign_guardian(
    incident_id: str,
    data: AssignGuardianRequest,
    current_user: User = Depends(require_roles(["police", "admin"])),
    db: Session = Depends(get_db)
):
    inc = db.query(SOSIncident).filter(SOSIncident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")

    guardian = db.query(GuardianProfile).filter(GuardianProfile.id == data.guardian_id).first()
    if not guardian:
        raise HTTPException(status_code=404, detail="Community guardian not found.")

    assignment = GuardianAssignment(
        incident_id=inc.id,
        guardian_id=guardian.id,
        assigned_at=datetime.utcnow(),
        status="notified",
        distance_km=1.1,
        notes=data.notes
    )
    db.add(assignment)

    evt = IncidentEvent(
        incident_id=inc.id,
        timestamp=datetime.utcnow(),
        event_type="guardian_notified",
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        description=f"Nearby verified community guardian {guardian.user.full_name} alerted (~1.1 km away).",
        payload_json=f'{{"guardian_name": "{guardian.user.full_name}", "phone": "{guardian.phone}"}}'
    )
    db.add(evt)

    db.commit()
    db.refresh(inc)

    resp = build_incident_response(inc)
    await ws_manager.broadcast("INCIDENT_UPDATED", resp.dict())
    return resp

@router.post("/{incident_id}/cancel", response_model=SOSIncidentResponse)
async def cancel_sos(
    incident_id: str,
    reason: str = "False alarm or resolved by tourist",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inc = db.query(SOSIncident).filter(SOSIncident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")

    inc.status = "cancelled"
    inc.cancellation_reason = reason
    inc.closed_at = datetime.utcnow()

    evt = IncidentEvent(
        incident_id=inc.id,
        timestamp=datetime.utcnow(),
        event_type="incident_cancelled",
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        description=f"SOS cancelled by {current_user.full_name}. Reason: {reason}",
        payload_json=json.dumps({"cancellation_reason": reason})
    )
    db.add(evt)

    blockchain_service.record_incident_update(
        db=db,
        incident_id=inc.id,
        update_payload={"incident_code": inc.incident_code, "action": "CANCELLED", "reason": reason}
    )

    db.commit()
    db.refresh(inc)

    resp = build_incident_response(inc)
    await ws_manager.broadcast("INCIDENT_UPDATED", resp.dict())
    return resp
