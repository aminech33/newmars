"""
SM-2++ Algorithm - Spaced Repetition optimisé pour procrastinateurs

Basé sur l'algorithme SM-2 avec modifications:
- Pénalité douce pour les skips (pas écrasant)
- Difficulty decay automatique
- Forgiveness system
"""
from datetime import datetime, timedelta
from typing import Tuple
from config import settings


def calculate_next_review(
    quality: int,  # 0-5 (0=échec total, 5=facile parfait)
    ease_factor: float,
    interval: int,  # jours
    repetitions: int,
    skip_days: int = 0,  # jours de procrastination
    consecutive_skips: int = 0
) -> Tuple[float, int, datetime]:
    """
    Calcule la prochaine révision selon SM-2++
    
    Args:
        quality: Qualité de la réponse (0-5)
        ease_factor: Facteur de facilité actuel
        interval: Intervalle actuel en jours
        repetitions: Nombre de répétitions
        skip_days: Jours de retard
        consecutive_skips: Skips consécutifs
        
    Returns:
        (new_ease_factor, new_interval, next_review_date)
    """
    
    # 🔴 Pénalité douce pour procrastination
    skip_penalty = min(skip_days * settings.SKIP_PENALTY, settings.MAX_SKIP_PENALTY)
    adjusted_quality = max(0, quality - skip_penalty)
    
    # Calcul du nouveau ease factor
    new_ease_factor = ease_factor + (
        0.1 - (5 - adjusted_quality) * (0.08 + (5 - adjusted_quality) * 0.02)
    )
    
    # Contraindre entre min et max
    new_ease_factor = max(
        settings.MIN_EASE_FACTOR,
        min(settings.MAX_EASE_FACTOR, new_ease_factor)
    )
    
    # Calcul de l'intervalle
    if adjusted_quality < 3:
        # Échec - recommencer
        new_interval = 1
        new_repetitions = 0
    else:
        new_repetitions = repetitions + 1
        
        if new_repetitions == 1:
            new_interval = 1
        elif new_repetitions == 2:
            new_interval = 6
        else:
            new_interval = int(interval * new_ease_factor)
    
    # 🟢 Réduction d'intervalle si skips multiples (forgiveness)
    if consecutive_skips > 0:
        forgiveness_factor = 1.0 - (consecutive_skips * 0.1)
        forgiveness_factor = max(0.5, forgiveness_factor)  # Max -50%
        new_interval = int(new_interval * forgiveness_factor)
    
    # Minimum 1 jour, Maximum 365 jours (évite overflow)
    new_interval = max(1, min(365, new_interval))

    # Date de prochaine révision
    next_review = datetime.now() + timedelta(days=new_interval)
    
    return new_ease_factor, new_interval, next_review


def calculate_mastery_change(
    is_correct: bool,
    difficulty: str,
    current_mastery: int,
    response_time: int,  # secondes
    expected_time: int = 60
) -> int:
    """
    Calcule le changement de maîtrise après une réponse
    
    Args:
        is_correct: Réponse correcte?
        difficulty: Difficulté de la question
        current_mastery: Niveau actuel (0-100)
        response_time: Temps de réponse
        expected_time: Temps attendu
        
    Returns:
        Points de maîtrise gagnés/perdus (-20 à +20)
    """
    
    if not is_correct:
        # Échec - perte légère
        if difficulty == "easy":
            return -5
        elif difficulty == "medium":
            return -8
        else:  # hard
            return -10
    
    # Réussite - gain basé sur difficulté
    base_gain = {
        "easy": 5,
        "medium": 10,
        "hard": 15
    }[difficulty]
    
    # Bonus si réponse rapide
    speed_ratio = expected_time / max(response_time, 1)
    if speed_ratio > 1.5:  # 50% plus rapide
        base_gain += 3
    elif speed_ratio > 1.2:  # 20% plus rapide
        base_gain += 1
    
    # Réduction si proche du max (évite de stagner à 100%)
    if current_mastery > 80:
        base_gain = int(base_gain * 0.7)
    elif current_mastery > 90:
        base_gain = int(base_gain * 0.5)
    
    return base_gain


