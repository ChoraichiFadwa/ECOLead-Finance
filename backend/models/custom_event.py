from sqlalchemy import Column, String, JSON, Integer
from database import Base
from datetime import datetime

class Event(Base):
    __tablename__ = "custom_events"
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    context = Column(JSON, nullable=True)
    conditions = Column(JSON, nullable=True)
    modifie_choix = Column(JSON, nullable=True)
    teacher_id = Column(Integer, nullable=False)
    created_at = Column(String, default=datetime.utcnow)
