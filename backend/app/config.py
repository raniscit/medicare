import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List

BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = str(BACKEND_DIR / ".env")


class Settings(BaseSettings):
    PROJECT_NAME: str = "MediCare AI"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "medicare-super-secret-jwt-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Frontend URL for invitation links and redirects
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    INVITATION_TOKEN_EXPIRE_HOURS: int = int(os.getenv("INVITATION_TOKEN_EXPIRE_HOURS", "72"))  # 72 hours
    
    # Defaults to SQLite for seamless instant local runs, easily overridden with PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BACKEND_DIR / 'medicare.db'}")
    
    # Gemini API Key
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Upload storage directory
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", str(BACKEND_DIR / "uploads"))
    
    # Demo credentials
    DEMO_USER_EMAIL: str = "patient@medicare.ai"
    DEMO_USER_PASSWORD: str = "medicare123"
    DEMO_CAREGIVER_EMAIL: str = "caregiver@medicare.ai"
    
    # SMTP Email Dispatcher (Supports Gmail, SendGrid, Mailgun, Amazon SES)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "noreply@medicare.ai")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "MediCare AI Health Portal")
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    class Config:
        case_sensitive = True
        env_file = (ENV_FILE, ".env")


settings = Settings()
