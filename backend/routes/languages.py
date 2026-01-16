"""
🗣️ API Routes pour l'apprentissage des langues
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from databases import learning_db as db  # Utiliser la nouvelle DB modulaire
import logging
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/languages", tags=["Languages"])


# ═══════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════

class LanguageMessageData(BaseModel):
    user_id: str
    message: Dict[str, Any]


class LanguageMessagesBulkData(BaseModel):
    user_id: str
    messages: List[Dict[str, Any]]


class VocabularyWordCreate(BaseModel):
    user_id: str
    word: str
    translation: str
    pronunciation: Optional[str] = None
    example: Optional[str] = None
    context: Optional[str] = ""


class VocabularyReviewSubmission(BaseModel):
    word_id: str
    quality: int  # 0-5 (SM-2 algorithm)


class ExerciseGenerateRequest(BaseModel):
    course_id: str
    user_id: str
    level: str = "A1"  # A1, A2, B1, B2, C1, C2
    type: Optional[str] = None  # fill-blank, translate, multiple-choice, reorder


class ExerciseCheckRequest(BaseModel):
    exercise_id: str
    user_answer: str
    course_id: str
    user_id: str


# ═══════════════════════════════════════════════════════════════
# ROUTES - MESSAGE ARCHIVING
# ═══════════════════════════════════════════════════════════════

@router.post("/save-message/{course_id}")
async def save_language_message(course_id: str, data: LanguageMessageData):
    """
    Sauvegarde un message de conversation linguistique
    """
    try:
        success = db.save_language_message(course_id, data.user_id, data.message)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save message")
        
        return {"success": True, "message_id": data.message["id"]}
        
    except Exception as e:
        logger.error(f"❌ Error in save_language_message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save-messages-bulk/{course_id}")
async def save_language_messages_bulk(course_id: str, data: LanguageMessagesBulkData):
    """
    Sauvegarde plusieurs messages en bulk (optimisé)
    """
    try:
        saved_count = db.save_language_messages_bulk(course_id, data.user_id, data.messages)
        
        return {
            "success": True,
            "saved_count": saved_count,
            "total_messages": len(data.messages)
        }
        
    except Exception as e:
        logger.error(f"❌ Error in save_language_messages_bulk: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/archive-messages/{course_id}")
async def archive_language_messages(course_id: str, keep_recent: int = 50):
    """
    Archive automatiquement les vieux messages de langue
    """
    try:
        archived_count = db.archive_old_language_messages(course_id, keep_recent)
        
        return {
            "success": True,
            "archived_count": archived_count,
            "keep_recent": keep_recent
        }
        
    except Exception as e:
        logger.error(f"❌ Error in archive_language_messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recent-messages/{course_id}")
async def get_recent_language_messages(course_id: str, limit: int = 50):
    """
    Récupère les messages récents (non-archivés)
    """
    try:
        messages = db.get_recent_language_messages(course_id, limit)
        
        return {
            "course_id": course_id,
            "messages": messages,
            "count": len(messages)
        }
        
    except Exception as e:
        logger.error(f"❌ Error in get_recent_language_messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/archived-messages/{course_id}")
async def get_archived_language_messages(
    course_id: str, 
    limit: int = 100, 
    offset: int = 0
):
    """
    Récupère l'historique archivé (pour consultation)
    """
    try:
        messages = db.get_archived_language_messages(course_id, limit, offset)
        
        return {
            "course_id": course_id,
            "messages": messages,
            "count": len(messages),
            "limit": limit,
            "offset": offset,
            "has_more": len(messages) == limit
        }
        
    except Exception as e:
        logger.error(f"❌ Error in get_archived_language_messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/message-stats/{course_id}")
async def get_language_message_stats(course_id: str):
    """
    Récupère les statistiques de messages
    """
    try:
        stats = db.get_language_message_stats(course_id)
        
        return {
            "course_id": course_id,
            **stats
        }
        
    except Exception as e:
        logger.error(f"❌ Error in get_language_message_stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════
# ROUTES - VOCABULARY & SPACED REPETITION
# ═══════════════════════════════════════════════════════════════

@router.post("/add-vocabulary/{course_id}")
async def add_vocabulary(course_id: str, data: VocabularyWordCreate):
    """
    Ajoute un nouveau mot de vocabulaire
    """
    try:
        word_data = {
            'word': data.word,
            'translation': data.translation,
            'pronunciation': data.pronunciation,
            'example': data.example,
            'context': data.context
        }
        
        success = db.add_vocabulary_word(course_id, data.user_id, word_data)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to add vocabulary")
        
        return {"success": True, "word": data.word}
        
    except Exception as e:
        logger.error(f"❌ Error in add_vocabulary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vocabulary/{course_id}")
async def get_vocabulary(course_id: str, user_id: str, limit: Optional[int] = None):
    """
    Récupère tout le vocabulaire d'un cours
    """
    try:
        words = db.get_vocabulary(course_id, user_id, limit)
        
        return {
            "course_id": course_id,
            "words": words,
            "count": len(words)
        }
        
    except Exception as e:
        logger.error(f"❌ Error in get_vocabulary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vocabulary/due-for-review/{course_id}")
async def get_due_vocabulary(course_id: str, user_id: str):
    """
    Récupère les mots à réviser aujourd'hui (Spaced Repetition)
    """
    try:
        words = db.get_due_vocabulary(course_id, user_id)
        
        return {
            "course_id": course_id,
            "words": words,
            "count": len(words)
        }
        
    except Exception as e:
        logger.error(f"❌ Error in get_due_vocabulary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vocabulary/submit-review")
async def submit_vocabulary_review(data: VocabularyReviewSubmission):
    """
    Soumet une révision de mot (met à jour SM-2)
    
    quality: 0-5
    - 0: Complete blackout
    - 1: Incorrect, remembered with hints
    - 2: Incorrect, seemed easy to recall
    - 3: Correct, difficult recall
    - 4: Correct, hesitation
    - 5: Perfect response
    """
    try:
        if data.quality < 0 or data.quality > 5:
            raise HTTPException(status_code=400, detail="Quality must be between 0 and 5")
        
        success = db.update_vocabulary_review(data.word_id, data.quality)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update review")
        
        return {"success": True, "word_id": data.word_id}
        
    except Exception as e:
        logger.error(f"❌ Error in submit_vocabulary_review: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vocabulary/stats/{course_id}")
async def get_vocabulary_stats(course_id: str, user_id: str):
    """
    Récupère les statistiques de vocabulaire
    """
    try:
        stats = db.get_vocabulary_stats(course_id, user_id)
        
        return {
            "course_id": course_id,
            **stats
        }
        
    except Exception as e:
        logger.error(f"❌ Error in get_vocabulary_stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════
# ROUTES - EXERCICES INTERACTIFS
# ═══════════════════════════════════════════════════════════════

@router.post("/generate-exercise")
async def generate_exercise(data: ExerciseGenerateRequest):
    """
    Génère un exercice interactif adapté au niveau via IA (Gemini/OpenAI)
    Types: fill-blank, translate, multiple-choice, reorder
    """
    from services.openai_service import openai_service
    import random
    import json
    
    try:
        # Sélectionner un type d'exercice aléatoire si non spécifié
        exercise_types = ['fill-blank', 'translate', 'multiple-choice', 'reorder']
        exercise_type = data.type if data.type in exercise_types else random.choice(exercise_types)
        
        # Construire le prompt pour l'IA selon le type d'exercice
        if exercise_type == 'fill-blank':
            prompt = f"""Génère un exercice de français niveau {data.level} de type "phrase à trou".

Réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas d'explication) :
{{
  "question": "Phrase avec _____ pour indiquer le mot manquant",
  "correctAnswer": "le mot correct qui remplit le trou",
  "explanation": "courte explication grammaticale (1 phrase)",
  "topic": "sujet grammatical (ex: Verbes au présent, Adjectifs possessifs)"
}}

Règles strictes:
- Adapté au niveau {data.level} (débutant/intermédiaire/avancé)
- UN SEUL mot manquant dans la phrase
- Phrase naturelle et courante
- Explication pédagogique claire"""

        elif exercise_type == 'translate':
            prompt = f"""Génère un exercice de traduction anglais → français niveau {data.level}.

Réponds UNIQUEMENT avec un objet JSON valide :
{{
  "question": "Phrase en anglais à traduire",
  "correctAnswer": "traduction française correcte et naturelle",
  "explanation": "point de grammaire ou vocabulaire clé (1 phrase)",
  "topic": "thème de la phrase (ex: Vie quotidienne, Voyage, Travail)"
}}

Règles:
- Phrase anglaise naturelle niveau {data.level}
- Traduction française précise attendue
- Vocabulaire et structures adaptés au niveau"""

        elif exercise_type == 'multiple-choice':
            prompt = f"""Génère un QCM de français niveau {data.level}.

Réponds UNIQUEMENT avec un objet JSON valide :
{{
  "question": "Question de grammaire/vocabulaire/conjugaison claire",
  "options": ["option 1", "option 2", "option 3", "option 4"],
  "correctAnswer": "la bonne réponse (doit être exactement l'une des options)",
  "explanation": "pourquoi c'est cette réponse (1-2 phrases)",
  "topic": "sujet testé (ex: Conjugaison, Vocabulaire, Grammaire)"
}}

Règles strictes:
- EXACTEMENT 4 options
- Une seule correcte
- Distracteurs plausibles mais incorrects
- Question claire adaptée niveau {data.level}"""

        else:  # reorder
            prompt = f"""Génère un exercice "remettre les mots dans l'ordre" niveau {data.level}.

