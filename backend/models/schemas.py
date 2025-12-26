from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class SuggestRequest(BaseModel):
    student_id: int
    goal: str # = "balance"
    max_bundle: int = 3
    concept_whitelist: Optional[List[str]] = None

class SuggestedMission(BaseModel):
    mission_id: str
    concept: str
    niveau: str
    why: List[str]
    has_event: bool = False

class SuggestResponse(BaseModel):
    profile_tilt: str
    job: str
    bundle: Dict
    cards: List[Dict] = []
    tip: Optional[Dict] = None
    # explanation: str

class ConceptCreate(BaseModel):
    name: str
    description: str
    profiles: Optional[List[int]] = []

class ConceptOut(BaseModel):
    name: str
    description: str
    profiles: List[int]

class CustomMissionBase(BaseModel):
    title: str
    concept: str
    level: str
    description: Optional[str] = None
class Impact(BaseModel):
    cashflow: int = 0
    rentabilite: int = 0
    reputation: int = 0
    stress: int = 0
    controle: int = 0

class ChoixOption(BaseModel):
    description: str = ""
    impact: Impact = Impact()
    
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
        from_attributes = True

class CustomMissionOut(CustomMissionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class EventCreate(BaseModel):
    title: str
    message: str
    context: Optional[Dict[str, Any]] = {}
    conditions: Optional[Dict[str, Any]] = {}
    modifie_choix: Optional[Dict[str, Dict[str, int]]] = {}

class EventOut(EventCreate):
    teacher_id: int
    created_at: str


class FeedbackCreate(BaseModel):
    comment: str

class FeedbackOut(BaseModel):
    id: int
    teacher_id: int
    student_id: int
    mission_id: str
    comment: str
    created_at: datetime

    class Config:
        from_attributes = True

class StudentBase(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True

class ClassBase(BaseModel):
    name: str
    description: Optional[str] = None
    student_ids: Optional[List[int]] = [] 

class ClassCreate(ClassBase):
    pass

class ClassResponse(ClassBase):
    id: int
    teacher_id: int
    students: List[StudentBase] = []

    class Config:
        from_attributes = True