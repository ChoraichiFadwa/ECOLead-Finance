from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Progress(Base):
    __tablename__ = "progress"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mission_id = Column(String, nullable=False)
    concept = Column(String, nullable=False)
    level = Column(String, nullable=False)
    
    # Mission completion data
    choices_made = Column(JSON)  # Store the choices as JSON
    score_earned = Column(Integer, default=0)
    time_spent_seconds = Column(Integer, default=0)
    completed_at = Column(DateTime, default=datetime.utcnow)
    
    # Metrics after completion
    cashflow_after = Column(Float)
    controle_after = Column(Float)
    stress_after = Column(Float)
    rentabilite_after = Column(Float)
    reputation_after = Column(Float)
    
    # Relationships
    student = relationship("User", back_populates="progress_records")

class MetricHistory(Base):
    __tablename__ = "metric_history"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    
    # Snapshot of metrics at this time
    cashflow = Column(Float)
    controle = Column(Float)
    stress = Column(Float)
    rentabilite = Column(Float)
    reputation = Column(Float)
    total_score = Column(Integer)
    
    # Context
    mission_id = Column(String)  # Which mission caused this change
    
    # Relationships
    student = relationship("User", back_populates="metric_history")

class ConceptProgress(Base):
    __tablename__ = "concept_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    concept = Column(String, nullable=False)
    # level = Column(String, nullable=False)
    missions_completed = Column(Integer, default=0)
    total_missions = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)