def determine_difficulty(
    mastery_level: int,
    success_rate: float,
    skip_days: int = 0,
    success_by_difficulty: dict = None
) -> str:
    """
    Détermine la difficulté adaptée (VERSION AMÉLIORÉE)
    
    Zone de Développement Proximal dynamique:
    - Toujours "juste assez difficile"
    - Baisse auto si skips (difficulty decay)
    - Utilise success_rate par difficulté si disponible
    
    Args:
        mastery_level: Niveau de maîtrise (0-100)
        success_rate: Taux de réussite récent global (0-1)
        skip_days: Jours de skip (pour decay)
        success_by_difficulty: Dict avec success rates par difficulté {"easy": 0.9, "medium": 0.5, "hard": 0.2}
        
    Returns:
        "easy" | "medium" | "hard"
    """
    
    # 🔴 Difficulty decay - baisse si skip
    if skip_days > 0:
        decay = skip_days * settings.DIFFICULTY_DECAY_RATE
        mastery_level = max(0, mastery_level - (decay * 100))
    
    # ✨ NOUVEAU: Si on a des success rates par difficulté, les utiliser
    if success_by_difficulty and any(v > 0 for v in success_by_difficulty.values()):
        # Stratégie: Choisir la difficulté où le success rate est entre 60-80% (ZDP optimale)
        easy_sr = success_by_difficulty.get("easy", 0)
        medium_sr = success_by_difficulty.get("medium", 0)
        hard_sr = success_by_difficulty.get("hard", 0)

        # PRIORITÉ 1: Forcer le passage à hard si maîtrise très haute (>85%) et bon success rate
        # Même si medium_sr < 85%, on doit challenger l'élève expert
        if mastery_level >= 85 and medium_sr >= 0.70:
            return "hard"

        # Si on réussit trop facilement à medium (>85%), passer à hard
        if medium_sr > 0.85 and mastery_level >= 40:
            return "hard"

        # Si on galère sur medium (<50%), rester sur easy
        if medium_sr > 0 and medium_sr < 0.5 and easy_sr >= 0.65:
            return "easy"

        # Si on réussit bien easy (>80%) et que mastery >= 30, essayer medium
        if easy_sr > 0.8 and mastery_level >= 30:
            return "medium"

        # Si on galère sur hard (<40%) mais ok sur medium (>60%), rester medium
        if hard_sr > 0 and hard_sr < 0.4 and medium_sr > 0.6:
            return "medium"

        # Si on a assez de données hard et qu'on galère trop (<30%), redescendre
        if hard_sr > 0 and hard_sr < 0.3:
            return "medium"
    
    # Logique classique (fallback si pas assez de données)
    if mastery_level < 30:
        return "easy"
    elif mastery_level < 60:
        # Entre 30-60, basé sur le success rate global
        if success_rate < 0.5:
            return "easy"
        elif success_rate > 0.8:
            return "hard"
        return "medium"
    elif mastery_level < 80:
        # Entre 60-80
        if success_rate < 0.6:
            return "medium"
        return "hard"
    else:
        # 80+, expert level
        if success_rate < 0.7:
            return "medium"
        return "hard"


def calculate_xp_reward(
    is_correct: bool,
    difficulty: str,
    streak: int,
    is_first_of_day: bool = False
) -> int:
    """
    Calcule l'XP gagné (gamification)
    
    Args:
        is_correct: Réponse correcte?
        difficulty: Difficulté
        streak: Streak actuel
        is_first_of_day: Première question du jour?
        
    Returns:
        XP gagné
    """
    
    if not is_correct:
        return 0
    
    # XP de base
    base_xp = {
        "easy": 10,
        "medium": 20,
        "hard": 35
    }[difficulty]
    
    # Bonus streak
    streak_multiplier = 1.0 + (min(streak, 30) * 0.05)  # +5% par jour, max 150%
    
    total_xp = int(base_xp * streak_multiplier)
    
    # Bonus première du jour
    if is_first_of_day:
        total_xp += 50
    
    return total_xp
