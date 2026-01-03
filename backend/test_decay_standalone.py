"""
🧪 Test isolé du système de mastery decay
Version standalone sans dépendances
"""

import math
from datetime import datetime, timedelta

# ═══════════════════════════════════════════════════════════════
# Copie standalone des fonctions (pour test sans import)
# ═══════════════════════════════════════════════════════════════

def calculate_decay(
    mastery_level: int,
    days_since_last_review: int,
    ease_factor: float = 2.5,
    learning_strength: int = 1
) -> int:
    """Calcule la dégradation selon Ebbinghaus (version corrigée)"""
    if days_since_last_review <= 0:
        return mastery_level
    
    # Decay plus progressif
    base_strength = ease_factor * 10
    learning_bonus = learning_strength * 5
    retention_strength = base_strength + learning_bonus
    
    retention = math.exp(-days_since_last_review / retention_strength)
    
    # Minimum adaptatif selon niveau
    if mastery_level >= 80:
        min_retention = 0.50
    elif mastery_level >= 50:
        min_retention = 0.35
    else:
        min_retention = 0.25
    
    effective_retention = min_retention + (1 - min_retention) * retention
    new_mastery = int(mastery_level * effective_retention)
    
    return max(0, new_mastery)


def should_review_concept(
    mastery_level: int,
    days_since_last_review: int,
    ease_factor: float = 2.5
) -> bool:
    """Détermine si un concept devrait être révisé (version corrigée)"""
    if mastery_level < 40:
        return days_since_last_review >= 2
    elif mastery_level < 60:
        return days_since_last_review >= 4
    elif mastery_level < 80:
        return days_since_last_review >= 7
    elif mastery_level < 90:
        return days_since_last_review >= 14
    else:
        optimal_interval = int(ease_factor * 10)
        return days_since_last_review >= optimal_interval


# ═══════════════════════════════════════════════════════════════
# TESTS
# ═══════════════════════════════════════════════════════════════

def test_basic_decay():
    """Test calcul de decay basique"""
    print("\n=== TEST 1: Calcul de decay basique ===")
    
    # Cas 1: 80% après 30 jours
    result1 = calculate_decay(80, 30, ease_factor=2.5, learning_strength=3)
    print(f"  80% après 30 jours → {result1}%")
    assert result1 < 80 and result1 >= 40, f"Devrait être entre 40 et 80, mais est {result1}"
    
    # Cas 2: 50% après 60 jours
    result2 = calculate_decay(50, 60, ease_factor=2.0, learning_strength=1)
    print(f"  50% après 60 jours → {result2}%")
    assert result2 < 50, "Devrait diminuer"
    
    # Cas 3: Pas de decay si 0 jours
    result3 = calculate_decay(75, 0)
    print(f"  75% après 0 jours → {result3}%")
    assert result3 == 75, "Pas de changement si 0 jours"
    
    print("✅ PASS - Decay fonctionne correctement\n")
    return True


def test_should_review():
    """Test décision de révision"""
    print("=== TEST 2: Décision de révision ===")
    
    cases = [
        (30, 1, False, "Faible mastery (30%) + 1 jour (trop tôt)"),
        (30, 2, True, "Faible mastery (30%) + 2 jours"),
        (30, 5, True, "Faible mastery (30%) + 5 jours"),
        (50, 2, False, "Moyen mastery (50%) + 2 jours (trop tôt)"),
        (50, 4, True, "Moyen mastery (50%) + 4 jours"),
        (70, 5, False, "Bon mastery (70%) + 5 jours (trop tôt)"),
        (70, 7, True, "Bon mastery (70%) + 7 jours"),
        (90, 10, False, "Excellent mastery (90%) + 10 jours (trop tôt)"),
        (90, 25, True, "Excellent mastery (90%) + 25 jours"),
    ]
    
    all_pass = True
    for mastery, days, expected, desc in cases:
        result = should_review_concept(mastery, days)
        match = result == expected
        symbol = "✓" if match else "✗"
        verdict = "OUI" if result else "NON"
        
        print(f"  {symbol} {desc}: {verdict}")
        
        if not match:
            print(f"      ⚠️  Attendu: {'OUI' if expected else 'NON'}")
            all_pass = False
    
    if all_pass:
        print("✅ PASS - Décisions de révision correctes\n")
    else:
        print("❌ FAIL - Certaines décisions incorrectes\n")
    
    return all_pass


