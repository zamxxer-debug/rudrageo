from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    phone: Optional[str] = None
    role: str = "tourist"  # tourist, police, tourism_officer, guardian, admin
    
    # Tourist specific onboarding fields
    nationality: Optional[str] = "Indian"
    passport_number: Optional[str] = None  # Will be salted and hashed, never stored in plaintext
    dob: Optional[str] = None
    blood_group: Optional[str] = None
    destination_name: Optional[str] = "Nilgiris - Ooty"
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = "Family"
    privacy_consent: bool = True
    location_sharing_consent: str = "emergency_only"  # never, during_trip, emergency_only

class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2)
    phone: Optional[str] = None
    role: str = "tourist"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    full_name: str
    email: str
    drishti_id: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    drishti_id: Optional[str] = None
    nationality: Optional[str] = None
    is_foreign_tourist: Optional[bool] = False

    class Config:
        from_attributes = True

class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2)
    phone: Optional[str] = None
    role: str = "tourist"
