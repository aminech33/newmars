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
    """Question générée par Gemini"""
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


class SessionStartRequest(BaseModel):
    """Requête pour démarrer une session"""
    course_id: str
    topic_id: Optional[str] = None
    user_id: Optional[str] = "demo-user"


class AnswerSubmission(BaseModel):
    """Soumission d'une réponse"""
    question_id: str
    user_answer: str
    time_taken: int  # secondes
    confidence: Optional[float] = None  # 0-1


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
