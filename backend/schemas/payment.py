from typing import Optional, Dict
from pydantic import BaseModel

class UPIQRParseRequest(BaseModel):
    qr_payload: str  # E.g. "upi://pay?pa=nilgiris.tea@icici&pn=NilgiriTeaCo&am=450&cu=INR"

class UPIQRParseResponse(BaseModel):
    is_valid_upi: bool
    payee_vpa: Optional[str] = None
    payee_name: Optional[str] = None
    amount_inr: Optional[float] = None
    currency: str = "INR"
    note: Optional[str] = None
    raw_payload: str
    guidance_for_foreign_tourist: str

class UPIIntentRequest(BaseModel):
    amount_inr: float
    merchant_name: str
    merchant_vpa: Optional[str] = "nilgiris.tourism@gov.in"
    foreign_currency: Optional[str] = "USD"  # USD, EUR, GBP, JPY, AUD

class UPIIntentResponse(BaseModel):
    transaction_ref: str
    upi_intent_url: str
    amount_inr: float
    amount_foreign: float
    exchange_rate: float
    foreign_currency: str
    merchant_name: str
    merchant_vpa: str
    qr_payload: str
    compliance_note: str
