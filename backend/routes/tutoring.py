"""
Routes API pour le tuteur socratique.

Endpoints:
- POST /tutoring/wrong-answer - Traite une mauvaise réponse (point d'entrée principal)
- POST /tutoring/hint - Demande un indice
- POST /tutoring/guidance - Demande une question de guidage
- POST /tutoring/validate-reasoning - Valide le raisonnement de l'étudiant
- POST /tutoring/correct-answer - Signale une bonne réponse
- GET /tutoring/misconceptions/{user_id} - Liste les misconceptions détectées
- POST /tutoring/reset - Reset le contexte de tutorat
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging

from services.socratic_tutor import SocraticTutor, create_socratic_tutor, TutoringResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tutoring", tags=["tutoring"])

# Instance globale du tuteur (sera initialisée avec OpenAI si disponible)
_tutor: Optional[SocraticTutor] = None


def get_tutor() -> SocraticTutor:
    """Dependency pour obtenir le tuteur."""
    global _tutor
    if _tutor is None:
        # Essayer d'obtenir le service OpenAI
        try:
            from services.openai_service import openai_service
            _tutor = create_socratic_tutor(openai_service)
        except Exception:
            _tutor = create_socratic_tutor(None)
    return _tutor


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class QuestionData(BaseModel):
    """Données de la question."""
    id: str = Field(..., description="ID unique de la question")
    question_text: str = Field(..., description="Texte de la question")
    options: List[str] = Field(..., description="Options de réponse")
    correct_answer: str = Field(..., description="La bonne réponse")
    topic: str = Field(..., description="Topic (conjugaison, grammaire, etc.)")
    explanation: Optional[str] = Field(None, description="Explication de la bonne réponse")
    difficulty: Optional[int] = Field(3, description="Niveau de difficulté 1-5")


class WrongAnswerRequest(BaseModel):
    """Requête pour traiter une mauvaise réponse."""
    user_id: str = Field(..., description="ID de l'utilisateur")
    question: QuestionData
    user_answer: str = Field(..., description="La réponse (incorrecte) de l'utilisateur")
    response_time: Optional[float] = Field(None, description="Temps de réponse en secondes")


class HintRequest(BaseModel):
    """Requête pour un indice."""
    user_id: str
    question: QuestionData
    user_answer: str
    force_level: Optional[int] = Field(None, description="Forcer un niveau d'indice (1-3)")


class GuidanceRequest(BaseModel):
    """Requête pour une question de guidage."""
    user_id: str
    question: QuestionData
    user_answer: str


class ReasoningRequest(BaseModel):
    """Requête pour valider le raisonnement."""
    user_id: str
    question: QuestionData
    user_explanation: str = Field(..., description="L'explication de l'étudiant")


class CorrectAnswerRequest(BaseModel):
    """Signale une bonne réponse."""
    user_id: str
    question: QuestionData
    attempts: int = Field(1, description="Nombre d'essais avant de trouver")
    response_time: Optional[float] = Field(None, description="Temps de réponse en secondes")
    hint_level_used: int = Field(0, description="Niveau d'indice qui a mené au succès")


class MisconceptionRequest(BaseModel):
    """Requête pour détecter les misconceptions."""
    user_id: str
    topic: str
    wrong_answers: List[Dict[str, Any]] = Field(
        ...,
        description="Liste de {answer, correct_answer, question_type}"
    )


class ResetRequest(BaseModel):
    """Requête pour reset le contexte."""
    user_id: str
    topic: Optional[str] = None
    question_id: Optional[str] = None


class TutoringApiResponse(BaseModel):
    """Réponse standard du tuteur."""
    success: bool = True
    type: str = Field(..., description="Type: hint, guidance, validation, reveal, success")
    content: str = Field(..., description="Message du tuteur")
    level: Optional[int] = Field(None, description="Niveau d'indice (1-3) si applicable")
    requires_response: bool = Field(True, description="L'étudiant doit-il répondre ?")
    encouragement: str = Field("", description="Message d'encouragement")
    next_action: str = Field("", description="Prochaine action suggérée")
    cognitive_load: str = Field("optimal", description="Charge cognitive: optimal/elevated/high")


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/wrong-answer", response_model=TutoringApiResponse)
async def handle_wrong_answer(
    request: WrongAnswerRequest,
    tutor: SocraticTutor = Depends(get_tutor)
):
    """
    Point d'entrée principal: traite une mauvaise réponse.

    Le tuteur décide automatiquement quoi faire:
    - 1er essai → Question socratique
    - 2e-4e essai → Indices progressifs
    - 5e+ essai → Révélation

    L'étudiant n'a pas besoin de savoir "comment demander de l'aide".
    Le tuteur guide automatiquement.
    """
    try:
        question_dict = request.question.model_dump()

        response = tutor.process_wrong_answer(
            question_data=question_dict,
            user_answer=request.user_answer,
            user_id=request.user_id,
            response_time=request.response_time
        )

        return TutoringApiResponse(
            type=response.type,
            content=response.content,
            level=response.level,
            requires_response=response.requires_response,
            encouragement=response.encouragement,
            next_action=response.next_action,
            cognitive_load=response.cognitive_load
        )

    except Exception as e:
        logger.error(f"Erreur wrong-answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hint", response_model=TutoringApiResponse)
async def get_hint(
    request: HintRequest,
    tutor: SocraticTutor = Depends(get_tutor)
):
    """
    Demande explicite d'un indice.

    Niveaux:
    - 1 (SUBTLE): Très vague, pousse à réfléchir
    - 2 (MODERATE): Oriente vers la bonne direction
    - 3 (EXPLICIT): Presque la réponse

    Après niveau 3, si toujours faux → révèle.
    """
    try:
        question_dict = request.question.model_dump()
        topic = request.question.topic
        question_id = request.question.id

        context = tutor.get_context(request.user_id, topic, question_id)

        response = tutor.get_hint(
            question_data=question_dict,
            user_answer=request.user_answer,
            context=context,
            force_level=request.force_level
        )

        return TutoringApiResponse(
            type=response.type,
            content=response.content,
            level=response.level,
            requires_response=response.requires_response,
            encouragement=response.encouragement,
            next_action=response.next_action,
            cognitive_load=response.cognitive_load
        )

    except Exception as e:
        logger.error(f"Erreur hint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/guidance", response_model=TutoringApiResponse)
async def get_guidance(
    request: GuidanceRequest,
    tutor: SocraticTutor = Depends(get_tutor)
):
    """
    Demande une question de guidage socratique.

    Pose une question pour faire réfléchir l'étudiant
    sans jamais donner la réponse.
    """
    try:
        question_dict = request.question.model_dump()
        topic = request.question.topic
        question_id = request.question.id

        context = tutor.get_context(request.user_id, topic, question_id)

        response = tutor.get_socratic_guidance(
            question_data=question_dict,
            user_answer=request.user_answer,
            context=context
        )

        return TutoringApiResponse(
            type=response.type,
            content=response.content,
            level=response.level,
            requires_response=response.requires_response,
            encouragement=response.encouragement,
            next_action=response.next_action,
            cognitive_load=response.cognitive_load
        )

    except Exception as e:
        logger.error(f"Erreur guidance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate-reasoning", response_model=TutoringApiResponse)
async def validate_reasoning(
    request: ReasoningRequest,
    tutor: SocraticTutor = Depends(get_tutor)
):
    """
    Valide le raisonnement de l'étudiant.

    L'étudiant explique POURQUOI il a choisi sa réponse.
    Le tuteur valide le raisonnement (pas la réponse).

    ⚠️ Ne dit jamais si la réponse est correcte !
    """
    try:
        question_dict = request.question.model_dump()
        topic = request.question.topic
        question_id = request.question.id

        context = tutor.get_context(request.user_id, topic, question_id)

        response = await tutor.validate_reasoning(
            question_data=question_dict,
            user_explanation=request.user_explanation,
            context=context
        )

        return TutoringApiResponse(
            type=response.type,
            content=response.content,
            level=response.level,
            requires_response=response.requires_response,
            encouragement=response.encouragement,
            next_action=response.next_action,
            cognitive_load=response.cognitive_load
        )

    except Exception as e:
        logger.error(f"Erreur validate-reasoning: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/correct-answer", response_model=TutoringApiResponse)
async def handle_correct_answer(
    request: CorrectAnswerRequest,
    tutor: SocraticTutor = Depends(get_tutor)
):
    """
    Signale une bonne réponse.

    Félicite l'étudiant de manière appropriée selon
    le nombre d'essais avant de trouver.
    """
    try:
        question_dict = request.question.model_dump()

        response = tutor.process_correct_answer(
            question_data=question_dict,
            user_id=request.user_id,
            attempts=request.attempts,
            response_time=request.response_time,
            hint_level_used=request.hint_level_used
        )

        return TutoringApiResponse(
            type=response.type,
            content=response.content,
            level=response.level,
            requires_response=response.requires_response,
            encouragement=response.encouragement,
            next_action=response.next_action,
            cognitive_load=response.cognitive_load
        )

    except Exception as e:
        logger.error(f"Erreur correct-answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/misconceptions")
async def detect_misconceptions(
    request: MisconceptionRequest,
    tutor: SocraticTutor = Depends(get_tutor)
):
    """
    Détecte les misconceptions basées sur l'historique des erreurs.

    Analyse les patterns d'erreurs pour identifier les confusions
    courantes et proposer des corrections ciblées.
    """
    try:
        misconceptions = tutor.detect_misconceptions(
            wrong_answers=request.wrong_answers,
            topic=request.topic
        )

        return {
            "success": True,
            "user_id": request.user_id,
            "topic": request.topic,
            "misconceptions_found": len(misconceptions),
            "misconceptions": misconceptions
        }

    except Exception as e:
        logger.error(f"Erreur misconceptions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset")
async def reset_context(
    request: ResetRequest,
    tutor: SocraticTutor = Depends(get_tutor)
):
    """
    Reset le contexte de tutorat.

    Utilisé quand l'étudiant passe à une nouvelle question
    ou veut recommencer.
    """
    try:
        tutor.reset_context(
            user_id=request.user_id,
            topic=request.topic,
            question_id=request.question_id
        )

        return {
            "success": True,
            "message": "Contexte de tutorat réinitialisé"
        }

    except Exception as e:
        logger.error(f"Erreur reset: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/profile/{user_id}")
async def get_adaptive_profile(
    user_id: str,
    tutor: SocraticTutor = Depends(get_tutor)
):
    """
    Récupère le profil adaptatif de l'utilisateur.

    Retourne:
    - Heures optimales d'apprentissage
    - Style d'apprentissage détecté
    - État émotionnel actuel
    - Topics faibles identifiés
    - Patterns d'erreurs actifs
    """
    try:
        summary = tutor.get_profile_summary(user_id)
        return {
            "success": True,
            "user_id": user_id,
            "profile": summary
        }
    except Exception as e:
        logger.error(f"Erreur profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/profile/{user_id}/should-break")
async def should_take_break(
    user_id: str,
    tutor: SocraticTutor = Depends(get_tutor)
):
    """
    Vérifie si l'utilisateur devrait prendre une pause.

    Basé sur:
    - Niveau de fatigue
    - Niveau de frustration
    - Durée de session
    """
    try:
        should_break, message = tutor.should_suggest_break(user_id)
        return {
            "success": True,
            "should_break": should_break,
            "message": message if should_break else "Continue, tu es en forme !"
        }
    except Exception as e:
        logger.error(f"Erreur should-break: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/profile/{user_id}/optimal-hint-level")
async def get_optimal_hint_level(
    user_id: str,
    tutor: SocraticTutor = Depends(get_tutor)
):
    """
    Retourne le niveau d'indice optimal pour cet utilisateur.

    Basé sur l'historique d'efficacité des indices.
    Le tuteur apprend quel niveau fonctionne le mieux.
    """
    try:
        level = tutor.get_optimal_hint_level(user_id)
        return {
            "success": True,
            "optimal_level": level,
            "description": {
                1: "Indices subtils - tu n'as pas besoin de beaucoup d'aide",
                2: "Indices modérés - un bon équilibre",
                3: "Indices explicites - tu profites mieux des explications détaillées"
            }.get(level, "Niveau standard")
        }
    except Exception as e:
        logger.error(f"Erreur optimal-hint-level: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Vérifie que le service de tutorat est opérationnel."""
    return {
        "status": "healthy",
        "service": "SocraticTutor",
        "version": "2.0.0",
        "features": [
            "progressive_hints",
            "socratic_guidance",
            "reasoning_validation",
            "misconception_detection",
            "adaptive_profile",
            "temporal_adaptation",
            "emotional_detection",
            "meta_learning",
            "error_pattern_detection"
        ]
    }
