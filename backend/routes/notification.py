from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.notification import Notification

router = APIRouter()

# Get all notifications for a specific student
@router.get("/students/{student_id}/notifications")
def get_notifications(
    student_id: int,
    db: Session = Depends(get_db)
):
    notifications = db.query(Notification)\
                      .filter(Notification.student_id == student_id)\
                      .order_by(Notification.created_at.desc())\
                      .all()
    return notifications

# Mark a specific notification as read
@router.post("/students/{student_id}/notifications/{notification_id}/read")
def mark_notification_read(
    student_id: int,
    notification_id: int,
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.student_id == student_id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"status": "ok"}
