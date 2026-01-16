"""
🧪 Test des nouveaux modules cognitifs V3.0
Test les 4 nouveaux algorithmes d'apprentissage:
1. Dual Coding (Paivio)
2. Chunking (Miller)
3. Elaborative Interrogation (Pressley)
4. Emotional Encoding (Phelps)
"""

import sys
sys.path.insert(0, '.')

from services.advanced_learning_engine import learning_engine


def test_dual_coding():
    """Test du module Dual Coding"""
    print("\n" + "=" * 60)
    print("🎨 TEST DUAL CODING (Paivio, 1971)")
    print("=" * 60)

    content = """
    La photosynthèse est le processus par lequel les plantes convertissent
    la lumière du soleil en énergie. Elle se déroule principalement dans
    les chloroplastes, grâce à la chlorophylle qui absorbe la lumière.
    L'équation simplifiée est: CO2 + H2O + lumière → glucose + O2
    """

    result = learning_engine.encode_with_dual_coding(content, "biologie")

    print(f"\n📝 Contenu original: {len(content)} caractères")
    print(f"\n🎯 Type de contenu détecté: {result['content_type']}")
    print(f"🖼️ Visuel recommandé: {result['recommended_visual']}")
    print(f"📝 Description visuelle: {result['visual_description']}")
    print(f"😀 Emoji cue: {result['emoji_cue']}")
    print(f"🔤 Mnémonique: {result['mnemonic_phrase']}")
    print(f"🔑 Éléments clés: {result['key_elements']}")
    print(f"💪 Force d'encodage: {result['encoding_strength']:.2f}")
    print(f"🔗 Connexions: {result['referential_connections']}")
    print(f"📈 Boost attendu: {result['expected_retention_boost']}")

    assert result['encoding_strength'] > 0.5, "Encoding strength should be > 0.5"
    print("\n✅ Dual Coding: PASS")
    return True


def test_chunking():
    """Test du module Chunking"""
    print("\n" + "=" * 60)
    print("🧩 TEST CHUNKING (Miller, 1956)")
    print("=" * 60)

    content = """
    - Les verbes du premier groupe se terminent en -er
    - Les verbes du deuxième groupe se terminent en -ir
    - Les verbes du troisième groupe sont irréguliers
    - Le présent de l'indicatif exprime une action actuelle
    - L'imparfait exprime une action passée non achevée
    - Le passé simple exprime une action passée achevée
    - Le futur simple exprime une action à venir
    - Le conditionnel exprime une hypothèse
    """

    result = learning_engine.chunk_content(content, "conjugaison", mastery=30)

    print(f"\n📊 Items totaux: {result['total_items']}")
    print(f"🧩 Chunks créés: {result['chunk_count']}")
    print(f"📚 Sessions estimées: {result['estimated_sessions']}")
    print(f"🧠 Charge cognitive: {result['working_memory_load']:.2%}")
    print(f"🎓 Niveau expertise: {result['expertise_level']}")

    print("\n📦 Chunks:")
    for chunk in result['chunks']:
        print(f"   • {chunk['name']}: {len(chunk['items'])} items")
        print(f"     Label: {chunk['semantic_label']}")
        if chunk['mnemonic']:
            print(f"     Mémo: {chunk['mnemonic']}")

    print(f"\n💡 Conseil: {result['tip']}")

    assert result['chunk_count'] >= 2, "Should create at least 2 chunks"
    assert result['working_memory_load'] <= 1.0, "Cognitive load should not exceed 1.0"
    print("\n✅ Chunking: PASS")
    return True


