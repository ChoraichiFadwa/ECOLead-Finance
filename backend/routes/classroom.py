from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.schemas import ClassCreate, ClassResponse, StudentBase
import services.classroom_service as crud_classroom
from models.notification import Notification
router = APIRouter()

# ✅ Create a new class (teacher)
@router.post("/classes", response_model=ClassResponse)
def create_class(
    class_data: ClassCreate,
    teacher_id: int,  # in real app, you'd extract this from JWT or session
    db: Session = Depends(get_db)
):
    new_class = crud_classroom.create_class_with_students(db, teacher_id, class_data.name, class_data.description, class_data.student_ids or [])
    return new_class

# ✅ Get all classes for a teacher
@router.get("/classes/teacher/{teacher_id}", response_model=List[ClassResponse])
def get_teacher_classes(teacher_id: int, db: Session = Depends(get_db)):
    return crud_classroom.get_teacher_classes(db, teacher_id)

# ✅ Add student to class
@router.post("/classes/{class_id}/add-student/{student_id}", response_model=ClassResponse)
def add_student_to_class(class_id: int, student_id: int, db: Session = Depends(get_db)):
    class_ = crud_classroom.add_student_to_class(db, class_id, student_id)
    if not class_:
        raise HTTPException(status_code=404, detail="Class or student not found")
    return class_

# ✅ Remove student from class
@router.delete("/classes/{class_id}/remove-student/{student_id}", response_model=ClassResponse)
def remove_student_from_class(class_id: int, student_id: int, db: Session = Depends(get_db)):
    class_ = crud_classroom.remove_student_from_class(db, class_id, student_id)
    if not class_:
        raise HTTPException(status_code=404, detail="Class not found")
    return class_

# ✅ Get students of a class
@router.get("/classes/{class_id}/students", response_model=List[StudentBase])
def get_class_students(class_id: int, db: Session = Depends(get_db)):
    return crud_classroom.get_class_students(db, class_id)

@router.post("/test-notif/{student_id}")
def test_notification(student_id: int, db: Session = Depends(get_db)):
    test_notif = Notification(
        student_id=student_id,
        type="class_add",
        message="Test direct"
    )
    print("DB in use:", db.bind.url)
    db.add(test_notif)
    print("Before commit:", test_notif.__table__.fullname)
    print("Session info:", db.bind)
    db.commit()
    notif_in_db = db.query(Notification).filter(Notification.id == test_notif.id).first()
    print("🔍 Found:", notif_in_db)
    return {"message": "Notification created!"}
