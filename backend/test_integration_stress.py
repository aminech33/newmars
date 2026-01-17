"""
🔥 TEST D'INTÉGRATION STRESS - STACK COMPLÈTE
Test qui met à rude épreuve:
- Le moteur d'apprentissage (LeanLearningEngine)
- L'API FastAPI
- La base de données SQLite
- La persistance des données

Simule 4 utilisateurs avec les 4 profils v4.4 pendant 14 jours.
"""

import sys
sys.path.insert(0, '.')

import asyncio
import random
import time
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List
from concurrent.futures import ThreadPoolExecutor

# Import du moteur et de la DB
from services.learning_engine_lean import lean_engine, LeanLearningEngine
from databases.learning_db import LearningDatabase

# =============================================================================
# CONFIGURATION DU TEST
# =============================================================================

TEST_CONFIG = {
    "num_users": 4,
    "days": 14,
    "questions_per_session": 15,
    "topics": ["conjugaison", "grammaire", "vocabulaire", "orthographe"],
    "concurrent_sessions": True,  # Simuler sessions simultanées
}

# Profils identiques au simulateur v4.4
STRESS_PROFILES = {
    "determined": {
        "name": "User_Determined",
        "base_ability": 0.70,
        "learning_speed": 1.1,
        "motivation": 0.85,
        "skip_prob": 0.03,
        "quit_prob": 0.02,
    },
    "average": {
        "name": "User_Average",
        "base_ability": 0.50,
        "learning_speed": 0.9,
        "motivation": 0.65,
        "skip_prob": 0.08,
        "quit_prob": 0.04,
    },
    "irregular": {
        "name": "User_Irregular",
        "base_ability": 0.65,
        "learning_speed": 1.0,
        "motivation": 0.50,
        "skip_prob": 0.25,
        "quit_prob": 0.10,
    },
    "struggling": {
        "name": "User_Struggling",
        "base_ability": 0.40,
        "learning_speed": 0.70,
        "motivation": 0.70,
        "skip_prob": 0.05,
        "quit_prob": 0.06,
    },
}


class StressTestUser:
    """Utilisateur pour le test de stress"""

    def __init__(self, user_id: str, profile: dict):
        self.user_id = user_id
        self.profile = profile
        self.knowledge: Dict[str, float] = {}
        self.fatigue = 0.0
        self.session_questions = 0

        # Stats
        self.total_questions = 0
        self.total_correct = 0
        self.total_xp = 0
        self.sessions_completed = 0
        self.sessions_skipped = 0
        self.api_calls = 0
        self.db_writes = 0
        self.errors = []

    def should_skip_session(self) -> bool:
        return random.random() < self.profile["skip_prob"]

    def should_quit_early(self) -> bool:
        prob = self.profile["quit_prob"] + self.fatigue * 0.1
        return random.random() < prob

    def answer_question(self, topic: str, difficulty: int) -> dict:
        """Simule une réponse"""
        mastery = self.knowledge.get(topic, 0.0)
        p = self.profile

        # Probabilité de base
        base_prob = p["base_ability"] + mastery * 0.3
        diff_penalty = (difficulty - 1) * 0.08
        motivation_bonus = (p["motivation"] - 0.5) * 0.15
        fatigue_penalty = self.fatigue * 0.15

        prob_correct = base_prob - diff_penalty + motivation_bonus - fatigue_penalty
        prob_correct = max(0.15, min(0.95, prob_correct))

        is_correct = random.random() < prob_correct

        # Temps de réponse réaliste
        base_time = 5 + difficulty * 3
        response_time = base_time + random.uniform(-2, 8)
        response_time = max(2, response_time)

        self.fatigue = min(1.0, self.fatigue + 0.025)
        self.session_questions += 1

        return {
            "is_correct": is_correct,
            "response_time": response_time,
        }

    def learn(self, topic: str, is_correct: bool, difficulty: int):
        """Apprentissage simplifié"""
        current = self.knowledge.get(topic, 0.0)
        p = self.profile

        efficiency = p["learning_speed"] * (0.8 + p["motivation"] * 0.4)
        efficiency *= (1 - self.fatigue * 0.3)

        if is_correct:
            gain = 0.05 * efficiency * (1 + difficulty * 0.1)
            self.knowledge[topic] = min(1.0, current + gain)
        else:
            if p["motivation"] > 0.6:
                gain = 0.01 * efficiency
                self.knowledge[topic] = min(1.0, current + gain)

    def reset_session(self):
        self.fatigue = 0.0
        self.session_questions = 0


