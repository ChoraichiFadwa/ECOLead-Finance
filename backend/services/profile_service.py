from sqlalchemy.orm import Session
from database import get_db
from models.user import Student
from models.profile import ProfileType

def get_student_level_ai(student_id: int, db: Session = None) -> str:
    close_session = False
    if db is None:
        db = next(get_db())
        close_session = True

    try:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student or student.level_ai is None:
            return "Prudent"

        return student.level_ai
    finally:
        if close_session:
            db.close()

def get_student_profile_enum(student_id: int, db: Session = None) -> ProfileType:
    close_session = False
    if db is None:
        db = next(get_db())
        close_session = True

    try:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student or student.profile is None:
            return ProfileType.GESTION_PORTEFEUILLE

        try:
            return ProfileType(student.profile)
        except ValueError:
            return ProfileType.GESTION_PORTEFEUILLE
    finally:
        if close_session:
            db.close()

def get_student_profile(student_id: int, db: Session = None) -> str:
    """Return the profile label for a given student ID."""
    profiles = {
        1: "Gestionnaire de Portefeuille",
        2: "Analyste financier",
        3: "Banquier d'affaires",
    }

    close_session = False
    if db is None:
        db = next(get_db())
        close_session = True

    try:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student or student.profile is None:
            return "Profil inconnu"

        return profiles.get(student.profile, "Profil inconnu")
    finally:
        if close_session:
            db.close()
