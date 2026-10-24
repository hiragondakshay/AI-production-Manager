import sys
import os

# Ensure backend root is on sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from models import User, Machine, Order, ProductionLog, InventoryItem, Alert

SQLITE_URL = "sqlite:///./production_system.db"
POSTGRES_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:factorypassword2026@localhost:5432/manufacturing_system"
)

def run_database_migration():
    """
    Automated Migration Tool: Copies schema tables and data records seamlessly
    from local dev SQLite database into production PostgreSQL database.
    """
    print("Initializing Database Migration Tool...")
    print(f"Source DB: {SQLITE_URL}")
    print(f"Target DB: {POSTGRES_URL}")

    # Engines & Sessions
    src_engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
    SrcSession = sessionmaker(bind=src_engine)
    src_db = SrcSession()

    try:
        tgt_engine = create_engine(POSTGRES_URL)
        Base.metadata.create_all(bind=tgt_engine)
        TgtSession = sessionmaker(bind=tgt_engine)
        tgt_db = TgtSession()

        print("[Migration] Target PostgreSQL schema tables verified/created successfully.")

        # Table models to migrate
        models = [User, Machine, Order, ProductionLog, InventoryItem, Alert]

        for model in models:
            records = src_db.query(model).all()
            print(f"[Migration] Copying {len(records)} records for table '{model.__tablename__}'...")

            for rec in records:
                data = {c.name: getattr(rec, c.name) for c in rec.__table__.columns}
                tgt_db.merge(model(**data))

            tgt_db.commit()

        print("DATABASE MIGRATION TO POSTGRESQL COMPLETED SUCCESSFULLY!")
        tgt_db.close()
        src_db.close()
        return True

    except Exception as e:
        print(f"Migration note: ({e}). Ensure PostgreSQL container is active (`docker-compose up postgres`).")
        src_db.close()
        return False

if __name__ == "__main__":
    run_database_migration()
