from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.domain import Domain, Concept, UserProgress, UserProfile
from pydantic import BaseModel
from typing import List, Optional, Dict
import json

router = APIRouter()

class LearningStageResponse(BaseModel):
    stage: str  # "fundamentals", "profile_selection", "specialized"
    progress_percentage: float
    next_action: str
    available_content: List[Dict]

class FundamentalsProgressResponse(BaseModel):
    total_concepts: int
    completed_concepts: int
    progress_percentage: float
    current_concept: Optional[Dict]
    next_concepts: List[Dict]

@router.get("/learning-flow/{user_id}/stage", response_model=LearningStageResponse)
async def get_learning_stage(user_id: int, db: Session = Depends(get_db)):
    """Determine current learning stage for user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if fundamentals are completed
    if not user.fundamentals_completed:
        # Count fundamental concepts progress
        fundamental_concepts = db.query(Concept).filter(Concept.is_fundamental == True).all()
        completed_progress = db.query(UserProgress).filter(
            UserProgress.user_id == user_id,
            UserProgress.concept_id.in_([c.id for c in fundamental_concepts]),
            UserProgress.is_completed == True
        ).count()
        
        progress_percentage = (completed_progress / len(fundamental_concepts)) * 100 if fundamental_concepts else 0
        
        return LearningStageResponse(
            stage="fundamentals",
            progress_percentage=progress_percentage,
            next_action="Complete fundamental concepts",
            available_content=[{
                "type": "fundamental_concepts",
                "count": len(fundamental_concepts),
                "completed": completed_progress
            }]
        )
    
    # Check if profile is selected
    active_profile = db.query(UserProfile).filter(
        UserProfile.user_id == user_id,
        UserProfile.is_active == True
    ).first()
    
    if not active_profile:
        return LearningStageResponse(
            stage="profile_selection",
            progress_percentage=100.0,  # Fundamentals completed
            next_action="Select specialization profile",
            available_content=[{
                "type": "profile_options",
                "profiles": ["GestiondePortefeuilleBoursier", "LecturedesIndicateursTechniques", "SimulationdeLevéedeFonds"]
            }]
        )
    
    # User is in specialized learning
    specialized_concepts = db.query(Concept).filter(
        Concept.profile_type == active_profile.profile_type
    ).all()
    
    completed_specialized = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.concept_id.in_([c.id for c in specialized_concepts]),
        UserProgress.is_completed == True
    ).count()
    
    progress_percentage = (completed_specialized / len(specialized_concepts)) * 100 if specialized_concepts else 0
    
    return LearningStageResponse(
        stage="specialized",
        progress_percentage=progress_percentage,
        next_action=f"Continue {active_profile.profile_type} specialization",
        available_content=[{
            "type": "specialized_concepts",
            "profile": active_profile.profile_type,
            "count": len(specialized_concepts),
            "completed": completed_specialized
        }]
    )

@router.get("/learning-flow/{user_id}/fundamentals", response_model=FundamentalsProgressResponse)
async def get_fundamentals_progress(user_id: int, db: Session = Depends(get_db)):
    """Get detailed fundamentals progress"""
    fundamental_concepts = db.query(Concept).filter(Concept.is_fundamental == True).all()
    
    user_progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.concept_id.in_([c.id for c in fundamental_concepts])
    ).all()
    
    progress_dict = {p.concept_id: p for p in user_progress}
    completed_count = sum(1 for p in user_progress if p.is_completed)
    
    # Find current concept (first incomplete)
    current_concept = None
    next_concepts = []
    
    for concept in fundamental_concepts:
        progress = progress_dict.get(concept.id)
        concept_data = {
            "id": concept.id,
            "title": concept.title,
            "description": concept.description,
            "domain": concept.domain.name if concept.domain else None,
            "completed": progress.is_completed if progress else False,
            "score": progress.score if progress else 0
        }
        
        if not current_concept and (not progress or not progress.is_completed):
            current_concept = concept_data
        elif not (progress and progress.is_completed) and len(next_concepts) < 3:
            next_concepts.append(concept_data)
    
    progress_percentage = (completed_count / len(fundamental_concepts)) * 100 if fundamental_concepts else 0
    
    return FundamentalsProgressResponse(
        total_concepts=len(fundamental_concepts),
        completed_concepts=completed_count,
        progress_percentage=progress_percentage,
        current_concept=current_concept,
        next_concepts=next_concepts
    )

@router.post("/learning-flow/{user_id}/complete-fundamentals")
async def complete_fundamentals(user_id: int, db: Session = Depends(get_db)):
    """Mark fundamentals as completed for user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if all fundamental concepts are actually completed
    fundamental_concepts = db.query(Concept).filter(Concept.is_fundamental == True).all()
    completed_progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.concept_id.in_([c.id for c in fundamental_concepts]),
        UserProgress.is_completed == True
    ).count()
    
    if completed_progress < len(fundamental_concepts):
        raise HTTPException(
            status_code=400, 
            detail=f"Must complete all {len(fundamental_concepts)} fundamental concepts. Only {completed_progress} completed."
        )
    
    user.fundamentals_completed = True
    db.commit()
    
    return {"message": "Fundamentals completed successfully", "next_stage": "profile_selection"}

@router.get("/learning-flow/{user_id}/specialized-content")
async def get_specialized_content(user_id: int, db: Session = Depends(get_db)):
    """Get specialized learning content based on user's profile"""
    active_profile = db.query(UserProfile).filter(
        UserProfile.user_id == user_id,
        UserProfile.is_active == True
    ).first()
    
    if not active_profile:
        raise HTTPException(status_code=400, detail="No active profile selected")
    
    # Get concepts for this profile
    specialized_concepts = db.query(Concept).filter(
        Concept.profile_type == active_profile.profile_type
    ).all()
    
    # Get user progress for these concepts
    user_progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.concept_id.in_([c.id for c in specialized_concepts])
    ).all()
    
    progress_dict = {p.concept_id: p for p in user_progress}
    
    content = []
    for concept in specialized_concepts:
        progress = progress_dict.get(concept.id)
        content.append({
            "id": concept.id,
            "title": concept.title,
            "description": concept.description,
            "difficulty_level": concept.difficulty_level,
            "completed": progress.is_completed if progress else False,
            "score": progress.score if progress else 0,
            "prerequisites_met": True  # Simplified for now
        })
    
    return {
        "profile_type": active_profile.profile_type,
        "content": content,
        "total_concepts": len(specialized_concepts),
        "completed_concepts": sum(1 for c in content if c["completed"])
    }
