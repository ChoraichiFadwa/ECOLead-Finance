from models.progress import Progress
from typing import List, Dict, Any
from database import get_db
from typing import List, Dict, Any
from database import get_db
from models.progress import Progress 

def get_done_mission_ids(student_id: int) -> set:
    """
    Récupère les IDs des missions terminées par l'étudiant.
    """
    db = next(get_db())
    try:
        # Récupérer les missions avec completed_at NOT NULL
        progresses = (
            db.query(Progress.mission_id)
            .filter(Progress.student_id == student_id)
            .filter(Progress.completed_at.isnot(None))
            .all()
        )
        return {p.mission_id for p in progresses}
    finally:
        db.close()

def get_recent_progress_for_student(student_id: int, limit: int = 8) -> List[Dict[str, Any]]:
    """
    Récupère les 'limit' dernières missions terminées par l'étudiant.
    Retourne une liste de dicts avec 'mission_id' et 'concept'.
    """
    db = next(get_db())
    try:
        progresses = (
            db.query(Progress)
            .filter(Progress.student_id == student_id)
            .filter(Progress.completed_at.isnot(None))  # équivalent à "completed == True"
            .order_by(Progress.completed_at.desc())
            .limit(limit)
            .all()
        )

        return [
            {
                "mission_id": p.mission_id,
                "concept": p.concept,
                "niveau": p.level,
                "completed_at": p.completed_at,
                "choices_made": p.choices_made,
                "time_spent_seconds": p.time_spent_seconds,
                "active_event_ids": []
            }
            for p in progresses
        ]
    finally:
        db.close()