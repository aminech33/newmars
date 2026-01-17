"""
🧪 SIMULATION RÉALISTE AVANCÉE - MOTEUR LEAN v4.0
Simulation avec effets temporels, événements de vie, Prof IA, et cas extrêmes.

Nouveautés:
- Prof IA simulé (explications, encouragements, adaptation)
- Effets jour de la semaine (lundi difficile, weekend variable)
- Effets heure de la journée (matin vs soir)
- Déclin après pause (oubli réel)
- Événements de vie (examens, vacances, maladie)
- Effets psychologiques (découragement, boost confiance, plateau)
- Sessions longues (marathon 2h+)
- Cas extrêmes (burnout, abandon total, comeback)
"""

import sys
sys.path.insert(0, '.')

import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

from services.learning_engine_lean import lean_engine, LeanLearningEngine


# =============================================================================
# PROF IA SIMULÉ
# =============================================================================

class AITeacher:
    """
    Simulation du Prof IA (GPT-4/Discussion IA) et son impact sur l'apprentissage.

    Le Prof IA affecte:
    1. Qualité des explications après erreur → meilleure compréhension
    2. Encouragements personnalisés → boost motivation
    3. Adaptation des questions → meilleure progression
    4. Détection des patterns de difficulté → aide ciblée
    5. Patience infinie → pas de jugement

    RÉALISME AJOUTÉ:
    - Qualité variable des réponses (parfois confuses)
    - Temps de lecture des explications
    - Élève peut ignorer/skip l'explication
    - Latence API (temps d'attente)
    - Hallucinations rares mais possibles
    - Fatigue de lecture (trop de texte)
    """

    # Qualité des explications par topic (certains topics sont mieux expliqués)
    EXPLANATION_QUALITY = {
        "conjugaison": 0.90,   # Règles claires, facile à expliquer
        "grammaire": 0.85,     # Règles complexes mais structurées
        "vocabulaire": 0.80,   # Dépend du contexte
        "orthographe": 0.75,   # Beaucoup d'exceptions
    }

    # Types d'interventions du Prof IA
    INTERVENTION_TYPES = {
        "explanation": "Explication détaillée après erreur",
        "encouragement": "Message d'encouragement",
        "hint": "Indice avant réponse",
        "celebration": "Célébration après succès",
        "break_suggestion": "Suggestion de pause",
        "difficulty_adjust": "Ajustement de difficulté",
        "pattern_detection": "Détection de pattern de difficulté",
        "followup_question": "Question de suivi de l'élève",
    }

    def __init__(self):
        self.interventions_count = 0
        self.explanations_given = 0
        self.encouragements_given = 0
        self.patterns_detected = []
        # Stats réalistes
        self.explanations_skipped = 0  # Élève a ignoré l'explication
        self.explanations_reread = 0   # Élève a relu l'explication
        self.followup_questions = 0    # Questions de suivi posées par l'élève
        self.followup_answered = 0     # Followup auxquels l'IA a bien répondu
        self.hallucinations = 0        # Erreurs de l'IA (rare)
        self.total_reading_time = 0.0  # Temps passé à lire (minutes)
        self.api_latency_total = 0.0   # Temps d'attente API total
        # NOUVELLES STATS - Prof IA avancé
        self.frustration_events = 0    # Élève frustré par latence/qualité
        self.tone_adaptations = 0      # Adaptations du ton
        self.repeated_explanations = 0  # Explications répétées (élève comprend pas)
        self.mastery_gains_from_ai = 0.0  # Gain total de maîtrise grâce au Prof IA
        self.effective_interventions = 0  # Interventions qui ont vraiment aidé

    def _simulate_api_latency(self) -> float:
        """Simule le temps de réponse de l'API (1-4 secondes)"""
        latency = random.uniform(1.0, 4.0)
        self.api_latency_total += latency
        return latency

    def _calculate_reading_time(self, explanation_length: str, student_focus: float) -> float:
        """
        Calcule le temps de lecture d'une explication.
        - court: 15-30 sec
        - moyen: 30-60 sec
        - long: 60-120 sec
        """
        base_times = {"short": 20, "medium": 45, "long": 90}
        base = base_times.get(explanation_length, 45)

        # Ajustement selon le focus de l'élève
        # Élève distrait lit plus vite (skip) ou plus lent (relit)
        focus_modifier = 0.7 + student_focus * 0.6  # 0.7x à 1.3x

        reading_time = base * focus_modifier / 60  # En minutes
        self.total_reading_time += reading_time
        return reading_time

    def _check_hallucination(self, topic: str, difficulty: int) -> bool:
        """
        Vérifie si l'IA fait une hallucination (erreur factuelle).
        Très rare: ~1-2% pour les sujets complexes.
        """
        # Base: 0.5% de chance
        hallucination_prob = 0.005

        # Augmente légèrement pour les sujets avec beaucoup d'exceptions
        if topic == "orthographe":
            hallucination_prob += 0.01  # Beaucoup d'exceptions
        if difficulty >= 4:
            hallucination_prob += 0.005  # Questions complexes

        if random.random() < hallucination_prob:
            self.hallucinations += 1
            return True
        return False

    def give_explanation(
        self,
        topic: str,
        difficulty: int,
        student_mastery: float,
        student_focus: float = 0.6,
        student_fatigue: float = 0.0
    ) -> dict:
        """
        Simule une explication du Prof IA après une erreur.

        RÉALISME:
        - L'élève peut skip/ignorer l'explication
        - L'élève peut relire si pas compris
        - Temps de lecture simulé
        - Qualité variable de l'IA
        - Hallucinations rares

        Retourne l'effet sur l'apprentissage:
        - comprehension_boost: bonus de compréhension (0-0.3)
        - motivation_boost: bonus de motivation (0-0.1)
        - retry_confidence: confiance pour réessayer (0-1)
        - was_read: l'élève a-t-il lu l'explication?
        - reading_time: temps de lecture (minutes)
        """
        self.explanations_given += 1
        self.interventions_count += 1

        # Simuler latence API
        api_latency = self._simulate_api_latency()

        # Vérifier si hallucination
        has_hallucination = self._check_hallucination(topic, difficulty)

        # Qualité de base de l'explication
        base_quality = self.EXPLANATION_QUALITY.get(topic, 0.80)

        # Réduire qualité si hallucination
        if has_hallucination:
            base_quality *= 0.3  # Explication incorrecte = peu utile

        # Variance naturelle de qualité (parfois l'IA est meilleure/pire)
        quality_variance = random.uniform(-0.10, 0.10)
        base_quality = max(0.3, min(1.0, base_quality + quality_variance))

        # Ajustement selon la difficulté
        if difficulty <= 2:
            quality_mod = 0.10
            explanation_length = "short"
        elif difficulty <= 4:
            quality_mod = 0.05
            explanation_length = "medium"
        else:
            quality_mod = 0.0
            explanation_length = "long"

        # Ajustement selon la maîtrise
        if student_mastery < 0.3:
            mastery_mod = 0.15
        elif student_mastery < 0.6:
            mastery_mod = 0.10
        else:
            mastery_mod = 0.05

        final_quality = min(1.0, base_quality + quality_mod + mastery_mod)

        # === COMPORTEMENT DE L'ÉLÈVE ===

        # Probabilité de skip l'explication
        skip_prob = 0.05  # Base: 5%
        skip_prob += student_fatigue * 0.15  # Fatigué = plus de skip
        skip_prob += (1 - student_focus) * 0.10  # Distrait = plus de skip
        if explanation_length == "long":
            skip_prob += 0.10  # Texte long = plus de skip

        was_read = True
        reading_time = 0.0

        if random.random() < skip_prob:
            # Élève skip l'explication
            self.explanations_skipped += 1
            was_read = False
            final_quality *= 0.1  # Quasi aucun bénéfice
        else:
            # Élève lit l'explication
            reading_time = self._calculate_reading_time(explanation_length, student_focus)

            # Probabilité de relire (si pas compris)
            if final_quality < 0.7 and random.random() < 0.3:
                # Élève relit
                self.explanations_reread += 1
                reading_time *= 1.5  # Temps supplémentaire
                final_quality *= 1.15  # Légère amélioration

        # Calcul des effets finaux
        comprehension_boost = final_quality * 0.25 if was_read else 0.02
        motivation_boost = 0.05 if final_quality > 0.7 and was_read else 0.01
        retry_confidence = 0.6 + final_quality * 0.3 if was_read else 0.4

        return {
            "comprehension_boost": comprehension_boost,
            "motivation_boost": motivation_boost,
            "retry_confidence": retry_confidence,
            "explanation_quality": final_quality,
            "was_read": was_read,
            "reading_time": reading_time,
            "api_latency": api_latency,
            "had_hallucination": has_hallucination,
            "explanation_length": explanation_length
        }

    def give_encouragement(self, consecutive_failures: int, consecutive_successes: int,
                           student_confidence: float, student_resilience: float) -> dict:
        """
        Simule un encouragement personnalisé du Prof IA.

        Le Prof IA adapte son message selon:
        - Le nombre d'échecs/succès consécutifs
        - La confiance de l'élève
        - La résilience du profil
        """
        self.encouragements_given += 1
        self.interventions_count += 1

        # Déterminer le type d'encouragement
        if consecutive_failures >= 3:
            # Élève en difficulté - encouragement fort
            motivation_boost = 0.15 * (1 + student_resilience * 0.5)
            confidence_boost = 0.10
            message_type = "support_strong"
        elif consecutive_failures >= 1:
            # Petite erreur - encouragement léger
            motivation_boost = 0.05
            confidence_boost = 0.05
            message_type = "support_light"
        elif consecutive_successes >= 5:
            # Série de succès - célébration
            motivation_boost = 0.10
            confidence_boost = 0.15
            message_type = "celebration"
        elif consecutive_successes >= 3:
            # Bonne performance - félicitations
            motivation_boost = 0.08
            confidence_boost = 0.10
            message_type = "praise"
        else:
            # Neutre
            motivation_boost = 0.02
            confidence_boost = 0.02
            message_type = "neutral"

        # Ajustement selon la confiance actuelle
        if student_confidence < 0.3:
            # Élève très peu confiant - boost supplémentaire
            motivation_boost *= 1.5
            confidence_boost *= 1.5

        return {
            "motivation_boost": min(0.20, motivation_boost),
            "confidence_boost": min(0.20, confidence_boost),
            "message_type": message_type
        }

    def detect_difficulty_pattern(self, responses: List[dict], topic: str) -> Optional[dict]:
        """
        Détecte si l'élève a un pattern de difficulté sur un topic.

        Patterns détectables:
        - Erreurs répétées sur même type de question
        - Temps de réponse anormalement long
        - Baisse soudaine de performance
        """
        if len(responses) < 5:
            return None

        # Analyser les 10 dernières réponses sur ce topic
        topic_responses = [r for r in responses[-20:] if r.get("topic_id") == topic]

        if len(topic_responses) < 3:
            return None

        # Calculer le taux d'erreur récent
        recent_errors = sum(1 for r in topic_responses[-5:] if not r.get("is_correct", True))
        error_rate = recent_errors / min(5, len(topic_responses))

        # Calculer le temps de réponse moyen
        avg_time = sum(r.get("response_time", 15) for r in topic_responses) / len(topic_responses)

        pattern = None

        if error_rate >= 0.6:
            # Pattern: difficultés répétées
            pattern = {
                "type": "repeated_errors",
                "topic": topic,
                "error_rate": error_rate,
                "recommendation": "lower_difficulty",
                "boost_on_correct": 0.10  # Bonus supplémentaire si réussit après aide
            }
            self.patterns_detected.append(pattern)

        elif avg_time > 40:
            # Pattern: temps de réponse très long
            pattern = {
                "type": "slow_response",
                "topic": topic,
                "avg_time": avg_time,
                "recommendation": "simpler_questions",
                "confidence_support": 0.05
            }
            self.patterns_detected.append(pattern)

        return pattern

    def should_suggest_break(self, fatigue: float, consecutive_failures: int,
                             session_minutes: float, questions_answered: int) -> Tuple[bool, str]:
        """
        Le Prof IA suggère une pause si nécessaire.
        """
        reasons = []

        if fatigue > 0.7:
            reasons.append("fatigue élevée")
        if consecutive_failures >= 4:
            reasons.append("série d'erreurs")
        if session_minutes > 45 and questions_answered > 20:
            reasons.append("session longue")
        if session_minutes > 60:
            reasons.append("plus d'une heure d'étude")

        if reasons:
            self.interventions_count += 1
            return True, f"Pause suggérée: {', '.join(reasons)}"

        return False, ""

    def handle_followup_question(
        self,
        topic: str,
        student_confusion_level: float,
        previous_explanation_quality: float
    ) -> dict:
        """
        Simule une question de suivi posée par l'élève.

        L'élève pose une question quand:
        - Il n'a pas compris l'explication
        - Il veut approfondir
        - Il a besoin d'un exemple concret
        """
        self.followup_questions += 1
        self.interventions_count += 1

        # Latence pour la réponse
        latency = self._simulate_api_latency()

        # Qualité de la réponse au followup
        # Généralement meilleure car plus ciblée
        base_quality = 0.85

        # Pénalité si l'explication précédente était mauvaise
        if previous_explanation_quality < 0.5:
            base_quality -= 0.15  # L'IA a du mal avec ce sujet

        # Bonus si l'élève pose une question précise (moins confus)
        if student_confusion_level < 0.5:
            base_quality += 0.10

        quality = max(0.3, min(1.0, base_quality + random.uniform(-0.1, 0.1)))

        # L'IA répond-elle bien ?
        answered_well = quality > 0.6
        if answered_well:
            self.followup_answered += 1

        return {
            "quality": quality,
            "answered_well": answered_well,
            "latency": latency,
            "comprehension_boost": quality * 0.15 if answered_well else 0.02
        }

    def adapt_tone(
        self,
        student_mood: str,
        consecutive_failures: int,
        confidence: float
    ) -> dict:
        """
        Adapte le ton du Prof IA selon l'état émotionnel de l'élève.

        Tons possibles:
        - encouraging: Élève découragé → encouragements
        - celebratory: Élève en réussite → célébrations
        - calm: Élève stressé → ton calme et rassurant
        - challenging: Élève confiant → ton stimulant
        - neutral: Par défaut
        """
        self.tone_adaptations += 1

        # Déterminer le ton approprié
        if consecutive_failures >= 3 or confidence < 0.3:
            tone = "encouraging"
            motivation_effect = 0.10
            stress_reduction = 0.15
        elif student_mood == "frustrated":
            tone = "calm"
            motivation_effect = 0.05
            stress_reduction = 0.20
        elif student_mood == "confident" and confidence > 0.8:
            tone = "challenging"
            motivation_effect = 0.08
            stress_reduction = 0.0
        elif consecutive_failures == 0 and confidence > 0.6:
            tone = "celebratory"
            motivation_effect = 0.12
            stress_reduction = 0.05
        else:
            tone = "neutral"
            motivation_effect = 0.02
            stress_reduction = 0.02

        return {
            "tone": tone,
            "motivation_effect": motivation_effect,
            "stress_reduction": stress_reduction
        }

    def check_student_frustration(
        self,
        api_latency: float,
        explanation_quality: float,
        consecutive_poor_explanations: int
    ) -> dict:
        """
        Vérifie si l'élève est frustré par le Prof IA.

        Causes de frustration:
        - Latence API trop longue (>3s)
        - Explications de mauvaise qualité
        - Plusieurs explications inutiles d'affilée
        """
        frustration_level = 0.0
        causes = []

        # Latence
        if api_latency > 3.0:
            frustration_level += 0.15
            causes.append("attente_longue")
        elif api_latency > 2.5:
            frustration_level += 0.05

        # Qualité
        if explanation_quality < 0.4:
            frustration_level += 0.20
            causes.append("explication_confuse")
        elif explanation_quality < 0.6:
            frustration_level += 0.10

        # Répétitions inutiles
        if consecutive_poor_explanations >= 2:
            frustration_level += 0.25
            causes.append("pas_de_progres")
            self.repeated_explanations += 1

        is_frustrated = frustration_level > 0.3
        if is_frustrated:
            self.frustration_events += 1

        return {
            "is_frustrated": is_frustrated,
            "frustration_level": min(1.0, frustration_level),
            "causes": causes,
            "should_change_approach": consecutive_poor_explanations >= 2
        }

    def record_effectiveness(self, mastery_before: float, mastery_after: float):
        """Enregistre l'efficacité d'une intervention"""
        gain = mastery_after - mastery_before
        if gain > 0:
            self.mastery_gains_from_ai += gain
            self.effective_interventions += 1

    def get_stats(self) -> dict:
        """Retourne les statistiques complètes du Prof IA (incluant réalisme)"""
        effectiveness_rate = (
            self.effective_interventions / max(1, self.explanations_given) * 100
        )
        avg_gain_per_intervention = (
            self.mastery_gains_from_ai / max(1, self.effective_interventions)
        )

        return {
            "total_interventions": self.interventions_count,
            "explanations": self.explanations_given,
            "encouragements": self.encouragements_given,
            "patterns_detected": len(self.patterns_detected),
            # Stats réalistes
            "explanations_skipped": self.explanations_skipped,
            "explanations_reread": self.explanations_reread,
            "followup_questions": self.followup_questions,
            "followup_answered": self.followup_answered,
            "hallucinations": self.hallucinations,
            "total_reading_time_min": round(self.total_reading_time, 1),
            "api_latency_total_sec": round(self.api_latency_total, 1),
            # Stats avancées Prof IA
            "frustration_events": self.frustration_events,
            "tone_adaptations": self.tone_adaptations,
            "repeated_explanations": self.repeated_explanations,
            "mastery_gains_from_ai": round(self.mastery_gains_from_ai, 2),
            "effective_interventions": self.effective_interventions,
            "effectiveness_rate": round(effectiveness_rate, 1),
            "avg_gain_per_intervention": round(avg_gain_per_intervention, 4),
            # Taux calculés
            "skip_rate": round(self.explanations_skipped / max(1, self.explanations_given) * 100, 1),
            "reread_rate": round(self.explanations_reread / max(1, self.explanations_given) * 100, 1),
            "hallucination_rate": round(self.hallucinations / max(1, self.explanations_given) * 100, 2),
            "followup_success_rate": round(self.followup_answered / max(1, self.followup_questions) * 100, 1),
        }


