from fastapi import APIRouter
from pydantic import BaseModel
from services.predict_ai_profile import predict_tilt

router = APIRouter()

class FeaturesRequest(BaseModel):
    student_id: float
    pct_high_risk: float
    pct_low_risk: float
    avg_risk_rank: float
    risk_rank_std: float
    ratio_ret_up_vs_ctrl_cf_down: float
    pct_stress_up: float
    median_net_tradeoff: float
    time_z: float
    event_view_rate: float
    quick_check_correct_rate: float
    concept_coverage: float
    choice_entropy: float
    event_exposure_rate: float
class TiltResponse(BaseModel):
    tilt: str

@router.post("/ai_profile", response_model=TiltResponse)
async def predict_profile_endpoint(req: FeaturesRequest):
    tilt=predict_tilt(req)
    return {"tilt": tilt}