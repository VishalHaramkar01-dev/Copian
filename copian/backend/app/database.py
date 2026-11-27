import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

RAW_POSTGRES_URI = os.getenv(
    "POSTGRES_URI",
    "postgresql://postgres:Vishal%402004%2F-@localhost:5432/copian",
)

# SQLAlchemy 2.x uses psycopg (v3) when driver is postgresql+psycopg
if RAW_POSTGRES_URI.startswith("postgresql://"):
    DATABASE_URL = RAW_POSTGRES_URI.replace("postgresql://", "postgresql+psycopg://", 1)
elif RAW_POSTGRES_URI.startswith("postgres://"):
    DATABASE_URL = RAW_POSTGRES_URI.replace("postgres://", "postgresql+psycopg://", 1)
else:
    DATABASE_URL = RAW_POSTGRES_URI

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
