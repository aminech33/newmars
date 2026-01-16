"""
Routes API pour l'apprentissage adaptatif
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging
from services.ai_dispatcher import ai_dispatcher
from databases import learning_db

logger = logging.getLogger(__name__)

# Alias pour compatibilité
db = learning_db
from utils.sm2_algorithm import (
    calculate_next_review,
    calculate_mastery_change,
    determine_difficulty,
    calculate_xp_reward
)
from models.learning import (
    SessionStartRequest,
    AnswerSubmission,
    AdaptiveFeedback
)
import uuid
from datetime import datetime

router = APIRouter()

# Stockage temporaire en mémoire (remplacer par database plus tard)
sessions: Dict[str, Any] = {}
user_mastery: Dict[str, Dict[str, Any]] = {}  # user_id -> topic_id -> mastery data


@router.post("/start-session")
async def start_session(request: SessionStartRequest):
    """
    Démarre une session d'apprentissage
    
    Returns:
        Session ID et informations
    """
    session_id = str(uuid.uuid4())
    
    sessions[session_id] = {
        "id": session_id,
        "course_id": request.course_id,
        "topic_id": request.topic_id or "default-topic",
        "topic_name": request.topic_id or "default-topic",  # 🧠 V1.9.0: Pour lier aux concepts
        "started_at": datetime.now().isoformat(),
        "questions_answered": 0,
        "correct_answers": 0,
        "xp_earned": 0,
        "user_id": "demo-user"  # Pour demo
    }
    
    return {
        "session_id": session_id,
        "message": "Session d'apprentissage démarrée !",
        "ready_for_question": True
    }


@router.get("/next-question/{session_id}")
async def get_next_question(session_id: str):
    """
    Génère la prochaine question adaptée
    
    Utilise:
    - L'algo SM-2++ pour déterminer la difficulté
    - Gemini pour générer la question
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session non trouvée")
    
    session = sessions[session_id]
    topic_id = session["topic_id"]
    user_id = session["user_id"]
    
    # Récupérer ou initialiser la maîtrise du topic
    if user_id not in user_mastery:
        user_mastery[user_id] = {}
    
    if topic_id not in user_mastery[user_id]:
        user_mastery[user_id][topic_id] = {
            "mastery_level": 0,
            "ease_factor": 2.5,
            "interval": 1,
            "repetitions": 0,
            "success_rate": 0.0,
            "consecutive_skips": 0,
            "total_attempts": 0,
            "correct_attempts": 0
        }
    
    mastery_data = user_mastery[user_id][topic_id]
    
    # Déterminer la difficulté avec l'algo
    difficulty = determine_difficulty(
        mastery_data["mastery_level"],
        mastery_data["success_rate"],
        skip_days=0  # Pas de skip pour demo
    )
    
    # Générer la question avec le dispatcher intelligent
    try:
        question = await ai_dispatcher.generate_question(
            topic_name=f"Topic {topic_id}",  # À remplacer par le vrai nom
            difficulty=difficulty,
            mastery_level=mastery_data["mastery_level"],
            learning_style=None,  # À améliorer avec ML
            weak_areas=[],
            context=None
        )
        
        # Stocker la question dans la session
        session["current_question"] = {
            "id": question.id,
            "difficulty": difficulty,
            "started_at": datetime.now().isoformat()
        }
        
        return {
            "question_id": question.id,
            "question_text": question.question_text,
            "options": [
                {"id": opt.id, "text": opt.text}
                for opt in question.options
            ],
            "difficulty": difficulty,
            "mastery_level": mastery_data["mastery_level"],
            "estimated_time": question.estimated_time,
            "hints": question.hints,
            "correct_answer": question.correct_answer,  # À enlever en prod !
            "explanation": question.explanation  # À enlever en prod !
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la génération de la question: {str(e)}"
        )


