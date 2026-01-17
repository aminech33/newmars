"""
UserSimulator - Realistic user behavior simulation with Learning Engine.
"""

import random
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from .base import E2ERunner


@dataclass
class BehaviorProfile:
    """Defines a user behavior profile"""
    name: str
    accuracy_base: float          # Base accuracy (0-1)
    accuracy_variance: float      # Accuracy variance
    response_time_base: float     # Base response time (seconds)
    response_time_variance: float # Response time variance
    session_length: tuple         # (min, max) questions per session
    skip_probability: float       # Probability of skipping a day
    fatigue_threshold: int        # Questions before fatigue kicks in
    learning_rate: float          # How fast they improve
    frustration_threshold: int    # Errors before frustration

    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "accuracy_base": self.accuracy_base,
            "session_length": self.session_length,
            "skip_probability": self.skip_probability,
        }


# Predefined behavior profiles
BEHAVIOR_PROFILES = {
    "motivated": BehaviorProfile(
        name="motivated",
        accuracy_base=0.85,
        accuracy_variance=0.10,
        response_time_base=8.0,
        response_time_variance=3.0,
        session_length=(15, 25),
        skip_probability=0.05,
        fatigue_threshold=30,
        learning_rate=0.03,
        frustration_threshold=10,
    ),
    "average": BehaviorProfile(
        name="average",
        accuracy_base=0.65,
        accuracy_variance=0.15,
        response_time_base=12.0,
        response_time_variance=5.0,
        session_length=(8, 15),
        skip_probability=0.20,
        fatigue_threshold=15,
        learning_rate=0.02,
        frustration_threshold=6,
    ),
    "irregular": BehaviorProfile(
        name="irregular",
        accuracy_base=0.55,
        accuracy_variance=0.20,
        response_time_base=15.0,
        response_time_variance=8.0,
        session_length=(3, 10),
        skip_probability=0.40,
        fatigue_threshold=10,
        learning_rate=0.01,
        frustration_threshold=4,
    ),
    "struggling": BehaviorProfile(
        name="struggling",
        accuracy_base=0.35,
        accuracy_variance=0.15,
        response_time_base=20.0,
        response_time_variance=10.0,
        session_length=(5, 12),
        skip_probability=0.30,
        fatigue_threshold=8,
        learning_rate=0.015,
        frustration_threshold=3,
    ),
    "expert": BehaviorProfile(
        name="expert",
        accuracy_base=0.95,
        accuracy_variance=0.05,
        response_time_base=5.0,
        response_time_variance=2.0,
        session_length=(20, 40),
        skip_probability=0.02,
        fatigue_threshold=50,
        learning_rate=0.01,
        frustration_threshold=15,
    ),
}


