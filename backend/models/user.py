from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum
from models.profile import ProfileType, PROFILE_LABELS

class UserRole(enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(Enum(UserRole), nullable=False) # for the front usage
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Single table inheritance discriminator
    type = Column(String, nullable=False)
    # Relationships
    progress_records = relationship("Progress", back_populates="student")
    metric_history = relationship("MetricHistory", back_populates="student")
   

    __mapper_args__ = {
        'polymorphic_on': type,
        'polymorphic_identity': 'user'
    }


class Student(User):
        # Student-specific fields
    level_ai = Column(String, default="Prudent")
    total_score = Column(Integer, default=0)
    
    # Current metrics
    cashflow = Column(Float, default=100.0)
    controle = Column(Float, default=50.0)
    stress = Column(Float, default=10.0)
    rentabilite = Column(Float, default=50.0)
    reputation = Column(Float, default=50.0)
    profile = Column(Integer, default=-1, nullable=False)
    # to get the string for the front
    @property
    def profile_label(self):
        from models.profile import PROFILE_LABELS, ProfileType
        try:
            return PROFILE_LABELS[ProfileType(self.profile)]
        except (ValueError, KeyError, TypeError):
            return "Choisis un profil"
    
    __mapper_args__ = {
        'polymorphic_identity': UserRole.STUDENT.value, # for database usage 
    }

class Teacher(User):
    __mapper_args__ = {
        'polymorphic_identity': UserRole.TEACHER.value,
    }