from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.tourist import TouristProfile, EmergencyContact, LocationBreadcrumb
from schemas.tourist import EmergencyContactCreate, EmergencyContactResponse, LocationUpdate
from services.auth_service import get_current_user

router = APIRouter(prefix="/api/tourists", tags=["Tourist Profile"])

@router.get("/contacts", response_model=List[EmergencyContactResponse])
def get_contacts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.tourist_profile:
        return []
    return current_user.tourist_profile.emergency_contacts

@router.post("/contacts", response_model=EmergencyContactResponse)
def add_contact(data: EmergencyContactCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.tourist_profile:
        raise HTTPException(status_code=400, detail="User does not have a tourist profile.")

    contact = EmergencyContact(
        tourist_id=current_user.tourist_profile.id,
        name=data.name,
        relationship_type=data.relationship_type,
        phone=data.phone,
        email=data.email,
        notify_on_sos=data.notify_on_sos,
        priority_order=len(current_user.tourist_profile.emergency_contacts) + 1
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact

@router.post("/location")
def update_location(data: LocationUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.tourist_profile:
        return {"status": "ignored", "reason": "No tourist profile"}

    consent = current_user.tourist_profile.location_sharing_consent
    if consent == "never":
        return {"status": "ignored", "reason": "User opted out of location tracking"}

    breadcrumb = LocationBreadcrumb(
        tourist_id=current_user.tourist_profile.id,
        lat=data.lat,
        lng=data.lng,
        accuracy=data.accuracy,
        speed=data.speed,
        altitude=data.altitude,
        recorded_at=datetime.utcnow(),
        is_emergency_only=(consent == "emergency_only")
    )
    db.add(breadcrumb)
    db.commit()
    return {"status": "recorded", "lat": data.lat, "lng": data.lng}