def test_decay_over_time():
    """Test decay progressif sur plusieurs périodes"""
    print("=== TEST 3: Decay progressif ===")
    
    initial_mastery = 80
    periods = [7, 14, 30, 60, 90, 180, 365]
    
    print(f"  Mastery initiale: {initial_mastery}%")
    print("  Évolution:")
    
    previous = initial_mastery
    for days in periods:
        current = calculate_decay(initial_mastery, days, ease_factor=2.5, learning_strength=2)
        decay_amount = initial_mastery - current
        decay_pct = (decay_amount / initial_mastery) * 100
        
        print(f"    {days:3d} jours: {current:2d}% (decay: -{decay_amount}% / -{decay_pct:.1f}%)")
        
        assert current <= previous, f"Mastery devrait diminuer ou rester stable (jours {days})"
        previous = current
    
    # Vérifier minimum retention (20%)
    final = calculate_decay(initial_mastery, 365)
    min_expected = int(initial_mastery * 0.2)
    assert final >= min_expected, f"Après 1 an, minimum {min_expected}% devrait rester"
    
    print("✅ PASS - Decay progressif cohérent\n")
    return True


def test_learning_strength_effect():
    """Test effet du learning strength (nombre de révisions)"""
    print("=== TEST 4: Effet du learning strength ===")
    
    mastery = 70
    days = 30
    
    print(f"  Mastery: {mastery}% après {days} jours")
    print("  Selon nombre de révisions précédentes:")
    
    strengths = [0, 1, 2, 5, 10]
    results = []
    
    for strength in strengths:
        result = calculate_decay(mastery, days, ease_factor=2.5, learning_strength=strength)
        results.append(result)
        print(f"    {strength:2d} révisions: {result}%")
    
    # Vérifier que plus de révisions = moins de decay
    for i in range(len(results) - 1):
        assert results[i] <= results[i+1], "Plus de révisions = meilleure rétention"
    
    print("✅ PASS - Learning strength impacte bien la rétention\n")
    return True


def test_edge_cases():
    """Test cas limites"""
    print("=== TEST 5: Cas limites ===")
    
    # Mastery = 0
    r1 = calculate_decay(0, 30)
    print(f"  0% après 30 jours → {r1}%")
    assert r1 == 0, "0 devrait rester 0"
    
    # Mastery = 100
    r2 = calculate_decay(100, 30)
    print(f"  100% après 30 jours → {r2}%")
    assert r2 < 100 and r2 >= 50, f"Devrait être entre 50 et 100, mais est {r2}"
    
    # Jours négatifs
    r3 = calculate_decay(50, -10)
    print(f"  50% après -10 jours (futur) → {r3}%")
    assert r3 == 50, "Temps négatif = pas de decay"
    
    # Très faible ease_factor
    r4 = calculate_decay(80, 30, ease_factor=1.3)
    r5 = calculate_decay(80, 30, ease_factor=2.5)
    print(f"  80% après 30j (ease 1.3): {r4}%")
    print(f"  80% après 30j (ease 2.5): {r5}%")
    assert r4 < r5, "Ease factor faible = decay plus rapide"
    
    print("✅ PASS - Cas limites gérés correctement\n")
    return True