# =============================================================================
# ÉNUMÉRATIONS ET CONSTANTES
# =============================================================================

class DayOfWeek(Enum):
    MONDAY = 0
    TUESDAY = 1
    WEDNESDAY = 2
    THURSDAY = 3
    FRIDAY = 4
    SATURDAY = 5
    SUNDAY = 6


class TimeOfDay(Enum):
    MORNING = "morning"      # 6h-12h
    AFTERNOON = "afternoon"  # 12h-18h
    EVENING = "evening"      # 18h-22h
    NIGHT = "night"          # 22h-6h


class LifeEvent(Enum):
    NONE = "none"
    EXAM_WEEK = "exam_week"        # Stress, moins de temps
    VACATION = "vacation"          # Pause totale ou intensive
    SICK = "sick"                  # Maladie
    FAMILY_EVENT = "family_event"  # Anniversaire, fête
    GOOD_NEWS = "good_news"        # Boost motivation
    BAD_NEWS = "bad_news"          # Baisse motivation
    # NOUVEAUX ÉVÉNEMENTS TEMPORELS
    SCHOOL_VACATION = "school_vacation"  # Vacances scolaires (2 semaines)
    BACK_TO_SCHOOL = "back_to_school"    # Rentrée scolaire
    END_OF_TERM = "end_of_term"          # Fin de trimestre
    HOLIDAY_SEASON = "holiday_season"    # Période de fêtes (Noël, etc.)


class MotivationCycle(Enum):
    """Cycles de motivation sur plusieurs semaines"""
    PEAK = "peak"           # Pic de motivation
    NORMAL = "normal"       # Normal
    LOW = "low"             # Baisse cyclique
    RECOVERY = "recovery"   # Remontée


class DeviceType(Enum):
    """Type d'appareil utilisé pour étudier"""
    MOBILE = "mobile"       # Smartphone - attention réduite, sessions courtes
    TABLET = "tablet"       # Tablette - compromis
    DESKTOP = "desktop"     # Ordinateur - meilleure concentration


class LearningStyle(Enum):
    """Style d'apprentissage préféré (VARK model simplifié)"""
    VISUAL = "visual"       # Préfère images, schémas, vidéos
    TEXTUAL = "textual"     # Préfère texte, lecture
    AUDITORY = "auditory"   # Préfère audio, explications orales


class SubjectHistory(Enum):
    """Historique avec la matière"""
    POSITIVE = "positive"   # Bons souvenirs, confiance
    NEUTRAL = "neutral"     # Pas d'historique particulier
    NEGATIVE = "negative"   # Échecs passés, blocage
    PHOBIA = "phobia"       # Phobie de la matière (ex: "je suis nul en maths")


# Effets du jour de la semaine sur la motivation
DAY_EFFECTS = {
    DayOfWeek.MONDAY: -0.15,     # Lundi difficile
    DayOfWeek.TUESDAY: 0.0,
    DayOfWeek.WEDNESDAY: 0.05,   # Milieu de semaine ok
    DayOfWeek.THURSDAY: 0.0,
    DayOfWeek.FRIDAY: -0.10,     # Vendredi = envie de weekend
    DayOfWeek.SATURDAY: 0.10,    # Weekend = plus de temps
    DayOfWeek.SUNDAY: -0.05,     # Dimanche soir = flemme
}

# Effets de l'heure sur la performance
TIME_EFFECTS = {
    TimeOfDay.MORNING: {"focus": 0.10, "fatigue": -0.05},
    TimeOfDay.AFTERNOON: {"focus": -0.05, "fatigue": 0.05},
    TimeOfDay.EVENING: {"focus": -0.10, "fatigue": 0.15},
    TimeOfDay.NIGHT: {"focus": -0.20, "fatigue": 0.25},
}

# NOUVEAUX: Effets des cycles de motivation (oscillent sur 3-4 semaines)
MOTIVATION_CYCLE_EFFECTS = {
    MotivationCycle.PEAK: {"motivation": 0.20, "focus": 0.10, "learning_speed": 1.15},
    MotivationCycle.NORMAL: {"motivation": 0.0, "focus": 0.0, "learning_speed": 1.0},
    MotivationCycle.LOW: {"motivation": -0.20, "focus": -0.10, "learning_speed": 0.85},
    MotivationCycle.RECOVERY: {"motivation": 0.05, "focus": 0.0, "learning_speed": 0.95},
}

