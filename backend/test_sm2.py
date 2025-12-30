"""
Tests pour l'algorithme SM-2++ (Spaced Repetition)

Exécuter avec:
    python test_sm2.py
    
Ou avec pytest:
    pytest test_sm2.py -v
"""

import sys
import os
from datetime import datetime, timedelta

# Ajouter le dossier parent au path pour les imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils.sm2_algorithm import (
    calculate_next_review,
    calculate_mastery_change,
    determine_difficulty,
    calculate_xp_reward
)

# ═══════════════════════════════════════════════════════════════
# TESTS CALCULATE_NEXT_REVIEW
# ═══════════════════════════════════════════════════════════════

def test_next_review_quality_5_first_time():
    """Première révision parfaite → intervalle 1 jour"""
    ease, interval, date = calculate_next_review(
        quality=5,
        ease_factor=2.5,
        interval=1,
        repetitions=0
    )
    assert interval == 1
    assert ease >= 2.5  # Ease factor augmente ou reste stable

def test_next_review_quality_5_second_time():
    """Deuxième révision parfaite → intervalle 6 jours"""
    ease, interval, date = calculate_next_review(
        quality=5,
        ease_factor=2.5,
        interval=1,
        repetitions=1
    )
    assert interval == 6

def test_next_review_quality_5_third_time():
    """Troisième révision → intervalle = ancien × ease_factor"""
    ease, interval, date = calculate_next_review(
        quality=5,
        ease_factor=2.5,
        interval=6,
        repetitions=2
    )
    # 6 × 2.5+ = 15+
    assert interval >= 12

def test_next_review_failure_resets_interval():
    """Échec (quality < 3) → reset à 1 jour"""
    ease, interval, date = calculate_next_review(
        quality=2,
        ease_factor=2.5,
        interval=30,  # Grand intervalle
        repetitions=5
    )
    assert interval == 1

def test_next_review_skip_penalty():
    """Pénalité de skip réduit la qualité effective"""
    # Sans skip
    ease1, interval1, _ = calculate_next_review(
        quality=5,
        ease_factor=2.5,
        interval=6,
        repetitions=2,
        skip_days=0
    )
    
    # Avec 5 jours de skip
    ease2, interval2, _ = calculate_next_review(
        quality=5,
        ease_factor=2.5,
        interval=6,
        repetitions=2,
        skip_days=5
    )
    
    # L'intervalle devrait être plus court avec le skip
    assert interval2 <= interval1

def test_next_review_forgiveness_system():
    """Skips consécutifs réduisent l'intervalle (forgiveness)"""
    # Sans skips consécutifs
    _, interval1, _ = calculate_next_review(
        quality=5,
        ease_factor=2.5,
        interval=6,
        repetitions=2,
        consecutive_skips=0
    )
    
    # Avec 3 skips consécutifs
    _, interval2, _ = calculate_next_review(
        quality=5,
        ease_factor=2.5,
        interval=6,
        repetitions=2,
        consecutive_skips=3
    )
    
    # L'intervalle devrait être réduit
    assert interval2 < interval1

def test_next_review_ease_factor_bounds():
    """Ease factor reste entre min (1.3) et max (2.5)"""
    # Beaucoup d'échecs → ease factor minimum
    ease, _, _ = calculate_next_review(
        quality=0,
        ease_factor=1.3,
        interval=1,
        repetitions=0
    )
    assert ease >= 1.3
    
    # Beaucoup de succès → ease factor maximum
    ease, _, _ = calculate_next_review(
        quality=5,
        ease_factor=2.5,
        interval=1,
        repetitions=0
    )
    assert ease <= 2.5

def test_next_review_date_is_future():
    """La date de prochaine révision est dans le futur"""
    _, _, date = calculate_next_review(
        quality=5,
        ease_factor=2.5,
        interval=1,
        repetitions=0
    )
    assert date > datetime.now()

# ═══════════════════════════════════════════════════════════════
# TESTS CALCULATE_MASTERY_CHANGE
# ═══════════════════════════════════════════════════════════════

