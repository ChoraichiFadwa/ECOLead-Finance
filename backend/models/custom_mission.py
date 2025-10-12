from database import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

class CustomMission(Base):
    __tablename__ = "custom_missions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    concept = Column(String, nullable=False)
    level = Column(String, nullable=False)
    description = Column(String, nullable=True)
    choix = Column(JSON, nullable=False, default={})
    feedback = Column(JSON, nullable=False, default={})
    variables_affectees = Column(JSON, nullable=True, default=[])
    tags = Column(JSON, nullable=True, default=[])
    evenements_possibles = Column(JSON, nullable=True, default=[])
    teacher_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    teacher = relationship("Teacher", back_populates="custom_missions")
