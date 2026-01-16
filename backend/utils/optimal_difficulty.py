"""
🎯 OPTIMAL DIFFICULTY SYSTEM v2.0
Système de difficulté avancé basé sur la recherche cognitive.

Améliorations par rapport à v1:
1. 5 niveaux au lieu de 3 (plus granulaire)
2. Calibration personnalisée par utilisateur
3. Desirable Difficulty (Bjork, 2011)
4. Tracking de la confiance subjective

Références scientifiques:
- Bjork, R.A. (2011) - "Desirable difficulties perspective on learning"
- Vygotsky (1978) - Zone of Proximal Development
- Metcalfe & Kornell (2005) - "Region of proximal learning"
- Dunlosky et al. (2013) - "Improving students' learning"
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass, field
from enum import IntEnum
import math

logger = logging.getLogger(__name__)


class DifficultyLevel(IntEnum):
    """5 niveaux de difficulté (plus granulaire que easy/medium/hard)"""
    VERY_EASY = 1      # Révision pure, rappel immédiat
    EASY = 2           # Concepts de base, 1 étape
    MEDIUM = 3         # Application, 2-3 étapes
    HARD = 4           # Analyse, synthèse
    EXPERT = 5         # Création, évaluation critique


# Mapping vers l'ancien système (rétrocompatibilité)
LEVEL_TO_LEGACY = {
    DifficultyLevel.VERY_EASY: "easy",
    DifficultyLevel.EASY: "easy",
    DifficultyLevel.MEDIUM: "medium",
    DifficultyLevel.HARD: "hard",
    DifficultyLevel.EXPERT: "hard"
}

LEGACY_TO_LEVEL = {
    "easy": DifficultyLevel.EASY,
    "medium": DifficultyLevel.MEDIUM,
    "hard": DifficultyLevel.HARD
}


@dataclass
class UserCalibration:
    """
    Calibration personnalisée des seuils par utilisateur.

    Les seuils s'ajustent automatiquement selon les performances
    pour trouver la ZDP optimale de chaque individu.
    """
    user_id: str

    # Seuils de maîtrise pour chaque niveau (calibrés dynamiquement)
    # Format: mastery_threshold[level] = seuil minimal pour ce niveau
    mastery_thresholds: Dict[int, float] = field(default_factory=lambda: {
        1: 0,    # VERY_EASY: toujours accessible
        2: 15,   # EASY: dès 15% maîtrise
        3: 35,   # MEDIUM: dès 35% maîtrise
        4: 60,   # HARD: dès 60% maîtrise
        5: 80    # EXPERT: dès 80% maîtrise
    })

    # Success rate cible par niveau (ZDP optimale)
    target_success_rates: Dict[int, Tuple[float, float]] = field(default_factory=lambda: {
        1: (0.85, 0.95),  # VERY_EASY: 85-95% (confiance building)
        2: (0.75, 0.85),  # EASY: 75-85%
        3: (0.65, 0.75),  # MEDIUM: 65-75% (sweet spot)
        4: (0.55, 0.65),  # HARD: 55-65%
        5: (0.45, 0.55),  # EXPERT: 45-55% (challenging)
    })

    # Historique des performances par niveau
    performance_history: Dict[int, List[Dict]] = field(default_factory=lambda: {
        1: [], 2: [], 3: [], 4: [], 5: []
    })

    # Facteur de "desirable difficulty" (0-1)
    # Plus élevé = on pousse vers des difficultés plus hautes
    desirable_difficulty_factor: float = 0.3

    # Préférence d'apprentissage détectée
    learning_style: str = "balanced"  # "cautious", "balanced", "aggressive"

    # Dernière calibration
    last_calibration: datetime = field(default_factory=datetime.now)
    calibration_count: int = 0

    def record_attempt(self, level: int, is_correct: bool, response_time: float,
                       confidence: Optional[float] = None):
        """Enregistre une tentative pour calibration"""
        if level not in self.performance_history:
            self.performance_history[level] = []

        self.performance_history[level].append({
            "timestamp": datetime.now(),
            "is_correct": is_correct,
            "response_time": response_time,
            "confidence": confidence
        })

        # Garder seulement les 50 dernières tentatives par niveau
        if len(self.performance_history[level]) > 50:
            self.performance_history[level] = self.performance_history[level][-50:]

    def get_success_rate(self, level: int, window: int = 20) -> Optional[float]:
        """Calcule le success rate récent pour un niveau"""
        history = self.performance_history.get(level, [])
        if len(history) < 3:
            return None

        recent = history[-window:]
        return sum(1 for h in recent if h["is_correct"]) / len(recent)

    def recalibrate(self):
        """
        Recalibre les seuils selon les performances observées.

        Principe: Si success_rate trop haut → baisser le seuil (monter plus vite)
                  Si success_rate trop bas → augmenter le seuil (monter moins vite)
        """
        adjustments_made = False

        for level in range(1, 6):
            sr = self.get_success_rate(level)
            if sr is None:
                continue

            target_min, target_max = self.target_success_rates[level]
            current_threshold = self.mastery_thresholds[level]

            if sr > target_max + 0.1:
                # Trop facile → baisser le seuil (accéder plus tôt à ce niveau)
                adjustment = -5
                self.mastery_thresholds[level] = max(0, current_threshold + adjustment)
                adjustments_made = True
                logger.info(f"📉 Calibration: Level {level} threshold {current_threshold}→{self.mastery_thresholds[level]} (trop facile)")

            elif sr < target_min - 0.1:
                # Trop difficile → augmenter le seuil (accéder plus tard)
                adjustment = 5
                self.mastery_thresholds[level] = min(95, current_threshold + adjustment)
                adjustments_made = True
                logger.info(f"📈 Calibration: Level {level} threshold {current_threshold}→{self.mastery_thresholds[level]} (trop dur)")

        # Détecter le style d'apprentissage
        self._detect_learning_style()

        if adjustments_made:
            self.last_calibration = datetime.now()
            self.calibration_count += 1

    def _detect_learning_style(self):
        """Détecte le style d'apprentissage basé sur les patterns"""
        hard_sr = self.get_success_rate(4)
        expert_sr = self.get_success_rate(5)
        easy_sr = self.get_success_rate(2)

        if hard_sr and expert_sr:
            avg_hard = (hard_sr + (expert_sr or hard_sr)) / 2
            if avg_hard > 0.7:
                self.learning_style = "aggressive"
                self.desirable_difficulty_factor = 0.5
            elif avg_hard < 0.4:
                self.learning_style = "cautious"
                self.desirable_difficulty_factor = 0.1
            else:
                self.learning_style = "balanced"
                self.desirable_difficulty_factor = 0.3


