from database import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

class CustomConcept(Base):
    __tablename__ = "custom_concepts"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    description = Column(String)
    profiles = Column(JSON, default=[])
    teacher_id = Column(Integer, ForeignKey("users.id"))
    missions = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)

    teacher = relationship("Teacher", back_populates="custom_concepts")