Réponds UNIQUEMENT avec un objet JSON valide :
{{
  "question": "Remets les mots dans le bon ordre pour former une phrase correcte",
  "correctAnswer": ["mot1", "mot2", "mot3", "mot4", "mot5"],
  "explanation": "règle de grammaire illustrée (1 phrase)",
  "topic": "structure grammaticale (ex: Ordre des mots, Négation, Question)"
}}

Règles:
- Array de 4-6 mots dans l'ordre CORRECT
- Phrase grammaticalement correcte niveau {data.level}
- Structure intéressante pédagogiquement"""

        # Appeler l'IA pour générer l'exercice
        try:
            ai_response = await openai_service.generate_completion(prompt, max_tokens=300)
            
            # Parser la réponse JSON
            # Nettoyer la réponse (enlever markdown si présent)
            clean_response = ai_response.strip()
            if clean_response.startswith('```'):
                # Extraire JSON du bloc markdown
                clean_response = clean_response.split('```')[1]
                if clean_response.startswith('json'):
                    clean_response = clean_response[4:]
                clean_response = clean_response.strip()
            
            exercise_data = json.loads(clean_response)
            
            # Construire l'exercice final
            exercise = {
                'id': str(uuid.uuid4()),
                'type': exercise_type,
                'question': exercise_data.get('question', ''),
                'correctAnswer': exercise_data.get('correctAnswer'),
                'explanation': exercise_data.get('explanation', ''),
                'topic': exercise_data.get('topic', 'Général'),
                'difficulty': 'easy' if data.level in ['A1', 'A2'] else 'medium' if data.level in ['B1', 'B2'] else 'hard'
            }
            
            # Ajouter les options pour MCQ
            if exercise_type == 'multiple-choice':
                exercise['options'] = exercise_data.get('options', [])
            
            return {
                'exercise': exercise,
                'level': data.level
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse AI response as JSON: {ai_response[:200]}")
            raise HTTPException(status_code=500, detail="IA response parsing error")
        except Exception as e:
            logger.error(f"❌ Error calling AI service: {e}")
            raise HTTPException(status_code=500, detail="AI generation failed")
        
    except Exception as e:
        logger.error(f"❌ Error generating exercise: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/check-exercise")
async def check_exercise(data: ExerciseCheckRequest):
    """
    Vérifie la réponse de l'utilisateur à un exercice via IA (tolérance intelligente)
    """
    from services.openai_service import openai_service
    import json
    
    try:
        # Utiliser l'IA pour vérifier la réponse (permet de gérer les variations acceptables)
        prompt = f"""Tu es un correcteur d'exercices de langue bienveillant.

EXERCICE:
Question: {data.exercise_id}
Réponse de l'étudiant: "{data.user_answer}"

TÂCHE:
Évalue si la réponse est correcte, partiellement correcte, ou incorrecte.
Sois tolérant pour:
- Fautes de frappe mineures
- Variations acceptables (ex: "Je parle français" vs "je parle français")
- Synonymes appropriés pour les traductions

Réponds UNIQUEMENT avec un objet JSON valide:
{{
  "is_correct": true ou false,
  "score": 0-100 (0=faux, 50-90=partiellement correct, 100=parfait),
  "feedback": "feedback constructif en 1-2 phrases",
  "corrections": "si incorrect, montre la bonne réponse"
}}"""

        try:
            ai_response = await openai_service.generate_completion(prompt, max_tokens=200)
            
            # Parser la réponse JSON
            clean_response = ai_response.strip()
            if clean_response.startswith('```'):
                clean_response = clean_response.split('```')[1]
                if clean_response.startswith('json'):
                    clean_response = clean_response[4:]
                clean_response = clean_response.strip()
            
            result = json.loads(clean_response)
            
            # Enregistrer l'exercice complété
            completed_id = str(uuid.uuid4())
            db.save_completed_exercise(
                exercise_id=data.exercise_id,
                course_id=data.course_id,
                user_id=data.user_id,
                score=result.get('score', 0)
            )
            
            return {
                'is_correct': result.get('is_correct', False),
                'score': result.get('score', 0),
                'feedback': result.get('feedback', ''),
                'corrections': result.get('corrections', ''),
                'completed_id': completed_id
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse AI correction response: {e}")
            # Fallback SÉCURISÉ: ne pas valider automatiquement
            # Retourne un score neutre et demande à l'utilisateur de réessayer
            return {
                'is_correct': False,
                'score': 0,
                'feedback': 'Impossible de vérifier ta réponse automatiquement. Réessaie ou passe à l\'exercice suivant.',
                'corrections': '',
                'completed_id': None  # Pas d'ID = non comptabilisé
            }
        
    except Exception as e:
        logger.error(f"❌ Error checking exercise: {e}")
        raise HTTPException(status_code=500, detail=str(e))