@dataclass
class ConfidenceTracker:
    """
    Tracking de la confiance subjective.

    Basé sur: Metcalfe & Kornell (2005) - Les erreurs avec haute confiance
    sont plus informatives et devraient impacter plus l'apprentissage.
    """

    # Historique: (confidence, is_correct, impact_multiplier)
    history: List[Dict] = field(default_factory=list)

    # Calibration de la confiance (overconfidence vs underconfidence)
    confidence_bias: float = 0.0  # Positif = overconfident, négatif = underconfident

    def record(self, confidence: float, is_correct: bool):
        """
        Enregistre une réponse avec confiance.

        Args:
            confidence: 0.0 (pas sûr) à 1.0 (certain)
            is_correct: Réponse correcte?
        """
        # Calculer l'impact multiplier
        # Erreur avec haute confiance = très informatif (hypercorrection)
        # Succès avec basse confiance = encourageant

        if is_correct:
            if confidence < 0.3:
                impact = 1.5  # "Tu savais plus que tu croyais!"
            elif confidence > 0.8:
                impact = 1.0  # Normal
            else:
                impact = 1.2
        else:
            if confidence > 0.8:
                impact = 2.0  # Hypercorrection effect - très important
            elif confidence < 0.3:
                impact = 0.8  # "Tu savais que tu ne savais pas"
            else:
                impact = 1.3

        self.history.append({
            "timestamp": datetime.now(),
            "confidence": confidence,
            "is_correct": is_correct,
            "impact_multiplier": impact
        })

        # Garder les 100 dernières
        if len(self.history) > 100:
            self.history = self.history[-100:]

        # Mettre à jour le biais
        self._update_bias()

    def _update_bias(self):
        """Calcule le biais de confiance (overconfidence/underconfidence)"""
        if len(self.history) < 10:
            return

        recent = self.history[-30:]

        # Comparer confiance moyenne avec success rate réel
        avg_confidence = sum(h["confidence"] for h in recent) / len(recent)
        actual_success = sum(1 for h in recent if h["is_correct"]) / len(recent)

        self.confidence_bias = avg_confidence - actual_success

    def get_impact_multiplier(self, confidence: float, is_correct: bool) -> float:
        """Retourne le multiplicateur d'impact pour une réponse"""
        if is_correct:
            if confidence < 0.3:
                return 1.5
            elif confidence > 0.8:
                return 1.0
            else:
                return 1.2
        else:
            if confidence > 0.8:
                return 2.0  # Hypercorrection
            elif confidence < 0.3:
                return 0.8
            else:
                return 1.3

    def get_feedback_message(self, confidence: float, is_correct: bool) -> str:
        """Génère un message de feedback basé sur confiance/résultat"""
        if is_correct:
            if confidence < 0.3:
                return "🎉 Tu savais plus que tu ne croyais! Aie confiance en toi."
            elif confidence > 0.8:
                return "✅ Bien joué, tu maîtrises!"
            else:
                return "👍 Correct!"
        else:
            if confidence > 0.8:
                return "⚠️ Attention à l'overconfidence! Cette erreur est importante à retenir."
            elif confidence < 0.3:
                return "📚 Normal de ne pas savoir - c'est comme ça qu'on apprend."
            else:
                return "❌ Pas grave, on révise et on continue."


