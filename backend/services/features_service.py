import numpy as np
import math
from typing import List, Dict, Any, Optional
from utils.game_loader import GameLoader
from services.progress_service import get_recent_progress_for_student
from utils.game_loader import GameLoader
from services.progress_service import get_recent_progress_for_student

FEATURE_SPEC = {
    "window_missions": 8,         # last N missions considered [ the window]
    "half_life": 4,               # recent missions weighted more
    "intensity_threshold": 1.5,   # skip tiny/neutral decisions
    "feature_names": [
        "pct_high_risk", "pct_low_risk", "avg_risk_rank", "risk_rank_std",
        "ratio_ret_up_vs_ctrl_cf_down", "pct_stress_up", "median_net_tradeoff",
        "time_z", "event_view_rate", "quick_check_correct_rate",
        "concept_coverage", "choice_entropy", "event_exposure_rate"
    ]
}

KPI_KEYS = ["cashflow","controle","stress","rentabilite","reputation"]

def build_mission_index(missions_json):
    """
    Supports both:
      {"missions": {<title>: {id, niveau, choix{A:{impact},...}}}}
    and
      {"missions": [ {id, level/ niveau, choices: [{key, impact}, ...]}, ... ]}
    """
    data = missions_json.get("missions", missions_json)

    # iterate items regardless of dict/list structure
    if isinstance(data, dict):
        items = data.items()  # (key, mission_obj)
    elif isinstance(data, list):
        items = [(m.get("id") or m.get("title") or str(i), m) for i, m in enumerate(data)]
    else:
        raise ValueError("missions_json['missions'] must be dict or list")

    index, empty=[], 0

    for _, m in items:
        # choices can be "choix": {A: {...}} or "choices": [{key, impact},...]
        choix_map = m.get("choix")
        choix_arr = m.get("choices")
        if isinstance(choix_map, dict) and choix_map:
            choice_keys = sorted(choix_map.keys())
            impacts = []
            for k in choice_keys:
                imp = (choix_map[k].get("impact") or {}).copy()
                for kk in KPI_KEYS:
                    imp.setdefault(kk, 0.0)
                impacts.append(imp)
        elif isinstance(choix_arr, list) and choix_arr:
            choice_keys = [c.get("key", chr(65+i)) for i, c in enumerate(choix_arr)]
            impacts = []
            for c in choix_arr:
                imp = (c.get("impact") or {}).copy()
                for kk in KPI_KEYS:
                    imp.setdefault(kk, 0.0)
                impacts.append(imp)
        else:
            empty += 1
            continue  # skip missions with no choices

        index.append({
            "mission_id": m.get("id") or m.get("title") or "unknown",
            "concept": m.get("concept") or m.get("concept_id") or "",
            "niveau":  m.get("niveau") or m.get("level") or "",
            "choices": choice_keys,
            "impacts": impacts,
        })

    print(f"Built mission_index: {len(index)} missions (skipped {empty} with no choices)")
    if not index:
        # helpful debug
        print("DEBUG: top-level keys:", list(missions_json.keys()))
        mj = missions_json.get("missions", None)
        print("DEBUG: type(missions_json['missions']) =", type(mj))
        if isinstance(mj, dict):
            print("DEBUG: first keys:", list(mj.keys())[:5])

    return index
def mission_intensity(impact: dict) -> float:
    return float(sum(abs(float(impact.get(k, 0.0))) for k in KPI_KEYS))

def raw_risk(imp: dict) -> float:
    # Weighted like the literature (profit-seeking + stress/downsides)
    # penalties only count in the risk direction
    # Risk–return trade-off in finance (upside vs. variance/downsides) Prospect Theory (losses loom larger → we count losses toward risk), Multi-attribute utility ideas (weighted sum across attributes).

    return (
        0.5*max(0.0, imp.get("rentabilite", 0.0)) +
        0.3*max(0.0, imp.get("stress", 0.0)) +
        0.3*max(0.0, -imp.get("cashflow", 0.0)) +
        0.2*max(0.0, -imp.get("controle", 0.0)) +
        0.1*max(0.0, -imp.get("reputation", 0.0)))
def risk_rank_for_choice(chosen_imp: dict, all_choice_impacts: list[dict]) -> int:
    scores = [raw_risk(x) for x in all_choice_impacts]
    lo, hi = min(scores), max(scores)
    s = raw_risk(chosen_imp)
    x = 0.0 if hi == lo else (s - lo) / (hi - lo)
    # 10) Bucket into three ranks by tertiles:
    #     [0, 1/3) → 0 (safe), [1/3, 2/3) → 1 (mid), [2/3, 1] → 2 (risky).
    return 0 if x < 1/3 else (1 if x < 2/3 else 2)
