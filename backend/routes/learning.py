"""
Routes API pour l'apprentissage adaptatif avec interleaving
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from services.openai_service import openai_service
from utils.sm2_algorithm import (
    calculate_next_review,
    calculate_mastery_change,
    determine_difficulty,
    calculate_xp_reward
)
from utils.interleaving import (
    select_interleaved_topics,
    get_next_topic_in_sequence,
    calculate_interleaving_benefit,
    should_use_interleaving
)
from models.learning import (
    SessionStartRequest,
    AnswerSubmission,
    AdaptiveFeedback,
    TopicMastery,
    InterleavingSession
)
from database import db
import uuid
from datetime import datetime
import statistics
import logging

# Logger pour debug
logger = logging.getLogger(__name__)

router = APIRouter()

# Cache en mémoire pour performance (synchronisé avec DB)
sessions_cache: Dict[str, Any] = {}
mastery_cache: Dict[str, Dict[str, Any]] = {}  # user_id -> topic_id -> mastery data


@router.post("/start-session")
async def start_session(request: SessionStartRequest):
    """
    Démarre une session d'apprentissage avec interleaving optionnel
    
    Si use_interleaving=True et plusieurs topics disponibles:
    - Sélectionne 2-3 topics avec un mix de niveaux
    - Active l'alternance entre topics
    
    Returns:
        Session ID et informations (y compris topics sélectionnés)
    """
    session_id = str(uuid.uuid4())
    user_id = request.user_id or "demo-user"
    
    # Charger la maîtrise depuis la DB
    if user_id not in mastery_cache:
        mastery_cache[user_id] = db.get_all_mastery(user_id)
    
    # Déterminer les topics à utiliser
    topics_to_use = []
    interleaving_enabled = False
    estimated_benefit = 0.0
    
    if request.topic_ids and len(request.topic_ids) > 0:
        # Topics spécifiés explicitement
        topics_to_use = request.topic_ids
    elif request.topic_id:
        # Un seul topic spécifié
        topics_to_use = [request.topic_id]
    else:
        # Aucun topic spécifié - utiliser un default
        topics_to_use = ["default-topic"]
    
    # Vérifier si l'interleaving est approprié
    if request.use_interleaving and len(topics_to_use) >= 2:
        is_appropriate = should_use_interleaving(mastery_cache[user_id], topics_to_use)
        
        if is_appropriate:
            logger.info(f"✅ Interleaving activé pour user {user_id} avec {len(topics_to_use)} topics")
            
            # Sélectionner les meilleurs topics pour interleaving
            selected_topics = select_interleaved_topics(
                mastery_cache[user_id],
                topics_to_use,
                num_topics=min(3, len(topics_to_use))
            )
            
            topics_to_use = [t["topic_id"] for t in selected_topics]
            interleaving_enabled = True
            
            # Calculer le bénéfice estimé
            mastery_levels = [t["mastery_level"] for t in selected_topics]
            mastery_variance = statistics.variance(mastery_levels) if len(mastery_levels) > 1 else 0
            estimated_benefit = calculate_interleaving_benefit(
                num_topics=len(topics_to_use),
                session_length=10,  # Estimation
                mastery_variance=mastery_variance
            )
            
            logger.info(f"📊 Topics sélectionnés: {topics_to_use}, boost estimé: +{estimated_benefit}%")
        else:
            logger.info(f"⚠️ Interleaving désactivé automatiquement pour user {user_id}")
            logger.info(f"   Raisons possibles: mastery < 20%, success_rate < 40%, ou < 5 tentatives")
            
            # Pas approprié - utiliser un seul topic
            topics_to_use = [topics_to_use[0]]
            interleaving_enabled = False
    elif request.use_interleaving:
        logger.info(f"ℹ️ Interleaving demandé mais seulement {len(topics_to_use)} topic(s) - désactivé")
    
    session_data = {
        "id": session_id,
        "course_id": request.course_id,
        "topic_ids": topics_to_use,
        "current_topic_idx": 0,
        "started_at": datetime.now().isoformat(),
        "questions_answered": 0,
        "correct_answers": 0,
        "xp_earned": 0,
        "user_id": user_id,
        "question_history": [],  # Historique des topics des questions
        "interleaving_enabled": interleaving_enabled,
        "switch_frequency": 2,
        "estimated_benefit": estimated_benefit
    }
    
    # Sauvegarder en DB et cache
    db.save_session(session_data)
    sessions_cache[session_id] = session_data
    
    message = "Session d'apprentissage démarrée !"
    if interleaving_enabled:
        message += f" 🔀 Interleaving activé avec {len(topics_to_use)} topics (+{estimated_benefit}% rétention)"
    
    return {
        "session_id": session_id,
        "message": message,
        "ready_for_question": True,
        "topics": topics_to_use,
        "interleaving_enabled": interleaving_enabled,
        "estimated_retention_boost": estimated_benefit
    }


@router.get("/next-question/{session_id}")
async def get_next_question(session_id: str):
    """
    Génère la prochaine question adaptée avec interleaving
    
    Si interleaving activé:
    - Alterne entre topics selon la stratégie définie
    - Adapte la difficulté pour chaque topic individuellement
    
    Utilise:
    - L'algo SM-2++ pour déterminer la difficulté
    - Interleaving pour sélectionner le topic
    - ChatGPT pour générer la question
    """
    # Charger depuis cache ou DB
    if session_id not in sessions_cache:
        session = db.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session non trouvée")
        sessions_cache[session_id] = session
    else:
        session = sessions_cache[session_id]
    
    user_id = session["user_id"]
    
    # Charger mastery depuis cache ou DB
    if user_id not in mastery_cache:
        mastery_cache[user_id] = db.get_all_mastery(user_id)
    
    # Déterminer quel topic pratiquer maintenant
    if session["interleaving_enabled"] and len(session["topic_ids"]) > 1:
        # Sélectionner avec interleaving
        topic_id = get_next_topic_in_sequence(
            session_history=session["question_history"],
            available_topics=[
                {"topic_id": tid, "mastery_level": mastery_cache[user_id].get(tid, {}).get("mastery_level", 0)}
                for tid in session["topic_ids"]
            ],
            switch_frequency=session["switch_frequency"]
        )
        
        # Log du switch si changement de topic
        if session["question_history"] and session["question_history"][-1] != topic_id:
            logger.info(f"🔄 Switch: {session['question_history'][-1]} → {topic_id}")
    else:
        # Un seul topic ou interleaving désactivé
        topic_id = session["topic_ids"][0]
    
    # Récupérer ou initialiser la maîtrise du topic
    if topic_id not in mastery_cache[user_id]:
        mastery_cache[user_id][topic_id] = {
            "mastery_level": 0,
            "ease_factor": 2.5,
            "interval": 1,
            "repetitions": 0,
            "success_rate": 0.0,
            "consecutive_skips": 0,
            "total_attempts": 0,
            "correct_attempts": 0,
            "last_practiced": None,
            "next_review": datetime.now(),
            "concepts": {},  # Sub-concepts tracking
            "success_by_difficulty": {"easy": 0.0, "medium": 0.0, "hard": 0.0},
            "attempts_by_difficulty": {"easy": 0, "medium": 0, "hard": 0}
        }
        # Sauvegarder en DB
        db.save_mastery(user_id, topic_id, mastery_cache[user_id][topic_id])
    
    mastery_data = mastery_cache[user_id][topic_id]
    
    # ✨ Déterminer la difficulté avec l'algo AMÉLIORÉ (utilise success_by_difficulty)
    difficulty = determine_difficulty(
        mastery_data["mastery_level"],
        mastery_data["success_rate"],
        skip_days=0,  # Pas de skip pour demo
        success_by_difficulty=mastery_data.get("success_by_difficulty")
    )
    
    # Générer la question avec ChatGPT
    try:
        question = await openai_service.generate_question(
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
            "topic_id": topic_id,
            "difficulty": difficulty,
            "started_at": datetime.now().isoformat()
        }
        
        # ✨ Sauvegarder la question pour le rating system
        db.save_question_stats(
            question_id=question.id,
            topic_id=topic_id,
            question_text=question.question_text,
            target_difficulty=difficulty
        )
        
        # Ajouter à l'historique pour interleaving
        session["question_history"].append(topic_id)
        
        # Sauvegarder session mise à jour
        db.save_session(session)
        
        # Calculer le prochain topic (pour affichage)
        next_topic_id = None
        if session["interleaving_enabled"] and len(session["topic_ids"]) > 1:
            next_topic_id = get_next_topic_in_sequence(
                session_history=session["question_history"],
                available_topics=[
                    {"topic_id": tid, "mastery_level": mastery_cache[user_id].get(tid, {}).get("mastery_level", 0)}
                    for tid in session["topic_ids"]
                ],
                switch_frequency=session["switch_frequency"]
            )
        
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
            "current_topic_id": topic_id,
            "next_topic_id": next_topic_id,
            "interleaving_active": session["interleaving_enabled"],
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
    
    Avec interleaving:
    - Track la maîtrise par topic individuellement
    - Calcule le bénéfice de l'interleaving
    - Indique quel topic sera pratiqué ensuite
    
    Utilise:
    - SM-2++ pour calculer la nouvelle maîtrise
    - ChatGPT pour générer l'encouragement
    """
    # Charger session depuis cache ou DB
    if session_id not in sessions_cache:
        session = db.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session non trouvée")
        sessions_cache[session_id] = session
    else:
        session = sessions_cache[session_id]
    
    if "current_question" not in session:
        raise HTTPException(status_code=400, detail="Pas de question active")
    
    current_q = session["current_question"]
    topic_id = current_q["topic_id"]
    user_id = session["user_id"]
    
    # Charger mastery depuis cache ou DB
    if user_id not in mastery_cache:
        mastery_cache[user_id] = db.get_all_mastery(user_id)
    
    mastery_data = mastery_cache[user_id][topic_id]
    
    # Simuler la vérification (en vrai, comparer avec la bonne réponse)
    # Pour demo, on dit que c'est correct si l'user_answer contient "correct"
    is_correct = "correct" in submission.user_answer.lower() or "oui" in submission.user_answer.lower()
    
    # ✨ Mettre à jour les stats de la question pour auto-calibration
    db.update_question_stats(
        question_id=current_q.get("id", submission.question_id),
        is_correct=is_correct,
        response_time=submission.time_taken,
        perceived_difficulty=submission.perceived_difficulty
    )
    
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
    mastery_data["last_practiced"] = datetime.now()
    
    if is_correct:
        mastery_data["correct_attempts"] += 1
        session["correct_answers"] += 1
    
    mastery_data["success_rate"] = (
        mastery_data["correct_attempts"] / mastery_data["total_attempts"]
    )
    
    # ✨ NOUVEAU: Mettre à jour success_rate par difficulté
    current_difficulty = current_q["difficulty"]
    if "success_by_difficulty" not in mastery_data:
        mastery_data["success_by_difficulty"] = {"easy": 0.0, "medium": 0.0, "hard": 0.0}
    if "attempts_by_difficulty" not in mastery_data:
        mastery_data["attempts_by_difficulty"] = {"easy": 0, "medium": 0, "hard": 0}
    
    attempts_diff = mastery_data["attempts_by_difficulty"]
    success_diff = mastery_data["success_by_difficulty"]
    
    # Incrémenter les tentatives pour cette difficulté
    attempts_diff[current_difficulty] = attempts_diff.get(current_difficulty, 0) + 1
    
    # Recalculer le success_rate pour cette difficulté
    if is_correct:
        # Ajouter un succès
        old_correct = success_diff[current_difficulty] * (attempts_diff[current_difficulty] - 1)
        new_correct = old_correct + 1
        success_diff[current_difficulty] = new_correct / attempts_diff[current_difficulty]
    else:
        # Pas de succès, recalculer
        if attempts_diff[current_difficulty] > 1:
            old_correct = success_diff[current_difficulty] * (attempts_diff[current_difficulty] - 1)
            success_diff[current_difficulty] = old_correct / attempts_diff[current_difficulty]
        else:
            success_diff[current_difficulty] = 0.0
    
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
    mastery_data["next_review"] = next_review
    
    # Sauvegarder mastery mise à jour en DB
    db.save_mastery(user_id, topic_id, mastery_data)
    
    # Mettre à jour le streak de révision
    streak_info = db.update_streak(user_id, session["course_id"])
    
    # Générer encouragement avec ChatGPT
    try:
        encouragement = await openai_service.generate_encouragement(
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
    
    # Prédire le prochain topic (pour interleaving)
    next_topic_id = None
    if session["interleaving_enabled"] and len(session["topic_ids"]) > 1:
        next_topic_id = get_next_topic_in_sequence(
            session_history=session["question_history"],
            available_topics=[
                {"topic_id": tid, "mastery_level": mastery_cache[user_id].get(tid, {}).get("mastery_level", 0)}
                for tid in session["topic_ids"]
            ],
            switch_frequency=session["switch_frequency"]
        )
    
    # Nettoyer la question actuelle et sauvegarder session
    del session["current_question"]
    db.save_session(session)
    
    return AdaptiveFeedback(
        is_correct=is_correct,
        explanation=f"Ta maîtrise du topic '{topic_id}' est maintenant à {new_mastery}%",
        encouragement=encouragement,
        next_action=next_action,
        difficulty_adjustment=difficulty_adjustment,
        xp_earned=xp_earned,
        mastery_change=mastery_change,
        streak_info={
            "current_streak": streak_info["current_streak"],
            "longest_streak": streak_info["longest_streak"],
            "total_reviews": streak_info["total_reviews"],
            "message": f"🔥 {streak_info['current_streak']} jours de révision d'affilée !" if streak_info["current_streak"] > 0 else None
        },
        current_topic_id=topic_id,
        next_topic_id=next_topic_id,
        interleaving_benefit=session.get("estimated_benefit", 0.0)
    )


@router.get("/progress/{session_id}")
async def get_progress(session_id: str):
    """
    Récupère la progression de la session avec détails interleaving
    """
    # Charger session depuis cache ou DB
    if session_id not in sessions_cache:
        session = db.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session non trouvée")
        sessions_cache[session_id] = session
    else:
        session = sessions_cache[session_id]
    
    user_id = session["user_id"]
    
    # Charger mastery depuis cache ou DB
    if user_id not in mastery_cache:
        mastery_cache[user_id] = db.get_all_mastery(user_id)
    
    # Récupérer le streak
    streak_info = db.get_streak(user_id, session["course_id"])
    
    # Calculer les stats globales de la session
    accuracy = (
        session["correct_answers"] / session["questions_answered"]
        if session["questions_answered"] > 0 else 0
    )
    
    # Stats par topic (pour interleaving)
    topics_progress = []
    total_mastery = 0
    for topic_id in session["topic_ids"]:
        mastery_data = mastery_cache.get(user_id, {}).get(topic_id, {})
        mastery_level = mastery_data.get("mastery_level", 0)
        total_mastery += mastery_level
        
        # Compter les questions de ce topic dans cette session
        topic_questions = session["question_history"].count(topic_id)
        
        topics_progress.append({
            "topic_id": topic_id,
            "mastery_level": mastery_level,
            "success_rate": round(mastery_data.get("success_rate", 0) * 100, 1),
            "questions_in_session": topic_questions,
            "next_review_in_days": mastery_data.get("interval", 1)
        })
    
    # Calculer le mastery_level global (moyenne des topics)
    avg_mastery = total_mastery / len(session["topic_ids"]) if session["topic_ids"] else 0
    
    return {
        "session_id": session_id,
        "questions_answered": session["questions_answered"],
        "correct_answers": session["correct_answers"],
        "accuracy": round(accuracy * 100, 1),
        "xp_earned": session["xp_earned"],
        "mastery_level": round(avg_mastery),  # Ajout du champ mastery_level
        "next_review_in_days": topics_progress[0]["next_review_in_days"] if topics_progress else 1,
        "current_streak": streak_info["current_streak"],
        "longest_streak": streak_info["longest_streak"],
        "total_reviews": streak_info["total_reviews"],
        "interleaving_enabled": session["interleaving_enabled"],
        "estimated_retention_boost": session.get("estimated_benefit", 0.0),
        "topics": topics_progress
    }


@router.get("/demo-stats")
async def get_demo_stats():
    """
    Endpoint de démo pour voir toutes les sessions et mastery
    """
    all_sessions = db.get_all_sessions()
    
    # Construire un dict user_id -> mastery pour affichage
    user_mastery_display = {}
    for user_id in mastery_cache.keys():
        user_mastery_display[user_id] = {
            topic_id: {
                "mastery_level": data["mastery_level"],
                "success_rate": round(data["success_rate"] * 100, 1)
            }
            for topic_id, data in mastery_cache[user_id].items()
        }
    
    return {
        "total_sessions": len(all_sessions),
        "sessions": all_sessions,
        "user_mastery": user_mastery_display
    }


@router.get("/streak/{user_id}")
async def get_user_streak(user_id: str, course_id: Optional[str] = None):
    """
    Récupère le streak de révision d'un utilisateur
    """
    streak_info = db.get_streak(user_id, course_id)
    return {
        "user_id": user_id,
        "course_id": course_id,
        "current_streak": streak_info["current_streak"],
        "longest_streak": streak_info["longest_streak"],
        "total_reviews": streak_info["total_reviews"]
    }


@router.get("/question-stats/{question_id}")
async def get_question_statistics(question_id: str):
    """
    ✨ NOUVEAU: Récupère les statistiques d'une question pour voir si elle est bien calibrée
    """
    stats = db.get_question_stats(question_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Question non trouvée")
    
    return stats


@router.get("/miscalibrated-questions")
async def get_miscalibrated_questions(topic_id: Optional[str] = None):
    """
    ✨ NOUVEAU: Liste les questions mal calibrées (actual_difficulty != target_difficulty)
    Utile pour améliorer le prompt GPT ou régénérer ces questions
    """
    questions = db.get_miscalibrated_questions(topic_id)
    
    return {
        "total_miscalibrated": len(questions),
        "questions": questions,
        "message": f"Trouvé {len(questions)} question(s) mal calibrée(s). Considérez les régénérer ou ajuster le prompt GPT."
    }


@router.get("/difficulty-stats/{user_id}/{topic_id}")
async def get_difficulty_stats(user_id: str, topic_id: str):
    """
    ✨ NOUVEAU: Affiche les statistiques de réussite par difficulté pour un topic
    """
    # Charger mastery depuis cache ou DB
    if user_id not in mastery_cache:
        mastery_cache[user_id] = db.get_all_mastery(user_id)
    
    if topic_id not in mastery_cache[user_id]:
        raise HTTPException(status_code=404, detail="Topic non trouvé pour cet utilisateur")
    
    mastery_data = mastery_cache[user_id][topic_id]
    
    return {
        "user_id": user_id,
        "topic_id": topic_id,
        "mastery_level": mastery_data["mastery_level"],
        "overall_success_rate": round(mastery_data["success_rate"] * 100, 1),
        "success_by_difficulty": {
            "easy": {
                "success_rate": round(mastery_data.get("success_by_difficulty", {}).get("easy", 0) * 100, 1),
                "attempts": mastery_data.get("attempts_by_difficulty", {}).get("easy", 0)
            },
            "medium": {
                "success_rate": round(mastery_data.get("success_by_difficulty", {}).get("medium", 0) * 100, 1),
                "attempts": mastery_data.get("attempts_by_difficulty", {}).get("medium", 0)
            },
            "hard": {
                "success_rate": round(mastery_data.get("success_by_difficulty", {}).get("hard", 0) * 100, 1),
                "attempts": mastery_data.get("attempts_by_difficulty", {}).get("hard", 0)
            }
        },
        "recommendation": _get_difficulty_recommendation(mastery_data)
    }


def _get_difficulty_recommendation(mastery_data: Dict[str, Any]) -> str:
    """Génère une recommandation basée sur les success rates par difficulté"""
    success_diff = mastery_data.get("success_by_difficulty", {})
    attempts_diff = mastery_data.get("attempts_by_difficulty", {})
    
    easy_sr = success_diff.get("easy", 0)
    medium_sr = success_diff.get("medium", 0)
    hard_sr = success_diff.get("hard", 0)
    
    # Au moins 3 tentatives pour recommander
    if attempts_diff.get("easy", 0) >= 3 and easy_sr > 0.85:
        return "✅ Prêt pour passer à MEDIUM (maîtrise easy > 85%)"
    
    if attempts_diff.get("medium", 0) >= 3 and medium_sr < 0.5:
        return "⚠️ Retour à EASY recommandé (difficulté medium < 50%)"
    
    if attempts_diff.get("medium", 0) >= 3 and medium_sr > 0.85:
        return "✅ Prêt pour passer à HARD (maîtrise medium > 85%)"
    
    if attempts_diff.get("hard", 0) >= 3 and hard_sr < 0.4:
        return "⚠️ Retour à MEDIUM recommandé (difficulté hard < 40%)"
    
    return "ℹ️ Continue à pratiquer pour collecter plus de données"

