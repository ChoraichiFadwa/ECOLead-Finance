from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from database import Base
from models.user import Student
class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False) 
    message = Column(String, nullable=False)
    # target_mission_id = Column(Integer, ForeignKey("missions.id"), nullable=True) 
    target_mission_id = Column(Integer, nullable=True)

    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", foreign_keys=[student_id])

