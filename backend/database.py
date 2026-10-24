import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DB_URL = os.getenv("DATABASE_URL", "sqlite:///./production_system.db")

# Render uses 'postgres://' for PostgreSQL URLs, but SQLAlchemy 1.4+ requires 'postgresql://'
if DB_URL.startswith("postgres://"):
    DB_URL = DB_URL.replace("postgres://", "postgresql://", 1)

# SQLite multi-thread support; for PostgreSQL enable pre-ping to handle connection dropouts
connect_args = {"check_same_thread": False} if DB_URL.startswith("sqlite") else {}

engine = create_engine(
    DB_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
