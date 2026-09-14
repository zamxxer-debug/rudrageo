import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Float, Integer, Text
from sqlalchemy.orm import relationship
from database import Base

class TouristProfile(Base):
    __tablename__ = "tourist_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    nationality = Column(String(100), nullable=False, default="Indian")
    passport_hash = Column(String(255), nullable=True)  # Salted SHA-256 for foreign tourists
    passport_token = Column(String(255), nullable=True)  # Opaque reference token
    dob = Column(String(20), nullable=True)
    blood_group = Column(String(10), nullable=True)
    emergency_phone = Column(String(50), nullable=True)
    primary_language = Column(String(50), default="English")
    current_destination_id = Column(String(36), ForeignKey("destinations.id"), nullable=True)
    travel_start_date = Column(String(20), nullable=True)
    travel_end_date = Column(String(20), nullable=True)
    accommodation_address = Column(Text, nullable=True)
    medical_notes_encrypted = Column(Text, nullable=True)
    privacy_consent_at = Column(DateTime, default=datetime.utcnow)
    location_sharing_consent = Column(String(50), default="emergency_only")  # never, during_trip, emergency_only
    is_foreign_tourist = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="tourist_profile")
    destination = relationship("Destination", back_populates="tourists")
    digital_identity = relationship("DigitalIdentity", back_populates="tourist", uselist=False, cascade="all, delete-orphan")
    emergency_contacts = relationship("EmergencyContact", back_populates="tourist", cascade="all, delete-orphan")
    breadcrumbs = relationship("LocationBreadcrumb", back_populates="tourist", cascade="all, delete-orphan")
    sos_incidents = relationship("SOSIncident", back_populates="tourist")

class DigitalIdentity(Base):
    __tablename__ = "digital_identities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    drishti_id = Column(String(50), unique=True, index=True, nullable=False)  # DRS-IN-XXXXXX
    tourist_id = Column(String(36), ForeignKey("tourist_profiles.id", ondelete="CASCADE"), unique=True, nullable=False)
    qr_signature = Column(String(255), nullable=False)  # Cryptographic HMAC-SHA256 signature
    qr_payload_encoded = Column(Text, nullable=False)  # Base64 or verifiable QR JSON string
    issued_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    status = Column(String(50), default="active")  # active, revoked, expired
    revoked_reason = Column(String(255), nullable=True)

    tourist = relationship("TouristProfile", back_populates="digital_identity")

class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tourist_id = Column(String(36), ForeignKey("tourist_profiles.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    relationship_type = Column(String(100), nullable=False)  # Family, Friend, Hotel, Embassy, Travel Group
    phone = Column(String(50), nullable=False)
    email = Column(String(255), nullable=True)
    notify_on_sos = Column(Boolean, default=True)
    priority_order = Column(Integer, default=1)

    tourist = relationship("TouristProfile", back_populates="emergency_contacts")

class LocationBreadcrumb(Base):
    __tablename__ = "location_breadcrumbs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tourist_id = Column(String(36), ForeignKey("tourist_profiles.id", ondelete="CASCADE"), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=True)
    speed = Column(Float, nullable=True)
    altitude = Column(Float, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    is_emergency_only = Column(Boolean, default=True)

    tourist = relationship("TouristProfile", back_populates="breadcrumbs")
