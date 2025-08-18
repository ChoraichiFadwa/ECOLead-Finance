from typing import Dict, List, Any
from models.user import User
from utils.game_loader import GameLoader
# Evaluator for mission completion and scoring
# Can be extended for different types of missions
# Can be moved to /services for better organization
class MissionEvaluator:
    def __init__(self, game_loader: GameLoader):
        self.game_loader = game_loader
    
    def evaluate_mission(
        self, 
        mission: Dict[str, Any], 
        choices: Dict[str, str], 
        events: List[Dict[str, Any]], 
        student: User
    ) -> Dict[str, Any]:
        """Evaluate a completed mission and return results"""
        
        # Get the main choice impact
        if "main" not in choices:
            raise ValueError("No main choice provided for mission evaluation.")
        main_choice = choices.get("main", "A")

        choice_data = mission["choix"].get(main_choice, {})
        base_impact = choice_data.get("impact", {})
        
        # Start with base impact
        total_impact = {
            "cashflow": base_impact.get("cashflow", 0),
            "controle": base_impact.get("controle", 0),
            "stress": base_impact.get("stress", 0),
            "rentabilite": base_impact.get("rentabilite", 0),
            "reputation": base_impact.get("reputation", 0)
        }
        
        # Apply event modifications
        for event in events:
            if "modifie_choix" in event and main_choice in event["modifie_choix"]:
                event_impact = event["modifie_choix"][main_choice]
                for metric, value in event_impact.items():
                    total_impact[metric] = total_impact.get(metric, 0) + value
        
        # Calculate score based on positive impacts and strategic thinking
        score = self._calculate_score(total_impact, mission, student)
        
        
        # Generate feedback
        base_feedback = self._generate_feedback(main_choice, choice_data, total_impact, events)
        narrative_feedback = mission.get("feedback", {}).get(main_choice, "")
        if narrative_feedback:
            feedback = f"{base_feedback} <br/><br/> Conseil : {narrative_feedback}"
        else:
            feedback = base_feedback

        
        return {
            "score_earned": score,
            "metrics_changes": total_impact,
            "feedback": feedback,
            "choice_made": main_choice,
            "events_applied": [event["id"] for event in events]
        }
    
    def apply_events_to_mission(
        self, 
        mission: Dict[str, Any], 
        events: List[Dict[str, Any]], 
        student: User
    ) -> Dict[str, Any]:
        """Apply event modifications to mission choices for display"""
        modified_mission = mission.copy()
        
        # Apply event modifications to choices
        for event in events:
            if "modifie_choix" in event:
                for choice_key, modifications in event["modifie_choix"].items():
                    if choice_key in modified_mission["choix"]:
                        # Modify the impact of this choice
                        current_impact = modified_mission["choix"][choice_key].get("impact", {})
                        for metric, change in modifications.items():
                            current_impact[metric] = current_impact.get(metric, 0) + change
                        modified_mission["choix"][choice_key]["impact"] = current_impact
        
        return modified_mission
    
    def _calculate_score(
        self, 
        impact: Dict[str, float], 
        mission: Dict[str, Any], 
        student: User
    ) -> int:
        """Calculate score based on impact and context"""
        base_score = 10  # Base score for completing mission
        
        # Bonus for positive impacts
        positive_bonus = 0
        for metric, value in impact.items():
            if value > 0:
                positive_bonus += min(value, 10)  # Cap bonus per metric
        
        # Penalty for very negative impacts
        negative_penalty = 0
        for metric, value in impact.items():
            if value < -15:  # Significant negative impact
                negative_penalty += abs(value) * 0.3
        
        # Strategic thinking bonus (balancing different metrics)
        balance_bonus = 0
        if len([v for v in impact.values() if v != 0]) >= 3:
            balance_bonus = 3  # Bonus for affecting multiple metrics
        
        # Level-based multiplier
        level_multiplier = 1.0
        if mission["niveau"] == "intermédiaire":
            level_multiplier = 1.2
        elif mission["niveau"] == "avancé":
            level_multiplier = 1.5
        
        final_score = (base_score + positive_bonus - negative_penalty + balance_bonus) * level_multiplier
        
        # Ensure score is reasonable
        return max(1, min(25, int(final_score)))
    
    def _generate_feedback(
        self, 
        choice: str, 
        choice_data: Dict[str, Any], 
        impact: Dict[str, float], 
        events: List[Dict[str, Any]]
    ) -> str:
        """Generate contextual feedback for the student"""
        feedback_parts = []
        
        # Base choice feedback
        choice_description = choice_data.get("description", "Votre choix")
        feedback_parts.append(f"Vous avez choisi : {choice_description}.")
        
        # Impact analysis
        positive_impacts = [k for k, v in impact.items() if v > 0]
        negative_impacts = [k for k, v in impact.items() if v < 0]
        
        if positive_impacts:
            feedback_parts.append(f"Points positifs : amélioration de {', '.join(positive_impacts)}.")
        
        if negative_impacts:
            feedback_parts.append(f"Points d'attention : impact négatif sur {', '.join(negative_impacts)}.")
        
        # Event context
        if events:
            feedback_parts.append(f"Contexte économique pris en compte : {len(events)} événement(s) actif(s).")
        
        # Strategic advice
        if len(positive_impacts) >= 2:
            feedback_parts.append("Bonne approche stratégique avec des bénéfices multiples.")
        elif len(negative_impacts) >= 3:
            feedback_parts.append("Attention aux impacts négatifs multiples - considérez les alternatives.")
        
        return "<br/>".join(feedback_parts)