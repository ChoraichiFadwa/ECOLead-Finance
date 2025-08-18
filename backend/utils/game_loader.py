import json
import os
from typing import Dict, List, Any, Optional
from models.user import User
from datetime import datetime
# This module is responsible for loading game data such as missions, events, and concepts from JSON files.
# It provides methods to access this data in a structured way.

class GameLoader:
    def __init__(self):
        self.missions = {}
        self.events = {}
        self.concepts = {}
        self.data={}
        self.load_game_data()
    
    def load_game_data(self):
        """Load missions, concepts and events from JSON files"""
        # Load missions
        missions_path = os.path.join("data", "missions.json")
        if os.path.exists(missions_path):
            with open(missions_path, 'r', encoding='utf-8') as f:
                self.missions= json.load(f).get("missions", {})
        
        concepts_path=os.path.join("data", "concepts.json")
        if os.path.exists(concepts_path):
            with open(concepts_path, 'r', encoding='utf-8') as f:
                self.concepts=json.load(f).get("concepts", {})
        
        
        events_path = os.path.join("data", "events.json")
        if os.path.exists(events_path):
            with open(events_path, 'r', encoding='utf-8') as f:
                events_data = json.load(f)
                self.events = {event["id"]: event for event in events_data.get("events", [])}

    def get_missions_by_level(self, level: str) -> List[Dict[str, Any]]:
        """Get all missions for a specific level THIS WILL CHANGE TO FIT INTO THE AI PROFILE"""
        return [m for m in self.missions.values() if m.get("niveau") == level]
    
    def get_mission_by_id(self, mission_id: str) -> Optional[Dict[str, Any]]:
        return self.missions.get(mission_id)
    
    def get_all_missions(self) -> List[Dict[str, Any]]:
        return list(self.missions.values())
    
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
    
    # meant to be an internal helper aka private 
    def _should_event_be_active(self, event: Dict[str, Any], student: User) -> bool:
        """Check if an event should be active based on conditions"""
        # we get the conditions specific of the event
        conditions = event.get("conditions", {})
        
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
    
    def get_all_concepts(self) -> List[Dict[str, Any]]:
        """Return all concepts (IDs and metadata)"""
        return list(self.concepts.values())

    def get_concept(self, concept_id: str) -> Optional[Dict[str, Any]]:
        """Return a specific concept by ID"""
        return self.concepts.get(concept_id)


    def get_missions_by_concept(self, concept_id: str) -> List[Dict[str, Any]]:
       """Return all missions linked to a given concept (across all levels)"""
       concept = self.get_concept(concept_id)
       print(f"[DEBUG] Concept {concept_id} → missions:", concept.get("missions", {}))
    
       if not concept:
          return []
    
       missions = []
       missions_data = concept.get("missions", {})
    
    
    # Handle both cases: dict with levels or direct list
       if isinstance(missions_data, dict):
           for level_name, level_missions in missions_data.items():
                print(f"[DEBUG] Processing level {level_name} with missions: {level_missions}")
                if isinstance(level_missions, list):
                   for entry in level_missions:
                       if isinstance(entry, dict) and "id" in entry:
                        mission_id = entry["id"]
                        mission_data = self.get_mission_by_id(mission_id)
                        if mission_data:
                            missions.append(mission_data)
                        elif isinstance(entry, str):
                            mission_data = self.get_mission_by_id(entry)
                            if mission_data:
                               missions.append(mission_data)
       elif isinstance(missions_data, list):
            # print(f"[DEBUG] missions_data is a list: {missions_data}")
            for entry in missions_data:
               if isinstance(entry, dict) and "id" in entry:
                mission_id = entry["id"]
                mission_data = self.get_mission_by_id(mission_id)
                if mission_data:
                    missions.append(mission_data)
               elif isinstance(entry, str):
                    mission_data = self.get_mission_by_id(entry)
                    if mission_data:
                       missions.append(mission_data)

       return missions
