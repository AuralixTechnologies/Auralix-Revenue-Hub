from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import AuditLog
from app.schemas.schemas import AuditLogResponse
from app.api.auth import get_current_user, User

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return logs
