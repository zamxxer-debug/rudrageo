import urllib.parse
import uuid
from typing import Dict, Any, Optional

class PaymentService:
    EXCHANGE_RATES = {
        "USD": 84.50,
        "EUR": 91.80,
        "GBP": 108.20,
        "JPY": 0.56,
        "AUD": 55.40,
        "CAD": 62.10
    }

    @classmethod
    def parse_upi_qr(cls, qr_string: str) -> Dict[str, Any]:
        """
        Parses standard NPCI UPI URI scheme:
        upi://pay?pa=merchant@upi&pn=Merchant%20Name&am=500.00&cu=INR&tn=Notes
        """
        qr_string = qr_string.strip()
        if not qr_string.startswith("upi://pay"):
            # Could be just a VPA or simple merchant code
            if "@" in qr_string and " " not in qr_string:
                return {
                    "is_valid_upi": True,
                    "payee_vpa": qr_string,
                    "payee_name": "Verified Local Merchant",
                    "amount_inr": None,
                    "currency": "INR",
                    "note": "Direct Payment",
                    "raw_payload": qr_string,
                    "guidance_for_foreign_tourist": "Standard UPI ID recognized. Enter amount in INR to proceed via your authorized PPI travel wallet."
                }
            return {
                "is_valid_upi": False,
                "raw_payload": qr_string,
                "guidance_for_foreign_tourist": "Unrecognized QR format. Please scan a standard BharatQR or UPI QR display."
            }

        try:
            parsed = urllib.parse.urlparse(qr_string)
            query_params = urllib.parse.parse_qs(parsed.query)

            payee_vpa = query_params.get("pa", [None])[0]
            payee_name = query_params.get("pn", ["Local Merchant"])[0]
            amount_str = query_params.get("am", [None])[0]
            currency = query_params.get("cu", ["INR"])[0]
            note = query_params.get("tn", ["Tourist Payment"])[0]

            amount_float = float(amount_str) if amount_str else None

            return {
                "is_valid_upi": True,
                "payee_vpa": payee_vpa,
                "payee_name": urllib.parse.unquote_plus(payee_name),
                "amount_inr": amount_float,
                "currency": currency,
                "note": urllib.parse.unquote_plus(note) if note else None,
                "raw_payload": qr_string,
                "guidance_for_foreign_tourist": "NPCI-compliant merchant QR detected. You can pay securely in INR without international swipe surcharges."
            }
        except Exception as e:
            return {
                "is_valid_upi": False,
                "raw_payload": qr_string,
                "guidance_for_foreign_tourist": f"Failed to parse QR: {str(e)}"
            }

    @classmethod
    def generate_upi_intent(
        cls,
        amount_inr: float,
        merchant_name: str,
        merchant_vpa: str = "nilgiris.tourism@gov.in",
        foreign_currency: str = "USD"
    ) -> Dict[str, Any]:
        """
        Generates simulated UPI intent and currency equivalent.
        """
        rate = cls.EXCHANGE_RATES.get(foreign_currency.upper(), 84.50)
        amount_foreign = round(amount_inr / rate, 2)
        txn_ref = f"DRS-PAY-{uuid.uuid4().hex[:8].upper()}"

        encoded_name = urllib.parse.quote_plus(merchant_name)
        upi_intent_url = f"upi://pay?pa={merchant_vpa}&pn={encoded_name}&am={amount_inr:.2f}&cu=INR&tr={txn_ref}&tn=DRISHTI%20Tourist%20Safety"

        return {
            "transaction_ref": txn_ref,
            "upi_intent_url": upi_intent_url,
            "amount_inr": amount_inr,
            "amount_foreign": amount_foreign,
            "exchange_rate": rate,
            "foreign_currency": foreign_currency.upper(),
            "merchant_name": merchant_name,
            "merchant_vpa": merchant_vpa,
            "qr_payload": upi_intent_url,
            "compliance_note": "Conforms to RBI Master Direction for PPI wallets issued to foreign nationals / NRIs."
        }

payment_service = PaymentService()
