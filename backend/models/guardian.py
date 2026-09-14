import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Float, Integer, Text
from sqlalchemy.orm import relationship
from database import Base

class GuardianProfile(Base):
    __tablename__ = "guardian_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    verification_status = Column(String(50), default="verified")  # pending, verified, suspended
    verified_by_authority_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    service_radius_km = Column(Float, default=5.0)
    current_lat = Column(Float, nullable=False, default=11.4102)
    current_lng = Column(Float, nullable=False, default=76.6950)
    is_available = Column(Boolean, default=True)
    phone = Column(String(50), nullable=False)
    volunteer_type = Column(String(100), default="Local Trekking Guide / Resident")
    badges_count = Column(Integer, default=12)

    user = relationship("User", foreign_keys=[user_id], back_populates="guardian_profile")
    assignments = relationship("GuardianAssignment", back_populates="guardian")

class GuardianAssignment(Base):
    __tablename__ = "guardian_assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String(36), ForeignKey("sos_incidents.id", ondelete="CASCADE"), nullable=False)
    guardian_id = Column(String(36), ForeignKey("guardian_profiles.id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="notified")  # notified, accepted, declined, on_scene, completed
    distance_km = Column(Float, default=1.2)
    notes = Column(Text, nullable=True)

    incident = relationship("SOSIncident", back_populates="guardian_assignments")
    guardian = relationship("GuardianProfile", back_populates="assignments")