# Effets des vacances scolaires
VACATION_EFFECTS = {
    LifeEvent.SCHOOL_VACATION: {
        "skip_prob": 0.60,      # 60% de chance de skip
        "decay_multiplier": 2.0, # Oubli 2x plus rapide
        "motivation": -0.10,
    },
    LifeEvent.BACK_TO_SCHOOL: {
        "skip_prob": -0.10,     # Plus régulier
        "motivation": 0.25,     # Remotivation
        "focus": 0.15,
    },
    LifeEvent.END_OF_TERM: {
        "skip_prob": 0.20,
        "motivation": -0.15,    # Fatigue de fin de trimestre
        "focus": -0.10,
    },
    LifeEvent.HOLIDAY_SEASON: {
        "skip_prob": 0.70,      # Beaucoup de skip
        "motivation": -0.05,
        "decay_multiplier": 1.5,
    },
}

# Effets du type d'appareil
DEVICE_EFFECTS = {
    DeviceType.MOBILE: {
        "focus": -0.15,              # Attention réduite (notifications, petit écran)
        "session_length_max": 10,    # Sessions courtes recommandées
        "fatigue_rate": 1.3,         # Fatigue plus rapide (écran petit)
        "skip_prob": -0.10,          # Mais plus accessible = moins de skip
    },
    DeviceType.TABLET: {
        "focus": -0.05,
        "session_length_max": 20,
        "fatigue_rate": 1.1,
        "skip_prob": -0.05,
    },
    DeviceType.DESKTOP: {
        "focus": 0.10,               # Meilleure concentration
        "session_length_max": 30,    # Sessions plus longues possibles
        "fatigue_rate": 0.9,         # Moins de fatigue visuelle
        "skip_prob": 0.05,           # Mais moins accessible
    },
}

# Effets du style d'apprentissage (impact sur la qualité des explications)
LEARNING_STYLE_EFFECTS = {
    LearningStyle.VISUAL: {
        "explanation_boost": 0.15,   # Boost si explication avec images/schémas
        "text_only_penalty": -0.10,  # Pénalité si texte seul
        "preferred_content": ["diagram", "video", "infographic"],
    },
    LearningStyle.TEXTUAL: {
        "explanation_boost": 0.10,   # Boost avec texte détaillé
        "text_only_penalty": 0.0,    # Pas de pénalité
        "preferred_content": ["text", "article", "definition"],
    },
    LearningStyle.AUDITORY: {
        "explanation_boost": 0.12,   # Boost avec audio/vidéo parlée
        "text_only_penalty": -0.15,  # Pénalité si texte seul (pas d'audio)
        "preferred_content": ["audio", "podcast", "explanation_video"],
    },
}

# Effets de l'historique avec la matière
SUBJECT_HISTORY_EFFECTS = {
    SubjectHistory.POSITIVE: {
        "confidence_start": 0.70,    # Commence confiant
        "motivation_bonus": 0.15,    # Plus motivé
        "anxiety": 0.0,              # Pas d'anxiété
        "resilience_bonus": 0.10,    # Plus résilient
    },
    SubjectHistory.NEUTRAL: {
        "confidence_start": 0.50,
        "motivation_bonus": 0.0,
        "anxiety": 0.0,
        "resilience_bonus": 0.0,
    },
    SubjectHistory.NEGATIVE: {
        "confidence_start": 0.30,    # Commence peu confiant
        "motivation_bonus": -0.10,   # Moins motivé
        "anxiety": 0.20,             # Anxiété modérée
        "resilience_bonus": -0.10,   # Moins résilient
    },
    SubjectHistory.PHOBIA: {
        "confidence_start": 0.15,    # Très peu confiant
        "motivation_bonus": -0.20,   # Blocage motivationnel
        "anxiety": 0.50,             # Forte anxiété
        "resilience_bonus": -0.25,   # Très sensible aux échecs
        "avoidance_prob": 0.30,      # Prob d'éviter les questions difficiles
    },
}


def get_motivation_cycle(day_number: int) -> MotivationCycle:
    """
    Détermine le cycle de motivation basé sur le jour.
    Cycle de ~21 jours: 5 jours peak, 8 jours normal, 5 jours low, 3 jours recovery
    """
    cycle_day = day_number % 21

    if cycle_day < 5:
        return MotivationCycle.PEAK
    elif cycle_day < 13:
        return MotivationCycle.NORMAL
    elif cycle_day < 18:
        return MotivationCycle.LOW
    else:
        return MotivationCycle.RECOVERY


def calculate_vacation_decay(days_in_vacation: int, base_knowledge: float) -> float:
    """
    Calcule la perte de connaissance pendant les vacances.

    Formule: déclin exponentiel avec plancher
    - Perte de ~20% la première semaine
    - Perte de ~35% après 2 semaines
    - Plancher à 40% de la connaissance initiale
    """
    if days_in_vacation <= 0:
        return base_knowledge

    # Déclin exponentiel: retention = base * e^(-decay_rate * days)
    decay_rate = 0.03  # ~3% par jour
    retention = base_knowledge * (0.97 ** days_in_vacation)

    # Plancher: on ne perd jamais tout
    min_retention = base_knowledge * 0.40
    return max(min_retention, retention)


# =============================================================================
# MÉTRIQUES DE QUALITÉ DU SYSTÈME
# =============================================================================

@dataclass
class QualityMetrics:
    """
    Métriques de qualité pour évaluer le système d'apprentissage.

    Ces métriques permettent de:
    1. Évaluer l'efficacité du moteur d'apprentissage
    2. Mesurer l'impact réel du Prof IA
    3. Identifier les élèves à risque
    4. Calculer la rétention à long terme
    """
    # Rétention
    short_term_retention: float = 0.0  # Rétention après 1 jour
    medium_term_retention: float = 0.0  # Rétention après 7 jours
    long_term_retention: float = 0.0   # Rétention après 14+ jours

    # Efficacité du système
    mastery_per_hour: float = 0.0      # Gain de maîtrise par heure
    questions_to_mastery: int = 0      # Questions nécessaires pour 80%
    optimal_difficulty_rate: float = 0.0  # % questions dans la zone optimale

    # Efficacité Prof IA
    ai_impact_score: float = 0.0       # Score d'impact du Prof IA (0-1)
    ai_interventions_useful: int = 0   # Interventions utiles
    ai_interventions_wasted: int = 0   # Interventions ignorées/inutiles

    # Risque d'abandon
    dropout_risk_score: float = 0.0    # Score de risque d'abandon (0-1)
    frustration_events: int = 0
    plateau_events: int = 0
    burnout_events: int = 0

    # Engagement
    avg_session_completion: float = 0.0  # % moyen de complétion des sessions
    streak_days: int = 0                 # Jours consécutifs d'étude
    total_study_time_hours: float = 0.0


class QualityTracker:
    """Tracker pour calculer les métriques de qualité en temps réel"""

    def __init__(self):
        self.mastery_snapshots: Dict[int, Dict[str, float]] = {}  # day -> {topic: mastery}
        self.session_completions: List[float] = []
        self.difficulty_history: List[int] = []
        self.ai_intervention_results: List[bool] = []  # True = utile, False = inutile
        self.study_times: List[float] = []  # minutes par session
        self.consecutive_study_days: int = 0
        self.last_study_day: int = -1
        self.frustration_count: int = 0
        self.plateau_count: int = 0
        self.burnout_count: int = 0

    def record_session(
        self,
        day: int,
        completion_rate: float,
        study_time_minutes: float,
        difficulties: List[int]
    ):
        """Enregistre les données d'une session"""
        self.session_completions.append(completion_rate)
        self.study_times.append(study_time_minutes)
        self.difficulty_history.extend(difficulties)

        # Streak
        if day == self.last_study_day + 1:
            self.consecutive_study_days += 1
        elif day > self.last_study_day + 1:
            self.consecutive_study_days = 1
        self.last_study_day = day

    def record_mastery_snapshot(self, day: int, mastery: Dict[str, float]):
        """Enregistre un snapshot de la maîtrise"""
        self.mastery_snapshots[day] = mastery.copy()

    def record_ai_intervention(self, was_useful: bool):
        """Enregistre si une intervention IA était utile"""
        self.ai_intervention_results.append(was_useful)

    def record_negative_event(self, event_type: str):
        """Enregistre un événement négatif"""
        if event_type == "frustration":
            self.frustration_count += 1
        elif event_type == "plateau":
            self.plateau_count += 1
        elif event_type == "burnout":
            self.burnout_count += 1

    def calculate_retention(self, day: int, baseline_day: int = 1) -> Optional[float]:
        """Calcule la rétention entre deux jours"""
        if baseline_day not in self.mastery_snapshots or day not in self.mastery_snapshots:
            return None

        baseline = self.mastery_snapshots[baseline_day]
        current = self.mastery_snapshots[day]

        if not baseline:
            return None

        # Moyenne de rétention par topic
        retentions = []
        for topic in baseline:
            if topic in current and baseline[topic] > 0:
                retention = current[topic] / baseline[topic]
                retentions.append(min(1.0, retention))

        return sum(retentions) / len(retentions) if retentions else None

    def calculate_metrics(self) -> QualityMetrics:
        """Calcule toutes les métriques de qualité"""
        metrics = QualityMetrics()

        # Rétention
        if len(self.mastery_snapshots) >= 2:
            days = sorted(self.mastery_snapshots.keys())
            if len(days) >= 2:
                metrics.short_term_retention = self.calculate_retention(days[1], days[0]) or 0.0
            if len(days) >= 8:
                metrics.medium_term_retention = self.calculate_retention(days[7], days[0]) or 0.0
            if len(days) >= 15:
                metrics.long_term_retention = self.calculate_retention(days[14], days[0]) or 0.0

        # Efficacité
        total_time_hours = sum(self.study_times) / 60
        if total_time_hours > 0 and self.mastery_snapshots:
            final_day = max(self.mastery_snapshots.keys())
            final_mastery = sum(self.mastery_snapshots[final_day].values()) / max(1, len(self.mastery_snapshots[final_day]))
            metrics.mastery_per_hour = final_mastery / total_time_hours

        # Zone optimale de difficulté (2-4 est optimal)
        if self.difficulty_history:
            optimal_count = sum(1 for d in self.difficulty_history if 2 <= d <= 4)
            metrics.optimal_difficulty_rate = optimal_count / len(self.difficulty_history)

        # Efficacité Prof IA
        if self.ai_intervention_results:
            useful = sum(1 for r in self.ai_intervention_results if r)
            metrics.ai_interventions_useful = useful
            metrics.ai_interventions_wasted = len(self.ai_intervention_results) - useful
            metrics.ai_impact_score = useful / len(self.ai_intervention_results)

        # Risque d'abandon
        risk_factors = 0
        if self.frustration_count >= 3:
            risk_factors += 1
        if self.plateau_count >= 2:
            risk_factors += 1
        if self.burnout_count >= 1:
            risk_factors += 2
        if self.session_completions and sum(self.session_completions) / len(self.session_completions) < 0.5:
            risk_factors += 1

        metrics.dropout_risk_score = min(1.0, risk_factors / 5)
        metrics.frustration_events = self.frustration_count
        metrics.plateau_events = self.plateau_count
        metrics.burnout_events = self.burnout_count

        # Engagement
        if self.session_completions:
            metrics.avg_session_completion = sum(self.session_completions) / len(self.session_completions)
        metrics.streak_days = self.consecutive_study_days
        metrics.total_study_time_hours = sum(self.study_times) / 60

        return metrics


