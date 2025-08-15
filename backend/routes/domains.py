from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.domain import Domain, Concept, Mission, StudentDomainProgress, StudentConceptProgress, StudentProfile, ProfileType
from models.user import User
from typing import List, Optional
import json

router = APIRouter()

@router.get("/domains")
async def get_all_domains(db: Session = Depends(get_db)):
    """Get all domains with their concepts"""
    domains = db.query(Domain).order_by(Domain.order_index).all()
    return domains

@router.get("/domains/fundamental")
async def get_fundamental_domains(db: Session = Depends(get_db)):
    """Get only fundamental domains and concepts"""
    domains = db.query(Domain).filter(Domain.is_fundamental == True).order_by(Domain.order_index).all()
    return domains

@router.get("/student/{student_id}/learning-path")
async def get_student_learning_path(student_id: int, db: Session = Depends(get_db)):
    """Get personalized learning path for a student"""
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if fundamentals are completed
    if not student.fundamentals_completed:
        # Return fundamental concepts only
        fundamental_domains = db.query(Domain).filter(Domain.is_fundamental == True).order_by(Domain.order_index).all()
        return {
            "phase": "fundamentals",
            "domains": fundamental_domains,
            "available_profiles": [],
            "message": "Complete fundamental concepts to unlock specialized profiles"
        }
    
    # Get available profiles based on performance
    available_profiles = await get_available_profiles(student_id, db)
    
    # Get all domains for advanced learning
    all_domains = db.query(Domain).order_by(Domain.order_index).all()
    
    return {
        "phase": "specialization",
        "domains": all_domains,
        "available_profiles": available_profiles,
        "current_performance": student.overall_performance_score
    }

@router.get("/student/{student_id}/progress")
async def get_student_progress(student_id: int, db: Session = Depends(get_db)):
    """Get detailed progress for a student across all domains"""
    domain_progress = db.query(StudentDomainProgress).filter(
        StudentDomainProgress.student_id == student_id
    ).all()
    
    concept_progress = db.query(StudentConceptProgress).filter(
        StudentConceptProgress.student_id == student_id
    ).all()
    
    return {
        "domain_progress": domain_progress,
        "concept_progress": concept_progress
    }

@router.get("/student/{student_id}/available-profiles")
async def get_available_profiles(student_id: int, db: Session = Depends(get_db)):
    """Get profiles available to unlock for a student"""
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Load profile criteria from JSON
    with open("backend/data/domains_structure.json", "r", encoding="utf-8") as f:
        structure = json.load(f)
    
    available_profiles = []
    
    for profile_key, profile_data in structure["profiles"].items():
        criteria = profile_data["unlock_criteria"]
        
        # Check if student meets criteria
        meets_criteria = True
        reasons = []
        
        # Check fundamentals completion
        if criteria["fundamentals_completion"] and not student.fundamentals_completed:
            meets_criteria = False
            reasons.append("Complete fundamental concepts first")
        
        # Check minimum performance score
        if student.overall_performance_score < criteria["minimum_performance_score"]:
            meets_criteria = False
            reasons.append(f"Achieve {criteria['minimum_performance_score']}% performance score")
        
        # Check required domains completion
        for domain_id in criteria["required_domains_completed"]:
            domain_progress = db.query(StudentDomainProgress).filter(
                StudentDomainProgress.student_id == student_id,
                StudentDomainProgress.domain_id == domain_id
            ).first()
            
            if not domain_progress or not domain_progress.is_completed:
                meets_criteria = False
                domain = db.query(Domain).filter(Domain.id == domain_id).first()
                reasons.append(f"Complete domain: {domain.name if domain else f'Domain {domain_id}'}")
        
        available_profiles.append({
            "profile_type": profile_key,
            "name": profile_data["name"],
            "description": profile_data["description"],
            "available": meets_criteria,
            "requirements_not_met": reasons if not meets_criteria else []
        })
    
    return available_profiles

