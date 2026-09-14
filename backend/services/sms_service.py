from typing import Dict, Any
from datetime import datetime
from config import settings

class SMSService:
    @classmethod
    def generate_sos_sms_payload(
        cls,
        tourist_id: str,
        drishti_id: str,
        incident_code: str,
        lat: float,
        lng: float,
        risk_score: int,
        active_zone_name: str = "Nilgiris Ghats Sector"
    ) -> Dict[str, Any]:
        """
        Creates government-standard SOS emergency text dispatch payload.
        """
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        verification_link = f"https://drishti.gov.in/verify-sos?inc={incident_code}"

        message_body = (
            f"[SOS] DRISHTI SOS ALERT [SOS]\n"
            f"Tourist ID: {drishti_id}\n"
            f"Incident: {incident_code}\n"
            f"Location: Near {active_zone_name}\n"
            f"Coordinates: {lat:.5f}, {lng:.5f}\n"
            f"Risk Level: {risk_score}/100 (CRITICAL)\n"
            f"Time: {now_str}\n"
            f"Emergency Dashboard: {verification_link}"
        )

        return {
            "incident_code": incident_code,
            "drishti_id": drishti_id,
            "message_body": message_body,
            "sender_id": "GOV-DRS-SOS",
            "dispatch_status": "QUEUED_FOR_BROADCAST" if settings.SMS_PROVIDER == "mock" else "SENT"
        }

sms_service = SMSService()