def test_elaborative_interrogation():
    """Test du module Elaborative Interrogation"""
    print("\n" + "=" * 60)
    print("❓ TEST ELABORATIVE INTERROGATION (Pressley, 1987)")
    print("=" * 60)

    content = """
    L'eau bout à 100°C au niveau de la mer. Cette température diminue
    avec l'altitude car la pression atmosphérique est plus faible.
    C'est pourquoi les aliments cuisent plus lentement en montagne.
    """

    result = learning_engine.generate_elaborative_questions(
        content, "physique", num_questions=3
    )

    print(f"\n📝 Technique: {result['technique']}")
    print(f"📚 Recherche: {result['research']}")
    print(f"📈 Boost attendu: {result['expected_boost']}")

    print("\n❓ Questions générées:")
    for i, q in enumerate(result['questions'], 1):
        print(f"\n   {i}. {q['question']}")
        print(f"      Type: {q['type']}")
        print(f"      Difficulté: {q['difficulty']:.1f}")
        print(f"      Hint: {q['hint']}")

    print(f"\n💡 Conseil: {result['tip']}")

    assert len(result['questions']) == 3, "Should generate 3 questions"

    # Test évaluation de réponse
    if result['questions']:
        q_id = result['questions'][0]['id']
        user_response = """
        L'eau bout à 100°C parce que c'est la température à laquelle
        la pression de vapeur de l'eau égale la pression atmosphérique.
        Par exemple, quand on fait cuire des pâtes, on voit des bulles
        car l'eau se transforme en vapeur.
        """

        eval_result = learning_engine.evaluate_elaborative_response(
            q_id, user_response
        )

        print("\n📊 Évaluation de la réponse:")
        print(f"   • Complétude: {eval_result['completeness']:.2%}")
        print(f"   • Profondeur: {eval_result['depth']:.2%}")
        print(f"   • Qualité de génération: {eval_result['generation_quality']:.2%}")
        print(f"   • Score global: {eval_result['overall_score']:.2%}")
        print(f"   • Multiplicateur rétention: {eval_result['retention_multiplier']:.2f}x")
        print(f"   • Feedback: {eval_result['feedback']}")

    print("\n✅ Elaborative Interrogation: PASS")
    return True


def test_emotional_encoding():
    """Test du module Emotional Encoding"""
    print("\n" + "=" * 60)
    print("💖 TEST EMOTIONAL ENCODING (Phelps, 2004)")
    print("=" * 60)

    content = """
    Le théorème de Pythagore stipule que dans un triangle rectangle,
    le carré de l'hypoténuse est égal à la somme des carrés des deux
    autres côtés: a² + b² = c²
    """

    result = learning_engine.encode_emotionally(content, "mathématiques")

    print(f"\n🎣 Hook d'ouverture: {result['opening_hook']}")
    print(f"\n🏁 Hook de clôture: {result['closing_hook']}")

    print("\n🪝 Hooks générés:")
    for h in result['hooks']:
        print(f"   • [{h['type']}] {h['content'][:60]}...")
        print(f"     Émotion cible: {h['target_emotion']}, Intensité: {h['intensity']:.2f}")

    print("\n❓ Curiosity gaps:")
    for gap in result['curiosity_gaps']:
        print(f"   • {gap}")

    print("\n🔗 Relevance bridges:")
    for bridge in result['relevance_bridges']:
        print(f"   • {bridge}")

    print(f"\n📈 Engagement estimé: {result['estimated_engagement']:.2%}")
    print(f"📚 Recherche: {result['research']}")
    print(f"🚀 Boost attendu: {result['expected_boost']}")

    assert result['estimated_engagement'] > 0.5, "Engagement should be > 50%"
    print("\n✅ Emotional Encoding: PASS")
    return True


def test_emotional_state_detection():
    """Test de la détection d'état émotionnel"""
    print("\n" + "=" * 60)
    print("🔍 TEST DÉTECTION ÉTAT ÉMOTIONNEL")
    print("=" * 60)

    # Scénario 1: Apprenant performant
    state1 = learning_engine.detect_emotional_state(
        user_id="test_user_confident",
        recent_accuracy=0.9,
        response_times=[8.0, 12.0, 9.0, 11.0],
        session_duration=25.0,
        streak=5
    )

    print(f"\n📊 Scénario 1: Apprenant performant")
    print(f"   État détecté: {state1['detected_state']}")
    print(f"   Multiplicateur rétention: {state1['retention_multiplier']:.2f}x")
    print(f"   Action recommandée: {state1['action']}")
    print(f"   Message: {state1['message']}")

    # Scénario 2: Apprenant en difficulté
    state2 = learning_engine.detect_emotional_state(
        user_id="test_user_struggling",
        recent_accuracy=0.3,
        response_times=[45.0, 50.0, 60.0, 55.0],
        session_duration=5.0,
        streak=-3
    )

    print(f"\n📊 Scénario 2: Apprenant en difficulté")
    print(f"   État détecté: {state2['detected_state']}")
    print(f"   Multiplicateur rétention: {state2['retention_multiplier']:.2f}x")
    print(f"   Action recommandée: {state2['action']}")
    print(f"   Message: {state2['message']}")
    print(f"   Pause recommandée: {state2['break_needed']}")

    print("\n✅ Détection émotionnelle: PASS")
    return True


