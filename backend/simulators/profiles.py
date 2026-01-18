"""
Profils d'étudiants pour les simulations NewMars
================================================

Définition unifiée de StudentProfile avec TOUS les attributs.
Les profils simulent différents types d'apprenants.

IMPORTANT: C'est l'UNIQUE définition de StudentProfile du projet.
Ne jamais dupliquer cette dataclass ailleurs!
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List


class TimeOfDay(Enum):
    """Moment préféré pour étudier."""
    MORNING = "morning"
    AFTERNOON = "afternoon"
    EVENING = "evening"
    NIGHT = "night"


class LifeEvent(Enum):
    """Événements de vie qui affectent l'apprentissage."""
    NONE = "none"
    EXAM_WEEK = "exam_week"
    SICK = "sick"
    VACATION = "vacation"
    GOOD_NEWS = "good_news"
    BAD_NEWS = "bad_news"


class LearningStyle(Enum):
    """Style d'apprentissage préféré."""
    VISUAL = "visual"
    AUDITORY = "auditory"
    KINESTHETIC = "kinesthetic"
    READING = "reading"


class DeviceType(Enum):
    """Type d'appareil utilisé."""
    DESKTOP = "desktop"
    LAPTOP = "laptop"
    TABLET = "tablet"
    MOBILE = "mobile"


@dataclass
class StudentProfile:
    """
    Profil unifié d'étudiant pour les simulations.

    Combine tous les attributs des différentes versions:
    - learning_simulation.py (8 attributs de base)
    - simulation_master.py (13 attributs)
    - test_simulation_realiste.py (17+ attributs étendus)

    Tous les attributs ont des valeurs par défaut sensées.
    Utilisez les profils prédéfinis ou créez les vôtres.

    Attributes:
        name: Nom du profil
        description: Description du profil

        # Capacités cognitives
        ability: Capacité cognitive (0-1)
        learning_speed: Multiplicateur de vitesse d'apprentissage
        response_speed: Multiplicateur temps de réponse

        # Motivation
        motivation: Niveau de motivation (0-1)
        motivation_variance: Variance de la motivation jour à jour

        # Régularité
        consistency: Régularité des sessions (0-1)
        skip_prob: Probabilité de sauter une session

        # Résilience
        fatigue_resistance: Résistance à la fatigue (0-1)
        focus: Niveau de concentration (0-1)
        resilience: Capacité à rebondir après échecs (0-1)

        # Préférences
        preferred_time: Moment préféré pour étudier
        weekend_studier: Étudie le weekend?
        learning_style: Style d'apprentissage préféré
        preferred_device: Appareil préféré

        # Avancé (pour simulations réalistes)
        active_hours: Heures actives par jour
        tasks_per_day: Tâches par jour
        pomodoro_sessions: Sessions pomodoro par jour
        weight_logging: Log le poids (santé)
        meals_tracking: Track les repas
        hydration_tracking: Track l'hydratation
    """
    # Identité
    name: str
    description: str

    # Capacités cognitives (core)
    ability: float = 0.5              # 0-1, capacité cognitive
    learning_speed: float = 1.0       # Multiplicateur
    response_speed: float = 1.0       # Multiplicateur temps réponse

    # Motivation
    motivation: float = 0.5           # 0-1
    motivation_variance: float = 0.15  # Variance jour à jour

    # Régularité
    consistency: float = 0.5          # 0-1, régularité
    skip_prob: float = 0.10           # Prob de sauter une session

    # Résilience
    fatigue_resistance: float = 0.5   # 0-1, résistance à la fatigue
    focus: float = 0.5                # 0-1, concentration
    resilience: float = 0.5           # 0-1, rebondir après échecs

    # Préférences
    preferred_time: TimeOfDay = TimeOfDay.MORNING
    weekend_studier: bool = True
    learning_style: LearningStyle = LearningStyle.READING
    preferred_device: DeviceType = DeviceType.LAPTOP

    # Avancé (pour e2e et simulations réalistes)
    active_hours: int = 4             # Heures actives par jour
    tasks_per_day: int = 3            # Tâches par jour
    pomodoro_sessions: int = 2        # Sessions pomodoro par jour
    weight_logging: bool = False      # Log le poids
    meals_tracking: bool = False      # Track les repas
    hydration_tracking: bool = False  # Track l'hydratation

    def to_dict(self) -> dict:
        """Convertit le profil en dictionnaire."""
        return {
            "name": self.name,
            "description": self.description,
            "ability": self.ability,
            "learning_speed": self.learning_speed,
            "response_speed": self.response_speed,
            "motivation": self.motivation,
            "motivation_variance": self.motivation_variance,
            "consistency": self.consistency,
            "skip_prob": self.skip_prob,
            "fatigue_resistance": self.fatigue_resistance,
            "focus": self.focus,
            "resilience": self.resilience,
            "preferred_time": self.preferred_time.value,
            "weekend_studier": self.weekend_studier,
            "learning_style": self.learning_style.value,
            "preferred_device": self.preferred_device.value,
        }


