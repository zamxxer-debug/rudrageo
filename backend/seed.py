import json
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from models.user import User
from models.tourist import TouristProfile, DigitalIdentity, EmergencyContact
from models.zone import Destination, RiskZone, EmergencyFacility, WeatherSnapshot
from models.incident import SOSIncident, IncidentEvent
from models.rescue import RescueTeam, RescueDispatch
from models.guardian import GuardianProfile, GuardianAssignment
from models.hazard import HazardReport
from models.blockchain import BlockchainRecord, AuditLog
from services.auth_service import get_password_hash
from services.digital_id_service import digital_id_service
from services.blockchain_service import blockchain_service

def seed_demo_data(db: Session):
    # Check if already seeded
    if db.query(User).filter(User.email == "admin@rudra.gov.in").first():
        return

    print("[*] Initializing Rudra Database with Realistic Nilgiris / Ooty Geospatial Data...")

    # 1. Create Destination: Nilgiris - Ooty
    ooty = Destination(
        name="Nilgiris - Ooty",
        state="Tamil Nadu",
        country="India",
        center_lat=11.4102,
        center_lng=76.6950,
        default_zoom=13,
        emergency_helpline="112",
        is_active=True
    )
    db.add(ooty)
    db.commit()
    db.refresh(ooty)

    # 2. Risk Zones in Nilgiris
    # Zone 1: Kalhatty Ghat Landslide Zone (High Risk Polygon)
    kalhatty_poly = [
        [11.4480, 76.7080],
        [11.4520, 76.7160],
        [11.4440, 76.7210],
        [11.4390, 76.7130]
    ]
    z1 = RiskZone(
        destination_id=ooty.id,
        zone_code="LS-01",
        name="Kalhatty Ghat Active Landslide Hazard",
        description="Hairpin curves 18 to 26 subject to severe slope failures, falling boulders, and heavy soil slips during precipitation.",
        zone_type="landslide",
        risk_level="high",
        geometry_type="polygon",
        coordinates_json=json.dumps(kalhatty_poly),
        radius_meters=0,
        warning_distance_meters=300.0,
        is_restricted=False,
        safety_instructions="Stay inside vehicle. Do not halt under sheer rock cuts. Watch for water runoff across road."
    )
    db.add(z1)

    # Zone 2: Doddabetta Peak Escarpment (High Risk Polygon)
    doddabetta_poly = [
        [11.4030, 76.7320],
        [11.4060, 76.7390],
        [11.3990, 76.7410],
        [11.3960, 76.7340]
    ]
    z2 = RiskZone(
        destination_id=ooty.id,
        zone_code="LS-02",
        name="Doddabetta Peak Cliff Escarpment",
        description="2,637m altitude ridge with sheer vertical drop and blinding dense fog clouds.",
        zone_type="cliff",
        risk_level="high",
        geometry_type="polygon",
        coordinates_json=json.dumps(doddabetta_poly),
        radius_meters=0,
        warning_distance_meters=250.0,
        is_restricted=False,
        safety_instructions="Dense fog reduces visibility to under 5 meters. Never lean over guard rails."
    )
    db.add(z2)

    # Zone 3: Pykara River Hydro Gorge & Flash Flood (Critical Risk Circle)
    z3 = RiskZone(
        destination_id=ooty.id,
        zone_code="FL-01",
        name="Pykara Waterfalls Rapid Surge Zone",
        description="Sudden surge discharge from Pykara reservoir hydro gates creates catastrophic flash floods in canyon.",
        zone_type="flood",
        risk_level="critical",
        geometry_type="circle",
        coordinates_json=json.dumps([11.4680, 76.5920]),
        radius_meters=250.0,
        warning_distance_meters=400.0,
        is_restricted=True,
        safety_instructions="CRITICAL FLASH FLOOD ZONE. Stepping into river bed is strictly prohibited by order of District Collector."
    )
    db.add(z3)

    # Zone 4: Mukurthi Forest Restricted Wildlife Sanctuary (Critical Restricted)
    mukurthi_poly = [
        [11.3600, 76.5350],
        [11.3680, 76.5600],
        [11.3400, 76.5700],
        [11.3320, 76.5400]
    ]
    z4 = RiskZone(
        destination_id=ooty.id,
        zone_code="FR-01",
        name="Mukurthi Biosphere Strict Wildlife Core",
        description="Dense shola grasslands harboring wild elephant herds and tigers. Zero civilian access without forest permit.",
        zone_type="forest_restricted",
        risk_level="critical",
        geometry_type="polygon",
        coordinates_json=json.dumps(mukurthi_poly),
        radius_meters=0,
        warning_distance_meters=500.0,
        is_restricted=True,
        safety_instructions="RESTRICTED FOREST SANCTUARY. Unauthorized entry incurs prosecution under Wildlife Protection Act."
    )
    db.add(z4)

    # 3. Emergency Facilities
    fac1 = EmergencyFacility(
        destination_id=ooty.id,
        name="Nilgiris District Police Headquarters & B1 Control",
        facility_type="police_station",
        lat=11.4110,
        lng=76.7020,
        contact_number="0423-2442222",
        is_24x7=True
    )
    fac2 = EmergencyFacility(
        destination_id=ooty.id,
        name="Government General Hospital Ooty (Trauma Center)",
        facility_type="hospital",
        lat=11.4150,
        lng=76.6980,
        contact_number="0423-2442212",
        is_24x7=True
    )
    fac3 = EmergencyFacility(
        destination_id=ooty.id,
        name="Kalhatty Forest Checkpost & Rescue Outpost",
        facility_type="forest_checkpost",
        lat=11.4460,
        lng=76.7150,
        contact_number="0423-2443999",
        is_24x7=True
    )
    fac4 = EmergencyFacility(
        destination_id=ooty.id,
        name="Charing Cross Emergency Shelter & Tourist Assistance Hub",
        facility_type="shelter",
        lat=11.4080,
        lng=76.7060,
        contact_number="1077",
        is_24x7=True
    )
    db.add_all([fac1, fac2, fac3, fac4])

    # 4. Rescue Teams
    t1 = RescueTeam(
        name="Nilgiris Mountain Rescue Unit Alpha",
        specialization="mountain_rescue",
        contact_number="94421-12345",
        current_lat=11.4120,
        current_lng=76.7010,
        status="available",
        members_count=6,
        vehicle_type="4x4 High-Clearance Rescue Unimog"
    )
    t2 = RescueTeam(
        name="Nilgiris Rapid Police Flying Patrol",
        specialization="police_patrol",
        contact_number="94421-54321",
        current_lat=11.4250,
        current_lng=76.7090,
        status="available",
        members_count=4,
        vehicle_type="Mahindra Scorpio 4WD Interceptor"
    )
    t3 = RescueTeam(
        name="St. John Mountain Medical First Response",
        specialization="medical_first_response",
        contact_number="94421-99999",
        current_lat=11.4140,
        current_lng=76.6990,
        status="available",
        members_count=3,
        vehicle_type="Cardiac Life Support Ambulance"
    )
    db.add_all([t1, t2, t3])

    # 5. Create System Roles & Seed Users
    # Admin User
    admin = User(
        email="admin@rudra.gov.in",
        phone="9999900001",
        hashed_password=get_password_hash("Admin@123"),
        full_name="Super Admin (Disaster Management Cell)",
        role="admin"
    )
    db.add(admin)

    # Police User
    police = User(
        email="police@rudra.gov.in",
        phone="9999900002",
        hashed_password=get_password_hash("Police@123"),
        full_name="Inspector R. Sundaram",
        role="police"
    )
    db.add(police)

    # Tourism Officer
    tourism_officer = User(
        email="tourism@rudra.gov.in",
        phone="9999900003",
        hashed_password=get_password_hash("Tourism@123"),
        full_name="Priya Sharma (Tourism Officer)",
        role="tourism_officer"
    )
    db.add(tourism_officer)

    # Guardian User
    guardian_user = User(
        email="guardian@rudra.gov.in",
        phone="9999900004",
        hashed_password=get_password_hash("Guardian@123"),
        full_name="Muthu Kumar",
        role="guardian"
    )
    db.add(guardian_user)

    # Tourist User: Sophie Martin (Foreign Tourist from France)
    tourist_user = User(
        email="tourist@rudra.gov.in",
        phone="9999900005",
        hashed_password=get_password_hash("Tourist@123"),
        full_name="Sophie Martin",
        role="tourist"
    )
    db.add(tourist_user)
    db.commit()

    # 6. Guardian Profile
    guardian_prof = GuardianProfile(
        user_id=guardian_user.id,
        verification_status="verified",
        verified_by_authority_id=police.id,
        service_radius_km=6.0,
        current_lat=11.4380,
        current_lng=76.7110,
        is_available=True,
        phone="9999900004",
        volunteer_type="Certified Nilgiris High-Altitude Guide",
        badges_count=18
    )
    db.add(guardian_prof)

    # 7. Tourist Profile (Foreign Tourist with DRISHTI ID)
    tourist_prof = TouristProfile(
        user_id=tourist_user.id,
        nationality="French",
        passport_hash="c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2",
        passport_token="TOK-FR-8492A",
        dob="1996-05-14",
        blood_group="O+",
        emergency_phone="+33 6 12 34 56 78",
        primary_language="English",
        current_destination_id=ooty.id,
        travel_start_date="2026-09-10",
        travel_end_date="2026-09-24",
        accommodation_address="Savoy - IHCL SeleQtions, Sylks Road, Ooty",
        medical_notes_encrypted="Mild asthma inhaler carrier. No known drug allergies.",
        privacy_consent_at=datetime.utcnow(),
        location_sharing_consent="during_trip",
        is_foreign_tourist=True
    )
    db.add(tourist_prof)
    db.commit()
    db.refresh(tourist_prof)

    # Issue fixed demo DRISHTI ID: DRS-IN-7F92A1C4
    did = "DRS-IN-7F92A1C4"
    did_sig = digital_id_service.create_signature(json.dumps({
        "did": did,
        "tid": tourist_prof.id,
        "name": tourist_user.full_name,
        "nat": tourist_prof.nationality,
        "dst": "Nilgiris - Ooty",
        "emg": "+33 6 12 34 56 78",
        "iat": int(datetime.utcnow().timestamp()),
        "exp": int((datetime.utcnow() + timedelta(days=30)).timestamp()),
        "iss": "IN-GOV-DRISHTI-AUTH"
    }, sort_keys=True, separators=(',', ':')))

    d_id = DigitalIdentity(
        drishti_id=did,
        tourist_id=tourist_prof.id,
        qr_signature=did_sig,
        qr_payload_encoded=f"eyJwYXlsb2FkIjp7ImRpZCI6IkRSUy1JTi03RjkyQTFDNCIsIm5hbWUiOiJTb3BoaWUgTWFydGluIiwibmF0IjoiRnJlbmNoIn0sInNpZyI6IntkaWRfc2lnfSJ9",
        issued_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=30),
        status="active"
    )
    db.add(d_id)

    # Emergency Contacts for Sophie
    c1 = EmergencyContact(
        tourist_id=tourist_prof.id,
        name="Antoine Martin (Brother)",
        relationship_type="Family",
        phone="+33 6 98 76 54 32",
        email="antoine.martin@paris.fr",
        notify_on_sos=True,
        priority_order=1
    )
    c2 = EmergencyContact(
        tourist_id=tourist_prof.id,
        name="French Consulate Emergency Desk (Bengaluru)",
        relationship_type="Embassy",
        phone="+91 80 4945 5555",
        email="consulat.bangalore@diplomatie.gouv.fr",
        notify_on_sos=True,
        priority_order=2
    )
    db.add_all([c1, c2])

    # 8. Seed an Active Demo SOS Incident for Police Command Dashboard
    inc1 = SOSIncident(
        incident_code="DRS-INC-02931",
        tourist_id=tourist_prof.id,
        triggered_at=datetime.utcnow() - timedelta(minutes=14),
        lat=11.4425,
        lng=76.7142,
        accuracy_meters=8.0,
        battery_level=42,
        connectivity_mode="online",
        status="acknowledged",
        initial_risk_score=88,
        active_risk_zone_id=z1.id,
        offline_event_id="demo-evt-02931"
    )
    db.add(inc1)
    db.commit()
    db.refresh(inc1)

    # Timeline events for inc1
    e1 = IncidentEvent(
        incident_id=inc1.id,
        timestamp=datetime.utcnow() - timedelta(minutes=14),
        event_type="sos_triggered",
        actor_id=tourist_user.id,
        actor_name=tourist_user.full_name,
        description="SOS triggered by Sophie Martin on Kalhatty Ghat road during heavy rain."
    )
    e2 = IncidentEvent(
        incident_id=inc1.id,
        timestamp=datetime.utcnow() - timedelta(minutes=13),
        event_type="acknowledged",
        actor_id=police.id,
        actor_name=police.full_name,
        description="Incident acknowledged by Inspector Sundaram at Police Command HQ."
    )
    db.add_all([e1, e2])

    # Blockchain anchor for identity and SOS
    blockchain_service.issue_digital_identity(
        db=db,
        drishti_id=did,
        tourist_id=tourist_prof.id,
        identity_payload={"drishti_id": did, "name": tourist_user.full_name, "nat": "French"}
    )
    blockchain_service.record_sos(
        db=db,
        incident_id=inc1.id,
        sos_payload={"incident_code": "DRS-INC-02931", "drishti_id": did, "lat": 11.4425, "lng": 76.7142}
    )

    # Hazard Report
    h1 = HazardReport(
        reporter_id=guardian_user.id,
        reporter_name="Muthu Kumar (Guardian)",
        hazard_type="landslide",
        description="Fresh rockslide on Kalhatty hairpin curve 21. Partial blockage of descending lane.",
        lat=11.4435,
        lng=76.7138,
        ai_classification="Verified Fresh Slope Movement",
        ai_confidence=0.94,
        status="verified",
        verified_by_authority=True
    )
    db.add(h1)

    db.commit()
    print("[OK] Rudra Database Seed Complete! Demo Accounts & Ooty Region Loaded.")
