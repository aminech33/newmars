"""
🧠 ADVANCED LEARNING ENGINE
Intègre tous les algorithmes avancés dans un service unifié.

Ce service connecte:
- FSRS (remplace SM-2++)
- Cognitive Load Detection
- Transfer Learning
- Forgetting Curve
- Pre-sleep Scheduling
- Variation Practice

Utilisation:
    from services.advanced_learning_engine import learning_engine

    # Pour une nouvelle question
    result = learning_engine.get_next_question_params(user_id, topic_id, session_data)

    # Après une réponse
    update = learning_engine.process_answer(user_id, topic_id, is_correct, response_time, difficulty)
"""

import logging
from datetime import datetime, time, timedelta
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass

# Import des algorithmes avancés
from utils.fsrs_algorithm import FSRS, FSRSCard, Rating
from utils.cognitive_load import CognitiveLoadDetector, CognitiveLoadAssessment
from utils.transfer_learning import TransferLearningDetector, TransferBonus
from utils.forgetting_curve import PersonalizedForgettingCurve, UserMemoryProfile
from utils.presleep_scheduling import PreSleepScheduler, SleepSchedule
from utils.variation_practice import VariationPracticeEngine, VariationType

logger = logging.getLogger(__name__)


@dataclass
class QuestionParams:
    """Paramètres pour la génération de question"""
    difficulty: str  # "easy", "medium", "hard"
    difficulty_level: int  # 1-4
    topic_id: str
    should_use_variation: bool
    variation_type: Optional[str]
    transfer_bonus: float
    cognitive_load: str  # "optimal", "elevated", "high", "overload"
    should_take_break: bool
    break_suggestion: Optional[str]
    fsrs_interval: float
    retrievability: float


@dataclass
class AnswerResult:
    """Résultat après traitement d'une réponse"""
    mastery_change: int
    new_fsrs_card: dict
    cognitive_assessment: dict
    should_reduce_difficulty: bool
    should_take_break: bool
    break_reason: Optional[str]
    next_review_days: float
    learning_efficiency: float
    transfer_applied: bool


