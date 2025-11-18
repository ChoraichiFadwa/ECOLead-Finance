from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker 
import os

# SQLite database URL
# in prod, we usualy use SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/dbname")

SQLALCHEMY_DATABASE_URL = "sqlite:///./educational_platform.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False} # False because FastAPI uses async / multi-threading, postgres/mysql the argument isn't needed
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# All ORM models will inherit from Base
Base = declarative_base()

# Dependency to get database session in each request | LOCAL |
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()