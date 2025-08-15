from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

class ProfileType(enum.Enum):
    GESTION_PORTEFEUILLE_BOURSIER = "gestion_portefeuille_boursier"
    LECTURE_INDICATEURS_TECHNIQUES = "lecture_indicateurs_techniques"
    SIMULATION_LEVEE_FONDS = "simulation_levee_fonds"

class LearningStage(enum.Enum):
    FUNDAMENTALS = "fundamentals"
    PROFILE_SELECTION = "profile_selection"
    SPECIALIZED_LEARNING = "specialized_learning"
    COMPLETED = "completed"

class Domain(Base):
    __tablename__ = "domains"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text)
    order_index = Column(Integer, nullable=False)  # Order of domains (1-7)
    is_fundamental = Column(Boolean, default=False)  # True for fundamental concepts
    
    # Relationships
    concepts = relationship("Concept", back_populates="domain")

class Concept(Base):
    __tablename__ = "concepts"
    
    id = Column(Integer, primary_key=True, index=True)
    domain_id = Column(Integer, ForeignKey("domains.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    order_index = Column(Integer, nullable=False)  # Order within domain
    is_fundamental = Column(Boolean, default=False)  # True for fundamental concepts
    
    # Prerequisites
    prerequisite_concepts = Column(JSON)  # List of concept IDs that must be completed first
    
    # Profile requirements
    required_for_profiles = Column(JSON)  # List of profiles this concept is required for
    
    # Relationships
    domain = relationship("Domain", back_populates="concepts")
    missions = relationship("Mission", back_populates="concept")

class Mission(Base):
    __tablename__ = "missions"
    
    id = Column(String, primary_key=True)  # Keep string ID for compatibility
    concept_id = Column(Integer, ForeignKey("concepts.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    difficulty_level = Column(String, nullable=False)  # débutant, intermédiaire, avancé
    
    # Mission content
    content = Column(JSON)  # Mission scenarios, choices, etc.
    
    # Scoring
    max_score = Column(Integer, default=100)
    passing_score = Column(Integer, default=60)
    
    # Relationships
    concept = relationship("Concept", back_populates="missions")

class StudentProfile(Base):
    __tablename__ = "student_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    profile_type = Column(Enum(ProfileType), nullable=False)
    unlocked_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=False)  # Current active profile
    
    # Performance metrics that unlocked this profile
    performance_score = Column(Float)  # Overall performance score when unlocked
    
    # Relationships
    student = relationship("User", back_populates="profiles")

class StudentDomainProgress(Base):
    __tablename__ = "student_domain_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    domain_id = Column(Integer, ForeignKey("domains.id"), nullable=False)
    
    # Progress tracking
    concepts_completed = Column(Integer, default=0)
    total_concepts = Column(Integer, default=0)
    completion_percentage = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    
    # Performance metrics
    average_score = Column(Float, default=0.0)
    total_time_spent = Column(Integer, default=0)  # in seconds
    
    # Relationships
    student = relationship("User")
    domain = relationship("Domain")

class StudentConceptProgress(Base):
    __tablename__ = "student_concept_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    concept_id = Column(Integer, ForeignKey("concepts.id"), nullable=False)
    
    # Progress tracking
    missions_completed = Column(Integer, default=0)
    total_missions = Column(Integer, default=0)
    completion_percentage = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    
    # Performance metrics
    best_score = Column(Float, default=0.0)
    average_score = Column(Float, default=0.0)
    total_attempts = Column(Integer, default=0)
    total_time_spent = Column(Integer, default=0)  # in seconds
    
    # Relationships
    student = relationship("User")
    concept = relationship("Concept")

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    selected_profile = Column(Enum(ProfileType), nullable=True)
    learning_stage = Column(Enum(LearningStage), default=LearningStage.FUNDAMENTALS)
    
    # Performance tracking for recommendations
    fundamentals_score = Column(Float, default=0.0)
    fundamentals_completed = Column(Boolean, default=False)
    fundamentals_completed_at = Column(DateTime)
    
    # Profile selection
    profile_selected_at = Column(DateTime)
    profile_recommendation = Column(Enum(ProfileType), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="user_profile")

class LearningPath(Base):
    __tablename__ = "learning_paths"
    
    id = Column(Integer, primary_key=True, index=True)
    profile_type = Column(Enum(ProfileType), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    
    # Path structure
    phases = Column(JSON)  # List of learning phases with concepts and milestones
    estimated_duration = Column(Integer)  # in hours
    difficulty_level = Column(String, default="intermediate")
    
    # Prerequisites
    required_fundamentals_score = Column(Float, default=70.0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    learning_path_id = Column(Integer, ForeignKey("learning_paths.id"), nullable=False)
    concept_id = Column(Integer, ForeignKey("concepts.id"), nullable=False)
    # Progress tracking
    current_phase = Column(Integer, default=0)
    completed_phases = Column(JSON, default=list)  # List of completed phase indices
    overall_progress = Column(Float, default=0.0)  # 0-100%
    
    # Performance metrics
    phase_scores = Column(JSON, default=dict)  # Phase index -> score mapping
    total_time_spent = Column(Integer, default=0)  # in seconds
    
    # Milestones
    milestones_achieved = Column(JSON, default=list)  # List of milestone IDs
    
    # Status
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    
    # Timestamps
    started_at = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    learning_path = relationship("LearningPath")
