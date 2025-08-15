from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.domain import StudentDomainProgress, StudentConceptProgress
from models.user import User
from models.progress import Progress
from datetime import datetime
import json

router = APIRouter()

@router.post("/student/{student_id}/complete-concept/{concept_id}")
async def complete_concept(
    student_id: int, 
    concept_id: int, 
    performance_data: dict,
    db: Session = Depends(get_db)
):
    """Mark a concept as completed and update progress"""
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get or create concept progress
    concept_progress = db.query(StudentConceptProgress).filter(
        StudentConceptProgress.student_id == student_id,
        StudentConceptProgress.concept_id == concept_id
    ).first()
    
    if not concept_progress:
        concept_progress = StudentConceptProgress(
            student_id=student_id,
            concept_id=concept_id
        )
        db.add(concept_progress)
    
    # Update concept progress
    concept_progress.missions_completed = performance_data.get("missions_completed", 0)
    concept_progress.total_missions = performance_data.get("total_missions", 0)
    concept_progress.completion_percentage = 100.0
    concept_progress.is_completed = True
    concept_progress.completed_at = datetime.utcnow()
    concept_progress.best_score = performance_data.get("best_score", 0.0)
    concept_progress.average_score = performance_data.get("average_score", 0.0)
    concept_progress.total_attempts = performance_data.get("total_attempts", 1)
    concept_progress.total_time_spent = performance_data.get("time_spent", 0)
    
    # Update domain progress
    await update_domain_progress(student_id, concept_id, db)
    
    # Check if fundamentals are completed
    await check_fundamentals_completion(student_id, db)
    
    # Update overall performance score
    await update_overall_performance(student_id, db)
    
    db.commit()
    
    return {"message": "Concept completed successfully", "concept_progress": concept_progress}

async def update_domain_progress(student_id: int, concept_id: int, db: Session):
    """Update domain progress when a concept is completed"""
    # Load structure to find which domain this concept belongs to
    with open("backend/data/domains_structure.json", "r", encoding="utf-8") as f:
        structure = json.load(f)
    
    domain_id = None
    for domain_data in structure["domains"]:
        for concept_data in domain_data["concepts"]:
            if concept_data["id"] == concept_id:
                domain_id = domain_data["id"]
                break
        if domain_id:
            break
    
    if not domain_id:
        return
    
    # Get or create domain progress
    domain_progress = db.query(StudentDomainProgress).filter(
        StudentDomainProgress.student_id == student_id,
        StudentDomainProgress.domain_id == domain_id
    ).first()
    
    if not domain_progress:
        domain_progress = StudentDomainProgress(
            student_id=student_id,
            domain_id=domain_id
        )
        db.add(domain_progress)
    
    # Count completed concepts in this domain
    domain_concepts = [c["id"] for c in next(d for d in structure["domains"] if d["id"] == domain_id)["concepts"]]
    
    completed_concepts = db.query(StudentConceptProgress).filter(
        StudentConceptProgress.student_id == student_id,
        StudentConceptProgress.concept_id.in_(domain_concepts),
        StudentConceptProgress.is_completed == True
    ).count()
    
    total_concepts = len(domain_concepts)
    
    # Update domain progress
    domain_progress.concepts_completed = completed_concepts
    domain_progress.total_concepts = total_concepts
    domain_progress.completion_percentage = (completed_concepts / total_concepts) * 100.0
    domain_progress.is_completed = completed_concepts == total_concepts
    
    if domain_progress.is_completed and not domain_progress.completed_at:
        domain_progress.completed_at = datetime.utcnow()

async def check_fundamentals_completion(student_id: int, db: Session):
    """Check if all fundamental concepts are completed"""
    with open("backend/data/domains_structure.json", "r", encoding="utf-8") as f:
        structure = json.load(f)
    
    # Get all fundamental concept IDs
    fundamental_concepts = []
    for domain_data in structure["domains"]:
        if domain_data["is_fundamental"]:
            fundamental_concepts.extend([c["id"] for c in domain_data["concepts"] if c["is_fundamental"]])
    
    # Check if all are completed
    completed_fundamentals = db.query(StudentConceptProgress).filter(
        StudentConceptProgress.student_id == student_id,
        StudentConceptProgress.concept_id.in_(fundamental_concepts),
        StudentConceptProgress.is_completed == True
    ).count()
    
    if completed_fundamentals == len(fundamental_concepts):
        student = db.query(User).filter(User.id == student_id).first()
        if not student.fundamentals_completed:
            student.fundamentals_completed = True
            student.fundamentals_completed_at = datetime.utcnow()

async def update_overall_performance(student_id: int, db: Session):
    """Calculate and update overall performance score"""
    concept_progresses = db.query(StudentConceptProgress).filter(
        StudentConceptProgress.student_id == student_id,
        StudentConceptProgress.is_completed == True
    ).all()
    
    if concept_progresses:
        total_score = sum(cp.average_score for cp in concept_progresses)
        average_score = total_score / len(concept_progresses)
        
        student = db.query(User).filter(User.id == student_id).first()
        student.overall_performance_score = average_score

@router.get("/student/{student_id}/performance-summary")
async def get_performance_summary(student_id: int, db: Session = Depends(get_db)):
    """Get comprehensive performance summary for a student"""
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get domain progress
    domain_progress = db.query(StudentDomainProgress).filter(
        StudentDomainProgress.student_id == student_id
    ).all()
    
    # Get concept progress
    concept_progress = db.query(StudentConceptProgress).filter(
        StudentConceptProgress.student_id == student_id
    ).all()
    
    # Calculate statistics
    total_concepts_completed = len([cp for cp in concept_progress if cp.is_completed])
    total_domains_completed = len([dp for dp in domain_progress if dp.is_completed])
    
    return {
        "student_id": student_id,
        "fundamentals_completed": student.fundamentals_completed,
        "overall_performance_score": student.overall_performance_score,
        "total_concepts_completed": total_concepts_completed,
        "total_domains_completed": total_domains_completed,
        "domain_progress": domain_progress,
        "concept_progress": concept_progress
    }
