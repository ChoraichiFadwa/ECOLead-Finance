import os
import json
import uuid
from fastapi import HTTPException
from models.schemas import ConceptCreate
from models.custom_mission import CustomMission
from models.custom_event import Event
import re

def slugify(title: str) -> str:
    # Convert to lowercase
    title = title.lower()
    # Replace spaces and special chars with underscores
    title = re.sub(r"\W+", "_", title)
    # Remove leading/trailing underscores
    title = title.strip("_")
    return title
# --- Helper to get project data path ---
def get_data_path(filename: str):
    # Get project root (two folders up if this file is in services/)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    os.makedirs(data_dir, exist_ok=True)  # create data folder if missing
    return os.path.join(data_dir, filename)


# --- Add a concept ---
def add_concept_to_json(concept: ConceptCreate, json_file_path=None):
    if not json_file_path:
        json_file_path = get_data_path("concepts.json")

    try:
        with open(json_file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        data = {}

    if concept.name in data:
        raise HTTPException(status_code=400, detail="Concept already exists")

    data[concept.name] = {
        "nom": concept.name,
        "description": concept.description,
        "profiles": concept.profiles or [],
        "missions": {},
        "progression": 0
    }

    with open(json_file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    return concept


def add_custom_mission_to_json(mission: CustomMission, json_missions_file=None, json_concepts_file=None):
    if not json_missions_file:
        json_missions_file = get_data_path("missions.json")
    if not json_concepts_file:
        json_concepts_file = get_data_path("concepts.json")

    # --- load concepts ---
    try:
        with open(json_concepts_file, "r", encoding="utf-8") as f:
            concepts_data = json.load(f)
    except FileNotFoundError:
        concepts_data = {}

    if mission.concept not in concepts_data:
        raise HTTPException(status_code=400, detail="Concept does not exist. Please create it first.")

    # --- load missions ---
    try:
        with open(json_missions_file, "r", encoding="utf-8") as f:
            missions_data = json.load(f)
    except FileNotFoundError:
        missions_data = {}


    
    # Generate unique ID if needed
    mission_id = mission.title
    concept_name = mission.concept
    level = mission.level
    # CRITICAL FIX: Create nested structure if it doesn't exist
    # if concept_name not in missions_data:
    #     missions_data[concept_name] = {}
    # if level not in missions_data[concept_name]:
    #     missions_data[concept_name][level] = {}

    
    if mission.title in missions_data:
        raise HTTPException(status_code=400, detail="Mission with this title already exists.")

    # Add mission to missions.json (full object)
    missions_data[mission_id] = {
        "id": mission_id,
        "concept": mission.concept,
        "niveau": mission.level,
        "type": getattr(mission, "type", "Investissement"),
        "contexte": getattr(mission, "contexte", ""),
        "objectif_pedagogique": getattr(mission, "objectif_pedagogique", ""),
        "choix": getattr(mission, "choix", {}),
        "variables_affectees": getattr(mission, "variables_affectees", []),
        "tags": getattr(mission, "tags", []),
        "feedback": getattr(mission, "feedback", {}),
        "evenements_possibles": getattr(mission, "evenements_possibles", []),
        "reutilisable": getattr(mission, "reutilisable", True),
    }

    with open(json_missions_file, "w", encoding="utf-8") as f:
        json.dump(missions_data, f, indent=2, ensure_ascii=False)

    #--- update concepts.json ---
    if "missions" not in concepts_data[mission.concept]:
        concepts_data[mission.concept]["missions"] = {}
    if mission.level not in concepts_data[mission.concept]["missions"]:
        concepts_data[mission.concept]["missions"][mission.level] = []

    concepts_data[mission.concept]["missions"][mission.level].append({"id": mission_id})

    with open(json_concepts_file, "w", encoding="utf-8") as f:
        json.dump(concepts_data, f, indent=2, ensure_ascii=False)

    return mission_id


def add_event_to_json(event: Event, json_file_path=None):
    if not json_file_path:
        json_file_path = get_data_path("events.json")

    # Load existing events
    try:
        with open(json_file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        data = {"events": []}  # start with empty list

    # Ensure "events" key exists
    if "events" not in data:
        data["events"] = []

    # Check for duplicate ID
    if any(e["id"] == event.id for e in data["events"]):
        raise HTTPException(status_code=400, detail=f"Event with id '{event.id}' already exists")

    # Append new event
    data["events"].append({
        "id": event.id,
        "title": event.title,
        "message": event.message,
        "context": event.context,
        "conditions": getattr(event, "conditions", {}),
        "modifie_choix": getattr(event, "modifie_choix", {})
    })

    # Save back to JSON
    with open(json_file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    return event.id


def validate_event_ids(event_ids: list[str], json_file_path=None):
    """Helper to check that all event IDs exist before assigning to a mission"""
    if not json_file_path:
        json_file_path = get_data_path("events.json")

    try:
        with open(json_file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        data = {}

    missing = [eid for eid in event_ids if eid not in data]
    if missing:
        raise HTTPException(status_code=400, detail=f"These events do not exist: {missing}")