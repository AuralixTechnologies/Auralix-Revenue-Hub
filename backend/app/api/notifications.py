from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Notification
from app.schemas.schemas import NotificationResponse
from app.api.auth import get_current_user, User

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notes = db.query(Notification).order_by(Notification.created_at.desc()).limit(30).all()
    return notes

@router.put("/{notification_id}/read")
def mark_read(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    note = db.query(Notification).filter(Notification.id == notification_id).first()
    if note:
        note.is_read = True
        db.commit()
    return {"message": "Notification marked as read"}
