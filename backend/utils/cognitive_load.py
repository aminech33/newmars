"""
Cognitive Load Detection - Détection de la fatigue cognitive

Détecte quand l'élève est fatigué/surchargé via:
- Temps de réponse anormalement longs
- Augmentation du taux d'erreur
- Patterns de réponses erratiques
- Session trop longue

Actions recommandées:
- Suggérer une pause
- Réduire la difficulté
- Proposer du contenu plus léger
- Arrêter la session

Basé sur la recherche de Sweller (1988) et Paas (1992)
"""
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from statistics import mean, stdev
from collections import deque


# ═══════════════════════════════════════════════════════════════════════════════
# CONSTANTES
# ═══════════════════════════════════════════════════════════════════════════════

# Seuils de détection
RESPONSE_TIME_THRESHOLD = 2.0  # Facteur par rapport à la moyenne (2x = alerte)
ERROR_RATE_WINDOW = 5  # Nombre de questions pour calculer le taux d'erreur récent
ERROR_RATE_THRESHOLD = 0.6  # >60% d'erreurs sur les dernières questions = alerte
SESSION_FATIGUE_MINUTES = 25  # Après 25 min, suggérer une pause (Pomodoro)
MAX_SESSION_MINUTES = 45  # Après 45 min, fortement recommander une pause
CONSECUTIVE_ERRORS_ALERT = 3  # 3 erreurs consécutives = alerte
CONFIDENCE_DROP_THRESHOLD = 0.3  # Chute de confiance de 30% = alerte


@dataclass
class CognitiveLoadIndicator:
    """Indicateur de charge cognitive"""
    indicator_type: str  # "response_time", "error_rate", "session_length", etc.
    severity: str  # "low", "medium", "high", "critical"
    value: float
    threshold: float
    message: str


@dataclass
class CognitiveLoadAssessment:
    """Évaluation complète de la charge cognitive"""
    overall_load: str  # "optimal", "elevated", "high", "overload"
    load_score: float  # 0-1 (0=optimal, 1=surchargé)
    indicators: List[CognitiveLoadIndicator]
    recommendation: str  # Action recommandée
    should_pause: bool
    should_reduce_difficulty: bool
    estimated_focus_remaining: int  # Minutes de focus estimées restantes


