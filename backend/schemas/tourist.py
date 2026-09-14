from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class EmergencyContactCreate(BaseModel):
    name: str
    relationship_type: str
    phone: str
    email: Optional[str] = None
    notify_on_sos: bool = True

class EmergencyContactResponse(BaseModel):
    id: str
    name: str
    relationship_type: str
    phone: str
    email: Optional[str] = None
    notify_on_sos: bool

    class Config:
        from_attributes = True

class DigitalIdResponse(BaseModel):
    drishti_id: str
    tourist_name: str
    nationality: str
    destination: str
    issued_at: datetime
    expires_at: datetime
    status: str
    qr_signature: str
    qr_payload_encoded: str
    emergency_contact: Optional[str] = None
    blood_group: Optional[str] = None
    is_foreign_tourist: bool = False

class QRVerifyRequest(BaseModel):
    qr_payload: str

class QRVerifyResponse(BaseModel):
    is_valid: bool
    drishti_id: Optional[str] = None
    tourist_name: Optional[str] = None
    nationality: Optional[str] = None
    destination: Optional[str] = None
    validity_status: str
    emergency_contact: Optional[str] = None
    signature_verified: bool
    message: str

class LocationUpdate(BaseModel):
    lat: float
    lng: float
    accuracy: Optional[float] = 10.0
    speed: Optional[float] = 0.0
    altitude: Optional[float] = 0.0
