"""
Configuration centrale pour le backend adaptatif
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Configuration de l'application"""
    
    # API Keys (à définir dans .env)
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    
    # Algorithme SM-2++
    MIN_EASE_FACTOR: float = 1.3
    MAX_EASE_FACTOR: float = 2.5
    SKIP_PENALTY: float = 0.1  # Pénalité par jour de skip
    MAX_SKIP_PENALTY: float = 1.0  # Max -1 point de qualité
    DIFFICULTY_DECAY_RATE: float = 0.05  # 5% de baisse par jour
    
    # Serveur
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore les champs extra du .env
        # Ne pas lever d'erreur si le fichier .env n'existe pas
        case_sensitive = False


settings = Settings()
