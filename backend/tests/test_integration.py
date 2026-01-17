"""
Integration tests - test multiple components working together.
Uses real (isolated) database.
"""
import pytest
from datetime import datetime


@pytest.mark.integration
class TestLearningIntegration:
    """Integration tests for Learning Engine."""

    def test_full_learning_session(self, learning_db, unique_id, topics):
        """Complete learning session flow."""
        user_id = unique_id("integration")

        # 1. Get initial question params
        params = learning_db.get_next_question(user_id, topics[0], 0)
        assert params.difficulty >= 1

        # 2. Submit multiple answers
        total_xp = 0
        for i, topic in enumerate(topics):
            for _ in range(3):
                result = learning_db.process_answer(
                    user_id, topic,
                    is_correct=(i % 2 == 0),
                    response_time=5.0,
                    difficulty=params.difficulty
                )
                total_xp += result.xp_earned

        # 3. Check stats
        stats = learning_db.get_user_stats(user_id)
        assert stats["total_xp"] == total_xp
        assert stats["total_responses"] == 12

        # 4. Save and reload
        learning_db.save_state(user_id)
        del learning_db._user_states[user_id]
        learning_db.load_state(user_id)

        # 5. Verify persistence
        stats_after = learning_db.get_user_stats(user_id)
        assert stats_after["total_xp"] == total_xp

        learning_db.delete_state(user_id)

    def test_mastery_progression_over_sessions(self, learning_db, unique_id):
        """Mastery should progress across multiple sessions."""
        user_id = unique_id("mastery")
        topic = "conjugaison"

        # Session 1
        for _ in range(10):
            learning_db.process_answer(user_id, topic, True, 5.0, 2)

        mastery_1 = learning_db.get_user_stats(user_id)["mastery"].get(topic, 0)
        learning_db.reset_session(user_id)

        # Session 2
        for _ in range(10):
            learning_db.process_answer(user_id, topic, True, 5.0, 3)

        mastery_2 = learning_db.get_user_stats(user_id)["mastery"].get(topic, 0)

        assert mastery_2 > mastery_1

        learning_db.delete_state(user_id)

    def test_cognitive_load_progression(self, learning_db, unique_id):
        """Cognitive load should increase with fatigue."""
        user_id = unique_id("cognitive")

        # Many wrong answers
        for _ in range(8):
            result = learning_db.process_answer(
                user_id, "grammaire", False, 15.0, 4
            )

        # Should recommend break or difficulty reduction
        assert result.should_take_break or result.should_reduce_difficulty

        learning_db.delete_state(user_id)


@pytest.mark.integration
class TestSimulatorIntegration:
    """Integration tests for User Simulator."""

    def test_simulator_uses_real_engine(self, user_simulator):
        """Simulator should interact with real engine."""
        sim = user_simulator("motivated")

        result = sim.run_session(verbose=False)

        # Check engine state
        stats = sim.engine.get_user_stats(sim.user_id)
        assert stats["total_responses"] > 0
        assert stats["total_xp"] == result["total_xp"]

    def test_multiple_simulators_isolated(self, user_simulator):
        """Multiple simulators should have isolated state."""
        sim1 = user_simulator("motivated", user_id="sim_test_1")
        sim2 = user_simulator("struggling", user_id="sim_test_2")

        sim1.run_session(topics=["conjugaison"], verbose=False)
        sim2.run_session(topics=["grammaire"], verbose=False)

        stats1 = sim1.get_stats()
        stats2 = sim2.get_stats()

        # Should have different mastery topics
        assert stats1["mastery"] != stats2["mastery"]

    @pytest.mark.slow
    def test_week_simulation_persistence(self, user_simulator):
        """Week simulation should persist to DB."""
        sim = user_simulator("average")

        result = sim.run_week_simulation(verbose=False)

        # Verify final state matches
        stats = sim.engine.get_user_stats(sim.user_id)
        assert stats["total_xp"] == result["final_total_xp"]


@pytest.mark.integration
class TestMultiModuleIntegration:
    """Test multiple modules working together."""

    def test_fsrs_and_cognitive_load(self, learning_db, unique_id):
        """FSRS and cognitive load should work together."""
        user_id = unique_id("multi")

        # Build FSRS history
        for _ in range(5):
            learning_db.process_answer(user_id, "vocabulaire", True, 5.0, 2)

        # Check FSRS card exists
        state = learning_db._get_user_state(user_id)
        assert "vocabulaire" in state["fsrs_cards"]

        # Continue until fatigue
        for _ in range(10):
            result = learning_db.process_answer(
                user_id, "vocabulaire", False, 20.0, 4
            )

        # Should have cognitive load feedback
        assert result.should_take_break or result.should_reduce_difficulty

        learning_db.delete_state(user_id)

    def test_interleaving_across_topics(self, learning_db, unique_id, topics):
        """Interleaving should track across topics."""
        user_id = unique_id("interleave")

        # Answer different topics
        for topic in topics:
            learning_db.process_answer(user_id, topic, True, 5.0, 2)

        stats = learning_db.get_user_stats(user_id)

        # Should have mastery for all topics
        for topic in topics:
            assert topic in stats["mastery"]

        learning_db.delete_state(user_id)


@pytest.mark.integration
class TestDataPersistence:
    """Test data persistence across operations."""

    def test_state_survives_engine_restart(self, test_db_path, unique_id):
        """State should survive engine restart."""
        from services.learning_engine_lean import LeanLearningEngine

        user_id = unique_id("persist")

        # Engine 1: Create state
        engine1 = LeanLearningEngine(db_path=test_db_path)
        for _ in range(5):
            engine1.process_answer(user_id, "conjugaison", True, 5.0, 2)
        engine1.save_state(user_id)
        xp_before = engine1.get_user_stats(user_id)["total_xp"]

        # Engine 2: Load state
        engine2 = LeanLearningEngine(db_path=test_db_path)
        engine2.load_state(user_id)
        xp_after = engine2.get_user_stats(user_id)["total_xp"]

        assert xp_after == xp_before

        engine2.delete_state(user_id)

    def test_concurrent_users(self, learning_db, unique_id):
        """Multiple users should have isolated state."""
        users = [unique_id(f"user_{i}") for i in range(5)]

        # Create different state for each user
        for i, user_id in enumerate(users):
            for _ in range(i + 1):
                learning_db.process_answer(user_id, "grammaire", True, 5.0, 2)

        # Verify isolation
        for i, user_id in enumerate(users):
            stats = learning_db.get_user_stats(user_id)
            assert stats["total_responses"] == i + 1
            learning_db.delete_state(user_id)
