from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.domain import UserProfile, LearningPath
from pydantic import BaseModel
from typing import List, Optional
import json

router = APIRouter()

class ProfileSelectionRequest(BaseModel):
    user_id: int
    profile_type: str
    performance_score: Optional[float] = None

class ProfileResponse(BaseModel):
    id: int
    user_id: int
    profile_type: str
    is_active: bool
    specialization_unlocked: bool
    performance_score: float

@router.post("/profiles/select", response_model=ProfileResponse)
async def select_profile(request: ProfileSelectionRequest, db: Session = Depends(get_db)):
    """Select a specialized profile for a user"""
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user has completed fundamentals
    if not user.fundamentals_completed:
        raise HTTPException(status_code=400, detail="Must complete fundamentals before selecting profile")
    
    # Validate profile type
    valid_profiles = ["GestiondePortefeuilleBoursier", "LecturedesIndicateursTechniques", "SimulationdeLevéedeFonds"]
    if request.profile_type not in valid_profiles:
        raise HTTPException(status_code=400, detail="Invalid profile type")
    
    # Deactivate existing profiles
    db.query(UserProfile).filter(UserProfile.user_id == request.user_id).update({"is_active": False})
    
    # Create new profile
    profile = UserProfile(
        user_id=request.user_id,
        profile_type=request.profile_type,
        is_active=True,
        specialization_unlocked=True,
        performance_score=request.performance_score or 0.0
    )
    
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    return profile

@router.get("/profiles/{user_id}", response_model=List[ProfileResponse])
async def get_user_profiles(user_id: int, db: Session = Depends(get_db)):
    """Get all profiles for a user"""
    profiles = db.query(UserProfile).filter(UserProfile.user_id == user_id).all()
    return profiles

@router.get("/profiles/{user_id}/active", response_model=Optional[ProfileResponse])
async def get_active_profile(user_id: int, db: Session = Depends(get_db)):
    """Get the active profile for a user"""
    profile = db.query(UserProfile).filter(
        UserProfile.user_id == user_id,
        UserProfile.is_active == True
    ).first()
    return profile

@router.put("/profiles/{profile_id}/performance")
async def update_performance(profile_id: int, performance_score: float, db: Session = Depends(get_db)):
    """Update performance score for a profile"""
    profile = db.query(UserProfile).filter(UserProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile.performance_score = performance_score
    db.commit()
    
    return {"message": "Performance updated successfully"}

@router.get("/profiles/recommendations/{user_id}")
async def get_profile_recommendations(user_id: int, db: Session = Depends(get_db)):
    """Get profile recommendations based on user performance"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.fundamentals_completed:
        return {"message": "Complete fundamentals first", "recommendations": []}
    
    # Simple recommendation logic based on performance
    performance = user.performance_score or 0.0
    
    recommendations = []
    if performance >= 80:
        recommendations = [
            {
                "profile": "GestiondePortefeuilleBoursier",
                "reason": "Excellent analytical skills for portfolio management",
                "match_score": 95
            },
            {
                "profile": "LecturedesIndicateursTechniques", 
                "reason": "Strong technical analysis capabilities",
                "match_score": 85
            }
        ]
    elif performance >= 60:
        recommendations = [
            {
                "profile": "LecturedesIndicateursTechniques",
                "reason": "Good foundation for technical analysis",
                "match_score": 80
            },
            {
                "profile": "SimulationdeLevéedeFonds",
                "reason": "Practical approach to finance learning",
                "match_score": 75
            }
        ]
    else:
        recommendations = [
            {
                "profile": "SimulationdeLevéedeFonds",
                "reason": "Hands-on learning approach recommended",
                "match_score": 70
            }
        ]
    
    return {"recommendations": recommendations}
