import enum
from sqlalchemy import Column, Integer

class ProfileType(enum.IntEnum):
    GESTION_PORTEFEUILLE = 1
    LECTURE_INDICATEURS  = 2
    SIMULATION_LEVEE     = 3

# Optional: labels for UI / JSON
PROFILE_LABELS = {
    ProfileType.GESTION_PORTEFEUILLE: "Gestion de portefeuille boursier",
    ProfileType.LECTURE_INDICATEURS: "Lecture des indicateurs techniques",
    ProfileType.SIMULATION_LEVEE: "Simulation de levée de fonds",
}
# models/profile.py
PROFILE_BASELINES = {
    ProfileType.GESTION_PORTEFEUILLE: dict(cashflow=100, controle=40, stress=20, rentabilite=50, reputation=40),
    ProfileType.LECTURE_INDICATEURS: dict(cashflow=80,  controle=30, stress=30, rentabilite=60, reputation=35),
    ProfileType.SIMULATION_LEVEE: dict(cashflow=60,  controle=60, stress=25, rentabilite=55, reputation=50),
}
