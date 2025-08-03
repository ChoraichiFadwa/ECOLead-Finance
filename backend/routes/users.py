from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List
from database import get_db
from models.user import User, UserRole
from datetime import datetime

router = APIRouter()

class StudentCreate(BaseModel):
    name: str
    email: EmailStr

class TeacherCreate(BaseModel):
    name: str
    email: EmailStr

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    current_level: str = None
    total_score: int = None
    created_at: datetime
    
    # Current metrics for students
    cashflow: float = None
    controle: float = None
    stress: float = None
    rentabilite: float = None
    reputation: float = None

    class Config:
        from_attributes = True

@router.post("/students/", response_model=UserResponse)
async def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == student.email).first()
    if existing_user:
        # raise HTTPException(status_code=400, detail="Email already registered")
        return existing_user
    
    db_student = User(
        name=student.name,
        email=student.email,
        role=UserRole.STUDENT,
        current_level="débutant",
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

@router.post("/teachers/", response_model=UserResponse)
async def create_teacher(teacher: TeacherCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == teacher.email).first()
    if existing_user:
        # raise HTTPException(status_code=400, detail="Email already registered")
        return existing_user
    
    db_teacher = User(
        name=teacher.name,
        email=teacher.email,
        role=UserRole.TEACHER
    )
    
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    
    return db_teacher

@router.get("/students/{student_id}", response_model=UserResponse)
async def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(User).filter(
        User.id == student_id, 
        User.role == UserRole.STUDENT
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return student

@router.get("/teachers/{teacher_id}", response_model=UserResponse)
async def get_teacher(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.query(User).filter(
        User.id == teacher_id, 
        User.role == UserRole.TEACHER
    ).first()
    
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    return teacher

@router.get("/students/", response_model=List[UserResponse])
async def list_students(db: Session = Depends(get_db)):
    students = db.query(User).filter(User.role == UserRole.STUDENT).all()
    return students

@router.get("/teachers/", response_model=List[UserResponse])
async def list_teachers(db: Session = Depends(get_db)):
    teachers = db.query(User).filter(User.role == UserRole.TEACHER).all()
    return teachers