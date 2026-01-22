"""
Routes API pour la génération de contenu adaptatif.

Endpoints:
- GET /content/recommendations/{user_id} - Recommandations personnalisées
- POST /content/micro-lesson - Génère une micro-leçon
- POST /content/exercises - Génère des exercices ciblés
- POST /content/explanation - Génère une explication personnalisée
- POST /content/remediation-plan - Génère un plan de remédiation
- POST /content/mnemonic - Génère un aide-mémoire
- GET /content/profile/{user_id} - Profil d'apprentissage
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging

from services.adaptive_content_generator import (
    get_content_generator,
    ContentType,
    LearningStyle,
    GeneratedContent
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/content", tags=["adaptive-content"])


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class MicroLessonRequest(BaseModel):
    """Requête pour une micro-leçon."""
    user_id: str = Field(..., description="ID de l'utilisateur")
    topic: str = Field(..., description="Topic de la leçon")
    force_style: Optional[str] = Field(None, description="Forcer un style (visual, example, etc.)")


class ExerciseRequest(BaseModel):
    """Requête pour des exercices."""
    user_id: str = Field(..., description="ID de l'utilisateur")
    topic: str = Field(..., description="Topic des exercices")
    count: int = Field(5, ge=1, le=10, description="Nombre d'exercices (1-10)")


class ExplanationRequest(BaseModel):
    """Requête pour une explication."""
    user_id: str = Field(..., description="ID de l'utilisateur")
    topic: str = Field(..., description="Concept à expliquer")
    confusion: Optional[str] = Field(None, description="Ce que l'élève ne comprend pas")


class RemediationRequest(BaseModel):
    """Requête pour un plan de remédiation."""
    user_id: str = Field(..., description="ID de l'utilisateur")
    days: int = Field(7, ge=1, le=30, description="Durée du plan en jours")


class MnemonicRequest(BaseModel):
    """Requête pour un aide-mémoire."""
    user_id: str = Field(..., description="ID de l'utilisateur")
    topic: str = Field(..., description="Topic")
    rule: str = Field(..., description="Règle à mémoriser")


class ContentResponse(BaseModel):
    """Réponse standard pour le contenu généré."""
    success: bool = True
    type: str
    topic: str
    title: str
    content: str
    exercises: List[Dict[str, Any]] = []
    key_points: List[str] = []
    estimated_duration_minutes: int
    difficulty: int
    metadata: Dict[str, Any] = {}


class RecommendationsResponse(BaseModel):
    """Réponse pour les recommandations."""
    success: bool = True
    user_id: str
    recommendations: List[Dict[str, Any]]


class ProfileResponse(BaseModel):
    """Réponse pour le profil d'apprentissage."""
    success: bool = True
    user_id: str
    weak_topics: Dict[str, float]
    error_patterns: List[str]
    learning_style: str
    optimal_difficulty: int
    needs_encouragement: bool
    cognitive_state: str


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/recommendations/{user_id}", response_model=RecommendationsResponse)
async def get_recommendations(user_id: str, limit: int = 3):
    """
    Obtient des recommandations de contenu personnalisées.

    Analyse le profil de l'utilisateur et suggère le contenu
    le plus pertinent à étudier maintenant.
    """
    try:
        generator = get_content_generator()
        recommendations = generator.get_recommended_content(user_id, limit)

        return RecommendationsResponse(
            user_id=user_id,
            recommendations=recommendations
        )
    except Exception as e:
        logger.error(f"Erreur recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/profile/{user_id}", response_model=ProfileResponse)
async def get_learning_profile(user_id: str):
    """
    Récupère le profil d'apprentissage de l'utilisateur.

    Retourne les faiblesses, le style préféré, l'état cognitif, etc.
    """
    try:
        generator = get_content_generator()
        profile = generator.get_learner_profile(user_id)

        return ProfileResponse(
            user_id=user_id,
            weak_topics=profile.weak_topics,
            error_patterns=profile.error_patterns,
            learning_style=profile.learning_style.value,
            optimal_difficulty=profile.optimal_difficulty,
            needs_encouragement=profile.needs_encouragement,
            cognitive_state=profile.cognitive_state
        )
    except Exception as e:
        logger.error(f"Erreur profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/micro-lesson", response_model=ContentResponse)