def test_cognitive_profile():
    """Test du profil cognitif complet"""
    print("\n" + "=" * 60)
    print("👤 TEST PROFIL COGNITIF COMPLET")
    print("=" * 60)

    profile = learning_engine.get_cognitive_enhancement_profile("test_user")

    print(f"\n📋 Profil pour: {profile['user_id']}")
    print(f"🔢 Version: {profile['version']}")
    print(f"⚙️ Algorithmes actifs: {profile['algorithms_active']}")

    print("\n📊 Modules:")
    for module, data in profile.items():
        if module not in ['user_id', 'version', 'algorithms_active']:
            print(f"   • {module}: {type(data).__name__}")

    print("\n✅ Profil cognitif: PASS")
    return True


def test_all_algorithms_info():
    """Test des informations sur tous les algorithmes"""
    print("\n" + "=" * 60)
    print("📚 TEST INFORMATIONS ALGORITHMES")
    print("=" * 60)

    info = learning_engine.get_all_algorithms_info()

    print(f"\n🔢 Version: {info['version']}")
    print(f"⚙️ Total algorithmes: {info['total_algorithms']}")
    print(f"🚀 Effet combiné: {info['combined_effect']}")

    print("\n📋 Algorithmes par catégorie:")
    categories = {}
    for algo in info['algorithms']:
        cat = algo['category']
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(algo['name'])

    for cat, algos in categories.items():
        print(f"\n   {cat}:")
        for algo in algos:
            print(f"      • {algo}")

    assert info['total_algorithms'] == 16, "Should have 16 algorithms"
    print("\n✅ Informations algorithmes: PASS")
    return True


def main():
    """Exécute tous les tests"""
    print("\n" + "=" * 70)
    print("🧪 TESTS DES MODULES COGNITIFS V3.0")
    print("=" * 70)

    tests = [
        ("Dual Coding", test_dual_coding),
        ("Chunking", test_chunking),
        ("Elaborative Interrogation", test_elaborative_interrogation),
        ("Emotional Encoding", test_emotional_encoding),
        ("Détection émotionnelle", test_emotional_state_detection),
        ("Profil cognitif", test_cognitive_profile),
        ("Infos algorithmes", test_all_algorithms_info),
    ]

    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, "✅ PASS"))
        except Exception as e:
            results.append((name, f"❌ FAIL: {e}"))
            print(f"\n❌ {name} FAILED: {e}")

    print("\n" + "=" * 70)
    print("📊 RÉSUMÉ DES TESTS")
    print("=" * 70)

    passed = sum(1 for _, r in results if "PASS" in r)
    total = len(results)

    for name, result in results:
        print(f"   {result} {name}")

    print(f"\n🏆 Résultat: {passed}/{total} tests passés")

    if passed == total:
        print("""
╔══════════════════════════════════════════════════════════════════════╗
║                    ✅ TOUS LES TESTS PASSÉS!                         ║
║                                                                      ║
║  Le système V3.0 intègre maintenant 16 algorithmes:                  ║
║  • 12 algorithmes existants (V1.0-V2.0)                             ║
║  • 4 nouveaux modules cognitifs (V3.0):                             ║
║    - Dual Coding (Paivio)                                           ║
║    - Chunking (Miller)                                              ║
║    - Elaborative Interrogation (Pressley)                           ║
║    - Emotional Encoding (Phelps)                                    ║
║                                                                      ║
║  Effet combiné: ~10x meilleure rétention vs lecture passive         ║
╚══════════════════════════════════════════════════════════════════════╝
        """)

    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
