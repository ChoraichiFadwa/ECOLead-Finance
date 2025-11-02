from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from database import get_db
from models.user import User, UserRole
from models.progress import Progress, MetricHistory
from utils.game_loader import GameLoader
from utils.evaluator import MissionEvaluator
from datetime import datetime
from models.progress import ConceptProgress
from services.predict_ai_profile import run_profiling
from models.notification import Notification
router = APIRouter()
game_loader = GameLoader()
class StudentMissionDetail(BaseModel):
    mission_id: str
    concept: str
    niveau: str
    type: str
    contexte: str
    objectif_pedagogique: str
    choix_etudiant: Dict[str, str]
    score_earned: int
    feedback_auto: Optional[str] = None
    completed_at: Optional[datetime] = None

from models.custom_feedback import Feedback
from models.schemas import FeedbackCreate, FeedbackOut

@router.post("/teachers/{teacher_id}/students/{student_id}/missions/{mission_id}/feedback",response_model=FeedbackOut)
async def add_teacher_feedback(
    teacher_id: int,
    student_id: int,
    mission_id: str,
    feedback: FeedbackCreate,
    db: Session = Depends(get_db)
):
    new_feedback = Feedback(
        teacher_id=teacher_id,
        student_id=student_id,
        mission_id=mission_id,
        comment=feedback.comment
    )
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)

    new_notif = Notification(
        student_id=student_id,
        type="feedback",
        message=f"Vous avez reçu un feedback de votre professeur pour la mission {mission_id}",
        target_mission_id=mission_id
)
    db.add(new_notif)
    db.commit()

    return new_feedback

@router.get("/teachers/{teacher_id}/students/{student_id}/missions", response_model=List[StudentMissionDetail])
async def get_student_missions_for_teacher(
    teacher_id: int,
    student_id: int,
    db: Session = Depends(get_db)
):
    #  Validate teacher
    teacher = db.query(User).filter(User.id == teacher_id, User.role == UserRole.TEACHER).first()
    if not teacher:
        raise HTTPException(status_code=403, detail="Teacher not found or unauthorized")

    #  Validate student
    student = db.query(User).filter(User.id == student_id, User.role == UserRole.STUDENT).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    #  Get all completed missions by this student
    progress_entries = db.query(Progress).filter(Progress.student_id == student_id).all()

    result = []
    for entry in progress_entries:
        mission_data = game_loader.get_mission_by_id(entry.mission_id)
        if not mission_data:
            continue  # skip invalid ids if any

        detail = StudentMissionDetail(
            mission_id=entry.mission_id,
            concept=mission_data.get("concept", ""),
            niveau=mission_data.get("niveau", ""),
            type=mission_data.get("type", ""),
            contexte=mission_data.get("contexte", ""),
            objectif_pedagogique=mission_data.get("objectif_pedagogique", ""),
            choix_etudiant=entry.choices_made,
            score_earned=entry.score_earned,
            feedback_auto=mission_data.get("feedback", {}).get(list(entry.choices_made.values())[0], ""),
            completed_at=entry.created_at if hasattr(entry, "created_at") else None
        )
        result.append(detail)

    return result

@router.get("/students/{student_id}/missions/{mission_id}/feedback")
async def get_feedback(student_id: int, mission_id: str, db: Session = Depends(get_db)):
    feedbacks = db.query(Feedback).filter_by(student_id=student_id, mission_id=mission_id).all()
    return feedbacks


class MissionSubmission(BaseModel):
    mission_id: str
    choices: Dict[str, str]  # e.g., {"main": "A", "event_1": "B"}
    time_spent_seconds: int

class MissionResult(BaseModel):
    success: bool
    score_earned: int
    metrics_changes: Dict[str, float]
    new_metrics: Dict[str, float]
    feedback: str
    level_up: bool = False
    new_level: Optional[str] = None

class ConceptProgressSummary(BaseModel):
    concept: str
    missions_completed: int
    total_missions: int
    is_completed: bool
    profiles: List[int]

class ProgressSummary(BaseModel):
    student_id: int
    # current_level: str
    total_score: int
    missions_completed: int
    current_metrics: Dict[str, float]
    concept_progress: List[ConceptProgressSummary]

class MissionStatus(BaseModel):
    id: str
    completed: bool

