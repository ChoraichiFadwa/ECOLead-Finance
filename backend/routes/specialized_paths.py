from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.domain import UserProfile, Concept, UserProgress, Domain
from pydantic import BaseModel
from typing import List, Dict, Optional
import json

router = APIRouter()

class LearningPathResponse(BaseModel):
    profile_type: str
    profile_name: str
    total_concepts: int
    completed_concepts: int
    progress_percentage: float
    current_phase: str
    next_milestone: Optional[Dict]
    learning_phases: List[Dict]

class ConceptDetailResponse(BaseModel):
    id: int
    name: str
    description: str
    domain_name: str
    difficulty_level: str
    estimated_duration: int
    prerequisites_met: bool
    is_completed: bool
    score: Optional[float]
    learning_objectives: List[str]
    key_skills: List[str]
    practical_exercises: List[Dict]

@router.get("/specialized-paths/{user_id}/overview", response_model=LearningPathResponse)
async def get_specialized_path_overview(user_id: int, db: Session = Depends(get_db)):
    """Get overview of user's specialized learning path"""
    # Get active profile
    active_profile = db.query(UserProfile).filter(
        UserProfile.user_id == user_id,
        UserProfile.is_active == True
    ).first()
    
    if not active_profile:
        raise HTTPException(status_code=404, detail="No active profile found")
    
    # Load domains structure
    with open("backend/data/domains_structure.json", "r", encoding="utf-8") as f:
        domains_data = json.load(f)
    
    profile_key = active_profile.profile_type.lower().replace("gestiondeportefeuilleBoursier", "gestion_portefeuille_boursier").replace("lecturedesindicateurstechniques", "lecture_indicateurs_techniques").replace("simulationdelevéedefonds", "simulation_levee_fonds")
    
    if profile_key not in domains_data["profiles"]:
        raise HTTPException(status_code=404, detail="Profile configuration not found")
    
    profile_config = domains_data["profiles"][profile_key]
    required_concept_ids = profile_config["required_concepts"]
    
    # Get user progress for required concepts
    user_progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.concept_id.in_(required_concept_ids)
    ).all()
    
    completed_concepts = sum(1 for p in user_progress if p.is_completed)
    progress_percentage = (completed_concepts / len(required_concept_ids)) * 100 if required_concept_ids else 0
    
    # Determine current phase and next milestone
    phases = _get_learning_phases(profile_key, domains_data, user_progress)
    current_phase = _determine_current_phase(phases)
    next_milestone = _get_next_milestone(phases)
    
    return LearningPathResponse(
        profile_type=active_profile.profile_type,
        profile_name=profile_config["name"],
        total_concepts=len(required_concept_ids),
        completed_concepts=completed_concepts,
        progress_percentage=progress_percentage,
        current_phase=current_phase,
        next_milestone=next_milestone,
        learning_phases=phases
    )

