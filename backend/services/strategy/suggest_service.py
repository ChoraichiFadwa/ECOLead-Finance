import os
import joblib
from typing import List, Set, Tuple, Dict, Any
from models.schemas import SuggestRequest, SuggestResponse
from utils.game_loader import GameLoader
from services.features_service import compute_features_from_student_id, build_mission_index
from services.profile_service import get_student_profile
from services.progress_service import get_done_mission_ids, get_recent_progress_for_student
# --- Chargement IA ---
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../../../data/KMeans.pkl")
PIPELINE_PATH = os.path.join(os.path.dirname(__file__), "../../../data/pipeline.pkl")
# CŒUR DU SYSTÈME de suggestion 

try:
    kmeans = joblib.load(MODEL_PATH)
    pipeline = joblib.load(PIPELINE_PATH)
except:
    kmeans = None
    pipeline = None

TILT_MAP = {0: "prudent", 1: "equilibre", 2: "speculatif"}

def predict_tilt(features: Dict[str, float]) -> str:
    if not kmeans:
        return "equilibre"  # fallback
    feature_vector = [ # TODO no placeholde, use the real features to predict or take it from the profile database 
        
        features.get("pct_stress_up", 0),
        features.get("ratio_ret_up_vs_ctrl_cf_down", 0),
        # ... complète avec tes 13 features exactes
        # Si tu me donnes la liste, je les mets en 10s
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0  # placeholder
    ]
    X = [feature_vector]
    cluster = kmeans.predict(X)[0]
    return TILT_MAP.get(cluster, "equilibre")

# --- Règles produit ---
from models.profile import ProfileType, PROFILE_LABELS

concepts_by_job = {
    ProfileType.GESTION_PORTEFEUILLE: ["Marché Boursier", "Marché des Changes", "Analyse Technique Fondamentale", "Allocation d'Actifs Stratégique","Gestion des Risques de Portefeuille", "Marchés Dérivés et Couverture", "Performance et Attribution"],
    ProfileType.ANALYSTE_FINANCE: ["Finance d'entreprise", "Évaluation d’entreprise", "Finance Sectorielle", "Analyse Fondamentale des Entreprises", "Modélisation Financière", "Analyse sectorielle","Analyse de Crédit (Buy-side)","Recherche et recommandations"],
    ProfileType.BANQUIER_AFFAIRES: ["Gestion de Trésorerie & Financement", "Gestion des Risques Transactionnels", "Structuration de financements", "Origination et développement commercial", "Due Diligence et Analyse Crédit", "Marchés de capitaux", "Conseil stratégique", "Relations investisseurs", "Refinancement et restructuration", "Financement de projet", "Conformité et Réglementation", "Innovation financière" ]
}

LEVEL_ORDER = ["débutant", "intermédiaire", "avancé"]
IDX = {lvl: i for i, lvl in enumerate(LEVEL_ORDER)}

# --- Fonctions de gating ---
def concepts_allowed_for_job(job: ProfileType) -> Set[str]:
    return set(concepts_by_job.get(job, []))

def concept_unlock_level(student_id: int, concept: str, missions: List[Dict], threshold=1.0) -> str:
    by_lvl = {lvl: 0 for lvl in LEVEL_ORDER}
    done_by_lvl = {lvl: 0 for lvl in LEVEL_ORDER}
    done_ids = get_done_mission_ids(student_id)

    for m in missions:
        if m["concept"] != concept:
            continue
        lvl = m["niveau"]
        by_lvl[lvl] += 1
        if m["mission_id"] in done_ids:
            done_by_lvl[lvl] += 1

    def ok(lvl):
        total = by_lvl.get(lvl, 0)
        if total == 0:
            return True
        return (done_by_lvl.get(lvl, 0) / total) >= threshold

    if not ok("débutant"):
        return "débutant"
    if not ok("intermédiaire"):
        return "intermédiaire"
    return "avancé"

def eligible_missions(student_id: int, job: ProfileType, missions: List[Dict], concept_whitelist=None, threshold=1.0) -> List[Dict]:
    done_ids = get_done_mission_ids(student_id)
    allow_concepts = concepts_allowed_for_job(job)
    if concept_whitelist:
        allow_concepts = allow_concepts.intersection(set(concept_whitelist))
        print(f"[DEBUG] allowed concepts after whitelist: {allow_concepts}")

    pool = []
    for concept in allow_concepts:
        max_lvl = concept_unlock_level(student_id, concept, missions, threshold)
        print(f"[DEBUG] Concept '{concept}' → niveau max autorisé: {max_lvl}")
        for m in missions:
            mission_id = m.get("id") or m.get("mission_id")
            if m["concept"] != concept:
                continue
            if IDX[m["niveau"]] > IDX[max_lvl]:
                print(f"[DEBUG] Mission {m.get('id', m.get('mission_id', 'NO_ID'))} niveau {m['niveau']} > {max_lvl}, skipped")
                continue
            if m["mission_id"] in done_ids:
                continue
            print(f"[DEBUG] Mission {mission_id} added to pool")
            pool.append(m)
    return pool