def assess_dropout_risk(student) -> Dict[str, any]:
    """
    Évalue le risque d'abandon d'un élève.

    Facteurs de risque:
    - Séries d'échecs répétées
    - Plateau prolongé
    - Burnout récent
    - Skip de sessions fréquent
    - Confiance très basse
    """
    risk_score = 0.0
    risk_factors = []

    # Échecs consécutifs
    if student.consecutive_failures >= 5:
        risk_score += 0.25
        risk_factors.append("échecs_répétés")
    elif student.consecutive_failures >= 3:
        risk_score += 0.10

    # Plateau
    if student.is_in_plateau and student.plateau_days >= 3:
        risk_score += 0.20
        risk_factors.append("plateau_prolongé")

    # Burnout
    if student.is_burned_out:
        risk_score += 0.30
        risk_factors.append("burnout")

    # Confiance
    if student.confidence < 0.2:
        risk_score += 0.20
        risk_factors.append("confiance_très_basse")
    elif student.confidence < 0.4:
        risk_score += 0.10

    # Motivation
    if student.current_motivation < 0.3:
        risk_score += 0.15
        risk_factors.append("motivation_basse")

    # Sessions manquées
    if student.days_since_last_session >= 5:
        risk_score += 0.20
        risk_factors.append("absence_prolongée")

    risk_level = "low"
    if risk_score >= 0.6:
        risk_level = "critical"
    elif risk_score >= 0.4:
        risk_level = "high"
    elif risk_score >= 0.2:
        risk_level = "medium"

    return {
        "risk_score": min(1.0, risk_score),
        "risk_level": risk_level,
        "risk_factors": risk_factors,
        "should_intervene": risk_score >= 0.4
    }


# =============================================================================
# PROFILS ÉTENDUS
# =============================================================================

@dataclass
class ExtendedStudentProfile:
    """Profil étendu avec préférences temporelles et nouveaux paramètres"""
    name: str
    description: str
    # Capacités de base
    base_ability: float
    learning_speed: float
    motivation: float
    motivation_variance: float
    focus: float
    fatigue_resistance: float
    session_skip_prob: float
    early_quit_prob: float
    # Attributs temporels
    preferred_time: TimeOfDay = TimeOfDay.AFTERNOON
    weekend_studier: bool = True  # Étudie le weekend?
    resilience: float = 0.5  # Résistance au découragement (0-1)
    topic_preferences: Dict[str, float] = field(default_factory=dict)  # Topic -> bonus/malus
    # NOUVEAUX PARAMÈTRES
    # Objectif/Deadline
    days_until_exam: Optional[int] = None  # None = pas d'examen prévu
    target_mastery: float = 0.80  # Objectif de maîtrise (0-1)
    # Appareil
    primary_device: DeviceType = DeviceType.MOBILE  # Appareil principal
    # Style d'apprentissage
    learning_style: LearningStyle = LearningStyle.TEXTUAL  # Style préféré
    # Historique avec la matière
    subject_history: SubjectHistory = SubjectHistory.NEUTRAL  # Historique passé


EXTENDED_PROFILES = {
    "determined": ExtendedStudentProfile(
        name="Marie (Déterminée)",
        description="Motivée, capable, régulière. L'élève idéale.",
        base_ability=0.70,
        learning_speed=1.1,
        motivation=0.85,
        motivation_variance=0.05,
        focus=0.80,
        fatigue_resistance=0.75,
        session_skip_prob=0.03,
        early_quit_prob=0.02,
        preferred_time=TimeOfDay.MORNING,
        weekend_studier=True,
        resilience=0.85,
        topic_preferences={"conjugaison": 0.1, "grammaire": 0.05},
        # Nouveaux paramètres
        days_until_exam=30,  # Examen dans 1 mois
        target_mastery=0.90,
        primary_device=DeviceType.DESKTOP,  # Étudie sur ordi
        learning_style=LearningStyle.VISUAL,  # Préfère les schémas
        subject_history=SubjectHistory.POSITIVE,  # Bons souvenirs
    ),
    "average": ExtendedStudentProfile(
        name="Salim (Moyen)",
        description="Motivé mais capacité normale. Représente 35% des utilisateurs.",
        base_ability=0.50,
        learning_speed=0.9,
        motivation=0.65,
        motivation_variance=0.15,
        focus=0.60,
        fatigue_resistance=0.55,
        session_skip_prob=0.08,
        early_quit_prob=0.04,
        preferred_time=TimeOfDay.AFTERNOON,
        weekend_studier=False,  # Pas le weekend
        resilience=0.50,
        topic_preferences={"vocabulaire": 0.1, "orthographe": -0.1},
        # Nouveaux paramètres
        days_until_exam=None,  # Pas d'examen prévu
        target_mastery=0.70,
        primary_device=DeviceType.MOBILE,  # Sur téléphone
        learning_style=LearningStyle.TEXTUAL,  # Préfère lire
        subject_history=SubjectHistory.NEUTRAL,
    ),
    "irregular": ExtendedStudentProfile(
        name="Emma (Irrégulière)",
        description="Capable mais motivation variable. Sessions espacées.",
        base_ability=0.65,
        learning_speed=1.0,
        motivation=0.50,
        motivation_variance=0.25,
        focus=0.65,
        fatigue_resistance=0.65,
        session_skip_prob=0.25,
        early_quit_prob=0.10,
        preferred_time=TimeOfDay.EVENING,
        weekend_studier=True,
        resilience=0.40,
        topic_preferences={"grammaire": -0.15},  # Déteste la grammaire
        # Nouveaux paramètres
        days_until_exam=45,  # Examen loin
        target_mastery=0.75,
        primary_device=DeviceType.TABLET,  # Sur tablette
        learning_style=LearningStyle.AUDITORY,  # Préfère écouter
        subject_history=SubjectHistory.NEGATIVE,  # Mauvais souvenirs
    ),
    "struggling": ExtendedStudentProfile(
        name="Tom (En difficulté)",
        description="Motivé mais capacité limitée. A besoin d'adaptation.",
        base_ability=0.40,
        learning_speed=0.70,
        motivation=0.70,
        motivation_variance=0.10,
        focus=0.55,
        fatigue_resistance=0.50,
        session_skip_prob=0.05,
        early_quit_prob=0.06,
        preferred_time=TimeOfDay.AFTERNOON,
        weekend_studier=True,
        resilience=0.60,
        topic_preferences={"vocabulaire": 0.15, "conjugaison": -0.1},
        # Nouveaux paramètres
        days_until_exam=21,  # Examen dans 3 semaines
        target_mastery=0.60,  # Objectif modeste
        primary_device=DeviceType.MOBILE,
        learning_style=LearningStyle.VISUAL,  # Les schémas l'aident
        subject_history=SubjectHistory.PHOBIA,  # Phobie de la matière!
    ),
    # CAS EXTRÊMES
    "marathon": ExtendedStudentProfile(
        name="Alex (Marathonien)",
        description="Sessions très longues (2h+), risque de burnout.",
        base_ability=0.60,
        learning_speed=1.0,
        motivation=0.90,
        motivation_variance=0.20,
        focus=0.70,
        fatigue_resistance=0.40,  # Se fatigue vite
        session_skip_prob=0.15,
        early_quit_prob=0.02,  # Ne lâche pas
        preferred_time=TimeOfDay.NIGHT,  # Étudie la nuit
        weekend_studier=True,
        resilience=0.70,
        topic_preferences={},
        # Nouveaux paramètres
        days_until_exam=14,  # Examen bientôt
        target_mastery=0.85,
        primary_device=DeviceType.DESKTOP,  # Longues sessions = ordi
        learning_style=LearningStyle.TEXTUAL,
        subject_history=SubjectHistory.NEUTRAL,
    ),
    "procrastinator": ExtendedStudentProfile(
        name="Amine (Procrastinateur)",
        description="Reporte toujours, puis cramme avant deadline.",
        base_ability=0.65,
        learning_speed=1.2,  # Apprend vite quand il s'y met
        motivation=0.30,
        motivation_variance=0.40,  # Très variable
        focus=0.75,
        fatigue_resistance=0.60,
        session_skip_prob=0.50,  # Saute beaucoup
        early_quit_prob=0.15,
        preferred_time=TimeOfDay.NIGHT,
        weekend_studier=False,
        resilience=0.55,
        topic_preferences={},
        # Nouveaux paramètres
        days_until_exam=7,  # Examen dans 1 semaine (panique!)
        target_mastery=0.70,
        primary_device=DeviceType.MOBILE,  # Étudie n'importe où
        learning_style=LearningStyle.AUDITORY,  # Podcasts en marchant
        subject_history=SubjectHistory.NEGATIVE,
    ),
    "perfectionist": ExtendedStudentProfile(
        name="Lena (Perfectionniste)",
        description="Veut tout maîtriser à 100%, stress élevé.",
        base_ability=0.75,
        learning_speed=0.85,  # Lent car vérifie tout
        motivation=0.95,
        motivation_variance=0.10,
        focus=0.90,
        fatigue_resistance=0.50,
        session_skip_prob=0.01,
        early_quit_prob=0.01,
        preferred_time=TimeOfDay.MORNING,
        weekend_studier=True,
        resilience=0.30,  # Très sensible aux échecs
        topic_preferences={},
        # Nouveaux paramètres
        days_until_exam=60,  # Planifie à l'avance
        target_mastery=1.0,  # Veut 100%!
        primary_device=DeviceType.DESKTOP,
        learning_style=LearningStyle.TEXTUAL,  # Lit tout en détail
        subject_history=SubjectHistory.POSITIVE,
    ),
}


# =============================================================================
# ÉLÈVE SIMULÉ AVANCÉ
# =============================================================================