class CognitiveLoadDetector:
    """
    Détecteur de charge cognitive en temps réel

    Usage:
        detector = CognitiveLoadDetector()
        detector.add_response(response_time=45, is_correct=True, difficulty="medium")
        assessment = detector.assess()
    """

    def __init__(self, session_start: datetime = None):
        self.session_start = session_start or datetime.now()
        self.responses: List[Dict[str, Any]] = []
        self.response_times: deque = deque(maxlen=20)  # Derniers 20 temps de réponse
        self.correctness: deque = deque(maxlen=10)  # Dernières 10 réponses
        self.confidences: deque = deque(maxlen=10)  # Dernières 10 confiances
        self.baseline_response_time: Optional[float] = None
        self.baseline_confidence: Optional[float] = None

    def add_response(
        self,
        response_time: int,
        is_correct: bool,
        difficulty: str = "medium",
        confidence: float = None,
        perceived_difficulty: str = None
    ):
        """Ajoute une réponse pour analyse"""
        response = {
            "timestamp": datetime.now(),
            "response_time": response_time,
            "is_correct": is_correct,
            "difficulty": difficulty,
            "confidence": confidence,
            "perceived_difficulty": perceived_difficulty
        }
        self.responses.append(response)
        self.response_times.append(response_time)
        self.correctness.append(is_correct)

        if confidence is not None:
            self.confidences.append(confidence)

        # Établir baseline après 5 réponses
        if len(self.response_times) == 5 and self.baseline_response_time is None:
            self.baseline_response_time = mean(self.response_times)

        if len(self.confidences) == 5 and self.baseline_confidence is None:
            self.baseline_confidence = mean(self.confidences)

    def _check_response_time(self) -> Optional[CognitiveLoadIndicator]:
        """Vérifie si les temps de réponse sont anormaux"""
        if len(self.response_times) < 5:
            return None

        recent_times = list(self.response_times)[-5:]
        recent_avg = mean(recent_times)

        baseline = self.baseline_response_time or mean(list(self.response_times)[:5])

        ratio = recent_avg / max(baseline, 1)

        if ratio >= 3.0:
            return CognitiveLoadIndicator(
                indicator_type="response_time",
                severity="critical",
                value=ratio,
                threshold=RESPONSE_TIME_THRESHOLD,
                message="Temps de réponse 3x plus lent - fatigue sévère détectée"
            )
        elif ratio >= 2.5:
            return CognitiveLoadIndicator(
                indicator_type="response_time",
                severity="high",
                value=ratio,
                threshold=RESPONSE_TIME_THRESHOLD,
                message="Temps de réponse très ralenti - pause recommandée"
            )
        elif ratio >= 2.0:
            return CognitiveLoadIndicator(
                indicator_type="response_time",
                severity="medium",
                value=ratio,
                threshold=RESPONSE_TIME_THRESHOLD,
                message="Temps de réponse en hausse - début de fatigue"
            )
        elif ratio >= 1.5:
            return CognitiveLoadIndicator(
                indicator_type="response_time",
                severity="low",
                value=ratio,
                threshold=RESPONSE_TIME_THRESHOLD,
                message="Légère augmentation du temps de réponse"
            )

        return None

    def _check_error_rate(self) -> Optional[CognitiveLoadIndicator]:
        """Vérifie le taux d'erreur récent"""
        if len(self.correctness) < ERROR_RATE_WINDOW:
            return None

        recent = list(self.correctness)[-ERROR_RATE_WINDOW:]
        error_rate = 1 - (sum(recent) / len(recent))

        if error_rate >= 0.8:
            return CognitiveLoadIndicator(
                indicator_type="error_rate",
                severity="critical",
                value=error_rate,
                threshold=ERROR_RATE_THRESHOLD,
                message=f"{int(error_rate*100)}% d'erreurs récentes - surcharge cognitive"
            )
        elif error_rate >= 0.7:
            return CognitiveLoadIndicator(
                indicator_type="error_rate",
                severity="high",
                value=error_rate,
                threshold=ERROR_RATE_THRESHOLD,
                message=f"{int(error_rate*100)}% d'erreurs récentes - difficulté trop élevée"
            )
        elif error_rate >= ERROR_RATE_THRESHOLD:
            return CognitiveLoadIndicator(
                indicator_type="error_rate",
                severity="medium",
                value=error_rate,
                threshold=ERROR_RATE_THRESHOLD,
                message=f"Taux d'erreur élevé ({int(error_rate*100)}%)"
            )

        return None

    def _check_consecutive_errors(self) -> Optional[CognitiveLoadIndicator]:
        """Vérifie les erreurs consécutives"""
        if len(self.correctness) < CONSECUTIVE_ERRORS_ALERT:
            return None

        recent = list(self.correctness)[-CONSECUTIVE_ERRORS_ALERT:]

        if not any(recent):  # Toutes fausses
            streak = CONSECUTIVE_ERRORS_ALERT

            # Compter la vraie streak
            for i in range(len(self.correctness) - 1, -1, -1):
                if list(self.correctness)[i]:
                    break
                streak = len(self.correctness) - i

            if streak >= 5:
                return CognitiveLoadIndicator(
                    indicator_type="consecutive_errors",
                    severity="critical",
                    value=streak,
                    threshold=CONSECUTIVE_ERRORS_ALERT,
                    message=f"{streak} erreurs consécutives - arrêt recommandé"
                )
            elif streak >= 4:
                return CognitiveLoadIndicator(
                    indicator_type="consecutive_errors",
                    severity="high",
                    value=streak,
                    threshold=CONSECUTIVE_ERRORS_ALERT,
                    message=f"{streak} erreurs consécutives - pause nécessaire"
                )
            else:
                return CognitiveLoadIndicator(
                    indicator_type="consecutive_errors",
                    severity="medium",
                    value=streak,
                    threshold=CONSECUTIVE_ERRORS_ALERT,
                    message=f"{streak} erreurs consécutives"
                )

        return None

    def _check_session_length(self) -> Optional[CognitiveLoadIndicator]:
        """Vérifie la durée de la session"""
        session_minutes = (datetime.now() - self.session_start).seconds / 60

        if session_minutes >= MAX_SESSION_MINUTES:
            return CognitiveLoadIndicator(
                indicator_type="session_length",
                severity="high",
                value=session_minutes,
                threshold=MAX_SESSION_MINUTES,
                message=f"Session de {int(session_minutes)} min - pause fortement recommandée"
            )
        elif session_minutes >= SESSION_FATIGUE_MINUTES:
            return CognitiveLoadIndicator(
                indicator_type="session_length",
                severity="medium",
                value=session_minutes,
                threshold=SESSION_FATIGUE_MINUTES,
                message=f"Session de {int(session_minutes)} min - pensez à faire une pause"
            )

        return None

    def _check_confidence_drop(self) -> Optional[CognitiveLoadIndicator]:
        """Vérifie la chute de confiance"""
        if len(self.confidences) < 5 or self.baseline_confidence is None:
            return None

        recent_confidence = mean(list(self.confidences)[-3:])
        drop = self.baseline_confidence - recent_confidence

        if drop >= 0.5:
            return CognitiveLoadIndicator(
                indicator_type="confidence_drop",
                severity="high",
                value=drop,
                threshold=CONFIDENCE_DROP_THRESHOLD,
                message="Forte chute de confiance détectée"
            )
        elif drop >= CONFIDENCE_DROP_THRESHOLD:
            return CognitiveLoadIndicator(
                indicator_type="confidence_drop",
                severity="medium",
                value=drop,
                threshold=CONFIDENCE_DROP_THRESHOLD,
                message="Confiance en baisse"
            )

        return None

    def _check_erratic_pattern(self) -> Optional[CognitiveLoadIndicator]:
        """Vérifie les patterns erratiques (alternance rapide correct/incorrect)"""
        if len(self.correctness) < 8:
            return None

        recent = list(self.correctness)[-8:]
        switches = sum(1 for i in range(1, len(recent)) if recent[i] != recent[i-1])

        # Plus de 5 changements sur 8 = pattern erratique
        if switches >= 6:
            return CognitiveLoadIndicator(
                indicator_type="erratic_pattern",
                severity="medium",
                value=switches,
                threshold=5,
                message="Pattern de réponses irrégulier - concentration fluctuante"
            )

        return None

    def assess(self) -> CognitiveLoadAssessment:
        """
        Effectue une évaluation complète de la charge cognitive

        Returns:
            CognitiveLoadAssessment avec toutes les métriques
        """
        indicators = []

        # Collecter tous les indicateurs
        checks = [
            self._check_response_time(),
            self._check_error_rate(),
            self._check_consecutive_errors(),
            self._check_session_length(),
            self._check_confidence_drop(),
            self._check_erratic_pattern()
        ]

        for check in checks:
            if check:
                indicators.append(check)

        # Calculer le score de charge (0-1)
        severity_weights = {"low": 0.15, "medium": 0.35, "high": 0.6, "critical": 0.9}
        if indicators:
            load_score = max(severity_weights.get(ind.severity, 0) for ind in indicators)
            # Augmenter si multiples indicateurs
            if len(indicators) >= 3:
                load_score = min(1.0, load_score + 0.15)
            elif len(indicators) >= 2:
                load_score = min(1.0, load_score + 0.1)
        else:
            load_score = 0.0

        # Déterminer le niveau global
        if load_score >= 0.8:
            overall_load = "overload"
        elif load_score >= 0.5:
            overall_load = "high"
        elif load_score >= 0.25:
            overall_load = "elevated"
        else:
            overall_load = "optimal"

        # Recommandations
        should_pause = overall_load in ["high", "overload"]
        should_reduce_difficulty = overall_load in ["elevated", "high", "overload"]

        if overall_load == "overload":
            recommendation = "🛑 Arrêtez la session et prenez une pause de 15-20 minutes"
        elif overall_load == "high":
            recommendation = "⚠️ Pause de 5-10 minutes recommandée"
        elif overall_load == "elevated":
            recommendation = "💡 Ralentissez le rythme ou passez à des questions plus faciles"
        else:
            recommendation = "✅ Continuez, votre concentration est bonne"

        # Estimer le focus restant
        session_minutes = (datetime.now() - self.session_start).seconds / 60
        base_focus = max(0, 45 - session_minutes)

        if overall_load == "overload":
            estimated_focus = 0
        elif overall_load == "high":
            estimated_focus = min(5, base_focus)
        elif overall_load == "elevated":
            estimated_focus = min(15, base_focus)
        else:
            estimated_focus = base_focus

        return CognitiveLoadAssessment(
            overall_load=overall_load,
            load_score=load_score,
            indicators=indicators,
            recommendation=recommendation,
            should_pause=should_pause,
            should_reduce_difficulty=should_reduce_difficulty,
            estimated_focus_remaining=int(estimated_focus)
        )

    def get_difficulty_adjustment(self) -> Optional[str]:
        """
        Suggère un ajustement de difficulté basé sur la charge cognitive

        Returns:
            "easier", "harder", ou None
        """
        assessment = self.assess()

        if assessment.should_reduce_difficulty:
            return "easier"

        # Si optimal et bon taux de réussite, peut augmenter
        if assessment.overall_load == "optimal" and len(self.correctness) >= 5:
            recent_success = sum(list(self.correctness)[-5:]) / 5
            if recent_success >= 0.8:
                return "harder"

        return None