class UserSimulator:
    """
    Simulates realistic user behavior with the Learning Engine.

    Usage:
        simulator = UserSimulator("motivated")
        simulator.simulate_session(adapter, user_id, topics)
        simulator.simulate_days(adapter, user_id, topics, num_days=7)
    """

    def __init__(self, profile_name: str = "average"):
        if profile_name not in BEHAVIOR_PROFILES:
            raise ValueError(f"Unknown profile: {profile_name}. Available: {list(BEHAVIOR_PROFILES.keys())}")

        self.profile = BEHAVIOR_PROFILES[profile_name]
        self.session_questions = 0
        self.session_errors = 0
        self.total_questions = 0
        self.total_correct = 0
        self.current_streak = 0
        self.topic_mastery: Dict[str, float] = {}
        self.is_fatigued = False
        self.is_frustrated = False

    def should_skip_day(self) -> bool:
        """Determine if user skips today based on profile"""
        return random.random() < self.profile.skip_probability

    def get_session_length(self) -> int:
        """Get number of questions for this session"""
        min_q, max_q = self.profile.session_length
        return random.randint(min_q, max_q)

    def generate_answer(self, topic: str, difficulty: int) -> Dict:
        """
        Generate a realistic answer based on profile and state.

        Returns:
            {
                "is_correct": bool,
                "response_time": float,
                "confidence": float
            }
        """
        # Base accuracy adjusted by difficulty and topic mastery
        base_accuracy = self.profile.accuracy_base
        topic_bonus = self.topic_mastery.get(topic, 0) * 0.1
        difficulty_penalty = (difficulty - 3) * 0.08

        # State modifiers
        fatigue_penalty = 0.15 if self.is_fatigued else 0
        frustration_penalty = 0.10 if self.is_frustrated else 0
        streak_bonus = min(self.current_streak * 0.01, 0.1)

        # Final accuracy
        accuracy = base_accuracy + topic_bonus - difficulty_penalty - fatigue_penalty - frustration_penalty + streak_bonus
        accuracy = max(0.1, min(0.99, accuracy))  # Clamp to 10%-99%

        # Add variance
        accuracy += random.gauss(0, self.profile.accuracy_variance)
        accuracy = max(0.05, min(0.99, accuracy))

        is_correct = random.random() < accuracy

        # Response time
        base_time = self.profile.response_time_base
        time_variance = random.gauss(0, self.profile.response_time_variance)
        difficulty_time = difficulty * 1.5

        # Faster if confident/correct, slower if struggling
        if is_correct:
            response_time = base_time + time_variance + difficulty_time * 0.5
        else:
            response_time = base_time + time_variance + difficulty_time

        # Fatigue increases response time
        if self.is_fatigued:
            response_time *= 1.3

        response_time = max(1.0, min(60.0, response_time))

        # Update internal state
        self._update_state(topic, is_correct)

        return {
            "is_correct": is_correct,
            "response_time": response_time,
            "confidence": accuracy,
        }

    def _update_state(self, topic: str, is_correct: bool):
        """Update simulator state after an answer"""
        self.session_questions += 1
        self.total_questions += 1

        if is_correct:
            self.total_correct += 1
            self.current_streak += 1
            self.session_errors = max(0, self.session_errors - 1)

            # Improve topic mastery
            current = self.topic_mastery.get(topic, 0)
            self.topic_mastery[topic] = min(1.0, current + self.profile.learning_rate)
        else:
            self.current_streak = 0
            self.session_errors += 1

        # Check fatigue
        if self.session_questions >= self.profile.fatigue_threshold:
            self.is_fatigued = True

        # Check frustration
        if self.session_errors >= self.profile.frustration_threshold:
            self.is_frustrated = True

    def reset_session(self):
        """Reset session-specific state"""
        self.session_questions = 0
        self.session_errors = 0
        self.is_fatigued = False
        self.is_frustrated = False

    def simulate_session(
        self,
        adapter: 'UniversalAdapter',
        user_id: str,
        topics: List[str]
    ) -> Dict:
        """
        Simulate a complete learning session.

        Returns session statistics.
        """
        self.reset_session()
        session_length = self.get_session_length()

        session_xp = 0
        session_correct = 0
        results = []

        adapter.start_session(user_id, topics)

        for q in range(session_length):
            topic = topics[q % len(topics)]

            # Get question from engine
            stats = adapter.get_user_stats(user_id)
            mastery = int(stats.get("mastery", {}).get(topic, 0) * 100)
            params = adapter.get_next_question(user_id, topic, mastery)
            difficulty = params.get("difficulty", 2)

            # Generate answer
            answer = self.generate_answer(topic, difficulty)

            # Submit to engine
            result = adapter.submit_answer(
                user_id, topic,
                answer["is_correct"],
                answer["response_time"],
                difficulty
            )

            session_xp += result.get("xp_earned", 0)
            if answer["is_correct"]:
                session_correct += 1

            results.append({
                "topic": topic,
                "difficulty": difficulty,
                "is_correct": answer["is_correct"],
                "response_time": answer["response_time"],
                "xp_earned": result.get("xp_earned", 0),
            })

            # Check if engine suggests break
            if result.get("should_take_break"):
                break

            # User might quit if frustrated
            if self.is_frustrated and random.random() < 0.3:
                break

        return {
            "questions_answered": len(results),
            "correct": session_correct,
            "accuracy": session_correct / len(results) if results else 0,
            "xp_earned": session_xp,
            "ended_early": len(results) < session_length,
            "fatigued": self.is_fatigued,
            "frustrated": self.is_frustrated,
            "results": results,
        }

    def simulate_days(
        self,
        adapter: 'UniversalAdapter',
        user_id: str,
        topics: List[str],
        num_days: int = 7
    ) -> Dict:
        """
        Simulate multiple days of learning.

        Returns overall statistics.
        """
        days_active = 0
        total_xp = 0
        total_questions = 0
        total_correct = 0
        daily_stats = []

        for day in range(1, num_days + 1):
            if self.should_skip_day():
                daily_stats.append({
                    "day": day,
                    "skipped": True,
                    "reason": "skip_probability"
                })
                continue

            days_active += 1
            session = self.simulate_session(adapter, user_id, topics)

            total_xp += session["xp_earned"]
            total_questions += session["questions_answered"]
            total_correct += session["correct"]

            daily_stats.append({
                "day": day,
                "skipped": False,
                "questions": session["questions_answered"],
                "correct": session["correct"],
                "accuracy": session["accuracy"],
                "xp": session["xp_earned"],
            })

        # Get final stats from engine
        final_stats = adapter.get_user_stats(user_id)

        return {
            "profile": self.profile.name,
            "days_simulated": num_days,
            "days_active": days_active,
            "attendance_rate": days_active / num_days,
            "total_questions": total_questions,
            "total_correct": total_correct,
            "overall_accuracy": total_correct / total_questions if total_questions > 0 else 0,
            "total_xp": total_xp,
            "final_mastery": final_stats.get("mastery", {}),
            "daily_stats": daily_stats,
        }


