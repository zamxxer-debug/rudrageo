import os
import shutil
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from config import settings


def _prepare_sqlite_database_path(db_url: str) -> str:
    if not db_url.startswith("sqlite"):
        return db_url

    if "///" not in db_url:
        return db_url

    db_path = db_url.replace("sqlite:///", "", 1)
    if db_path.startswith("/"):
        resolved = Path(db_path)
    else:
        resolved = Path.cwd() / db_path

    if resolved.exists() and resolved.is_dir():
        shutil.rmtree(resolved)
        resolved.touch()
    elif not resolved.exists():
        resolved.parent.mkdir(parents=True, exist_ok=True)
        resolved.touch()

    return db_url


database_url = settings.DATABASE_URL or "sqlite:///./rudra.db"
database_url = _prepare_sqlite_database_path(database_url)

# Supabase / Render URL normalization
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif database_url.startswith("postgresql://") and not database_url.startswith("postgresql+psycopg2://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg2://", 1)

connect_args = {}
engine_kwargs = {"echo": False}

if database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    # PostgreSQL / Supabase pool configuration
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_size": 10,
        "max_overflow": 20
    })

engine = create_engine(
    database_url,
    connect_args=connect_args,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

