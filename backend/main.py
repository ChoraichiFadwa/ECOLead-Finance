from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn # ASGI server
from database import engine, Base # Import SQLAlchemy engine and Base, engine - db connextion | Base - ORM models
from routes import users, missions, progress, analytics, suggestion, predict_ai_profile, events, CustomCreation, notification
# Create database tables, dev only in prod we should use alembic
Base.metadata.create_all(bind=engine)

#Instantiate the app 
app = FastAPI(
    title="ECOLead Serious Game Platform API",
    description="A learning platform with missions and progress tracking",
    version="1.0.0"
)

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
app.include_router(suggestion.router, prefix="/api", tags=["suggestion"])
app.include_router(predict_ai_profile.router, prefix="/api", tags=["predict_ai_profile"])
app.include_router(events.router, prefix="/api", tags=["events"])
app.include_router(CustomCreation.router, prefix="/api", tags=["custom_creation"])
app.include_router(notification.router, prefix="/api", tags=["notification"])

# Handle GET requests to root 
@app.get("/")
async def root():
    return {"message": "ECOLead Serious Game Platform API", "docs": "/docs"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)