import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


# Load variables from backend/.env
load_dotenv()


# Get PostgreSQL connection URL
DATABASE_URL = os.getenv("DATABASE_URL")


# Make sure DATABASE_URL exists
if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL was not found in the .env file"
    )


# Create PostgreSQL engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)


# Create database session
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# Base class for SQLAlchemy models
Base = declarative_base()


# Database dependency for FastAPI
def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()