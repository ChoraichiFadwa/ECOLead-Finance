import os
import joblib
from typing import Dict
from services.features_service import FEATURE_SPEC
from fastapi import HTTPException

MODEL = os.path.join(os.path.dirname(__file__), "../data/kmeans.pkl")
SCALER = os.path.join(os.path.dirname(__file__), "../data/scaler.pkl")
TILT_MAP = {0: "Prudent", 1: "Equilibré", 2: "Speculatif"}

if os.path.exists(MODEL):
    try:
        kmeans = joblib.load(MODEL)
    except Exception as e:
        kmeans = None
else:
    kmeans = None

if os.path.exists(SCALER):
    try:
        scaler = joblib.load(SCALER)
    except Exception as e:
        scaler = None
else:
    scaler = None


def predict_tilt(features: Dict[str, float]) -> str:
    feature_dict = features.dict()
    feature_vector = [feature_dict.get(name, 0.0) for name in FEATURE_SPEC["feature_names"]]
    if not kmeans:
        raise HTTPException(status_code=500, detail="Failed to compute AI profile")
    
    X = [feature_vector]
    X_scaled = scaler.transform(X)
    cluster = kmeans.predict(X_scaled)[0]
    return TILT_MAP.get(cluster, "failed")