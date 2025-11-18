from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from database import Base

# Many-to-many association between classes and students
class_student_table = Table(
    "class_students",
    Base.metadata,
    Column("class_id", ForeignKey("classes.id"), primary_key=True),
    Column("student_id", ForeignKey("users.id"), primary_key=True)
)

class Class(Base):
    __tablename__ = "classes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    teacher = relationship("Teacher", back_populates="classes")
    students = relationship("Student", secondary=class_student_table, back_populates="classes")
