import enum
from sqlalchemy import Column, Integer

class ProfileType(enum.IntEnum):
    GESTION_PORTEFEUILLE = 1
    ANALYSTE_FINANCE  = 2
    BANQUIER_AFFAIRES = 3

# Optional: labels for UI / JSON
PROFILE_LABELS = {
    ProfileType.GESTION_PORTEFEUILLE: "Gestionnaire de Portefeuille",
    ProfileType.ANALYSTE_FINANCE: "Analyste financier",
    ProfileType.BANQUIER_AFFAIRES: "Banquier d'affaires",
}
# models/profile.py
PROFILE_BASELINES = {
    ProfileType.GESTION_PORTEFEUILLE: dict(cashflow=100, controle=40, stress=20, rentabilite=50, reputation=40),
    ProfileType.ANALYSTE_FINANCE: dict(cashflow=80,  controle=30, stress=30, rentabilite=60, reputation=35),
    ProfileType.BANQUIER_AFFAIRES: dict(cashflow=60,  controle=60, stress=25, rentabilite=55, reputation=50),
}
