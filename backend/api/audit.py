from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.blockchain import AuditLog
from services.auth_service import require_roles

router = APIRouter(prefix="/api/audit", tags=["Security & Audit Logs"])

@router.get("/logs")
def get_audit_logs(
    limit: int = 50,
    current_user: User = Depends(require_roles(["admin", "police"])),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "user_name": l.user.full_name if l.user else "System",
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "ip_address": l.ip_address,
            "timestamp": l.timestamp.isoformat(),
            "details": l.details_json
        } for l in logs
    ]
