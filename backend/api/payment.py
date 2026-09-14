from fastapi import APIRouter, Depends
from schemas.payment import (
    UPIQRParseRequest,
    UPIQRParseResponse,
    UPIIntentRequest,
    UPIIntentResponse
)
from services.payment_service import payment_service

router = APIRouter(prefix="/api/payment", tags=["Foreign Tourist UPI & Payments"])

@router.post("/parse-qr", response_model=UPIQRParseResponse)
def parse_merchant_qr(data: UPIQRParseRequest):
    result = payment_service.parse_upi_qr(data.qr_payload)
    return UPIQRParseResponse(
        is_valid_upi=result["is_valid_upi"],
        payee_vpa=result.get("payee_vpa"),
        payee_name=result.get("payee_name"),
        amount_inr=result.get("amount_inr"),
        currency=result.get("currency", "INR"),
        note=result.get("note"),
        raw_payload=result["raw_payload"],
        guidance_for_foreign_tourist=result["guidance_for_foreign_tourist"]
    )

@router.post("/generate-intent", response_model=UPIIntentResponse)
def generate_payment_intent(data: UPIIntentRequest):
    result = payment_service.generate_upi_intent(
        amount_inr=data.amount_inr,
        merchant_name=data.merchant_name,
        merchant_vpa=data.merchant_vpa or "nilgiris.tourism@gov.in",
        foreign_currency=data.foreign_currency or "USD"
    )
    return UPIIntentResponse(**result)

@router.get("/exchange-rates")
def get_exchange_rates():
    return {
        "base": "INR",
        "rates": payment_service.EXCHANGE_RATES,
        "compliance": "NPCI / RBI Authorized Foreign Inbound Traveler Exchange Reference Rates"
    }
