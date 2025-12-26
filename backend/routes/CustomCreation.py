# this file is for the creation of concepts and missions by teachers
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict
from models.custom_concept import CustomConcept
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import Teacher
from models.custom_mission import CustomMission
from services.teacher_service import add_concept_to_json, add_custom_mission_to_json, add_event_to_json, slugify
from models.custom_event import Event
from models.schemas import ConceptCreate, ConceptOut, EventCreate, EventOut, CustomMissionCreate, CustomMissionOut
router = APIRouter()

class Impact(BaseModel):
    cashflow: int = 0
    rentabilite: int = 0
    reputation: int = 0
    stress: int = 0
    controle: int = 0

class ChoixOption(BaseModel):
    description: str = ""
    impact: Impact = Impact()

class CustomMissionBase(BaseModel):
    title: str
    concept: str
    level: str
    description: Optional[str] = None

class CustomMissionCreate(CustomMissionBase):
    choix: Dict[str, ChoixOption] = {
        "A": ChoixOption(),
        "B": ChoixOption()
    }
    feedback: Dict[str, str] = {
        "A": "",
        "B": ""
    }
    variables_affectees: Optional[List[str]] = []
    tags: Optional[List[str]] = []
    evenements_possibles: Optional[List[str]] = []
    class Config:
        # This helps Pydantic handle the data better
        from_attributes = True
        arbitrary_types_allowed = True

class CustomMissionOut(CustomMissionBase):
    id: int
    created_at: datetime
    choix: Dict[str, ChoixOption]
    feedback: Dict[str, str]
    variables_affectees: List[str]
    tags: List[str]
    evenements_possibles: List[str]

    class Config:
        from_attributes = True

# from pydantic import BaseModel
# from typing import Dict, List, Optional

# class Impact(BaseModel):
#     cashflow: int
#     rentabilite: int
#     reputation: int
#     stress: int
#     controle: int = 0

# class ChoixOption(BaseModel):
#     description: str
#     impact: Impact

# class CustomMissionCreate(BaseModel):
#     title: str
#     concept: str
#     level: str
#     description: Optional[str] = None
#     choix: Dict[str, ChoixOption]
#     feedback: Dict[str, str]
#     variables_affectees: Optional[List[str]] = []
#     tags: Optional[List[str]] = []
#     evenements_possibles: Optional[List[str]] = []


# from datetime import datetime

# class CustomMissionOut(BaseModel):
#     id: int
#     title: str
#     concept: str
#     level: str
#     description: Optional[str]
#     created_at: datetime
#     choix: Dict[str, ChoixOption]
#     feedback: Dict[str, str]
#     variables_affectees: List[str]
#     tags: List[str]
#     evenements_possibles: List[str]

#     class Config:
#         orm_mode = True

router = APIRouter()

@router.post("/teachers/{teacher_id}/missions", response_model=CustomMissionOut)
def create_custom_mission(
    teacher_id: int,
    mission: CustomMissionCreate,
    db: Session = Depends(get_db)
):
    # Verify teacher exists
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")


    choix_dict = {}
    for key, value in mission.choix.items():
        choix_dict[key] = {
            "description": value.description,
            "impact": {
                "cashflow": value.impact.cashflow,
                "rentabilite": value.impact.rentabilite,
                "reputation": value.impact.reputation,
                "stress": value.impact.stress,
                "controle": value.impact.controle
            }
        }

    # Create mission in database
    new_mission = CustomMission(
    title=mission.title,
    concept=mission.concept,
    level=mission.level,
    description=mission.description,
    choix=choix_dict,
    feedback=mission.feedback,
    variables_affectees=mission.variables_affectees,
    tags=mission.tags,
    evenements_possibles=mission.evenements_possibles,
    teacher_id=teacher_id
)
    db.add(new_mission)
    db.commit()
    db.refresh(new_mission)

    # Add mission to JSON (this ensures it's tied to an existing concept)
    try:
        mission_id_used = add_custom_mission_to_json(new_mission)
    except HTTPException as e:
        # Rollback DB if JSON update fails
        db.delete(new_mission)
        db.commit()
        raise e

    # Update title/ID if it changed
    if mission_id_used != mission.title:
        new_mission.title = mission_id_used
        db.commit()
        db.refresh(new_mission)

    return new_mission


