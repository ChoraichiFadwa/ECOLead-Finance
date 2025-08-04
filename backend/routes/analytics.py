from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime, timedelta
from database import get_db
from models.user import User, UserRole
from models.progress import Progress, MetricHistory
from utils.game_loader import GameLoader

router = APIRouter()
game_loader = GameLoader()

class MetricPoint(BaseModel):
    date: datetime
    cashflow: float
    controle: float
    stress: float
    rentabilite: float
    reputation: float
    total_score: int

class MissionTimelinePoint(BaseModel):
    date: datetime
    mission_id: str
    concept: str
    level: str
    score_earned: int
    time_spent_minutes: float
    time_spent_seconds: int

class StudentChartData(BaseModel):
    metrics_over_time: List[MetricPoint]
    mission_timeline: List[MissionTimelinePoint]
    concept_performance: Dict[str, Any]
    level_progression: Dict[str, Any]

class TeacherStudentMetrics(BaseModel):
    student_id: int
    student_name: str
    total_time_spent_hours: float
    avg_time_per_mission_minutes: float
    avg_score_per_mission: float
    engagement_level: str
    concept_performance: Dict[str, Any]
    recent_activity: List[MissionTimelinePoint]

class TeacherDashboard(BaseModel):
    total_students: int
    active_students_last_week: int
    avg_completion_rate: float
    top_performing_students: List[Dict[str, Any]]
    concept_difficulty_analysis: Dict[str, Any]
    engagement_trends: List[Dict[str, Any]]

