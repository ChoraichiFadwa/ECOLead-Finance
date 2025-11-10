from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List
from database import get_db
from models.user import User, Student, Teacher, UserRole
from models.classroom import Class, class_student_table
from models.user import Student as StudentBase
from sqlalchemy import select
from datetime import datetime
# Business logic is mostly inline, e.g., creating a student, applying profile baselines.
# This could be refactored into a service class (like UserService) to respect separation of concerns.
# Keep routes for requests/responses
# from services.profile_service import get_student_profile_enum  # ← Nouvelle fonction
#"profile": profile_enum.value,           # int (pour compatibilité existante)
router = APIRouter()

class StudentCreate(BaseModel):
    name: str
    email: EmailStr

class TeacherCreate(BaseModel):
    name: str
    email: EmailStr

class StudentResponse(BaseModel):
    id: int
    name: str 
    email: str
    role: str
    level_ai: str = None
    total_score: int = None
    created_at: datetime
    
    # Current metrics for students
    cashflow: float = None
    controle: float = None
    stress: float = None
    rentabilite: float = None
    reputation: float = None
    profile: int = None       # store DB value
    profile_label: str = None # frontend label

    class Config:
        from_attributes = True
class TeacherResponse(BaseModel):
    id: int
    name: str 
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

@router.post("/students/", response_model=StudentResponse)
async def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.query(Student).filter(User.email == student.email).first()
    if existing_user:
        # raise HTTPException(status_code=400, detail="Email already registered")
        # we return an existing user bcz we're in a demo local storage setup
        return existing_user
    
    db_student = Student(
        name=student.name,
        email=student.email,
        role=UserRole.STUDENT,
        level_ai="Prudent", 
        total_score=0,
        cashflow=100.0,
        controle=50.0,
        stress=10.0,
        rentabilite=50.0,
        reputation=50.0
    )
    
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    
    return db_student

@router.post("/teachers/", response_model=TeacherResponse)
async def create_teacher(teacher: TeacherCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.query(Teacher).filter(Teacher.email == teacher.email).first()
    if existing_user:
        # raise HTTPException(status_code=400, detail="Email already registered")
        return existing_user
    
    db_teacher = Teacher(
        name=teacher.name,
        email=teacher.email,
        role=UserRole.TEACHER
    )
    
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    
    return db_teacher

@router.get("/students/{student_id}", response_model=StudentResponse)
async def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return student

@router.get("/teachers/{teacher_id}", response_model=TeacherResponse)
async def get_teacher(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(
        Teacher.id == teacher_id
    ).first()
    
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    return teacher

@router.get("/students/", response_model=List[StudentResponse])
async def list_students(db: Session = Depends(get_db)):
    students = db.query(Student).all()
    return students

@router.get("/teachers/", response_model=List[TeacherResponse])
async def list_teachers(db: Session = Depends(get_db)):
    teachers = db.query(Teacher).all()
    return teachers

@router.post("/students/{student_id}/profile")
def set_profile(student_id: int, profile: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()
    if not student:
        raise HTTPException(404, "Student not found")

    student.profile = profile

    # Apply baseline
    # from models.profile import PROFILE_BASELINES, ProfileType
    # baselines = PROFILE_BASELINES[ProfileType(profile)]
    # for k, v in baselines.items():
    #     setattr(student, k, v)

    db.commit()
    db.refresh(student)
    return {"ok": True, "profile": student.profile, "profile_label": student.profile_label}

@router.get("/students/{student_id}/profile")
def get_profile(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()
    if not student:
        raise HTTPException(404, "Student not found")
    # If profile is None, return default values
    profile = student.profile if student.profile is not None else -1
    profile_label = student.profile_label if student.profile_label is not None else "Choisis un profil"

    return {"profile": profile, "profile_label": profile_label}


# @router.get("/teachers/{teacher_id}/students", response_model=List[StudentBase])
# def get_teacher_students(teacher_id: int, db: Session = Depends(get_db)):
#     # Step 1. Get all classes owned by the teacher
#     class_ids = [c.id for c in db.query(Class).filter(Class.teacher_id == teacher_id).all()]

#     if not class_ids:
#         return []

#     # Step 2. Get all students from those classes
#     stmt = (
#         select(Student)
#         .join(class_student_table, Student.id == class_student_table.c.student_id)
#         .filter(class_student_table.c.class_id.in_(class_ids))
#         .distinct()
#     )

#     students = db.scalars(stmt).all()
#     return students
@router.get("/teachers/{teacher_id}/classes")
def get_teacher_classes(teacher_id: int, db: Session = Depends(get_db)):
    classes = db.query(Class).filter(Class.teacher_id == teacher_id).all()
    return classes