# @router.post("/teachers/{teacher_id}/missions", response_model=CustomMissionOut)
# def create_custom_mission(
#     teacher_id: int,
#     mission: CustomMissionCreate,
#     db: Session = Depends(get_db)
# ):
#     teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
#     if not teacher:
#         raise HTTPException(status_code=404, detail="Teacher not found")

#     new_mission = CustomMission(
#         title=mission.title,
#         concept=mission.concept,
#         level=mission.level,
#         description=mission.description,
#         teacher_id=teacher_id
#     )
#     db.add(new_mission)
#     db.commit()
#     db.refresh(new_mission)
#     try:
#         add_custom_mission_to_json(new_mission)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Mission created but not added to JSON: {str(e)}")

#     return new_mission

@router.get("/teachers/{teacher_id}/missions", response_model=list[CustomMissionOut])
def list_custom_missions(teacher_id: int, db: Session = Depends(get_db)):
    missions = db.query(CustomMission).filter(CustomMission.teacher_id == teacher_id).all()
    return missions

@router.post("/teachers/{teacher_id}/concepts", response_model=ConceptOut)
def create_concept(
    teacher_id: int,
    concept: ConceptCreate,
    db: Session = Depends(get_db)
):
    # Check teacher exists
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    # Check if concept already exists in DB
    existing = db.query(CustomConcept).filter(
        CustomConcept.name == concept.name,
        CustomConcept.teacher_id == teacher_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Concept already exists for this teacher")

    # Save to DB
    new_concept = CustomConcept(
        name=concept.name,
        description=concept.description,
        teacher_id=teacher_id,
        missions={}  # empty JSON field
    )
    db.add(new_concept)
    db.commit()
    db.refresh(new_concept)

    # Update JSON file
    try:
        add_concept_to_json(concept)
    except HTTPException as e:
        # Rollback DB if JSON update fails
        db.delete(new_concept)
        db.commit()
        raise e

    return new_concept

@router.get("/teachers/{teacher_id}/concepts", response_model=list[ConceptOut])
def list_concepts(teacher_id: int, db: Session = Depends(get_db)):
    concepts = db.query(CustomConcept).filter(CustomConcept.teacher_id == teacher_id).all()
    return concepts


@router.delete("/teachers/{teacher_id}/missions/{mission_id}")
def delete_custom_mission(teacher_id: int, mission_id: int, db: Session = Depends(get_db)):
    mission = db.query(CustomMission).filter_by(id=mission_id, teacher_id=teacher_id).first()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    db.delete(mission)
    db.commit()
    return {"message": "Mission deleted successfully"}

@router.post("/teachers/{teacher_id}/events", response_model=EventOut)
def create_event(teacher_id: int, event: EventCreate, db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    event_id = slugify(event.title)
    new_event = Event(
        id=event_id,
        title=event.title,
        message=event.message,
        context=event.context,
        conditions=event.conditions,
        modifie_choix=event.modifie_choix,
        teacher_id=teacher_id
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    try:
        add_event_to_json(new_event)
    except HTTPException as e:
        # Rollback DB if JSON update fails
        db.delete(new_event)
        db.commit()
        raise e
    
    return new_event

@router.get("/teachers/{teacher_id}/events", response_model=List[EventOut])
def list_events(teacher_id: int, db: Session = Depends(get_db)):
    events = db.query(Event).filter(Event.teacher_id == teacher_id).all()
    return events

@router.delete("/teachers/{teacher_id}/events/{event_id}")
def delete_event(teacher_id: int, event_id: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter_by(id=event_id, teacher_id=teacher_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully"}