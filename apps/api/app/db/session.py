from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.config import get_database_url


database_url = get_database_url()
engine = create_engine(
    database_url,
    future=True,
    connect_args={"check_same_thread": False} if database_url.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
