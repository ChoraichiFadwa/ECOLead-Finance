import json
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import sessionmaker
from backend.database import engine
from backend.models.domain import Domain, Concept, Mission

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def initialize_domains_and_concepts():
    """Initialize domains and concepts from JSON structure"""
    
    # Load the structure
    with open("backend/data/domains_structure.json", "r", encoding="utf-8") as f:
        structure = json.load(f)
    
    print("Initializing domains and concepts...")
    
    # Create domains and concepts
    for domain_data in structure["domains"]:
        # Check if domain already exists
        existing_domain = db.query(Domain).filter(Domain.name == domain_data["name"]).first()
        if existing_domain:
            print(f"Domain '{domain_data['name']}' already exists, skipping...")
            continue
        
        # Create domain
        domain = Domain(
            name=domain_data["name"],
            description=domain_data["description"],
            order_index=domain_data["order_index"],
            is_fundamental=domain_data["is_fundamental"]
        )
        db.add(domain)
        db.flush()  # Get the ID
        
        print(f"Created domain: {domain.name}")
        
        # Create concepts for this domain
        for concept_data in domain_data["concepts"]:
            concept = Concept(
                domain_id=domain.id,
                name=concept_data["name"],
                description=concept_data["description"],
                order_index=concept_data["order_index"],
                is_fundamental=concept_data["is_fundamental"],
                prerequisite_concepts=concept_data["prerequisite_concepts"],
                required_for_profiles=concept_data["required_for_profiles"]
            )
            db.add(concept)
            print(f"  Created concept: {concept.name}")
    
    # Commit all changes
    db.commit()
    print("Domain and concept initialization completed!")

def create_sample_missions():
    """Create sample missions for each concept"""
    concepts = db.query(Concept).all()
    
    for concept in concepts:
        # Create sample missions for each difficulty level
        for level in ["débutant", "intermédiaire", "avancé"]:
            mission_id = f"mission_{concept.name.lower().replace(' ', '_')}_{level[0]}"
            
            # Check if mission already exists
            existing_mission = db.query(Mission).filter(Mission.id == mission_id).first()
            if existing_mission:
                continue
            
            mission = Mission(
                id=mission_id,
                concept_id=concept.id,
                name=f"{concept.name} - {level.capitalize()}",
                description=f"Mission {level} pour le concept {concept.name}",
                difficulty_level=level,
                content={
                    "scenario": f"Scenario de mission pour {concept.name} niveau {level}",
                    "choices": [
                        {"id": 1, "text": "Option A", "impact": {"score": 10}},
                        {"id": 2, "text": "Option B", "impact": {"score": 20}},
                        {"id": 3, "text": "Option C", "impact": {"score": 15}}
                    ]
                },
                max_score=100,
                passing_score=60
            )
            db.add(mission)
            print(f"Created mission: {mission.name}")
    
    db.commit()
    print("Sample missions created!")

if __name__ == "__main__":
    try:
        initialize_domains_and_concepts()
        create_sample_missions()
        print("✅ Database initialization completed successfully!")
    except Exception as e:
        print(f"❌ Error during initialization: {e}")
        db.rollback()
    finally:
        db.close()
