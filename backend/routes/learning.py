"""
Routes API pour l'apprentissage adaptatif
"""
from fastapi import APIRouter, HTTPException, Header, Query
from typing import Dict, Any, Optional, List
import logging
from services.ai_dispatcher import ai_dispatcher, TaskType
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
# 🧠 Import du moteur d'apprentissage avancé (FSRS, Cognitive Load, Transfer Learning, etc.)
from services.advanced_learning_engine import learning_engine

from models.learning import (
    SessionStartRequest,
    AnswerSubmission,
    AdaptiveFeedback,
    GenerationSubmission,
    GenerationEffectResult
)
import uuid
from datetime import datetime

router = APIRouter()

# 🔧 FIX: Constante pour les difficultés valides (évite les typos)
VALID_DIFFICULTIES = {"easy", "medium", "hard"}


def validate_difficulty(difficulty: str) -> str:
    """Valide et normalise la difficulté. Retourne 'medium' par défaut si invalide."""
    if difficulty and difficulty.lower() in VALID_DIFFICULTIES:
        return difficulty.lower()
    logger.warning(f"⚠️ Invalid difficulty '{difficulty}', defaulting to 'medium'")
    return "medium"

# ══════════════════════════════════════════════════════════════════════════════
# HELPER: Récupération du user_id
# ══════════════════════════════════════════════════════════════════════════════

def get_user_id(x_user_id: Optional[str] = None) -> str:
    """
    Récupère le user_id depuis le header X-User-Id.
    Pour l'instant, utilise "default-user" si non fourni (transition douce).
    À terme, devrait lever une erreur si non authentifié.
    """
    if x_user_id:
        return x_user_id
    # Fallback temporaire pour la transition
    return "default-user"


