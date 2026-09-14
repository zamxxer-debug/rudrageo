import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from database import Base

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tourist_id = Column(String(36), ForeignKey("tourist_profiles.id", ondelete="SET NULL"), nullable=True)
    merchant_name = Column(String(255), nullable=False)
    vpa = Column(String(100), nullable=False)  # merchant@upi
    amount_inr = Column(Float, nullable=False)
    currency_converted = Column(String(50), nullable=True)  # E.g. "50.00 EUR -> 4,500.00 INR"
    transaction_intent = Column(String(255), nullable=True)
    status = Column(String(50), default="completed")  # initiated, pending, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)