async def generate_micro_lesson(request: MicroLessonRequest):
    """
    Génère une micro-leçon personnalisée (3-5 min).

    La leçon s'adapte au niveau, au style d'apprentissage,
    et à l'état cognitif de l'utilisateur.
    """
    try:
        generator = get_content_generator()

        force_style = None
        if request.force_style:
            try:
                force_style = LearningStyle(request.force_style)
            except ValueError:
                pass

        content = generator.generate_micro_lesson(
            user_id=request.user_id,
            topic=request.topic,
            force_style=force_style
        )

        return ContentResponse(
            type=content.type.value,
            topic=content.topic,
            title=content.title,
            content=content.content,
            exercises=content.exercises,
            key_points=content.key_points,
            estimated_duration_minutes=content.estimated_duration_minutes,
            difficulty=content.difficulty,
            metadata=content.metadata
        )
    except Exception as e:
        logger.error(f"Erreur micro-lesson: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/exercises", response_model=ContentResponse)
async def generate_exercises(request: ExerciseRequest):
    """
    Génère des exercices ciblés sur les erreurs de l'utilisateur.

    Les exercices progressent en difficulté et ciblent
    les patterns d'erreur détectés.
    """
    try:
        generator = get_content_generator()
        content = generator.generate_targeted_exercises(
            user_id=request.user_id,
            topic=request.topic,
            count=request.count
        )

        return ContentResponse(
            type=content.type.value,
            topic=content.topic,
            title=content.title,
            content=content.content,
            exercises=content.exercises,
            key_points=content.key_points,
            estimated_duration_minutes=content.estimated_duration_minutes,
            difficulty=content.difficulty,
            metadata=content.metadata
        )
    except Exception as e:
        logger.error(f"Erreur exercises: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/explanation", response_model=ContentResponse)
async def generate_explanation(request: ExplanationRequest):
    """
    Génère une explication personnalisée pour un concept.

    L'explication s'adapte au style d'apprentissage
    et part de ce que l'élève sait déjà.
    """
    try:
        generator = get_content_generator()
        content = generator.generate_personalized_explanation(
            user_id=request.user_id,
            topic=request.topic,
            confusion=request.confusion
        )

        return ContentResponse(
            type=content.type.value,
            topic=content.topic,
            title=content.title,
            content=content.content,
            exercises=content.exercises,
            key_points=content.key_points,
            estimated_duration_minutes=content.estimated_duration_minutes,
            difficulty=content.difficulty,
            metadata=content.metadata
        )
    except Exception as e:
        logger.error(f"Erreur explanation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/remediation-plan", response_model=ContentResponse)
async def generate_remediation_plan(request: RemediationRequest):
    """
    Génère un plan de remédiation personnalisé.

    Analyse les lacunes et propose un programme structuré
    pour combler les gaps sur N jours.
    """
    try:
        generator = get_content_generator()
        content = generator.generate_remediation_plan(
            user_id=request.user_id,
            days=request.days
        )

        return ContentResponse(
            type=content.type.value,
            topic=content.topic,
            title=content.title,
            content=content.content,
            exercises=content.exercises,
            key_points=content.key_points,
            estimated_duration_minutes=content.estimated_duration_minutes,
            difficulty=content.difficulty,
            metadata=content.metadata
        )
    except Exception as e:
        logger.error(f"Erreur remediation-plan: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mnemonic", response_model=ContentResponse)
async def generate_mnemonic(request: MnemonicRequest):
    """
    Génère un aide-mémoire personnalisé pour une règle.

    Crée des techniques de mémorisation adaptées au style
    de l'apprenant (acronymes, histoires, visualisations).
    """
    try:
        generator = get_content_generator()
        content = generator.generate_mnemonic(
            user_id=request.user_id,
            topic=request.topic,
            rule=request.rule
        )

        return ContentResponse(
            type=content.type.value,
            topic=content.topic,
            title=content.title,
            content=content.content,
            exercises=content.exercises,
            key_points=content.key_points,
            estimated_duration_minutes=content.estimated_duration_minutes,
            difficulty=content.difficulty,
            metadata=content.metadata
        )
    except Exception as e:
        logger.error(f"Erreur mnemonic: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Vérifie que le service est opérationnel."""
    return {
        "status": "healthy",
        "service": "AdaptiveContentGenerator",
        "version": "1.0.0",
        "features": [
            "micro_lessons",
            "targeted_exercises",
            "personalized_explanations",
            "remediation_plans",
            "mnemonics",
            "recommendations",
            "learning_profile"
        ]
    }
