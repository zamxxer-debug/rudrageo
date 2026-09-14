import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Float, Integer, Text
from sqlalchemy.orm import relationship
from database import Base

class RescueTeam(Base):
    __tablename__ = "rescue_teams"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), unique=True, nullable=False)
    specialization = Column(String(50), nullable=False)  # mountain_rescue, medical_first_response, police_patrol, disaster_relief
    contact_number = Column(String(50), nullable=False)
    current_lat = Column(Float, nullable=False)
    current_lng = Column(Float, nullable=False)
    status = Column(String(50), default="available")  # available, assigned, en_route, on_scene, off_duty
    members_count = Column(Integer, default=4)
    vehicle_type = Column(String(100), default="4x4 Rescue Ambulance")

    dispatches = relationship("RescueDispatch", back_populates="team")

class RescueDispatch(Base):
    __tablename__ = "rescue_dispatches"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String(36), ForeignKey("sos_incidents.id", ondelete="CASCADE"), nullable=False)
    team_id = Column(String(36), ForeignKey("rescue_teams.id"), nullable=False)
    dispatched_at = Column(DateTime, default=datetime.utcnow)
    arrived_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="dispatched")  # dispatched, en_route, on_scene, completed
    notes = Column(Text, nullable=True)

    incident = relationship("SOSIncident", back_populates="rescue_dispatches")
    team = relationship("RescueTeam", back_populates="dispatches")
