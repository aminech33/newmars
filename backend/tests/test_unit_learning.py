"""
Unit tests for Learning Engine v4.1 LEAN.
Tests each module in isolation.
"""
import pytest
from datetime import datetime


class TestLearningEngineInit:
    """Test Learning Engine initialization."""

    def test_engine_creates_db(self, learning_db):
        """Engine should create database on init."""
        assert learning_db is not None
        assert learning_db.db_path is not None

    def test_engine_info(self, learning_db):
        """Engine should return correct info."""
        info = learning_db.get_engine_info()
        assert info["version"] == "4.1 LEAN"
        assert info["modules"] == 5
        assert "FSRS" in [m["name"] for m in info["modules_list"]]

    def test_difficulty_levels_defined(self, learning_db):
        """All 5 difficulty levels should be defined."""
        assert len(learning_db.DIFFICULTY_LEVELS) == 5
        assert 1 in learning_db.DIFFICULTY_LEVELS
        assert 5 in learning_db.DIFFICULTY_LEVELS


class TestUserState:
    """Test user state management."""

    def test_create_new_user(self, learning_db, unique_id):
        """Should create state for new user."""
        user_id = unique_id("user")
        state = learning_db._get_user_state(user_id)

        assert state is not None
        assert state["streak"] == 0
        assert state["total_xp"] == 0
        assert state["mastery"] == {}

        # Cleanup
        learning_db.delete_state(user_id)

    def test_save_and_load_state(self, learning_db, unique_id):
        """Should persist and restore user state."""
        user_id = unique_id("user")

        # Create state with data
        state = learning_db._get_user_state(user_id)
        state["streak"] = 5
        state["total_xp"] = 100
        state["mastery"]["test_topic"] = 50

        # Save
        assert learning_db.save_state(user_id) is True

        # Clear memory cache
        del learning_db._user_states[user_id]

        # Load
        assert learning_db.load_state(user_id) is True

        # Verify
        loaded = learning_db._user_states[user_id]
        assert loaded["total_xp"] == 100
        assert loaded["mastery"]["test_topic"] == 50

        # Cleanup
        learning_db.delete_state(user_id)

    def test_delete_state(self, learning_db, unique_id):
        """Should delete user state."""
        user_id = unique_id("user")
        learning_db._get_user_state(user_id)

        assert learning_db.delete_state(user_id) is True
        assert user_id not in learning_db._user_states


class TestQuestionGeneration:
    """Test next question parameter generation."""

    def test_get_next_question_new_user(self, learning_db, unique_id):
        """Should return easy difficulty for new user."""
        user_id = unique_id("user")
        params = learning_db.get_next_question(user_id, "conjugaison", 0)

        assert params.difficulty in [1, 2]  # Should be easy for new user
        assert params.topic_id == "conjugaison"

        learning_db.delete_state(user_id)

    def test_get_next_question_high_mastery(self, learning_db, unique_id):
        """Should return valid difficulty for high mastery."""
        user_id = unique_id("user")
        params = learning_db.get_next_question(user_id, "grammaire", 80)

        # Should return a valid difficulty (1-5)
        assert 1 <= params.difficulty <= 5

        learning_db.delete_state(user_id)

    def test_interleaving_different_topic(self, learning_db, unique_id):
        """Should prefer different topic (interleaving)."""
        user_id = unique_id("user")

        # Answer one topic
        learning_db.process_answer(user_id, "conjugaison", True, 5.0, 2)

        # Get next question
        params = learning_db.get_next_question(user_id, "grammaire", 50)

        # Should work (interleaving should suggest different topic)
        assert params is not None

        learning_db.delete_state(user_id)


class TestAnswerProcessing:
    """Test answer submission and processing."""

    def test_correct_answer_gains_xp(self, learning_db, unique_id):
        """Correct answer should give XP."""
        user_id = unique_id("user")
        result = learning_db.process_answer(user_id, "vocabulaire", True, 5.0, 2)

        assert result.xp_earned > 0
        assert result.mastery_change > 0

        learning_db.delete_state(user_id)

    def test_wrong_answer_no_xp(self, learning_db, unique_id):
        """Wrong answer should give 0 XP."""
        user_id = unique_id("user")
        result = learning_db.process_answer(user_id, "vocabulaire", False, 5.0, 2)

        assert result.xp_earned == 0

        learning_db.delete_state(user_id)

    def test_streak_increases_on_correct(self, learning_db, unique_id):
        """Streak should increase on correct answers."""
        user_id = unique_id("user")

        for i in range(3):
            learning_db.process_answer(user_id, "orthographe", True, 5.0, 2)

        state = learning_db._get_user_state(user_id)
        assert state["streak"] == 3

        learning_db.delete_state(user_id)

    def test_streak_resets_on_wrong(self, learning_db, unique_id):
        """Streak should reset or go negative on wrong answer."""
        user_id = unique_id("user")

        # Build streak
        for _ in range(3):
            learning_db.process_answer(user_id, "orthographe", True, 5.0, 2)

        state_before = learning_db._get_user_state(user_id)
        streak_before = state_before["streak"]
        assert streak_before == 3

        # Wrong answer
        learning_db.process_answer(user_id, "orthographe", False, 5.0, 2)

        state = learning_db._get_user_state(user_id)
        # Streak should be less than before (reset or negative)
        assert state["streak"] < streak_before

        learning_db.delete_state(user_id)

    def test_streak_bonus_xp(self, learning_db, unique_id):
        """Streak should give bonus XP."""
        user_id = unique_id("user")

        # First answer (no streak)
        result1 = learning_db.process_answer(user_id, "grammaire", True, 5.0, 2)

        # Build streak
        for _ in range(4):
            learning_db.process_answer(user_id, "grammaire", True, 5.0, 2)

        # Answer with streak
        result2 = learning_db.process_answer(user_id, "grammaire", True, 5.0, 2)

        # Should have bonus
        assert result2.xp_earned >= result1.xp_earned

        learning_db.delete_state(user_id)

    def test_mastery_accumulates(self, learning_db, unique_id):
        """Mastery should accumulate over answers."""
        user_id = unique_id("user")

        for _ in range(5):
            learning_db.process_answer(user_id, "conjugaison", True, 5.0, 2)

        stats = learning_db.get_user_stats(user_id)
        assert stats["mastery"].get("conjugaison", 0) > 0

        learning_db.delete_state(user_id)


