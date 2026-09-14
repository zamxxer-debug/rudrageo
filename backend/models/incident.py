import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Float, Integer, Text
from sqlalchemy.orm import relationship
from database import Base

class SOSIncident(Base):
    __tablename__ = "sos_incidents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_code = Column(String(50), unique=True, index=True, nullable=False)  # DRS-INC-02931
    tourist_id = Column(String(36), ForeignKey("tourist_profiles.id", ondelete="CASCADE"), nullable=False)
    triggered_at = Column(DateTime, default=datetime.utcnow)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    accuracy_meters = Column(Float, default=10.0)
    battery_level = Column(Integer, default=85)
    connectivity_mode = Column(String(50), default="online")  # online, synced_from_offline, sms_fallback
    status = Column(String(50), default="triggered", index=True)  # triggered, acknowledged, assigned, responding, rescued, closed, cancelled
    initial_risk_score = Column(Integer, default=75)
    active_risk_zone_id = Column(String(36), ForeignKey("risk_zones.id"), nullable=True)
    offline_event_id = Column(String(100), unique=True, nullable=True)  # Idempotency token from client IndexedDB
    cancellation_reason = Column(String(255), nullable=True)
    closed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tourist = relationship("TouristProfile", back_populates="sos_incidents")
    active_risk_zone = relationship("RiskZone", back_populates="incidents")
    timeline_events = relationship("IncidentEvent", back_populates="incident", cascade="all, delete-orphan", order_by="IncidentEvent.timestamp")
    rescue_dispatches = relationship("RescueDispatch", back_populates="incident", cascade="all, delete-orphan")
    guardian_assignments = relationship("GuardianAssignment", back_populates="incident", cascade="all, delete-orphan")
    blockchain_records = relationship("BlockchainRecord", back_populates="incident")

class IncidentEvent(Base):
    __tablename__ = "incident_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String(36), ForeignKey("sos_incidents.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    event_type = Column(String(50), nullable=False)  # sos_triggered, location_updated, acknowledged, guardian_notified, guardian_accepted, rescue_dispatched, team_arrived, tourist_rescued, incident_closed, incident_cancelled
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    actor_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    payload_json = Column(Text, nullable=True)

    incident = relationship("SOSIncident", back_populates="timeline_events")

class RiskScoreLog(Base):
    __tablename__ = "risk_score_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tourist_id = Column(String(36), ForeignKey("tourist_profiles.id", ondelete="CASCADE"), nullable=False)
    calculated_at = Column(DateTime, default=datetime.utcnow)
    total_score = Column(Integer, nullable=False)  # 0 - 100
    risk_category = Column(String(20), nullable=False)  # safe, caution, high, critical
    factor_breakdown_json = Column(Text, nullable=False)  # Breakdown of location, weather, terrain, connectivity
    explanation_text = Column(Text, nullable=False)  # Human-readable safety intelligence
