from typing import Dict, List, Set
from utils.game_loader import GameLoader
from services.features_service import compute_features_from_student_id, build_mission_index
from services.profile_service import get_student_profile, get_student_level_ai
from services.progress_service import get_done_mission_ids, get_recent_progress_for_student
from models.profile import ProfileType, PROFILE_LABELS

CONCEPTS_BY_JOB = {
    ProfileType.GESTION_PORTEFEUILLE: ["Marché Boursier", "Marché des Changes", "Analyse Technique Fondamentale", "Allocation d'Actifs Stratégique","Gestion des Risques de Portefeuille", "Marchés Dérivés et Couverture", "Performance et Attribution"],
    ProfileType.ANALYSTE_FINANCE: ["Finance d'entreprise", "Évaluation d’entreprise", "Finance Sectorielle", "Analyse Fondamentale des Entreprises", "Modélisation Financière", "Analyse sectorielle","Analyse de Crédit (Buy-side)","Recherche et recommandations"],
    ProfileType.BANQUIER_AFFAIRES: ["Gestion de Trésorerie & Financement", "Gestion des Risques Transactionnels", "Structuration de financements", "Origination et développement commercial", "Due Diligence et Analyse Crédit", "Marchés de capitaux", "Conseil stratégique", "Relations investisseurs", "Refinancement et restructuration", "Financement de projet", "Conformité et Réglementation", "Innovation financière" ]
}

PROGRESS_MESSAGES = {
    1: "Première mission accomplie ! Continue sur ta lancée",
    2: "Tu prends tes marques, c'est bien !",
    3: "Ton profil d'investisseur commence à se dessiner...",
    4: "Encore quelques missions pour débloquer l'analyse complète",
    5: "Bientôt, tu auras accès à toutes les recommandations avancées !"
}

STAGE_THRESHOLDS = {
    "cold_start": 0,
    "early_stage": 6,
    "experienced": float('inf')
}


def concepts_allowed_for_job(job: ProfileType) -> Set[str]:
    """Retourne les concepts autorisés pour un métier donné."""
    return set(CONCEPTS_BY_JOB.get(job, []))


def get_explored_concepts(student_id: int, missions: List[Dict]) -> Set[str]:
    """Retourne l'ensemble des concepts explorés par l'étudiant."""
    done_ids = get_done_mission_ids(student_id)
    return {m["concept"] for m in missions if m["mission_id"] in done_ids}


def get_student_job_type(student_id: int) -> ProfileType:
    """Récupère le type de métier de l'étudiant."""
    profile_name = get_student_profile(student_id)
    if not profile_name:
        profile_name = "Gestionnaire de Portefeuille"
    
    name_to_profile = {name: profile_type for profile_type, name in PROFILE_LABELS.items()}
    return name_to_profile.get(profile_name, ProfileType.GESTION_PORTEFEUILLE)


def compute_goal_recommendations(alerts: List[Dict], opportunities: List[Dict]) -> Dict:
    """Calcule les priorités et badges pour chaque objectif."""
    goal_recommendations = {
        "reduce_stress": {"priority": 0, "badge": None},
        "boost_rentabilite": {"priority": 0, "badge": None},
        "preserve_liquidity": {"priority": 0, "badge": None},
        "balance": {"priority": 0, "badge": None}
    }
    
    for alert in alerts:
        goal = alert.get("suggested_goal")
        if goal:
            goal_recommendations[goal]["priority"] += 2
            goal_recommendations[goal]["badge"] = alert["icon"]
    
    for opp in opportunities:
        goal = opp.get("suggested_goal")
        if goal:
            goal_recommendations[goal]["priority"] += 1
            if not goal_recommendations[goal]["badge"]:
                goal_recommendations[goal]["badge"] = opp["icon"]
    
    return goal_recommendations


