import os
import pytest
from fastapi.testclient import TestClient

# Ensure test runs in SQLite test database
os.environ["DATABASE_URL"] = "sqlite:///./test_rudra.db"
os.environ["DEMO_MODE"] = "true"

from main import app
from database import engine, Base, SessionLocal
from seed import seed_demo_data

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()
    yield
    # Cleanup
    if os.path.exists("./test_rudra.db"):
        try:
            os.remove("./test_rudra.db")
        except Exception:
            pass

def test_health_endpoints():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

    response_db = client.get("/health/database")
    assert response_db.status_code == 200
    assert response_db.json()["status"] == "healthy"

def test_demo_login_and_roles():
    # Login as seeded Tourist
    resp_tourist = client.post("/api/auth/login", json={
        "email": "tourist@rudra.gov.in",
        "password": "Tourist@123"
    })
    assert resp_tourist.status_code == 200
    data_t = resp_tourist.json()
    assert data_t["role"] == "tourist"
    assert "access_token" in data_t
    assert data_t["drishti_id"] == "DRS-IN-7F92A1C4"

    # Login as seeded Police Officer
    resp_police = client.post("/api/auth/login", json={
        "email": "police@rudra.gov.in",
        "password": "Police@123"
    })
    assert resp_police.status_code == 200
    assert resp_police.json()["role"] == "police"

def test_foreign_tourist_registration():
    # Register a new foreign tourist (e.g. Liam Smith from Australia)
    resp = client.post("/api/auth/register", json={
        "email": "liam.smith@example.com",
        "password": "SecretPassword123",
        "full_name": "Liam Smith",
        "phone": "+61412345678",
        "role": "tourist",
        "nationality": "Australian",
        "passport_number": "PA87654321",
        "emergency_contact_name": "Sarah Smith",
        "emergency_contact_phone": "+61498765432",
        "destination_name": "Nilgiris - Ooty"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "tourist"
    assert data["drishti_id"] is not None
    assert data["drishti_id"].startswith("DRS-IN-")

def test_digital_id_cryptographic_verification():
    # Login as tourist
    t_login = client.post("/api/auth/login", json={
        "email": "tourist@rudra.gov.in",
        "password": "Tourist@123"
    })
    token = t_login.json()["access_token"]

    # Fetch digital ID
    did_resp = client.get("/api/digital-id/my-id", headers={"Authorization": f"Bearer {token}"})
    assert did_resp.status_code == 200
    did_data = did_resp.json()
    assert did_data["drishti_id"] == "DRS-IN-7F92A1C4"
    assert did_data["is_foreign_tourist"] == True

def test_geofencing_proximity_checks():
    # Coordinates near Kalhatty Ghat landslide zone (11.4420, 76.7120)
    resp_danger = client.post("/api/zones/check-proximity", json={
        "lat": 11.4425,
        "lng": 76.7142
    })
    assert resp_danger.status_code == 200
    danger_data = resp_danger.json()
    assert danger_data["current_risk_score"] > 50
    assert danger_data["alert_triggered"] == True

    # Coordinates in safe central Ooty Botanical Garden area (11.4180, 76.7100)
    resp_safe = client.post("/api/zones/check-proximity", json={
        "lat": 11.4180,
        "lng": 76.7100
    })
    assert resp_safe.status_code == 200
    safe_data = resp_safe.json()
    assert safe_data["current_risk_score"] <= 50

def test_emergency_sos_lifecycle():
    t_login = client.post("/api/auth/login", json={
        "email": "tourist@rudra.gov.in",
        "password": "Tourist@123"
    })
    t_token = t_login.json()["access_token"]

    # 1. Trigger SOS
    sos_resp = client.post(
        "/api/sos/trigger",
        headers={"Authorization": f"Bearer {t_token}"},
        json={
            "lat": 11.4430,
            "lng": 76.7140,
            "battery_level": 38,
            "notes": "Stuck in mudslide near hairpin 22"
        }
    )
    assert sos_resp.status_code == 200
    incident = sos_resp.json()
    assert incident["status"] == "triggered"
    inc_id = incident["id"]

    # 2. Police acknowledges incident
    p_login = client.post("/api/auth/login", json={
        "email": "police@rudra.gov.in",
        "password": "Police@123"
    })
    p_token = p_login.json()["access_token"]

    ack_resp = client.put(
        f"/api/sos/{inc_id}/status",
        headers={"Authorization": f"Bearer {p_token}"},
        json={"status": "acknowledged", "notes": "Inspector Sundaram taking command."}
    )
    assert ack_resp.status_code == 200
    assert ack_resp.json()["status"] == "acknowledged"

    # 3. Police closes incident after rescue
    close_resp = client.put(
        f"/api/sos/{inc_id}/status",
        headers={"Authorization": f"Bearer {p_token}"},
        json={"status": "closed", "notes": "Tourist evacuated safely to Ooty HQ."}
    )
    assert close_resp.status_code == 200
    assert close_resp.json()["status"] == "closed"

def test_offline_sync_deduplication():
    t_login = client.post("/api/auth/login", json={
        "email": "tourist@rudra.gov.in",
        "password": "Tourist@123"
    })
    t_token = t_login.json()["access_token"]

    offline_event_id = "test-offline-uuid-9999"
    sync_payload = {
        "device_id": "iphone-14-pro-tourist",
        "events": [
            {
                "local_event_id": offline_event_id,
                "event_type": "SOS_TRIGGER",
                "payload": {
                    "lat": 11.4420,
                    "lng": 76.7130,
                    "battery_level": 25
                },
                "client_timestamp": "2026-09-14T10:00:00Z"
            }
        ]
    }

    # First sync: should be SYNCED
    resp1 = client.post("/api/sync/batch", headers={"Authorization": f"Bearer {t_token}"}, json=sync_payload)
    assert resp1.status_code == 200
    assert resp1.json()["synced_count"] == 1
    assert resp1.json()["duplicates_count"] == 0

    # Second sync: should be DUPLICATE_IGNORED (Idempotency check)
    resp2 = client.post("/api/sync/batch", headers={"Authorization": f"Bearer {t_token}"}, json=sync_payload)
    assert resp2.status_code == 200
    assert resp2.json()["synced_count"] == 0
    assert resp2.json()["duplicates_count"] == 1

def test_upi_payment_assistance():
    # Test valid merchant QR parsing
    sample_qr = "upi://pay?pa=nilgiris.tea@icici&pn=Nilgiri%20Estate&am=350.00&cu=INR&tn=Fresh%20Tea"
    resp = client.post("/api/payment/parse-qr", json={"qr_payload": sample_qr})
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_valid_upi"] == True
    assert data["payee_vpa"] == "nilgiris.tea@icici"
    assert data["amount_inr"] == 350.00

    # Test UPI intent generation
    intent_resp = client.post("/api/payment/generate-intent", json={
        "amount_inr": 845.0,
        "merchant_name": "Ooty Heritage Resort",
        "foreign_currency": "USD"
    })
    assert intent_resp.status_code == 200
    intent_data = intent_resp.json()
    assert intent_data["amount_foreign"] == 10.0  # 845 / 84.5
    assert intent_data["foreign_currency"] == "USD"
