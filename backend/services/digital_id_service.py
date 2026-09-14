import base64
import json
import hmac
import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple
from config import settings

class DigitalIdService:
    @staticmethod
    def generate_drishti_id() -> str:
        """Generate official formatted ID e.g. DRS-IN-7F92A1C4"""
        token = uuid.uuid4().hex[:8].upper()
        return f"DRS-IN-{token}"

    @staticmethod
    def create_signature(payload_str: str) -> str:
        """Create HMAC-SHA256 digital signature"""
        return hmac.new(
            settings.SECRET_KEY.encode("utf-8"),
            payload_str.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

    @classmethod
    def issue_credential(
        cls,
        tourist_id: str,
        full_name: str,
        nationality: str,
        destination_name: str,
        emergency_phone: str,
        validity_days: int = 30
    ) -> Tuple[str, str, str, datetime, datetime]:
        """
        Returns:
            drishti_id, qr_signature, qr_payload_encoded, issued_at, expires_at
        """
        drishti_id = cls.generate_drishti_id()
        issued_at = datetime.utcnow()
        expires_at = issued_at + timedelta(days=validity_days)

        canonical_data = {
            "did": drishti_id,
            "tid": tourist_id,
            "name": full_name,
            "nat": nationality,
            "dst": destination_name,
            "emg": emergency_phone,
            "iat": int(issued_at.timestamp()),
            "exp": int(expires_at.timestamp()),
            "iss": "IN-GOV-DRISHTI-AUTH"
        }

        canonical_json = json.dumps(canonical_data, sort_keys=True, separators=(',', ':'))
        signature = cls.create_signature(canonical_json)

        full_credential = {
            "payload": canonical_data,
            "sig": signature
        }

        encoded_payload = base64.urlsafe_b64encode(
            json.dumps(full_credential).encode("utf-8")
        ).decode("utf-8")

        return drishti_id, signature, encoded_payload, issued_at, expires_at

    @classmethod
    def verify_credential_offline(cls, encoded_payload: str) -> Dict[str, Any]:
        """
        Verifies QR payload mathematically without requiring a live database connection.
        """
        try:
            raw_json = base64.urlsafe_b64decode(encoded_payload.encode("utf-8")).decode("utf-8")
            credential = json.loads(raw_json)

            payload_data = credential.get("payload")
            signature = credential.get("sig")

            if not payload_data or not signature:
                return {
                    "is_valid": False,
                    "signature_verified": False,
                    "validity_status": "corrupt",
                    "message": "Malformed QR credential structure"
                }

            # Re-generate canonical JSON and check signature
            canonical_json = json.dumps(payload_data, sort_keys=True, separators=(',', ':'))
            expected_sig = cls.create_signature(canonical_json)

            if not hmac.compare_digest(signature, expected_sig):
                return {
                    "is_valid": False,
                    "signature_verified": False,
                    "validity_status": "invalid_signature",
                    "message": "Tampered or forged digital signature!"
                }

            # Check expiration
            exp_timestamp = payload_data.get("exp", 0)
            now_timestamp = int(datetime.utcnow().timestamp())

            if now_timestamp > exp_timestamp:
                return {
                    "is_valid": False,
                    "signature_verified": True,
                    "validity_status": "expired",
                    "drishti_id": payload_data.get("did"),
                    "tourist_name": payload_data.get("name"),
                    "nationality": payload_data.get("nat"),
                    "message": "Digital ID has expired"
                }

            return {
                "is_valid": True,
                "signature_verified": True,
                "validity_status": "active",
                "drishti_id": payload_data.get("did"),
                "tourist_name": payload_data.get("name"),
                "nationality": payload_data.get("nat"),
                "destination": payload_data.get("dst"),
                "emergency_contact": payload_data.get("emg"),
                "message": "Digital ID successfully verified cryptographically"
            }
        except Exception as e:
            return {
                "is_valid": False,
                "signature_verified": False,
                "validity_status": "error",
                "message": f"Verification error: {str(e)}"
            }

digital_id_service = DigitalIdService()