def test_mastery_change_correct_easy():
    """Réponse correcte facile → +5 points"""
    change = calculate_mastery_change(
        is_correct=True,
        difficulty="easy",
        current_mastery=50,
        response_time=60
    )
    assert change == 5

def test_mastery_change_correct_medium():
    """Réponse correcte moyenne → +10 points"""
    change = calculate_mastery_change(
        is_correct=True,
        difficulty="medium",
        current_mastery=50,
        response_time=60
    )
    assert change == 10

def test_mastery_change_correct_hard():
    """Réponse correcte difficile → +15 points"""
    change = calculate_mastery_change(
        is_correct=True,
        difficulty="hard",
        current_mastery=50,
        response_time=60
    )
    assert change == 15

def test_mastery_change_incorrect():
    """Réponse incorrecte → perte de points"""
    change_easy = calculate_mastery_change(
        is_correct=False,
        difficulty="easy",
        current_mastery=50,
        response_time=60
    )
    change_hard = calculate_mastery_change(
        is_correct=False,
        difficulty="hard",
        current_mastery=50,
        response_time=60
    )
    
    assert change_easy == -5
    assert change_hard == -10

def test_mastery_change_speed_bonus():
    """Réponse rapide → bonus de points"""
    # Réponse normale (60s)
    change_normal = calculate_mastery_change(
        is_correct=True,
        difficulty="medium",
        current_mastery=50,
        response_time=60,
        expected_time=60
    )
    
    # Réponse très rapide (30s = 50% plus rapide)
    change_fast = calculate_mastery_change(
        is_correct=True,
        difficulty="medium",
        current_mastery=50,
        response_time=30,
        expected_time=60
    )
    
    assert change_fast > change_normal

def test_mastery_change_high_mastery_reduction():
    """Maîtrise élevée → gains réduits"""
    change_50 = calculate_mastery_change(
        is_correct=True,
        difficulty="hard",
        current_mastery=50,
        response_time=60
    )
    
    change_85 = calculate_mastery_change(
        is_correct=True,
        difficulty="hard",
        current_mastery=85,
        response_time=60
    )
    
    # Les gains sont réduits quand on est proche de 100%
    assert change_85 < change_50

# ═══════════════════════════════════════════════════════════════
# TESTS DETERMINE_DIFFICULTY
# ═══════════════════════════════════════════════════════════════

def test_difficulty_low_mastery():
    """Maîtrise basse → difficulté facile"""
    diff = determine_difficulty(mastery_level=20, success_rate=0.5)
    assert diff == "easy"

def test_difficulty_medium_mastery_low_success():
    """Maîtrise moyenne + faible succès → facile"""
    diff = determine_difficulty(mastery_level=45, success_rate=0.4)
    assert diff == "easy"

def test_difficulty_medium_mastery_high_success():
    """Maîtrise moyenne + bon succès → difficile"""
    diff = determine_difficulty(mastery_level=45, success_rate=0.85)
    assert diff == "hard"

def test_difficulty_high_mastery():
    """Maîtrise élevée → difficile"""
    diff = determine_difficulty(mastery_level=85, success_rate=0.8)
    assert diff == "hard"

def test_difficulty_decay_on_skip():
    """Skip days réduisent la difficulté effective"""
    # Sans skip
    diff_no_skip = determine_difficulty(
        mastery_level=70,
        success_rate=0.8,
        skip_days=0
    )
    
    # Avec 10 jours de skip (50% de decay)
    diff_with_skip = determine_difficulty(
        mastery_level=70,
        success_rate=0.8,
        skip_days=10
    )
    
    # Après 10 jours de skip, la difficulté devrait baisser
    difficulty_order = {"easy": 0, "medium": 1, "hard": 2}
    assert difficulty_order[diff_with_skip] <= difficulty_order[diff_no_skip]

# ═══════════════════════════════════════════════════════════════
# TESTS CALCULATE_XP_REWARD
# ═══════════════════════════════════════════════════════════════