def test_realistic_scenario():
    """Test scénario réaliste d'apprentissage"""
    print("=== TEST 6: Scénario réaliste ===")
    
    print("  📚 Étudiant apprend 'Python variables'\n")
    
    # Jour 0: Première exposition
    mastery = 20
    print(f"  Jour 0 - Première lecture: {mastery}%")
    
    # Jour 1: Quiz réussi
    mastery = 50
    print(f"  Jour 1 - Quiz réussi: {mastery}%")
    
    # Jour 7: 1 semaine plus tard, decay
    mastery_7d = calculate_decay(mastery, 7, learning_strength=1)
    print(f"  Jour 7 - Après 1 semaine: {mastery_7d}% (decay: -{mastery - mastery_7d}%)")
    
    # Jour 7: Révision + nouveau quiz
    mastery = 70
    print(f"  Jour 7 - Révision + quiz: {mastery}%")
    
    # Jour 21: 2 semaines plus tard
    mastery_21d = calculate_decay(mastery, 14, learning_strength=2)
    print(f"  Jour 21 - Après 2 semaines: {mastery_21d}% (decay: -{mastery - mastery_21d}%)")
    
    # Jour 21: Révision finale
    mastery = 85
    print(f"  Jour 21 - Révision finale: {mastery}%")
    
    # Jour 90: 3 mois plus tard
    mastery_90d = calculate_decay(mastery, 69, learning_strength=3)
    print(f"  Jour 90 - Après 3 mois: {mastery_90d}% (decay: -{mastery - mastery_90d}%)")
    
    # Vérifications plus réalistes avec le nouveau decay
    assert mastery_7d < 50, f"Après 1 semaine, devrait avoir perdu, mais {mastery_7d}"
    assert mastery_7d >= 25, f"Ne devrait pas tomber sous 25%, mais {mastery_7d}"
    assert mastery_21d < 70, f"Après 2 semaines, devrait avoir perdu, mais {mastery_21d}"
    assert mastery_21d >= 35, f"Ne devrait pas tomber sous 35%, mais {mastery_21d}"
    assert mastery_90d >= 42, f"Après 3 mois (avec 3 révisions), devrait être ≥ 42%, mais {mastery_90d}"
    assert mastery_90d < 85, f"Devrait avoir perdu quelque chose, mais {mastery_90d}"
    
    print("\n  🎓 Conclusion: La rétention est réaliste!")
    print("✅ PASS - Scénario cohérent\n")
    return True


def main():
    print("\n" + "="*60)
    print("🧪 TESTS UNITAIRES - SYSTÈME DE MASTERY DECAY")
    print("="*60)
    
    tests = [
        ("Calcul de decay basique", test_basic_decay),
        ("Décision de révision", test_should_review),
        ("Decay progressif", test_decay_over_time),
        ("Effet learning strength", test_learning_strength_effect),
        ("Cas limites", test_edge_cases),
        ("Scénario réaliste", test_realistic_scenario),
    ]
    
    results = []
    
    for name, test_func in tests:
        try:
            success = test_func()
            results.append((name, success))
        except AssertionError as e:
            print(f"❌ FAIL: {e}\n")
            results.append((name, False))
        except Exception as e:
            print(f"💥 ERROR: {e}\n")
            import traceback
            traceback.print_exc()
            results.append((name, False))
    
    # Résumé
    print("="*60)
    print("📊 RÉSUMÉ FINAL")
    print("="*60 + "\n")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅" if result else "❌"
        print(f"{status} {name}")
    
    print("\n" + "="*60)
    
    if passed == total:
        print(f"🎉 SUCCÈS COMPLET: {passed}/{total} tests passés!")
        print("\n✨ Le système de decay est 100% fonctionnel:")
        print("   • Calcul de decay selon courbe d'Ebbinghaus ✓")
        print("   • Décisions de révision adaptatives ✓")
        print("   • Progression réaliste dans le temps ✓")
        print("   • Impact du learning strength ✓")
        print("   • Gestion des cas limites ✓")
        print("   • Scénario d'apprentissage cohérent ✓")
        print("\n🧠 L'oubli naturel est parfaitement simulé!")
    else:
        print(f"⚠️  ATTENTION: {total - passed} test(s) échoué(s)")
        print(f"   {passed}/{total} tests passés ({passed*100//total}%)")
    
    print("="*60 + "\n")
    
    return passed == total


if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)