def detect_stress_alert(feats: Dict) -> Dict:
    """Détecte si le stress est critique."""
    if feats.get("pct_stress_up", 0) >= 0.5:
        return {
            "severity": "warning",
            "metric": "stress",
            "text": f"Ton stress augmente dans {int(feats['pct_stress_up']*100)}% de tes missions récentes",
            "suggested_goal": "reduce_stress",
            "icon": "⚠️",
            "details": {
                "pct_high_risk": feats.get("pct_high_risk", 0),
                "avg_risk_rank": feats.get("avg_risk_rank", 0)
            }
        }
    return None


def detect_cashflow_alert(feats: Dict) -> Dict:
    """Détecte si le cashflow est en danger."""
    if feats.get("ratio_ret_up_vs_ctrl_cf_down", 0) >= 0.6:
        return {
            "severity": "warning",
            "metric": "cashflow",
            "text": "Tu sacrifies souvent cashflow/contrôle pour la rentabilité",
            "suggested_goal": "preserve_liquidity",
            "icon": "💰"
        }
    return None


def detect_entropy_alert(feats: Dict) -> Dict:
    """Détecte si les choix sont trop prévisibles."""
    if feats.get("choice_entropy", 1.0) < 0.4:
        return {
            "severity": "info",
            "metric": "strategy",
            "text": "Tes choix sont très prévisibles, essaie de varier tes stratégies",
            "suggested_goal": "balance",
            "icon": "🔄"
        }
    return None


def detect_coverage_alert(feats: Dict) -> Dict:
    """Détecte si la couverture des concepts est faible."""
    if feats.get("concept_coverage", 0) < 0.4:
        return {
            "severity": "info",
            "metric": "learning",
            "text": f"Tu n'as exploré que {int(feats['concept_coverage']*100)}% des concepts disponibles",
            "suggested_goal": "balance",
            "icon": "📚"
        }
    return None


def detect_early_stress_pattern(feats: Dict) -> Dict:
    """Détecte un pattern de stress élevé en début de parcours."""
    if feats.get("pct_stress_up", 0) >= 0.6:
        return {
            "severity": "info",
            "metric": "stress",
            "text": "Tes premières missions ont beaucoup augmenté le stress",
            "suggested_goal": "reduce_stress",
            "icon": "💡"
        }
    return None


def collect_alerts(feats: Dict, stage: str) -> List[Dict]:
    """Collecte toutes les alertes pertinentes selon le stage."""
    alerts = []
    
    if stage == "experienced":
        detectors = [
            detect_stress_alert,
            detect_cashflow_alert,
            detect_entropy_alert,
            detect_coverage_alert
        ]
    elif stage == "early":
        detectors = [detect_early_stress_pattern]
    else:
        return []
    
    for detector in detectors:
        alert = detector(feats)
        if alert:
            alerts.append(alert)
    
    return alerts


# ============================================================================
# OPPORTUNITY DETECTION
# ============================================================================

def detect_momentum_opportunity(feats: Dict) -> Dict:
    """Détecte une opportunité de momentum positif."""
    if feats.get("avg_risk_rank", 0) > 0 and feats.get("pct_stress_up", 0) < 0.3:
        return {
            "type": "momentum",
            "text": "Tu gères bien le risque ! Moment idéal pour augmenter la rentabilité",
            "suggested_goal": "boost_rentabilite",
            "icon": "⚡"
        }
    return None


def detect_stability_opportunity(feats: Dict) -> Dict:
    """Détecte une situation stable propice à l'exploration."""
    if feats.get("pct_stress_up", 0) < 0.3 and feats.get("ratio_ret_up_vs_ctrl_cf_down", 0) < 0.4:
        return {
            "type": "stable",
            "text": "Situation stable, parfait pour explorer de nouveaux concepts",
            "suggested_goal": "balance",
            "icon": "🎯"
        }
    return None


