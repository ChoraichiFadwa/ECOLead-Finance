from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from database import get_db
from models.user import User, UserRole
from models.progress import Progress, ConceptProgress
from utils.game_loader import GameLoader
from utils.evaluator import MissionEvaluator
import random

router = APIRouter()
game_loader = GameLoader()

class MissionResponse(BaseModel):
    id: str
    concept: str
    niveau: str
    type: str
    contexte: str
    objectif_pedagogique: str
    choix: Dict[str, Any]
    variables_affectees: List[str]
    tags: List[str]
    
    # Dynamic context variables
    # secteur: Optional[str] = None
    # situation_macro: Optional[str] = None
    
    # Active events that modify this mission
    evenements_actifs: List[Dict[str, Any]] = []
    
class ConceptSummary(BaseModel):
    concept: str
    missions_completed: int
    total_missions: int
    is_completed: bool

class LevelSummary(BaseModel):
    level: str
    concepts: List[ConceptSummary]
    is_unlocked: bool
    is_completed: bool

@router.get("/students/{student_id}/next-mission", response_model=MissionResponse)
async def get_next_mission(student_id: int, db: Session = Depends(get_db)):
    # Get student
    student = db.query(User).filter(
        User.id == student_id,
        User.role == UserRole.STUDENT
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Get completed missions
    completed_missions = db.query(Progress.mission_id).filter(
        Progress.student_id == student_id
    ).all()
    completed_mission_ids = [m[0] for m in completed_missions]

    # Get missions for current concept
    # missions = game_loader.get_missions_by_concept(concept_id)
    missions=game_loader.get_all_missions()

    # Find next uncompleted mission
    next_mission = None
    for mission in missions:
        if mission["id"] not in completed_mission_ids:
            next_mission = mission
            break

    # If no more missions, try level up
    if not next_mission:
        # from routes.progress import _check_level_completion  # Import helper safely

        # if student.current_level == "débutant" and _check_level_completion(student.id, "débutant", db):
        #     student.current_level = "intermédiaire"
        #     db.commit()
        #     return await get_next_mission(student.id, db)
        # elif student.current_level == "intermédiaire" and _check_level_completion(student.id, "intermédiaire", db):
        #     student.current_level = "avancé"
        #     db.commit()
        #     return await get_next_mission(student.id, db)

        raise HTTPException(status_code=404, detail="Toutes les missions ont été complétées.")

    # Add dynamic context
    if "secteurs" in next_mission:
        next_mission["secteur"] = random.choice(next_mission["secteurs"])

    if "situations_macro" in next_mission:
        next_mission["situation_macro"] = random.choice(next_mission["situations_macro"])

    # Apply active events
    events = game_loader.get_active_events_for_mission(next_mission["id"], student)
    next_mission["evenements_actifs"] = events

    # Apply event modifications to choices
    evaluator = MissionEvaluator(game_loader)
    modified_mission = evaluator.apply_events_to_mission(next_mission, events, student)

    return MissionResponse(**modified_mission)


@router.get("/missions/{level}", response_model=List[MissionResponse])
async def get_missions_by_level(level: str):
    missions = game_loader.get_missions_by_level(level)
    return [MissionResponse(**mission) for mission in missions]

@router.get("/concepts/{level}")
async def get_concepts_by_level(level: str):
    missions = game_loader.get_missions_by_level(level)
    concepts = {}
    
    for mission in missions:
        concept = mission["concept"]
        if concept not in concepts:
            concepts[concept] = []
        concepts[concept].append(mission)
    
    return {
        "level": level,
        "concepts": list(concepts.keys()),
        "missions_by_concept": concepts
    }

@router.get("/concepts", response_model=List[str])
async def get_all_concepts():
    return game_loader.get_all_concepts()

@router.get("/concepts/{concept_id}/missions", response_model=List[MissionResponse])
async def get_missions_by_concept(concept_id: str):
    missions = game_loader.get_missions_by_concept(concept_id)
    return [MissionResponse(**mission) for mission in missions]

@router.get("/missions/id/{mission_id}", response_model=MissionResponse)
async def get_mission_by_id(mission_id: str):
    mission = game_loader.get_mission_by_id(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    return MissionResponse(**mission)

@router.get("/students/{student_id}/level-progress", response_model=List[LevelSummary])
async def get_level_progress(student_id: int, db: Session = Depends(get_db)):
    student = db.query(User).filter(
        User.id == student_id, 
        User.role == UserRole.STUDENT
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    levels = ["débutant", "intermédiaire", "avancé"]
    level_progress = []
    
    for i, level in enumerate(levels):
        # Check if level is unlocked
        is_unlocked = (i == 0) or (i > 0 and student.current_level != levels[0])
        
        # Get concepts for this level
        missions = game_loader.get_missions_by_level(level)
        concepts_data = {}
        
        for mission in missions:
            concept = mission["concept"]
            if concept not in concepts_data:
                concepts_data[concept] = {"total": 0, "completed": 0}
            concepts_data[concept]["total"] += 1
        
        # Get completed missions for this level
        completed_missions = db.query(Progress).filter(
            Progress.student_id == student_id,
            Progress.level == level
        ).all()
        
        for progress in completed_missions:
            if progress.concept in concepts_data:
                concepts_data[progress.concept]["completed"] += 1
        
        # Build concept summaries
        concept_summaries = []
        level_completed = True
        
        for concept, data in concepts_data.items():
            is_concept_completed = data["completed"] >= data["total"]
            if not is_concept_completed:
                level_completed = False
            
            concept_summaries.append(ConceptSummary(
                concept=concept,
                missions_completed=data["completed"],
                total_missions=data["total"],
                is_completed=is_concept_completed
            ))
        
        level_progress.append(LevelSummary(
            level=level,
            concepts=concept_summaries,
            is_unlocked=is_unlocked,
            is_completed=level_completed and is_unlocked
        ))
    
    return level_progress