class AdvancedSimulatedStudent:
    """Élève simulé avec tous les effets réalistes et interaction Prof IA"""

    def __init__(self, profile: ExtendedStudentProfile, ai_teacher: AITeacher):
        self.profile = profile
        self.ai_teacher = ai_teacher  # Prof IA
        self.knowledge: Dict[str, float] = {}
        self.current_motivation = profile.motivation
        self.fatigue = 0.0
        self.session_questions = 0
        self.cumulative_fatigue = 0.0  # Fatigue sur plusieurs jours
        self.days_since_last_session = 0
        self.consecutive_failures = 0
        self.consecutive_successes = 0
        self.total_sessions = 0
        self.is_burned_out = False
        self.confidence = 0.5  # 0-1
        self.responses_history: List[dict] = []  # Historique pour le Prof IA
        self.ai_boosts_received = 0  # Compteur des aides du Prof IA

        # NOUVEAUX COMPORTEMENTS ÉLÈVES
        self.is_in_plateau = False  # Effet plateau (stagnation)
        self.plateau_days = 0  # Jours en plateau
        self.guessing_count = 0  # Nombre de réponses devinées
        self.cramming_mode = False  # Mode révision dernière minute
        self.stress_level = 0.0  # Niveau de stress (0-1)
        self.mood = "neutral"  # État d'humeur: neutral, frustrated, confident, anxious
        self.mastery_history: Dict[str, List[float]] = {}  # Historique maîtrise par topic
        self.consecutive_poor_explanations = 0  # Pour frustration Prof IA

        # NOUVEAUX PARAMÈTRES (Device, Style, History, Deadline)
        self.anxiety = 0.0  # Anxiété liée à l'historique/deadline
        self._apply_subject_history_effects()
        self._apply_device_effects_init()

    def _apply_subject_history_effects(self):
        """Applique les effets de l'historique avec la matière au démarrage"""
        history = self.profile.subject_history
        effects = SUBJECT_HISTORY_EFFECTS[history]

        # Confiance initiale
        self.confidence = effects["confidence_start"]

        # Motivation ajustée
        self.current_motivation = max(0.1, min(1.0,
            self.current_motivation + effects["motivation_bonus"]
        ))

        # Anxiété initiale
        self.anxiety = effects["anxiety"]

        # Résilience ajustée (stockée pour référence)
        self._resilience_modifier = effects["resilience_bonus"]

    def _apply_device_effects_init(self):
        """Applique les effets de l'appareil au démarrage"""
        device = self.profile.primary_device
        effects = DEVICE_EFFECTS[device]

        # Modifier la fatigue_resistance selon l'appareil
        self._device_fatigue_rate = effects["fatigue_rate"]
        self._device_focus_modifier = effects["focus"]
        self._device_session_max = effects["session_length_max"]

    def apply_device_effects(self) -> Dict[str, float]:
        """Retourne les effets de l'appareil pour cette session"""
        device = self.profile.primary_device
        effects = DEVICE_EFFECTS[device]
        return {
            "focus": effects["focus"],
            "fatigue_rate": effects["fatigue_rate"],
            "session_max": effects["session_length_max"],
            "skip_prob": effects["skip_prob"],
        }

    def apply_deadline_pressure(self, current_day: int) -> Dict[str, float]:
        """
        Calcule la pression de la deadline sur la motivation et le stress.

        Plus l'examen approche:
        - Motivation augmente (urgence)
        - Stress augmente
        - Focus peut baisser (panique)
        """
        if self.profile.days_until_exam is None:
            return {"motivation": 0.0, "stress": 0.0, "focus": 0.0}

        days_remaining = max(0, self.profile.days_until_exam - current_day)

        if days_remaining <= 0:
            # Jour de l'examen ou après
            return {"motivation": -0.30, "stress": 0.80, "focus": -0.20}
        elif days_remaining <= 3:
            # Dernière ligne droite - panique!
            return {"motivation": 0.30, "stress": 0.60, "focus": -0.10}
        elif days_remaining <= 7:
            # Semaine avant - urgence
            return {"motivation": 0.20, "stress": 0.40, "focus": 0.0}
        elif days_remaining <= 14:
            # 2 semaines - conscience
            return {"motivation": 0.10, "stress": 0.20, "focus": 0.05}
        elif days_remaining <= 30:
            # 1 mois - planification
            return {"motivation": 0.05, "stress": 0.10, "focus": 0.05}
        else:
            # Loin - pas de pression
            return {"motivation": 0.0, "stress": 0.0, "focus": 0.0}

    def apply_learning_style_to_explanation(self, explanation_quality: float) -> float:
        """
        Ajuste la qualité de l'explication selon le style d'apprentissage.

        Si le contenu correspond au style préféré = boost
        Si le contenu ne correspond pas = pénalité
        """
        style = self.profile.learning_style
        effects = LEARNING_STYLE_EFFECTS[style]

        # Simuler si l'explication correspond au style (50% de chance)
        # En réalité, cela dépendrait du type de contenu servi
        matches_style = random.random() < 0.5

        if matches_style:
            return min(1.0, explanation_quality + effects["explanation_boost"])
        else:
            return max(0.1, explanation_quality + effects["text_only_penalty"])

    def check_avoidance_behavior(self, difficulty: int) -> bool:
        """
        Vérifie si l'élève évite les questions difficiles (phobie).

        Les élèves avec phobie ont tendance à:
        - Sauter les questions difficiles
        - Répondre au hasard pour finir vite
        """
        if self.profile.subject_history != SubjectHistory.PHOBIA:
            return False

        avoidance_prob = SUBJECT_HISTORY_EFFECTS[SubjectHistory.PHOBIA].get("avoidance_prob", 0.0)

        # Plus la difficulté est haute, plus la probabilité d'évitement
        avoidance_prob += (difficulty - 1) * 0.10

        # Plus l'anxiété est haute, plus l'évitement
        avoidance_prob += self.anxiety * 0.20

        return random.random() < avoidance_prob

    def apply_time_effects(self, time_of_day: TimeOfDay) -> Tuple[float, float]:
        """Applique les effets de l'heure"""
        effects = TIME_EFFECTS[time_of_day]

        # Bonus si c'est l'heure préférée
        if time_of_day == self.profile.preferred_time:
            focus_mod = effects["focus"] + 0.10
            fatigue_mod = effects["fatigue"] - 0.05
        else:
            focus_mod = effects["focus"]
            fatigue_mod = effects["fatigue"]

        return focus_mod, fatigue_mod

    def apply_day_effects(self, day: DayOfWeek) -> float:
        """Applique les effets du jour de la semaine"""
        base_effect = DAY_EFFECTS[day]

        # Weekend: dépend du profil
        if day in [DayOfWeek.SATURDAY, DayOfWeek.SUNDAY]:
            if not self.profile.weekend_studier:
                return base_effect - 0.20  # Grosse baisse si n'aime pas étudier le weekend

        return base_effect

    def apply_life_event(self, event: LifeEvent) -> Dict[str, float]:
        """Applique les effets d'un événement de vie"""
        effects = {
            "motivation": 0.0,
            "skip_prob": 0.0,
            "focus": 0.0,
            "ability": 0.0
        }

        if event == LifeEvent.EXAM_WEEK:
            effects["motivation"] = -0.15
            effects["skip_prob"] = 0.30  # Beaucoup plus de chance de sauter
            effects["focus"] = -0.10

        elif event == LifeEvent.VACATION:
            # 50% chance d'étudier beaucoup, 50% pas du tout
            if random.random() < 0.5:
                effects["motivation"] = 0.20
                effects["skip_prob"] = -0.10
            else:
                effects["skip_prob"] = 0.80  # Presque sûr de sauter

        elif event == LifeEvent.SICK:
            effects["motivation"] = -0.20
            effects["focus"] = -0.25
            effects["ability"] = -0.15
            effects["skip_prob"] = 0.50

        elif event == LifeEvent.FAMILY_EVENT:
            effects["skip_prob"] = 0.40

        elif event == LifeEvent.GOOD_NEWS:
            effects["motivation"] = 0.20
            effects["focus"] = 0.10

        elif event == LifeEvent.BAD_NEWS:
            effects["motivation"] = -0.25
            effects["focus"] = -0.15

        return effects

    def apply_decay(self):
        """Applique le déclin de connaissance après une pause"""
        if self.days_since_last_session > 0:
            # Formule de déclin: perte de ~5-10% par jour d'absence
            decay_rate = 0.05 + 0.02 * min(self.days_since_last_session, 7)

            for topic in self.knowledge:
                decay = self.knowledge[topic] * decay_rate * self.days_since_last_session
                self.knowledge[topic] = max(0.0, self.knowledge[topic] - decay)

    def update_psychological_state(self, is_correct: bool, difficulty: int):
        """Met à jour l'état psychologique"""
        p = self.profile

        if is_correct:
            self.consecutive_failures = 0
            self.consecutive_successes += 1
            # Boost de confiance
            self.confidence = min(1.0, self.confidence + 0.05 * (1 + difficulty * 0.1))
        else:
            self.consecutive_successes = 0
            self.consecutive_failures += 1
            # Perte de confiance (atténuée par résilience)
            loss = 0.08 * (1 - p.resilience * 0.5)
            self.confidence = max(0.1, self.confidence - loss)

        # Effet de découragement après série d'échecs
        if self.consecutive_failures >= 5:
            self.current_motivation *= (0.7 + p.resilience * 0.2)

        # Boost après série de succès
        if self.consecutive_successes >= 5:
            self.current_motivation = min(1.0, self.current_motivation * 1.1)

    def check_burnout(self, session_duration_minutes: float):
        """Vérifie si l'élève est en burnout"""
        # Burnout si: session très longue + fatigue élevée + plusieurs jours d'affilée
        if session_duration_minutes > 90 and self.fatigue > 0.8 and self.cumulative_fatigue > 0.6:
            if random.random() < 0.3:  # 30% de chance
                self.is_burned_out = True
                return True
        return False

    # =========================================================================
    # NOUVEAUX COMPORTEMENTS ÉLÈVES
    # =========================================================================

    def check_plateau(self, topic: str) -> bool:
        """
        Vérifie si l'élève est en plateau (stagnation de maîtrise).

        Plateau = maîtrise qui n'augmente plus depuis plusieurs sessions.
        Effet psychologique: démotivation, impression de ne plus progresser.
        """
        if topic not in self.mastery_history:
            self.mastery_history[topic] = []

        current_mastery = self.knowledge.get(topic, 0.0)
        history = self.mastery_history[topic]

        # Enregistrer la maîtrise actuelle
        history.append(current_mastery)
        if len(history) > 10:
            history.pop(0)

        # Vérifier plateau: moins de 5% de progression sur les 5 dernières mesures
        if len(history) >= 5:
            recent = history[-5:]
            progression = max(recent) - min(recent)

            if progression < 0.05 and current_mastery > 0.3 and current_mastery < 0.85:
                self.is_in_plateau = True
                self.plateau_days += 1
                return True

        self.is_in_plateau = False
        self.plateau_days = 0
        return False

    def should_guess(self) -> bool:
        """
        Vérifie si l'élève va deviner au hasard au lieu de réfléchir.

        Causes de "guessing":
        - Fatigue élevée
        - Confiance très basse
        - Questions trop difficiles répétées
        - Manque de temps (cramming)
        """
        guess_prob = 0.02  # Base: 2%

        # Fatigue
        if self.fatigue > 0.7:
            guess_prob += 0.15
        elif self.fatigue > 0.5:
            guess_prob += 0.08

        # Confiance basse
        if self.confidence < 0.3:
            guess_prob += 0.12
        elif self.confidence < 0.5:
            guess_prob += 0.05

        # Série d'échecs
        if self.consecutive_failures >= 4:
            guess_prob += 0.20

        # Mode cramming = plus de guessing
        if self.cramming_mode:
            guess_prob += 0.10

        if random.random() < guess_prob:
            self.guessing_count += 1
            return True
        return False

    def enter_cramming_mode(self, days_until_exam: int):
        """
        Active le mode révision de dernière minute.

        Effets:
        - Motivation temporairement boostée
        - Focus augmenté
        - Mais fatigue s'accumule plus vite
        - Rétention à long terme réduite
        """
        if days_until_exam <= 3:
            self.cramming_mode = True
            self.current_motivation = min(1.0, self.current_motivation + 0.30)
            self.stress_level = min(1.0, self.stress_level + 0.40)
        elif days_until_exam <= 7:
            self.cramming_mode = True
            self.current_motivation = min(1.0, self.current_motivation + 0.15)
            self.stress_level = min(1.0, self.stress_level + 0.20)
        else:
            self.cramming_mode = False

    def update_mood(self):
        """
        Met à jour l'humeur de l'élève basé sur les performances récentes.

        Humeurs possibles:
        - neutral: état par défaut
        - frustrated: série d'échecs, plateau
        - confident: série de succès
        - anxious: stress élevé, exam proche
        """
        # Par défaut
        self.mood = "neutral"

        # Anxiété
        if self.stress_level > 0.6 or self.cramming_mode:
            self.mood = "anxious"
            return

        # Frustration
        if self.consecutive_failures >= 3 or self.is_in_plateau:
            self.mood = "frustrated"
            return

        # Confiance
        if self.consecutive_successes >= 4 and self.confidence > 0.7:
            self.mood = "confident"
            return

    def apply_plateau_effects(self) -> Dict[str, float]:
        """
        Applique les effets négatifs du plateau.

        En plateau:
        - Motivation baisse
        - Impression de stagner
        - Besoin de changer d'approche
        """
        if not self.is_in_plateau:
            return {"motivation": 0.0, "learning_penalty": 0.0}

        # Plus le plateau dure, pire c'est
        motivation_loss = min(0.20, 0.05 * self.plateau_days)
        learning_penalty = min(0.30, 0.10 * self.plateau_days)

        return {
            "motivation": -motivation_loss,
            "learning_penalty": learning_penalty
        }

    def apply_cramming_effects(self) -> Dict[str, float]:
        """
        Applique les effets du mode cramming.

        Cramming:
        + Focus temporairement augmenté
        + Motivation haute (deadline)
        - Fatigue s'accumule plus vite
        - Rétention à long terme réduite de 40%
        """
        if not self.cramming_mode:
            return {"focus_boost": 0.0, "fatigue_rate": 1.0, "retention_penalty": 0.0}

        return {
            "focus_boost": 0.15,
            "fatigue_rate": 1.5,  # Fatigue 50% plus rapide
            "retention_penalty": 0.40  # 40% de perte de rétention long terme
        }

    def start_session(
        self,
        day_of_week: DayOfWeek,
        time_of_day: TimeOfDay,
        life_event: LifeEvent = LifeEvent.NONE
    ) -> bool:
        """Début de session avec tous les effets. Retourne False si skip."""
        p = self.profile

        # Appliquer le déclin d'abord
        self.apply_decay()

        # Reset fatigue session (mais garder cumulative)
        self.fatigue = min(0.3, self.cumulative_fatigue * 0.3)
        self.session_questions = 0

        # Calculer la motivation effective
        day_effect = self.apply_day_effects(day_of_week)
        life_effects = self.apply_life_event(life_event)

        variance = random.uniform(-p.motivation_variance, p.motivation_variance)
        self.current_motivation = p.motivation + variance + day_effect + life_effects["motivation"]
        self.current_motivation = max(0.1, min(1.0, self.current_motivation))

        # Vérifier si skip
        skip_prob = p.session_skip_prob + life_effects["skip_prob"]

        # Burnout = skip forcé
        if self.is_burned_out:
            if random.random() < 0.7:  # 70% de chance de skip en burnout
                self.days_since_last_session += 1
                return False
            else:
                self.is_burned_out = False  # Récupération

        if random.random() < skip_prob:
            self.days_since_last_session += 1
            return False

        self.days_since_last_session = 0
        self.total_sessions += 1
        return True

    def should_quit_early(self, questions_answered: int, session_minutes: float) -> Tuple[bool, Optional[str]]:
        """Décide si l'élève abandonne"""
        p = self.profile

        # Probabilité de base
        prob = p.early_quit_prob
        prob += self.fatigue * 0.15
        prob += (1 - self.current_motivation) * 0.15
        prob += (1 - self.confidence) * 0.10

        # Sessions très longues = plus de chance d'abandonner
        if session_minutes > 60:
            prob += 0.10
        if session_minutes > 90:
            prob += 0.15
        if session_minutes > 120:
            prob += 0.25

        # Série d'échecs = découragement
        if self.consecutive_failures >= 3:
            prob += 0.10 * (1 - p.resilience)

        if random.random() < prob:
            reasons = [
                "Distraction",
                "Fatigue",
                "Perte de motivation",
                "Autre priorité",
                "Découragement" if self.consecutive_failures >= 3 else "Pause nécessaire",
                "Session trop longue" if session_minutes > 60 else "Besoin d'air"
            ]
            return True, random.choice(reasons)

        return False, None

    def answer_question(
        self,
        topic: str,
        difficulty: int,
        time_of_day: TimeOfDay,
        session_minutes: float
    ) -> dict:
        """Simule une réponse avec tous les effets"""
        mastery = self.knowledge.get(topic, 0.0)
        p = self.profile

        # Effets temporels
        focus_mod, fatigue_mod = self.apply_time_effects(time_of_day)

        # Préférence topic
        topic_bonus = p.topic_preferences.get(topic, 0.0)

        # Probabilité de base
        base_prob = p.base_ability + mastery * 0.3 + topic_bonus

        # Malus difficulté
        diff_penalty = (difficulty - 1) * 0.08

        # Bonus/malus
        motivation_bonus = (self.current_motivation - 0.5) * 0.15
        focus_bonus = (p.focus + focus_mod - 0.5) * 0.1
        confidence_bonus = (self.confidence - 0.5) * 0.10

        # Malus fatigue (augmenté pour sessions longues)
        effective_fatigue = self.fatigue + fatigue_mod
        if session_minutes > 60:
            effective_fatigue += 0.10
        if session_minutes > 90:
            effective_fatigue += 0.15
        fatigue_penalty = effective_fatigue * 0.20

        prob_correct = base_prob - diff_penalty + motivation_bonus + focus_bonus + confidence_bonus - fatigue_penalty
        prob_correct = max(0.10, min(0.95, prob_correct))

        is_correct = random.random() < prob_correct

        # Temps de réponse
        base_time = 8 + difficulty * 4
        base_time *= (1.2 - (p.focus + focus_mod) * 0.3)
        base_time *= (1 + effective_fatigue * 0.5)
        if session_minutes > 90:
            base_time *= 1.3  # Plus lent si fatigué
        response_time = base_time + random.uniform(-3, 10)
        response_time = max(3, response_time)

        # Augmenter fatigue
        fatigue_increase = 0.02 * (1 - p.fatigue_resistance)
        if session_minutes > 60:
            fatigue_increase *= 1.5
        self.fatigue = min(1.0, self.fatigue + fatigue_increase)
        self.session_questions += 1

        # Mettre à jour l'état psychologique
        self.update_psychological_state(is_correct, difficulty)

        return {
            "is_correct": is_correct,
            "response_time": response_time,
            "prob": prob_correct,
            "effective_fatigue": effective_fatigue
        }

    def learn(self, topic: str, is_correct: bool, difficulty: int):
        """Apprentissage avec effets et aide du Prof IA"""
        current = self.knowledge.get(topic, 0.0)
        p = self.profile

        # Efficacité d'apprentissage
        efficiency = p.learning_speed * p.focus * (0.8 + self.current_motivation * 0.4)
        efficiency *= (1 - self.fatigue * 0.3)
        efficiency *= (0.8 + self.confidence * 0.4)  # La confiance aide

        # Bonus topic préféré
        topic_bonus = 1 + p.topic_preferences.get(topic, 0.0) * 0.5

        # === INTERVENTION PROF IA ===
        ai_boost = 0.0

        if not is_correct:
            # Prof IA donne une explication après erreur
            # RÉALISME: passer le focus et la fatigue de l'élève
            explanation = self.ai_teacher.give_explanation(
                topic=topic,
                difficulty=difficulty,
                student_mastery=current,
                student_focus=p.focus * (1 - self.fatigue * 0.3),  # Focus effectif
                student_fatigue=self.fatigue
            )

            # L'effet dépend de si l'élève a lu l'explication
            if explanation["was_read"]:
                ai_boost = explanation["comprehension_boost"]
                self.current_motivation = min(1.0, self.current_motivation + explanation["motivation_boost"])
            else:
                ai_boost = explanation["comprehension_boost"]  # Très faible si skip
                # Pas de boost motivation si skip
            self.ai_boosts_received += 1

            # Enregistrer dans l'historique pour détection de patterns
            self.responses_history.append({
                "topic_id": topic,
                "is_correct": False,
                "difficulty": difficulty,
                "response_time": 15  # Approximation
            })

            # Prof IA détecte les patterns de difficulté
            pattern = self.ai_teacher.detect_difficulty_pattern(self.responses_history, topic)
            if pattern:
                # Aide supplémentaire si pattern détecté
                ai_boost += pattern.get("boost_on_correct", 0.05)

        # Prof IA encourage régulièrement
        if self.session_questions % 5 == 0:  # Toutes les 5 questions
            encouragement = self.ai_teacher.give_encouragement(
                self.consecutive_failures,
                self.consecutive_successes,
                self.confidence,
                p.resilience
            )
            self.current_motivation = min(1.0, self.current_motivation + encouragement["motivation_boost"])
            self.confidence = min(1.0, self.confidence + encouragement["confidence_boost"])

        # === CALCUL DU GAIN ===
        if is_correct:
            gain = 0.06 * efficiency * topic_bonus * (1 + difficulty * 0.1)
            self.knowledge[topic] = min(1.0, current + gain)

            # Enregistrer succès
            self.responses_history.append({
                "topic_id": topic,
                "is_correct": True,
                "difficulty": difficulty,
                "response_time": 10
            })
        else:
            # Même sur erreur, le Prof IA aide à comprendre
            # Gain réduit mais présent grâce à l'explication
            base_gain = 0.015 * efficiency * topic_bonus

            # Bonus du Prof IA (explication)
            ai_learning_boost = ai_boost * 0.5  # L'explication aide à comprendre

            # Plus l'élève est réceptif (motivation + résilience), plus l'aide est efficace
            receptivity = (self.current_motivation + p.resilience) / 2
            total_gain = base_gain + ai_learning_boost * receptivity

            self.knowledge[topic] = min(1.0, current + total_gain)

    def end_session(self, session_minutes: float):
        """Fin de session - mise à jour fatigue cumulative"""
        # Ajouter à la fatigue cumulative
        self.cumulative_fatigue = min(1.0, self.cumulative_fatigue + self.fatigue * 0.3)

        # Vérifier burnout
        self.check_burnout(session_minutes)

        # Récupération naturelle
        self.cumulative_fatigue = max(0.0, self.cumulative_fatigue - 0.1)


