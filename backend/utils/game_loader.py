import json
import os
from typing import Dict, List, Any, Optional
from models.user import User

class GameLoader:
    def __init__(self):
        self.missions = {}
        self.events = {}
        self.load_game_data()
    
    def load_game_data(self):
        """Load missions and events from JSON files"""
        # Load missions
        missions_path = os.path.join("data", "missions.json")
        if os.path.exists(missions_path):
            with open(missions_path, 'r', encoding='utf-8') as f:
                missions_data = json.load(f)
                self.missions = missions_data.get("missions", {})
        
        # Load events
        events_path = os.path.join("data", "events.json")
        if os.path.exists(events_path):
            with open(events_path, 'r', encoding='utf-8') as f:
                events_data = json.load(f)
                self.events = {event["id"]: event for event in events_data.get("events", [])}
    
    def get_missions_by_level(self, level: str) -> List[Dict[str, Any]]:
        """Get all missions for a specific level"""
        return self.missions.get(level, [])
    
    def get_mission_by_id(self, mission_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific mission by ID"""
        for level_missions in self.missions.values():
            for mission in level_missions:
                if mission["id"] == mission_id:
                    return mission
        return None
    
    def get_all_missions(self) -> List[Dict[str, Any]]:
        """Get all missions across all levels"""
        all_missions = []
        for level_missions in self.missions.values():
            all_missions.extend(level_missions)
        return all_missions
    
    def get_event_by_id(self, event_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific event by ID"""
        return self.events.get(event_id)
    
    def get_active_events_for_mission(self, mission_id: str, student: User) -> List[Dict[str, Any]]:
        """Get events that should be active for a mission based on student state"""
        mission = self.get_mission_by_id(mission_id)
        if not mission or "evenements_possibles" not in mission:
            return []
        
        active_events = []
        for event_id in mission.get("evenements_possibles", []):
            event = self.get_event_by_id(event_id)
            if event and self._should_event_be_active(event, student):
                active_events.append(event)
        
        return active_events
    
    def _should_event_be_active(self, event: Dict[str, Any], student: User) -> bool:
        """Check if an event should be active based on conditions"""
        conditions = event.get("conditions", {})
        
        # Check level conditions
        if "niveau" in conditions:
            if student.current_level not in conditions["niveau"]:
                return False
        
        # Check player state conditions
        if "etat_joueur" in conditions:
            for metric, condition in conditions["etat_joueur"].items():
                student_value = getattr(student, metric, 0)
                
                if condition.startswith("< "):
                    threshold = float(condition[2:])
                    if student_value >= threshold:
                        return False
                elif condition.startswith("> "):
                    threshold = float(condition[2:])
                    if student_value <= threshold:
                        return False
                elif condition.startswith("= "):
                    threshold = float(condition[2:])
                    if student_value != threshold:
                        return False
        
        return True