class OptimalDifficultyEngine:
    """
    Moteur de difficulté optimale v2.0

    Combine:
    - 5 niveaux granulaires
    - Calibration personnalisée
    - Desirable difficulty
    - Confidence tracking
    """

    def __init__(self):
        # Calibrations par utilisateur
        self._user_calibrations: Dict[str, UserCalibration] = {}
        self._confidence_trackers: Dict[str, ConfidenceTracker] = {}

        logger.info("🎯 Optimal Difficulty Engine v2.0 initialized")

    def get_calibration(self, user_id: str) -> UserCalibration:
        """Récupère ou crée la calibration d'un utilisateur"""
        if user_id not in self._user_calibrations:
            self._user_calibrations[user_id] = UserCalibration(user_id=user_id)
        return self._user_calibrations[user_id]

    def get_confidence_tracker(self, user_id: str) -> ConfidenceTracker:
        """Récupère ou crée le tracker de confiance"""
        if user_id not in self._confidence_trackers:
            self._confidence_trackers[user_id] = ConfidenceTracker()
        return self._confidence_trackers[user_id]

    def determine_optimal_level(
        self,
        user_id: str,
        mastery: float,  # 0-100
        retrievability: float = 1.0,  # 0-1 (FSRS)
        cognitive_load: str = "optimal",  # optimal/elevated/high/overload
        recent_streak: int = 0,
        time_of_day: Optional[str] = None,  # morning/afternoon/evening/night
        session_length: int = 0,  # questions déjà faites dans la session
    ) -> Tuple[DifficultyLevel, Dict[str, Any]]:
        """
        Détermine le niveau de difficulté optimal.

        Returns:
            (level, metadata) où metadata contient les raisons et ajustements
        """
        calibration = self.get_calibration(user_id)
        metadata = {"adjustments": [], "base_level": None}

        # 1. NIVEAU DE BASE selon maîtrise calibrée
        base_level = DifficultyLevel.VERY_EASY
        for level in range(5, 0, -1):
            if mastery >= calibration.mastery_thresholds[level]:
                base_level = DifficultyLevel(level)
                break

        metadata["base_level"] = base_level.value
        final_level = base_level.value

        # 2. DESIRABLE DIFFICULTY (Bjork, 2011)
        # Pousser légèrement vers le haut si conditions favorables
        if (retrievability > 0.7 and
            cognitive_load == "optimal" and
            recent_streak >= 2 and
            session_length < 15):

            dd_boost = calibration.desirable_difficulty_factor
            if dd_boost > 0 and final_level < 5:
                # Probabilité de monter d'un niveau
                import random
                if random.random() < dd_boost:
                    final_level = min(5, final_level + 1)
                    metadata["adjustments"].append(
                        f"📈 Desirable difficulty: +1 (boost learning)"
                    )

        # 3. AJUSTEMENTS NÉGATIFS

        # Fatigue cognitive
        cognitive_penalty = {
            "optimal": 0,
            "elevated": -1,
            "high": -2,
            "overload": -3
        }.get(cognitive_load, 0)

        if cognitive_penalty:
            final_level = max(1, final_level + cognitive_penalty)
            metadata["adjustments"].append(
                f"🧠 Cognitive load ({cognitive_load}): {cognitive_penalty}"
            )

        # Retrievability faible (risque d'oubli)
        if retrievability < 0.5:
            final_level = max(1, final_level - 1)
            metadata["adjustments"].append(
                f"📉 Low retrievability ({retrievability:.0%}): -1"
            )
        elif retrievability < 0.7:
            # Légère réduction
            if final_level > 2:
                final_level -= 1
                metadata["adjustments"].append(
                    f"📊 Medium retrievability ({retrievability:.0%}): -1"
                )

        # Session longue (fatigue)
        if session_length > 20:
            final_level = max(1, final_level - 1)
            metadata["adjustments"].append(
                f"⏰ Long session ({session_length} questions): -1"
            )

        # Heure tardive
        if time_of_day == "night":
            final_level = max(1, final_level - 1)
            metadata["adjustments"].append("🌙 Late night: -1")

        # 4. STREAK NÉGATIF (plusieurs erreurs récentes)
        if recent_streak < -2:
            final_level = max(1, final_level - 1)
            metadata["adjustments"].append(
                f"❌ Error streak ({recent_streak}): -1"
            )

        final_level_enum = DifficultyLevel(final_level)
        metadata["final_level"] = final_level
        metadata["level_name"] = final_level_enum.name
        metadata["legacy_difficulty"] = LEVEL_TO_LEGACY[final_level_enum]

        return final_level_enum, metadata

    def process_answer(
        self,
        user_id: str,
        level: DifficultyLevel,
        is_correct: bool,
        response_time: float,
        confidence: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Traite une réponse et met à jour les calibrations.

        Returns:
            Dict avec impact_multiplier, feedback, calibration_update
        """
        calibration = self.get_calibration(user_id)
        result = {
            "impact_multiplier": 1.0,
            "feedback": None,
            "confidence_feedback": None,
            "calibration_updated": False
        }

        # Enregistrer pour calibration
        calibration.record_attempt(
            level=level.value,
            is_correct=is_correct,
            response_time=response_time,
            confidence=confidence
        )

        # Traitement de la confiance
        if confidence is not None:
            tracker = self.get_confidence_tracker(user_id)
            tracker.record(confidence, is_correct)

            result["impact_multiplier"] = tracker.get_impact_multiplier(confidence, is_correct)
            result["confidence_feedback"] = tracker.get_feedback_message(confidence, is_correct)
            result["confidence_bias"] = tracker.confidence_bias

        # Recalibrer périodiquement (tous les 20 réponses)
        total_responses = sum(len(h) for h in calibration.performance_history.values())
        if total_responses % 20 == 0:
            calibration.recalibrate()
            result["calibration_updated"] = True
            result["new_thresholds"] = calibration.mastery_thresholds.copy()
            result["learning_style"] = calibration.learning_style

        return result

    def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Retourne le profil de difficulté de l'utilisateur"""
        calibration = self.get_calibration(user_id)
        tracker = self.get_confidence_tracker(user_id)

        profile = {
            "user_id": user_id,
            "calibration": {
                "thresholds": calibration.mastery_thresholds,
                "target_success_rates": {
                    k: {"min": v[0], "max": v[1]}
                    for k, v in calibration.target_success_rates.items()
                },
                "desirable_difficulty_factor": calibration.desirable_difficulty_factor,
                "learning_style": calibration.learning_style,
                "calibration_count": calibration.calibration_count
            },
            "confidence": {
                "bias": tracker.confidence_bias,
                "interpretation": (
                    "overconfident" if tracker.confidence_bias > 0.1 else
                    "underconfident" if tracker.confidence_bias < -0.1 else
                    "well-calibrated"
                )
            },
            "performance_by_level": {}
        }

        for level in range(1, 6):
            sr = calibration.get_success_rate(level)
            history = calibration.performance_history.get(level, [])
            profile["performance_by_level"][level] = {
                "name": DifficultyLevel(level).name,
                "success_rate": sr,
                "attempts": len(history),
                "target_range": calibration.target_success_rates[level]
            }

        return profile


# XP par niveau (plus granulaire)
XP_BY_LEVEL = {
    DifficultyLevel.VERY_EASY: 5,
    DifficultyLevel.EASY: 10,
    DifficultyLevel.MEDIUM: 20,
    DifficultyLevel.HARD: 35,
    DifficultyLevel.EXPERT: 50
}

# Temps estimé par niveau (secondes)
TIME_ESTIMATE_BY_LEVEL = {
    DifficultyLevel.VERY_EASY: (10, 20),
    DifficultyLevel.EASY: (20, 45),
    DifficultyLevel.MEDIUM: (45, 90),
    DifficultyLevel.HARD: (90, 150),
    DifficultyLevel.EXPERT: (150, 300)
}


def calculate_xp_v2(
    level: DifficultyLevel,
    is_correct: bool,
    streak: int,
    confidence_multiplier: float = 1.0
) -> int:
    """Calcule l'XP avec le nouveau système"""
    if not is_correct:
        return 0

    base_xp = XP_BY_LEVEL[level]

    # Bonus streak (cap à 2x)
    streak_multiplier = min(2.0, 1 + streak * 0.1)

    # Multiplicateur confiance
    final_xp = int(base_xp * streak_multiplier * confidence_multiplier)

    return final_xp


# Instance globale
optimal_difficulty_engine = OptimalDifficultyEngine()