# =============================================================================
# SIMULATION AVANCÉE
# =============================================================================

def generate_life_events(num_days: int) -> Dict[int, LifeEvent]:
    """Génère des événements de vie aléatoires"""
    events = {}

    for day in range(1, num_days + 1):
        roll = random.random()
        if roll < 0.02:  # 2% maladie
            events[day] = LifeEvent.SICK
            # Maladie dure 2-3 jours
            for d in range(day + 1, min(day + random.randint(2, 3), num_days + 1)):
                events[d] = LifeEvent.SICK
        elif roll < 0.05:  # 3% événement familial
            events[day] = LifeEvent.FAMILY_EVENT
        elif roll < 0.08:  # 3% bonne nouvelle
            events[day] = LifeEvent.GOOD_NEWS
        elif roll < 0.10:  # 2% mauvaise nouvelle
            events[day] = LifeEvent.BAD_NEWS

    # Ajouter une semaine d'exam (jours 10-12 par exemple)
    if num_days >= 12:
        for d in range(10, 13):
            if d not in events:
                events[d] = LifeEvent.EXAM_WEEK

    return events


def run_advanced_simulation(
    profile_key: str,
    num_days: int = 21,
    questions_per_session: int = 15,
    allow_marathon: bool = True,
    verbose: bool = True
):
    """Exécute une simulation avancée avec Prof IA et nouvelles métriques"""

    profile = EXTENDED_PROFILES[profile_key]

    # Créer le Prof IA pour cet élève
    ai_teacher = AITeacher()

    student = AdvancedSimulatedStudent(profile, ai_teacher)
    user_id = f"adv_sim_{profile_key}"
    topics = ["conjugaison", "grammaire", "vocabulaire", "orthographe"]

    # NOUVEAU: Créer le tracker de qualité
    quality_tracker = QualityTracker()

    # Générer événements de vie (avec nouveaux événements)
    life_events = generate_life_events(num_days)

    # NOUVEAU: Ajouter vacances scolaires et rentrée
    if num_days >= 21:
        # Vacances scolaires jours 15-20
        for d in range(15, min(21, num_days + 1)):
            if d not in life_events:
                life_events[d] = LifeEvent.SCHOOL_VACATION
        # Rentrée jour 21
        if 21 <= num_days:
            life_events[21] = LifeEvent.BACK_TO_SCHOOL

    if verbose:
        print(f"\n{'='*70}")
        print(f"👤 {profile.name}")
        print(f"   {profile.description}")
        print(f"   Heure préférée: {profile.preferred_time.value}")
        print(f"   Résilience: {profile.resilience:.0%}")
        print(f"{'='*70}")

    # Stats
    daily_stats = []
    total_xp = 0
    sessions_skipped = 0
    early_quits = 0
    burnouts = 0
    marathon_sessions = 0
    total_session_minutes = 0

    # NOUVEAU: Stats comportements élèves
    total_guesses = 0
    plateau_events = 0
    cramming_days = 0

    start_date = datetime(2024, 1, 1)  # Date fictive

    for day in range(1, num_days + 1):
        current_date = start_date + timedelta(days=day-1)
        day_of_week = DayOfWeek(current_date.weekday())

        # NOUVEAU: Appliquer le cycle de motivation
        motivation_cycle = get_motivation_cycle(day)
        cycle_effects = MOTIVATION_CYCLE_EFFECTS[motivation_cycle]

        # Choisir l'heure (préférence + variance)
        if random.random() < 0.7:
            time_of_day = profile.preferred_time
        else:
            time_of_day = random.choice(list(TimeOfDay))

        # Événement du jour
        life_event = life_events.get(day, LifeEvent.NONE)

        # NOUVEAU: Vérifier mode cramming (avant exam)
        days_until_exam = 12 - day if day < 12 else 999  # Exam au jour 12
        student.enter_cramming_mode(days_until_exam)
        if student.cramming_mode:
            cramming_days += 1

        # Appliquer effets du cycle de motivation
        student.current_motivation = min(1.0, max(0.1,
            student.current_motivation + cycle_effects["motivation"]
        ))

        # Tenter de démarrer la session
        session_started = student.start_session(day_of_week, time_of_day, life_event)

        if not session_started:
            sessions_skipped += 1
            if student.is_burned_out:
                burnouts += 1
                if verbose and day <= 5:
                    print(f"   Jour {day} ({day_of_week.name[:3]}): 🔥 BURNOUT - repos forcé")
            elif verbose and day <= 5:
                event_str = f" [{life_event.value}]" if life_event != LifeEvent.NONE else ""
                print(f"   Jour {day} ({day_of_week.name[:3]}): ⏭️ Session sautée{event_str}")

            daily_stats.append({
                "day": day,
                "skipped": True,
                "reason": "burnout" if student.is_burned_out else "skip",
                "life_event": life_event.value,
                "mastery": sum(student.knowledge.values()) / max(1, len(student.knowledge)) if student.knowledge else 0
            })
            continue

        lean_engine.reset_session(user_id)

        day_correct = 0
        day_total = 0
        day_xp = 0
        session_start = datetime.now()

        # Déterminer la durée de session (marathon si profile le permet)
        if allow_marathon and profile_key == "marathon":
            target_questions = random.randint(40, 80)  # Session très longue
            marathon_sessions += 1
        elif allow_marathon and random.random() < 0.1:
            target_questions = random.randint(25, 40)  # Session longue occasionnelle
        else:
            target_questions = questions_per_session

        session_minutes = 0.0

        session_difficulties = []  # Pour tracker

        for q_num in range(target_questions):
            # Calculer le temps écoulé (simulé)
            session_minutes = q_num * 2.5  # ~2.5 min par question en moyenne

            # Vérifier abandon précoce
            quit_early, reason = student.should_quit_early(q_num, session_minutes)
            if quit_early:
                early_quits += 1
                if verbose and day <= 5:
                    print(f"   Jour {day}: 🚪 Abandon après {q_num} questions ({reason})")
                break

            # Choisir topic (interleaving)
            topic = topics[q_num % len(topics)]
            mastery = int(student.knowledge.get(topic, 0.0) * 100)

            # NOUVEAU: Vérifier plateau
            if student.check_plateau(topic):
                plateau_events += 1
                quality_tracker.record_negative_event("plateau")

            # NOUVEAU: Mettre à jour l'humeur
            student.update_mood()

            # Paramètres optimaux
            params = lean_engine.get_next_question(user_id, topic, mastery)
            session_difficulties.append(params.difficulty)

            # NOUVEAU: Vérifier si l'élève devine au hasard
            is_guessing = student.should_guess()
            if is_guessing:
                total_guesses += 1

            # Réponse
            response = student.answer_question(topic, params.difficulty, time_of_day, session_minutes)

            # Si devine, réduire la probabilité effective
            if is_guessing:
                # Guessing = 25% de chance (hasard sur 4 options)
                response["is_correct"] = random.random() < 0.25

            # Traiter
            result = lean_engine.process_answer(
                user_id=user_id,
                topic_id=topic,
                is_correct=response["is_correct"],
                response_time=response["response_time"],
                difficulty=params.difficulty
            )

            # Apprentissage (réduit si guessing)
            mastery_before = student.knowledge.get(topic, 0.0)
            if not is_guessing:
                student.learn(topic, response["is_correct"], params.difficulty)
            mastery_after = student.knowledge.get(topic, 0.0)

            # NOUVEAU: Tracker efficacité Prof IA
            if not response["is_correct"]:
                ai_was_useful = mastery_after > mastery_before
                quality_tracker.record_ai_intervention(ai_was_useful)
                ai_teacher.record_effectiveness(mastery_before, mastery_after)

            day_total += 1
            if response["is_correct"]:
                day_correct += 1
            day_xp += result.xp_earned
            total_xp += result.xp_earned

            # Pause si suggérée (et session longue)
            if result.should_take_break and session_minutes > 30:
                if verbose and q_num < 20:
                    print(f"      ⚠️ Pause suggérée (fatigue: {response['effective_fatigue']:.0%})")
                # 50% chance de prendre la pause
                if random.random() < 0.5:
                    break

        # Fin de session
        student.end_session(session_minutes)
        total_session_minutes += session_minutes

        # NOUVEAU: Enregistrer session dans quality tracker
        if day_total > 0:
            completion_rate = day_total / target_questions
            quality_tracker.record_session(day, completion_rate, session_minutes, session_difficulties)
            quality_tracker.record_mastery_snapshot(day, student.knowledge.copy())

        # Stats du jour
        if day_total > 0:
            accuracy = day_correct / day_total
            avg_mastery = sum(student.knowledge.values()) / len(student.knowledge) if student.knowledge else 0

            daily_stats.append({
                "day": day,
                "skipped": False,
                "accuracy": accuracy,
                "mastery": avg_mastery,
                "questions": day_total,
                "xp": day_xp,
                "session_minutes": session_minutes,
                "life_event": life_event.value,
                "confidence": student.confidence,
                "fatigue": student.fatigue
            })

            if verbose and (day <= 5 or day == num_days or day_total > 30):
                event_str = f" [{life_event.value}]" if life_event != LifeEvent.NONE else ""
                marathon_str = f" 🏃 MARATHON {day_total}q" if day_total > 30 else ""
                print(f"   Jour {day}: ✅ {accuracy*100:.0f}% précision, {avg_mastery*100:.0f}% maîtrise, {day_xp} XP{event_str}{marathon_str}")

    # Résultats
    completed_days = [d for d in daily_stats if not d.get("skipped", False)]

    if completed_days:
        final_mastery = completed_days[-1]["mastery"]
        final_accuracy = sum(d["accuracy"] for d in completed_days) / len(completed_days)
        total_questions = sum(d.get("questions", 0) for d in completed_days)
        avg_confidence = sum(d.get("confidence", 0.5) for d in completed_days) / len(completed_days)
    else:
        final_mastery = 0
        final_accuracy = 0
        total_questions = 0
        avg_confidence = 0

    # Stats du Prof IA (incluant nouvelles métriques réalistes)
    ai_stats = ai_teacher.get_stats()

    # NOUVEAU: Calculer les métriques de qualité
    quality_metrics = quality_tracker.calculate_metrics()

    # NOUVEAU: Évaluer le risque d'abandon
    dropout_risk = assess_dropout_risk(student)

    return {
        "profile": profile.name,
        "final_mastery": final_mastery,
        "final_accuracy": final_accuracy,
        "total_xp": total_xp,
        "total_questions": total_questions,
        "sessions_completed": len(completed_days),
        "sessions_skipped": sessions_skipped,
        "early_quits": early_quits,
        "days": num_days,
        "burnouts": burnouts,
        "marathon_sessions": marathon_sessions,
        "avg_session_minutes": total_session_minutes / max(1, len(completed_days)),
        "avg_confidence": avg_confidence,
        "life_events_faced": len([e for e in life_events.values() if e != LifeEvent.NONE]),
        # Stats Prof IA - basiques
        "ai_interventions": ai_stats["total_interventions"],
        "ai_explanations": ai_stats["explanations"],
        "ai_encouragements": ai_stats["encouragements"],
        "ai_patterns_detected": ai_stats["patterns_detected"],
        "ai_boosts_received": student.ai_boosts_received,
        # Stats Prof IA - réalistes
        "ai_explanations_skipped": ai_stats["explanations_skipped"],
        "ai_explanations_reread": ai_stats["explanations_reread"],
        "ai_hallucinations": ai_stats["hallucinations"],
        "ai_skip_rate": ai_stats["skip_rate"],
        "ai_reread_rate": ai_stats["reread_rate"],
        "ai_hallucination_rate": ai_stats["hallucination_rate"],
        "ai_reading_time_min": ai_stats["total_reading_time_min"],
        "ai_latency_sec": ai_stats["api_latency_total_sec"],
        # NOUVEAU: Stats Prof IA avancées
        "ai_frustration_events": ai_stats.get("frustration_events", 0),
        "ai_tone_adaptations": ai_stats.get("tone_adaptations", 0),
        "ai_effectiveness_rate": ai_stats.get("effectiveness_rate", 0),
        "ai_mastery_gains": ai_stats.get("mastery_gains_from_ai", 0),
        # NOUVEAU: Comportements élèves
        "total_guesses": total_guesses,
        "plateau_events": plateau_events,
        "cramming_days": cramming_days,
        "student_mood": student.mood,
        "stress_level": student.stress_level,
        # NOUVEAU: Métriques qualité
        "short_term_retention": quality_metrics.short_term_retention,
        "medium_term_retention": quality_metrics.medium_term_retention,
        "long_term_retention": quality_metrics.long_term_retention,
        "mastery_per_hour": quality_metrics.mastery_per_hour,
        "optimal_difficulty_rate": quality_metrics.optimal_difficulty_rate,
        "ai_impact_score": quality_metrics.ai_impact_score,
        "dropout_risk_score": dropout_risk["risk_score"],
        "dropout_risk_level": dropout_risk["risk_level"],
        "dropout_risk_factors": dropout_risk["risk_factors"],
        "total_study_hours": quality_metrics.total_study_time_hours,
        "streak_days": quality_metrics.streak_days,
    }