def choice_entropy(choice_keys: list[str]) -> float:
  # Meaning: variety of letters picked (A/B/C/…). Low entropy = always picks the same option; high = explores.
  # Calc: Shannon entropy of the frequency distribution of choice_key.
    if not choice_keys:
        return 0.0
    vals, counts = np.unique(choice_keys, return_counts=True)
    p = counts / counts.sum()
    return float(-(p * np.log2(p)).sum())
def apply_event_modifiers(base_impact: dict, choice_key: str, active_event_ids: list[str], events_catalog: dict) -> dict:
    out = dict(base_impact)
    if not active_event_ids:
        return out
    id2event = {e["id"]: e for e in events_catalog.get("events", []) if isinstance(e, dict) and "id" in e}
    for ev_id in active_event_ids:
        ev = id2event.get(ev_id)
        if not ev:
            continue
        mod = (ev.get("modifie_choix") or {}).get(choice_key)
        if not mod:
            continue
        for k, v in mod.items():
            out[k] = float(out.get(k, 0.0)) + float(v)
    return out
def _decay_weights(n: int, half_life: float) -> np.ndarray:
  # exponential decay with a half-life
  # build exponential weights for the last n
    lam = math.log(2.0) / half_life # every half_life, the weight halves
    idx = np.arange(n)
    w = np.exp(lam * (idx - (n - 1)))
    return w / w.sum() # normalisation of weight

def compute_features_for_student(
    seq: list[dict],
    events_catalog: dict,
    spec: dict = FEATURE_SPEC
) -> dict:
    """
    seq = ordered list of mission interactions for ONE student.
    expected keys per item:
      - mission_id (str), concept (str), niveau (str)
      - choice_key (e.g., "A"/"B"/"C")
      - choice_impact (dict of KPI deltas)  [base impact from missions.json]
      - all_choice_impacts (list of dict)   [impacts for all available options, to rank how risky the chosen one is]
      - time_spent_seconds (float)
      - learning_flags: {"event_view_rate": bool, "quick_check_correct": bool}
      - active_event_ids: [str,...]         [event ids active for this mission]
    """
    if not seq:
        return {k: 0.0 for k in spec["feature_names"]}

    # Filter by intensity (after event modifiers)
    # Apply event modifiers to the selected choice (via apply_event_modifiers), so we profile the actual context the student faced
    seq2 = []
    for r in seq:
        base = r.get("choice_impact", {}) or {}
        ck   = r.get("choice_key", None)
        adj  = apply_event_modifiers(base, ck, r.get("active_event_ids") or [], events_catalog)
        # drop the tiny/ neutral clicks
        if mission_intensity(adj) >= spec["intensity_threshold"]:
            # store the adjusted impact back (so following code uses it)
            r = dict(r)
            r["_adjusted_impact"] = adj
            seq2.append(r)

    if not seq2:
        return {k: 0.0 for k in spec["feature_names"]}

    # Last-N with exponential decay | after the filtering ofc + newer missions count more
    window = seq2[-spec["window_missions"]:]
    w = _decay_weights(len(window), spec["half_life"])

    risk_ranks, tradeoffs, stress_up, ret_vs_cost, times, qc_ok, concepts, ch_keys, event_hits  = [], [], [], [], [], [], [], [], 0
    ev_view, ev_mask = [], []
    for r in window:
        adj  = r.get("_adjusted_impact", r.get("choice_impact", {}))
        all_imps = r.get("all_choice_impacts") or [adj]
        rr = risk_rank_for_choice(adj, all_imps)
        risk_ranks.append(rr)

        inten = mission_intensity(adj) or 1.0
        ret   = max(0.0, adj.get("rentabilite", 0.0))
        cost  = max(0.0, -adj.get("cashflow", 0.0)) + max(0.0, -adj.get("controle", 0.0))
        tradeoffs.append((ret - cost) / inten)

        stress_up.append(1.0 if adj.get("stress", 0.0) > 0 else 0.0)
        ret_vs_cost.append( # risk taking proxy
            1.0 if (adj.get("rentabilite", 0.0) > 0) and
                    (adj.get("cashflow", 0.0) < 0 or adj.get("controle", 0.0) < 0)
            else 0.0
        )
        times.append(float(r.get("time_spent_seconds", 0.0)))
        lf = r.get("learning_flags", {}) or {}
        had_ev = 1.0 if (r.get("active_event_ids") or []) else 0.0
        saw_ev = 1.0 if lf.get("event_viewed") is True else 0.0
        ev_mask.append(had_ev)                     # counts only missions with events
        ev_view.append(saw_ev if had_ev else 0.0)  # view only matters if event existed
        qc_ok.append(1.0 if lf.get("quick_check_correct") else 0.0)
        concepts.append(r.get("concept", ""))
        ch_keys.append(r.get("choice_key", "A"))
        if r.get("active_event_ids"):
            event_hits += 1
    # lists to numpy arrays
    risk_ranks = np.asarray(risk_ranks, dtype=float)
    tradeoffs  = np.asarray(tradeoffs,  dtype=float)
    stress_up  = np.asarray(stress_up,  dtype=float)
    ret_vs_cost= np.asarray(ret_vs_cost,dtype=float)
    times      = np.asarray(times,      dtype=float)
    qc_ok      = np.asarray(qc_ok,      dtype=float)

    # robust time z-score within the window
    t_med = float(np.median(times)) or 1.0
    t_mad = float(np.median(np.abs(times - t_med))) or 1.0
    den = 1.4826 * (t_mad if t_mad > 0 else 1.0)
    z = (times - t_med) / den
    # negative = generally faster-than-usual; positive = slower-than-usual (recently).
    time_z = float(np.sum(z * w))
    # numpy-ize
    ev_view = np.asarray(ev_view, dtype=float)
    ev_mask = np.asarray(ev_mask, dtype=float)

    wmean = lambda x: float(np.sum(x * w))
    wstd  = lambda x: float(np.sqrt(max(1e-9, wmean((x - wmean(x))**2))))

    # NEW: event_view_rate = weighted mean over ONLY missions that had events
    den = float(np.sum(w * ev_mask))
    event_view_rate = float(np.sum(w * ev_view) / den) if den > 0 else 0.0
    feats = {
        "pct_high_risk": wmean(risk_ranks == 2),
        "pct_low_risk":  wmean(risk_ranks == 0),
        "avg_risk_rank": wmean(risk_ranks),
        "risk_rank_std": wstd(risk_ranks),
        "ratio_ret_up_vs_ctrl_cf_down": wmean(ret_vs_cost),
        "pct_stress_up": wmean(stress_up),
        "median_net_tradeoff": float(np.median(tradeoffs)),
        "time_z": time_z,
        "event_view_rate": event_view_rate,
        "quick_check_correct_rate": wmean(qc_ok),
        "concept_coverage": float(len(set(concepts))),
        "choice_entropy": choice_entropy(ch_keys),
        "event_exposure_rate": float(event_hits) / float(len(window)),
    }
    return {k: float(feats.get(k, 0.0)) for k in FEATURE_SPEC["feature_names"]}