@router.get("/students/{student_id}/chart-data", response_model=StudentChartData)
async def get_student_chart_data(student_id: int, db: Session = Depends(get_db)):
    student = db.query(User).filter(
        User.id == student_id, 
        User.role == UserRole.STUDENT
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get metrics over time
    metrics_history = db.query(MetricHistory).filter(
        MetricHistory.student_id == student_id
    ).order_by(MetricHistory.recorded_at).all()
    
    metrics_over_time = [
        MetricPoint(
            date=record.recorded_at,
            cashflow=record.cashflow,
            controle=record.controle,
            stress=record.stress,
            rentabilite=record.rentabilite,
            reputation=record.reputation,
            total_score=record.total_score
        )
        for record in metrics_history
    ]
    
    # Get mission timeline
    progress_records = db.query(Progress).filter(
        Progress.student_id == student_id
    ).order_by(Progress.completed_at).all()
    
    mission_timeline = [
        MissionTimelinePoint(
            date=record.completed_at,
            mission_id=record.mission_id,
            concept=record.concept,
            level=record.level,
            score_earned=record.score_earned,
            time_spent_minutes=record.time_spent_seconds / 60.0,
            time_spent_seconds=record.time_spent_seconds
        )
        for record in progress_records
    ]
    
    # Concept performance analysis
    concept_performance = {}
    for record in progress_records:
        concept = record.concept
        if concept not in concept_performance:
            concept_performance[concept] = {
                "missions_completed": 0,
                "total_score": 0,
                "total_time_minutes": 0,
                "avg_score": 0,
                "avg_time_minutes": 0
            }
        
        concept_performance[concept]["missions_completed"] += 1
        concept_performance[concept]["total_score"] += record.score_earned
        concept_performance[concept]["total_time_minutes"] += record.time_spent_seconds / 60.0
    
    # Calculate averages
    for concept_data in concept_performance.values():
        if concept_data["missions_completed"] > 0:
            concept_data["avg_score"] = concept_data["total_score"] / concept_data["missions_completed"]
            concept_data["avg_time_minutes"] = concept_data["total_time_minutes"] / concept_data["missions_completed"]
    
    # Level progression
    levels = ["débutant", "intermédiaire", "avancé"]
    level_progression = {}
    
    for level in levels:
        level_missions = db.query(Progress).filter(
            Progress.student_id == student_id,
            Progress.level == level
        ).all()
        
        total_missions_in_level = len(game_loader.get_missions_by_level(level))
        completed_missions = len(level_missions)
        
        level_progression[level] = {
            "completed": completed_missions,
            "total": total_missions_in_level,
            "percentage": (completed_missions / total_missions_in_level * 100) if total_missions_in_level > 0 else 0,
            "avg_score": sum(m.score_earned for m in level_missions) / len(level_missions) if level_missions else 0,
            "total_time_hours": sum(m.time_spent_seconds for m in level_missions) / 3600.0
        }
    
    return StudentChartData(
        metrics_over_time=metrics_over_time,
        mission_timeline=mission_timeline,
        concept_performance=concept_performance,
        level_progression=level_progression
    )

@router.get("/teachers/{teacher_id}/students/{student_id}/metrics", response_model=TeacherStudentMetrics)
async def get_teacher_student_metrics(teacher_id: int, student_id: int, db: Session = Depends(get_db)):
    # Verify teacher exists
    teacher = db.query(User).filter(
        User.id == teacher_id, 
        User.role == UserRole.TEACHER
    ).first()
    
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Get student
    student = db.query(User).filter(
        User.id == student_id, 
        User.role == UserRole.STUDENT
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get student's progress
    progress_records = db.query(Progress).filter(
        Progress.student_id == student_id
    ).all()
    
    if not progress_records:
        raise HTTPException(status_code=404, detail="No progress data found for student")
    
    # Calculate metrics
    total_time_seconds = sum(record.time_spent_seconds for record in progress_records)
    total_time_hours = total_time_seconds / 3600.0
    avg_time_per_mission_minutes = (total_time_seconds / len(progress_records)) / 60.0
    avg_score_per_mission = sum(record.score_earned for record in progress_records) / len(progress_records)
    
    # Determine engagement level
    recent_activity = db.query(Progress).filter(
        Progress.student_id == student_id,
        Progress.completed_at >= datetime.utcnow() - timedelta(days=7)
    ).count()
    
    if recent_activity >= 5:
        engagement_level = "high"
    elif recent_activity >= 2:
        engagement_level = "medium"
    else:
        engagement_level = "low"
    
    # Concept performance
    concept_performance = {}
    for record in progress_records:
        concept = record.concept
        if concept not in concept_performance:
            concept_performance[concept] = {
                "missions_completed": 0,
                "avg_score": 0,
                "avg_time_minutes": 0,
                "total_score": 0,
                "total_time": 0
            }
        
        concept_performance[concept]["missions_completed"] += 1
        concept_performance[concept]["total_score"] += record.score_earned
        concept_performance[concept]["total_time"] += record.time_spent_seconds
    
    # Calculate averages
    for concept_data in concept_performance.values():
        if concept_data["missions_completed"] > 0:
            concept_data["avg_score"] = concept_data["total_score"] / concept_data["missions_completed"]
            concept_data["avg_time_minutes"] = (concept_data["total_time"] / concept_data["missions_completed"]) / 60.0
    
    # Recent activity
    recent_progress = db.query(Progress).filter(
        Progress.student_id == student_id
    ).order_by(desc(Progress.completed_at)).limit(10).all()
    
    recent_activity_list = [
        MissionTimelinePoint(
            date=record.completed_at,
            mission_id=record.mission_id,
            concept=record.concept,
            level=record.level,
            score_earned=record.score_earned,
            time_spent_minutes=round(record.time_spent_seconds / 60.0, 2),
            time_spent_seconds=record.time_spent_seconds
        )
        for record in recent_progress
    ]
    
    return TeacherStudentMetrics(
        student_id=student_id,
        student_name=student.name,
        total_time_spent_hours=total_time_hours,
        avg_time_per_mission_minutes=avg_time_per_mission_minutes,
        avg_score_per_mission=avg_score_per_mission,
        engagement_level=engagement_level,
        concept_performance=concept_performance,
        recent_activity=recent_activity_list
    )

@router.get("/teachers/{teacher_id}/dashboard", response_model=TeacherDashboard)
async def get_teacher_dashboard(teacher_id: int, db: Session = Depends(get_db)):
    # Verify teacher exists
    teacher = db.query(User).filter(
        User.id == teacher_id, 
        User.role == UserRole.TEACHER
    ).first()
    
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Get all students
    total_students = db.query(User).filter(User.role == UserRole.STUDENT).count()
    
    # Active students in last week
    one_week_ago = datetime.utcnow() - timedelta(days=7)
    active_students_last_week = db.query(Progress.student_id).filter(
        Progress.completed_at >= one_week_ago
    ).distinct().count()
    
    # Average completion rate
    all_students = db.query(User).filter(User.role == UserRole.STUDENT).all()
    total_possible_missions = len(game_loader.get_all_missions())
    
    completion_rates = []
    for student in all_students:
        completed_missions = db.query(Progress).filter(
            Progress.student_id == student.id
        ).count()
        completion_rate = (completed_missions / total_possible_missions) * 100 if total_possible_missions > 0 else 0
        completion_rates.append(completion_rate)
    
    avg_completion_rate = sum(completion_rates) / len(completion_rates) if completion_rates else 0
    
    # Top performing students
    top_students_query = db.query(
        User.id,
        User.name,
        User.total_score,
        func.count(Progress.id).label('missions_completed')
    ).join(Progress, User.id == Progress.student_id)\
     .filter(User.role == UserRole.STUDENT)\
     .group_by(User.id, User.name, User.total_score)\
     .order_by(desc(User.total_score))\
     .limit(5).all()
    
    top_performing_students = [
        {
            "student_id": student.id,
            "name": student.name,
            "total_score": student.total_score,
            "missions_completed": student.missions_completed
        }
        for student in top_students_query
    ]
    
    # Concept difficulty analysis
    concept_stats = db.query(
        Progress.concept,
        func.avg(Progress.score_earned).label('avg_score'),
        func.avg(Progress.time_spent_seconds).label('avg_time'),
        func.count(Progress.id).label('attempts')
    ).group_by(Progress.concept).all()
    
    concept_difficulty_analysis = {}
    for stat in concept_stats:
        difficulty = "easy"
        if stat.avg_score < 10:
            difficulty = "hard"
        elif stat.avg_score < 15:
            difficulty = "medium"
        
        concept_difficulty_analysis[stat.concept] = {
            "avg_score": float(stat.avg_score),
            "avg_time_minutes": float(stat.avg_time) / 60.0,
            "total_attempts": stat.attempts,
            "difficulty": difficulty
        }
    
    # Engagement trends (last 30 days)
    engagement_trends = []
    for i in range(30):
        date = datetime.utcnow() - timedelta(days=i)
        daily_missions = db.query(Progress).filter(
            func.date(Progress.completed_at) == date.date()
        ).count()
        
        engagement_trends.append({
            "date": date.date().isoformat(),
            "missions_completed": daily_missions
        })
    
    engagement_trends.reverse()  # Oldest first
    
    return TeacherDashboard(
        total_students=total_students,
        active_students_last_week=active_students_last_week,
        avg_completion_rate=avg_completion_rate,
        top_performing_students=top_performing_students,
        concept_difficulty_analysis=concept_difficulty_analysis,
        engagement_trends=engagement_trends
    )