@router.get("/specialized-paths/{user_id}/concept/{concept_id}", response_model=ConceptDetailResponse)
async def get_concept_details(user_id: int, concept_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a specific concept"""
    concept = db.query(Concept).filter(Concept.id == concept_id).first()
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found")
    
    # Get user progress
    user_progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.concept_id == concept_id
    ).first()
    
    # Check prerequisites
    prerequisites_met = _check_prerequisites(user_id, concept_id, db)
    
    # Get concept details from domains structure
    concept_details = _get_concept_learning_content(concept_id)
    
    return ConceptDetailResponse(
        id=concept.id,
        name=concept.title,
        description=concept.description,
        domain_name=concept.domain.name if concept.domain else "Unknown",
        difficulty_level=concept.difficulty_level or "intermediate",
        estimated_duration=concept_details.get("estimated_duration", 30),
        prerequisites_met=prerequisites_met,
        is_completed=user_progress.is_completed if user_progress else False,
        score=user_progress.score if user_progress else None,
        learning_objectives=concept_details.get("learning_objectives", []),
        key_skills=concept_details.get("key_skills", []),
        practical_exercises=concept_details.get("practical_exercises", [])
    )

@router.post("/specialized-paths/{user_id}/concept/{concept_id}/complete")
async def complete_concept(user_id: int, concept_id: int, score: float, db: Session = Depends(get_db)):
    """Mark a concept as completed with a score"""
    # Check if concept exists
    concept = db.query(Concept).filter(Concept.id == concept_id).first()
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found")
    
    # Check prerequisites
    if not _check_prerequisites(user_id, concept_id, db):
        raise HTTPException(status_code=400, detail="Prerequisites not met")
    
    # Update or create progress
    user_progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.concept_id == concept_id
    ).first()
    
    if user_progress:
        user_progress.is_completed = True
        user_progress.score = score
    else:
        user_progress = UserProgress(
            user_id=user_id,
            concept_id=concept_id,
            is_completed=True,
            score=score
        )
        db.add(user_progress)
    
    db.commit()
    
    # Update profile performance score
    _update_profile_performance(user_id, db)
    
    return {"message": "Concept completed successfully", "score": score}

@router.get("/specialized-paths/{user_id}/recommendations")
async def get_learning_recommendations(user_id: int, db: Session = Depends(get_db)):
    """Get personalized learning recommendations"""
    active_profile = db.query(UserProfile).filter(
        UserProfile.user_id == user_id,
        UserProfile.is_active == True
    ).first()
    
    if not active_profile:
        raise HTTPException(status_code=404, detail="No active profile found")
    
    # Get user's completed concepts
    completed_progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.is_completed == True
    ).all()
    
    completed_concept_ids = [p.concept_id for p in completed_progress]
    
    # Load domains structure and get recommendations
    with open("backend/data/domains_structure.json", "r", encoding="utf-8") as f:
        domains_data = json.load(f)
    
    recommendations = _generate_recommendations(
        active_profile.profile_type, 
        completed_concept_ids, 
        domains_data,
        db
    )
    
    return {"recommendations": recommendations}

def _get_learning_phases(profile_key: str, domains_data: dict, user_progress: list) -> List[Dict]:
    """Generate learning phases for a profile"""
    profile_config = domains_data["profiles"][profile_key]
    required_concepts = profile_config["required_concepts"]
    
    # Group concepts by domain and difficulty
    phases = []
    
    if profile_key == "gestion_portefeuille_boursier":
        phases = [
            {
                "name": "Fondations Financières",
                "description": "Maîtriser les bases de l'analyse financière",
                "concepts": [1, 2, 3],
                "completed": _count_completed_concepts([1, 2, 3], user_progress),
                "total": 3
            },
            {
                "name": "Marchés et Instruments",
                "description": "Comprendre les marchés financiers et leurs instruments",
                "concepts": [4, 5, 6],
                "completed": _count_completed_concepts([4, 5, 6], user_progress),
                "total": 3
            },
            {
                "name": "Gestion des Risques",
                "description": "Apprendre à identifier et gérer les risques",
                "concepts": [13],
                "completed": _count_completed_concepts([13], user_progress),
                "total": 1
            },
            {
                "name": "Construction de Portefeuille",
                "description": "Techniques avancées de gestion de portefeuille",
                "concepts": [16, 17, 18],
                "completed": _count_completed_concepts([16, 17, 18], user_progress),
                "total": 3
            },
            {
                "name": "Finance Internationale",
                "description": "Investissement et gestion sur les marchés internationaux",
                "concepts": [19, 20, 21],
                "completed": _count_completed_concepts([19, 20, 21], user_progress),
                "total": 3
            }
        ]
    elif profile_key == "lecture_indicateurs_techniques":
        phases = [
            {
                "name": "Bases des Marchés",
                "description": "Comprendre le fonctionnement des marchés",
                "concepts": [1, 4],
                "completed": _count_completed_concepts([1, 4], user_progress),
                "total": 2
            },
            {
                "name": "Analyse Graphique",
                "description": "Maîtriser la lecture des graphiques",
                "concepts": [7],
                "completed": _count_completed_concepts([7], user_progress),
                "total": 1
            },
            {
                "name": "Indicateurs Techniques",
                "description": "Utiliser les indicateurs pour analyser les marchés",
                "concepts": [8],
                "completed": _count_completed_concepts([8], user_progress),
                "total": 1
            },
            {
                "name": "Stratégies de Trading",
                "description": "Développer des stratégies basées sur l'analyse technique",
                "concepts": [9],
                "completed": _count_completed_concepts([9], user_progress),
                "total": 1
            },
            {
                "name": "Produits Dérivés",
                "description": "Appliquer l'analyse technique aux dérivés",
                "concepts": [6],
                "completed": _count_completed_concepts([6], user_progress),
                "total": 1
            }
        ]
    elif profile_key == "simulation_levee_fonds":
        phases = [
            {
                "name": "Fondations Financières",
                "description": "Bases de l'analyse et évaluation d'entreprise",
                "concepts": [1, 2, 3],
                "completed": _count_completed_concepts([1, 2, 3], user_progress),
                "total": 3
            },
            {
                "name": "Sources de Financement",
                "description": "Comprendre les différentes options de financement",
                "concepts": [10],
                "completed": _count_completed_concepts([10], user_progress),
                "total": 1
            },
            {
                "name": "Levée de Fonds",
                "description": "Processus et techniques de levée de fonds",
                "concepts": [11],
                "completed": _count_completed_concepts([11], user_progress),
                "total": 1
            },
            {
                "name": "Financement Bancaire",
                "description": "Relations bancaires et crédits d'entreprise",
                "concepts": [12],
                "completed": _count_completed_concepts([12], user_progress),
                "total": 1
            },
            {
                "name": "Gestion des Risques",
                "description": "Risques de crédit et opérationnels",
                "concepts": [14, 15],
                "completed": _count_completed_concepts([14, 15], user_progress),
                "total": 2
            }
        ]
    
    return phases

def _count_completed_concepts(concept_ids: List[int], user_progress: list) -> int:
    """Count completed concepts from a list"""
    completed_ids = [p.concept_id for p in user_progress if p.is_completed]
    return len([cid for cid in concept_ids if cid in completed_ids])

def _determine_current_phase(phases: List[Dict]) -> str:
    """Determine the current learning phase"""
    for phase in phases:
        if phase["completed"] < phase["total"]:
            return phase["name"]
    return phases[-1]["name"] if phases else "Completed"

def _get_next_milestone(phases: List[Dict]) -> Optional[Dict]:
    """Get the next milestone to achieve"""
    for phase in phases:
        if phase["completed"] < phase["total"]:
            return {
                "phase_name": phase["name"],
                "description": phase["description"],
                "progress": f"{phase['completed']}/{phase['total']}",
                "percentage": (phase["completed"] / phase["total"]) * 100
            }
    return None

def _check_prerequisites(user_id: int, concept_id: int, db: Session) -> bool:
    """Check if user has completed prerequisites for a concept"""
    # Load domains structure to get prerequisites
    with open("backend/data/domains_structure.json", "r", encoding="utf-8") as f:
        domains_data = json.load(f)
    
    # Find concept prerequisites
    prerequisites = []
    for domain in domains_data["domains"]:
        for concept in domain["concepts"]:
            if concept["id"] == concept_id:
                prerequisites = concept.get("prerequisite_concepts", [])
                break
    
    if not prerequisites:
        return True
    
    # Check if all prerequisites are completed
    completed_progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.concept_id.in_(prerequisites),
        UserProgress.is_completed == True
    ).count()
    
    return completed_progress == len(prerequisites)

def _get_concept_learning_content(concept_id: int) -> Dict:
    """Get detailed learning content for a concept"""
    # This would typically come from a content management system
    # For now, return structured learning content
    content_map = {
        1: {
            "estimated_duration": 45,
            "learning_objectives": [
                "Lire et interpréter un bilan comptable",
                "Calculer les ratios financiers de base",
                "Analyser la santé financière d'une entreprise"
            ],
            "key_skills": ["Analyse de bilan", "Calcul de ratios", "Interprétation financière"],
            "practical_exercises": [
                {"type": "case_study", "title": "Analyse d'une entreprise cotée", "duration": 30},
                {"type": "quiz", "title": "Ratios financiers", "duration": 15}
            ]
        },
        7: {
            "estimated_duration": 60,
            "learning_objectives": [
                "Identifier les tendances sur un graphique",
                "Reconnaître les figures chartistes",
                "Utiliser les supports et résistances"
            ],
            "key_skills": ["Lecture de graphiques", "Analyse des tendances", "Figures chartistes"],
            "practical_exercises": [
                {"type": "simulation", "title": "Identification de tendances", "duration": 45},
                {"type": "practice", "title": "Tracé de supports/résistances", "duration": 15}
            ]
        },
        11: {
            "estimated_duration": 90,
            "learning_objectives": [
                "Comprendre le processus de levée de fonds",
                "Préparer un pitch deck efficace",
                "Négocier avec des investisseurs"
            ],
            "key_skills": ["Pitch deck", "Négociation", "Due diligence"],
            "practical_exercises": [
                {"type": "simulation", "title": "Simulation de levée de fonds", "duration": 60},
                {"type": "presentation", "title": "Pitch devant investisseurs", "duration": 30}
            ]
        }
    }
    
    return content_map.get(concept_id, {
        "estimated_duration": 30,
        "learning_objectives": ["Maîtriser les concepts clés"],
        "key_skills": ["Compétences spécialisées"],
        "practical_exercises": [{"type": "exercise", "title": "Exercice pratique", "duration": 20}]
    })

def _update_profile_performance(user_id: int, db: Session):
    """Update user's profile performance score"""
    active_profile = db.query(UserProfile).filter(
        UserProfile.user_id == user_id,
        UserProfile.is_active == True
    ).first()
    
    if not active_profile:
        return
    
    # Calculate average score from completed concepts
    user_progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.is_completed == True,
        UserProgress.score.isnot(None)
    ).all()
    
    if user_progress:
        avg_score = sum(p.score for p in user_progress) / len(user_progress)
        active_profile.performance_score = avg_score
        db.commit()