def compute_features_from_student_id(student_id: int) -> Dict[str, float]:
    """
    Wrapper pour appeler compute_features_for_student avec le bon format.
    """
    # Charger les missions récentes terminées
    recent_progress = get_recent_progress_for_student(student_id, limit=8) #limit 8 

    # Charger le catalogue d'événements
    game_loader = GameLoader()
    events_catalog = game_loader.events

    # Formater les données au format attendu par compute_features_for_student
    seq = []
    for p in recent_progress:
        mission_id = p.get("mission_id")
        concept = p.get("concept", "")
        
        # Charger la mission complète
        mission = game_loader.missions.get(mission_id, {})
        
        # Si la mission a des choix, on prend le premier par défaut (mock temporaire)
        choice_key = "A"
        choice_impact = {}
        all_choice_impacts = []
        
        if "choix" in mission:
            choix = mission["choix"]
            choice_keys = list(choix.keys())
            if choice_keys:
                choice_key = choice_keys[0]
                choice_impact = choix[choice_key].get("impact", {})
                all_choice_impacts = [choix[k].get("impact", {}) for k in choice_keys]

        seq.append({
            "mission_id": mission_id,
            "concept": concept,
            "niveau": mission.get("niveau", ""),
            "choice_key": choice_key,
            "choice_impact": choice_impact,
            "all_choice_impacts": all_choice_impacts,
            "time_spent_seconds": float(p.get("time_spent_seconds", 60.0)),
            "learning_flags": { # TODO Make th elearning flags dynamic if possible
                "event_viewed": False,
                "quick_check_correct": True
            },
            "active_event_ids": mission.get("evenements_possibles", [])
        })

    # Appeler la vraie fonction
    return compute_features_for_student(seq, events_catalog)