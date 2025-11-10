from sqlalchemy.orm import Session
from database import get_db
from models.notification import Notification

db: Session = next(get_db())
notif = db.query(Notification).filter_by(message="Test direct").first()
print(notif.id, notif.message)
