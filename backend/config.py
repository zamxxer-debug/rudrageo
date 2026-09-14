import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Rudra"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    DEMO_MODE: bool = True
    SECRET_KEY: str = "rudra-super-secret-production-grade-signing-key-minimum-32-chars-xyz-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Database
    DATABASE_URL: str = "sqlite:///./rudra.db"
    # Set DATABASE_URL to Supabase's PostgreSQL connection string when ready.
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    AUTH_PROVIDER: str = "backend"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://localhost:8000"
    
    # Blockchain
    BLOCKCHAIN_MODE: str = "simulated_merkle"
    BLOCKCHAIN_RPC_URL: str = "https://rpc.sepolia.org"
    BLOCKCHAIN_PRIVATE_KEY: str = ""
    BLOCKCHAIN_CONTRACT_ADDRESS: str = ""
    
    # External services
    WEATHER_API_KEY: str = ""
    WEATHER_PROVIDER: str = "openweather"
    SMS_PROVIDER: str = "mock"
    SMS_API_KEY: str = ""
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""
    
    # AI
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    
    # Payment / UPI
    PAYMENT_PROVIDER: str = "upi_simulator"
    MERCHANT_VPA: str = "drishti.safety@gov.in"
    MERCHANT_NAME: str = "Nilgiris District Tourism & Safety Administration"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