def test_xp_reward_correct():
    """Réponse correcte → XP basé sur difficulté"""
    xp_easy = calculate_xp_reward(is_correct=True, difficulty="easy", streak=0)
    xp_medium = calculate_xp_reward(is_correct=True, difficulty="medium", streak=0)
    xp_hard = calculate_xp_reward(is_correct=True, difficulty="hard", streak=0)
    
    assert xp_easy == 10
    assert xp_medium == 20
    assert xp_hard == 35

def test_xp_reward_incorrect():
    """Réponse incorrecte → 0 XP"""
    xp = calculate_xp_reward(is_correct=False, difficulty="hard", streak=10)
    assert xp == 0

def test_xp_reward_streak_bonus():
    """Streak augmente l'XP"""
    xp_no_streak = calculate_xp_reward(
        is_correct=True,
        difficulty="medium",
        streak=0
    )
    
    xp_with_streak = calculate_xp_reward(
        is_correct=True,
        difficulty="medium",
        streak=10  # +50% bonus
    )
    
    assert xp_with_streak > xp_no_streak

def test_xp_reward_first_of_day_bonus():
    """Première question du jour → +50 XP"""
    xp_normal = calculate_xp_reward(
        is_correct=True,
        difficulty="medium",
        streak=0,
        is_first_of_day=False
    )
    
    xp_first = calculate_xp_reward(
        is_correct=True,
        difficulty="medium",
        streak=0,
        is_first_of_day=True
    )
    
    assert xp_first == xp_normal + 50

def test_xp_reward_streak_cap():
    """Le bonus streak est plafonné à 30 jours (150%)"""
    xp_30_days = calculate_xp_reward(
        is_correct=True,
        difficulty="medium",
        streak=30
    )
    
    xp_100_days = calculate_xp_reward(
        is_correct=True,
        difficulty="medium",
        streak=100  # Devrait être plafonné à 30
    )
    
    assert xp_30_days == xp_100_days


# ═══════════════════════════════════════════════════════════════
# MAIN - Exécution des tests
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    tests = [
        # calculate_next_review
        test_next_review_quality_5_first_time,
        test_next_review_quality_5_second_time,
        test_next_review_quality_5_third_time,
        test_next_review_failure_resets_interval,
        test_next_review_skip_penalty,
        test_next_review_forgiveness_system,
        test_next_review_ease_factor_bounds,
        test_next_review_date_is_future,
        
        # calculate_mastery_change
        test_mastery_change_correct_easy,
        test_mastery_change_correct_medium,
        test_mastery_change_correct_hard,
        test_mastery_change_incorrect,
        test_mastery_change_speed_bonus,
        test_mastery_change_high_mastery_reduction,
        
        # determine_difficulty
        test_difficulty_low_mastery,
        test_difficulty_medium_mastery_low_success,
        test_difficulty_medium_mastery_high_success,
        test_difficulty_high_mastery,
        test_difficulty_decay_on_skip,
        
        # calculate_xp_reward
        test_xp_reward_correct,
        test_xp_reward_incorrect,
        test_xp_reward_streak_bonus,
        test_xp_reward_first_of_day_bonus,
        test_xp_reward_streak_cap,
    ]
    
    passed = 0
    failed = 0
    
    print("=" * 60)
    print("🧪 Tests SM-2++ Algorithm")
    print("=" * 60)
    
    for test in tests:
        try:
            test()
            print(f"✅ {test.__name__}")
            passed += 1
        except AssertionError as e:
            print(f"❌ {test.__name__}: {e}")
            failed += 1
        except Exception as e:
            print(f"💥 {test.__name__}: {type(e).__name__}: {e}")
            failed += 1
    
    print("=" * 60)
    print(f"📊 Résultats: {passed}/{len(tests)} tests réussis")
    
    if failed == 0:
        print("🎉 Tous les tests sont passés!")
    else:
        print(f"⚠️  {failed} test(s) échoué(s)")
    
    print("=" * 60)
    
    sys.exit(0 if failed == 0 else 1)