# ═══════════════════════════════════════════════════════════════════════════════
# PROFILS STANDARD
# Profils réalistes pour la majorité des utilisateurs
# ═══════════════════════════════════════════════════════════════════════════════

PROFILES = {
    "determined": StudentProfile(
        name="Marie (Déterminée)",
        description="Motivée, capable, régulière",
        ability=0.75,
        learning_speed=1.1,
        response_speed=0.8,
        motivation=0.85,
        motivation_variance=0.05,
        consistency=0.90,
        skip_prob=0.03,
        fatigue_resistance=0.80,
        focus=0.80,
        resilience=0.85,
        preferred_time=TimeOfDay.MORNING,
        weekend_studier=True,
    ),
    "average": StudentProfile(
        name="Salim (Moyen)",
        description="Motivé mais capacité normale",
        ability=0.55,
        learning_speed=0.9,
        response_speed=1.0,
        motivation=0.65,
        motivation_variance=0.15,
        consistency=0.70,
        skip_prob=0.08,
        fatigue_resistance=0.60,
        focus=0.60,
        resilience=0.60,
        preferred_time=TimeOfDay.AFTERNOON,
        weekend_studier=True,
    ),
    "irregular": StudentProfile(
        name="Emma (Irrégulière)",
        description="Capable mais motivation variable",
        ability=0.65,
        learning_speed=1.0,
        response_speed=0.9,
        motivation=0.50,
        motivation_variance=0.25,
        consistency=0.40,
        skip_prob=0.25,
        fatigue_resistance=0.65,
        focus=0.65,
        resilience=0.50,
        preferred_time=TimeOfDay.EVENING,
        weekend_studier=False,
    ),
    "struggling": StudentProfile(
        name="Tom (En difficulté)",
        description="Motivé mais capacité limitée",
        ability=0.40,
        learning_speed=0.70,
        response_speed=1.3,
        motivation=0.70,
        motivation_variance=0.10,
        consistency=0.75,
        skip_prob=0.05,
        fatigue_resistance=0.50,
        focus=0.55,
        resilience=0.45,
        preferred_time=TimeOfDay.MORNING,
        weekend_studier=True,
    ),
    "procrastinator": StudentProfile(
        name="Amine (Procrastinateur)",
        description="Intelligent mais inconsistant",
        ability=0.65,
        learning_speed=1.0,
        response_speed=1.0,
        motivation=0.50,
        motivation_variance=0.30,
        consistency=0.30,
        skip_prob=0.40,
        fatigue_resistance=0.60,
        focus=0.50,
        resilience=0.40,
        preferred_time=TimeOfDay.NIGHT,
        weekend_studier=False,
    ),
}


# ═══════════════════════════════════════════════════════════════════════════════
# PROFILS HARDCORE
# Profils extrêmes pour tester les limites du système
# ═══════════════════════════════════════════════════════════════════════════════

