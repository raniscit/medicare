import logging
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

logger = logging.getLogger("medicare.database")

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_db_migrations(target_engine):
    """
    Safely inspects existing database schema and applies non-destructive
    ALTER TABLE migrations for new columns without deleting user data.
    Works seamlessly across SQLite and PostgreSQL.
    """
    try:
        inspector = inspect(target_engine)
        tables = inspector.get_table_names()

        if "family_connections" in tables:
            columns = [c["name"] for c in inspector.get_columns("family_connections")]
            with target_engine.connect() as conn:
                if "caregiver_name" not in columns:
                    conn.execute(text("ALTER TABLE family_connections ADD COLUMN caregiver_name VARCHAR(255)"))
                    logger.info("Migrated: Added caregiver_name to family_connections")
                if "invitation_token" not in columns:
                    conn.execute(text("ALTER TABLE family_connections ADD COLUMN invitation_token VARCHAR(255)"))
                    logger.info("Migrated: Added invitation_token to family_connections")
                if "token_expires_at" not in columns:
                    conn.execute(text("ALTER TABLE family_connections ADD COLUMN token_expires_at DATETIME"))
                    logger.info("Migrated: Added token_expires_at to family_connections")
                if "is_used" not in columns:
                    conn.execute(text("ALTER TABLE family_connections ADD COLUMN is_used BOOLEAN DEFAULT 0"))
                    logger.info("Migrated: Added is_used to family_connections")
                if "redirect_url" not in columns:
                    conn.execute(text("ALTER TABLE family_connections ADD COLUMN redirect_url VARCHAR(500) DEFAULT '/dashboard'"))
                    logger.info("Migrated: Added redirect_url to family_connections")
                conn.commit()
    except Exception as e:
        logger.warning(f"Database schema inspection/migration notice: {e}")
