"""
E2E Tests for Learning Engine.
"""

import time
import random
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .base import E2ERunner


class LearningTests:
    """E2E tests for Learning Engine v4.1 LEAN"""

    def __init__(self, runner: 'E2ERunner'):
        self.runner = runner
        self.config = runner.config
        self.adapter = runner.adapter

    def run_all(self):
        """Run all learning tests"""
        self.test_engine_info()
        self.test_session_start()
        self.test_question_generation()
        self.test_answer_submission()
        self.test_xp_accumulation()
        self.test_difficulty_adaptation()
        self.test_cognitive_load_detection()
        self.test_mastery_persistence()
        self.test_streak_mechanics()
        self.test_edge_cases()

    def test_engine_info(self) -> bool:
        """Test: Engine info endpoint"""
        def test():
            result = self.adapter.get("/api/learning/engine-info")
            self.runner.assert_equal(result.get("version"), "4.1 LEAN", "Version should be 4.1 LEAN")
            self.runner.assert_equal(result.get("modules"), 5, "Should have 5 modules")
            return True

        result = self.runner.run_test("Engine Info", test, "Engine info retrieved")
        self.runner.add_result(result)
        return result.passed

    def test_session_start(self) -> bool:
        """Test: Starting a learning session"""
        def test():
            user_id = self.runner.generate_id("learn")
            self.runner.cleanup.register_user(user_id)

            result = self.adapter.start_session(user_id, self.config.topics)
            self.runner.assert_true(
                result.get("success") or result.get("user_id"),
                "Session should start successfully"
            )
            return True

        result = self.runner.run_test("Session Start", test, "Session started")
        self.runner.add_result(result)
        return result.passed

    def test_question_generation(self) -> bool:
        """Test: Question parameter generation"""
        def test():
            user_id = self.runner.generate_id("question")
            self.runner.cleanup.register_user(user_id)

            self.adapter.start_session(user_id, self.config.topics)
            params = self.adapter.get_next_question(user_id, "conjugaison", 50)

            self.runner.assert_in("difficulty", params, "Should return difficulty")
            self.runner.assert_true(
                1 <= params["difficulty"] <= 5,
                f"Difficulty should be 1-5, got {params['difficulty']}"
            )
            return True

        result = self.runner.run_test("Question Generation", test, "Question generated")
        self.runner.add_result(result)
        return result.passed

    def test_answer_submission(self) -> bool:
        """Test: Answer submission and processing"""
        def test():
            user_id = self.runner.generate_id("answer")
            self.runner.cleanup.register_user(user_id)

            self.adapter.start_session(user_id, self.config.topics)
            result = self.adapter.submit_answer(user_id, "conjugaison", True, 10.5, 2)

            self.runner.assert_in("xp_earned", result, "Should return XP earned")
            self.runner.assert_greater(result["xp_earned"], 0, "Correct answer should give XP")
            return True

        result = self.runner.run_test("Answer Submission", test, "Answer processed")
        self.runner.add_result(result)
        return result.passed

    def test_xp_accumulation(self) -> bool:
        """Test: XP accumulates correctly"""
        def test():
            user_id = self.runner.generate_id("xp")
            self.runner.cleanup.register_user(user_id)

            self.adapter.start_session(user_id, self.config.topics)
            total_xp = 0

            for _ in range(10):
                result = self.adapter.submit_answer(user_id, "vocabulaire", True, 10.0, 3)
                total_xp += result.get("xp_earned", 0)

            self.runner.assert_greater(total_xp, 50, f"Should earn significant XP (got {total_xp})")

            stats = self.adapter.get_user_stats(user_id)
            self.runner.assert_greater(stats.get("total_xp", 0), 0, "Stats should show XP")
            return True

        result = self.runner.run_test("XP Accumulation", test, "XP accumulates correctly")
        self.runner.add_result(result)
        return result.passed

    def test_difficulty_adaptation(self) -> bool:
        """Test: Difficulty adapts to performance"""
        def test():
            user_id = self.runner.generate_id("adapt")
            self.runner.cleanup.register_user(user_id)

            self.adapter.start_session(user_id, self.config.topics)
            difficulties = []

            # 20 correct answers
            for _ in range(20):
                stats = self.adapter.get_user_stats(user_id)
                mastery = int(stats.get("mastery", {}).get("conjugaison", 0) * 100)

                params = self.adapter.get_next_question(user_id, "conjugaison", mastery)
                difficulties.append(params.get("difficulty", 2))

                self.adapter.submit_answer(user_id, "conjugaison", True, 8.0, params.get("difficulty", 2))

            avg_first = sum(difficulties[:5]) / 5
            avg_last = sum(difficulties[-5:]) / 5

            self.runner.assert_true(
                avg_last >= avg_first - 0.5,
                f"Difficulty should not decrease (first: {avg_first:.1f}, last: {avg_last:.1f})"
            )
            return True

        result = self.runner.run_test("Difficulty Adaptation", test, "Difficulty adapts")
        self.runner.add_result(result)
        return result.passed

    def test_cognitive_load_detection(self) -> bool:
        """Test: Fatigue detection after poor performance"""
        def test():
            user_id = self.runner.generate_id("cognitive")
            self.runner.cleanup.register_user(user_id)

            self.adapter.start_session(user_id, self.config.topics)
            break_suggested = False

            # Many fast wrong answers = fatigue sign
            for i in range(25):
                result = self.adapter.submit_answer(
                    user_id, "grammaire",
                    is_correct=(i % 3 == 0),  # 33% correct
                    response_time=3.0,
                    difficulty=4
                )
                if result.get("should_take_break", False):
                    break_suggested = True
                    break

            self.runner.assert_true(break_suggested, "Should suggest break after poor performance")
            return True

        result = self.runner.run_test("Cognitive Load Detection", test, "Fatigue detected")
        self.runner.add_result(result)
        return result.passed

    def test_mastery_persistence(self) -> bool:
        """Test: Mastery persists between sessions"""
        def test():
            user_id = self.runner.generate_id("persist")
            self.runner.cleanup.register_user(user_id)

            # Session 1: Learn
            self.adapter.start_session(user_id, self.config.topics)
            for _ in range(10):
                self.adapter.submit_answer(user_id, "orthographe", True, 10.0, 3)

            stats_before = self.adapter.get_user_stats(user_id)
            mastery_before = stats_before.get("mastery", {}).get("orthographe", 0)

            # Save if direct mode
            if self.config.mode.value == "direct":
                from services.learning_engine_lean import lean_engine
                lean_engine.save_state(user_id)

            # Session 2: Verify
            self.adapter.start_session(user_id, self.config.topics)
            stats_after = self.adapter.get_user_stats(user_id)
            mastery_after = stats_after.get("mastery", {}).get("orthographe", 0)

            self.runner.assert_true(
                mastery_after > 0,
                f"Mastery should persist (before: {mastery_before:.2f}, after: {mastery_after:.2f})"
            )
            return True

        result = self.runner.run_test("Mastery Persistence", test, "Mastery persists")
        self.runner.add_result(result)
        return result.passed

    def test_streak_mechanics(self) -> bool:
        """Test: Streak increases and bonus XP"""
        def test():
            user_id = self.runner.generate_id("streak")
            self.runner.cleanup.register_user(user_id)

            self.adapter.start_session(user_id, self.config.topics)

            # First answer
            result1 = self.adapter.submit_answer(user_id, "grammaire", True, 5.0, 2)
            xp1 = result1.get("xp_earned", 0)

            # Build streak
            for _ in range(4):
                self.adapter.submit_answer(user_id, "grammaire", True, 5.0, 2)

            # Answer with streak
            result2 = self.adapter.submit_answer(user_id, "grammaire", True, 5.0, 2)
            xp2 = result2.get("xp_earned", 0)

            # Streak should give bonus
            self.runner.assert_true(
                xp2 >= xp1,
                f"Streak should give bonus XP (first: {xp1}, with streak: {xp2})"
            )
            return True

        result = self.runner.run_test("Streak Mechanics", test, "Streak works")
        self.runner.add_result(result)
        return result.passed

    def test_edge_cases(self) -> bool:
        """Test: Edge cases"""
        all_passed = True

        # Instant response
        def test_instant():
            user_id = self.runner.generate_id("instant")
            self.runner.cleanup.register_user(user_id)
            self.adapter.start_session(user_id, self.config.topics)
            result = self.adapter.submit_answer(user_id, "conjugaison", True, 0.1, 5)
            return "xp_earned" in result

        result = self.runner.run_test("Edge: Instant Response", test_instant)
        self.runner.add_result(result)
        if not result.passed:
            all_passed = False

        # High mastery
        def test_high_mastery():
            user_id = self.runner.generate_id("high")
            self.runner.cleanup.register_user(user_id)
            self.adapter.start_session(user_id, self.config.topics)
            params = self.adapter.get_next_question(user_id, "vocabulaire", 99)
            return params.get("difficulty", 0) >= 1

        result = self.runner.run_test("Edge: High Mastery", test_high_mastery)
        self.runner.add_result(result)
        if not result.passed:
            all_passed = False

        # Zero mastery
        def test_zero_mastery():
            user_id = self.runner.generate_id("zero")
            self.runner.cleanup.register_user(user_id)
            self.adapter.start_session(user_id, self.config.topics)
            params = self.adapter.get_next_question(user_id, "grammaire", 0)
            return params.get("difficulty", 5) <= 3

        result = self.runner.run_test("Edge: Zero Mastery", test_zero_mastery)
        self.runner.add_result(result)
        if not result.passed:
            all_passed = False

        return all_passed

    def test_stress(self, num_users: int = 10) -> bool:
        """Test: Multiple users concurrently"""
        def test():
            start = time.time()

            for i in range(num_users):
                user_id = self.runner.generate_id(f"stress_{i}")
                self.runner.cleanup.register_user(user_id)
                self.adapter.start_session(user_id, self.config.topics)

                for q in range(5):
                    self.adapter.submit_answer(
                        user_id,
                        self.config.topics[q % len(self.config.topics)],
                        random.random() > 0.3,
                        random.uniform(5, 20),
                        random.randint(1, 5)
                    )

            duration = time.time() - start
            self.runner.assert_true(duration < 30, f"Should complete in <30s (got {duration:.1f}s)")
            return True

        result = self.runner.run_test(f"Stress Test ({num_users} users)", test, "Handles load")
        self.runner.add_result(result)
        return result.passed
