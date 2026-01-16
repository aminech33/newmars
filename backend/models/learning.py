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
    next_action: str  # "continue" | "take_break" | "review" | "suggest_break" | "topic_mastered"
    difficulty_adjustment: Optional[str] = None  # "easier" | "harder"

    # Gamification
    xp_earned: int
    mastery_change: int
    streak_info: Dict[str, Any]

    # Interleaving info
    current_topic_id: Optional[str] = None
    next_topic_id: Optional[str] = None
    interleaving_benefit: Optional[float] = None  # % bonus de rétention estimé

    # 🆕 Plateau detection
    plateau_warning: Optional[Dict[str, Any]] = None
    # Format: {"detected": bool, "message": str, "attempts_in_plateau": int, "current_success_rate": float}

    # 🆕 Interleaving suggestions
    interleaving_suggestion: Optional[Dict[str, Any]] = None
    # Format: {"recommended": bool, "reason": str, "suggestion": str}

    # 🆕 Anomaly detection flags
    anomaly_flags: Optional[List[str]] = None
    # Values: ["impossible_speed", "instant_response", "suspicious_streak", "perfect_record"]

    # 🧠 Advanced Learning Metrics (FSRS, Cognitive Load, Transfer Learning)
    advanced_metrics: Optional[Dict[str, Any]] = None
    # Format: {
    #   "fsrs": {"stability": float, "difficulty": float, "next_review_days": float},
    #   "cognitive_load": {"level": str, "should_break": bool, "recommendation": str},
    #   "transfer_learning": {"applied": bool, "bonus_percent": float},
    #   "learning_efficiency": float
    # }


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


# ═══════════════════════════════════════════════════════════════════════════════
# 🧠 GENERATION EFFECT - Force l'élève à générer avant de voir les options
# Principe: "Testing effect" + "Desirable difficulty" = +25-30% rétention
# ═══════════════════════════════════════════════════════════════════════════════

class GenerationEffectQuestion(BaseModel):
    """Question en mode Generation Effect (2 phases)"""
    id: str
    topic_id: str
    difficulty: str
    question_text: str

    # Phase 1: Génération libre
    generation_prompt: str  # "Avant de voir les options, tape ta réponse..."
    expected_keywords: List[str] = []  # Mots-clés attendus dans la génération

    # Phase 2: QCM classique (révélé après génération)
    options: List[QuestionOption] = []
    correct_answer: str
    explanation: Optional[str] = None

    # Métadonnées
    generated_at: datetime = datetime.now()
    estimated_generation_time: int = 30  # secondes pour phase 1
    estimated_selection_time: int = 15  # secondes pour phase 2


class GenerationSubmission(BaseModel):
    """Soumission de la phase de génération (avant QCM)"""
    question_id: str
    generated_answer: str  # Réponse libre de l'élève
    generation_time: int  # Temps de réflexion en secondes
    confidence: Optional[float] = None  # 0-1, confiance avant de voir les options


class GenerationEffectResult(BaseModel):
    """Résultat après les 2 phases du Generation Effect"""
    # Résultat phase 1: Génération
    generation_quality: float  # 0-1, qualité de la génération
    keywords_matched: List[str]  # Mots-clés trouvés
    keywords_missed: List[str]  # Mots-clés manqués
    pre_generation_bonus: int  # XP bonus pour bonne génération

    # Résultat phase 2: QCM
    is_correct: bool
    explanation: str

    # Cohérence génération <-> sélection
    was_consistent: bool  # La génération correspondait-elle à la réponse finale?
    consistency_bonus: int  # Bonus si cohérent

    # Impact global
    total_xp: int
    mastery_change: int
    retention_boost: float  # % estimé de boost de rétention

    # Feedback
    feedback: str  # Message personnalisé
