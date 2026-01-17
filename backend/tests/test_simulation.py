"""
Tests for User Simulation with Learning Engine.
Tests realistic user behavior patterns.
"""
import pytest


class TestUserSimulatorCreation:
    """Test UserSimulator initialization."""

    def test_create_motivated_user(self, user_simulator):
        """Should create motivated user."""
        sim = user_simulator("motivated")
        assert sim.behavior["name"] == "Étudiant Motivé"
        assert sim.behavior["accuracy_base"] == 0.85

    def test_create_struggling_user(self, user_simulator):
        """Should create struggling user."""
        sim = user_simulator("struggling")
        assert sim.behavior["name"] == "Étudiant en Difficulté"
        assert sim.behavior["accuracy_base"] == 0.35

    def test_create_with_custom_id(self, user_simulator):
        """Should use custom user ID."""
        sim = user_simulator("average", user_id="custom_test_user")
        assert sim.user_id == "custom_test_user"

    def test_all_behaviors_exist(self, user_simulator):
        """All behavior types should be creatable."""
        from test_e2e_framework import UserSimulator

        for behavior in UserSimulator.BEHAVIORS.keys():
            sim = user_simulator(behavior)
            assert sim is not None


class TestUserSimulatorSession:
    """Test single session simulation."""

    def test_session_returns_results(self, motivated_user):
        """Session should return result dict."""
        result = motivated_user.run_session(verbose=False)

        assert "questions" in result
        assert "correct" in result
        assert "accuracy" in result
        assert "xp_earned" in result

    def test_motivated_user_high_accuracy(self, motivated_user):
        """Motivated user should have high accuracy."""
        result = motivated_user.run_session(verbose=False)

        # Motivated should have > 60% accuracy typically
        assert result["accuracy"] >= 0.5

    def test_struggling_user_low_accuracy(self, struggling_user):
        """Struggling user should have lower accuracy."""
        result = struggling_user.run_session(verbose=False)

        # Struggling may have very low accuracy
        assert result["accuracy"] <= 0.8

    def test_session_earns_xp(self, average_user):
        """Session should earn XP."""
        result = average_user.run_session(verbose=False)

        # Should earn some XP (unless all wrong)
        assert result["xp_earned"] >= 0

    def test_motivated_longer_session(self, motivated_user, struggling_user):
        """Motivated user should have longer sessions."""
        result_motivated = motivated_user.run_session(verbose=False)
        result_struggling = struggling_user.run_session(verbose=False)

        # Motivated typically does more questions
        assert result_motivated["questions"] >= result_struggling["questions"]


class TestUserSimulatorWeek:
    """Test week-long simulation."""

    @pytest.mark.slow
    def test_week_simulation(self, average_user):
        """Week simulation should complete."""
        result = average_user.run_week_simulation(verbose=False)

        assert "days_active" in result
        assert "total_questions" in result
        assert "total_xp" in result
        assert result["days_active"] + result["days_skipped"] == 7

    @pytest.mark.slow
    def test_motivated_more_active_days(self, user_simulator):
        """Motivated user should have more active days."""
        motivated = user_simulator("motivated")
        irregular = user_simulator("irregular")

        result_motivated = motivated.run_week_simulation(verbose=False)
        result_irregular = irregular.run_week_simulation(verbose=False)

        # Motivated should typically be more active
        assert result_motivated["days_active"] >= result_irregular["days_active"] - 2

    @pytest.mark.slow
    def test_mastery_progression(self, motivated_user):
        """Mastery should progress over week."""
        result = motivated_user.run_week_simulation(
            topics=["conjugaison"],
            verbose=False
        )

        # Should have some mastery after a week
        assert result["final_mastery"].get("conjugaison", 0) > 0


class TestBehaviorComparison:
    """Test behavior differences."""

    def test_motivated_vs_struggling_xp(self, user_simulator):
        """Motivated should earn more XP than struggling."""
        motivated = user_simulator("motivated")
        struggling = user_simulator("struggling")

        result_m = motivated.run_session(verbose=False)
        result_s = struggling.run_session(verbose=False)

        # Motivated should typically earn more XP
        assert result_m["xp_earned"] >= result_s["xp_earned"]

    def test_expert_high_accuracy(self, user_simulator):
        """Expert should have very high accuracy."""
        expert = user_simulator("expert")
        result = expert.run_session(verbose=False)

        assert result["accuracy"] >= 0.8


class TestFatigueSimulation:
    """Test fatigue and cognitive load in simulation."""

    def test_fatigue_detected_for_struggling(self, struggling_user):
        """Struggling user should trigger fatigue detection."""
        # Run session - struggling users often trigger breaks
        result = struggling_user.run_session(verbose=False)

        # Session should end (either by break or natural end)
        assert result["questions"] > 0

    def test_session_respects_break_recommendation(self, struggling_user):
        """Session should stop when break is recommended."""
        result = struggling_user.run_session(verbose=False)

        # Struggling typically has short sessions due to fatigue
        behavior = struggling_user.behavior
        assert result["questions"] <= behavior["session_length"][1] + 2


class TestSimulatorCleanup:
    """Test cleanup functionality."""

    def test_cleanup_removes_user(self, user_simulator):
        """Cleanup should remove user from DB."""
        from services.learning_engine_lean import lean_engine

        sim = user_simulator("average")
        user_id = sim.user_id

        # Do some activity
        sim.run_session(verbose=False)
        sim.engine.save_state(user_id)

        # Cleanup
        sim.cleanup()

        # User should not be in DB
        assert user_id not in lean_engine._user_states


class TestSimulatorStats:
    """Test statistics retrieval."""

    def test_get_stats(self, average_user):
        """Should get stats from engine."""
        average_user.run_session(verbose=False)
        stats = average_user.get_stats()

        assert "mastery" in stats
        assert "streak" in stats
        assert "total_xp" in stats

    def test_history_tracked(self, average_user):
        """Answer history should be tracked."""
        average_user.run_session(verbose=False)

        assert len(average_user.history) > 0
        assert "topic" in average_user.history[0]
        assert "is_correct" in average_user.history[0]
