import json
from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.tourist import TouristProfile
from models.incident import SOSIncident, IncidentEvent
from models.hazard import HazardReport
from models.blockchain import OfflineSyncQueue
from schemas.sync import SyncBatchRequest, SyncBatchResponse, SyncEventResult
from services.auth_service import get_current_user
from services.blockchain_service import blockchain_service
from services.sms_service import sms_service
from websocket_manager import ws_manager

router = APIRouter(prefix="/api/sync", tags=["Offline Synchronization Engine"])

@router.post("/batch", response_model=SyncBatchResponse)
async def sync_offline_batch(
    batch: SyncBatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    synced_count = 0
    dup_count = 0
    failed_count = 0
    results: List[SyncEventResult] = []

    for item in batch.events:
        # Check idempotency in sync queue
        existing_queue = db.query(OfflineSyncQueue).filter(
            OfflineSyncQueue.local_event_id == item.local_event_id
        ).first()

        if existing_queue:
            dup_count += 1
            results.append(SyncEventResult(
                local_event_id=item.local_event_id,
                status="DUPLICATE_IGNORED",
                server_id=None,
                message="Event already synchronized previously."
            ))
            continue

        try:
            server_id = None
            if item.event_type == "SOS_TRIGGER":
                payload = item.payload
                lat = float(payload.get("lat", 11.4102))
                lng = float(payload.get("lng", 76.6950))
                accuracy = float(payload.get("accuracy_meters", 10.0))
                battery = int(payload.get("battery_level", 85))

                profile = current_user.tourist_profile
                if not profile:
                    raise Exception("No tourist profile for current user")

                code = f"DRS-INC-{datetime.utcnow().strftime('%H%M%S')}"

                incident = SOSIncident(
                    incident_code=code,
                    tourist_id=profile.id,
                    triggered_at=datetime.utcnow(),
                    lat=lat,
                    lng=lng,
                    accuracy_meters=accuracy,
                    battery_level=battery,
                    connectivity_mode="synced_from_offline",
                    status="triggered",
                    initial_risk_score=88,
                    offline_event_id=item.local_event_id
                )
                db.add(incident)
                db.commit()
                db.refresh(incident)
                server_id = incident.id

                evt = IncidentEvent(
                    incident_id=incident.id,
                    timestamp=datetime.utcnow(),
                    event_type="sos_triggered",
                    actor_id=current_user.id,
                    actor_name=current_user.full_name,
                    description=f"Offline SOS synchronized from client device ({batch.device_id}). Triggered locally at {item.client_timestamp}."
                )
                db.add(evt)

                # Blockchain anchor
                drishti_id = profile.digital_identity.drishti_id if profile.digital_identity else "UNVERIFIED"
                blockchain_service.record_sos(
                    db=db,
                    incident_id=incident.id,
                    sos_payload={
                        "incident_code": incident.incident_code,
                        "drishti_id": drishti_id,
                        "lat": lat,
                        "lng": lng,
                        "mode": "synced_from_offline"
                    }
                )

                # Broadcast to command center
                await ws_manager.broadcast("NEW_SOS_INCIDENT", {
                    "id": incident.id,
                    "incident_code": incident.incident_code,
                    "tourist_name": current_user.full_name,
                    "lat": lat,
                    "lng": lng,
                    "status": "triggered",
                    "connectivity_mode": "synced_from_offline",
                    "initial_risk_score": 88
                })

            elif item.event_type == "HAZARD_REPORT":
                payload = item.payload
                hazard = HazardReport(
                    reporter_id=current_user.id,
                    reporter_name=current_user.full_name,
                    hazard_type=payload.get("hazard_type", "other"),
                    description=f"[Synced from Offline] {payload.get('description', '')}",
                    lat=float(payload.get("lat", 11.4102)),
                    lng=float(payload.get("lng", 76.6950)),
                    status="reported",
                    ai_classification="Offline Cached Hazard Report"
                )
                db.add(hazard)
                db.commit()
                db.refresh(hazard)
                server_id = hazard.id

            # Save in sync queue
            queue_item = OfflineSyncQueue(
                device_id=batch.device_id,
                local_event_id=item.local_event_id,
                event_type=item.event_type,
                payload_json=json.dumps(item.payload),
                synced_at=datetime.utcnow(),
                status="synced"
            )
            db.add(queue_item)
            db.commit()

            synced_count += 1
            results.append(SyncEventResult(
                local_event_id=item.local_event_id,
                status="SYNCED",
                server_id=server_id,
                message="Successfully ingested."
            ))

        except Exception as e:
            failed_count += 1
            results.append(SyncEventResult(
                local_event_id=item.local_event_id,
                status="FAILED",
                server_id=None,
                message=str(e)
            ))

    return SyncBatchResponse(
        success=True,
        synced_count=synced_count,
        duplicates_count=dup_count,
        failed_count=failed_count,
        results=results
    )
