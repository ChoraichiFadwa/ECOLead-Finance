from pydantic import BaseModel
from typing import List, Optional, Dict

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