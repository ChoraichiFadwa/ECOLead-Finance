# this file is for the creation of concepts and missions by teachers
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import Teacher
from models.custom_mission import CustomMission
from models.schemas import ConceptCreate, ConceptOut
from models.custom_mission import CustomMission
from services.teacher_service import add_concept_to_json, add_custom_mission_to_json

router = APIRouter()
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

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
        orm_mode = True

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


from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import Teacher
from models.custom_mission import CustomMission
from models.schemas import CustomMissionCreate, CustomMissionOut
from services.teacher_service import add_custom_mission_to_json
from datetime import datetime

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
def create_concept(teacher_id: int, concept: ConceptCreate, db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    try:
        add_concept_to_json(concept)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return concept

@router.delete("/teachers/{teacher_id}/missions/{mission_id}")
def delete_custom_mission(teacher_id: int, mission_id: int, db: Session = Depends(get_db)):
    mission = db.query(CustomMission).filter_by(id=mission_id, teacher_id=teacher_id).first()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    db.delete(mission)
    db.commit()
    return {"message": "Mission deleted successfully"}
