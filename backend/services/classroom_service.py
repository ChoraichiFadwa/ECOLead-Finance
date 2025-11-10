from sqlalchemy.orm import Session
from models.classroom import Class
from models.user import Student, Teacher, User
from models.notification import Notification

def create_class(db: Session, teacher_id: int, name: str, description: str = None):
    new_class = Class(name=name, description=description, teacher_id=teacher_id)
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    return new_class
def create_class_with_students(db: Session, teacher_id: int, name: str, description: str, student_ids: list):
    # ✅ Create the class
    new_class = Class(name=name, description=description, teacher_id=teacher_id)
    db.add(new_class)
    db.commit()
    db.refresh(new_class)

    # ✅ Add students (if any)
    if student_ids:
        students = db.query(Student).filter(Student.id.in_(student_ids)).all()
        new_class.students.extend(students)
        db.commit()
        db.refresh(new_class)

    return new_class
def get_teacher_classes(db: Session, teacher_id: int):
    return db.query(Class).filter(Class.teacher_id == teacher_id).all()

def add_student_to_class(db: Session, class_id: int, student_id: int):
    class_ = db.query(Class).filter(Class.id == class_id).first()
    student = db.query(User).filter(User.id == student_id).first()
    if not class_ or not student:
        return None
    class_.students.append(student)
    
    
    message = f"Tu as été ajouté(e) à la classe {class_.name}"
    new_notification = Notification(
        student_id=student_id,
        type="class_add",
        message=message
    )
    db.add(new_notification)
    db.commit()
    db.refresh(class_)
    db.refresh(new_notification)

    return class_

def remove_student_from_class(db: Session, class_id: int, student_id: int):
    class_ = db.query(Class).filter(Class.id == class_id).first()
    if not class_:
        return None
    class_.students = [s for s in class_.students if s.id != student_id]
    db.commit()
    db.refresh(class_) 
    return class_

def get_class_students(db: Session, class_id: int):
    class_ = db.query(Class).filter(Class.id == class_id).first()
    return class_.students if class_ else []
