"""
Modèles cours et topics
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class Topic(BaseModel):
    """Un topic/sujet d'apprentissage"""
    id: str
    course_id: str
    name: str
    description: Optional[str] = None
    
    # Métriques de l'apprenant
    mastery_level: int = 0  # 0-100
    ease_factor: float = 2.5
    interval: int = 1  # jours
    repetitions: int = 0
    
    # Stats
    total_attempts: int = 0
    correct_attempts: int = 0
    success_rate: float = 0.0
    
    # Procrastination tracking
    consecutive_skips: int = 0
    last_reviewed: Optional[datetime] = None
    next_review: Optional[datetime] = None


class Course(BaseModel):
    """Un cours complet"""
    id: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    
    topics: List[Topic] = []
    
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()
