import enum
from sqlalchemy import Column, Integer

class ProfileType(enum.IntEnum):
    GESTION_PORTEFEUILLE = 1
    ANALYSTE_FINANCE  = 2
    BANQUIER_AFFAIRES = 3

PROFILE_LABELS = {
    ProfileType.GESTION_PORTEFEUILLE: "Gestionnaire de Portefeuille",
    ProfileType.ANALYSTE_FINANCE: "Analyste financier",
    ProfileType.BANQUIER_AFFAIRES: "Banquier d'affaires",
}