PROFILES_HARDCORE = {
    "ghost": StudentProfile(
        name="Fantôme",
        description="Disparaît pendant des semaines",
        ability=0.50,
        learning_speed=1.0,
        response_speed=1.0,
        motivation=0.30,
        motivation_variance=0.20,
        consistency=0.15,
        skip_prob=0.60,
        fatigue_resistance=0.50,
        focus=0.40,
        resilience=0.30,
        preferred_time=TimeOfDay.EVENING,
        weekend_studier=False,
    ),
    "severe_struggling": StudentProfile(
        name="Lucas (Très en difficulté)",
        description="Capacité très limitée, mais veut réussir",
        ability=0.25,
        learning_speed=0.50,
        response_speed=1.5,
        motivation=0.60,
        motivation_variance=0.10,
        consistency=0.65,
        skip_prob=0.10,
        fatigue_resistance=0.30,
        focus=0.40,
        resilience=0.35,
        preferred_time=TimeOfDay.MORNING,
        weekend_studier=True,
    ),
    "adhd": StudentProfile(
        name="Léa (TDAH)",
        description="Intelligente mais attention très courte",
        ability=0.70,
        learning_speed=1.5,
        response_speed=0.7,
        motivation=0.55,
        motivation_variance=0.50,
        consistency=0.25,
        skip_prob=0.35,
        fatigue_resistance=0.25,
        focus=0.15,
        resilience=0.40,
        preferred_time=TimeOfDay.NIGHT,
        weekend_studier=True,
    ),
    "burnout": StudentProfile(
        name="Marc (Épuisé)",
        description="Travaille, famille, études = burnout",
        ability=0.60,
        learning_speed=0.30,
        response_speed=1.2,
        motivation=0.05,
        motivation_variance=0.02,
        consistency=0.10,
        skip_prob=0.85,
        fatigue_resistance=0.05,
        focus=0.10,
        resilience=0.05,
        preferred_time=TimeOfDay.NIGHT,
        weekend_studier=False,
    ),
    "zero_confidence": StudentProfile(
        name="Sarah (0 confiance)",
        description="Capable mais se croit nulle",
        ability=0.55,
        learning_speed=0.80,
        response_speed=1.4,
        motivation=0.35,
        motivation_variance=0.15,
        consistency=0.50,
        skip_prob=0.25,
        fatigue_resistance=0.40,
        focus=0.45,
        resilience=0.25,
        preferred_time=TimeOfDay.EVENING,
        weekend_studier=True,
    ),
    "genius": StudentProfile(
        name="Einstein (Génie)",
        description="Capacité exceptionnelle",
        ability=0.95,
        learning_speed=2.0,
        response_speed=0.5,
        motivation=0.90,
        motivation_variance=0.02,
        consistency=0.95,
        skip_prob=0.01,
        fatigue_resistance=0.90,
        focus=0.95,
        resilience=0.95,
        preferred_time=TimeOfDay.MORNING,
        weekend_studier=True,
    ),
    "comeback": StudentProfile(
        name="Julien (Comeback)",
        description="Revient après 6 mois d'arrêt",
        ability=0.55,
        learning_speed=1.1,
        response_speed=1.0,
        motivation=0.90,
        motivation_variance=0.15,
        consistency=0.70,
        skip_prob=0.10,
        fatigue_resistance=0.60,
        focus=0.65,
        resilience=0.70,
        preferred_time=TimeOfDay.MORNING,
        weekend_studier=True,
    ),
}


# ═══════════════════════════════════════════════════════════════════════════════
# PROFILS POUR E2E (avec attributs avancés)
# ═══════════════════════════════════════════════════════════════════════════════

PROFILES_E2E = {
    "human": StudentProfile(
        name="User Humain",
        description="Utilisateur réaliste avec toutes les features",
        ability=0.55,
        learning_speed=1.0,
        response_speed=1.0,
        motivation=0.60,
        motivation_variance=0.15,
        consistency=0.60,
        skip_prob=0.15,
        fatigue_resistance=0.55,
        focus=0.55,
        resilience=0.55,
        preferred_time=TimeOfDay.EVENING,
        weekend_studier=True,
        active_hours=3,
        tasks_per_day=4,
        pomodoro_sessions=2,
        weight_logging=True,
        meals_tracking=True,
        hydration_tracking=True,
    ),
    "motivated": StudentProfile(
        name="User Motivé",
        description="Haute discipline et engagement",
        ability=0.75,
        learning_speed=1.2,
        response_speed=0.9,
        motivation=0.85,
        motivation_variance=0.05,
        consistency=0.85,
        skip_prob=0.05,
        fatigue_resistance=0.75,
        focus=0.80,
        resilience=0.80,
        preferred_time=TimeOfDay.MORNING,
        weekend_studier=True,
        active_hours=5,
        tasks_per_day=6,
        pomodoro_sessions=4,
        weight_logging=True,
        meals_tracking=True,
        hydration_tracking=True,
    ),
}


def get_all_profiles() -> dict:
    """Retourne tous les profils (standard + hardcore + e2e)."""
    return {**PROFILES, **PROFILES_HARDCORE, **PROFILES_E2E}


def get_profile(name: str) -> Optional[StudentProfile]:
    """
    Récupère un profil par son nom (clé).

    Args:
        name: Nom du profil (ex: "determined", "burnout")

    Returns:
        StudentProfile ou None si non trouvé
    """
    all_profiles = get_all_profiles()
    return all_profiles.get(name.lower())