def detect_mastery_opportunity(feats: Dict) -> Dict:
    """Détecte une bonne maîtrise des événements."""
    if feats.get("event_view_rate", 0) >= 0.7 and feats.get("quick_check_correct_rate", 0) >= 0.6:
        return {
            "type": "mastery",
            "text": "Tu maîtrises bien les événements de marché, continue !",
            "icon": "🏆"
        }
    return None


def detect_pacing_opportunity(feats: Dict) -> Dict:
    """Détecte un pattern de rush."""
    if feats.get("time_z", 0) > 1.5:
        return {
            "type": "pacing",
            "text": "Tu te précipites souvent, prendre ton temps pourrait améliorer tes scores",
            "icon": "⏱️"
        }
    return None


def detect_diversity_opportunity(explored_count: int, total_missions: int) -> Dict:
    """Détecte le besoin de diversification en début de parcours."""
    if explored_count == 1 and total_missions >= 3:
        return {
            "type": "diversity",
            "text": "Essaie un nouveau concept pour élargir tes compétences",
            "suggested_goal": "balance",
            "icon": "🌟"
        }
    return None


def collect_opportunities(feats: Dict, stage: str, explored_count: int = 0, total_missions: int = 0) -> List[Dict]:
    """Collecte toutes les opportunités pertinentes selon le stage."""
    opportunities = []
    
    if stage == "experienced":
        detectors = [
            detect_momentum_opportunity,
            detect_stability_opportunity,
            detect_mastery_opportunity,
            detect_pacing_opportunity
        ]
        for detector in detectors:
            opp = detector(feats)
            if opp:
                opportunities.append(opp)
    
    elif stage == "early":
        # Opportunité de diversité
        div_opp = detect_diversity_opportunity(explored_count, total_missions)
        if div_opp:
            opportunities.append(div_opp)
    
    return opportunities



def build_cold_start_context(student_id: int, profile_name: str, job: ProfileType, tilt: str) -> Dict:
    """Construit le contexte pour un nouvel étudiant."""
    all_concepts = concepts_allowed_for_job(job)
    
    return {
        "stage": "cold_start",
        "welcome_message": {
            "title": f"Bienvenue dans ta carrière de {profile_name} !",
            "text": "Commence par explorer les concepts de base pour débloquer des missions plus complexes.",
            "icon": "🚀"
        },
        "onboarding_tips": [
            {
                "icon": "🎯",
                "text": "Chaque objectif influence tes indicateurs différemment"
            },
            {
                "icon": "📊",
                "text": "Tes choix détermineront ton profil d'investisseur"
            },
            {
                "icon": "🔓",
                "text": "Complète des missions débutantes pour débloquer les niveaux avancés"
            }
        ],
        "alerts": [],
        "opportunities": [
            {
                "type": "discovery",
                "text": "Commence par un objectif équilibré pour découvrir le jeu",
                "suggested_goal": "balance",
                "icon": "🎯"
            }
        ],
        "concepts": {
            "explored": 0,
            "total": len(all_concepts),
            "unexplored_preview": list(all_concepts)[:3],
            "message": "Tous les concepts t'attendent !"
        },
        "profile_tilt": tilt or "En cours d'analyse",
        "goal_recommendations": {
            "reduce_stress": {"priority": 0, "badge": None},
            "boost_rentabilite": {"priority": 0, "badge": None},
            "preserve_liquidity": {"priority": 0, "badge": None},
            "balance": {"priority": 2, "badge": "🎯"}
        }
    }