@router.post("/submit-answer/{session_id}")
async def submit_answer(session_id: str, submission: AnswerSubmission):
    """
    Soumet une réponse et reçoit un feedback adaptatif
    
    Utilise:
    - SM-2++ pour calculer la nouvelle maîtrise
    - Gemini pour générer l'encouragement
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session non trouvée")
    
    session = sessions[session_id]
    
    if "current_question" not in session:
        raise HTTPException(status_code=400, detail="Pas de question active")
    
    current_q = session["current_question"]
    topic_id = session["topic_id"]
    user_id = session["user_id"]
    mastery_data = user_mastery[user_id][topic_id]
    
    # Simuler la vérification (en vrai, comparer avec la bonne réponse)
    # Pour demo, on dit que c'est correct si l'user_answer contient "correct"
    is_correct = "correct" in submission.user_answer.lower() or "oui" in submission.user_answer.lower()
    
    # Calculer le changement de maîtrise
    mastery_change = calculate_mastery_change(
        is_correct=is_correct,
        difficulty=current_q["difficulty"],
        current_mastery=mastery_data["mastery_level"],
        response_time=submission.time_taken,
        expected_time=60
    )
    
    # Mettre à jour la maîtrise
    new_mastery = max(0, min(100, mastery_data["mastery_level"] + mastery_change))
    mastery_data["mastery_level"] = new_mastery
    mastery_data["total_attempts"] += 1
    
    if is_correct:
        mastery_data["correct_attempts"] += 1
        session["correct_answers"] += 1
        
        # 🧠 V1.9.0: Mise à jour mastery des concepts liés au topic
        # Lien quiz réussi → +10-15% mastery pour concepts pertinents
        try:
            course_id = session.get("course_id")
            if not course_id:
                logger.warning("⚠️ Session missing course_id, skipping concept mastery update")
            else:
                topic_name = session.get("topic_name", topic_id)
                concepts = db.get_concepts(course_id)
                
                if not concepts:
                    logger.debug(f"No concepts found for course {course_id}")
                else:
                    # Trouver les concepts liés à ce topic
                    matching_concepts = [
                        c for c in concepts 
                        if topic_name.lower() in c['concept'].lower()
                        or any(keyword in topic_name.lower() for keyword in c.get('keywords', []))
                    ]
                    
                    if not matching_concepts:
                        logger.debug(f"No concepts matching topic '{topic_name}'")
                    
                    for concept in matching_concepts:
                        # Boost majeur pour quiz réussi (+10-15% selon difficulté)
                        if current_q["difficulty"] == "expert":
                            concept_mastery_boost = 15
                        elif current_q["difficulty"] == "intermediate":
                            concept_mastery_boost = 12
                        else:
                            concept_mastery_boost = 10
                        
                        new_concept_mastery = min(100, concept['mastery_level'] + concept_mastery_boost)
                        db.update_mastery(concept['id'], new_concept_mastery)
                        
                        logger.info(f"✅ Quiz success → Concept '{concept['concept']}' "
                                  f"mastery updated: {concept['mastery_level']}% → {new_concept_mastery}%")
        except Exception as e:
            # Non-bloquant si erreur
            logger.warning(f"⚠️ Could not update concept mastery: {e}")
    
    mastery_data["success_rate"] = (
        mastery_data["correct_attempts"] / mastery_data["total_attempts"]
    )
    
    # Calculer XP
    streak = session.get("streak", 0) + (1 if is_correct else 0)
    session["streak"] = streak if is_correct else 0
    
    xp_earned = calculate_xp_reward(
        is_correct=is_correct,
        difficulty=current_q["difficulty"],
        streak=streak,
        is_first_of_day=session["questions_answered"] == 0
    )
    
    session["xp_earned"] += xp_earned
    session["questions_answered"] += 1
    
    # Calculer la prochaine révision avec SM-2++
    quality = 4 if is_correct else 2  # Simplification
    new_ease, new_interval, next_review = calculate_next_review(
        quality=quality,
        ease_factor=mastery_data["ease_factor"],
        interval=mastery_data["interval"],
        repetitions=mastery_data["repetitions"],
        skip_days=0,
        consecutive_skips=mastery_data["consecutive_skips"]
    )
    
    mastery_data["ease_factor"] = new_ease
    mastery_data["interval"] = new_interval
    mastery_data["repetitions"] += 1 if is_correct else 0
    
    # Générer encouragement avec le dispatcher
    try:
        encouragement = await ai_dispatcher.generate_encouragement(
            is_correct=is_correct,
            streak=streak,
            mastery_change=mastery_change
        )
    except:
        encouragement = "Bien joué ! Continue comme ça ! 💪" if is_correct else "Pas grave, on apprend de nos erreurs ! 🌟"
    
    # Déterminer la prochaine action
    next_action = "continue"  # Toujours encourager à continuer
    difficulty_adjustment = None
    
    if mastery_data["success_rate"] > 0.8 and mastery_data["total_attempts"] >= 3:
        difficulty_adjustment = "harder"
    elif mastery_data["success_rate"] < 0.4 and mastery_data["total_attempts"] >= 3:
        difficulty_adjustment = "easier"
    
    # Nettoyer la question actuelle
    del session["current_question"]
    
    return AdaptiveFeedback(
        is_correct=is_correct,
        explanation=f"Ta maîtrise du topic est maintenant à {new_mastery}%",
        encouragement=encouragement,
        next_action=next_action,
        difficulty_adjustment=difficulty_adjustment,
        xp_earned=xp_earned,
        mastery_change=mastery_change,
        streak_info={
            "current_streak": streak,
            "message": f"🔥 {streak} bonnes réponses d'affilée !" if streak > 0 else None
        }
    )


@router.get("/progress/{session_id}")
async def get_progress(session_id: str):
    """
    Récupère la progression de la session
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session non trouvée")
    
    session = sessions[session_id]
    user_id = session["user_id"]
    topic_id = session["topic_id"]
    
    mastery_data = user_mastery.get(user_id, {}).get(topic_id, {})
    
    accuracy = (
        session["correct_answers"] / session["questions_answered"]
        if session["questions_answered"] > 0 else 0
    )
    
    return {
        "session_id": session_id,
        "questions_answered": session["questions_answered"],
        "correct_answers": session["correct_answers"],
        "accuracy": round(accuracy * 100, 1),
        "xp_earned": session["xp_earned"],
        "mastery_level": mastery_data.get("mastery_level", 0),
        "success_rate": round(mastery_data.get("success_rate", 0) * 100, 1),
        "current_streak": session.get("streak", 0),
        "next_review_in_days": mastery_data.get("interval", 1)
    }


@router.get("/demo-stats")
async def get_demo_stats():
    """
    Endpoint de démo pour voir toutes les sessions et mastery
    """
    return {
        "total_sessions": len(sessions),
        "sessions": [
            {
                "id": s_id,
                "questions_answered": s["questions_answered"],
                "xp_earned": s["xp_earned"]
            }
            for s_id, s in sessions.items()
        ],
        "user_mastery": {
            user_id: {
                topic_id: {
                    "mastery_level": data["mastery_level"],
                    "success_rate": round(data["success_rate"] * 100, 1)
                }
                for topic_id, data in topics.items()
            }
            for user_id, topics in user_mastery.items()
        }
    }
