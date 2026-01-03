"""
Modèles pour les sessions d'apprentissage
"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class QuestionOption(BaseModel):
    """Une option de réponse"""
    id: str
    text: str
    is_correct: bool = False


class Question(BaseModel):
    """Question générée par ChatGPT (OpenAI)"""
    id: str
    topic_id: str
    difficulty: str  # "easy" | "medium" | "hard"
    question_text: str
    question_type: str = "multiple_choice"
    
    options: List[QuestionOption] = []
    correct_answer: str
    explanation: Optional[str] = None
    hints: List[str] = []
    
    generated_at: datetime = datetime.now()
    estimated_time: int = 60  # secondes
    tags: List[str] = []
    
    # Question rating (pour auto-calibration)
    target_difficulty: Optional[str] = None  # La difficulté demandée à l'origine
    actual_difficulty: Optional[str] = None  # La difficulté réelle basée sur les stats
    stats: Optional[Dict[str, Any]] = None  # Stats agrégées multi-utilisateurs


class SessionStartRequest(BaseModel):
    """Requête pour démarrer une session"""
    course_id: str
    topic_id: Optional[str] = None
    topic_ids: Optional[List[str]] = None  # Pour interleaving de plusieurs topics
    user_id: Optional[str] = "demo-user"
    use_interleaving: bool = False  # Interleaving désactivé par défaut (opt-in)


class AnswerSubmission(BaseModel):
    """Soumission d'une réponse"""
    question_id: str
    user_answer: str
    time_taken: int  # secondes
    confidence: Optional[float] = None  # 0-1
    perceived_difficulty: Optional[str] = None  # "too_easy" | "just_right" | "too_hard"


class AdaptiveFeedback(BaseModel):
    """Feedback adaptatif après une réponse"""
    is_correct: bool
    explanation: str
    encouragement: str
    
    # Actions recommandées
    next_action: str  # "continue" | "take_break" | "review"
    difficulty_adjustment: Optional[str] = None  # "easier" | "harder"
    
    # Gamification
    xp_earned: int
    mastery_change: int
    streak_info: Dict[str, Any]
    
    # Interleaving info
    current_topic_id: Optional[str] = None
    next_topic_id: Optional[str] = None
    interleaving_benefit: Optional[float] = None  # % bonus de rétention estimé


class TopicMastery(BaseModel):
    """Données de maîtrise d'un topic avec sub-concepts"""
    topic_id: str
    mastery_level: int = 0  # 0-100
    ease_factor: float = 2.5
    interval: int = 1  # jours
    repetitions: int = 0
    success_rate: float = 0.0
    consecutive_skips: int = 0
    total_attempts: int = 0
    correct_attempts: int = 0
    last_practiced: Optional[datetime] = None
    next_review: Optional[datetime] = None
    
    # Success rate par difficulté (pour meilleure adaptation)
    success_by_difficulty: Dict[str, float] = {
        "easy": 0.0,
        "medium": 0.0,
        "hard": 0.0
    }
    attempts_by_difficulty: Dict[str, int] = {
        "easy": 0,
        "medium": 0,
        "hard": 0
    }
    
    # Sub-concepts tracking (granularité fine)
    concepts: Dict[str, Dict[str, Any]] = {}
    # Format: {"concept_name": {"mastery": 0-100, "last_seen": datetime, "attempts": int}}


class InterleavingSession(BaseModel):
    """Session avec interleaving de plusieurs topics"""
    session_id: str
    user_id: str
    course_id: str
    topic_ids: List[str]  # Topics à pratiquer en interleaving
    current_topic_idx: int = 0
    question_history: List[str] = []  # Historique des topic_ids des questions
    switch_frequency: int = 2  # Changer de topic tous les N questions
    interleaving_enabled: bool = True
    estimated_benefit: float = 0.0  # % bonus de rétention
    started_at: datetime = datetime.now()
