from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

class UserRole(enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Student-specific fields
    level_ai = Column(String, default="Prudent")
    total_score = Column(Integer, default=0)

    fundamentals_completed = Column(Boolean, default=False)
    fundamentals_completed_at = Column(DateTime)
    overall_performance_score = Column(Float, default=0.0)
    
    # Current metrics
    cashflow = Column(Float, default=100.0)
    controle = Column(Float, default=50.0)
    stress = Column(Float, default=10.0)
    rentabilite = Column(Float, default=50.0)
    reputation = Column(Float, default=50.0)
    
    # Relationships
    progress_records = relationship("Progress", back_populates="student")
    metric_history = relationship("MetricHistory", back_populates="student")
    profiles = relationship("StudentProfile", back_populates="student")
    user_profile = relationship("UserProfile", back_populates="user", uselist=False)
    user_progress = relationship("UserProgress", back_populates="user")

class Student(User):
    __mapper_args__ = {
        'polymorphic_identity': UserRole.STUDENT,
    }

class Teacher(User):
    __mapper_args__ = {
        'polymorphic_identity': UserRole.TEACHER,
    }