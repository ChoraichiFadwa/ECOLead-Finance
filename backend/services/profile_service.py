from sqlalchemy.orm import Session
from database import get_db
from models.user import Student
from models.profile import ProfileType  # Assure-toi que ProfileType est bien importé

def get_student_profile_enum(student_id: int, db: Session = None) -> ProfileType:

    """
    Récupère le profil de l'étudiant sous forme d'enum ProfileType.
    """
    close_session = False
    if db is None:
        db = next(get_db())
        close_session = True

    try:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student or student.profile is None:
            return ProfileType.GESTION_PORTEFEUILLE  # fallback par défaut

        # Convertir l'int en ProfileType
        try:
            return ProfileType(student.profile)
        except ValueError:
            return ProfileType.GESTION_PORTEFEUILLE  # fallback si valeur invalide
    finally:
        if close_session:
            db.close()


def get_student_profile(student_id: int) -> str:
    profiles = {1: "Gestionnaire de Portefeuille", 2: "Analyste financier", 3: "Banquier d'affaires"}
    return profiles.get(student_id)