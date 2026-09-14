from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.hazard import HazardReport
from schemas.hazard import HazardReportCreate, HazardReportResponse
from services.auth_service import get_current_user, require_roles
from websocket_manager import ws_manager

router = APIRouter(prefix="/api/hazards", tags=["Hazard Crowdsourcing"])

@router.post("", response_model=HazardReportResponse)
async def report_hazard(
    data: HazardReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # AI Classification simulation based on description and type
    ai_labels = {
        "landslide": "Verified High-Risk Earth Movement",
        "flood": "Turbulent Water Course Elevation",
        "broken_road": "Severe Subgrade Failure / Pavement Breach",
        "unsafe_bridge": "Structural Instability / Culvert Overflow",
        "wildlife": "Apex Herbivore / Predator Habitat Incursion",
        "cliff": "Exposed Drop / Unstable Overhang"
    }
    predicted_label = ai_labels.get(data.hazard_type, "Unclassified Environmental Obstacle")

    hazard = HazardReport(
        reporter_id=current_user.id,
        reporter_name=current_user.full_name,
        hazard_type=data.hazard_type,
        description=data.description,
        lat=data.lat,
        lng=data.lng,
        image_url=data.image_url,
        ai_classification=predicted_label,
        ai_confidence=0.91,
        status="reported",
        verified_by_authority=False,
        created_at=datetime.utcnow()
    )
    db.add(hazard)
    db.commit()
    db.refresh(hazard)

    await ws_manager.broadcast("NEW_HAZARD_REPORT", {
        "id": hazard.id,
        "hazard_type": hazard.hazard_type,
        "reporter_name": hazard.reporter_name,
        "lat": hazard.lat,
        "lng": hazard.lng,
        "description": hazard.description
    })

    return hazard

@router.get("", response_model=List[HazardReportResponse])
def get_hazards(db: Session = Depends(get_db)):
    return db.query(HazardReport).order_by(HazardReport.created_at.desc()).all()

@router.post("/{hazard_id}/verify")
def verify_hazard(
    hazard_id: str,
    current_user: User = Depends(require_roles(["police", "tourism_officer", "admin"])),
    db: Session = Depends(get_db)
):
    hazard = db.query(HazardReport).filter(HazardReport.id == hazard_id).first()
    if not hazard:
        raise HTTPException(status_code=404, detail="Hazard report not found.")
    hazard.verified_by_authority = True
    hazard.status = "verified"
    db.commit()
    return {"success": True, "message": "Hazard confirmed and flagged for safety broadcast."}