class ConceptProgressResponse(BaseModel):
    concept_id: str
    progress_by_level: Dict[str, List[MissionStatus]]


@router.post("/students/{student_id}/missions/{mission_id}/submit", response_model=MissionResult)
async def submit_mission(
    student_id: int, 
    mission_id: str, 
    submission: MissionSubmission, 
    db: Session = Depends(get_db)
      ):
    # Get student
    student = db.query(User).filter(
        User.id == student_id, 
        User.role == UserRole.STUDENT
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if mission already completed
    existing_progress = db.query(Progress).filter(
        Progress.student_id == student_id,
        Progress.mission_id == mission_id
    ).first()
    
    if existing_progress:
        raise HTTPException(status_code=400, detail="Mission already completed")
    
    # Get mission data
    mission = game_loader.get_mission_by_id(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    
    # Get active events for this mission
    events = game_loader.get_active_events_for_mission(mission_id, student)
    
    # Evaluate the mission
    evaluator = MissionEvaluator(game_loader)
    result = evaluator.evaluate_mission(mission, submission.choices, events, student)
    # main_choice = submission.choices.get("main")
    # feedback_map = mission.get("feedback", {})
    # feedback_text = feedback_map.get(main_choice, "")

    
    # Store metrics before changes
    old_metrics = {
        "cashflow": student.cashflow,
        "controle": student.controle,
        "stress": student.stress,
        "rentabilite": student.rentabilite,
        "reputation": student.reputation
    }
    
    # Update student metrics
    student.cashflow += result["metrics_changes"]["cashflow"]
    student.controle += result["metrics_changes"]["controle"]
    student.stress += result["metrics_changes"]["stress"]
    student.rentabilite += result["metrics_changes"]["rentabilite"]
    student.reputation += result["metrics_changes"]["reputation"]
    student.total_score += result["score_earned"]
    
    # Clamp metrics to reasonable bounds
    student.cashflow = max(-100, min(200, student.cashflow))
    student.controle = max(0, min(100, student.controle))
    student.stress = max(0, min(100, student.stress))
    student.rentabilite = max(-50, min(150, student.rentabilite))
    student.reputation = max(0, min(100, student.reputation))
    
    # Create progress record
    progress = Progress(
        student_id=student_id,
        mission_id=mission_id,
        concept=mission["concept"],
        level=mission["niveau"],
        choices_made=submission.choices,
        score_earned=result["score_earned"],
        time_spent_seconds=submission.time_spent_seconds,
        cashflow_after=student.cashflow,
        controle_after=student.controle,
        stress_after=student.stress,
        rentabilite_after=student.rentabilite,
        reputation_after=student.reputation
    )
    db.add(progress)
    db.commit()

    missions_completed_total = db.query(Progress).filter(Progress.student_id == student_id).count()

# Lancer le profilage tous les 8 missions
    print(f"[AI] missions {missions_completed_total}")
    if missions_completed_total % 8 == 0:
        run_profiling(student_id, db)
        print(f"[DEBUG] Profilage exécuté pour l'étudiant {student_id} après {missions_completed_total} missions")
    
    
    
    concept_name = mission["concept"]
    niveau = mission["niveau"]

    concept_progress = db.query(ConceptProgress).filter(
    and_(
        ConceptProgress.student_id == student_id,
        ConceptProgress.concept == concept_name
    )
    ).first()

    if not concept_progress:
        concept_progress = ConceptProgress(
        student_id=student_id,
        concept=concept_name,
        missions_completed=1,
        total_missions=1,  # sera corrigé juste après
        is_completed=False
    )
        db.add(concept_progress)
    else:
        concept_progress.missions_completed += 1

# Mise à jour du total et du statut
    total_missions = len([
        m for m in game_loader.get_all_missions()
        if m["concept"] == concept_name and m["niveau"] == niveau
])
    
    concept_progress.total_missions = total_missions
    
    if total_missions%6==0:
        run_profiling(student_id, db)
        db.commit()
        print(f"[AI] updated profile {run_profiling}")

    if concept_progress.missions_completed >= total_missions:
        concept_progress.is_completed = True
        concept_progress.completed_at = datetime.utcnow()
    
    # Create metric history record
    metric_history = MetricHistory(
        student_id=student_id,
        mission_id=mission_id,
        cashflow=student.cashflow,
        controle=student.controle,
        stress=student.stress,
        rentabilite=student.rentabilite,
        reputation=student.reputation,
        total_score=student.total_score
    )
    
    db.add(metric_history)
    
    # Check for level progression
    # level_up = False
    # new_level = None
    
    # if student.current_level == "débutant":
    #     # Check if all débutant concepts are completed
    #     if _check_level_completion(student_id, "débutant", db):
    #         student.current_level = "intermédiaire"
    #         level_up = True
    #         new_level = "intermédiaire"
    # elif student.current_level == "intermédiaire":
    #     if _check_level_completion(student_id, "intermédiaire", db):
    #         student.current_level = "avancé"
    #         level_up = True
    #         new_level = "avancé"
    
    db.commit()
    
    return MissionResult(
        success=True,
        score_earned=result["score_earned"],
        metrics_changes=result["metrics_changes"],
        new_metrics={
            "cashflow": student.cashflow,
            "controle": student.controle,
            "stress": student.stress,
            "rentabilite": student.rentabilite,
            "reputation": student.reputation
        },
        feedback=result["feedback"]
    )

@router.get("/students/{student_id}/concept-progress", response_model=List[ConceptProgressSummary])
async def get_student_concept_progress(student_id: int, db: Session = Depends(get_db)):
    # Vérifier que l'étudiant existe
    student = db.query(User).filter(
        User.id == student_id,
        User.role == UserRole.STUDENT
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # 1. Récupérer toutes les missions groupées par concept
    all_missions = game_loader.get_all_missions()
    concept_map = {}
    for mission in all_missions:
        concept = mission["concept"]
        if concept not in concept_map:
            concept_map[concept] = []
        concept_map[concept].append(mission)

    concept_metadata = game_loader.concepts
    # 2. Compter les missions complétées par concept
    results = []
    for concept, missions in concept_map.items():
        mission_ids = [m["id"] for m in missions]
        completed_count = db.query(Progress).filter(
            Progress.student_id == student_id,
            Progress.mission_id.in_(mission_ids)
        ).count()
        concept_info = concept_metadata.get(concept, {})
        profiles = concept_info.get("profiles", [])

        results.append(ConceptProgressSummary(
            concept=concept,
            missions_completed=completed_count,
            total_missions=len(mission_ids),
            is_completed=completed_count == len(mission_ids),
            profiles=profiles
        ))

    return results

@router.get("/students/{student_id}/concepts/{concept_id}/progress", response_model=ConceptProgressResponse)
async def get_concept_progress(student_id: str, concept_id: str, db: Session = Depends(get_db)):
    # Vérifier que l'étudiant existe
    student = db.query(User).filter(
        User.id == student_id,
        User.role == UserRole.STUDENT
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")

    missions = game_loader.get_missions_by_concept(concept_id)
    mission_ids = [m["id"] for m in missions]

    # Récupérer les missions complétées par cet étudiant dans ce concept
    completed_progress = db.query(Progress).filter(
        Progress.student_id == student_id,
        Progress.mission_id.in_(mission_ids)
    ).all()

    completed_ids = set(p.mission_id for p in completed_progress)

    # Organiser les missions par niveau
    levels = ["débutant", "intermédiaire", "avancé"]
    progress = {lvl: [] for lvl in levels}

    for mission in missions:
        niveau = mission.get("niveau", "débutant")
        progress[niveau].append(MissionStatus(
            id=mission["id"],
            completed=mission["id"] in completed_ids
        ))

    return ConceptProgressResponse(
        concept_id=concept_id,
        progress_by_level=progress
    )

@router.get("/students/{student_id}/progress", response_model=ProgressSummary)
async def get_student_progress(student_id: int, db: Session = Depends(get_db)):
    student = db.query(User).filter(
        User.id == student_id, 
        User.role == UserRole.STUDENT
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get mission count
    missions_completed = db.query(Progress).filter(
        Progress.student_id == student_id
    ).count()

    concept_progress_rows = db.query(ConceptProgress).filter(
        ConceptProgress.student_id == student_id
    ).all()
    concept_metadata = game_loader.concepts
    concept_progress = [
        ConceptProgressSummary(
            concept=row.concept,
            missions_completed=row.missions_completed,
            total_missions=row.total_missions,
            is_completed=row.is_completed,
            profiles=concept_metadata.get(row.concept, {}).get("profiles", [])
        )
        for row in concept_progress_rows
    ]
    
    # # Facultatif : tu peux ajouter ici un regroupement par concept si tu veux
    # Get level progress
    # levels = ["débutant", "intermédiaire", "avancé"]
    # level_progress = {}
    
    # for level in levels:
    #     missions = game_loader.get_missions_by_level(level)
    #     total_missions = len(missions)
        
    #     completed_missions = db.query(Progress).filter(
    #         Progress.student_id == student_id,
    #         Progress.level == level
    #     ).count()
        
    #     level_progress[level] = {
    #         "completed": completed_missions,
    #         "total": total_missions,
    #         "percentage": (completed_missions / total_missions * 100) if total_missions > 0 else 0
    #     }
    
    return ProgressSummary(
        student_id=student_id,
        # current_level=student.current_level,
        total_score=student.total_score,
        missions_completed=missions_completed,
        current_metrics={
            "cashflow": student.cashflow,
            "controle": student.controle,
            "stress": student.stress,
            "rentabilite": student.rentabilite,
            "reputation": student.reputation
        },
        concept_progress=concept_progress
    )

def _check_level_completion(student_id: int, level: str, db: Session) -> bool:
    """Check if all concepts in a level are completed"""
    missions = game_loader.get_missions_by_level(level)
    concepts = set(mission["concept"] for mission in missions)
    
    for concept in concepts:
        concept_missions = [m for m in missions if m["concept"] == concept]
        completed_concept_missions = db.query(Progress).filter(
            Progress.student_id == student_id,
            Progress.level == level,
            Progress.concept == concept
        ).count()
        
        if completed_concept_missions < len(concept_missions):
            return False
    
    return True

@router.get("/debug/concept/{concept_id}")
async def debug_concept(concept_id: str):
    """Debug endpoint to see raw concept data"""
    raw_concept = game_loader.get_concept(concept_id)
    return {
        "concept_id": concept_id,
        "raw_data": raw_concept,
        "missions_type": str(type(raw_concept.get("missions", {}))),
        "missions_content": raw_concept.get("missions", {}),
        "data_source": str(game_loader.data.get("concepts", {}).get(concept_id, {}))
    }

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.user import User, UserRole
from models.progress import Progress
from models.custom_feedback import Feedback
from utils.game_loader import GameLoader
from database import get_db
from pydantic import BaseModel

# router = APIRouter()
# game_loader = GameLoader()

class MissionReport(BaseModel):
    mission_id: str
    concept: str
    niveau: str
    type: str
    contexte: str
    objectif_pedagogique: str
    student_choices: dict
    score_earned: int
    feedback_teacher: List[str] = []
    feedback_auto: str = None
    completed_at: str = None

@router.get("/students/{student_id}/missions/{mission_id}/report", response_model=MissionReport)
def get_mission_report(student_id: int, mission_id: str, db: Session = Depends(get_db)):
    # Validate student
    student = db.query(User).filter(User.id == student_id, User.role == UserRole.STUDENT).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Get mission details
    mission = game_loader.get_mission_by_id(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    # Get student progress for this mission
    progress = db.query(Progress).filter(Progress.student_id == student_id, Progress.mission_id == mission_id).first()
    if not progress:
        raise HTTPException(status_code=404, detail="Mission not completed by student")

    # Get teacher feedback
    feedbacks = db.query(Feedback).filter(Feedback.student_id == student_id, Feedback.mission_id == mission_id).all()
    feedback_texts = [f.comment for f in feedbacks]

    return MissionReport(
        mission_id=mission_id,
        concept=mission.get("concept", ""),
        niveau=mission.get("niveau", ""),
        type=mission.get("type", ""),
        contexte=mission.get("contexte", ""),
        objectif_pedagogique=mission.get("objectif_pedagogique", ""),
        student_choices=progress.choices_made,
        score_earned=progress.score_earned,
        feedback_teacher=feedback_texts,
        feedback_auto=mission.get("feedback", {}).get(list(progress.choices_made.values())[0], ""),
        completed_at=str(progress.completed_at)
    )
