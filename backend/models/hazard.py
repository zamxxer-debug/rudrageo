import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Float, Text
from database import Base

class HazardReport(Base):
    __tablename__ = "hazard_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reporter_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reporter_name = Column(String(255), nullable=False)
    hazard_type = Column(String(50), nullable=False)  # landslide, flood, broken_road, unsafe_bridge, wildlife, suspicious_activity, lost_person, medical_emergency, infrastructure_damage, other
    description = Column(Text, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    image_url = Column(Text, nullable=True)
    ai_classification = Column(String(100), nullable=True)  # E.g. "Probable Fresh Rockfall"
    ai_confidence = Column(Float, default=0.88)
    status = Column(String(50), default="reported")  # reported, verified, dismissed, resolved
    verified_by_authority = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