def assess_cognitive_load(
    responses: List[Dict[str, Any]],
    session_start: datetime = None
) -> Dict[str, Any]:
    """
    Fonction utilitaire pour évaluer la charge cognitive

    Args:
        responses: Liste de réponses avec response_time, is_correct, etc.
        session_start: Début de la session

    Returns:
        Dict avec l'évaluation
    """
    detector = CognitiveLoadDetector(session_start)

    for r in responses:
        detector.add_response(
            response_time=r.get("response_time", 30),
            is_correct=r.get("is_correct", True),
            difficulty=r.get("difficulty", "medium"),
            confidence=r.get("confidence"),
            perceived_difficulty=r.get("perceived_difficulty")
        )

    assessment = detector.assess()

    return {
        "overall_load": assessment.overall_load,
        "load_score": assessment.load_score,
        "indicators": [
            {
                "type": ind.indicator_type,
                "severity": ind.severity,
                "value": ind.value,
                "message": ind.message
            }
            for ind in assessment.indicators
        ],
        "recommendation": assessment.recommendation,
        "should_pause": assessment.should_pause,
        "should_reduce_difficulty": assessment.should_reduce_difficulty,
        "estimated_focus_remaining": assessment.estimated_focus_remaining
    }


# ═══════════════════════════════════════════════════════════════════════════════
# INTEGRATION AVEC LE SYSTÈME
# ═══════════════════════════════════════════════════════════════════════════════

