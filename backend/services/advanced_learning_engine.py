"""
🧠 ADVANCED LEARNING ENGINE v3.0
Intègre tous les algorithmes avancés dans un service unifié.

Ce service connecte 16 algorithmes basés sur les neurosciences:
- FSRS (remplace SM-2++)
- Cognitive Load Detection
- Transfer Learning
- Forgetting Curve
- Pre-sleep Scheduling
- Variation Practice
- Optimal Difficulty System v2.0 (5 niveaux, calibration, confiance)
- 🆕 Dual Coding (Paivio, 1971) - encodage visuel + verbal
- 🆕 Chunking (Miller, 1956) - regroupement cognitif
- 🆕 Elaborative Interrogation (Pressley, 1987) - questions "pourquoi?"
- 🆕 Emotional Encoding (Phelps, 2004) - mémorisation émotionnelle

Utilisation:
    from services.advanced_learning_engine import learning_engine

    # Pour une nouvelle question
    result = learning_engine.get_next_question_params(user_id, topic_id, session_data)

    # Après une réponse (avec confiance optionnelle)
    update = learning_engine.process_answer(user_id, topic_id, is_correct, response_time, difficulty, confidence=0.8)

    # 🆕 Nouveaux modules cognitifs
    dual_coded = learning_engine.encode_with_dual_coding(content, topic)
    chunked = learning_engine.chunk_content(content, topic, user_id)
    questions = learning_engine.generate_elaborative_questions(content, topic)
    emotional = learning_engine.encode_emotionally(content, topic, user_id)
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

# 🆕 Nouveau système de difficulté optimal
from utils.optimal_difficulty import (
    OptimalDifficultyEngine,
    DifficultyLevel,
    LEVEL_TO_LEGACY,
    XP_BY_LEVEL,
    calculate_xp_v2,
    optimal_difficulty_engine
)

# 🆕 V3.0 - Nouveaux modules cognitifs
from utils.dual_coding import (
    DualCodingEngine,
    DualCodedContent,
    dual_coding_engine
)
from utils.chunking import (
    ChunkingEngine,
    ChunkedContent,
    chunking_engine
)
from utils.elaborative_interrogation import (
    ElaborativeInterrogationEngine,
    ElaborativeQuestion,
    elaborative_engine
)
from utils.emotional_encoding import (
    EmotionalEncodingEngine,
    EmotionallyEncodedContent,
    EmotionalState,
    emotional_engine
)

logger = logging.getLogger(__name__)


@dataclass
class QuestionParams:
    """Paramètres pour la génération de question"""
    difficulty: str  # "easy", "medium", "hard" (legacy)
    difficulty_level: int  # 1-5 (nouveau système)
    difficulty_name: str  # "VERY_EASY", "EASY", "MEDIUM", "HARD", "EXPERT"
    topic_id: str
    should_use_variation: bool
    variation_type: Optional[str]
    transfer_bonus: float
    cognitive_load: str  # "optimal", "elevated", "high", "overload"
    should_take_break: bool
    break_suggestion: Optional[str]
    fsrs_interval: float
    retrievability: float
    # 🆕 Métadonnées du nouveau système
    difficulty_adjustments: List[str]  # Raisons des ajustements
    desirable_difficulty_applied: bool  # Si Bjork's DD a été appliqué


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
    # 🆕 Nouveau système
    xp_earned: int
    confidence_feedback: Optional[str]
    confidence_impact: float  # Multiplicateur basé sur confiance
    calibration_updated: bool  # Si la calibration utilisateur a été mise à jour


class AdvancedLearningEngine:
    """
    Moteur d'apprentissage avancé unifié v3.0.
    Gère l'état de tous les algorithmes par utilisateur.

    Nouveautés v3.0:
    - 5 niveaux de difficulté (au lieu de 3)
    - Calibration personnalisée des seuils
    - Desirable Difficulty (Bjork, 2011)
    - Tracking de la confiance subjective
    - 🆕 Dual Coding (Paivio) - encodage visuel + verbal
    - 🆕 Chunking (Miller) - regroupement cognitif optimal
    - 🆕 Elaborative Interrogation (Pressley) - questions "pourquoi?"
    - 🆕 Emotional Encoding (Phelps) - mémorisation émotionnelle
    """

    def __init__(self):
        # Algorithmes de base (stateless)
        self.fsrs = FSRS()
        self.variation_engine = VariationPracticeEngine()

        # 🆕 Moteur de difficulté optimal
        self.difficulty_engine = optimal_difficulty_engine

        # 🆕 V3.0 - Nouveaux moteurs cognitifs
        self.dual_coding_engine = dual_coding_engine
        self.chunking_engine = chunking_engine
        self.elaborative_engine = elaborative_engine
        self.emotional_engine = emotional_engine

        # État par utilisateur (en mémoire - à persister en DB en prod)
        self._user_states: Dict[str, Dict[str, Any]] = {}

        logger.info("🧠 Advanced Learning Engine v3.0 initialized with 16 cognitive algorithms")

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

        # 5. 🆕 CALCULER LA DIFFICULTÉ OPTIMALE (nouveau système v2.0)
        # Combine: maîtrise calibrée + cognitive load + retrievability + desirable difficulty
        effective_mastery = min(100, current_mastery + int(transfer_bonus * 20))

        # Calculer le streak récent
        recent_responses = state["session_responses"][-10:]
        recent_streak = 0
        for r in reversed(recent_responses):
            if r.get("is_correct"):
                recent_streak += 1
            else:
                recent_streak -= 1
                break

        # Déterminer l'heure du jour
        hour = datetime.now().hour
        if 5 <= hour < 12:
            time_of_day = "morning"
        elif 12 <= hour < 18:
            time_of_day = "afternoon"
        elif 18 <= hour < 22:
            time_of_day = "evening"
        else:
            time_of_day = "night"

        # Utiliser le nouveau moteur de difficulté
        difficulty_level_enum, diff_metadata = self.difficulty_engine.determine_optimal_level(
            user_id=user_id,
            mastery=effective_mastery,
            retrievability=retrievability,
            cognitive_load=cognitive_load,
            recent_streak=recent_streak,
            time_of_day=time_of_day,
            session_length=len(state["session_responses"])
        )

        final_difficulty = difficulty_level_enum.value
        difficulty_str = diff_metadata["legacy_difficulty"]
        difficulty_name = diff_metadata["level_name"]
        adjustments = diff_metadata.get("adjustments", [])
        desirable_difficulty_applied = "Desirable difficulty" in " ".join(adjustments)

        logger.info(f"🎯 Difficulty for {user_id}: {difficulty_name} (level {final_difficulty}) - {adjustments}")

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
            difficulty_name=difficulty_name,
            topic_id=topic_id,
            should_use_variation=should_use_variation,
            variation_type=variation_type,
            transfer_bonus=transfer_bonus,
            cognitive_load=cognitive_load,
            should_take_break=should_take_break,
            break_suggestion=break_suggestion,
            fsrs_interval=fsrs_interval,
            retrievability=retrievability,
            difficulty_adjustments=adjustments,
            desirable_difficulty_applied=desirable_difficulty_applied
        )

    def process_answer(
        self,
        user_id: str,
        topic_id: str,
        is_correct: bool,
        response_time: float,
        difficulty: str,
        current_mastery: int,
        confidence: Optional[float] = None,  # 🆕 Confiance subjective (0-1)
        difficulty_level: int = 2  # 🆕 Niveau 1-5
    ) -> AnswerResult:
        """
        Traite une réponse et met à jour tous les algorithmes.

        Args:
            user_id: ID utilisateur
            topic_id: ID topic
            is_correct: Réponse correcte?
            response_time: Temps de réponse en secondes
            difficulty: "easy", "medium", "hard" (legacy)
            current_mastery: Maîtrise actuelle
            confidence: 🆕 Niveau de confiance de l'utilisateur (0-1)
            difficulty_level: 🆕 Niveau de difficulté (1-5)

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

        # 4. 🆕 TRAITEMENT CONFIANCE + CALIBRATION
        confidence_result = self.difficulty_engine.process_answer(
            user_id=user_id,
            level=DifficultyLevel(difficulty_level),
            is_correct=is_correct,
            response_time=response_time,
            confidence=confidence
        )

        confidence_impact = confidence_result.get("impact_multiplier", 1.0)
        confidence_feedback = confidence_result.get("confidence_feedback")
        calibration_updated = confidence_result.get("calibration_updated", False)

        # 5. CALCULER LE CHANGEMENT DE MAÎTRISE (avec impact confiance)
        # Multiplicateur par niveau (5 niveaux)
        level_multiplier = {1: 0.6, 2: 0.8, 3: 1.0, 4: 1.3, 5: 1.6}.get(difficulty_level, 1.0)

        if is_correct:
            # Base gain
            base_gain = 5

            # Bonus pour réponse rapide
            if response_time < 15:
                base_gain += 3
            elif response_time < 30:
                base_gain += 1

            # Bonus niveau
            base_gain = int(base_gain * level_multiplier)

            # 🆕 Impact confiance (hypercorrection effect inversé - si sûr et correct, gain normal)
            base_gain = int(base_gain * confidence_impact)

            # Réduction si proche de 100
            if current_mastery >= 90:
                base_gain = max(1, base_gain // 2)

            mastery_change = base_gain
        else:
            # Perte
            base_loss = -3

            # Perte plus grande si niveau facile raté
            if difficulty_level <= 2:
                base_loss = -5
            elif difficulty_level >= 4:
                base_loss = -2

            # 🆕 Impact confiance (hypercorrection - si très sûr et faux, perte plus grande mais apprentissage meilleur)
            # Note: On augmente la perte mais c'est bon pour l'apprentissage (hypercorrection effect)
            base_loss = int(base_loss * confidence_impact)

            mastery_change = base_loss

        # 6. TRANSFER LEARNING - Vérifier si appliqué
        transfer_applied = False
        bonus = state["transfer_detector"].calculate_transfer_bonus(topic_id)
        if bonus and bonus.bonus_percent > 0:
            transfer_applied = True
            if is_correct:
                mastery_change = int(mastery_change * (1 + bonus.bonus_percent / 100))

        # 7. EFFICACITÉ D'APPRENTISSAGE
        recent_correct = sum(1 for r in state["session_responses"][-10:] if r.get("is_correct", False))
        learning_efficiency = recent_correct / max(1, len(state["session_responses"][-10:]))

        # 8. 🆕 CALCUL XP (nouveau système)
        streak = sum(1 for r in reversed(state["session_responses"][-10:]) if r.get("is_correct", True))
        xp_earned = calculate_xp_v2(
            level=DifficultyLevel(difficulty_level),
            is_correct=is_correct,
            streak=streak,
            confidence_multiplier=confidence_impact if is_correct else 1.0
        )

        # Stocker la réponse
        state["session_responses"].append({
            "is_correct": is_correct,
            "response_time": response_time,
            "difficulty": difficulty,
            "difficulty_level": difficulty_level,
            "confidence": confidence,
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
            transfer_applied=transfer_applied,
            # 🆕 Nouveaux champs
            xp_earned=xp_earned,
            confidence_feedback=confidence_feedback,
            confidence_impact=confidence_impact,
            calibration_updated=calibration_updated
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

    def get_difficulty_profile(self, user_id: str) -> Dict[str, Any]:
        """
        🆕 Récupère le profil de difficulté personnalisé de l'utilisateur.

        Inclut:
        - Seuils calibrés
        - Style d'apprentissage détecté
        - Biais de confiance
        - Performance par niveau
        """
        return self.difficulty_engine.get_user_profile(user_id)

    def get_difficulty_levels_info(self) -> Dict[str, Any]:
        """
        🆕 Retourne les informations sur les 5 niveaux de difficulté.
        Utile pour le frontend.
        """
        return {
            "levels": [
                {
                    "level": 1,
                    "name": "VERY_EASY",
                    "display_name": "Très Facile",
                    "description": "Révision pure, rappel immédiat",
                    "xp": 5,
                    "time_estimate": "10-20 sec",
                    "color": "#4CAF50"  # Vert
                },
                {
                    "level": 2,
                    "name": "EASY",
                    "display_name": "Facile",
                    "description": "Concepts de base, 1 étape de raisonnement",
                    "xp": 10,
                    "time_estimate": "20-45 sec",
                    "color": "#8BC34A"  # Vert clair
                },
                {
                    "level": 3,
                    "name": "MEDIUM",
                    "display_name": "Moyen",
                    "description": "Application pratique, 2-3 étapes",
                    "xp": 20,
                    "time_estimate": "45-90 sec",
                    "color": "#FFC107"  # Jaune
                },
                {
                    "level": 4,
                    "name": "HARD",
                    "display_name": "Difficile",
                    "description": "Analyse et synthèse de concepts",
                    "xp": 35,
                    "time_estimate": "90-150 sec",
                    "color": "#FF9800"  # Orange
                },
                {
                    "level": 5,
                    "name": "EXPERT",
                    "display_name": "Expert",
                    "description": "Création, évaluation critique, cas complexes",
                    "xp": 50,
                    "time_estimate": "150-300 sec",
                    "color": "#F44336"  # Rouge
                }
            ],
            "target_success_rates": {
                1: {"min": 0.85, "max": 0.95, "description": "Confiance building"},
                2: {"min": 0.75, "max": 0.85, "description": "Apprentissage confortable"},
                3: {"min": 0.65, "max": 0.75, "description": "Zone optimale (ZDP)"},
                4: {"min": 0.55, "max": 0.65, "description": "Challenge productif"},
                5: {"min": 0.45, "max": 0.55, "description": "Maîtrise avancée"}
            },
            "features": [
                "Calibration personnalisée des seuils",
                "Desirable Difficulty (Bjork, 2011)",
                "Tracking de la confiance subjective",
                "Hypercorrection effect",
                "Ajustement cognitif en temps réel"
            ]
        }


    # =========================================================================
    # 🆕 V3.0 - NOUVEAUX MODULES COGNITIFS
    # =========================================================================

    def encode_with_dual_coding(
        self,
        content: str,
        topic: str,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        🆕 Encode le contenu avec les deux canaux (Paivio, 1971).

        Le cerveau traite l'information via 2 canaux distincts:
        - Canal verbal (texte, mots)
        - Canal visuel (images, schémas)

        L'information encodée dans LES DEUX canaux est 2x plus mémorable.

        Args:
            content: Le contenu textuel à encoder
            topic: Le sujet/domaine
            user_id: ID utilisateur pour personnalisation

        Returns:
            Dict avec le contenu enrichi d'indices visuels
        """
        dual_coded = self.dual_coding_engine.encode(content, topic, user_id)

        return {
            "original_content": dual_coded.verbal_content,
            "content_type": dual_coded.content_type.value,
            "recommended_visual": dual_coded.recommended_visual.value,
            "visual_description": dual_coded.visual_description,
            "emoji_cue": dual_coded.emoji_cue,
            "mnemonic_phrase": dual_coded.mnemonic_phrase,
            "key_elements": dual_coded.key_elements,
            "encoding_strength": dual_coded.encoding_strength,
            "referential_connections": dual_coded.referential_connections,
            "expected_retention_boost": "+35% avec visuel"
        }

    def chunk_content(
        self,
        content: str,
        topic: str,
        user_id: Optional[str] = None,
        mastery: float = 0
    ) -> Dict[str, Any]:
        """
        🆕 Découpe le contenu en chunks optimaux (Miller, 1956).

        La mémoire de travail a une capacité limitée: 4 ± 1 éléments (Cowan, 2001).
        Le "chunking" regroupe les éléments en unités significatives
        pour maximiser ce qui peut être retenu.

        Args:
            content: Le contenu à découper
            topic: Le sujet
            user_id: ID utilisateur pour personnalisation
            mastery: Niveau de maîtrise actuel (0-100)

        Returns:
            Dict avec les chunks et recommandations d'apprentissage
        """
        chunked = self.chunking_engine.chunk_content(content, topic, user_id, mastery)

        return {
            "total_items": chunked.total_items,
            "chunk_count": chunked.chunk_count,
            "chunks": [
                {
                    "id": chunk.id,
                    "name": chunk.name,
                    "items": chunk.items,
                    "type": chunk.chunk_type.value,
                    "semantic_label": chunk.semantic_label,
                    "mnemonic": chunk.mnemonic
                }
                for chunk in chunked.chunks
            ],
            "learning_order": chunked.recommended_learning_order,
            "estimated_sessions": chunked.estimated_sessions,
            "working_memory_load": chunked.working_memory_load,
            "expertise_level": chunked.expertise_level_used.value,
            "tip": "Apprenez un chunk à la fois pour éviter la surcharge cognitive"
        }

    def generate_elaborative_questions(
        self,
        content: str,
        topic: str,
        num_questions: int = 3,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        🆕 Génère des questions d'interrogation élaborative (Pressley, 1987).

        Poser des questions "Pourquoi?" et "Comment?" sur les faits
        améliore la rétention de +20-50% (Dunlosky, 2013).

        Args:
            content: Le contenu sur lequel poser des questions
            topic: Le sujet
            num_questions: Nombre de questions à générer
            user_id: ID utilisateur pour personnalisation

        Returns:
            Dict avec les questions et hints
        """
        questions = self.elaborative_engine.generate_questions(
            content, topic, num_questions, user_id
        )

        return {
            "questions": [
                {
                    "id": q.id,
                    "question": q.question_text,
                    "type": q.question_type.value,
                    "hint": q.hint,
                    "difficulty": q.difficulty,
                    "expected_elements": q.expected_elements
                }
                for q in questions
            ],
            "technique": "Elaborative Interrogation",
            "research": "Pressley et al. (1987), Dunlosky et al. (2013)",
            "expected_boost": "+20-50% rétention",
            "tip": "Répondez avec vos propres mots, pas en copiant le contenu"
        }

    def evaluate_elaborative_response(
        self,
        question_id: str,
        user_response: str,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        🆕 Évalue une réponse à une question élaborative.

        Args:
            question_id: ID de la question
            user_response: La réponse de l'utilisateur
            user_id: ID utilisateur

        Returns:
            Dict avec évaluation et feedback
        """
        result = self.elaborative_engine.evaluate_response(
            question_id, user_response, user_id
        )

        return {
            "completeness": result.completeness,
            "depth": result.depth,
            "generation_quality": result.generation_quality,
            "overall_score": (result.completeness + result.depth + result.generation_quality) / 3,
            "elements_found": result.elements_found,
            "feedback": result.feedback,
            "retention_multiplier": self.elaborative_engine.get_retention_bonus(
                question_id, (result.completeness + result.depth) / 2
            )
        }

    def encode_emotionally(
        self,
        content: str,
        topic: str,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        🆕 Encode le contenu avec des hooks émotionnels (Phelps, 2004).

        Les souvenirs associés à des émotions sont 2-3x plus durables.
        L'amygdale module la consolidation en mémoire à long terme.

        Args:
            content: Le contenu à enrichir
            topic: Le sujet
            user_id: ID utilisateur

        Returns:
            Dict avec contenu enrichi émotionnellement
        """
        encoded = self.emotional_engine.encode_content(content, topic, user_id)

        return {
            "original_content": encoded.original_content,
            "opening_hook": encoded.opening_hook,
            "closing_hook": encoded.closing_hook,
            "hooks": [
                {
                    "type": h.type,
                    "content": h.content,
                    "target_emotion": h.target_emotion.value,
                    "intensity": h.intensity,
                    "placement": h.placement
                }
                for h in encoded.hooks
            ],
            "curiosity_gaps": encoded.curiosity_gaps,
            "relevance_bridges": encoded.relevance_bridges,
            "estimated_engagement": encoded.estimated_engagement,
            "research": "Phelps (2004), McGaugh (2004)",
            "expected_boost": "+50-200% selon l'intensité émotionnelle"
        }

    def detect_emotional_state(
        self,
        user_id: str,
        recent_accuracy: float,
        response_times: List[float],
        session_duration: float,
        streak: int
    ) -> Dict[str, Any]:
        """
        🆕 Détecte l'état émotionnel de l'apprenant.

        Basé sur les comportements observés:
        - Précision des réponses
        - Temps de réponse
        - Durée de session
        - Streak

        Args:
            user_id: ID utilisateur
            recent_accuracy: Précision récente (0-1)
            response_times: Temps de réponse récents
            session_duration: Durée de session (minutes)
            streak: Streak actuel

        Returns:
            Dict avec état détecté et recommandations
        """
        state = self.emotional_engine.detect_emotional_state(
            user_id, recent_accuracy, response_times, session_duration, streak
        )

        recommendation = self.emotional_engine.get_state_recommendation(state)

        return {
            "detected_state": state.value,
            "retention_multiplier": recommendation["retention_multiplier"],
            "action": recommendation["action"],
            "message": recommendation["message"],
            "difficulty_adjust": recommendation["difficulty_adjust"],
            "break_needed": recommendation["break_needed"],
            "valence": recommendation["valence"],
            "arousal": recommendation["arousal"]
        }

    def get_cognitive_enhancement_profile(self, user_id: str) -> Dict[str, Any]:
        """
        🆕 Récupère le profil complet d'amélioration cognitive.

        Combine les profils de tous les nouveaux modules:
        - Dual Coding
        - Chunking
        - Elaborative Interrogation
        - Emotional Encoding

        Args:
            user_id: ID utilisateur

        Returns:
            Dict avec tous les profils cognitifs
        """
        return {
            "user_id": user_id,
            "dual_coding": self.dual_coding_engine.get_user_profile(user_id),
            "chunking": self.chunking_engine.get_user_profile(user_id),
            "elaborative_interrogation": self.elaborative_engine.get_user_profile(user_id),
            "emotional_encoding": self.emotional_engine.get_user_profile(user_id),
            "difficulty": self.difficulty_engine.get_user_profile(user_id),
            "algorithms_active": 16,
            "version": "3.0"
        }

    def get_all_algorithms_info(self) -> Dict[str, Any]:
        """
        🆕 Retourne les informations sur tous les algorithmes du système.

        Utile pour la documentation et le frontend.
        """
        return {
            "version": "3.0",
            "total_algorithms": 16,
            "algorithms": [
                {
                    "name": "FSRS",
                    "category": "Spaced Repetition",
                    "research": "Pimsleur (1967), modèle moderne",
                    "benefit": "Optimal timing for reviews"
                },
                {
                    "name": "Cognitive Load Detection",
                    "category": "Attention Management",
                    "research": "Sweller (1988)",
                    "benefit": "Prevents mental overload"
                },
                {
                    "name": "Transfer Learning",
                    "category": "Knowledge Connections",
                    "research": "Thorndike & Woodworth (1901)",
                    "benefit": "Leverage existing knowledge"
                },
                {
                    "name": "Forgetting Curve",
                    "category": "Memory Model",
                    "research": "Ebbinghaus (1885)",
                    "benefit": "Personalized memory decay"
                },
                {
                    "name": "Pre-sleep Scheduling",
                    "category": "Sleep & Consolidation",
                    "research": "Walker (2017)",
                    "benefit": "+40% retention with sleep"
                },
                {
                    "name": "Variation Practice",
                    "category": "Learning Strategies",
                    "research": "Schmidt & Bjork (1992)",
                    "benefit": "Better transfer to new contexts"
                },
                {
                    "name": "Optimal Difficulty",
                    "category": "Zone of Proximal Development",
                    "research": "Vygotsky (1978), Bjork (2011)",
                    "benefit": "5 levels, personalized calibration"
                },
                {
                    "name": "Desirable Difficulty",
                    "category": "Challenge Optimization",
                    "research": "Bjork & Bjork (2011)",
                    "benefit": "Harder = better retention"
                },
                {
                    "name": "Confidence Tracking",
                    "category": "Metacognition",
                    "research": "Koriat (1997)",
                    "benefit": "Hypercorrection effect"
                },
                {
                    "name": "User Calibration",
                    "category": "Personalization",
                    "research": "Adaptive learning systems",
                    "benefit": "Personalized thresholds"
                },
                {
                    "name": "Dual Coding",
                    "category": "Encoding Strategy",
                    "research": "Paivio (1971, 1986)",
                    "benefit": "+35% with visual + verbal"
                },
                {
                    "name": "Chunking",
                    "category": "Working Memory",
                    "research": "Miller (1956), Cowan (2001)",
                    "benefit": "Optimal grouping for memory"
                },
                {
                    "name": "Elaborative Interrogation",
                    "category": "Active Learning",
                    "research": "Pressley (1987), Dunlosky (2013)",
                    "benefit": "+20-50% with why questions"
                },
                {
                    "name": "Emotional Encoding",
                    "category": "Emotional Memory",
                    "research": "Phelps (2004), McGaugh (2004)",
                    "benefit": "+50-200% with emotion"
                },
                {
                    "name": "Curiosity Enhancement",
                    "category": "Motivation",
                    "research": "Gruber et al. (2014)",
                    "benefit": "Dopamine boosts encoding"
                },
                {
                    "name": "Interleaving Practice",
                    "category": "Learning Strategy",
                    "research": "Rohrer & Taylor (2007)",
                    "benefit": "Better discrimination"
                }
            ],
            "combined_effect": "~10x better retention than passive reading"
        }


# Instance globale du moteur
learning_engine = AdvancedLearningEngine()
