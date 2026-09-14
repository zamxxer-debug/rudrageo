import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from database import Base

class BlockchainRecord(Base):
    __tablename__ = "blockchain_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    record_type = Column(String(50), nullable=False)  # identity_issuance, sos_trigger, incident_resolution, zone_change, rescue_dispatch
    reference_id = Column(String(36), nullable=False, index=True)  # Entity ID (incident_id, drishti_id, etc.)
    incident_id = Column(String(36), ForeignKey("sos_incidents.id", ondelete="SET NULL"), nullable=True)
    canonical_hash = Column(String(66), nullable=False)  # SHA-256 (0x...)
    blockchain_tx_hash = Column(String(66), nullable=False)  # Simulated or EVM transaction hash
    block_number = Column(Integer, nullable=False, default=1000)
    status = Column(String(50), default="simulated")  # anchored, pending, simulated
    timestamp = Column(DateTime, default=datetime.utcnow)
    payload_summary = Column(Text, nullable=True)

    incident = relationship("SOSIncident", back_populates="blockchain_records")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)  # LOGIN, SOS_TRIGGER, ZONE_UPDATE, QR_VERIFIED, RESCUE_ASSIGNED
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(50), nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    user_agent = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details_json = Column(Text, nullable=True)

    user = relationship("User", back_populates="audit_logs")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="warning")  # critical_danger, warning, sos_update, weather_alert, system
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class OfflineSyncQueue(Base):
    __tablename__ = "offline_sync_queue"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    device_id = Column(String(100), nullable=False, index=True)
    local_event_id = Column(String(100), unique=True, nullable=False)
    event_type = Column(String(50), nullable=False)  # SOS_TRIGGER, HAZARD_REPORT, BREADCRUMB
    payload_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    synced_at = Column(DateTime, nullable=True)
    retry_count = Column(Integer, default=0)
    status = Column(String(50), default="synced")  # pending, syncing, synced, failed