def run_simulation_tests(runner: 'E2ERunner'):
    """Run simulation tests for all profiles"""
    from .adapter import UniversalAdapter

    profiles = ["motivated", "average", "struggling"]

    for profile_name in profiles:
        def test_profile(pname=profile_name):
            def test():
                simulator = UserSimulator(pname)
                user_id = runner.generate_id(f"sim_{pname}")
                runner.cleanup.register_user(user_id)

                result = simulator.simulate_days(
                    runner.adapter,
                    user_id,
                    runner.config.topics,
                    num_days=3
                )

                runner.assert_greater(
                    result["total_questions"], 0,
                    f"Profile {pname} should answer questions"
                )
                runner.assert_greater(
                    result["total_xp"], 0,
                    f"Profile {pname} should earn XP"
                )

                return True
            return test

        result = runner.run_test(
            f"Simulation: {profile_name}",
            test_profile(),
            f"{profile_name} profile simulated"
        )
        runner.add_result(result)


class SimulationReport:
    """Generate detailed simulation reports"""

    @staticmethod
    def compare_profiles(results: Dict[str, Dict]) -> str:
        """Generate comparison report for multiple profiles"""
        lines = [
            "=" * 60,
            "SIMULATION COMPARISON REPORT",
            "=" * 60,
            "",
        ]

        # Summary table
        lines.append(f"{'Profile':<12} {'Days':<6} {'Questions':<10} {'Accuracy':<10} {'XP':<8}")
        lines.append("-" * 50)

        for name, stats in results.items():
            lines.append(
                f"{name:<12} "
                f"{stats['days_active']:<6} "
                f"{stats['total_questions']:<10} "
                f"{stats['overall_accuracy']*100:.1f}%{'':<5} "
                f"{stats['total_xp']:<8}"
            )

        lines.append("")
        lines.append("=" * 60)

        return "\n".join(lines)

    @staticmethod
    def daily_breakdown(stats: Dict) -> str:
        """Generate daily breakdown for a single simulation"""
        lines = [
            f"Profile: {stats['profile']}",
            f"Days: {stats['days_active']}/{stats['days_simulated']} ({stats['attendance_rate']*100:.0f}% attendance)",
            "",
            "Daily Breakdown:",
            "-" * 40,
        ]

        for day in stats["daily_stats"]:
            if day.get("skipped"):
                lines.append(f"  Day {day['day']}: SKIPPED")
            else:
                lines.append(
                    f"  Day {day['day']}: {day['questions']} questions, "
                    f"{day['accuracy']*100:.0f}% accuracy, {day['xp']} XP"
                )

        lines.append("")
        lines.append(f"Total: {stats['total_questions']} questions, {stats['total_xp']} XP")

        return "\n".join(lines)
