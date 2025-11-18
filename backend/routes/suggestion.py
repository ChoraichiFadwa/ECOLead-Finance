from fastapi import APIRouter, Depends
from services.strategy.suggest_service import suggest_strategy
from models.schemas import SuggestRequest, SuggestResponse 
from services.strategy.strategic_context_service import get_strategic_context

router = APIRouter()

@router.get("/strategy/students/{student_id}/suggest")
def suggest_bundle(student_id: int, goal: str, max_bundle: int = 3, concept_whitelist: str = None):
    # wrap your suggest_strategy logic here
    req = SuggestRequest(student_id=student_id, goal=goal, max_bundle=max_bundle, concept_whitelist=concept_whitelist)
    return suggest_strategy(req)

@router.post("/strategy/suggest-strategy", response_model=SuggestResponse)
async def suggest_strategy_endpoint(req: SuggestRequest):
    return suggest_strategy(req)


@router.get("/strategy/students/{student_id}/strategic-context")
def get_student_strategic_context(student_id: int):
    """
    Retourne le contexte stratégique adapté au niveau d'expérience.
    """
    try:
        context = get_strategic_context(student_id)
        return context
    except Exception as e:
        return {
            "stage": "error",
            "welcome_message": {
                "title": "Erreur",
                "text": "Impossible de charger le contexte",
                "icon": "❌"
            },
            "alerts": [],
            "opportunities": [],
            "goal_recommendations": {
                "reduce_stress": {"priority": 0, "badge": None},
                "boost_rentabilite": {"priority": 0, "badge": None},
                "preserve_liquidity": {"priority": 0, "badge": None},
                "balance": {"priority": 1, "badge": "🎯"}
            }
        }