class AdvancedLearningEngine:
    """
    Moteur d'apprentissage avancé unifié.
    Gère l'état de tous les algorithmes par utilisateur.
    """

    def __init__(self):
        # Algorithmes de base (stateless)
        self.fsrs = FSRS()
        self.variation_engine = VariationPracticeEngine()

        # État par utilisateur (en mémoire - à persister en DB en prod)
        self._user_states: Dict[str, Dict[str, Any]] = {}

        logger.info("🧠 Advanced Learning Engine initialized")

    def _get_user_state(self, user_id: str) -> Dict[str, Any]:
        """Récupère ou crée l'état d'un utilisateur"""
        if user_id not in self._user_states:
            self._user_states[user_id] = {
                "cognitive_detector": CognitiveLoadDetector(),
                "transfer_detector": TransferLearningDetector(),
                "forgetting_curve": PersonalizedForgettingCurve(),
                "presleep_scheduler": PreSleepScheduler(),
                "fsrs_cards": {},  # topic_id -> FSRSCard
                "session_responses": [],  # Pour cognitive load
                "topics_mastery": {},  # topic_id -> mastery level (0-100)
                "last_activity": datetime.now()
            }
        return self._user_states[user_id]

    def get_next_question_params(
        self,
        user_id: str,
        topic_id: str,
        current_mastery: int,
        session_data: Optional[Dict] = None
    ) -> QuestionParams:
        """
        Calcule les paramètres optimaux pour la prochaine question.

        Args:
            user_id: ID de l'utilisateur
            topic_id: ID du topic
            current_mastery: Niveau de maîtrise actuel (0-100)
            session_data: Données de session (questions répondues, etc.)

        Returns:
            QuestionParams avec tous les paramètres optimisés
        """
        state = self._get_user_state(user_id)

        # 1. COGNITIVE LOAD CHECK
        cognitive_assessment = state["cognitive_detector"].assess()
        should_take_break = cognitive_assessment.should_pause
        cognitive_load = cognitive_assessment.overall_load

        break_suggestion = None
        if should_take_break:
            break_suggestion = cognitive_assessment.recommendation

        # 2. TRANSFER LEARNING
        # Mettre à jour les maîtrises dans le détecteur
        for t_id, mastery in state["topics_mastery"].items():
            state["transfer_detector"].set_mastery(t_id, mastery)
        state["topics_mastery"][topic_id] = current_mastery

        transfer_bonus = 0.0
        bonus_result = state["transfer_detector"].calculate_transfer_bonus(topic_id)
        if bonus_result and bonus_result.bonus_percent > 0:
            transfer_bonus = bonus_result.bonus_percent / 100
            logger.info(f"🔗 Transfer bonus for {topic_id}: +{bonus_result.bonus_percent}%")

        # 3. FSRS - Récupérer ou créer la carte
        if topic_id not in state["fsrs_cards"]:
            state["fsrs_cards"][topic_id] = FSRSCard()

        fsrs_card = state["fsrs_cards"][topic_id]
        fsrs_interval = fsrs_card.stability
        retrievability = self.fsrs.retrievability(
            (datetime.now() - fsrs_card.last_review).days if fsrs_card.last_review else 0,
            fsrs_card.stability
        ) if fsrs_card.stability > 0 else 1.0

        # 4. FORGETTING CURVE - Créer trace si besoin
        if topic_id not in state["forgetting_curve"].memory_traces:
            state["forgetting_curve"].create_memory_trace(
                item_id=topic_id,
                content_type="concepts",
                encoding_method="active_recall"
            )

        # 5. CALCULER LA DIFFICULTÉ OPTIMALE
        # Combine: maîtrise actuelle + transfer bonus + cognitive load + retrievability
        effective_mastery = min(100, current_mastery + int(transfer_bonus * 20))

        # Réduire difficulté si fatigue cognitive
        difficulty_reduction = 0
        if cognitive_load == "elevated":
            difficulty_reduction = 1
        elif cognitive_load in ["high", "overload"]:
            difficulty_reduction = 2

        # Calculer le niveau de difficulté (1-4)
        if effective_mastery < 25:
            base_difficulty = 1
        elif effective_mastery < 50:
            base_difficulty = 2
        elif effective_mastery < 75:
            base_difficulty = 3
        else:
            base_difficulty = 4

        # Ajuster selon retrievability (si faible = question plus facile pour renforcer)
        if retrievability < 0.5:
            base_difficulty = max(1, base_difficulty - 1)

        final_difficulty = max(1, base_difficulty - difficulty_reduction)

        # Convertir en string
        difficulty_map = {1: "easy", 2: "medium", 3: "hard", 4: "hard"}
        difficulty_str = difficulty_map[final_difficulty]

        # 6. VARIATION PRACTICE - Décider si utiliser une variation
        should_use_variation = False
        variation_type = None

        # Utiliser variations si maîtrise élevée (pour renforcer)
        if current_mastery >= 60 and not should_take_break:
            should_use_variation = True
            # Choisir le type selon le contexte
            if retrievability < 0.7:
                variation_type = "CONTEXT"  # Changer le contexte pour tester le transfert
            elif current_mastery >= 80:
                variation_type = "INVERSE"  # Questions inversées pour experts
            else:
                variation_type = "DIFFICULTY"  # Varier la difficulté

        return QuestionParams(
            difficulty=difficulty_str,
            difficulty_level=final_difficulty,
            topic_id=topic_id,
            should_use_variation=should_use_variation,
            variation_type=variation_type,
            transfer_bonus=transfer_bonus,
            cognitive_load=cognitive_load,
            should_take_break=should_take_break,
            break_suggestion=break_suggestion,
            fsrs_interval=fsrs_interval,
            retrievability=retrievability
        )

    def process_answer(
        self,
        user_id: str,
        topic_id: str,
        is_correct: bool,
        response_time: float,
        difficulty: str,
        current_mastery: int
    ) -> AnswerResult:
        """
        Traite une réponse et met à jour tous les algorithmes.

        Args:
            user_id: ID utilisateur
            topic_id: ID topic
            is_correct: Réponse correcte?
            response_time: Temps de réponse en secondes
            difficulty: "easy", "medium", "hard"
            current_mastery: Maîtrise actuelle

        Returns:
            AnswerResult avec tous les résultats
        """
        state = self._get_user_state(user_id)

        # 1. COGNITIVE LOAD - Ajouter la réponse
        state["cognitive_detector"].add_response(
            response_time=int(response_time),
            is_correct=is_correct,
            difficulty=difficulty
        )
        cognitive_assessment = state["cognitive_detector"].assess()

        # 2. FSRS - Mettre à jour la carte
        if topic_id not in state["fsrs_cards"]:
            state["fsrs_cards"][topic_id] = FSRSCard()

        # Convertir en rating FSRS
        if is_correct:
            if response_time < 10:
                rating = Rating.EASY
            elif response_time < 30:
                rating = Rating.GOOD
            else:
                rating = Rating.HARD
        else:
            rating = Rating.AGAIN

        old_card = state["fsrs_cards"][topic_id]
        new_card, interval = self.fsrs.review(old_card, rating)
        state["fsrs_cards"][topic_id] = new_card

        # 3. FORGETTING CURVE - Mettre à jour
        if topic_id in state["forgetting_curve"].memory_traces:
            trace = state["forgetting_curve"].memory_traces[topic_id]
            state["forgetting_curve"].update_after_review(
                trace=trace,
                was_recalled=is_correct,
                response_time=response_time
            )

        # 4. CALCULER LE CHANGEMENT DE MAÎTRISE (style FSRS)
        # Plus sophistiqué que SM-2++
        difficulty_multiplier = {"easy": 0.8, "medium": 1.0, "hard": 1.3}.get(difficulty, 1.0)

        if is_correct:
            # Base gain
            base_gain = 5

            # Bonus pour réponse rapide
            if response_time < 15:
                base_gain += 3
            elif response_time < 30:
                base_gain += 1

            # Bonus difficulté
            base_gain = int(base_gain * difficulty_multiplier)

            # Réduction si proche de 100
            if current_mastery >= 90:
                base_gain = max(1, base_gain // 2)

            mastery_change = base_gain
        else:
            # Perte
            base_loss = -3

            # Perte plus grande si question facile ratée
            if difficulty == "easy":
                base_loss = -5
            elif difficulty == "hard":
                base_loss = -2

            mastery_change = base_loss

        # 5. TRANSFER LEARNING - Vérifier si appliqué
        transfer_applied = False
        bonus = state["transfer_detector"].calculate_transfer_bonus(topic_id)
        if bonus and bonus.bonus_percent > 0:
            transfer_applied = True
            if is_correct:
                mastery_change = int(mastery_change * (1 + bonus.bonus_percent / 100))

        # 6. EFFICACITÉ D'APPRENTISSAGE
        # Calculée sur les dernières réponses
        recent_correct = sum(1 for r in state["session_responses"][-10:] if r.get("is_correct", False))
        learning_efficiency = recent_correct / max(1, len(state["session_responses"][-10:]))

        # Stocker la réponse
        state["session_responses"].append({
            "is_correct": is_correct,
            "response_time": response_time,
            "difficulty": difficulty,
            "timestamp": datetime.now()
        })

        # Mettre à jour la maîtrise locale
        state["topics_mastery"][topic_id] = max(0, min(100, current_mastery + mastery_change))

        return AnswerResult(
            mastery_change=mastery_change,
            new_fsrs_card={
                "stability": new_card.stability,
                "difficulty": new_card.difficulty,
                "reps": new_card.reps,
                "interval": interval
            },
            cognitive_assessment={
                "level": cognitive_assessment.overall_load,
                "score": cognitive_assessment.load_score,
                "should_pause": cognitive_assessment.should_pause,
                "recommendation": cognitive_assessment.recommendation
            },
            should_reduce_difficulty=cognitive_assessment.should_reduce_difficulty,
            should_take_break=cognitive_assessment.should_pause,
            break_reason=cognitive_assessment.recommendation if cognitive_assessment.should_pause else None,
            next_review_days=interval,
            learning_efficiency=learning_efficiency,
            transfer_applied=transfer_applied
        )

    def get_presleep_recommendation(self, user_id: str) -> Dict[str, Any]:
        """Obtient les recommandations de révision pré-sommeil"""
        state = self._get_user_state(user_id)
        plan = state["presleep_scheduler"].get_presleep_plan()

        if not plan:
            return {"recommended": False}

        # Trouver les topics prioritaires
        priority_topics = []
        for topic_id, card in state["fsrs_cards"].items():
            if card.stability > 0:
                days_since = (datetime.now() - card.last_review).days if card.last_review else 0
                retrievability = self.fsrs.retrievability(days_since, card.stability)
                if retrievability < 0.8:  # Risque d'oubli
                    priority_topics.append({
                        "topic_id": topic_id,
                        "retrievability": retrievability,
                        "priority": "high" if retrievability < 0.5 else "medium"
                    })

        return {
            "recommended": True,
            "duration_minutes": plan.total_review_time_minutes,
            "expected_boost": plan.expected_retention_boost,
            "priority_topics": sorted(priority_topics, key=lambda x: x["retrievability"])[:5],
            "tips": plan.personalized_tips
        }

    def reset_session(self, user_id: str):
        """Reset le détecteur cognitive load pour une nouvelle session"""
        state = self._get_user_state(user_id)
        state["cognitive_detector"] = CognitiveLoadDetector()
        state["session_responses"] = []
        logger.info(f"🔄 Session reset for user {user_id}")

    def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Récupère les statistiques avancées d'un utilisateur"""
        state = self._get_user_state(user_id)

        # Stats FSRS
        fsrs_stats = {}
        for topic_id, card in state["fsrs_cards"].items():
            days_since = (datetime.now() - card.last_review).days if card.last_review else 0
            fsrs_stats[topic_id] = {
                "stability": card.stability,
                "difficulty": card.difficulty,
                "reps": card.reps,
                "retrievability": self.fsrs.retrievability(days_since, card.stability) if card.stability > 0 else 1.0
            }

        # Stats cognitive
        cognitive = state["cognitive_detector"].assess()

        return {
            "fsrs": fsrs_stats,
            "cognitive_load": {
                "level": cognitive.overall_load,
                "score": cognitive.load_score
            },
            "topics_mastery": state["topics_mastery"],
            "session_responses": len(state["session_responses"]),
            "learning_efficiency": sum(1 for r in state["session_responses"][-20:] if r.get("is_correct", False)) / max(1, len(state["session_responses"][-20:]))
        }


# Instance globale du moteur
learning_engine = AdvancedLearningEngine()