# --- Scoring ---
PROFILE_TO_RANK = {"prudent": 0, "equilibre": 1, "speculatif": 2}

def expected_impact_for_profile(mission: Dict, profile: str) -> Dict:
    choix = mission.get("choix", {})
    # Cas 1 : "choix" est un dict → format standard
    if isinstance(choix, dict) and choix:
        pass  # OK, on garde tel quel
    # Cas 2 : "choix" est une liste → on la convertit
    elif isinstance(choix, list) and choix:
        # On suppose que c'est une liste de dicts avec "key" et "impact"
        try:
            choix = {
                item.get("key", f"choice_{i}"): {"impact": item.get("impact", {})}
                for i, item in enumerate(choix)
            }
        except:
            print(f"[DEBUG] ❌ Mission {mission.get('mission_id')} has 'choix' as list but invalid format")
            return {}
    # Cas 3 : on utilise "choices" + "impacts"
    else:
        choice_keys = mission.get("choices", [])
        impacts = mission.get("impacts", [])
        if not choice_keys or not impacts:
            print(f"[DEBUG] ❌ Mission {mission.get('mission_id')} has no valid choix/choices+impacts")
            return {}
        # Créer un dict à partir des listes
        choix = {
            key: {"impact": impact}
            for key, impact in zip(choice_keys, impacts)
        }

    # if not choix:
    #     return {}
    imps = []
    for key, data in choix.items():
        impact = data.get("impact", {})
        risk_score = (
            impact.get("stress", 0) * 2 +
            impact.get("cashflow", 0) * -1 +
            impact.get("rentabilite", 0) * 1
        )
        imps.append((key, risk_score, impact))
    imps_sorted = sorted(imps, key=lambda x: x[1])
    order = [k for k, _, _ in imps_sorted]
    want = min(PROFILE_TO_RANK.get(profile, 1), len(order) - 1)
    chosen_key = order[want]
    for k, _, imp in imps_sorted:
        if k == chosen_key:
            return imp
    return {}

GOAL_WEIGHTS = {
    "reduce_stress": {"stress": -1.0, "cashflow": 0.3, "controle": 0.2, "rentabilite": 0.1},
    "boost_rentabilite": {"rentabilite": 1.0, "cashflow": 0.2, "reputation": 0.2},
    "preserve_liquidity": {"cashflow": 1.0, "controle": 0.4, "stress": -0.2},
    "balance": {"rentabilite": 0.6, "cashflow": 0.4, "controle": 0.3, "stress": -0.3}
}

def kpi_goal_score(exp_imp: Dict, goal: str) -> float:
    w = GOAL_WEIGHTS[goal]
    return (
        w.get("rentabilite", 0) * max(0.0, exp_imp.get("rentabilite", 0.0)) +
        w.get("cashflow", 0) * max(0.0, exp_imp.get("cashflow", 0.0)) +
        w.get("controle", 0) * max(0.0, exp_imp.get("controle", 0.0)) +
        w.get("stress", 0) * (-max(0.0, exp_imp.get("stress", 0.0))) +
        w.get("reputation", 0) * max(0.0, exp_imp.get("reputation", 0.0))
    )

def gap_score(exp_imp: Dict, feats: Dict) -> float:
    bonus = 0.0
    if feats.get("pct_stress_up", 0) >= 0.45 and exp_imp.get("stress", 0) <= 0:
        bonus += 0.6
    if feats.get("ratio_ret_up_vs_ctrl_cf_down", 0) >= 0.5:
        if exp_imp.get("cashflow", 0) >= 0 and exp_imp.get("controle", 0) >= 0:
            bonus += 0.4
    return bonus

def diversity_bonus(mission: Dict, recent_concepts: List[str]) -> float:
    return 0.2 if mission["concept"] not in set(recent_concepts[-5:]) else 0.0

def pacing_soft(mission: Dict, last_mission: Dict) -> float:
    if not last_mission:
        return 0.0
    return -0.1 if mission["concept"] == last_mission["concept"] else 0.1

