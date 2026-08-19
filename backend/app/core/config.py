import os

try:
    from pydantic_settings import BaseSettings
    class Settings(BaseSettings):
        PROJECT_NAME: str = "Auralix RevenueHub"
        VERSION: str = "1.0.0"
        API_V1_STR: str = "/api/v1"
        SECRET_KEY: str = os.getenv("SECRET_KEY", "auralix_revenuehub_super_secret_jwt_key_2026_x89a")
        ALGORITHM: str = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
        DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./auralix_revenuehub.db")
        COMPANY_NAME: str = "Auralix Technologies"
        COMPANY_WEBSITE: str = "https://auralixtechnologies.netlify.app/"
        COMPANY_EMAIL: str = "contact@auralixtechnologies.com"
        COMPANY_PHONE: str = "+91 98765 43210"
        COMPANY_GSTIN: str = "33AAAAA0000A1Z5"
        COMPANY_ADDRESS: str = "Auralix Tech Park, Technology Drive, Chennai, TN, India"
        CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")
        CURRENCY_SYMBOL: str = "₹"
        CURRENCY_CODE: str = "INR"
        class Config:
            case_sensitive = True
except ImportError:
    class Settings:
        PROJECT_NAME: str = "Auralix RevenueHub"
        VERSION: str = "1.0.0"
        API_V1_STR: str = "/api/v1"
        SECRET_KEY: str = os.getenv("SECRET_KEY", "auralix_revenuehub_super_secret_jwt_key_2026_x89a")
        ALGORITHM: str = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
        DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./auralix_revenuehub.db")
        CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")
        COMPANY_NAME: str = "Auralix Technologies"
        COMPANY_WEBSITE: str = "https://auralixtechnologies.netlify.app/"
        COMPANY_EMAIL: str = "contact@auralixtechnologies.com"
        COMPANY_PHONE: str = "+91 98765 43210"
        COMPANY_GSTIN: str = "33AAAAA0000A1Z5"
        COMPANY_ADDRESS: str = "Auralix Tech Park, Technology Drive, Chennai, TN, India"
        CURRENCY_SYMBOL: str = "₹"
        CURRENCY_CODE: str = "INR"

settings = Settings()