def run_all_advanced_simulations():
    """Exécute toutes les simulations avancées avec Prof IA"""

    print("\n" + "=" * 70)
    print("🧪 SIMULATION RÉALISTE AVANCÉE - MOTEUR LEAN v4.0 + PROF IA")
    print("=" * 70)

    # Info moteur
    info = lean_engine.get_engine_info()
    print(f"\n📊 Moteur: {info['version']} ({info['modules']} modules)")
    print(f"🤖 Prof IA: GPT-4 (explications, encouragements, détection patterns)")
    print(f"📅 Durée: 21 jours avec événements de vie")

    results = []

    # Profils standards
    print("\n" + "-" * 70)
    print("📋 PROFILS STANDARDS (avec effets réalistes)")
    print("-" * 70)

    for profile_key in ["determined", "average", "irregular", "struggling"]:
        result = run_advanced_simulation(profile_key, num_days=21, verbose=True)
        results.append(result)

    # Cas extrêmes
    print("\n" + "-" * 70)
    print("⚡ CAS EXTRÊMES")
    print("-" * 70)

    for profile_key in ["marathon", "procrastinator", "perfectionist"]:
        result = run_advanced_simulation(profile_key, num_days=21, verbose=True)
        results.append(result)

    # Tableau comparatif
    print("\n" + "=" * 70)
    print("📊 COMPARATIF COMPLET")
    print("=" * 70)

    print(f"\n{'Profil':<25} {'Maîtrise':>8} {'Précision':>9} {'Sessions':>9} {'Confiance':>10} {'Burnouts':>9}")
    print("-" * 80)

    for r in results:
        sessions_str = f"{r['sessions_completed']}/{r['days']}"
        print(f"{r['profile']:<25} {r['final_mastery']*100:>7.0f}% {r['final_accuracy']*100:>8.0f}% {sessions_str:>9} {r['avg_confidence']*100:>9.0f}% {r['burnouts']:>9}")

    # Analyse cas extrêmes
    print("\n" + "=" * 70)
    print("🔍 ANALYSE DES CAS EXTRÊMES")
    print("=" * 70)

    marathon = next((r for r in results if "Marathon" in r['profile']), None)
    procrastinator = next((r for r in results if "Procrastin" in r['profile']), None)
    perfectionist = next((r for r in results if "Perfection" in r['profile']), None)

    if marathon:
        print(f"""
🏃 MARATHONIEN ({marathon['profile']}):
   → Maîtrise: {marathon['final_mastery']*100:.0f}%
   → Sessions marathon: {marathon['marathon_sessions']}
   → Burnouts: {marathon['burnouts']}
   → Durée moy. session: {marathon['avg_session_minutes']:.0f} min
   → ⚠️ Risque: Sessions trop longues = burnout""")

    if procrastinator:
        print(f"""
📅 PROCRASTINATEUR ({procrastinator['profile']}):
   → Maîtrise: {procrastinator['final_mastery']*100:.0f}%
   → Sessions: {procrastinator['sessions_completed']}/{procrastinator['days']} ({procrastinator['sessions_completed']/procrastinator['days']*100:.0f}%)
   → Abandons précoces: {procrastinator['early_quits']}
   → ⚠️ Risque: Trop de sessions sautées""")

    if perfectionist:
        print(f"""
🎯 PERFECTIONNISTE ({perfectionist['profile']}):
   → Maîtrise: {perfectionist['final_mastery']*100:.0f}%
   → Confiance: {perfectionist['avg_confidence']*100:.0f}%
   → Sessions: {perfectionist['sessions_completed']}/{perfectionist['days']}
   → ⚠️ Risque: Stress si échecs (résilience faible)""")

    # Stats Prof IA globales
    print("\n" + "=" * 70)
    print("🤖 IMPACT DU PROF IA (avec réalisme)")
    print("=" * 70)

    total_ai_interventions = sum(r.get("ai_interventions", 0) for r in results)
    total_ai_explanations = sum(r.get("ai_explanations", 0) for r in results)
    total_ai_encouragements = sum(r.get("ai_encouragements", 0) for r in results)
    total_ai_patterns = sum(r.get("ai_patterns_detected", 0) for r in results)

    # Nouvelles stats réalistes
    total_skipped = sum(r.get("ai_explanations_skipped", 0) for r in results)
    total_reread = sum(r.get("ai_explanations_reread", 0) for r in results)
    total_hallucinations = sum(r.get("ai_hallucinations", 0) for r in results)
    total_reading_time = sum(r.get("ai_reading_time_min", 0) for r in results)
    total_latency = sum(r.get("ai_latency_sec", 0) for r in results)

    print(f"""
📊 STATISTIQUES PROF IA (toutes simulations):
   → Interventions totales: {total_ai_interventions}
   → Explications données: {total_ai_explanations}
   → Encouragements: {total_ai_encouragements}
   → Patterns détectés: {total_ai_patterns}

🎭 RÉALISME DE L'INTERACTION:
   → Explications skippées: {total_skipped} ({total_skipped/max(1,total_ai_explanations)*100:.1f}%)
   → Explications relues: {total_reread} ({total_reread/max(1,total_ai_explanations)*100:.1f}%)
   → Hallucinations IA: {total_hallucinations} ({total_hallucinations/max(1,total_ai_explanations)*100:.2f}%)
   → Temps de lecture total: {total_reading_time:.1f} minutes
   → Latence API totale: {total_latency:.1f} secondes

🎯 IMPACT PAR PROFIL:""")

    print(f"\n{'Profil':<22} {'Aides':>6} {'Skip':>6} {'Reread':>7} {'Hallu':>6} {'Lecture':>9}")
    print("-" * 65)
    for r in results:
        ai_help = r.get("ai_boosts_received", 0)
        skip = r.get("ai_explanations_skipped", 0)
        reread = r.get("ai_explanations_reread", 0)
        hallu = r.get("ai_hallucinations", 0)
        read_time = r.get("ai_reading_time_min", 0)
        print(f"   {r['profile'][:19]:<19} {ai_help:>6} {skip:>6} {reread:>7} {hallu:>6} {read_time:>7.1f}min")

    # NOUVEAU: Section comportements élèves
    print("\n" + "=" * 70)
    print("🧠 COMPORTEMENTS ÉLÈVES SIMULÉS")
    print("=" * 70)

    total_guesses = sum(r.get("total_guesses", 0) for r in results)
    total_plateaus = sum(r.get("plateau_events", 0) for r in results)
    total_cramming = sum(r.get("cramming_days", 0) for r in results)

    print(f"""
📊 STATISTIQUES COMPORTEMENTALES:
   → Réponses devinées (guessing): {total_guesses}
   → Événements plateau: {total_plateaus}
   → Jours en mode cramming: {total_cramming}

🎭 ÉTATS ÉMOTIONNELS FINAUX:""")

    for r in results:
        mood = r.get("student_mood", "neutral")
        stress = r.get("stress_level", 0)
        mood_emoji = {"neutral": "😐", "frustrated": "😤", "confident": "😊", "anxious": "😰"}.get(mood, "❓")
        print(f"   {r['profile'][:20]:<20} {mood_emoji} {mood:<12} stress: {stress*100:.0f}%")

    # NOUVEAU: Section métriques qualité
    print("\n" + "=" * 70)
    print("📈 MÉTRIQUES DE QUALITÉ DU SYSTÈME")
    print("=" * 70)

    print(f"\n{'Profil':<20} {'Rétention':>10} {'Maîtrise/h':>12} {'Diff Opt':>10} {'Risque':>8}")
    print("-" * 70)
    for r in results:
        retention = r.get("medium_term_retention", 0)
        mastery_h = r.get("mastery_per_hour", 0)
        opt_diff = r.get("optimal_difficulty_rate", 0)
        risk = r.get("dropout_risk_level", "low")
        risk_emoji = {"low": "🟢", "medium": "🟡", "high": "🟠", "critical": "🔴"}.get(risk, "⚪")
        print(f"   {r['profile'][:17]:<17} {retention*100:>9.0f}% {mastery_h:>11.2f}% {opt_diff*100:>9.0f}% {risk_emoji} {risk:<6}")

    # NOUVEAU: Analyse risque d'abandon
    at_risk = [r for r in results if r.get("dropout_risk_level") in ["high", "critical"]]
    if at_risk:
        print(f"\n⚠️ ÉLÈVES À RISQUE D'ABANDON:")
        for r in at_risk:
            factors = r.get("dropout_risk_factors", [])
            print(f"   {r['profile']}: {', '.join(factors) if factors else 'multiples facteurs'}")

    # NOUVEAU: Efficacité Prof IA
    print("\n" + "=" * 70)
    print("🎯 EFFICACITÉ DU PROF IA")
    print("=" * 70)

    total_effective = sum(r.get("ai_effectiveness_rate", 0) for r in results)
    avg_effectiveness = total_effective / len(results) if results else 0

    print(f"""
📊 IMPACT MESURÉ:
   → Taux d'efficacité moyen: {avg_effectiveness:.1f}%
   → Gain de maîtrise total grâce au Prof IA: {sum(r.get('ai_mastery_gains', 0) for r in results):.2f}

🏆 CLASSEMENT EFFICACITÉ PAR PROFIL:""")

    sorted_by_effectiveness = sorted(results, key=lambda x: x.get("ai_effectiveness_rate", 0), reverse=True)
    for i, r in enumerate(sorted_by_effectiveness[:5], 1):
        eff = r.get("ai_effectiveness_rate", 0)
        print(f"   {i}. {r['profile'][:20]:<20} → {eff:.1f}% efficacité")

    # Verdict global
    print("\n" + "=" * 70)
    standard_profiles = results[:4]
    all_progressed = all(r['final_mastery'] > 0.2 for r in standard_profiles)

    if all_progressed:
        print("✅ SYSTÈME ROBUSTE - Tous les profils standards progressent!")
        print("   Le moteur + Prof IA s'adapte aux différents comportements d'apprentissage.")
    else:
        print("⚠️ AJUSTEMENTS NÉCESSAIRES")

    # Résumé final des améliorations
    print("\n📋 FONCTIONNALITÉS SIMULÉES:")
    print("   ✓ Prof IA avancé (followup, adaptation ton, frustration)")
    print("   ✓ Comportements élèves (plateau, guessing, cramming)")
    print("   ✓ Effets temporels (cycles motivation, vacances)")
    print("   ✓ Métriques qualité (rétention, efficacité, risque abandon)")

    print("=" * 70)

    return results


if __name__ == "__main__":
    results = run_all_advanced_simulations()
    sys.exit(0)
