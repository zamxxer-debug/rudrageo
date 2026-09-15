import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.tourist import TouristProfile, DigitalIdentity, EmergencyContact
from models.zone import Destination
from models.blockchain import AuditLog
from schemas.auth import UserRegister, UserLogin, Token, UserResponse, AdminUserCreate
from services.auth_service import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    hash_passport
)
from services.auth_service import require_roles
from services.digital_id_service import digital_id_service
from services.blockchain_service import blockchain_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(data: UserRegister, db: Session = Depends(get_db)):
    if data.role != "tourist":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Public registration is limited to tourist accounts. An administrator must create staff accounts."
        )
    # Check if email already registered
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )

    # Check if phone registered
    if data.phone:
        existing_phone = db.query(User).filter(User.phone == data.phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number is already registered"
            )

    # Create User
    new_user = User(
        email=data.email,
        phone=data.phone,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        role=data.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    drishti_id = None

    # If role is tourist, create profile & digital ID
    if data.role == "tourist":
        # Resolve destination
        dest = db.query(Destination).filter(Destination.name.ilike(f"%{data.destination_name or 'Nilgiris'}%")).first()
        dest_id = dest.id if dest else None

        is_foreign = (data.nationality.lower() != "indian" and data.nationality.lower() != "india")

        passport_hash_val = None
        if data.passport_number:
            passport_hash_val = hash_passport(data.passport_number)

        profile = TouristProfile(
            user_id=new_user.id,
            nationality=data.nationality or "Indian",
            passport_hash=passport_hash_val,
            passport_token=f"TOK-{uuid.uuid4().hex[:12].upper()}" if data.passport_number else None,
            dob=data.dob,
            blood_group=data.blood_group,
            emergency_phone=data.emergency_contact_phone,
            current_destination_id=dest_id,
            privacy_consent_at=datetime.utcnow(),
            location_sharing_consent=data.location_sharing_consent,
            is_foreign_tourist=is_foreign
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

        # Issue Digital ID (DRS-IN-XXXXXX)
        did, sig, qr_payload, issued_at, expires_at = digital_id_service.issue_credential(
            tourist_id=profile.id,
            full_name=new_user.full_name,
            nationality=profile.nationality,
            destination_name=dest.name if dest else "Nilgiris - Ooty",
            emergency_phone=data.emergency_contact_phone or "112"
        )

        drishti_id = did

        digital_id = DigitalIdentity(
            drishti_id=did,
            tourist_id=profile.id,
            qr_signature=sig,
            qr_payload_encoded=qr_payload,
            issued_at=issued_at,
            expires_at=expires_at,
            status="active"
        )
        db.add(digital_id)

        # Add Emergency Contact if provided
        if data.emergency_contact_name and data.emergency_contact_phone:
            contact = EmergencyContact(
                tourist_id=profile.id,
                name=data.emergency_contact_name,
                relationship_type=data.emergency_contact_relationship or "Family",
                phone=data.emergency_contact_phone,
                notify_on_sos=True,
                priority_order=1
            )
            db.add(contact)

        db.commit()

        # Anchor ID issuance to blockchain
        blockchain_service.issue_digital_identity(
            db=db,
            drishti_id=did,
            tourist_id=profile.id,
            identity_payload={
                "did": did,
                "name": new_user.full_name,
                "nationality": profile.nationality,
                "issued_at": issued_at.isoformat(),
                "expires_at": expires_at.isoformat()
            }
        )

    # Log audit
    audit = AuditLog(
        user_id=new_user.id,
        action="USER_REGISTERED",
        resource_type="user",
        resource_id=new_user.id,
        details_json=f'{{"role": "{data.role}", "drishti_id": "{drishti_id}"}}'
    )
    db.add(audit)
    db.commit()

    token = create_access_token({"sub": new_user.id, "role": new_user.role})

    return Token(
        access_token=token,
        token_type="bearer",
        role=new_user.role,
        user_id=new_user.id,
        full_name=new_user.full_name,
        email=new_user.email,
        drishti_id=drishti_id
    )

@router.get("/users", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    responses = []
    for user in users:
        drishti_id = None
        nationality = "Indian"
        is_foreign = False
        if user.tourist_profile:
            nationality = user.tourist_profile.nationality
            is_foreign = user.tourist_profile.is_foreign_tourist
            if user.tourist_profile.digital_identity:
                drishti_id = user.tourist_profile.digital_identity.drishti_id
        responses.append(UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            role=user.role,
            is_active=user.is_active,
            drishti_id=drishti_id,
            nationality=nationality,
            is_foreign_tourist=is_foreign
        ))
    return responses

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    data: AdminUserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    allowed_roles = {"tourist", "police", "guardian", "tourism_officer", "admin"}
    if data.role not in allowed_roles:
        raise HTTPException(status_code=400, detail="Unsupported user role")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email is already registered")
    if data.phone and db.query(User).filter(User.phone == data.phone).first():
        raise HTTPException(status_code=400, detail="Phone number is already registered")

    new_user = User(
        email=data.email,
        phone=data.phone,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        role=data.role
    )
    db.add(new_user)
    db.flush()
    db.add(AuditLog(
        user_id=current_user.id,
        action="ADMIN_USER_CREATED",
        resource_type="user",
        resource_id=new_user.id,
        details_json=f'{{"email": "{data.email}", "role": "{data.role}"}}'
    ))
    db.commit()
    db.refresh(new_user)
    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        phone=new_user.phone,
        role=new_user.role,
        is_active=new_user.is_active,
        nationality="Indian",
        is_foreign_tourist=False
    )

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )

    drishti_id = None
    if user.tourist_profile and user.tourist_profile.digital_identity:
        drishti_id = user.tourist_profile.digital_identity.drishti_id

    # Log audit
    audit = AuditLog(
        user_id=user.id,
        action="USER_LOGIN",
        resource_type="user",
        resource_id=user.id,
        details_json=f'{{"role": "{user.role}"}}'
    )
    db.add(audit)
    db.commit()

    token = create_access_token({"sub": user.id, "role": user.role})

    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        drishti_id=drishti_id
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    drishti_id = None
    nationality = "Indian"
    is_foreign = False

    if current_user.tourist_profile:
        nationality = current_user.tourist_profile.nationality
        is_foreign = current_user.tourist_profile.is_foreign_tourist
        if current_user.tourist_profile.digital_identity:
            drishti_id = current_user.tourist_profile.digital_identity.drishti_id

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        role=current_user.role,
        is_active=current_user.is_active,
        drishti_id=drishti_id,
        nationality=nationality,
        is_foreign_tourist=is_foreign
    )