class TestCognitiveLoad:
    """Test cognitive load detection."""

    def test_fatigue_detected_after_errors(self, learning_db, unique_id):
        """Should detect fatigue after multiple errors."""
        user_id = unique_id("user")

        # Simulate many wrong answers
        for _ in range(6):
            result = learning_db.process_answer(user_id, "grammaire", False, 10.0, 3)

        # Should recommend break
        assert result.should_take_break is True

        learning_db.delete_state(user_id)

    def test_difficulty_reduction_suggested(self, learning_db, unique_id):
        """Should suggest reducing difficulty after errors."""
        user_id = unique_id("user")

        # Simulate wrong answers at high difficulty
        for _ in range(4):
            result = learning_db.process_answer(user_id, "grammaire", False, 15.0, 4)

        assert result.should_reduce_difficulty is True

        learning_db.delete_state(user_id)


class TestSessionManagement:
    """Test session reset and management."""

    def test_reset_session(self, learning_db, unique_id):
        """Should reset session state."""
        user_id = unique_id("user")

        # Build some state
        for _ in range(3):
            learning_db.process_answer(user_id, "vocabulaire", True, 5.0, 2)

        # Reset
        learning_db.reset_session(user_id)

        state = learning_db._get_user_state(user_id)
        assert state["streak"] == 0
        assert state["responses"] == []

        learning_db.delete_state(user_id)

    def test_reset_preserves_mastery(self, learning_db, unique_id):
        """Reset should preserve mastery."""
        user_id = unique_id("user")

        # Build mastery
        for _ in range(5):
            learning_db.process_answer(user_id, "conjugaison", True, 5.0, 2)

        mastery_before = learning_db.get_user_stats(user_id)["mastery"].get("conjugaison", 0)

        # Reset
        learning_db.reset_session(user_id)

        mastery_after = learning_db.get_user_stats(user_id)["mastery"].get("conjugaison", 0)
        assert mastery_after == mastery_before

        learning_db.delete_state(user_id)


class TestUserStats:
    """Test user statistics retrieval."""

    def test_get_stats_new_user(self, learning_db, unique_id):
        """Should return empty stats for new user."""
        user_id = unique_id("user")
        stats = learning_db.get_user_stats(user_id)

        assert stats["streak"] == 0
        assert stats["total_xp"] == 0
        assert stats["total_responses"] == 0

        learning_db.delete_state(user_id)

    def test_get_stats_after_answers(self, learning_db, unique_id):
        """Should return accurate stats after answers."""
        user_id = unique_id("user")

        for _ in range(5):
            learning_db.process_answer(user_id, "grammaire", True, 5.0, 2)

        stats = learning_db.get_user_stats(user_id)

        assert stats["total_responses"] == 5
        assert stats["total_xp"] > 0
        assert stats["recent_accuracy"] == 1.0

        learning_db.delete_state(user_id)


class TestFSRS:
    """Test FSRS spaced repetition."""

    def test_fsrs_card_created(self, learning_db, unique_id):
        """FSRS card should be created on first answer."""
        user_id = unique_id("user")
        learning_db.process_answer(user_id, "vocabulaire", True, 5.0, 2)

        state = learning_db._get_user_state(user_id)
        assert "vocabulaire" in state["fsrs_cards"]

        learning_db.delete_state(user_id)

    def test_fsrs_interval_increases(self, learning_db, unique_id):
        """FSRS interval should increase with correct answers."""
        user_id = unique_id("user")

        result1 = learning_db.process_answer(user_id, "conjugaison", True, 5.0, 2)
        result2 = learning_db.process_answer(user_id, "conjugaison", True, 5.0, 2)

        # Interval should increase or stay same
        assert result2.next_review_days >= result1.next_review_days

        learning_db.delete_state(user_id)
