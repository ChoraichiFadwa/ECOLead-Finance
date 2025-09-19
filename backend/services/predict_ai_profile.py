import os
import joblib
from typing import Dict
from services.features_service import FEATURE_SPEC
from fastapi import HTTPException
# --- Chargement IA ---
MODEL = os.path.join(os.path.dirname(__file__), "../data/kmeans.pkl")
SCALER = os.path.join(os.path.dirname(__file__), "../data/scaler.pkl")
print(os.path.abspath(MODEL))
print(os.path.exists(MODEL))
# try:
#     kmeans = joblib.load(MODEL)
#     scaler = joblib.load(SCALER)
# except:
#     kmeans = None
#     scaler = None
#     print("[WARN] Could not load KMeans model or scaler")
# Test KMeans
if os.path.exists(MODEL):
    try:
        kmeans = joblib.load(MODEL)
        print("KMeans loaded")
    except Exception as e:
        kmeans = None
        print(f"[WARN] Failed to load KMeans: {e}")
else:
    kmeans = None
    print(f"[WARN] KMeans file not found: {MODEL}")

# Test Scaler
if os.path.exists(SCALER):
    try:
        scaler = joblib.load(SCALER)
        print("Scaler loaded")
    except Exception as e:
        scaler = None
        print(f"[WARN] Failed to load Scaler: {e}")
else:
    scaler = None
    print(f"[WARN] Scaler file not found: {SCALER}")

TILT_MAP = {0: "prudent", 1: "equilibre", 2: "speculatif"}

def predict_tilt(features: Dict[str, float]) -> str:
    feature_dict = features.dict()
    feature_vector = [feature_dict.get(name, 0.0) for name in FEATURE_SPEC["feature_names"]]
    if not kmeans:
        raise HTTPException(status_code=500, detail="Failed to compute AI profile")
    
    X = [feature_vector]
    X_scaled = scaler.transform(X)
    cluster = kmeans.predict(X_scaled)[0]
    return TILT_MAP.get(cluster, "failed")