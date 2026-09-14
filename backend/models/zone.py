import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Float, Integer, Text
from sqlalchemy.orm import relationship
from database import Base

class Destination(Base):
    __tablename__ = "destinations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), unique=True, nullable=False)
    state = Column(String(100), nullable=False)
    country = Column(String(100), default="India")
    center_lat = Column(Float, nullable=False)
    center_lng = Column(Float, nullable=False)
    default_zoom = Column(Integer, default=13)
    emergency_helpline = Column(String(50), default="112")
    is_active = Column(Boolean, default=True)

    tourists = relationship("TouristProfile", back_populates="destination")
    risk_zones = relationship("RiskZone", back_populates="destination", cascade="all, delete-orphan")
    facilities = relationship("EmergencyFacility", back_populates="destination", cascade="all, delete-orphan")
    weather_snapshots = relationship("WeatherSnapshot", back_populates="destination", cascade="all, delete-orphan")

class RiskZone(Base):
    __tablename__ = "risk_zones"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    destination_id = Column(String(36), ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False)
    zone_code = Column(String(50), unique=True, index=True, nullable=False)  # LS-01, CL-02, etc.
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    zone_type = Column(String(50), nullable=False)  # landslide, cliff, flood, avalanche, wildlife, border_military, forest_restricted, general_hazard
    risk_level = Column(String(20), nullable=False)  # low, medium, high, critical
    geometry_type = Column(String(20), default="polygon")  # circle, polygon
    coordinates_json = Column(Text, nullable=False)  # GeoJSON string or polygon coordinates [[lat, lng], ...]
    radius_meters = Column(Float, default=0.0)  # For circle zones
    warning_distance_meters = Column(Float, default=250.0)  # Proximity buffer for warning triggers
    is_restricted = Column(Boolean, default=False)
    active_from = Column(String(20), nullable=True)
    active_until = Column(String(20), nullable=True)
    safety_instructions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    destination = relationship("Destination", back_populates="risk_zones")
    incidents = relationship("SOSIncident", back_populates="active_risk_zone")

class EmergencyFacility(Base):
    __tablename__ = "emergency_facilities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    destination_id = Column(String(36), ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    facility_type = Column(String(50), nullable=False)  # police_station, hospital, shelter, forest_checkpost, tourism_office
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    contact_number = Column(String(50), nullable=False)
    is_24x7 = Column(Boolean, default=True)

    destination = relationship("Destination", back_populates="facilities")

class WeatherSnapshot(Base):
    __tablename__ = "weather_snapshots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    destination_id = Column(String(36), ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    temperature_c = Column(Float, default=21.0)
    rainfall_mm = Column(Float, default=0.0)
    wind_speed_kmh = Column(Float, default=10.0)
    visibility_meters = Column(Float, default=5000.0)
    weather_condition = Column(String(100), default="Clear")
    disaster_warning_text = Column(String(255), nullable=True)

    destination = relationship("Destination", back_populates="weather_snapshots")