@router.post("/student/{student_id}/unlock-profile/{profile_type}")
async def unlock_profile(student_id: int, profile_type: str, db: Session = Depends(get_db)):
    """Unlock a specialized profile for a student"""
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Validate profile type
    try:
        profile_enum = ProfileType(profile_type)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid profile type")
    
    # Check if profile is already unlocked
    existing_profile = db.query(StudentProfile).filter(
        StudentProfile.student_id == student_id,
        StudentProfile.profile_type == profile_enum
    ).first()
    
    if existing_profile:
        raise HTTPException(status_code=400, detail="Profile already unlocked")
    
    # Verify student meets criteria (reuse logic from get_available_profiles)
    available_profiles = await get_available_profiles(student_id, db)
    profile_available = next((p for p in available_profiles if p["profile_type"] == profile_type), None)
    
    if not profile_available or not profile_available["available"]:
        raise HTTPException(status_code=400, detail="Student does not meet criteria for this profile")
    
    # Create new profile
    new_profile = StudentProfile(
        student_id=student_id,
        profile_type=profile_enum,
        performance_score=student.overall_performance_score
    )
    
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    
    return {"message": f"Profile {profile_type} unlocked successfully", "profile": new_profile}

@router.post("/student/{student_id}/activate-profile/{profile_type}")
async def activate_profile(student_id: int, profile_type: str, db: Session = Depends(get_db)):
    """Activate a specific profile for a student"""
    try:
        profile_enum = ProfileType(profile_type)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid profile type")
    
    # Deactivate all current profiles
    db.query(StudentProfile).filter(
        StudentProfile.student_id == student_id
    ).update({"is_active": False})
    
    # Activate the requested profile
    profile = db.query(StudentProfile).filter(
        StudentProfile.student_id == student_id,
        StudentProfile.profile_type == profile_enum
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found or not unlocked")
    
    profile.is_active = True
    db.commit()
    
    return {"message": f"Profile {profile_type} activated successfully"}

@router.get("/student/{student_id}/recommended-concepts")
async def get_recommended_concepts(student_id: int, db: Session = Depends(get_db)):
    """Get recommended concepts based on student's progress and active profile"""
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get active profile
    active_profile = db.query(StudentProfile).filter(
        StudentProfile.student_id == student_id,
        StudentProfile.is_active == True
    ).first()
    
    # Get completed concepts
    completed_concepts = db.query(StudentConceptProgress).filter(
        StudentConceptProgress.student_id == student_id,
        StudentConceptProgress.is_completed == True
    ).all()
    
    completed_concept_ids = [cp.concept_id for cp in completed_concepts]
    
    # Load structure to get prerequisites
    with open("backend/data/domains_structure.json", "r", encoding="utf-8") as f:
        structure = json.load(f)
    
    recommended_concepts = []
    
    # If no active profile, recommend fundamental concepts
    if not active_profile:
        for domain_data in structure["domains"]:
            if domain_data["is_fundamental"]:
                for concept_data in domain_data["concepts"]:
                    if concept_data["id"] not in completed_concept_ids:
                        # Check if prerequisites are met
                        prerequisites_met = all(
                            prereq_id in completed_concept_ids 
                            for prereq_id in concept_data["prerequisite_concepts"]
                        )
                        if prerequisites_met:
                            recommended_concepts.append(concept_data)
    else:
        # Recommend concepts based on active profile
        profile_key = active_profile.profile_type.value
        required_concepts = structure["profiles"][profile_key]["required_concepts"]
        
        for domain_data in structure["domains"]:
            for concept_data in domain_data["concepts"]:
                if (concept_data["id"] in required_concepts and 
                    concept_data["id"] not in completed_concept_ids):
                    # Check if prerequisites are met
                    prerequisites_met = all(
                        prereq_id in completed_concept_ids 
                        for prereq_id in concept_data["prerequisite_concepts"]
                    )
                    if prerequisites_met:
                        recommended_concepts.append(concept_data)
    
    return {
        "recommended_concepts": recommended_concepts[:5],  # Limit to 5 recommendations
        "active_profile": active_profile.profile_type.value if active_profile else None
    }
