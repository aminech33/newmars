"""
🧪 SIMULATION D'APPRENTISSAGE - NewMars
========================================

Ce fichier est maintenant un WRAPPER autour du module simulators/
pour assurer la rétrocompatibilité.

USAGE:
    # Ancienne API (toujours supportée)
    from simulations.learning_simulation import simulate, PROFILES, run

    # Nouvelle API recommandée
    from simulators import simulate, PROFILES, run

RÉFÉRENCES:
- Ebbinghaus (1885): Courbe d'oubli
- Vygotsky (1978): Zone Proximale de Développement
- Rohrer & Taylor (2007): Interleaving (+43% retention)
- FSRS (2023): State-of-the-art spaced repetition

NOTE: Toute la logique est maintenant dans le module simulators/
Ce fichier existe uniquement pour la rétrocompatibilité.
"""

import sys
from pathlib import Path

# Ajouter le parent au path pour importer simulators
sys.path.insert(0, str(Path(__file__).parent.parent))

# Re-export tout depuis le module consolidé
from simulators import (
    # Config
    FSRS_WEIGHTS,
    REQUEST_RETENTION,
    MASTERY_TARGET,
    MASTERY_CAP,
    LEVEL_MULTIPLIERS,
    SKILLS,
    # FSRS
    Rating,
    FSRSCard,
    fsrs_retrievability,
    fsrs_update,
    # Profiles
    StudentProfile,
    TimeOfDay,
    LifeEvent,
    PROFILES,
    PROFILES_HARDCORE,
    # Cognitive
    CognitiveState,
    assess_cognitive_load,
    # AI Tutor
    AITutor,
    # Core
    calculate_mastery_change,
    calculate_optimal_difficulty,
    select_skill_adaptive,
    simulate_answer,
    simulate_retention_30d,
    # Simulation
    simulate,
    SimResult,
    run,
    run_hardcore,
)

# Alias pour rétrocompatibilité
calculate_difficulty = calculate_optimal_difficulty

__all__ = [
    # Config
    "FSRS_WEIGHTS",
    "REQUEST_RETENTION",
    "MASTERY_TARGET",
    "MASTERY_CAP",
    "LEVEL_MULTIPLIERS",
    "SKILLS",
    # FSRS
    "Rating",
    "FSRSCard",
    "fsrs_retrievability",
    "fsrs_update",
    # Profiles
    "StudentProfile",
    "TimeOfDay",
    "LifeEvent",
    "PROFILES",
    "PROFILES_HARDCORE",
    # Cognitive
    "CognitiveState",
    "assess_cognitive_load",
    # AI Tutor
    "AITutor",
    # Core
    "calculate_mastery_change",
    "calculate_optimal_difficulty",
    "calculate_difficulty",
    "select_skill_adaptive",
    "simulate_answer",
    "simulate_retention_30d",
    # Simulation
    "simulate",
    "SimResult",
    "run",
    "run_hardcore",
]


if __name__ == "__main__":
    args = sys.argv[1:]

    if args and args[0] == "hardcore":
        n = int(args[1]) if len(args) > 1 else 30
        run_hardcore(n)
    else:
        n = int(args[0]) if args else 30
        run(n)
