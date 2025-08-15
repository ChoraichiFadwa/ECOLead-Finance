from fastapi import FastAPI
from sqlalchemy.orm import sessionmaker
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from database import engine, Base
from routes import users, missions, progress, analytics, domains, learning
from models.domain import Domain, Concept, Mission
import json
from routes import profiles, learning_flow, specialized_paths  

Base.metadata.create_all(bind=engine)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


app = FastAPI(
    title="ECOLead Serious Game Platform API",
    description="A learning platform with missions and progress tracking",
    version="1.0.0"
)

# @app.on_event("startup")
# def initialize_database():
#     db = SessionLocal()
#     try:
#         # Initialize domains and concepts
#         with open("data/domains_structure.json", "r", encoding="utf-8") as f:
#             structure = json.load(f)

#         for domain_data in structure["domains"]:
#             existing_domain = db.query(Domain).filter(Domain.name == domain_data["name"]).first()
#             if existing_domain:
#                 continue

#             domain = Domain(
#                 name=domain_data["name"],
#                 description=domain_data["description"],
#                 order_index=domain_data["order_index"],
#                 is_fundamental=domain_data["is_fundamental"]
#             )
#             db.add(domain)
#             db.flush()

#             for concept_data in domain_data["concepts"]:
#                 concept = Concept(
#                     domain_id=domain.id,
#                     name=concept_data["name"],
#                     description=concept_data["description"],
#                     order_index=concept_data["order_index"],
#                     is_fundamental=concept_data["is_fundamental"],
#                     prerequisite_concepts=concept_data["prerequisite_concepts"],
#                     required_for_profiles=concept_data["required_for_profiles"]
#                 )
#                 db.add(concept)

#         # Commit domains and concepts
#         db.commit()

#         # Initialize sample missions
#         concepts = db.query(Concept).all()
#         for concept in concepts:
#             for level in ["débutant", "intermédiaire", "avancé"]:
#                 mission_id = f"mission_{concept.name.lower().replace(' ', '_')}_{level[0]}"
#                 if db.query(Mission).filter(Mission.id == mission_id).first():
#                     continue
#                 mission = Mission(
#                     id=mission_id,
#                     concept_id=concept.id,
#                     name=f"{concept.name} - {level.capitalize()}",
#                     description=f"Mission {level} pour le concept {concept.name}",
#                     difficulty_level=level,
#                     content={
#                         "scenario": f"Scenario de mission pour {concept.name} niveau {level}",
#                         "choices": [
#                             {"id": 1, "text": "Option A", "impact": {"score": 10}},
#                             {"id": 2, "text": "Option B", "impact": {"score": 20}},
#                             {"id": 3, "text": "Option C", "impact": {"score": 15}}
#                         ]
#                     },
#                     max_score=100,
#                     passing_score=60
#                 )
#                 db.add(mission)
#         db.commit()
#         print("✅ Database initialization completed successfully!")
#     except Exception as e:
#         print(f"❌ Error during initialization: {e}")
#         db.rollback()
#     finally:
#         db.close()



# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api", tags=["users"])
app.include_router(missions.router, prefix="/api", tags=["missions"])
app.include_router(progress.router, prefix="/api", tags=["progress"])
app.include_router(analytics.router, prefix="/api", tags=["analytics"])
app.include_router(domains.router, prefix="/api", tags=["domains"])
app.include_router(learning.router, prefix="/api", tags=["learning"])
app.include_router(learning_flow.router, prefix="/api", tags=["learning-flow"])
app.include_router(specialized_paths.router, prefix="/api", tags=["specialized-paths"])

@app.get("/")
async def root():
    return {"message": "ECOLead Serious Game Platform API", "docs": "/docs"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)