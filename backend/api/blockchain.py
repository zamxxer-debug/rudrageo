from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models.blockchain import BlockchainRecord
from services.blockchain_service import blockchain_service

router = APIRouter(prefix="/api/blockchain", tags=["Blockchain Audit Ledger"])

class VerifyIntegrityRequest(BaseModel):
    record_id: str
    current_payload: Dict[str, Any]

@router.get("/records")
def get_blockchain_records(limit: int = 50, db: Session = Depends(get_db)):
    records = db.query(BlockchainRecord).order_by(BlockchainRecord.block_number.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "record_type": r.record_type,
            "reference_id": r.reference_id,
            "incident_id": r.incident_id,
            "canonical_hash": r.canonical_hash,
            "blockchain_tx_hash": r.blockchain_tx_hash,
            "block_number": r.block_number,
            "status": r.status,
            "timestamp": r.timestamp.isoformat(),
            "payload_summary": r.payload_summary
        } for r in records
    ]

@router.get("/incident/{incident_id}")
def get_records_for_incident(incident_id: str, db: Session = Depends(get_db)):
    records = db.query(BlockchainRecord).filter(
        BlockchainRecord.incident_id == incident_id
    ).order_by(BlockchainRecord.block_number.asc()).all()

    return [
        {
            "id": r.id,
            "record_type": r.record_type,
            "canonical_hash": r.canonical_hash,
            "blockchain_tx_hash": r.blockchain_tx_hash,
            "block_number": r.block_number,
            "status": r.status,
            "timestamp": r.timestamp.isoformat(),
            "payload_summary": r.payload_summary
        } for r in records
    ]

@router.post("/verify-integrity")
def verify_record_integrity(data: VerifyIntegrityRequest, db: Session = Depends(get_db)):
    return blockchain_service.verify_record_integrity(
        db=db,
        record_id=data.record_id,
        current_payload=data.current_payload
    )
