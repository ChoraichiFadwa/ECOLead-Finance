from fastapi import APIRouter, Depends
from services.strategy.suggest_service import suggest_strategy
from models.schemas import SuggestRequest, SuggestResponse  # On va les créer

router = APIRouter()

@router.post("/suggest-strategy", response_model=SuggestResponse)
async def suggest_strategy_endpoint(req: SuggestRequest):
    return suggest_strategy(req)