"""
Learning Engine - Moteur d'apprentissage adaptatif NewMars.

Ce module contient le moteur d'apprentissage LEAN v4.3 qui optimise
l'apprentissage en adaptant dynamiquement la difficulté, l'espacement
des révisions, et la détection de fatigue.

Architecture:
    - Un seul moteur: learning_engine_lean.py (source of truth unique)
    - 5 modules scientifiques essentiels (FSRS, Testing Effect, Adaptive Difficulty,
      Cognitive Load Detection, Interleaving)
    - Philosophie LEAN: Maximum d'efficacité, minimum de complexité

Usage:
    from learning_engine import LeanLearningEngine

    engine = LeanLearningEngine(db_path="path/to/learning.db")

    # Obtenir les paramètres pour la prochaine question
    params = engine.get_next_question(user_id, topic_id, current_mastery)

    # Traiter une réponse
    result = engine.process_answer(user_id, topic_id, is_correct, response_time, difficulty)

Guidelines:
    - JAMAIS créer learning_engine_v2.py ou variantes
    - Améliorer learning_engine_lean.py directement
    - Toute modification doit être validée par les simulators
    - Pas de duplication de logique métier
    - Un seul moteur, une seule source de vérité

Voir aussi:
    - .claude/learning-engine.md - Guidelines complètes
    - backend/simulators/ - Tests et validation du moteur
    - backend/utils/ - Modules scientifiques (FSRS, cognitive_load, etc.)
"""

from .learning_engine_lean import LeanLearningEngine

__version__ = "4.3.0"
__all__ = ["LeanLearningEngine"]

# Alias pour compatibilité
learning_engine_lean = LeanLearningEngine