def build_early_stage_context(
    student_id: int,
    total_missions: int,
    profile_name: str,
    job: ProfileType,
    tilt: str,
    missions: List[Dict],
    explored: Set[str],
    unexplored: List[str],
    feats: Dict
) -> Dict:
    """Construit le contexte pour un étudiant débutant."""
    progress_message = PROGRESS_MESSAGES.get(total_missions, "Continue comme ça !")
    
    alerts = collect_alerts(feats, "early")
    
    opportunities = [
        {
            "type": "learning",
            "text": progress_message,
            "icon": "📈"
        }
    ]
    opportunities.extend(collect_opportunities(feats, "early", len(explored), total_missions))
    
    goal_recommendations = compute_goal_recommendations(alerts, opportunities)
    
    all_concepts = concepts_allowed_for_job(job)
    
    return {
        "stage": "early",
        "progress_message": {
            "text": progress_message,
            "missions_to_full_analysis": max(0, 6 - total_missions),
            "icon": "🌱"
        },
        "alerts": alerts,
        "opportunities": opportunities,
        "concepts": {
            "explored": len(explored),
            "total": len(all_concepts),
            "unexplored_preview": unexplored[:3],
            "message": f"Tu as exploré {len(explored)} concept{'s' if len(explored) > 1 else ''}"
        },
        "profile_tilt": tilt or "En cours d'analyse...",
        "goal_recommendations": goal_recommendations
    }


def build_experienced_context(
    student_id: int,
    profile_name: str,
    job: ProfileType,
    tilt: str,
    missions: List[Dict],
    explored: Set[str],
    unexplored: List[str],
    feats: Dict
) -> Dict:
    """Construit le contexte pour un étudiant expérimenté."""
    alerts = collect_alerts(feats, "experienced")
    opportunities = collect_opportunities(feats, "experienced")
    goal_recommendations = compute_goal_recommendations(alerts, opportunities)
    
    all_concepts = concepts_allowed_for_job(job)
    
    return {
        "stage": "experienced",
        "alerts": alerts,
        "opportunities": opportunities,
        "concepts": {
            "explored": len(explored),
            "total": len(all_concepts),
            "unexplored_preview": unexplored[:3],
            "coverage_pct": int(feats.get("concept_coverage", 0) * 100)
        },
        "profile_tilt": tilt,
        "goal_recommendations": goal_recommendations,
        "advanced_metrics": {
            "risk_profile": {
                "high_risk_pct": int(feats.get("pct_high_risk", 0) * 100),
                "avg_rank": round(feats.get("avg_risk_rank", 0), 2)
            },
            "decision_style": {
                "entropy": round(feats.get("choice_entropy", 0), 2),
                "quick_decisions": int(feats.get("time_z", 0) > 1)
            },
            "event_engagement": {
                "view_rate": int(feats.get("event_view_rate", 0) * 100),
                "correct_rate": int(feats.get("quick_check_correct_rate", 0) * 100)
            }
        }
    }



def get_strategic_context(student_id: int) -> Dict:
    """
    Génère le contexte stratégique adaptatif selon l'expérience de l'étudiant.
    
    Args:
        student_id: ID de l'étudiant
        
    Returns:
        Dict contenant le contexte stratégique avec alertes, opportunités et recommandations
    """
    # 1. Récupérer les données de base
    total_missions = len(get_done_mission_ids(student_id))
    profile_name = get_student_profile(student_id)
    if not profile_name:
        profile_name = "Gestionnaire de Portefeuille"
    
    job = get_student_job_type(student_id)
    tilt = get_student_level_ai(student_id)
    
    # 2. Cold start : aucune mission
    if total_missions == 0:
        return build_cold_start_context(student_id, profile_name, job, tilt)
    
    # 3. Charger missions et concepts explorés
    game_loader = GameLoader()
    missions = build_mission_index(game_loader.missions)
    explored = get_explored_concepts(student_id, missions)
    all_concepts = concepts_allowed_for_job(job)
    unexplored = list(all_concepts - explored)
    
    # 4. Early stage : peu d'historique
    if total_missions < 6:
        try:
            feats = compute_features_from_student_id(student_id)
        except:
            feats = {}
        
        return build_early_stage_context(
            student_id, total_missions, profile_name, job, tilt,
            missions, explored, unexplored, feats
        )
    
    feats = compute_features_from_student_id(student_id)
    
    return build_experienced_context(
        student_id, profile_name, job, tilt,
        missions, explored, unexplored, feats
    )