def get_break_suggestion(load_assessment: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Génère une suggestion de pause personnalisée

    Returns:
        Dict avec type de pause et activités suggérées
    """
    overall_load = load_assessment.get("overall_load", "optimal")

    if overall_load == "optimal":
        return None

    if overall_load == "overload":
        return {
            "break_type": "long",
            "duration_minutes": 15,
            "activities": [
                "🚶 Faites une courte promenade",
                "🧘 Exercices de respiration profonde",
                "🍎 Prenez une collation légère",
                "💧 Hydratez-vous"
            ],
            "message": "Votre cerveau a besoin de récupérer. Une pause maintenant améliorera votre apprentissage."
        }

    elif overall_load == "high":
        return {
            "break_type": "medium",
            "duration_minutes": 10,
            "activities": [
                "🪟 Regardez par la fenêtre (repos des yeux)",
                "🤸 Quelques étirements",
                "☕ Pause café/thé"
            ],
            "message": "Une courte pause vous aidera à mieux retenir ce que vous avez appris."
        }

    else:  # elevated
        return {
            "break_type": "micro",
            "duration_minutes": 3,
            "activities": [
                "👀 Règle 20-20-20: regardez à 20m pendant 20s",
                "🌬️ 5 respirations profondes"
            ],
            "message": "Micro-pause recommandée pour maintenir votre concentration."
        }


__all__ = [
    "CognitiveLoadDetector",
    "CognitiveLoadAssessment",
    "CognitiveLoadIndicator",
    "assess_cognitive_load",
    "get_break_suggestion",
]
