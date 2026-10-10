```python
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


# Load environment variables from backend/.env (for local development)
load_dotenv()


# Get the PostgreSQL connection URL
DATABASE_URL = os.getenv("DATABASE_URL")


# Make sure DATABASE_URL exists
if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL was not found. "
        "Set it in backend/.env locally or in Render Environment Variables."
    )


# Configure the PostgreSQL driver for SQLAlchemy
# Use the psycopg2 driver provided by psycopg2-binary.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql+psycopg2://",
        1
    )
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://",
        "postgresql+psycopg2://",
        1
    )


# Create the PostgreSQL engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)


# Create database sessions
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