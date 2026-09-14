from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.tourist import TouristProfile, DigitalIdentity
from schemas.tourist import DigitalIdResponse, QRVerifyRequest, QRVerifyResponse
from services.auth_service import get_current_user, require_roles
from services.digital_id_service import digital_id_service
from services.blockchain_service import blockchain_service

router = APIRouter(prefix="/api/digital-id", tags=["Digital Identity"])

@router.get("/my-id", response_model=DigitalIdResponse)
def get_my_digital_id(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.tourist_profile or not current_user.tourist_profile.digital_identity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No digital tourist identity found for current account."
        )

    did_record = current_user.tourist_profile.digital_identity
    dest_name = current_user.tourist_profile.destination.name if current_user.tourist_profile.destination else "Nilgiris - Ooty"

    return DigitalIdResponse(
        drishti_id=did_record.drishti_id,
        tourist_name=current_user.full_name,
        nationality=current_user.tourist_profile.nationality,
        destination=dest_name,
        issued_at=did_record.issued_at,
        expires_at=did_record.expires_at,
        status=did_record.status,
        qr_signature=did_record.qr_signature,
        qr_payload_encoded=did_record.qr_payload_encoded,
        emergency_contact=current_user.tourist_profile.emergency_phone,
        blood_group=current_user.tourist_profile.blood_group,
        is_foreign_tourist=current_user.tourist_profile.is_foreign_tourist
    )

@router.post("/verify", response_model=QRVerifyResponse)
def verify_qr_code(data: QRVerifyRequest, db: Session = Depends(get_db)):
    """
    Cryptographically verifies scanned DRISHTI QR code.
    Can operate purely offline using HMAC signature verification,
    and also checks revocation status if database connection exists.
    """
    offline_result = digital_id_service.verify_credential_offline(data.qr_payload)

    if not offline_result.get("is_valid"):
        return QRVerifyResponse(
            is_valid=False,
            drishti_id=offline_result.get("drishti_id"),
            tourist_name=offline_result.get("tourist_name"),
            nationality=offline_result.get("nationality"),
            validity_status=offline_result.get("validity_status", "invalid"),
            signature_verified=offline_result.get("signature_verified", False),
            message=offline_result.get("message", "Verification failed")
        )

    # Check database status
    did = offline_result.get("drishti_id")
    record = db.query(DigitalIdentity).filter(DigitalIdentity.drishti_id == did).first()
    if record and record.status == "revoked":
        return QRVerifyResponse(
            is_valid=False,
            drishti_id=did,
            tourist_name=offline_result.get("tourist_name"),
            nationality=offline_result.get("nationality"),
            destination=offline_result.get("destination"),
            validity_status="revoked",
            signature_verified=True,
            message=f"Digital ID has been REVOKED: {record.revoked_reason or 'Authority administrative action'}"
        )

    return QRVerifyResponse(
        is_valid=True,
        drishti_id=did,
        tourist_name=offline_result.get("tourist_name"),
        nationality=offline_result.get("nationality"),
        destination=offline_result.get("destination"),
        validity_status="active",
        emergency_contact=offline_result.get("emergency_contact"),
        signature_verified=True,
        message="Valid and authentic DRISHTI Temporary Tourist ID"
    )

@router.post("/revoke/{drishti_id}")
def revoke_identity(
    drishti_id: str,
    reason: str = "Administrative safety intervention",
    current_user: User = Depends(require_roles(["police", "admin", "tourism_officer"])),
    db: Session = Depends(get_db)
):
    record = db.query(DigitalIdentity).filter(DigitalIdentity.drishti_id == drishti_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Digital ID not found.")

    record.status = "revoked"
    record.revoked_reason = reason
    db.commit()

    # Anchor revocation to blockchain
    blockchain_service.record_event(
        db=db,
        record_type="identity_revocation",
        reference_id=drishti_id,
        event_payload={"drishti_id": drishti_id, "action": "REVOKED", "reason": reason, "by": current_user.full_name}
    )

    return {"success": True, "message": f"Digital ID {drishti_id} revoked."}