def _generate_recommendations(profile_type: str, completed_concepts: List[int], domains_data: dict, db: Session) -> List[Dict]:
    """Generate personalized learning recommendations"""
    recommendations = []
    
    # Find next logical concepts based on prerequisites and profile
    profile_key = profile_type.lower().replace("gestiondeportefeuilleBoursier", "gestion_portefeuille_boursier").replace("lecturedesindicateurstechniques", "lecture_indicateurs_techniques").replace("simulationdelevéedefonds", "simulation_levee_fonds")
    
    if profile_key in domains_data["profiles"]:
        required_concepts = domains_data["profiles"][profile_key]["required_concepts"]
        
        for domain in domains_data["domains"]:
            for concept in domain["concepts"]:
                if (concept["id"] in required_concepts and 
                    concept["id"] not in completed_concepts):
                    
                    # Check if prerequisites are met
                    prerequisites = concept.get("prerequisite_concepts", [])
                    prerequisites_met = all(pid in completed_concepts for pid in prerequisites)
                    
                    if prerequisites_met:
                        recommendations.append({
                            "concept_id": concept["id"],
                            "name": concept["name"],
                            "description": concept["description"],
                            "domain": domain["name"],
                            "priority": "high" if len(prerequisites) == 0 else "medium",
                            "estimated_duration": _get_concept_learning_content(concept["id"]).get("estimated_duration", 30)
                        })
    
    # Sort by priority and return top 5
    recommendations.sort(key=lambda x: (x["priority"] == "high", -len(x["name"])))
    return recommendations[:5]
