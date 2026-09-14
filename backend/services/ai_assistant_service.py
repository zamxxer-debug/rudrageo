import json
from typing import Dict, Any, List, Optional
from config import settings

class AIAssistantService:
    EMERGENCY_KNOWLEDGE_BASE = [
        {
            "keywords": ["landslide", "rockfall", "mud", "slope", "hill slide"],
            "reply": "CRITICAL LANDSLIDE PROTOCOL:\n1. Move AWAY from slopes, stream channels, and ravines immediately.\n2. Watch for sudden signs of movement: cracking trees, muddy river surges, or small falling pebbles.\n3. Do not cross recently fallen debris; the slope above remains unstable.\n4. Seek shelter on stable high ground or a designated concrete emergency bunker.",
            "emergency_alert": True,
            "actions": ["Evacuate Uphill", "Call Nilgiris Control (1077)", "Trigger Emergency SOS"]
        },
        {
            "keywords": ["flood", "water", "river", "stream", "current", "drowning"],
            "reply": "FLOOD SAFETY ADVISORY:\n1. Never attempt to wade, walk, or drive through flowing mountain streams.\n2. In steep valleys, water levels can rise 2 meters in under 5 minutes.\n3. Move perpendicular to the water flow toward higher terrain.",
            "emergency_alert": True,
            "actions": ["Seek Higher Ground", "Stay clear of river banks", "Trigger Emergency SOS"]
        },
        {
            "keywords": ["wildlife", "elephant", "leopard", "bison", "gaur", "animal", "bear"],
            "reply": "WILDLIFE SAFETY ADVISORY (Nilgiris Biosphere):\n1. Maintain at least 100 meters distance. Do not honk, shout, or throw objects.\n2. Never use flash photography; it agitates wild elephants and Indian Gaurs.\n3. Slowly back away without turning your back or making sudden panic movements.\n4. Notify the Forest Department Checkpost immediately.",
            "emergency_alert": False,
            "actions": ["Back Away Slowly", "Notify Forest Ranger: 1800-425-4740", "Stay inside vehicle"]
        },
        {
            "keywords": ["upi", "pay", "payment", "money", "qr", "foreign", "rupee", "inr"],
            "reply": "PAY IN INDIA / UPI GUIDANCE FOR TRAVELERS:\n1. Inbound foreign tourists can access UPI via RBI-approved PPI (Prepaid Payment Instrument) apps like Cheq UPI or Thomas Cook.\n2. You can scan ANY merchant BharatQR / UPI QR code across India directly.\n3. If your payment fails, ensure your daily wallet limit has not been reached, or use your backup international card at authorized terminals.",
            "emergency_alert": False,
            "actions": ["Scan Merchant QR", "View Currency Converter", "Tourist Assist Desk"]
        },
        {
            "keywords": ["lost", "direction", "fog", "mist", "cold", "night"],
            "reply": "LOST / LOW VISIBILITY PROTOCOL:\n1. Stay in place if off-trail; wandering off-trail in heavy Nilgiris mist increases cliff fall risks.\n2. Conserve your mobile battery: turn on Battery Saver and lower screen brightness.\n3. Check your DRISHTI offline map to locate the nearest emergency shelter.\n4. If night is approaching or temperatures drop below 10°C, trigger Emergency SOS.",
            "emergency_alert": True,
            "actions": ["Check Offline Map", "Conserve Phone Battery", "Trigger Emergency SOS"]
        }
    ]

    @classmethod
    async def get_response(
        cls,
        message: str,
        current_lat: Optional[float] = None,
        current_lng: Optional[float] = None,
        current_risk_score: Optional[int] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        msg_lower = message.lower()

        # Check for emergency keywords
        for item in cls.EMERGENCY_KNOWLEDGE_BASE:
            for kw in item["keywords"]:
                if kw in msg_lower:
                    alert_req = item["emergency_alert"] or (current_risk_score is not None and current_risk_score > 70)
                    return {
                        "reply": item["reply"],
                        "emergency_alert_required": alert_req,
                        "suggested_actions": item["actions"],
                        "source": "drishti_deterministic_safety_protocol"
                    }

        # Context-aware general safety response
        is_high_risk = current_risk_score is not None and current_risk_score > 60
        reply = (
            "DRISHTI AI SAFETY ADVISOR:\n"
            "You are currently situated in the Nilgiris mountain division. "
            "Always follow designated tea garden trekking paths and heed warning signs posted by the Nilgiris Police and Forest Department. "
            "For urgent emergencies, police, or medical rescue, please tap the red 'HOLD SOS' button on your screen."
        )
        actions = ["Check Safety Map", "View Emergency Facilities", "Contact Nearest Guardian"]
        if is_high_risk:
            reply += "\n\n[!] CAUTION: Your local risk indicator is currently elevated. Please refrain from solitary travel."

        return {
            "reply": reply,
            "emergency_alert_required": is_high_risk,
            "suggested_actions": actions,
            "source": "drishti_ai_assistant"
        }

ai_assistant_service = AIAssistantService()
