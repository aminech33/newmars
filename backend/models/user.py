"""
Modèles utilisateur
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class UserProfile(BaseModel):
    """Profil d'apprentissage de l'utilisateur"""
    learning_style: Optional[str] = None  # "visual", "auditory", "kinesthetic", "practical"
    procrastination_score: float = 0.5  # 0-1, 1 = procrastinateur extrême
    preferred_difficulty: str = "medium"
    study_streak: int = 0
    total_xp: int = 0
    level: int = 1


class User(BaseModel):
    """Utilisateur du système"""
    id: str
    email: str
    name: Optional[str] = None
    profile: UserProfile = UserProfile()
    created_at: datetime = datetime.now()
    last_active: Optional[datetime] = None
    settings: Dict[str, Any] = {}