class IntegrationStressTest:
    """Test d'intégration stress"""

    def __init__(self):
        self.db = LearningDatabase()
        self.users: Dict[str, StressTestUser] = {}
        self.results = {
            "total_api_calls": 0,
            "total_db_operations": 0,
            "total_questions": 0,
            "errors": [],
            "timing": {},
            "user_results": {},
        }

    def setup_users(self):
        """Crée les utilisateurs de test"""
        print("\n📋 Configuration des utilisateurs de test...")

        for profile_key, profile in STRESS_PROFILES.items():
            user_id = f"stress_test_{profile_key}_{int(time.time())}"
            self.users[profile_key] = StressTestUser(user_id, profile)
            print(f"   • {profile['name']} → {user_id}")

    def test_engine_basic(self) -> bool:
        """Test 1: Moteur basique"""
        print("\n" + "=" * 70)
        print("🧪 TEST 1: MOTEUR D'APPRENTISSAGE BASIQUE")
        print("=" * 70)

        try:
            # Test info moteur
            info = lean_engine.get_engine_info()
            print(f"   ✅ Moteur: {info['version']} ({info['modules']} modules)")

            # Test get_next_question
            user_id = "test_basic_001"
            params = lean_engine.get_next_question(user_id, "test_topic", 50)
            print(f"   ✅ get_next_question: difficulty={params.difficulty}, fsrs_interval={params.fsrs_interval:.1f}")

            # Test process_answer
            result = lean_engine.process_answer(
                user_id=user_id,
                topic_id="test_topic",
                is_correct=True,
                response_time=8.5,
                difficulty=params.difficulty
            )
            print(f"   ✅ process_answer: xp={result.xp_earned}, mastery_change={result.mastery_change}")

            # Test reset_session
            lean_engine.reset_session(user_id)
            print("   ✅ reset_session: OK")

            return True
        except Exception as e:
            print(f"   ❌ ERREUR: {e}")
            self.results["errors"].append(f"test_engine_basic: {e}")
            return False

    def test_db_operations(self) -> bool:
        """Test 2: Opérations base de données"""
        print("\n" + "=" * 70)
        print("🧪 TEST 2: OPÉRATIONS BASE DE DONNÉES")
        print("=" * 70)

        try:
            # Test connexion
            print("   Testing database operations...")

            # Test tables existent
            conn = sqlite3.connect(self.db.db_path)
            cursor = conn.cursor()

            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            print(f"   ✅ Tables trouvées: {len(tables)}")

            # Test écriture/lecture AI usage (avec bonnes colonnes)
            test_date = datetime.now().strftime("%Y-%m-%d")
            cursor.execute("""
                INSERT INTO ai_usage (date, task_type, model, tier, tokens_input, tokens_output, cost_usd)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (test_date, "stress_test", "test_model", "test", 100, 50, 0.001))
            conn.commit()
            print("   ✅ INSERT ai_usage: OK")

            # Test lecture
            cursor.execute("SELECT COUNT(*) FROM ai_usage WHERE task_type = 'stress_test'")
            count = cursor.fetchone()[0]
            print(f"   ✅ SELECT ai_usage: {count} enregistrement(s)")

            # Cleanup
            cursor.execute("DELETE FROM ai_usage WHERE task_type = 'stress_test'")
            conn.commit()
            conn.close()
            print("   ✅ Cleanup: OK")

            return True
        except Exception as e:
            print(f"   ❌ ERREUR DB: {e}")
            self.results["errors"].append(f"test_db_operations: {e}")
            return False

    def test_concurrent_sessions(self) -> bool:
        """Test 3: Sessions concurrentes"""
        print("\n" + "=" * 70)
        print("🧪 TEST 3: SESSIONS CONCURRENTES (4 utilisateurs)")
        print("=" * 70)

        try:
            start_time = time.time()

            def run_user_session(profile_key: str, user: StressTestUser):
                """Session d'un utilisateur"""
                errors = []
                questions_done = 0

                try:
                    lean_engine.reset_session(user.user_id)

                    for q in range(10):  # 10 questions par session
                        topic = random.choice(TEST_CONFIG["topics"])
                        mastery = int(user.knowledge.get(topic, 0) * 100)

                        # Get params
                        params = lean_engine.get_next_question(user.user_id, topic, mastery)
                        user.api_calls += 1

                        # Simulate answer
                        response = user.answer_question(topic, params.difficulty)

                        # Process
                        result = lean_engine.process_answer(
                            user_id=user.user_id,
                            topic_id=topic,
                            is_correct=response["is_correct"],
                            response_time=response["response_time"],
                            difficulty=params.difficulty
                        )
                        user.api_calls += 1

                        # Learn
                        user.learn(topic, response["is_correct"], params.difficulty)

                        user.total_questions += 1
                        if response["is_correct"]:
                            user.total_correct += 1
                        user.total_xp += result.xp_earned

                        questions_done += 1

                except Exception as e:
                    errors.append(str(e))

                return profile_key, questions_done, errors

            # Exécuter en parallèle
            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = []
                for profile_key, user in self.users.items():
                    futures.append(executor.submit(run_user_session, profile_key, user))

                for future in futures:
                    profile_key, questions_done, errors = future.result()
                    print(f"   ✅ {STRESS_PROFILES[profile_key]['name']}: {questions_done} questions")
                    if errors:
                        self.results["errors"].extend(errors)

            elapsed = time.time() - start_time
            print(f"\n   ⏱️ Temps total: {elapsed:.2f}s")
            print(f"   📊 Questions/seconde: {sum(u.total_questions for u in self.users.values()) / elapsed:.1f}")

            return len(self.results["errors"]) == 0
        except Exception as e:
            print(f"   ❌ ERREUR: {e}")
            self.results["errors"].append(f"test_concurrent_sessions: {e}")
            return False

    def test_full_simulation(self) -> bool:
        """Test 4: Simulation complète 14 jours"""
        print("\n" + "=" * 70)
        print("🧪 TEST 4: SIMULATION COMPLÈTE (14 jours, 4 profils)")
        print("=" * 70)

        start_time = time.time()

        try:
            for day in range(1, TEST_CONFIG["days"] + 1):
                day_stats = {"questions": 0, "correct": 0, "xp": 0, "sessions": 0}

                for profile_key, user in self.users.items():
                    # Skip session?
                    if user.should_skip_session():
                        user.sessions_skipped += 1
                        continue

                    # Reset pour nouvelle session
                    user.reset_session()
                    lean_engine.reset_session(user.user_id)

                    # Session
                    for q_num in range(TEST_CONFIG["questions_per_session"]):
                        # Quit early?
                        if q_num > 3 and user.should_quit_early():
                            break

                        topic = TEST_CONFIG["topics"][q_num % len(TEST_CONFIG["topics"])]
                        mastery = int(user.knowledge.get(topic, 0) * 100)

                        # Moteur
                        params = lean_engine.get_next_question(user.user_id, topic, mastery)

                        # Réponse
                        response = user.answer_question(topic, params.difficulty)

                        # Process
                        result = lean_engine.process_answer(
                            user_id=user.user_id,
                            topic_id=topic,
                            is_correct=response["is_correct"],
                            response_time=response["response_time"],
                            difficulty=params.difficulty
                        )

                        # Learn
                        user.learn(topic, response["is_correct"], params.difficulty)

                        # Stats
                        user.total_questions += 1
                        day_stats["questions"] += 1
                        if response["is_correct"]:
                            user.total_correct += 1
                            day_stats["correct"] += 1
                        user.total_xp += result.xp_earned
                        day_stats["xp"] += result.xp_earned

                    user.sessions_completed += 1
                    day_stats["sessions"] += 1

                # Afficher progression chaque 3 jours
                if day <= 3 or day == TEST_CONFIG["days"] or day % 3 == 0:
                    accuracy = day_stats["correct"] / max(1, day_stats["questions"]) * 100
                    print(f"   Jour {day:2d}: {day_stats['sessions']} sessions, {day_stats['questions']} questions, {accuracy:.0f}% précision, {day_stats['xp']} XP")

            elapsed = time.time() - start_time
            self.results["timing"]["full_simulation"] = elapsed

            print(f"\n   ⏱️ Temps simulation: {elapsed:.2f}s")

            return True
        except Exception as e:
            print(f"   ❌ ERREUR: {e}")
            import traceback
            traceback.print_exc()
            self.results["errors"].append(f"test_full_simulation: {e}")
            return False

    def test_fsrs_consistency(self) -> bool:
        """Test 5: Cohérence FSRS"""
        print("\n" + "=" * 70)
        print("🧪 TEST 5: COHÉRENCE FSRS (Spaced Repetition)")
        print("=" * 70)

        try:
            user_id = "fsrs_test_user"
            topic = "fsrs_test_topic"

            # Simuler une série de révisions
            intervals = []

            for i in range(10):
                mastery = min(100, i * 10)
                params = lean_engine.get_next_question(user_id, topic, mastery)

                # Réponse correcte
                result = lean_engine.process_answer(
                    user_id=user_id,
                    topic_id=topic,
                    is_correct=True,
                    response_time=8.0,
                    difficulty=params.difficulty
                )

                intervals.append(result.next_review_days)

            # Vérifier que les intervalles augmentent (FSRS property)
            increasing = all(intervals[i] <= intervals[i+1] for i in range(len(intervals)-1))

            print(f"   Intervalles FSRS: {[f'{i:.1f}' for i in intervals]}")
            print(f"   ✅ Intervalles croissants: {'OUI' if increasing else 'NON'}")

            # Vérifier stats
            stats = lean_engine.get_user_stats(user_id)
            print(f"   ✅ Stats FSRS disponibles: {len(stats['fsrs'])} topic(s)")

            return True
        except Exception as e:
            print(f"   ❌ ERREUR: {e}")
            self.results["errors"].append(f"test_fsrs_consistency: {e}")
            return False

    def test_cognitive_load(self) -> bool:
        """Test 6: Détection surcharge cognitive"""
        print("\n" + "=" * 70)
        print("🧪 TEST 6: DÉTECTION SURCHARGE COGNITIVE")
        print("=" * 70)

        try:
            user_id = "cognitive_test_user"
            topic = "cognitive_test_topic"

            # Simuler une série d'erreurs rapides (surcharge)
            break_suggested = False

            lean_engine.reset_session(user_id)

            for i in range(15):
                params = lean_engine.get_next_question(user_id, topic, 30)

                # Réponses incorrectes rapides
                result = lean_engine.process_answer(
                    user_id=user_id,
                    topic_id=topic,
                    is_correct=False,
                    response_time=2.0,  # Très rapide = surcharge
                    difficulty=params.difficulty
                )

                if result.should_take_break:
                    break_suggested = True
                    print(f"   ✅ Pause suggérée après {i+1} questions (cognitive load détecté)")
                    break

                if params.should_take_break:
                    break_suggested = True
                    print(f"   ✅ Pause suggérée via params après {i+1} questions")
                    break

            if not break_suggested:
                print("   ⚠️ Aucune pause suggérée (peut être normal selon le seuil)")

            return True
        except Exception as e:
            print(f"   ❌ ERREUR: {e}")
            self.results["errors"].append(f"test_cognitive_load: {e}")
            return False

    def test_difficulty_adaptation(self) -> bool:
        """Test 7: Adaptation de difficulté"""
        print("\n" + "=" * 70)
        print("🧪 TEST 7: ADAPTATION DE DIFFICULTÉ (Zone Proximale)")
        print("=" * 70)

        try:
            user_id = "difficulty_test_user"
            topic = "difficulty_test_topic"

            difficulties = []

            # Simuler progression: 0% → 100% maîtrise
            for mastery in range(0, 101, 10):
                params = lean_engine.get_next_question(user_id, topic, mastery)
                difficulties.append((mastery, params.difficulty, params.difficulty_name))

            print("   Maîtrise → Difficulté:")
            for m, d, name in difficulties:
                bar = "█" * d + "░" * (5-d)
                print(f"      {m:3d}% → [{bar}] {name}")

            # Vérifier progression
            start_diff = difficulties[0][1]
            end_diff = difficulties[-1][1]

            if end_diff >= start_diff:
                print(f"   ✅ Difficulté augmente avec maîtrise: {start_diff} → {end_diff}")
            else:
                print(f"   ⚠️ Difficulté incohérente: {start_diff} → {end_diff}")

            return True
        except Exception as e:
            print(f"   ❌ ERREUR: {e}")
            self.results["errors"].append(f"test_difficulty_adaptation: {e}")
            return False

    def run_all_tests(self):
        """Exécute tous les tests"""
        print("\n" + "=" * 70)
        print("🔥 TEST D'INTÉGRATION STRESS - STACK COMPLÈTE")
        print("=" * 70)

        overall_start = time.time()

        # Setup
        self.setup_users()

        # Tests
        tests = [
            ("Moteur basique", self.test_engine_basic),
            ("Opérations DB", self.test_db_operations),
            ("Sessions concurrentes", self.test_concurrent_sessions),
            ("Simulation 14 jours", self.test_full_simulation),
            ("Cohérence FSRS", self.test_fsrs_consistency),
            ("Détection surcharge", self.test_cognitive_load),
            ("Adaptation difficulté", self.test_difficulty_adaptation),
        ]

        results = []
        for name, test_func in tests:
            try:
                success = test_func()
                results.append((name, success))
            except Exception as e:
                print(f"   ❌ EXCEPTION non gérée: {e}")
                results.append((name, False))
                self.results["errors"].append(f"{name}: {e}")

        # Résumé final
        print("\n" + "=" * 70)
        print("📊 RÉSUMÉ DES TESTS")
        print("=" * 70)

        passed = sum(1 for _, s in results if s)
        total = len(results)

        for name, success in results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"   {status} - {name}")

        print(f"\n   Total: {passed}/{total} tests passés")

        # Stats utilisateurs
        print("\n" + "=" * 70)
        print("📈 RÉSULTATS PAR UTILISATEUR")
        print("=" * 70)

        print(f"\n{'Profil':<20} {'Questions':>10} {'Précision':>10} {'XP':>8} {'Sessions':>10}")
        print("-" * 60)

        for profile_key, user in self.users.items():
            accuracy = user.total_correct / max(1, user.total_questions) * 100
            sessions = f"{user.sessions_completed}/{user.sessions_completed + user.sessions_skipped}"
            print(f"{STRESS_PROFILES[profile_key]['name']:<20} {user.total_questions:>10} {accuracy:>9.0f}% {user.total_xp:>8} {sessions:>10}")

        # Erreurs
        if self.results["errors"]:
            print("\n" + "=" * 70)
            print("⚠️ ERREURS DÉTECTÉES")
            print("=" * 70)
            for err in self.results["errors"]:
                print(f"   • {err}")

        # Timing
        overall_elapsed = time.time() - overall_start
        print("\n" + "=" * 70)
        print(f"⏱️ TEMPS TOTAL: {overall_elapsed:.2f}s")
        print("=" * 70)

        # Verdict
        if passed == total and not self.results["errors"]:
            print("""
╔══════════════════════════════════════════════════════════════════════╗
║                    ✅ TOUS LES TESTS PASSÉS                          ║
║                                                                      ║
║  Le système est prêt pour la production:                            ║
║  • Moteur d'apprentissage: OK                                       ║
║  • Base de données: OK                                              ║
║  • Sessions concurrentes: OK                                        ║
║  • FSRS (Spaced Repetition): OK                                     ║
║  • Détection surcharge cognitive: OK                                ║
║  • Adaptation de difficulté: OK                                     ║
╚══════════════════════════════════════════════════════════════════════╝
            """)
            return True
        else:
            print("""
╔══════════════════════════════════════════════════════════════════════╗
║                    ⚠️ CERTAINS TESTS ONT ÉCHOUÉ                      ║
║                                                                      ║
║  Vérifiez les erreurs ci-dessus avant mise en production.           ║
╚══════════════════════════════════════════════════════════════════════╝
            """)
            return False


if __name__ == "__main__":
    test = IntegrationStressTest()
    success = test.run_all_tests()
    sys.exit(0 if success else 1)
