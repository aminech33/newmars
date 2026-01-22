"""
Test d'intégration du système de tiers (0-3) avec le graphe de compétences.

Ce test vérifie:
1. Sauvegarde d'une domain map
2. Récupération de la domain map
3. Calcul de la progression par tier
4. Déblocage progressif des tiers
5. Recommandations de prochaines compétences
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import unittest
from datetime import datetime
from pathlib import Path

# Cleanup test database before imports
TEST_DB_PATH = Path(__file__).parent.parent / "databases" / "skill_graph_test.db"
if TEST_DB_PATH.exists():
    TEST_DB_PATH.unlink()

# Patch DB path for tests
import databases.skill_graph_db as skill_db
skill_db.DB_PATH = TEST_DB_PATH

from databases.skill_graph_db import (
    init_db, save_domain_map, get_domain_map, get_user_domain_maps,
    get_tier_progress, is_tier_unlocked, get_next_skills_to_learn,
    update_user_skill, get_user_skill
)
from services.skill_bridge import (
    get_domain_tier_progress, get_current_tier,
    should_unlock_next_tier, get_tier_summary
)


class TestTierIntegration(unittest.TestCase):
    """Tests d'intégration pour le système de tiers."""

    @classmethod
    def setUpClass(cls):
        """Initialize test database."""
        init_db()
        cls.test_user = "test_user_tier"
        cls.test_domain = "Python"

    def test_01_save_domain_map(self):
        """Test: Sauvegarde d'une carte de domaine."""
        skills_by_tier = {
            0: [
                {"name": "Variables et types", "description": "int, float, str, bool"},
                {"name": "Conditions if/else", "description": "Contrôle de flux"},
                {"name": "Boucles for/while", "description": "Itération"},
                {"name": "Fonctions de base", "description": "def, arguments, return"},
                {"name": "Listes", "description": "Création, indexation, slicing"},
            ],
            1: [
                {"name": "Dictionnaires", "description": "Création et manipulation"},
                {"name": "Compréhensions", "description": "List comprehensions"},
                {"name": "Gestion fichiers", "description": "open, read, write"},
                {"name": "Exceptions", "description": "try/except/finally"},
                {"name": "Modules", "description": "import, from, as"},
            ],
            2: [
                {"name": "Décorateurs", "description": "@decorator, wraps"},
                {"name": "Générateurs", "description": "yield, expressions"},
                {"name": "Context managers", "description": "__enter__, __exit__"},
                {"name": "Héritage", "description": "super(), MRO"},
            ],
            3: [
                {"name": "Métaclasses", "description": "type, __new__"},
                {"name": "Descripteurs", "description": "__get__, __set__"},
                {"name": "Asyncio", "description": "async/await"},
            ]
        }

        domain_map_id = save_domain_map(
            domain=self.test_domain,
            title=f"Maîtriser {self.test_domain}",
            user_id=self.test_user,
            skills_by_tier=skills_by_tier
        )

        self.assertIsNotNone(domain_map_id)
        print(f"✅ Test 1 PASS: Domain map sauvegardée (ID: {domain_map_id[:8]}...)")

    def test_02_get_domain_map(self):
        """Test: Récupération d'une carte de domaine."""
        domain_map = get_domain_map(self.test_domain, self.test_user)

        self.assertIsNotNone(domain_map)
        self.assertEqual(domain_map["domain"], self.test_domain)

        # tiers est un dict {0: [...], 1: [...], ...}
        self.assertIn(0, domain_map["tiers"])
        self.assertIn(1, domain_map["tiers"])
        self.assertIn(2, domain_map["tiers"])
        self.assertIn(3, domain_map["tiers"])

        # Vérifier structure des tiers
        self.assertEqual(len(domain_map["tiers"][0]), 5)  # Tier 0: 5 skills
        self.assertEqual(len(domain_map["tiers"][1]), 5)  # Tier 1: 5 skills
        self.assertEqual(len(domain_map["tiers"][2]), 4)  # Tier 2: 4 skills
        self.assertEqual(len(domain_map["tiers"][3]), 3)  # Tier 3: 3 skills

        total_skills = sum(len(s) for s in domain_map["tiers"].values())
        print(f"✅ Test 2 PASS: Domain map récupérée ({total_skills} skills)")

    def test_03_list_user_maps(self):
        """Test: Liste des cartes d'un utilisateur."""
        maps = get_user_domain_maps(self.test_user)

        self.assertGreaterEqual(len(maps), 1)
        self.assertTrue(any(m["domain"] == self.test_domain for m in maps))

        print(f"✅ Test 3 PASS: {len(maps)} carte(s) trouvée(s) pour l'utilisateur")

    def test_04_tier_progress_empty(self):
        """Test: Progression par tier (aucune pratique)."""
        progress = get_tier_progress(self.test_user, self.test_domain)

        self.assertIsNotNone(progress)
        self.assertIn(0, progress)  # Tier 0 existe

        # Tier 0 devrait être débloqué par défaut
        self.assertTrue(progress[0]["unlocked"])
        self.assertEqual(progress[0]["progress"], 0)  # Pas encore pratiqué

        # Tier 1+ devrait être verrouillé
        self.assertFalse(progress[1]["unlocked"])

        print(f"✅ Test 4 PASS: Progression initiale correcte (Tier 0 débloqué)")

    def test_05_simulate_learning_tier0(self):
        """Test: Simulation d'apprentissage sur le tier 0."""
        # Récupérer les skills du tier 0
        domain_map = get_domain_map(self.test_domain, self.test_user)
        tier0_skills = domain_map["tiers"][0]  # tiers est un dict {0: [...], ...}

        # Simuler maîtrise de 4/5 skills (80%)
        for i, skill in enumerate(tier0_skills[:4]):
            update_user_skill(
                user_id=self.test_user,
                skill_id=skill["id"],
                mastery_delta=85  # 85% de maîtrise
            )

        # Vérifier la progression
        progress = get_tier_progress(self.test_user, self.test_domain)

        self.assertGreater(progress[0]["progress"], 60)  # Au moins 60%
        self.assertGreater(progress[0]["mastered"], 0)  # Au moins une skill maîtrisée

        print(f"✅ Test 5 PASS: Apprentissage simulé (Tier 0: {progress[0]['progress']:.1f}%)")

    def test_06_unlock_tier1(self):
        """Test: Déblocage du tier 1 après maîtrise du tier 0."""
        # Maîtriser toutes les skills du tier 0
        domain_map = get_domain_map(self.test_domain, self.test_user)
        tier0_skills = domain_map["tiers"][0]  # tiers est un dict {0: [...], ...}

        for skill in tier0_skills:
            update_user_skill(
                user_id=self.test_user,
                skill_id=skill["id"],
                mastery_delta=90  # 90% de maîtrise
            )

        # Vérifier le déblocage du tier 1
        progress = get_tier_progress(self.test_user, self.test_domain)

        self.assertGreaterEqual(progress[0]["progress"], 80)  # Tier 0 >= 80%
        self.assertTrue(progress[1]["unlocked"])  # Tier 1 débloqué

        print(f"✅ Test 6 PASS: Tier 1 débloqué (Tier 0: {progress[0]['progress']:.1f}%)")

    def test_07_next_skills_recommendation(self):
        """Test: Recommandations de prochaines compétences."""
        recommendations = get_next_skills_to_learn(
            user_id=self.test_user,
            domain=self.test_domain,
            limit=5
        )

        self.assertIsNotNone(recommendations)
        self.assertGreater(len(recommendations), 0)

        # Les recommandations devraient être du tier le plus bas non maîtrisé
        for rec in recommendations:
            self.assertIn("skill_id", rec)
            self.assertIn("tier", rec)
            self.assertIn("name", rec)

        print(f"✅ Test 7 PASS: {len(recommendations)} recommandation(s) générée(s)")

    def test_08_skill_bridge_functions(self):
        """Test: Fonctions du SkillBridge pour les tiers."""
        # get_current_tier
        current_tier = get_current_tier(self.test_user, self.test_domain)
        self.assertIn(current_tier, [0, 1, 2, 3])

        # should_unlock_next_tier
        should_unlock, next_tier = should_unlock_next_tier(self.test_user, self.test_domain)
        self.assertIsInstance(should_unlock, bool)

        # get_tier_summary
        summary = get_tier_summary(self.test_user, self.test_domain)
        self.assertIn("current_tier", summary)
        self.assertIn("overall_progress", summary)
        self.assertIn("tiers", summary)

        print(f"✅ Test 8 PASS: Fonctions SkillBridge OK (Tier actuel: {current_tier})")

    def test_09_full_progression_simulation(self):
        """Test: Simulation complète de progression 0→3."""
        domain_map = get_domain_map(self.test_domain, self.test_user)

        # Maîtriser progressivement tous les tiers
        for tier_idx in range(4):
            tier_skills = domain_map["tiers"][tier_idx]  # tiers est un dict {0: [...], ...}
            for skill in tier_skills:
                update_user_skill(
                    user_id=self.test_user,
                    skill_id=skill["id"],
                    mastery_delta=90
                )

        # Vérifier progression finale
        progress = get_tier_progress(self.test_user, self.test_domain)
        summary = get_tier_summary(self.test_user, self.test_domain)

        # Tous les tiers devraient être débloqués
        for tier in range(4):
            self.assertTrue(progress[tier]["unlocked"])
            self.assertGreaterEqual(progress[tier]["progress"], 80)

        self.assertGreaterEqual(summary["overall_progress"], 80)

        print(f"✅ Test 9 PASS: Progression complète (Overall: {summary['overall_progress']:.1f}%)")

    @classmethod
    def tearDownClass(cls):
        """Cleanup test database."""
        if TEST_DB_PATH.exists():
            TEST_DB_PATH.unlink()
        print("\n🧹 Base de test nettoyée")


def run_tests():
    """Run all tests."""
    print("=" * 60)
    print("🧪 TEST D'INTÉGRATION: Système de Tiers (0-3)")
    print("=" * 60)
    print()

    # Create test suite
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromTestCase(TestTierIntegration)

    # Run tests
    runner = unittest.TextTestRunner(verbosity=0)
    result = runner.run(suite)

    # Summary
    print()
    print("=" * 60)
    total = result.testsRun
    failures = len(result.failures) + len(result.errors)
    success = total - failures

    if failures == 0:
        print(f"✅ RÉSULTAT: {success}/{total} tests passés (100%)")
        print("🎉 Intégration des tiers validée!")
    else:
        print(f"❌ RÉSULTAT: {success}/{total} tests passés ({success/total*100:.0f}%)")
        for test, trace in result.failures + result.errors:
            print(f"  - ÉCHEC: {test}")
            print(f"    {trace[:200]}...")

    print("=" * 60)

    return failures == 0


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