@router.post("/start-session")
async def start_session(
    request: SessionStartRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Démarre une session d'apprentissage

    Headers:
        X-User-Id: Identifiant de l'utilisateur

    Returns:
        Session ID et informations
    """
    user_id = get_user_id(x_user_id)
    session_id = str(uuid.uuid4())
    topic_id = request.topic_id or "default-topic"

    # Persister la session en DB
    session = db.create_session(
        session_id=session_id,
        user_id=user_id,
        course_id=request.course_id,
        topic_id=topic_id,
        topic_name=topic_id
    )

    logger.info(f"📚 Session démarrée: {session_id} pour user={user_id}")

    return {
        "session_id": session_id,
        "user_id": user_id,
        "message": "Session d'apprentissage démarrée !",
        "ready_for_question": True
    }


@router.get("/next-question/{session_id}")
async def get_next_question(session_id: str):
    """
    Génère la prochaine question adaptée

    Utilise:
    - 🧠 FSRS (Free Spaced Repetition Scheduler) - remplace SM-2++
    - 🧠 Cognitive Load Detection - détecte la fatigue
    - 🧠 Transfer Learning - bonus entre topics liés
    - 🧠 Forgetting Curve - timing personnalisé
    - GPT pour générer la question
    """
    # Récupérer la session depuis la DB
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session non trouvée")

    topic_id = session["topic_id"]
    user_id = session["user_id"]

    # Récupérer ou créer la maîtrise du topic (persisté en DB)
    mastery_data = db.get_or_create_mastery(user_id, topic_id)

    # 🧠 NOUVEAU: Utiliser le moteur d'apprentissage avancé
    question_params = learning_engine.get_next_question_params(
        user_id=user_id,
        topic_id=topic_id,
        current_mastery=mastery_data["mastery_level"],
        session_data=session
    )

    # 🧠 Vérifier si l'utilisateur devrait faire une pause (cognitive load)
    if question_params.should_take_break:
        logger.info(f"⚠️ Cognitive load elevated for {user_id}: {question_params.cognitive_load}")
        # On continue mais on note la recommandation

    # Utiliser la difficulté calculée par le moteur avancé
    difficulty = question_params.difficulty

    # Log des paramètres avancés
    logger.info(f"🧠 Advanced params: difficulty={difficulty}, "
                f"transfer_bonus={question_params.transfer_bonus:.0%}, "
                f"cognitive_load={question_params.cognitive_load}, "
                f"retrievability={question_params.retrievability:.0%}")

    # Générer la question avec le dispatcher intelligent
    try:
        question = await ai_dispatcher.generate_question(
            topic_name=session.get("topic_name", topic_id),
            difficulty=difficulty,
            mastery_level=mastery_data["mastery_level"],
            learning_style=None,
            weak_areas=[],
            context=None
        )

        # Stocker la question dans la session (persisté en DB)
        current_question = {
            "id": question.id,
            "difficulty": difficulty,
            "started_at": datetime.now().isoformat(),
            "correct_answer": question.correct_answer,  # Stocké pour vérification
            "explanation": question.explanation
        }
        db.update_session(session_id, {"current_question_data": current_question})

        # SÉCURITÉ: Ne PAS renvoyer correct_answer et explanation au client
        response = {
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
            # 🧠 NOUVEAU: Infos algorithmes avancés
            "advanced": {
                "cognitive_load": question_params.cognitive_load,
                "should_take_break": question_params.should_take_break,
                "break_suggestion": question_params.break_suggestion,
                "transfer_bonus": round(question_params.transfer_bonus * 100, 1),
                "retrievability": round(question_params.retrievability * 100, 1),
                "fsrs_interval": round(question_params.fsrs_interval, 1)
            }
        }

        # Si pause recommandée, l'inclure en priorité
        if question_params.should_take_break:
            response["warning"] = {
                "type": "cognitive_load",
                "message": question_params.break_suggestion or "Tu sembles fatigué. Une pause serait bénéfique.",
                "severity": question_params.cognitive_load
            }

        return response

    except Exception as e:
        logger.error(f"❌ Erreur génération question: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la génération de la question: {str(e)}"
        )


@router.post("/submit-answer/{session_id}")
async def submit_answer(session_id: str, submission: AnswerSubmission):
    """
    Soumet une réponse et reçoit un feedback adaptatif

    Utilise:
    - 🧠 FSRS pour calculer la nouvelle maîtrise (remplace SM-2++)
    - 🧠 Cognitive Load Detection pour détecter la fatigue
    - 🧠 Transfer Learning pour les bonus cross-topics
    - GPT pour générer l'encouragement
    """
    # Récupérer la session depuis la DB
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session non trouvée")

    current_q = session.get("current_question_data")
    if not current_q:
        raise HTTPException(status_code=400, detail="Pas de question active")

    # 🔧 FIX: Valider et normaliser la difficulté stockée
    current_q["difficulty"] = validate_difficulty(current_q.get("difficulty", "medium"))

    topic_id = session["topic_id"]
    user_id = session["user_id"]

    # Récupérer la maîtrise depuis la DB
    mastery_data = db.get_or_create_mastery(user_id, topic_id)

    # Vérifier la réponse avec la bonne réponse stockée côté serveur
    correct_answer = current_q.get("correct_answer", "")
    is_correct = submission.user_answer.strip().lower() == correct_answer.strip().lower()

    # 🚨 ANOMALY DETECTION: Détecter comportements suspects
    # 🔧 FIX: Prend en compte le niveau de maîtrise pour éviter faux positifs sur experts
    anomaly_flags = []
    anomaly_penalty = 0
    current_mastery = mastery_data["mastery_level"]

    # 1. Temps impossiblement court pour une question "hard" correcte
    # 🔧 FIX: Seuils adaptatifs selon la maîtrise (experts peuvent répondre plus vite)
    min_time_hard = 2 if current_mastery >= 90 else (3 if current_mastery >= 70 else 5)
    if is_correct and current_q["difficulty"] == "hard" and submission.time_taken < min_time_hard:
        # Vérifier si c'est vraiment suspect (pas juste un expert)
        if current_mastery < 80 or submission.time_taken < 1:
            anomaly_flags.append("impossible_speed")
            anomaly_penalty = 0.5  # Réduire les gains de 50%
            logger.warning(f"⚠️ ANOMALY: User {user_id} answered hard question in {submission.time_taken}s (mastery={current_mastery}%)")

    # 2. Réponse instantanée (< 1s) = probablement bot ou triche
    # 🔧 FIX: Même les experts ne peuvent pas lire et répondre en < 0.5s
    if submission.time_taken < 0.5:
        anomaly_flags.append("instant_response")
        anomaly_penalty = max(anomaly_penalty, 0.8)  # Réduire les gains de 80%
        logger.warning(f"⚠️ ANOMALY: User {user_id} instant response ({submission.time_taken}s)")
    elif submission.time_taken < 1 and current_mastery < 70:
        # Non-experts qui répondent en < 1s = suspect
        anomaly_flags.append("instant_response")
        anomaly_penalty = max(anomaly_penalty, 0.5)
        logger.warning(f"⚠️ ANOMALY: User {user_id} very fast response ({submission.time_taken}s) with low mastery")

    # 3. Perfect streak trop long (> 20 consecutives sur hard)
    # 🔧 FIX: Seuil plus élevé pour les experts (ils PEUVENT avoir de longues streaks)
    current_streak = session.get("streak", 0)
    streak_threshold = 30 if current_mastery >= 85 else 20
    if is_correct and current_streak >= streak_threshold and current_q["difficulty"] == "hard":
        anomaly_flags.append("suspicious_streak")
        logger.info(f"📊 INFO: User {user_id} has {current_streak}+ streak on hard (mastery={current_mastery}%) - monitoring")

    # 4. Success rate 100% après 10+ tentatives (statistiquement improbable)
    # 🔧 FIX: Plus tolérant pour les hauts niveaux de maîtrise
    min_attempts_for_check = 15 if current_mastery >= 80 else 10
    if mastery_data["total_attempts"] >= min_attempts_for_check:
        current_sr = mastery_data["correct_attempts"] / max(1, mastery_data["total_attempts"])
        # 100% après beaucoup de tentatives est suspect sauf si expert confirmé
        if current_sr == 1.0 and is_correct and current_mastery < 95:
            anomaly_flags.append("perfect_record")
            logger.info(f"📊 INFO: User {user_id} has 100% success rate after {mastery_data['total_attempts']} attempts (mastery={current_mastery}%)")

    # 🧠 NOUVEAU: Traiter la réponse avec le moteur avancé (FSRS, Cognitive Load, Transfer)
    advanced_result = learning_engine.process_answer(
        user_id=user_id,
        topic_id=topic_id,
        is_correct=is_correct,
        response_time=submission.time_taken,
        difficulty=current_q["difficulty"],
        current_mastery=mastery_data["mastery_level"]
    )

    # Utiliser le mastery_change du moteur avancé (FSRS-based)
    mastery_change = advanced_result.mastery_change

    # 🚨 Appliquer pénalité d'anomalie si détectée
    if anomaly_penalty > 0 and mastery_change > 0:
        original_change = mastery_change
        mastery_change = int(mastery_change * (1 - anomaly_penalty))
        logger.info(f"🚨 Anomaly penalty applied: {original_change} → {mastery_change} (flags: {anomaly_flags})")

    # Log des résultats avancés
    logger.info(f"🧠 Advanced result: mastery_change={mastery_change}, "
                f"cognitive={advanced_result.cognitive_assessment['level']}, "
                f"transfer_applied={advanced_result.transfer_applied}, "
                f"next_review={advanced_result.next_review_days:.1f}d")

    # Mettre à jour la maîtrise
    new_mastery = max(0, min(100, mastery_data["mastery_level"] + mastery_change))
    new_total_attempts = mastery_data["total_attempts"] + 1
    new_correct_attempts = mastery_data["correct_attempts"] + (1 if is_correct else 0)
    # 🔧 FIX: Protection division par zéro (ne devrait jamais arriver mais sécurité)
    new_success_rate = new_correct_attempts / max(1, new_total_attempts)

    # Calculer la qualité SM-2 (0-5) basée sur plusieurs facteurs
    # 0 = blackout total, 1 = incorrect mais familier, 2 = incorrect facile
    # 3 = correct difficile, 4 = correct avec hésitation, 5 = parfait
    if is_correct:
        # Facteurs: temps de réponse et difficulté
        time_ratio = submission.time_taken / 60  # 60s = temps attendu
        if time_ratio < 0.5:  # Très rapide (< 30s)
            quality = 5  # Parfait
        elif time_ratio < 1.0:  # Dans le temps
            quality = 4  # Correct avec aisance
        else:  # Lent (> 60s)
            quality = 3  # Correct mais difficile
    else:
        # Incorrect: distinguer blackout vs erreur proche
        if submission.time_taken < 10:  # Réponse très rapide = devine
            quality = 0  # Blackout total
        elif submission.time_taken < 30:  # Rapide = erreur d'inattention
            quality = 2  # Incorrect mais semblait facile
        else:  # Lent = vraie difficulté
            quality = 1  # Incorrect après réflexion

    new_ease, new_interval, next_review = calculate_next_review(
        quality=quality,
        ease_factor=mastery_data["ease_factor"],
        interval=mastery_data["interval"],
        repetitions=mastery_data["repetitions"],
        skip_days=0,
        consecutive_skips=mastery_data["consecutive_skips"]
    )

    # Persister les changements de maîtrise en DB
    db.update_mastery_data(user_id, topic_id, {
        "mastery_level": new_mastery,
        "total_attempts": new_total_attempts,
        "correct_attempts": new_correct_attempts,
        "success_rate": new_success_rate,
        "ease_factor": new_ease,
        "interval": new_interval,
        "repetitions": mastery_data["repetitions"] + (1 if is_correct else 0),
        "last_reviewed": datetime.now().isoformat(),
        "next_review": next_review.isoformat() if next_review else None
    })

    # Mettre à jour success_by_difficulty pour l'algorithme adaptatif
    question_difficulty = current_q.get("difficulty", "medium")
    db.update_success_by_difficulty(user_id, topic_id, question_difficulty, is_correct)

    # 🆕 Enregistrer la performance pour le chronotype detection
    db.record_session_performance(
        user_id=user_id,
        is_correct=is_correct,
        response_time=submission.time_taken,
        mastery_change=mastery_change
    )

    # Mise à jour des concepts liés au topic (si réponse correcte)
    if is_correct:
        try:
            course_id = session.get("course_id")
            if course_id:
                topic_name = session.get("topic_name", topic_id)
                concepts = db.get_concepts(course_id)

                matching_concepts = [
                    c for c in concepts
                    if topic_name.lower() in c['concept'].lower()
                    or any(keyword in topic_name.lower() for keyword in c.get('keywords', []))
                ]

                for concept in matching_concepts:
                    # Boost basé sur la difficulté (easy/medium/hard)
                    if current_q["difficulty"] == "hard":
                        concept_mastery_boost = 15
                    elif current_q["difficulty"] == "medium":
                        concept_mastery_boost = 12
                    else:  # easy
                        concept_mastery_boost = 8

                    new_concept_mastery = min(100, concept['mastery_level'] + concept_mastery_boost)
                    db.update_mastery(concept['id'], new_concept_mastery)
                    logger.info(f"✅ Quiz success → Concept '{concept['concept']}' "
                              f"mastery: {concept['mastery_level']}% → {new_concept_mastery}%")
        except Exception as e:
            logger.warning(f"⚠️ Could not update concept mastery: {e}")

    # 🔄 Mise à jour atomique du streak (évite race condition)
    # Le streak est calculé directement en SQL, pas en Python
    db.update_session_atomic(session_id, {
        "questions_answered_delta": 1,
        "correct_answers_delta": 1 if is_correct else 0,
        "streak_increment": is_correct,  # True = +1, False = reset à 0
        "current_question_data": None  # Nettoyer la question
    })

    # Relire la session pour avoir le streak à jour (après update atomique)
    updated_session = db.get_session(session_id)
    streak = updated_session.get("streak", 0) if updated_session else 0

    # Calculer XP avec le streak mis à jour
    xp_earned = calculate_xp_reward(
        is_correct=is_correct,
        difficulty=current_q["difficulty"],
        streak=streak,
        is_first_of_day=session["questions_answered"] == 0
    )

    # Ajouter l'XP (opération séparée pour utiliser le bon streak)
    db.update_session_atomic(session_id, {
        "xp_earned_delta": xp_earned
    })

    # Générer encouragement avec le dispatcher
    try:
        encouragement = await ai_dispatcher.generate_encouragement(
            is_correct=is_correct,
            streak=streak,
            mastery_change=mastery_change
        )
    except:
        encouragement = "Bien joué ! Continue comme ça !" if is_correct else "Pas grave, on apprend de nos erreurs !"

    # Déterminer la prochaine action
    next_action = "continue"
    difficulty_adjustment = None
    plateau_warning = None
    interleaving_suggestion = None

    # 📈 Ajustement de difficulté classique
    if new_success_rate > 0.8 and new_total_attempts >= 3:
        difficulty_adjustment = "harder"
    elif new_success_rate < 0.4 and new_total_attempts >= 3:
        difficulty_adjustment = "easier"

    # 🔄 PLATEAU DETECTION: Success rate entre 0.4-0.8 pendant longtemps
    # 🔧 FIX: Seuil augmenté de 10 à 20 tentatives pour éviter faux positifs
    # + Vérification de la stagnation réelle (pas juste zone moyenne)
    if new_total_attempts >= 20:
        # Calculer si l'utilisateur stagne vraiment
        # Un plateau = success rate stable dans la zone moyenne SANS progression de mastery
        is_in_plateau_zone = 0.4 <= new_success_rate <= 0.75
        mastery_not_progressing = new_mastery < 70  # Devrait être plus haut après 20+ tentatives

        if is_in_plateau_zone and mastery_not_progressing:
            # L'utilisateur stagne vraiment dans la zone "moyenne"
            plateau_warning = {
                "detected": True,
                "message": "Tu sembles stagner sur ce topic. Essaie de varier les sujets !",
                "attempts_in_plateau": new_total_attempts,
                "current_success_rate": round(new_success_rate * 100, 1)
            }
            next_action = "suggest_break"

        # Recommander l'interleaving si plateau détecté
        if plateau_warning:
            interleaving_suggestion = {
                "recommended": True,
                "reason": "L'interleaving (alterner entre sujets) améliore la rétention de 15-20%",
                "suggestion": "Essaie un autre topic pendant 10-15 minutes, puis reviens ici"
            }

    # 🎯 Détection de maîtrise complète - recommander nouveau topic
    if new_mastery >= 95 and new_success_rate >= 0.9:
        next_action = "topic_mastered"
        interleaving_suggestion = {
            "recommended": True,
            "reason": "Tu maîtrises ce topic ! Passe à un nouveau défi.",
            "suggestion": "Explore un topic connexe pour renforcer tes connaissances"
        }

    # 🧠 Construire les métriques avancées
    advanced_metrics = {
        "fsrs": {
            "stability": advanced_result.new_fsrs_card["stability"],
            "difficulty": advanced_result.new_fsrs_card["difficulty"],
            "next_review_days": advanced_result.next_review_days,
            "reps": advanced_result.new_fsrs_card["reps"]
        },
        "cognitive_load": {
            "level": advanced_result.cognitive_assessment["level"],
            "score": advanced_result.cognitive_assessment["score"],
            "should_break": advanced_result.should_take_break,
            "recommendation": advanced_result.break_reason
        },
        "transfer_learning": {
            "applied": advanced_result.transfer_applied,
            "bonus_applied": advanced_result.transfer_applied
        },
        "learning_efficiency": round(advanced_result.learning_efficiency * 100, 1)
    }

    # Ajuster next_action si cognitive load suggère une pause
    if advanced_result.should_take_break and next_action == "continue":
        next_action = "suggest_break"
        if not interleaving_suggestion:
            interleaving_suggestion = {
                "recommended": True,
                "reason": advanced_result.break_reason or "Charge cognitive élevée détectée",
                "suggestion": "Prends une pause de 5-10 minutes ou change de topic"
            }

    return AdaptiveFeedback(
        is_correct=is_correct,
        explanation=current_q.get("explanation", f"Ta maîtrise du topic est maintenant à {new_mastery}%"),
        encouragement=encouragement,
        next_action=next_action,
        difficulty_adjustment=difficulty_adjustment,
        xp_earned=xp_earned,
        mastery_change=mastery_change,
        streak_info={
            "current_streak": streak,
            "message": f"{streak} bonnes réponses d'affilée !" if streak > 0 else None
        },
        plateau_warning=plateau_warning,
        interleaving_suggestion=interleaving_suggestion,
        anomaly_flags=anomaly_flags if anomaly_flags else None,
        advanced_metrics=advanced_metrics  # 🧠 Nouvelles métriques avancées
    )


@router.get("/progress/{session_id}")
async def get_progress(session_id: str):
    """
    Récupère la progression de la session
    """
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session non trouvée")

    user_id = session["user_id"]
    topic_id = session["topic_id"]

    # Récupérer mastery depuis la DB
    mastery_data = db.get_or_create_mastery(user_id, topic_id)

    accuracy = (
        session["correct_answers"] / session["questions_answered"]
        if session["questions_answered"] > 0 else 0
    )

    return {
        "session_id": session_id,
        "user_id": user_id,
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
async def get_demo_stats(
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Endpoint pour voir les sessions et mastery d'un utilisateur
    """
    user_id = get_user_id(x_user_id)

    # Récupérer depuis la DB
    user_sessions = db.get_user_sessions(user_id, limit=50)
    user_mastery_list = db.get_user_all_mastery(user_id)

    return {
        "user_id": user_id,
        "total_sessions": len(user_sessions),
        "sessions": [
            {
                "id": s["id"],
                "topic_name": s.get("topic_name"),
                "questions_answered": s["questions_answered"],
                "correct_answers": s["correct_answers"],
                "xp_earned": s["xp_earned"],
                "status": s["status"],
                "started_at": s["started_at"]
            }
            for s in user_sessions
        ],
        "mastery": {
            m["topic_id"]: {
                "mastery_level": m["mastery_level"],
                "success_rate": round(m["success_rate"] * 100, 1),
                "total_attempts": m["total_attempts"],
                "next_review": m.get("next_review")
            }
            for m in user_mastery_list
        }
    }


# ═══════════════════════════════════════════════════════════════════════════
# ACTIVE RECALL - Apprentissage par récupération active
# Principe: Le cerveau encode ce qui lui coûte (difficulté désirable)
# ═══════════════════════════════════════════════════════════════════════════

from pydantic import BaseModel
from typing import List, Optional


class ActiveRecallSubmission(BaseModel):
    """Soumission d'une réponse libre pour évaluation"""
    session_id: str
    question_id: str
    user_answer: str
    hints_used: int = 0
    retry_count: int = 0
    thinking_time: int = 0      # Temps de réflexion en secondes
    writing_time: int = 0       # Temps d'écriture en secondes
    previous_answers: List[str] = []


@router.get("/active-recall/question/{session_id}")
async def get_active_recall_question(
    session_id: str,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Génère une question ouverte pour récupération active.
    Pas de QCM - l'apprenant doit formuler sa réponse.
    """
    user_id = get_user_id(x_user_id)

    # Récupérer ou créer la session depuis la DB
    session = db.get_session(session_id)
    if not session:
        # Créer une session à la volée
        session = db.create_session(
            session_id=session_id,
            user_id=user_id,
            course_id="demo-course",
            topic_id="demo-topic",
            topic_name="Concepts Fondamentaux"
        )

    topic_id = session["topic_id"]
    session_user_id = session["user_id"]

    # Récupérer ou créer la maîtrise depuis la DB
    mastery_data = db.get_or_create_mastery(session_user_id, topic_id)

    # Récupérer les success rates par difficulté pour une meilleure adaptation
    success_rates = db.get_success_rates_by_difficulty(session_user_id, topic_id)

    # 🔧 FIX: Calculer skip_days depuis last_reviewed (comme dans get_next_question)
    skip_days = 0
    if mastery_data.get("last_reviewed"):
        try:
            last_review_str = mastery_data["last_reviewed"]
            if isinstance(last_review_str, str):
                last_review = datetime.fromisoformat(last_review_str.replace('Z', '+00:00'))
                if last_review.tzinfo:
                    last_review = last_review.replace(tzinfo=None)
                skip_days = max(0, (datetime.now() - last_review).days)
        except (ValueError, TypeError):
            pass

    difficulty = determine_difficulty(
        mastery_data["mastery_level"],
        mastery_data["success_rate"],
        skip_days=skip_days,
        success_by_difficulty=success_rates
    )

    # Générer une question ouverte via l'IA
    try:
        result = ai_dispatcher.dispatch(
            task_type=TaskType.QUIZ,
            prompt=f"""Génère une question OUVERTE (pas de QCM) sur le topic: {session.get('topic_name', topic_id)}

NIVEAU: {difficulty}
MAÎTRISE ACTUELLE: {mastery_data['mastery_level']}%

La question doit:
1. Demander une EXPLICATION (pas juste une définition)
2. Forcer l'apprenant à PRODUIRE du contenu
3. Avoir plusieurs points clés attendus dans la réponse

FORMAT JSON:
{{
    "question": "La question ouverte",
    "hints": [
        "Premier indice (général)",
        "Deuxième indice (plus précis)",
        "Troisième indice (quasi-réponse)"
    ],
    "key_points": [
        "Point clé 1 attendu dans la réponse",
        "Point clé 2 attendu",
        "Point clé 3 attendu"
    ],
    "example_good_answer": "Une réponse complète idéale"
}}""",
            system_prompt="Tu es un tuteur qui crée des questions pour la récupération active. Réponds UNIQUEMENT en JSON valide.",
            difficulty=difficulty,
            temperature=0.4
        )

        # Parser la réponse
        import json
        content = result.content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]

        question_data_parsed = json.loads(content.strip())

        question_id = f"ar-{uuid.uuid4().hex[:8]}"

        # Stocker dans la session (persisté en DB)
        current_active_recall = {
            "id": question_id,
            "question": question_data_parsed["question"],
            "hints": question_data_parsed.get("hints", []),
            "key_points": question_data_parsed.get("key_points", []),
            "example_answer": question_data_parsed.get("example_good_answer", ""),
            "difficulty": difficulty,
            "started_at": datetime.now().isoformat()
        }
        db.update_session(session_id, {"current_question_data": current_active_recall})

        return {
            "id": question_id,
            "question": question_data_parsed["question"],
            "topic": session.get("topic_name", topic_id),
            "difficulty": difficulty,
            "hints": question_data_parsed.get("hints", []),
            "keyPoints": question_data_parsed.get("key_points", []),
            "masteryLevel": mastery_data["mastery_level"]
        }

    except Exception as e:
        logger.error(f"Erreur génération question active recall: {e}")
        # Question de fallback
        question_id = f"ar-fallback-{uuid.uuid4().hex[:8]}"
        fallback_question = {
            "id": question_id,
            "question": "Explique avec tes propres mots ce que tu as appris sur ce sujet.",
            "hints": [
                "Commence par les bases",
                "Donne un exemple concret",
                "Explique pourquoi c'est important"
            ],
            "key_points": ["Compréhension de base", "Exemple pratique", "Application"],
            "example_answer": "",
            "difficulty": difficulty,
            "started_at": datetime.now().isoformat()
        }
        db.update_session(session_id, {"current_question_data": fallback_question})

        return {
            "id": question_id,
            "question": "Explique avec tes propres mots ce que tu as appris sur ce sujet.",
            "topic": session.get("topic_name", topic_id),
            "difficulty": difficulty,
            "hints": ["Commence par les bases", "Donne un exemple concret", "Explique pourquoi c'est important"],
            "keyPoints": ["Compréhension de base", "Exemple pratique", "Application"],
            "masteryLevel": mastery_data["mastery_level"]
        }


@router.post("/active-recall/evaluate")
async def evaluate_active_recall(submission: ActiveRecallSubmission):
    """
    Évalue une réponse libre avec l'IA.

    L'évaluation est FORMATIVE (aide à apprendre) pas SOMMATIVE (juge).
    - Identifie ce qui est bien compris
    - Pointe ce qui manque
    - Guide vers l'amélioration
    """
    session_id = submission.session_id

    # Récupérer la session depuis la DB
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session non trouvée")

    question_data = session.get("current_question_data")
    if not question_data:
        raise HTTPException(status_code=400, detail="Pas de question active")

    topic_id = session["topic_id"]
    user_id = session["user_id"]

    # Récupérer mastery depuis la DB
    mastery_data = db.get_or_create_mastery(user_id, topic_id)

    # Calculer le malus pour indices utilisés et retries
    hint_penalty = submission.hints_used * 5   # -5% par indice
    retry_penalty = submission.retry_count * 10  # -10% par retry

    # Évaluer avec l'IA
    try:
        key_points = question_data.get('key_points', [])
        eval_prompt = f"""Évalue cette réponse d'un apprenant.

QUESTION: {question_data['question']}

RÉPONSE DE L'APPRENANT:
{submission.user_answer}

POINTS CLÉS ATTENDUS:
{chr(10).join(f"- {p}" for p in key_points)}

CONTEXTE:
- Indices utilisés: {submission.hints_used}
- Tentatives: {submission.retry_count + 1}
- Temps de réflexion: {submission.thinking_time}s
- Temps d'écriture: {submission.writing_time}s

ÉVALUE de manière FORMATIVE (pour aider, pas juger):

FORMAT JSON:
{{
    "score": 0-100,
    "correct_points": ["Ce que l'apprenant a bien compris"],
    "missing_points": ["Ce qui manque dans sa réponse"],
    "suggestion": "Une piste concrète pour améliorer (pas la réponse!)",
    "can_retry": true/false,
    "effort_quality": "L'apprenant a-t-il vraiment essayé?"
}}"""

        result = ai_dispatcher.dispatch(
            task_type=TaskType.ANALYSIS,
            prompt=eval_prompt,
            system_prompt="Tu es un tuteur bienveillant mais exigeant. Tu évalues pour AIDER à apprendre, pas pour juger. Réponds UNIQUEMENT en JSON valide.",
            temperature=0.3
        )

        # Parser l'évaluation
        import json
        content = result.content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]

        eval_data = json.loads(content.strip())

        # Appliquer les pénalités
        raw_score = eval_data.get("score", 50)
        final_score = max(0, raw_score - hint_penalty - retry_penalty)

        # Bonus si effort important (temps + pas d'indices)
        if submission.thinking_time >= 30 and submission.hints_used == 0:
            final_score = min(100, final_score + 5)  # Bonus effort

        # Calculer le changement de maîtrise
        # Plus exigeant que QCM: il faut 70%+ pour progresser
        if final_score >= 70:
            mastery_change = calculate_mastery_change(
                is_correct=True,
                difficulty=question_data["difficulty"],
                current_mastery=mastery_data["mastery_level"],
                response_time=submission.thinking_time + submission.writing_time,
                expected_time=120  # 2 minutes attendues
            )
        elif final_score >= 40:
            mastery_change = 0  # Neutre
        else:
            mastery_change = calculate_mastery_change(
                is_correct=False,
                difficulty=question_data["difficulty"],
                current_mastery=mastery_data["mastery_level"],
                response_time=submission.thinking_time + submission.writing_time,
                expected_time=120
            )

        # Mettre à jour la maîtrise en DB
        new_mastery = max(0, min(100, mastery_data["mastery_level"] + mastery_change))
        new_total_attempts = mastery_data["total_attempts"] + 1
        new_correct_attempts = mastery_data["correct_attempts"] + (1 if final_score >= 70 else 0)
        # 🔧 FIX: Protection division par zéro
        new_success_rate = new_correct_attempts / max(1, new_total_attempts)

        db.update_mastery_data(user_id, topic_id, {
            "mastery_level": new_mastery,
            "total_attempts": new_total_attempts,
            "correct_attempts": new_correct_attempts,
            "success_rate": new_success_rate,
            "last_reviewed": datetime.now().isoformat()
        })

        # Mettre à jour success_by_difficulty pour l'algorithme adaptatif
        question_difficulty = question_data.get("difficulty", "medium")
        is_correct_for_stats = final_score >= 70
        db.update_success_by_difficulty(user_id, topic_id, question_difficulty, is_correct_for_stats)

        # Permettre retry si score < 70 et pas déjà 2 retries
        can_retry = final_score < 70 and submission.retry_count < 2

        return {
            "score": final_score,
            "correctPoints": eval_data.get("correct_points", []),
            "missingPoints": eval_data.get("missing_points", []),
            "suggestion": eval_data.get("suggestion", "Continue à pratiquer!"),
            "canRetry": can_retry,
            "masteryChange": mastery_change,
            "effortQuality": eval_data.get("effort_quality", "Bon effort"),
            "penalties": {
                "hints": hint_penalty,
                "retries": retry_penalty
            }
        }

    except Exception as e:
        logger.error(f"Erreur évaluation active recall: {e}")
        # Évaluation de fallback basée sur la longueur
        word_count = len(submission.user_answer.split())
        fallback_score = min(60, word_count * 3)  # ~3 points par mot, max 60

        return {
            "score": fallback_score,
            "correctPoints": ["Tentative de réponse"] if word_count > 5 else [],
            "missingPoints": ["Réponse trop courte"] if word_count < 10 else ["Détails manquants"],
            "suggestion": "Essaie de développer davantage ta réponse.",
            "canRetry": True,
            "masteryChange": 0,
            "effortQuality": "À améliorer" if word_count < 10 else "Correct"
        }


# ═══════════════════════════════════════════════════════════════════════════════
# 🕐 CHRONOTYPE DETECTION - Optimal Learning Time APIs
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/chronotype/{user_id}")
async def get_user_chronotype(user_id: str):
    """
    Récupère le profil chronotype de l'utilisateur.

    Le chronotype est détecté automatiquement via les performances
    par heure de la journée. Plus l'utilisateur pratique, plus
    la détection est précise.

    Returns:
        {
            "chronotype": "morning" | "evening" | "neutral" | "unknown",
            "best_hours": [9, 10, 11],
            "worst_hours": [14, 15],
            "confidence": 0.75,
            "improvement_potential": 23,
            "recommendation": "🌅 Tu es 23% plus efficace 9h-11h..."
        }
    """
    try:
        result = db.calculate_chronotype(user_id)
        return result
    except Exception as e:
        logger.error(f"Error getting chronotype: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/optimal-time/{user_id}")
async def check_optimal_learning_time(user_id: str):
    """
    Vérifie si c'est un bon moment pour apprendre.

    Utilisé pour afficher des messages d'encouragement ou
    suggérer de revenir à une meilleure heure.

    Returns:
        {
            "is_optimal": True/False,
            "current_hour": 10,
            "message": "🌟 C'est ton meilleur moment!",
            "suggestion": null ou "Tu serais plus efficace vers 10h"
        }
    """
    try:
        result = db.is_optimal_learning_time(user_id)
        return result
    except Exception as e:
        logger.error(f"Error checking optimal time: {e}")
        return {
            "is_optimal": True,
            "current_hour": datetime.now().hour,
            "message": "Bon moment pour apprendre!",
            "suggestion": None
        }


# ═══════════════════════════════════════════════════════════════════════════════
# 🧠 KNOWLEDGE GRAPH - Prerequisites & Learning Path APIs
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/prerequisites/{course_id}/{concept_id}")
async def get_concept_prerequisites(
    course_id: str,
    concept_id: str,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Récupère les prérequis d'un concept.

    Returns:
        {
            "concept_id": "python-classes",
            "prerequisites": [
                {"id": "python-functions", "name": "Fonctions", "mastery": 80, "met": true},
                {"id": "python-variables", "name": "Variables", "mastery": 95, "met": true}
            ],
            "missing_prerequisites": []
        }
    """
    user_id = get_user_id(x_user_id)

    try:
        prerequisites = db.get_prerequisites(course_id, concept_id)
        missing = db.get_missing_prerequisites(user_id, course_id, concept_id)

        return {
            "concept_id": concept_id,
            "prerequisites": prerequisites,
            "missing_prerequisites": missing,
            "ready_to_learn": len(missing) == 0
        }
    except Exception as e:
        logger.error(f"Error getting prerequisites: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/learning-path/{course_id}/{target_concept_id}")
async def get_learning_path(
    course_id: str,
    target_concept_id: str,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Génère un chemin d'apprentissage optimal vers un concept cible.

    Utilise un tri topologique pour respecter les prérequis
    et suggérer l'ordre d'apprentissage idéal.

    Returns:
        {
            "target": "python-decorators",
            "path": [
                {"id": "python-basics", "name": "Bases", "mastery": 100, "needs_review": false},
                {"id": "python-functions", "name": "Fonctions", "mastery": 60, "needs_review": false},
                {"id": "python-closures", "name": "Closures", "mastery": 20, "needs_review": true},
                {"id": "python-decorators", "name": "Decorators", "mastery": 0, "needs_review": true}
            ],
            "estimated_topics": 2,
            "recommendation": "Tu dois d'abord maîtriser Closures avant Decorators"
        }
    """
    user_id = get_user_id(x_user_id)

    try:
        path = db.get_learning_path(user_id, course_id, target_concept_id)

        needs_review = [p for p in path if p.get("needs_review", False)]

        if needs_review:
            first_missing = needs_review[0]["name"] if needs_review else "les prérequis"
            recommendation = f"Tu dois d'abord maîtriser '{first_missing}' avant d'attaquer ce concept"
        else:
            recommendation = "Tu as tous les prérequis! Tu peux commencer ce concept."

        return {
            "target": target_concept_id,
            "path": path,
            "estimated_topics": len(needs_review),
            "recommendation": recommendation
        }
    except Exception as e:
        logger.error(f"Error generating learning path: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class PrerequisiteRequest(BaseModel):
    """Requête pour ajouter un prérequis"""
    course_id: str
    concept_id: str
    prerequisite_id: str
    strength: float = 1.0


@router.post("/prerequisites")
async def add_prerequisite(request: PrerequisiteRequest):
    """
    Ajoute une relation prérequis entre deux concepts.

    La force (strength) indique l'importance du prérequis:
    - 1.0 = obligatoire
    - 0.5 = recommandé
    - 0.2 = optionnel
    """
    try:
        success = db.add_prerequisite(
            request.course_id,
            request.concept_id,
            request.prerequisite_id,
            request.strength
        )

        if success:
            return {"status": "ok", "message": "Prérequis ajouté"}
        else:
            raise HTTPException(status_code=500, detail="Erreur lors de l'ajout")
    except Exception as e:
        logger.error(f"Error adding prerequisite: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# 🎨 LEARNING STYLE DETECTION APIs
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/learning-style/{user_id}")
async def get_learning_style(user_id: str):
    """
    Récupère le profil de style d'apprentissage VARK.

    VARK = Visual, Auditory, Reading, Kinesthetic

    Le style est détecté automatiquement via les performances
    sur différents formats de questions.

    Returns:
        {
            "dominant_style": "visual" | "auditory" | "reading" | "kinesthetic",
            "style_scores": {"visual": 0.4, "auditory": 0.2, "reading": 0.25, "kinesthetic": 0.15},
            "confidence": 0.65,
            "recommended_formats": ["diagram", "image", "flowchart"],
            "suggestion": "Tu apprends mieux avec des diagrammes 📊"
        }
    """
    try:
        result = db.get_recommended_format(user_id)
        return result
    except Exception as e:
        logger.error(f"Error getting learning style: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommended-format/{user_id}")
async def get_recommended_question_format(user_id: str):
    """
    Recommande le format de question optimal pour cet utilisateur.

    Utilisé par le générateur de questions pour adapter le format.
    """
    try:
        return db.get_recommended_format(user_id)
    except Exception as e:
        logger.error(f"Error getting recommended format: {e}")
        return {
            "recommended_format": "mixed",
            "formats": ["text", "code"],
            "suggestion": "Continue à pratiquer!"
        }


# ═══════════════════════════════════════════════════════════════════════════════
# 📊 ENHANCED ANALYTICS - Dashboard data
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/analytics/{user_id}")
async def get_learning_analytics(user_id: str):
    """
    Récupère toutes les données analytiques pour le dashboard.

    Combine chronotype, learning style, et progression pour
    donner une vue complète de l'apprentissage.
    """
    try:
        chronotype = db.calculate_chronotype(user_id)
        learning_style = db.get_recommended_format(user_id)
        optimal_time = db.is_optimal_learning_time(user_id)
        all_mastery = db.get_user_all_mastery(user_id)

        # Calculer les stats globales
        total_mastery = sum(m.get("mastery_level", 0) for m in all_mastery)
        avg_mastery = total_mastery / len(all_mastery) if all_mastery else 0
        total_attempts = sum(m.get("total_attempts", 0) for m in all_mastery)
        total_correct = sum(m.get("correct_attempts", 0) for m in all_mastery)

        return {
            "user_id": user_id,

            # Chronotype
            "chronotype": chronotype,
            "optimal_time": optimal_time,

            # Learning Style
            "learning_style": learning_style,

            # Progression globale
            "stats": {
                "topics_studied": len(all_mastery),
                "average_mastery": round(avg_mastery, 1),
                "total_attempts": total_attempts,
                "overall_accuracy": round(total_correct / max(1, total_attempts) * 100, 1)
            },

            # Top topics
            "top_topics": sorted(
                all_mastery,
                key=lambda x: x.get("mastery_level", 0),
                reverse=True
            )[:5],

            # Insights personnalisés
            "insights": _generate_insights(chronotype, learning_style, avg_mastery)
        }
    except Exception as e:
        logger.error(f"Error getting analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _generate_insights(chronotype: dict, style: dict, avg_mastery: float) -> List[str]:
    """Génère des insights personnalisés basés sur les données."""
    insights = []

    # Insight chronotype
    if chronotype.get("confidence", 0) > 0.5:
        best_hours = chronotype.get("best_hours", [])
        if best_hours:
            insights.append(f"🕐 Tu es plus efficace entre {min(best_hours)}h et {max(best_hours)}h")

    # Insight style
    dominant = style.get("recommended_format", "unknown")
    if dominant != "unknown" and dominant != "mixed":
        style_tips = {
            "visual": "📊 Utilise des mind maps et diagrammes pour mémoriser",
            "auditory": "🎧 Essaie d'expliquer les concepts à voix haute",
            "reading": "📚 Prends des notes structurées pendant l'apprentissage",
            "kinesthetic": "💻 Pratique avec des exercices et projets concrets"
        }
        if dominant in style_tips:
            insights.append(style_tips[dominant])

    # Insight progression
    if avg_mastery > 80:
        insights.append("🌟 Excellent niveau! Continue à challenger tes connaissances")
    elif avg_mastery > 50:
        insights.append("💪 Bonne progression! La régularité est la clé")
    elif avg_mastery > 20:
        insights.append("🌱 Tu progresses bien! Concentre-toi sur un topic à la fois")
    else:
        insights.append("🚀 C'est le début! Chaque question te rapproche de la maîtrise")

    return insights


# ═══════════════════════════════════════════════════════════════════════════════
# 🧠 GENERATION EFFECT - Force generation before seeing QCM options
# Principe: "Testing effect" + "Desirable difficulty" = +25-30% rétention
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/generation-effect/question/{session_id}")
async def get_generation_effect_question(
    session_id: str,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Génère une question en mode Generation Effect.

    PHASE 1: L'élève reçoit la question SANS les options
    Il doit d'abord générer/taper sa réponse

    PHASE 2: Après génération, il voit les options QCM et sélectionne

    Ce mode améliore la rétention de 25-30% selon la recherche cognitive.
    """
    user_id = get_user_id(x_user_id)

    # Récupérer la session
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session non trouvée")

    topic_id = session["topic_id"]
    session_user_id = session["user_id"]

    # Récupérer la maîtrise
    mastery_data = db.get_or_create_mastery(session_user_id, topic_id)
    success_rates = db.get_success_rates_by_difficulty(session_user_id, topic_id)

    # Calculer skip_days
    skip_days = 0
    if mastery_data.get("last_reviewed"):
        try:
            last_review_str = mastery_data["last_reviewed"]
            if isinstance(last_review_str, str):
                last_review = datetime.fromisoformat(last_review_str.replace('Z', '+00:00'))
                if last_review.tzinfo:
                    last_review = last_review.replace(tzinfo=None)
                skip_days = max(0, (datetime.now() - last_review).days)
        except (ValueError, TypeError):
            pass

    # Déterminer la difficulté
    difficulty = determine_difficulty(
        mastery_data["mastery_level"],
        mastery_data["success_rate"],
        skip_days=skip_days,
        success_by_difficulty=success_rates
    )

    # Vérifier si Generation Effect est recommandé
    gen_recommendation = db.should_use_generation_mode(session_user_id, topic_id)

    try:
        # Générer une question avec mots-clés pour évaluer la génération
        result = ai_dispatcher.dispatch(
            task_type=TaskType.QUIZ,
            prompt=f"""Génère une question QCM sur le topic: {session.get('topic_name', topic_id)}

NIVEAU: {difficulty}
MAÎTRISE ACTUELLE: {mastery_data['mastery_level']}%

FORMAT JSON REQUIS:
{{
    "question": "La question (claire et précise)",
    "generation_prompt": "Avant de voir les options, tape ce que tu penses être la réponse...",
    "expected_keywords": ["mot-clé1", "mot-clé2", "mot-clé3"],
    "options": [
        {{"id": "A", "text": "Option A", "is_correct": false}},
        {{"id": "B", "text": "Option B", "is_correct": true}},
        {{"id": "C", "text": "Option C", "is_correct": false}},
        {{"id": "D", "text": "Option D", "is_correct": false}}
    ],
    "correct_answer": "B",
    "explanation": "Explication détaillée de la bonne réponse"
}}

IMPORTANT:
- Les expected_keywords sont des mots que l'élève devrait mentionner dans sa génération libre
- La question doit avoir UNE SEULE bonne réponse
- L'explication doit être pédagogique""",
            system_prompt="Tu es un tuteur expert. Réponds UNIQUEMENT en JSON valide.",
            difficulty=difficulty,
            temperature=0.4
        )

        # Parser la réponse
        import json
        content = result.content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]

        question_data = json.loads(content.strip())

        question_id = f"gen-{uuid.uuid4().hex[:8]}"

        # Stocker dans la session (SANS les options pour la phase 1)
        current_gen_question = {
            "id": question_id,
            "question": question_data["question"],
            "generation_prompt": question_data.get("generation_prompt", "Tape ta réponse..."),
            "expected_keywords": question_data.get("expected_keywords", []),
            "options": question_data["options"],
            "correct_answer": question_data["correct_answer"],
            "explanation": question_data.get("explanation", ""),
            "difficulty": difficulty,
            "phase": "generation",  # Phase actuelle
            "started_at": datetime.now().isoformat()
        }
        db.update_session(session_id, {"current_question_data": current_gen_question})

        # Retourner PHASE 1: Question SANS options
        return {
            "id": question_id,
            "question": question_data["question"],
            "generation_prompt": question_data.get("generation_prompt", "Avant de voir les options, tape ta réponse..."),
            "difficulty": difficulty,
            "mastery_level": mastery_data["mastery_level"],
            "phase": "generation",
            "recommendation": gen_recommendation,
            "estimated_generation_time": 30,
            # Les options sont MASQUÉES à ce stade
            "hint": "Réfléchis et tape ta réponse avant de voir les choix!"
        }

    except Exception as e:
        logger.error(f"Erreur génération question Generation Effect: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generation-effect/submit-generation/{session_id}")
async def submit_generation_phase(
    session_id: str,
    submission: GenerationSubmission
):
    """
    PHASE 1 COMPLETE: Soumet la génération libre de l'élève.

    Évalue la qualité de la génération et révèle les options QCM pour la phase 2.
    """
    # Récupérer la session
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session non trouvée")

    question_data = session.get("current_question_data")
    if not question_data or question_data.get("phase") != "generation":
        raise HTTPException(status_code=400, detail="Pas de question en phase génération")

    # Vérifier que c'est la bonne question
    if question_data["id"] != submission.question_id:
        raise HTTPException(status_code=400, detail="Question ID mismatch")

    user_id = session["user_id"]
    topic_id = session["topic_id"]

    # Évaluer la qualité de la génération
    expected_keywords = question_data.get("expected_keywords", [])
    correct_answer_text = ""

    # Trouver le texte de la bonne réponse
    for opt in question_data.get("options", []):
        if opt.get("id") == question_data.get("correct_answer") or opt.get("is_correct"):
            correct_answer_text = opt.get("text", "")
            break

    quality_result = db.calculate_generation_quality(
        generated_answer=submission.generated_answer,
        expected_keywords=expected_keywords,
        correct_answer=correct_answer_text
    )

    # Calculer le bonus de génération (max 20 XP)
    generation_bonus = int(quality_result["quality"] * 20)

    # Mettre à jour la question pour passer en phase 2
    question_data["phase"] = "selection"
    question_data["generation_submitted"] = {
        "answer": submission.generated_answer,
        "time": submission.generation_time,
        "confidence": submission.confidence,
        "quality": quality_result["quality"],
        "keywords_matched": quality_result["keywords_matched"],
        "keywords_missed": quality_result["keywords_missed"],
        "bonus": generation_bonus
    }
    db.update_session(session_id, {"current_question_data": question_data})

    # Retourner PHASE 2: Révéler les options
    return {
        "phase": "selection",
        "generation_feedback": {
            "quality": quality_result["quality"],
            "keywords_matched": quality_result["keywords_matched"],
            "keywords_missed": quality_result["keywords_missed"],
            "bonus_earned": generation_bonus,
            "message": _get_generation_feedback_message(quality_result["quality"])
        },
        "question": question_data["question"],
        "options": [
            {"id": opt["id"], "text": opt["text"]}
            for opt in question_data["options"]
        ],
        "estimated_selection_time": 15
    }


def _get_generation_feedback_message(quality: float) -> str:
    """Génère un message de feedback basé sur la qualité de génération."""
    if quality >= 0.8:
        return "Excellent! Ta génération était très proche de la bonne réponse!"
    elif quality >= 0.6:
        return "Bien! Tu as identifié plusieurs éléments clés."
    elif quality >= 0.4:
        return "Pas mal! Tu étais sur la bonne piste."
    elif quality >= 0.2:
        return "Quelques éléments corrects. Voyons les options maintenant."
    else:
        return "C'est difficile! Regarde les options pour t'aider."


class SelectionSubmission(BaseModel):
    """Soumission de la phase de sélection QCM"""
    question_id: str
    selected_answer: str
    selection_time: int


@router.post("/generation-effect/submit-selection/{session_id}")
async def submit_selection_phase(
    session_id: str,
    submission: SelectionSubmission
):
    """
    PHASE 2 COMPLETE: Soumet la sélection QCM finale.

    Calcule le résultat combiné (génération + sélection) et les bonus.
    """
    # Récupérer la session
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session non trouvée")

    question_data = session.get("current_question_data")
    if not question_data or question_data.get("phase") != "selection":
        raise HTTPException(status_code=400, detail="Pas de question en phase sélection")

    if question_data["id"] != submission.question_id:
        raise HTTPException(status_code=400, detail="Question ID mismatch")

    user_id = session["user_id"]
    topic_id = session["topic_id"]
    difficulty = question_data.get("difficulty", "medium")

    # Récupérer les données de génération
    gen_data = question_data.get("generation_submitted", {})

    # Vérifier la réponse
    correct_answer = question_data.get("correct_answer", "")
    is_correct = submission.selected_answer.strip().upper() == correct_answer.strip().upper()

    # Vérifier la cohérence: la génération était-elle alignée avec la sélection?
    was_consistent = gen_data.get("quality", 0) >= 0.4 and is_correct

    # Calculer les bonus
    generation_bonus = gen_data.get("bonus", 0)
    consistency_bonus = 10 if was_consistent else 0

    # Récupérer la maîtrise pour calcul
    mastery_data = db.get_or_create_mastery(user_id, topic_id)

    # Calculer le changement de maîtrise (bonus pour Generation Effect)
    total_time = gen_data.get("time", 0) + submission.selection_time
    base_mastery_change = calculate_mastery_change(
        is_correct=is_correct,
        difficulty=difficulty,
        current_mastery=mastery_data["mastery_level"],
        response_time=total_time,
        expected_time=60
    )

    # Bonus de rétention pour avoir utilisé Generation Effect (+15%)
    mastery_change = int(base_mastery_change * 1.15) if is_correct else base_mastery_change

    # Calculer XP total
    base_xp = calculate_xp_reward(
        is_correct=is_correct,
        difficulty=difficulty,
        streak=session.get("streak", 0),
        is_first_of_day=session["questions_answered"] == 0
    )
    total_xp = base_xp + generation_bonus + consistency_bonus

    # Estimer le boost de rétention
    quality = gen_data.get("quality", 0)
    retention_boost = 25 + (quality * 10)  # 25-35% selon la qualité

    # Mettre à jour la maîtrise en DB
    new_mastery = max(0, min(100, mastery_data["mastery_level"] + mastery_change))
    new_total_attempts = mastery_data["total_attempts"] + 1
    new_correct_attempts = mastery_data["correct_attempts"] + (1 if is_correct else 0)
    new_success_rate = new_correct_attempts / max(1, new_total_attempts)

    db.update_mastery_data(user_id, topic_id, {
        "mastery_level": new_mastery,
        "total_attempts": new_total_attempts,
        "correct_attempts": new_correct_attempts,
        "success_rate": new_success_rate,
        "last_reviewed": datetime.now().isoformat()
    })

    # Mettre à jour success_by_difficulty
    db.update_success_by_difficulty(user_id, topic_id, difficulty, is_correct)

    # Enregistrer la réponse Generation Effect complète
    db.record_generation_response(
        user_id=user_id,
        question_id=question_data["id"],
        topic_id=topic_id,
        difficulty=difficulty,
        generated_answer=gen_data.get("answer", ""),
        generation_time=gen_data.get("time", 0),
        keywords_matched=gen_data.get("keywords_matched", []),
        keywords_total=len(question_data.get("expected_keywords", [])),
        generation_quality=gen_data.get("quality", 0),
        pre_generation_confidence=gen_data.get("confidence"),
        selected_answer=submission.selected_answer,
        selection_time=submission.selection_time,
        is_correct=is_correct,
        was_consistent=was_consistent,
        generation_bonus=generation_bonus,
        consistency_bonus=consistency_bonus,
        total_xp=total_xp,
        mastery_change=mastery_change
    )

    # Enregistrer pour chronotype
    db.record_session_performance(
        user_id=user_id,
        is_correct=is_correct,
        response_time=total_time,
        mastery_change=mastery_change
    )

    # Mettre à jour la session
    db.update_session_atomic(session_id, {
        "questions_answered_delta": 1,
        "correct_answers_delta": 1 if is_correct else 0,
        "xp_earned_delta": total_xp,
        "streak_increment": is_correct,
        "current_question_data": None
    })

    # Générer le feedback
    if is_correct and was_consistent:
        feedback = "Parfait! Ta génération était alignée avec ta réponse finale. +15% rétention!"
    elif is_correct:
        feedback = "Correct! Essaie de mieux anticiper la réponse la prochaine fois."
    elif gen_data.get("quality", 0) >= 0.6:
        feedback = "Ta génération était bonne mais tu as choisi la mauvaise option. Relis bien!"
    else:
        feedback = f"La bonne réponse était: {correct_answer}. {question_data.get('explanation', '')}"

    return GenerationEffectResult(
        generation_quality=gen_data.get("quality", 0),
        keywords_matched=gen_data.get("keywords_matched", []),
        keywords_missed=gen_data.get("keywords_missed", []),
        pre_generation_bonus=generation_bonus,
        is_correct=is_correct,
        explanation=question_data.get("explanation", ""),
        was_consistent=was_consistent,
        consistency_bonus=consistency_bonus,
        total_xp=total_xp,
        mastery_change=mastery_change,
        retention_boost=retention_boost,
        feedback=feedback
    )


@router.get("/generation-effect/stats/{user_id}")
async def get_generation_effect_stats(user_id: str):
    """
    Récupère les statistiques de Generation Effect d'un utilisateur.

    Inclut:
    - Nombre total de générations
    - Qualité moyenne
    - Taux de cohérence
    - Bonus accumulés
    - Estimation du boost de rétention
    """
    try:
        stats = db.get_generation_stats(user_id)
        return stats
    except Exception as e:
        logger.error(f"Error getting generation stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/generation-effect/should-use/{user_id}/{topic_id}")
async def should_use_generation_effect(user_id: str, topic_id: str):
    """
    Vérifie si le mode Generation Effect est recommandé pour cet utilisateur/topic.

    Utilisé par le frontend pour décider quel mode de question afficher.
    """
    try:
        recommendation = db.should_use_generation_mode(user_id, topic_id)
        return recommendation
    except Exception as e:
        logger.error(f"Error checking generation mode: {e}")
        return {
            "recommended": False,
            "reason": "Erreur lors de la vérification",
            "frequency_suggestion": "none"
        }


# ═══════════════════════════════════════════════════════════════════════════════
# 🔄 INTERLEAVING - Alterner entre topics pour +15-20% rétention
# Principe: "Contextual interference" améliore le transfert et la rétention
# ═══════════════════════════════════════════════════════════════════════════════

class InterleavingStartRequest(BaseModel):
    """Requête pour démarrer une session interleaving"""
    course_id: str
    topic_ids: List[str]  # Minimum 2 topics
    switch_frequency: int = 2  # Questions avant de changer de topic


@router.post("/interleaving/start")
async def start_interleaving_session(
    request: InterleavingStartRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Démarre une session d'interleaving avec plusieurs topics.

    L'interleaving force le cerveau à alterner entre sujets,
    ce qui améliore la discrimination et la rétention à long terme
    de 15-20% selon les recherches (Rohrer & Taylor, 2007).

    Args:
        course_id: ID du cours
        topic_ids: Liste des topics à alterner (min 2, max 5)
        switch_frequency: Nombre de questions avant de changer (défaut: 2)

    Returns:
        Session interleaving créée avec premier topic
    """
    user_id = get_user_id(x_user_id)

    if len(request.topic_ids) < 2:
        raise HTTPException(
            status_code=400,
            detail="L'interleaving nécessite au moins 2 topics"
        )

    if len(request.topic_ids) > 5:
        raise HTTPException(
            status_code=400,
            detail="Maximum 5 topics pour l'interleaving"
        )

    session_id = f"il-{uuid.uuid4().hex[:8]}"

    try:
        result = db.create_interleaving_session(
            session_id=session_id,
            user_id=user_id,
            course_id=request.course_id,
            topic_ids=request.topic_ids,
            switch_frequency=request.switch_frequency
        )

        return result

    except Exception as e:
        logger.error(f"Error creating interleaving session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/interleaving/next-question/{session_id}")
async def get_next_interleaving_question(session_id: str):
    """
    Récupère la prochaine question en mode interleaving.

    Détermine automatiquement le topic selon la fréquence de switch
    et génère une question adaptée.
    """
    # Récupérer la session interleaving
    il_session = db.get_interleaving_session(session_id)
    if not il_session:
        raise HTTPException(status_code=404, detail="Session interleaving non trouvée")

    if il_session["status"] != "active":
        raise HTTPException(status_code=400, detail="Session interleaving terminée")

    # Déterminer le prochain topic
    next_topic_info = db.get_next_interleaving_topic(session_id)
    topic_id = next_topic_info["topic_id"]
    user_id = il_session["user_id"]

    # Récupérer la maîtrise pour ce topic
    mastery_data = db.get_or_create_mastery(user_id, topic_id)
    success_rates = db.get_success_rates_by_difficulty(user_id, topic_id)

    # Déterminer la difficulté
    difficulty = determine_difficulty(
        mastery_data["mastery_level"],
        mastery_data["success_rate"],
        skip_days=0,
        success_by_difficulty=success_rates
    )

    try:
        # Générer la question
        question = await ai_dispatcher.generate_question(
            topic_name=topic_id,
            difficulty=difficulty,
            mastery_level=mastery_data["mastery_level"],
            learning_style=None,
            weak_areas=[],
            context=f"Interleaving session with topics: {', '.join(il_session['topic_ids'])}"
        )

        question_id = f"il-q-{uuid.uuid4().hex[:8]}"

        # Stocker dans une session learning temporaire
        temp_session = db.get_session(session_id)
        if not temp_session:
            # Créer une session learning liée
            db.create_session(
                session_id=session_id,
                user_id=user_id,
                course_id=il_session["course_id"],
                topic_id=topic_id,
                topic_name=topic_id
            )

        # Stocker la question courante
        current_question = {
            "id": question_id,
            "topic_id": topic_id,
            "difficulty": difficulty,
            "started_at": datetime.now().isoformat(),
            "correct_answer": question.correct_answer,
            "explanation": question.explanation,
            "interleaving_session": session_id
        }
        db.update_session(session_id, {"current_question_data": current_question})

        return {
            "question_id": question_id,
            "question_text": question.question_text,
            "options": [
                {"id": opt.id, "text": opt.text}
                for opt in question.options
            ],
            "difficulty": difficulty,
            "topic_id": topic_id,
            "mastery_level": mastery_data["mastery_level"],
            "interleaving_info": {
                "current_topic": topic_id,
                "topic_idx": next_topic_info["topic_idx"] + 1,
                "total_topics": next_topic_info["total_topics"],
                "questions_on_current": next_topic_info["questions_on_current"],
                "will_switch_after": next_topic_info["switch_frequency"] - next_topic_info["questions_on_current"],
                "estimated_benefit": f"+{int(il_session['estimated_benefit'] * 100)}%"
            }
        }

    except Exception as e:
        logger.error(f"Error generating interleaving question: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/interleaving/submit-answer/{session_id}")
async def submit_interleaving_answer(session_id: str, submission: AnswerSubmission):
    """
    Soumet une réponse dans une session d'interleaving.

    Applique le bonus d'interleaving au changement de maîtrise.
    """
    # Récupérer la session interleaving
    il_session = db.get_interleaving_session(session_id)
    if not il_session:
        raise HTTPException(status_code=404, detail="Session interleaving non trouvée")

    # Récupérer la session learning
    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session non trouvée")

    current_q = session.get("current_question_data")
    if not current_q:
        raise HTTPException(status_code=400, detail="Pas de question active")

    topic_id = current_q.get("topic_id", session["topic_id"])
    user_id = session["user_id"]
    difficulty = validate_difficulty(current_q.get("difficulty", "medium"))

    # Vérifier la réponse
    correct_answer = current_q.get("correct_answer", "")
    is_correct = submission.user_answer.strip().lower() == correct_answer.strip().lower()

    # Récupérer mastery
    mastery_data = db.get_or_create_mastery(user_id, topic_id)

    # Calculer le changement de maîtrise de base
    base_mastery_change = calculate_mastery_change(
        is_correct=is_correct,
        difficulty=difficulty,
        current_mastery=mastery_data["mastery_level"],
        response_time=submission.time_taken,
        expected_time=60
    )

    # Enregistrer la réponse et obtenir le bonus d'interleaving
    il_result = db.record_interleaving_answer(session_id, topic_id, is_correct)
    interleaving_bonus = il_result["interleaving_bonus"]

    # Appliquer le bonus d'interleaving
    mastery_change = int(base_mastery_change * interleaving_bonus) if is_correct else base_mastery_change

    # Mettre à jour la maîtrise
    new_mastery = max(0, min(100, mastery_data["mastery_level"] + mastery_change))
    new_total_attempts = mastery_data["total_attempts"] + 1
    new_correct_attempts = mastery_data["correct_attempts"] + (1 if is_correct else 0)
    new_success_rate = new_correct_attempts / max(1, new_total_attempts)

    db.update_mastery_data(user_id, topic_id, {
        "mastery_level": new_mastery,
        "total_attempts": new_total_attempts,
        "correct_attempts": new_correct_attempts,
        "success_rate": new_success_rate,
        "last_reviewed": datetime.now().isoformat()
    })

    # Mettre à jour success_by_difficulty
    db.update_success_by_difficulty(user_id, topic_id, difficulty, is_correct)

    # Enregistrer pour chronotype
    db.record_session_performance(
        user_id=user_id,
        is_correct=is_correct,
        response_time=submission.time_taken,
        mastery_change=mastery_change
    )

    # Calculer XP
    xp_earned = calculate_xp_reward(
        is_correct=is_correct,
        difficulty=difficulty,
        streak=0,  # Pas de streak en interleaving pour simplifier
        is_first_of_day=False
    )

    # Bonus XP pour interleaving
    if is_correct:
        xp_earned = int(xp_earned * interleaving_bonus)

    # Nettoyer la question courante
    db.update_session(session_id, {"current_question_data": None})

    # Générer feedback
    if is_correct:
        if il_result["switched"]:
            feedback = f"Correct! Changement de topic: {il_result['next_topic']} (bonus interleaving: +{int((interleaving_bonus-1)*100)}%)"
        else:
            feedback = f"Correct! Continue sur ce topic."
    else:
        feedback = f"La bonne réponse était: {correct_answer}. {current_q.get('explanation', '')}"

    return {
        "is_correct": is_correct,
        "explanation": current_q.get("explanation", ""),
        "mastery_change": mastery_change,
        "xp_earned": xp_earned,
        "interleaving_info": {
            "bonus_applied": round(interleaving_bonus, 3),
            "switched_topic": il_result["switched"],
            "next_topic": il_result["next_topic"],
            "questions_answered": il_result["questions_answered"],
            "session_success_rate": round(il_result["success_rate"] * 100, 1)
        },
        "feedback": feedback
    }


@router.post("/interleaving/end/{session_id}")
async def end_interleaving_session(session_id: str):
    """
    Termine une session d'interleaving et retourne le résumé.
    """
    try:
        result = db.end_interleaving_session(session_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error ending interleaving session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/interleaving/stats/{user_id}")
async def get_user_interleaving_stats(user_id: str):
    """
    Récupère les statistiques d'interleaving d'un utilisateur.
    """
    try:
        stats = db.get_interleaving_stats(user_id)
        return stats
    except Exception as e:
        logger.error(f"Error getting interleaving stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/interleaving/suggest/{user_id}/{topic_id}")
async def suggest_interleaving(user_id: str, topic_id: str):
    """
    Vérifie si l'interleaving devrait être suggéré pour cet utilisateur/topic.

    Utilisé pour afficher une suggestion au bon moment.
    """
    try:
        suggestion = db.should_suggest_interleaving(user_id, topic_id)
        return suggestion
    except Exception as e:
        logger.error(f"Error checking interleaving suggestion: {e}")
        return {
            "suggested": False,
            "reason": "Erreur lors de la vérification",
            "available_topics": [],
            "estimated_benefit": 0
        }


@router.get("/interleaving/session/{session_id}")
async def get_interleaving_session_info(session_id: str):
    """
    Récupère les informations d'une session d'interleaving.
    """
    session = db.get_interleaving_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session non trouvée")

    return session