# --- Fonction principale ---
def suggest_strategy(req: SuggestRequest) -> SuggestResponse:
    # 1. Récupérer métier
    job_name = get_student_profile(req.student_id)  # ex: "gestionnaire"
    print(f"[DEBUG] Job ID from service: '{job_name}'")
    if not job_name:
        job_name = "Gestionnaire de Portefeuille"  # fallback , normalement it shouldn't happen car on a un profil
    
    # profile_mapping = {
    #     "Gestionnaire de Portefeuille": ProfileType.GESTION_PORTEFEUILLE,
    #     "Analyste Finance": ProfileType.ANALYSTE_FINANCE, 
    #     "Banquier d'Affaires": ProfileType.BANQUIER_AFFAIRES
    # }
    # job = profile_mapping.get(job, ProfileType.GESTION_PORTEFEUILLE)
    # print(f"[DEBUG] Job from service: '{job}'")
    name_to_profile = {name: profile_type for profile_type, name in PROFILE_LABELS.items()}
    print(f"[DEBUG] Available name mappings: {list(name_to_profile.keys())}")

    job = name_to_profile.get(job_name, ProfileType.GESTION_PORTEFEUILLE)
    print(f"[DEBUG] Mapped to ProfileType: {job}")

    # 2. Calculer features IA
    game_loader=GameLoader()
    events_catalog=game_loader.events
    feats = compute_features_from_student_id(req.student_id)  # doit retourner dict de 13 features
    tilt = predict_tilt(feats)

    # 3. Charger missions
    # game_loader=GameLoader()
    missions= build_mission_index(game_loader.missions)
    progress = get_recent_progress_for_student(req.student_id)
    recent_concepts = [p.get("concept") for p in progress[-8:] if p.get("concept")]
    last_mission_id = progress[-1]["mission_id"] if progress else None
    last_mission = next((m for m in missions if m["mission_id"] == last_mission_id), None)

    # 4. Filtrer missions éligibles
    pool = eligible_missions(
        student_id=req.student_id,
        job=job,
        missions=missions,
        concept_whitelist=req.concept_whitelist,
        threshold=1.0
    )

    # 5. Scorer chaque mission
    scored = []
    print(f"[DEBUG] Starting to score {len(pool)} missions")
    for i, m in enumerate(pool):
        print(f"[DEBUG] Scoring mission {i+1}/{len(pool)}: {m.get('mission_id', 'NO_ID')}")
        exp_imp = expected_impact_for_profile(m, tilt)
        if not exp_imp:
            print(f"[DEBUG] ❌ Mission has no expected impact (missing choix?)")
            continue
        score = (
            0.5 * kpi_goal_score(exp_imp, req.goal) +
            0.2 * gap_score(exp_imp, feats) +
            0.15 * diversity_bonus(m, recent_concepts) +
            0.15 * pacing_soft(m, last_mission)
        )
        print(f"[DEBUG] ✅ Final score: {score}")
        why = build_whys(req.goal, exp_imp, feats, tilt)
        has_event = any(e in events_catalog for e in m.get("evenements_possibles", [])) if m.get("evenements_possibles") else False
        scored.append((m, score, why, has_event))

    # 6. Trier et limiter
    ranked = sorted(scored, key=lambda x: x[1], reverse=True)[:max(1, min(req.max_bundle, 6))] # TODO : ajuster max selon besoin

    # 7. Formater réponse
    missions_out = [{
        "mission_id": m["mission_id"],
        "concept": m["concept"],
        "niveau": m["niveau"],
        "why": why,
        "has_event": has_ev
    } for (m, _, why, has_ev) in ranked]

    cards = []
    for (m, _, _, has_ev) in ranked:
        if has_ev and m.get("evenements_possibles"):
            ev_id = m["evenements_possibles"][0]  # prend le premier pour l'instant
            cards.append({"kind": "event_context", "event_id": ev_id})


    tip = select_tip(feats, tilt, job)

    explanation = f"Mini-bundle aligné sur {req.goal}, respect des pré-requis par concept et du track {job}."

    return SuggestResponse(
        profile_tilt=tilt,
        job=PROFILE_LABELS.get(job, "Gestionnaire de Portefeuille"),  # ← ICI
        bundle={"missions": missions_out},
        cards=cards,
        tip=tip,
        explanation=explanation
    )

def build_whys(goal: str, exp_imp: Dict, feats: Dict, tilt: str) -> List[str]:
    whys = []
    if goal == "reduce_stress":
        if exp_imp.get("stress", 0) <= 0:
            whys.append("But=réduire le stress: impact attendu ≤ 0 sur stress")
        if exp_imp.get("cashflow", 0) >= 0:
            whys.append("N’augmente pas la pression sur trésorerie")
    if feats.get("pct_stress_up", 0) >= 0.45:
        whys.append("Ton historique récent montre trop de hausses de stress")
    whys.append(f"Adaptée à un profil {tilt}")
    return whys[:3]

def select_tip(feats: Dict, tilt: str, job: str) -> Dict:
    if feats.get("pct_stress_up", 0) >= 0.45:
        return {
            "id": "too_much_stress",
            "audience": tilt,
            "text": "Tu acceptes trop de hausses de stress; pense à couvrir avant une prise de risque."
        }
    return None
# TODO Make the tip more relevant and missions and behavior related 