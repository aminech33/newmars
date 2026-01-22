"""
AutonomousUser - Unified autonomous user simulation for ALL app modules.

This replaces both UserSimulator (learning-only) and FullLifeSimulator.
Each AutonomousUser is a complete, self-contained agent that can:
- Learn (questions, XP, mastery)
- Manage tasks (create, complete, pomodoros)
- Track health (weight, meals, hydration)
- Follow daily routines

Usage:
    user = AutonomousUser("motivated")
    user.live_day(adapter)  # Simulate one day
    user.live_week(adapter, days=7)  # Simulate a week
    user.get_stats()  # Get all statistics
"""

import random
import uuid
from dataclasses import dataclass, field
from typing import Dict, List, Optional, TYPE_CHECKING, Callable
from datetime import datetime, timedelta
from enum import Enum

if TYPE_CHECKING:
    from .adapter import UniversalAdapter


class UserMood(Enum):
    """Current mood/state of the user"""
    FRESH = "fresh"
    FOCUSED = "focused"
    TIRED = "tired"
    FRUSTRATED = "frustrated"
    MOTIVATED = "motivated"


@dataclass
class UserProfile:
    """
    Complete user profile defining ALL behaviors.

    This is a unified profile that covers:
    - Learning patterns
    - Task management
    - Health habits
    - Time patterns
    """
    name: str

    # === CORE TRAITS ===
    discipline: float         # 0-1: How disciplined (affects consistency)
    energy: float             # 0-1: Base energy level
    skill_level: float        # 0-1: Starting skill/accuracy
    learning_rate: float      # How fast they improve

    # === LEARNING ===
    accuracy_base: float      # Base answer accuracy
    accuracy_variance: float  # Random variance in accuracy
    response_time_base: float # Seconds to answer
    response_time_variance: float
    session_length: tuple     # (min, max) questions per session
    fatigue_threshold: int    # Questions before fatigue
    frustration_threshold: int # Errors before frustration

    # === TASKS ===
    tasks_per_day: tuple      # (min, max) tasks created
    task_completion_rate: float
    pomodoro_sessions: tuple  # (min, max) pomodoros per day
    pomodoro_completion_rate: float
    project_creation_rate: float  # Weekly probability

    # === HEALTH ===
    logs_weight: bool
    weight_frequency: float   # Daily probability of logging weight
    meals_per_day: tuple      # (min, max) meals logged
    hydration_entries: tuple  # (min, max) water entries
    target_hydration_ml: int

    # === TIME PATTERNS ===
    skip_probability: float   # Probability of skipping a day
    active_hours: tuple       # (start, end) hour
    morning_routine: bool
    evening_review: bool

    def to_dict(self) -> Dict:
        """Serialize all profile parameters to dictionary"""
        return {
            # Core traits
            "name": self.name,
            "discipline": self.discipline,
            "energy": self.energy,
            "skill_level": self.skill_level,
            "learning_rate": self.learning_rate,
            # Learning
            "accuracy_base": self.accuracy_base,
            "accuracy_variance": self.accuracy_variance,
            "response_time_base": self.response_time_base,
            "response_time_variance": self.response_time_variance,
            "session_length": self.session_length,
            "fatigue_threshold": self.fatigue_threshold,
            "frustration_threshold": self.frustration_threshold,
            # Tasks
            "tasks_per_day": self.tasks_per_day,
            "task_completion_rate": self.task_completion_rate,
            "pomodoro_sessions": self.pomodoro_sessions,
            "pomodoro_completion_rate": self.pomodoro_completion_rate,
            "project_creation_rate": self.project_creation_rate,
            # Health
            "logs_weight": self.logs_weight,
            "weight_frequency": self.weight_frequency,
            "meals_per_day": self.meals_per_day,
            "hydration_entries": self.hydration_entries,
            "target_hydration_ml": self.target_hydration_ml,
            # Time
            "skip_probability": self.skip_probability,
            "active_hours": self.active_hours,
            "morning_routine": self.morning_routine,
            "evening_review": self.evening_review,
        }


# === PREDEFINED PROFILES ===
PROFILES = {
    # =========================================================================
    # REALISTIC HUMAN - Le profil par défaut, comme un vrai humain
    # =========================================================================
    "human": UserProfile(
        name="human",

        # Traits variables - certains jours mieux que d'autres
        discipline=0.60,          # Moyen - pas parfait, pas nul
        energy=0.65,              # Variable selon les jours
        skill_level=0.55,         # Apprend progressivement
        learning_rate=0.02,       # Progression normale

        # Learning - performance variable
        accuracy_base=0.55,       # Aligned with skill_level
        accuracy_variance=0.12,   # Reduced for more consistent behavior
        response_time_base=10.0,  # Temps de réflexion normal
        response_time_variance=5.0,
        session_length=(10, 22),  # Increased from (8, 20) - more questions per session
        fatigue_threshold=20,     # Se fatigue après un moment
        frustration_threshold=5,  # Peut se frustrer

        # Tasks - productivité réaliste
        tasks_per_day=(1, 5),     # Variable selon motivation du jour
        task_completion_rate=0.65, # Finit la plupart mais pas tout
        pomodoro_sessions=(1, 4), # Quelques sessions focus
        pomodoro_completion_rate=0.75,
        project_creation_rate=0.15,

        # Health - habitudes imparfaites
        logs_weight=True,
        weight_frequency=0.6,     # Oublie parfois
        meals_per_day=(1, 3),     # Parfois saute un repas
        hydration_entries=(2, 6), # Boit de l'eau mais pas assez
        target_hydration_ml=2000,

        # Time - routine flexible
        skip_probability=0.15,    # Saute ~1 jour/semaine
        active_hours=(8, 22),     # Horaires normaux
        morning_routine=False,    # Pas toujours
        evening_review=False,     # Rarement
    ),

    # =========================================================================
    # PROFILES SPÉCIFIQUES (pour tests ciblés)
    # =========================================================================
    "motivated": UserProfile(
        name="motivated",
        discipline=0.85,
        energy=0.80,
        skill_level=0.75,         # Raised to match accuracy expectation
        learning_rate=0.03,

        accuracy_base=0.75,       # Aligned with skill_level
        accuracy_variance=0.10,
        response_time_base=8.0,
        response_time_variance=3.0,
        session_length=(15, 25),
        fatigue_threshold=30,
        frustration_threshold=10,

        tasks_per_day=(3, 6),
        task_completion_rate=0.85,
        pomodoro_sessions=(2, 5),
        pomodoro_completion_rate=0.90,
        project_creation_rate=0.3,

        logs_weight=True,
        weight_frequency=0.9,
        meals_per_day=(2, 3),
        hydration_entries=(4, 8),
        target_hydration_ml=2500,

        skip_probability=0.05,
        active_hours=(7, 22),
        morning_routine=True,
        evening_review=True,
    ),

    "average": UserProfile(
        name="average",
        discipline=0.55,
        energy=0.60,
        skill_level=0.50,
        learning_rate=0.02,

        accuracy_base=0.50,       # Aligned with skill_level
        accuracy_variance=0.12,
        response_time_base=12.0,
        response_time_variance=5.0,
        session_length=(8, 15),
        fatigue_threshold=15,
        frustration_threshold=6,

        tasks_per_day=(2, 4),
        task_completion_rate=0.60,
        pomodoro_sessions=(1, 3),
        pomodoro_completion_rate=0.70,
        project_creation_rate=0.15,

        logs_weight=True,
        weight_frequency=0.5,
        meals_per_day=(1, 3),
        hydration_entries=(2, 5),
        target_hydration_ml=2000,

        skip_probability=0.20,
        active_hours=(8, 21),
        morning_routine=False,
        evening_review=False,
    ),

    "irregular": UserProfile(
        name="irregular",
        discipline=0.30,
        energy=0.50,
        skill_level=0.40,
        learning_rate=0.01,

        accuracy_base=0.40,       # Aligned with skill_level
        accuracy_variance=0.15,
        response_time_base=15.0,
        response_time_variance=8.0,
        session_length=(3, 10),
        fatigue_threshold=10,
        frustration_threshold=4,

        tasks_per_day=(0, 3),
        task_completion_rate=0.40,
        pomodoro_sessions=(0, 2),
        pomodoro_completion_rate=0.50,
        project_creation_rate=0.05,

        logs_weight=True,
        weight_frequency=0.2,
        meals_per_day=(0, 2),
        hydration_entries=(0, 3),
        target_hydration_ml=1500,

        skip_probability=0.40,
        active_hours=(10, 23),
        morning_routine=False,
        evening_review=False,
    ),

    "struggling": UserProfile(
        name="struggling",
        discipline=0.40,
        energy=0.40,
        skill_level=0.30,
        learning_rate=0.015,

        accuracy_base=0.30,       # Aligned with skill_level
        accuracy_variance=0.10,   # Reduced variance for consistent behavior
        response_time_base=20.0,
        response_time_variance=10.0,
        session_length=(8, 15),  # Increased from (5, 12) - more questions per session
        fatigue_threshold=10,    # Slightly increased to allow longer sessions
        frustration_threshold=4, # Slightly increased tolerance

        tasks_per_day=(1, 3),
        task_completion_rate=0.30,
        pomodoro_sessions=(0, 1),
        pomodoro_completion_rate=0.40,
        project_creation_rate=0.10,

        logs_weight=False,
        weight_frequency=0.1,
        meals_per_day=(1, 2),
        hydration_entries=(1, 3),
        target_hydration_ml=1500,

        skip_probability=0.30,
        active_hours=(9, 20),
        morning_routine=False,
        evening_review=False,
    ),

    "expert": UserProfile(
        name="expert",
        discipline=0.95,
        energy=0.90,
        skill_level=0.90,
        learning_rate=0.01,

        accuracy_base=0.90,       # Aligned with skill_level
        accuracy_variance=0.05,
        response_time_base=5.0,
        response_time_variance=2.0,
        session_length=(20, 40),
        fatigue_threshold=50,
        frustration_threshold=15,

        tasks_per_day=(4, 8),
        task_completion_rate=0.95,
        pomodoro_sessions=(3, 6),
        pomodoro_completion_rate=0.95,
        project_creation_rate=0.4,

        logs_weight=True,
        weight_frequency=1.0,
        meals_per_day=(3, 3),
        hydration_entries=(6, 10),
        target_hydration_ml=3000,

        skip_probability=0.02,
        active_hours=(6, 23),
        morning_routine=True,
        evening_review=True,
    ),
}


@dataclass
class CalibrationTarget:
    """
    Expected outcomes for a profile after N days.
    Used to verify the learning engine is correctly calibrated.
    """
    # Learning targets (after 14 days)
    min_mastery: float       # Minimum average mastery expected (0-1)
    max_mastery: float       # Maximum average mastery expected (0-1)
    min_accuracy: float      # Minimum accuracy expected
    max_accuracy: float      # Maximum accuracy expected
    min_xp_per_day: int      # Minimum XP per active day
    max_xp_per_day: int      # Maximum XP per active day

    # Attendance
    min_attendance: float    # Minimum attendance rate
    max_attendance: float    # Maximum attendance rate

    def check(self, stats: Dict, days: int) -> Dict:
        """
        Check if stats match calibration targets.

        Returns dict with pass/fail for each metric and overall result.
        """
        days_active = stats.get("days_active", 1)
        mastery_values = list(stats.get("mastery", {}).values())
        # Learning engine returns mastery as 0-100 (percent), convert to 0-1
        avg_mastery = sum(mastery_values) / len(mastery_values) / 100 if mastery_values else 0

        accuracy = stats.get("accuracy", 0)
        xp = stats.get("xp", 0)
        xp_per_day = xp / days_active if days_active > 0 else 0
        attendance = stats.get("attendance_rate", 0)

        results = {
            "mastery": {
                "value": avg_mastery,
                "target": f"{self.min_mastery:.0%}-{self.max_mastery:.0%}",
                "pass": self.min_mastery <= avg_mastery <= self.max_mastery,
            },
            "accuracy": {
                "value": accuracy,
                "target": f"{self.min_accuracy:.0%}-{self.max_accuracy:.0%}",
                "pass": self.min_accuracy <= accuracy <= self.max_accuracy,
            },
            "xp_per_day": {
                "value": xp_per_day,
                "target": f"{self.min_xp_per_day}-{self.max_xp_per_day}",
                "pass": self.min_xp_per_day <= xp_per_day <= self.max_xp_per_day,
            },
            "attendance": {
                "value": attendance,
                "target": f"{self.min_attendance:.0%}-{self.max_attendance:.0%}",
                "pass": self.min_attendance <= attendance <= self.max_attendance,
            },
        }

        results["all_pass"] = all(r["pass"] for r in results.values() if isinstance(r, dict))
        return results


# === CALIBRATION TARGETS BY PROFILE ===
# These define what we EXPECT after N days of simulation
# STRICT MODE: Tighter ranges for better regression detection
# Use --calibrate --days 14 for most accurate results

def get_calibration_targets(days: int = 7, strict: bool = False) -> Dict[str, 'CalibrationTarget']:
    """
    Get calibration targets adjusted for simulation duration.

    Targets are calibrated based on observed behavior from multiple runs.
    Strict mode uses tighter ranges for regression detection.

    Args:
        days: Number of simulation days (longer = tighter ranges AND higher mastery)
        strict: If True, use narrower ranges (catches more regressions)

    Returns:
        Dict of profile_name -> CalibrationTarget
    """
    # Variance factor: longer simulations have less random variance
    # 7 days = 1.0, 14 days = 0.7, 30 days = 0.5
    variance = max(0.5, 1.0 - (days - 7) * 0.03)
    if strict:
        variance *= 0.7  # 30% tighter in strict mode

    # Progress factor: longer simulations = more learning
    # 7 days = 1.0, 14 days = 1.3, 30 days = 1.6
    progress = min(1.6, 1.0 + (days - 7) * 0.04)

    def range_adj(min_val: float, max_val: float, apply_progress: bool = True) -> tuple:
        """Adjust range based on variance and progress factors"""
        if apply_progress:
            # Scale both min and max by progress, cap at 1.0
            min_val = min(1.0, min_val * progress)
            max_val = min(1.0, max_val * progress)
        mid = (min_val + max_val) / 2
        half_range = (max_val - min_val) / 2 * variance
        return (max(0, mid - half_range), min(1.0, mid + half_range))

    # Base targets for 7 days, adjusted by progress factor for longer runs
    return {
        "expert": CalibrationTarget(
            # Expert: reaches mastery fast
            min_mastery=range_adj(0.78, 1.00)[0], max_mastery=1.00,
            min_accuracy=0.92, max_accuracy=1.00,
            min_xp_per_day=1800, max_xp_per_day=4000,
            min_attendance=0.80, max_attendance=1.00,
        ),
        "motivated": CalibrationTarget(
            # Motivated: excellent learner, often reaches near-mastery
            min_mastery=range_adj(0.70, 1.00)[0], max_mastery=1.00,
            min_accuracy=0.85, max_accuracy=1.00,
            min_xp_per_day=1000, max_xp_per_day=3000,
            min_attendance=0.75, max_attendance=1.00,
        ),
        "human": CalibrationTarget(
            # Human: moderate variance, steady progress
            min_mastery=range_adj(0.25, 0.65)[0], max_mastery=range_adj(0.25, 0.65)[1],
            min_accuracy=0.50, max_accuracy=0.75,  # Tighter range with skill cap
            min_xp_per_day=120, max_xp_per_day=500,
            min_attendance=0.50, max_attendance=1.00,
        ),
        "average": CalibrationTarget(
            # Average: steady progress
            min_mastery=range_adj(0.15, 0.60)[0], max_mastery=range_adj(0.15, 0.60)[1],
            min_accuracy=0.55, max_accuracy=0.85,
            min_xp_per_day=80, max_xp_per_day=400,
            min_attendance=0.55, max_attendance=1.00,
        ),
        "irregular": CalibrationTarget(
            # Irregular: unpredictable but CAN learn well
            min_mastery=range_adj(0.05, 0.50)[0], max_mastery=range_adj(0.05, 0.50)[1],
            min_accuracy=0.45, max_accuracy=0.85,
            min_xp_per_day=15, max_xp_per_day=150,
            min_attendance=0.25, max_attendance=1.00,
        ),
        "struggling": CalibrationTarget(
            # Struggling: slower progress, lower accuracy due to skill cap
            min_mastery=range_adj(0.03, 0.25)[0], max_mastery=range_adj(0.03, 0.25)[1],
            min_accuracy=0.30, max_accuracy=0.50,  # Skill cap limits max accuracy (skill=0.30+0.03)
            min_xp_per_day=5, max_xp_per_day=50,   # Lower XP due to lower accuracy
            min_attendance=0.25, max_attendance=1.00,
        ),
    }

# Default targets for backward compatibility
CALIBRATION_TARGETS = get_calibration_targets(days=7, strict=False)


@dataclass
class Event:
    """A single event in the user's day"""
    time: str           # HH:MM
    category: str       # learning, tasks, health, system
    action: str
    details: Dict = field(default_factory=dict)
    success: bool = True


@dataclass
class DayLog:
    """Complete log of a simulated day"""
    day: int
    date: str
    skipped: bool = False
    events: List[Event] = field(default_factory=list)

    # Counters
    tasks_created: int = 0
    tasks_completed: int = 0
    pomodoros: int = 0
    questions_answered: int = 0
    questions_correct: int = 0
    xp_earned: int = 0
    meals_logged: int = 0
    water_ml: int = 0
    weight_logged: bool = False


class AutonomousUser:
    """
    A fully autonomous simulated user.

    This is a self-contained agent that simulates realistic behavior
    across ALL modules: Learning, Tasks, Health.

    Usage:
        user = AutonomousUser("motivated")

        # Single day
        log = user.live_day(adapter, day=1, date="2024-01-15")

        # Full week
        report = user.live_week(adapter, days=7)

        # Check state
        print(user.mood)
        print(user.get_stats())
    """

    def __init__(self, profile_name: str = "human", user_id: str = None, use_ai: bool = False, use_tutor: bool = False):
        """
        Create an autonomous user.

        Args:
            profile_name: "human" (default, realistic) or specific profiles
            user_id: Optional user ID (generated if not provided)
            use_ai: If True, generate real AI questions and simulate realistic answers
            use_tutor: If True, interact with SocraticTutor when wrong
        """
        if profile_name not in PROFILES:
            raise ValueError(f"Unknown profile: {profile_name}. Available: {list(PROFILES.keys())}")

        self.profile = PROFILES[profile_name]
        self.user_id = user_id or f"auto_{profile_name}_{uuid.uuid4().hex[:8]}"
        self._is_human = (profile_name == "human")
        self._use_ai = use_ai
        self._use_tutor = use_tutor

        # === INTERNAL STATE ===
        self._mood = UserMood.FRESH
        self._energy = self.profile.energy

        # Daily modifiers (for "human" profile variability)
        self._daily_motivation = 1.0  # Modified each day
        self._daily_energy_mod = 0.0
        self._streak = 0

        # Consecutive bad days tracking (illness, stress, burnout)
        self._consecutive_bad_days = 0
        self._in_bad_period = False

        # Session state (reset each day)
        self._session_questions = 0
        self._session_errors = 0

        # Cumulative stats
        self._total_questions = 0
        self._total_correct = 0
        self._total_xp = 0
        # NOTE: Mastery is now fetched from learning engine, not tracked locally
        # This ensures perfect synchronization for calibration

        # AI mode tracking
        self._ai_questions_generated = 0
        self._ai_questions_failed = 0

        # Health state
        self._weight = random.uniform(65, 85)

        # Resources created (for cleanup)
        self._projects: List[str] = []
        self._tasks: List[str] = []
        self._pending_tasks: List[str] = []

        # Day logs (limited to prevent memory leaks)
        self._days: List[DayLog] = []
        self._max_days_history = 365  # Keep at most 1 year of history

        # Mastery decay tracking: topic -> days since last practice
        self._days_since_practice: Dict[str, int] = {}
        # Topics practiced today (reset each day)
        self._topics_practiced_today: List[str] = []

        # === NEW: SKILL PROGRESSION SYSTEM ===
        # Skill improves over time based on practice (learning_rate from profile)
        self._effective_skill = self.profile.skill_level  # Current skill (can grow)
        self._days_practiced = 0  # Total days with practice
        self._plateau_reached = False  # True when improvement slows dramatically

        # === NEW: INTER-SESSION MEMORY ===
        # Recent study boosts performance (spaced repetition effect)
        self._last_study_date: Optional[str] = None  # Date of last study session
        self._recent_topics: List[str] = []  # Topics studied in last 3 days
        self._revision_streak = 0  # Consecutive days of practice

        # === NEW: LIFE EVENTS ===
        # External factors that affect performance
        self._life_stress = 0.0  # 0-1: external stress level
        self._upcoming_event = None  # "exam", "vacation", "deadline", None
        self._event_days_remaining = 0

        # === NEW: MICRO-BEHAVIORS ===
        # Realistic session interruptions
        self._distraction_level = 0.0  # 0-1: phone notifications, etc.
        self._took_break_today = False
        self._coffee_boost = False  # Morning coffee effect

        # === NEW: TUTORING TRACKING ===
        # Track interactions with Socratic Tutor
        self._tutor_interactions = 0  # Total interactions with tutor
        self._tutor_hints_received = 0  # Hints received
        self._tutor_guidance_received = 0  # Socratic questions received
        self._tutor_reveals = 0  # Answers revealed by tutor
        self._tutor_helped_correct = 0  # Correct answers after tutor help

    # =========================================================================
    # PROPERTIES
    # =========================================================================

    @property
    def mood(self) -> UserMood:
        return self._mood

    @property
    def days(self) -> List[DayLog]:
        """Get all day logs (read-only copy)"""
        return self._days.copy()

    @property
    def is_fatigued(self) -> bool:
        return self._session_questions >= self.profile.fatigue_threshold

    @property
    def is_frustrated(self) -> bool:
        return self._session_errors >= self.profile.frustration_threshold

    # =========================================================================
    # UTILITY METHODS
    # =========================================================================

    def _get_time_of_day_modifier(self, hour: int) -> float:
        """
        Calculate performance modifier based on PERSONAL circadian rhythm.

        Uses the user's active_hours to determine their rhythm:
        - If active_hours = (8, 22) → Day worker, peak at 10h
        - If active_hours = (20, 8) → Night worker, peak at 2h
        - If active_hours = (10, 23) → Late riser, peak at 14h

        The modifier is based on position within the user's active window,
        not absolute clock time.

        Returns:
            Float modifier (-0.15 to +0.08)
        """
        start_hour, end_hour = self.profile.active_hours

        # Handle overnight schedules (e.g., 22 to 6)
        if start_hour > end_hour:
            # Night schedule: active hours wrap around midnight
            if hour >= start_hour or hour < end_hour:
                # Within active hours
                if hour >= start_hour:
                    hours_into_day = hour - start_hour
                else:
                    hours_into_day = (24 - start_hour) + hour
                total_active_hours = (24 - start_hour) + end_hour
            else:
                # Outside active hours (sleeping time for night workers)
                return -0.15  # Low performance during their "night"
        else:
            # Normal day schedule
            total_active_hours = end_hour - start_hour
            if start_hour <= hour < end_hour:
                hours_into_day = hour - start_hour
            else:
                # Outside active hours
                return -0.15  # Low performance outside active window

        # Calculate position in active day (0.0 = start, 1.0 = end)
        day_progress = hours_into_day / max(1, total_active_hours)

        # Performance curve based on position in YOUR day:
        # 0-15%: Warming up (+3%)
        # 15-40%: Peak performance (+8%)
        # 40-55%: Post-meal dip (-5%)
        # 55-80%: Afternoon/recovery (+5%)
        # 80-95%: Winding down (0%)
        # 95-100%: End of day fatigue (-8%)
        if day_progress < 0.15:
            return 0.03  # Warming up
        elif day_progress < 0.40:
            return 0.08  # Peak performance
        elif day_progress < 0.55:
            return -0.05  # Post-meal dip
        elif day_progress < 0.80:
            return 0.05  # Recovery phase
        elif day_progress < 0.95:
            return 0.0  # Winding down
        else:
            return -0.08  # End of day fatigue

    def _get_session_momentum_modifier(self, question_number: int, session_length: int) -> float:
        """
        Calculate performance modifier based on position in session.

        Models the warm-up → peak → fatigue curve:
        - First 3 questions: Warm-up phase (lower performance)
        - Questions 4 to 70% of session: Peak performance
        - Last 30% of session: Fatigue decline

        Args:
            question_number: Current question in session (1-indexed)
            session_length: Expected total session length

        Returns:
            Float modifier (-0.12 to +0.03)
        """
        if question_number <= 3:
            # Warm-up phase: brain not yet engaged (gentler curve)
            # Q1: -4%, Q2: -2%, Q3: 0%
            return -0.04 + (question_number * 0.02)

        peak_end = int(session_length * 0.7)

        if question_number <= peak_end:
            # Peak performance phase
            return 0.02  # Reduced from 0.03

        # Fatigue phase: GENTLER declining performance
        # Was -0.03 to -0.12 (too brutal), now -0.02 to -0.06
        fatigue_progress = (question_number - peak_end) / max(1, session_length - peak_end)
        return -0.02 - (fatigue_progress * 0.04)  # -0.02 to -0.06 (max -6%)

    # Transfer learning matrix for French language topics
    # topic_source -> topic_target -> transfer coefficient (0-1)
    TRANSFER_MATRIX = {
        "conjugaison": {
            "grammaire": 0.3,      # Conjugaison helps with grammar
            "orthographe": 0.2,    # Some spelling patterns from conjugation
            "vocabulaire": 0.1,    # Minimal transfer
        },
        "grammaire": {
            "conjugaison": 0.25,   # Grammar helps understand conjugation rules
            "orthographe": 0.35,   # Grammar strongly helps spelling
            "vocabulaire": 0.15,   # Some vocabulary understanding
        },
        "vocabulaire": {
            "orthographe": 0.25,   # Knowing words helps spell them
            "grammaire": 0.1,      # Limited grammar transfer
            "conjugaison": 0.1,    # Limited conjugation transfer
        },
        "orthographe": {
            "vocabulaire": 0.2,    # Spelling helps recognize words
            "grammaire": 0.15,     # Some grammar patterns
            "conjugaison": 0.15,   # Some verb spelling patterns
        },
    }

    def _get_transfer_bonus(self, target_topic: str, all_masteries: Dict[str, float]) -> float:
        """
        Calculate mastery bonus from related topics (transfer learning).

        Based on Thorndike's theory: learning in one area can facilitate
        learning in related areas.

        Args:
            target_topic: The topic being studied
            all_masteries: Dict of topic -> mastery (0-100)

        Returns:
            Bonus mastery points (0-15 typically)
        """
        total_bonus = 0.0

        for source_topic, mastery in all_masteries.items():
            if source_topic == target_topic:
                continue

            # Check if source topic transfers to target
            transfer_coef = self.TRANSFER_MATRIX.get(source_topic, {}).get(target_topic, 0)

            if transfer_coef > 0 and mastery > 20:  # Only transfer from topics with decent mastery
                # Transfer bonus = source_mastery * coefficient * diminishing factor
                # Max ~15% bonus from any single topic
                bonus = (mastery / 100) * transfer_coef * 15
                total_bonus += bonus

        # Cap total transfer bonus at 20%
        return min(20, total_bonus)

    def _apply_mastery_decay(self, mastery: float, days_since_practice: int, skill_level: float) -> float:
        """
        Apply Ebbinghaus forgetting curve to mastery.

        Based on research:
        - Without revision, we forget ~50% after 1 day
        - ~70% after 7 days
        - ~80% after 30 days

        But skilled learners retain better (slower decay).

        Args:
            mastery: Current mastery (0-100)
            days_since_practice: Days since last practice on this topic
            skill_level: User's skill level (0-1), affects retention

        Returns:
            Decayed mastery value (0-100)
        """
        if days_since_practice <= 0:
            return mastery

        # Base decay rate (lower = forgets slower)
        # Experts retain better: decay_rate from 0.3 (expert) to 0.5 (beginner)
        decay_rate = 0.5 - (skill_level * 0.2)

        # Ebbinghaus-inspired formula: retention = e^(-decay_rate * sqrt(days))
        # Using sqrt to slow down decay over time (spaced repetition effect)
        import math
        retention = math.exp(-decay_rate * math.sqrt(days_since_practice))

        # Minimum retention floor (you don't forget everything)
        # Higher mastery = higher floor (deep learning is retained)
        floor = min(0.3, mastery / 100 * 0.4)  # Floor of 10-30% of original

        effective_retention = floor + (1 - floor) * retention

        return max(0, mastery * effective_retention)

    # =========================================================================
    # SKILL PROGRESSION & LEARNING CURVE
    # =========================================================================

    def _update_skill_progression(self, day: int, questions_today: int, accuracy_today: float):
        """
        Update effective skill based on practice.

        Skill improves with practice but follows a learning curve:
        - Fast improvement at the start
        - Slows down over time (plateau effect)
        - Can slightly decrease without practice

        Args:
            day: Current simulation day
            questions_today: Questions answered today
            accuracy_today: Today's accuracy (0-1)
        """
        if questions_today == 0:
            # No practice = slight skill decay (use it or lose it)
            decay = 0.001 * (1 - self.profile.discipline)
            self._effective_skill = max(
                self.profile.skill_level * 0.9,  # Can't drop below 90% of base
                self._effective_skill - decay
            )
            return

        self._days_practiced += 1
        base_skill = self.profile.skill_level
        learning_rate = self.profile.learning_rate

        # === PLATEAU EFFECT ===
        # After ~30 days, improvement slows dramatically
        # Simulates the "intermediate plateau" in language learning
        if self._days_practiced > 30:
            if not self._plateau_reached and random.random() < 0.3:
                self._plateau_reached = True
            if self._plateau_reached:
                learning_rate *= 0.1  # 90% slower improvement

        # === LEARNING CURVE ===
        # Improvement based on: practice quality * effort * diminishing returns
        practice_quality = accuracy_today  # Better accuracy = better learning
        effort_factor = min(1.0, questions_today / 15)  # Diminishing returns after 15q

        # Diminishing returns: harder to improve as you get better
        room_to_grow = 1.0 - self._effective_skill
        improvement = learning_rate * practice_quality * effort_factor * room_to_grow

        # Apply improvement
        max_skill = min(0.95, base_skill + 0.25)  # Can improve up to +25% from base, max 95%
        self._effective_skill = min(max_skill, self._effective_skill + improvement)

    def _get_inter_session_bonus(self, topic: str, current_date: str) -> float:
        """
        Calculate bonus from recent study sessions.

        Based on spaced repetition research:
        - Studying yesterday gives bigger boost than 3 days ago
        - Studying the same topic recently helps more
        - Revision streaks compound the effect

        Returns:
            Float bonus (0 to 0.10)
        """
        bonus = 0.0

        # Recent practice on this specific topic
        if topic in self._recent_topics:
            bonus += 0.03  # +3% for studying this topic recently

        # Revision streak bonus
        if self._revision_streak >= 3:
            bonus += min(0.05, self._revision_streak * 0.01)  # Up to +5%

        # Studied yesterday? Stronger memory
        if self._last_study_date:
            # Simple check: if last study was "yesterday" (dates are strings)
            # This is approximate but works for simulation
            bonus += 0.02  # +2% for recent study

        return min(0.10, bonus)  # Cap at 10%

    def _update_inter_session_memory(self, topics_practiced: List[str], current_date: str):
        """Update memory of recent practice."""
        if topics_practiced:
            self._last_study_date = current_date
            # Keep last 3 days of topics
            self._recent_topics = list(set(self._recent_topics + topics_practiced))[-8:]
            self._revision_streak += 1
        else:
            # No practice today
            if self._revision_streak > 0:
                self._revision_streak = 0
            # Forget old topics gradually
            if len(self._recent_topics) > 0 and random.random() < 0.3:
                self._recent_topics = self._recent_topics[1:]

    # =========================================================================
    # LIFE EVENTS SYSTEM
    # =========================================================================

    def _roll_life_events(self, day: int):
        """
        Randomly generate life events that affect performance.

        Events:
        - exam: Stress increases, then relief after
        - vacation: Skip days, then refreshed
        - deadline: High stress, low energy
        - illness: Bad period, low performance
        """
        # Only roll new events occasionally
        if self._upcoming_event is not None:
            self._event_days_remaining -= 1
            if self._event_days_remaining <= 0:
                self._resolve_life_event()
            return

        # 5% chance of a life event starting each day
        if random.random() > 0.05:
            self._life_stress = max(0, self._life_stress - 0.05)  # Gradual stress relief
            return

        # Roll for event type
        event_roll = random.random()
        if event_roll < 0.30:
            # Exam coming up (30%)
            self._upcoming_event = "exam"
            self._event_days_remaining = random.randint(3, 7)
            self._life_stress = 0.3
        elif event_roll < 0.50:
            # Work/school deadline (20%)
            self._upcoming_event = "deadline"
            self._event_days_remaining = random.randint(2, 5)
            self._life_stress = 0.4
        elif event_roll < 0.70:
            # Vacation/break (20%)
            self._upcoming_event = "vacation"
            self._event_days_remaining = random.randint(3, 7)
            self._life_stress = -0.2  # Relaxed!
        else:
            # Minor illness (30%)
            self._upcoming_event = "illness"
            self._event_days_remaining = random.randint(2, 4)
            self._life_stress = 0.2
            self._in_bad_period = True
            self._consecutive_bad_days = 1

    def _resolve_life_event(self):
        """Handle the end of a life event."""
        event = self._upcoming_event

        if event == "exam":
            # Relief after exam
            self._life_stress = max(0, self._life_stress - 0.4)
            # Maybe skip a day to celebrate/recover
            if random.random() < 0.3:
                self._life_stress = -0.1  # Post-exam relaxation
        elif event == "deadline":
            self._life_stress = max(0, self._life_stress - 0.3)
        elif event == "vacation":
            # Refreshed after vacation
            self._life_stress = 0
            self._effective_skill = min(
                self._effective_skill + 0.02,  # Slight boost from rest
                0.95
            )
        elif event == "illness":
            self._in_bad_period = False
            self._consecutive_bad_days = 0

        self._upcoming_event = None
        self._event_days_remaining = 0

    def _get_life_stress_modifier(self) -> float:
        """
        Get performance modifier based on current life stress.

        Returns:
            Float modifier (-0.15 to +0.05)
        """
        if self._life_stress < 0:
            # Relaxed = slight boost
            return min(0.05, -self._life_stress * 0.25)
        else:
            # Stressed = penalty
            return -min(0.15, self._life_stress * 0.3)

    # =========================================================================
    # MICRO-BEHAVIORS
    # =========================================================================

    def _roll_micro_behaviors(self, hour: int):
        """
        Roll for micro-behaviors that affect the session.

        Includes:
        - Distraction level (phone, notifications)
        - Coffee boost (morning caffeine)
        - Need for breaks
        """
        # Morning coffee effect (before 11am, if disciplined)
        if 6 <= hour <= 10 and random.random() < self.profile.discipline:
            self._coffee_boost = True
        else:
            self._coffee_boost = False

        # Distraction level (higher in evening, lower for disciplined users)
        base_distraction = 0.1
        if hour >= 19:
            base_distraction += 0.1  # More distractions in evening
        if hour >= 21:
            base_distraction += 0.1  # Even more late night

        # Discipline reduces distractions
        self._distraction_level = base_distraction * (1.5 - self.profile.discipline)
        # Add randomness
        self._distraction_level += random.gauss(0, 0.05)
        self._distraction_level = max(0, min(0.4, self._distraction_level))

    def _get_micro_behavior_modifier(self) -> float:
        """
        Get performance modifier from micro-behaviors.

        Returns:
            Float modifier (-0.10 to +0.05)
        """
        modifier = 0.0

        # Coffee boost
        if self._coffee_boost:
            modifier += 0.03  # +3% focus

        # Distraction penalty
        modifier -= self._distraction_level * 0.25  # Up to -10%

        return modifier

    def _maybe_get_distracted(self) -> bool:
        """
        Check if user gets distracted during a question.

        Returns True if they need to take an unplanned break.
        """
        # Higher distraction level = more likely to get distracted
        return random.random() < self._distraction_level * 0.3

    # =========================================================================
    # TUTORING INTERACTION
    # =========================================================================

    def _interact_with_tutor(
        self,
        adapter: 'UniversalAdapter',
        question_data: Dict,
        initial_answer: Dict,
        topic: str,
        difficulty: int,
        mastery: float,
        hour: int,
        session_length: int
    ) -> Dict:
        """
        Simulate interaction with the Socratic Tutor after a wrong answer.

        The tutor guides the student without giving the answer directly.
        The student may:
        - Learn from hints and get it right
        - Need multiple hints
        - Eventually have the answer revealed

        This simulates how a real student would interact with the tutor.

        Args:
            adapter: UniversalAdapter with tutoring methods
            question_data: The question (with correct_answer, options, etc.)
            initial_answer: The initial wrong answer result
            topic: Topic being studied
            difficulty: Question difficulty (1-5)
            mastery: Current mastery (0-1)
            hour: Current hour
            session_length: Session length for context

        Returns:
            Final answer dict (may be corrected after tutoring)
        """
        self._tutor_interactions += 1

        # Prepare question for tutor
        tutor_question = {
            "id": question_data.get("id", f"q_{random.randint(1000, 9999)}"),
            "question_text": question_data.get("question_text", ""),
            "options": question_data.get("options", []),
            "correct_answer": question_data.get("correct_answer", ""),
            "topic": topic,
            "explanation": question_data.get("explanation", ""),
        }

        wrong_answer = initial_answer.get("chosen_answer", "wrong")
        correct_answer = question_data.get("correct_answer", "")
        response_time = initial_answer.get("response_time", 10.0)
        max_attempts = 5
        attempt = 1
        learned_from_tutor = False
        hint_level_used = 0

        while attempt < max_attempts:
            # Get tutoring response (now with response_time for adaptation)
            tutor_response = adapter.tutor_wrong_answer(
                self.user_id, tutor_question, wrong_answer,
                response_time=response_time
            )

            response_type = tutor_response.get("type", "hint")
            hint_level = tutor_response.get("level") or 1  # Default to 1 if None
            hint_level_used = max(hint_level_used, hint_level)

            # Check for break suggestion from adaptive tutor
            if response_type == "break_suggestion":
                # Tutor detected fatigue/frustration - student may take break
                if random.random() < self.profile.discipline * 0.3:
                    # Disciplined students are less likely to take suggested break
                    pass  # Continue trying
                else:
                    # Student acknowledges fatigue
                    self._is_fatigued = True
                    break

            # Track what kind of help received
            if response_type == "guidance":
                self._tutor_guidance_received += 1
            elif response_type == "hint":
                self._tutor_hints_received += 1
            elif response_type == "reveal":
                self._tutor_reveals += 1
                # Answer was revealed - student "learned" it
                learned_from_tutor = True
                break

            # Simulate student reaction to tutoring
            # Probability of getting it right increases with:
            # - Hint level (more explicit = easier)
            # - Skill level
            # - Mastery
            # - Discipline (pays attention to hints)
            #
            # IMPORTANT: We want realistic improvement, not 100% success
            # Even with hints, students don't always understand

            # Base improvement from hint level (10% per level, max 30%)
            base_improvement = 0.10 * hint_level

            # Skill factor (reduced: up to 15% from skill)
            skill_factor = self._effective_skill * 0.15

            # Mastery factor (reduced: up to 10% from mastery)
            mastery_factor = mastery * 0.10

            # Discipline factor (up to 15% from discipline)
            discipline_factor = self.profile.discipline * 0.15

            improvement_chance = base_improvement + skill_factor + mastery_factor + discipline_factor

            # After guidance (Socratic question), MUCH harder to benefit
            # The student has to think, not just read the answer
            if response_type == "guidance":
                improvement_chance *= 0.5  # Harder to benefit without direct hint

            # Fatigue reduces ability to learn from hints
            if self.is_fatigued:
                improvement_chance *= 0.7

            # Frustration makes hints less effective
            if self.is_frustrated:
                improvement_chance *= 0.6

            # Lower skill = harder to benefit from hints
            # Struggling students need more time/repetition to understand hints
            if self._effective_skill < 0.4:
                improvement_chance *= 0.5  # 50% penalty for low skill
            elif self._effective_skill < 0.6:
                improvement_chance *= 0.65  # 35% penalty for medium-low skill
            elif self._effective_skill < 0.7:
                improvement_chance *= 0.80  # 20% penalty for medium skill

            # Clamp to reasonable range (max 60%, min 5%)
            improvement_chance = min(0.60, max(0.05, improvement_chance))

            if random.random() < improvement_chance:
                # Student figured it out!
                learned_from_tutor = True
                self._tutor_helped_correct += 1

                # Signal correct answer to tutor for adaptation tracking
                adapter.tutor_correct_answer(
                    self.user_id, tutor_question, attempt,
                    response_time=response_time * (1 + attempt * 0.3),
                    hint_level_used=hint_level_used
                )
                break

            # Still wrong - try again with new (wrong) answer
            wrong_options = [o for o in question_data.get("options", []) if o != correct_answer and o != wrong_answer]
            if wrong_options:
                wrong_answer = random.choice(wrong_options)

            # Simulate time passing as student thinks
            response_time = response_time * 1.2  # Takes longer each attempt
            attempt += 1

        # Reset tutor context for next question
        adapter.tutor_reset(self.user_id, topic)

        # Return final result
        if learned_from_tutor:
            # Student got it right after tutoring
            return {
                "is_correct": True,
                "response_time": initial_answer.get("response_time", 10) * (1 + attempt * 0.5),  # Took longer
                "confidence": initial_answer.get("confidence", 0.5),
                "chosen_answer": correct_answer,
                "correct_answer": correct_answer,
                "tutoring_attempts": attempt,
                "tutoring_helped": True,
            }
        else:
            # Student still didn't get it (answer was revealed)
            return {
                "is_correct": False,  # Don't count revealed answers as correct
                "response_time": initial_answer.get("response_time", 10) * 2,
                "confidence": initial_answer.get("confidence", 0.3),
                "chosen_answer": wrong_answer,
                "correct_answer": correct_answer,
                "tutoring_attempts": attempt,
                "tutoring_helped": False,
                "answer_revealed": True,
            }

    def _time(self, hour: int, minute: int = 0) -> str:
        return f"{hour:02d}:{minute:02d}"

    def _random_time(self, start: int, end: int) -> str:
        """
        Generate a random time between start and end hours.

        Args:
            start: Start hour (inclusive)
            end: End hour (exclusive)

        Returns:
            Time string in HH:MM format
        """
        if start >= end:
            # Fallback: use start hour if range is invalid
            hour = start
        else:
            hour = random.randint(start, end - 1)
        minute = random.randint(0, 59)
        return self._time(hour, minute)

    def _should_skip_day(self) -> bool:
        skip_prob = self.profile.skip_probability
        # Human: plus susceptible de skip si mauvaise motivation
        if self._is_human:
            skip_prob *= (2.0 - self._daily_motivation)
        return random.random() < skip_prob

    def _roll_daily_mood(self):
        """
        For 'human' profile: randomize daily motivation/energy.
        Some days are great, some are meh, some are bad.

        NEW: Supports consecutive bad days (illness, stress, burnout).
        A bad day has 40% chance to extend into tomorrow.
        """
        if not self._is_human:
            self._daily_motivation = 1.0
            self._daily_energy_mod = 0.0
            self._in_bad_period = False
            self._consecutive_bad_days = 0
            return

        # === CONSECUTIVE BAD DAYS LOGIC ===
        # If we're in a bad period, there's a chance it continues
        if self._in_bad_period:
            # Probability of staying bad decreases each day (40%, 30%, 20%, 10%)
            continue_prob = max(0.10, 0.40 - self._consecutive_bad_days * 0.10)
            if random.random() < continue_prob:
                # Still in bad period
                self._consecutive_bad_days += 1
                severity = min(1.0, 0.5 + self._consecutive_bad_days * 0.1)  # Gets worse
                self._daily_motivation = random.uniform(0.4, 0.6) * (1.1 - severity * 0.2)
                self._daily_energy_mod = -0.15 - (self._consecutive_bad_days * 0.03)
                self._mood = UserMood.TIRED
                return
            else:
                # Recovering from bad period
                self._in_bad_period = False
                self._consecutive_bad_days = 0

        # === NORMAL DAILY ROLL ===
        # 65% normal, 20% good day, 15% bad day (can start a bad period)
        roll = random.random()
        if roll < 0.15:
            # Bad day starts - might become a streak
            self._daily_motivation = random.uniform(0.5, 0.7)
            self._daily_energy_mod = -0.15
            self._mood = UserMood.TIRED
            # 30% chance this becomes a multi-day bad period
            if random.random() < 0.30:
                self._in_bad_period = True
                self._consecutive_bad_days = 1
        elif roll < 0.35:
            # Great day - motivated, focused
            self._daily_motivation = random.uniform(1.2, 1.4)
            self._daily_energy_mod = 0.10
            self._mood = UserMood.MOTIVATED
        else:
            # Normal day
            self._daily_motivation = random.uniform(0.85, 1.15)
            self._daily_energy_mod = random.uniform(-0.05, 0.05)
            self._mood = UserMood.FRESH

    def _reset_session(self):
        """Reset session-specific state"""
        self._session_questions = 0
        self._session_errors = 0
        self._mood = UserMood.FRESH
        self._energy = self.profile.energy + self._daily_energy_mod

    # =========================================================================
    # LEARNING BEHAVIOR
    # =========================================================================

    def _answer_question(
        self,
        topic: str,
        difficulty: int,
        mastery: float = 0.0,
        hour: int = 14,
        session_length: int = 15
    ) -> Dict:
        """
        Generate a realistic answer based on state and profile.

        Args:
            topic: The topic being tested
            difficulty: Question difficulty (1-5)
            mastery: Current mastery from learning engine (0-1)
            hour: Current hour of day (0-23) for circadian effects
            session_length: Expected session length for momentum calculation
        """
        # === INPUT VALIDATION ===
        # Clamp inputs to valid ranges (defensive programming)
        difficulty = max(1, min(5, difficulty))  # Clamp to [1, 5]
        mastery = max(0.0, min(1.0, mastery))    # Clamp to [0, 1]
        hour = hour % 24  # Wrap to [0, 23]

        # Calculate accuracy - CALIBRATED v4.6
        # Now includes: skill progression, inter-session memory, life events, micro-behaviors
        skill = self._effective_skill  # Use dynamic skill instead of static profile skill

        # Base accuracy from skill (primary factor)
        base = skill * 0.85 + 0.10  # Gives range ~0.35 (skill=0.3) to ~0.87 (skill=0.9)

        # === NEW: Inter-session memory bonus ===
        inter_session_bonus = self._get_inter_session_bonus(topic, "")  # Up to +10%

        # === NEW: Life stress modifier ===
        life_stress_modifier = self._get_life_stress_modifier()  # -15% to +5%

        # === NEW: Micro-behavior modifier ===
        micro_modifier = self._get_micro_behavior_modifier()  # -10% to +5%

        # Mastery bonus: up to 15% at full mastery (was 8% - too weak)
        # A student who mastered a topic should do significantly better
        topic_bonus = mastery * 0.15

        # Difficulty effect: STRONGER impact (was ±3%, now ±5%)
        # Level 1 (easy): +10%, Level 3: 0%, Level 5 (hard): -10%
        difficulty_effect = (3 - difficulty) * 0.05

        # Fatigue: PROGRESSIVE instead of binary
        # Gradual decline instead of sudden -10% drop
        fatigue_ratio = self._session_questions / max(1, self.profile.fatigue_threshold)
        if fatigue_ratio < 1.0:
            fatigue_penalty = 0  # Not fatigued yet
        elif fatigue_ratio < 1.5:
            fatigue_penalty = 0.05  # Slightly tired
        elif fatigue_ratio < 2.0:
            fatigue_penalty = 0.10  # Tired
        else:
            fatigue_penalty = 0.15  # Very tired (but not 40% drop)

        # Frustration: also progressive
        error_ratio = self._session_errors / max(1, self.profile.frustration_threshold)
        if error_ratio < 1.0:
            frustration_penalty = 0
        elif error_ratio < 1.5:
            frustration_penalty = 0.05
        else:
            frustration_penalty = 0.10

        # Streak bonus: more visible (was capped at 5%, now 8%)
        # Each correct answer gives +1.5% up to 8%
        streak_bonus = min(self._streak * 0.015, 0.08)

        # TIME OF DAY effect (circadian rhythm)
        time_modifier = self._get_time_of_day_modifier(hour)

        # SESSION MOMENTUM: gentler curve
        momentum_modifier = self._get_session_momentum_modifier(
            self._session_questions + 1,
            session_length
        )

        # Calculate raw accuracy with all modifiers
        raw_accuracy = (
            base
            + topic_bonus
            + difficulty_effect
            - fatigue_penalty
            - frustration_penalty
            + streak_bonus
            + time_modifier
            + momentum_modifier
            + inter_session_bonus      # NEW: Recent study bonus
            + life_stress_modifier     # NEW: Life events
            + micro_modifier           # NEW: Distractions/coffee
        )

        # SOFT CAP: Use skill + mastery contribution as ceiling
        # Mastery can push you above your base skill, but not infinitely
        effective_ceiling = skill + (mastery * 0.12)  # Mastery gives up to +12% ceiling
        if raw_accuracy > effective_ceiling:
            excess = raw_accuracy - effective_ceiling
            raw_accuracy = effective_ceiling + excess * 0.25  # Diminishing returns above ceiling

        # Add variance (REDUCED from profile - was causing too much noise)
        variance = self.profile.accuracy_variance * 0.5  # 50% of original variance
        accuracy = raw_accuracy + random.gauss(0, variance)

        # Clamp to reasonable range
        accuracy = max(0.15, min(0.92, accuracy))

        is_correct = random.random() < accuracy

        # Calculate response time
        base_time = self.profile.response_time_base
        time_var = random.gauss(0, self.profile.response_time_variance)
        diff_time = difficulty * 1.5 * (0.5 if is_correct else 1.0)
        fatigue_mult = 1.3 if self.is_fatigued else 1.0

        response_time = max(1.0, min(60.0, (base_time + time_var + diff_time) * fatigue_mult))

        # Update state
        self._session_questions += 1
        self._total_questions += 1

        if is_correct:
            self._total_correct += 1
            self._streak += 1
            self._session_errors = max(0, self._session_errors - 1)
            # Mastery is now tracked by learning engine, not locally
        else:
            self._streak = 0
            self._session_errors += 1

        # Update mood
        if self.is_frustrated:
            self._mood = UserMood.FRUSTRATED
        elif self.is_fatigued:
            self._mood = UserMood.TIRED
        elif self._streak > 5:
            self._mood = UserMood.MOTIVATED

        return {
            "is_correct": is_correct,
            "response_time": response_time,
            "confidence": accuracy,
        }

    def _answer_ai_question(
        self,
        question_data: Dict,
        topic: str,
        difficulty: int,
        mastery: float = 0.0,
        hour: int = 14,
        session_length: int = 15
    ) -> Dict:
        """
        Answer a REAL AI-generated question based on profile characteristics.

        This simulates how a real user with this profile would answer the question.
        The probability of getting it correct depends on:
        - Profile skill level
        - Question difficulty
        - Current mastery
        - Fatigue and frustration state
        - Streak bonus
        - Time of day (circadian rhythm)
        - Session momentum (warm-up/peak/fatigue)

        Args:
            question_data: Dict with question_text, options, correct_index
            topic: The topic being tested
            difficulty: Question difficulty (1-5)
            mastery: Current mastery from learning engine (0-1)
            hour: Current hour of day (0-23) for circadian effects
            session_length: Expected session length for momentum calculation

        Returns:
            Dict with is_correct, response_time, chosen_answer, correct_answer
        """
        # === INPUT VALIDATION ===
        difficulty = max(1, min(5, difficulty))
        mastery = max(0.0, min(1.0, mastery))
        hour = hour % 24

        options = question_data.get("options", [])
        correct_idx = question_data.get("correct_index", 0)

        # Calculate probability of answering correctly - CALIBRATED v4.6
        # Same formula as _answer_question for consistency
        skill = self._effective_skill  # Use dynamic skill

        # Base accuracy from skill (primary factor)
        base = skill * 0.85 + 0.10

        # NEW modifiers
        inter_session_bonus = self._get_inter_session_bonus(topic, "")
        life_stress_modifier = self._get_life_stress_modifier()
        micro_modifier = self._get_micro_behavior_modifier()

        # Mastery bonus: up to 15% at full mastery
        topic_bonus = mastery * 0.15

        # Difficulty effect: ±5% per level from 3
        difficulty_effect = (3 - difficulty) * 0.05

        # Fatigue: progressive
        fatigue_ratio = self._session_questions / max(1, self.profile.fatigue_threshold)
        if fatigue_ratio < 1.0:
            fatigue_penalty = 0
        elif fatigue_ratio < 1.5:
            fatigue_penalty = 0.05
        elif fatigue_ratio < 2.0:
            fatigue_penalty = 0.10
        else:
            fatigue_penalty = 0.15

        # Frustration: progressive
        error_ratio = self._session_errors / max(1, self.profile.frustration_threshold)
        if error_ratio < 1.0:
            frustration_penalty = 0
        elif error_ratio < 1.5:
            frustration_penalty = 0.05
        else:
            frustration_penalty = 0.10

        # Streak bonus: +1.5% per correct, max 8%
        streak_bonus = min(self._streak * 0.015, 0.08)

        # TIME OF DAY effect (circadian rhythm)
        time_modifier = self._get_time_of_day_modifier(hour)

        # SESSION MOMENTUM effect
        momentum_modifier = self._get_session_momentum_modifier(
            self._session_questions + 1,
            session_length
        )

        # Calculate raw accuracy with all modifiers
        raw_accuracy = (
            base
            + topic_bonus
            + difficulty_effect
            - fatigue_penalty
            - frustration_penalty
            + streak_bonus
            + time_modifier
            + momentum_modifier
            + inter_session_bonus
            + life_stress_modifier
            + micro_modifier
        )

        # Soft cap above skill level
        # SOFT CAP: Use skill + mastery contribution as ceiling
        effective_ceiling = skill + (mastery * 0.12)
        if raw_accuracy > effective_ceiling:
            excess = raw_accuracy - effective_ceiling
            raw_accuracy = effective_ceiling + excess * 0.25

        # Add variance (reduced) and clamp
        variance = self.profile.accuracy_variance * 0.5
        accuracy = max(0.15, min(0.92, raw_accuracy + random.gauss(0, variance)))

        # Decide if user gets it right
        is_correct = random.random() < accuracy

        # Choose the answer
        if is_correct:
            chosen_idx = correct_idx
        else:
            # Wrong answer: pick randomly from incorrect options
            wrong_options = [i for i in range(len(options)) if i != correct_idx]
            chosen_idx = random.choice(wrong_options) if wrong_options else 0

        chosen_answer = options[chosen_idx] if chosen_idx < len(options) else options[0]
        correct_answer = question_data.get("correct_answer", options[correct_idx] if correct_idx < len(options) else "")

        # Calculate response time (reading + thinking)
        base_time = self.profile.response_time_base
        # Longer question = more reading time
        question_length = len(question_data.get("question_text", ""))
        reading_time = question_length * 0.02  # ~50 chars/second reading
        time_var = random.gauss(0, self.profile.response_time_variance)
        diff_time = difficulty * 1.5 * (0.5 if is_correct else 1.0)
        fatigue_mult = 1.3 if self.is_fatigued else 1.0

        response_time = max(2.0, min(120.0, (base_time + reading_time + time_var + diff_time) * fatigue_mult))

        # Update internal state
        self._session_questions += 1
        self._total_questions += 1

        if is_correct:
            self._total_correct += 1
            self._streak += 1
            self._session_errors = max(0, self._session_errors - 1)
        else:
            self._streak = 0
            self._session_errors += 1

        # Update mood
        if self.is_frustrated:
            self._mood = UserMood.FRUSTRATED
        elif self.is_fatigued:
            self._mood = UserMood.TIRED
        elif self._streak > 5:
            self._mood = UserMood.MOTIVATED

        return {
            "is_correct": is_correct,
            "response_time": response_time,
            "confidence": accuracy,
            "chosen_answer": chosen_answer,
            "correct_answer": correct_answer,
            "question_text": question_data.get("question_text", ""),
        }

    def _learn(self, adapter: 'UniversalAdapter', log: DayLog, topics: List[str], hour: int = 14):
        """
        Simulate a learning session using ALL learning engine features:
        - Adaptive difficulty
        - Interleaving (topic switching)
        - Cognitive load detection
        - Break suggestions
        - AI question generation (when use_ai=True)
        - Time of day effects (circadian rhythm)
        - Session momentum (warm-up/peak/fatigue)

        Mastery is fetched from learning engine for perfect calibration.

        Args:
            adapter: UniversalAdapter for API calls
            log: DayLog to record events
            topics: List of topics to study
            hour: Current hour of day (0-23) for circadian effects
        """
        # Guard: no topics = no learning
        if not topics:
            return

        session_length = random.randint(*self.profile.session_length)

        # MINIMUM SESSION: Even unmotivated users do at least 3 questions
        # (they opened the app, they'll do something)
        min_session = 3
        session_length = max(min_session, session_length)

        session_xp = 0
        session_correct = 0
        session_questions_done = 0  # Actual questions answered (not affected by breaks)
        breaks_taken = 0
        topic_switches = 0
        difficulties_used = []
        ai_questions_generated = 0

        adapter.start_session(self.user_id, topics)

        # BALANCED TOPIC SELECTION: Start with least practiced topic
        # This prevents always starting with the same topic
        stats = adapter.get_user_stats(self.user_id)
        mastery_dict = stats.get("mastery", {})

        # Sort topics by mastery (lowest first) to balance practice
        topics_by_priority = sorted(
            topics,
            key=lambda t: mastery_dict.get(t, 0)
        )
        current_topic_idx = topics.index(topics_by_priority[0]) if topics_by_priority else 0

        # Track questions per topic this session for balanced rotation
        questions_on_current_topic = 0
        # Max consecutive questions before forced rotation (3-5 based on discipline)
        max_consecutive = 3 + int(self.profile.discipline * 2)
        # Track which topics we've practiced this session
        topics_practiced_this_session = {t: 0 for t in topics}

        for q in range(session_length):
            topic = topics[current_topic_idx % len(topics)]

            # Get REAL mastery from learning engine (not local tracking)
            stats = adapter.get_user_stats(self.user_id)
            mastery_dict = stats.get("mastery", {})
            # Learning engine returns mastery as 0-100 (percent), keep as-is
            mastery_percent = mastery_dict.get(topic, 0)

            # Get question params (includes ALL learning engine recommendations)
            params = adapter.get_next_question(self.user_id, topic, mastery_percent)

            difficulty = params.get("difficulty", 2)
            difficulties_used.append(difficulty)
            cognitive_load = params.get("cognitive_load", "normal")
            interleave_suggested = params.get("interleave_suggested", False)
            should_break = params.get("should_take_break", False)

            # === BALANCED TOPIC ROTATION ===
            # Force topic switch after max consecutive questions on same topic
            # This prevents spending entire session on one topic (unrealistic)
            questions_on_current_topic += 1
            topics_practiced_this_session[topic] = topics_practiced_this_session.get(topic, 0) + 1

            should_rotate = False

            # 1. Engine suggests interleaving
            if interleave_suggested and random.random() < 0.7 * self.profile.discipline:
                should_rotate = True

            # 2. Forced rotation after max consecutive (realistic behavior)
            elif questions_on_current_topic >= max_consecutive:
                # Pick next topic with lowest practice count this session
                other_topics = [t for t in topics if t != topic]
                if other_topics:
                    next_topic = min(other_topics, key=lambda t: topics_practiced_this_session.get(t, 0))
                    current_topic_idx = topics.index(next_topic)
                    should_rotate = True

            # 3. Natural variety seeking (10% chance to switch after 2+ questions)
            elif questions_on_current_topic >= 2 and random.random() < 0.10:
                should_rotate = True

            if should_rotate:
                if not (questions_on_current_topic >= max_consecutive):
                    # Normal rotation: next in sequence
                    current_topic_idx = (current_topic_idx + 1) % len(topics)
                topic = topics[current_topic_idx]
                topic_switches += 1
                questions_on_current_topic = 0  # Reset counter
                # Re-fetch mastery for new topic
                mastery_percent = mastery_dict.get(topic, 0)

            # === TRANSFER LEARNING ===
            # Get bonus from related topics already mastered
            transfer_bonus = self._get_transfer_bonus(topic, mastery_dict)
            # Apply transfer bonus to effective mastery (capped at 100)
            effective_mastery = min(100, mastery_percent + transfer_bonus)

            # Convert 0-100 to 0-1 for answer methods
            mastery_normalized = effective_mastery / 100

            # === AI MODE: Generate real questions ===
            question_data = None
            if self._use_ai:
                question_data = adapter.generate_ai_question(topic, difficulty, mastery_percent)
                if question_data.get("success"):
                    ai_questions_generated += 1
                    self._ai_questions_generated += 1
                else:
                    self._ai_questions_failed += 1
                answer = self._answer_ai_question(
                    question_data, topic, difficulty, mastery_normalized,
                    hour=hour, session_length=session_length
                )
            else:
                # Standard mode: probabilistic answer without real question
                answer = self._answer_question(
                    topic, difficulty, mastery_normalized,
                    hour=hour, session_length=session_length
                )

            # === TUTORING MODE: Interact with Socratic Tutor if wrong ===
            if self._use_tutor and not answer["is_correct"]:
                # Create minimal question_data if not in AI mode
                if question_data is None:
                    question_data = {
                        "id": f"q_{q}_{topic}",
                        "question_text": f"Question sur {topic}",
                        "options": ["A", "B", "C", "D"],
                        "correct_answer": "B",
                        "topic": topic,
                        "explanation": f"Explication pour {topic}",
                    }

                # Interact with tutor - may correct the answer
                answer = self._interact_with_tutor(
                    adapter, question_data, answer,
                    topic, difficulty, mastery_normalized,
                    hour, session_length
                )

            # Submit answer to learning engine
            result = adapter.submit_answer(
                self.user_id, topic,
                answer["is_correct"],
                answer["response_time"],
                difficulty
            )

            xp = result.get("xp_earned", 0)
            session_xp += xp
            session_questions_done += 1  # Track actual questions answered
            if answer["is_correct"]:
                session_correct += 1

            # Track topic practiced (for mastery decay reset)
            if topic not in self._topics_practiced_today:
                self._topics_practiced_today.append(topic)
                self._days_since_practice[topic] = 0  # Reset decay counter

            # MINIMUM QUESTIONS before allowing early quit
            # Use actual questions answered (not affected by break fatigue reset)
            actual_questions = session_questions_done
            min_before_quit = max(5, int(session_length * 0.3))  # At least 30% or 5 questions

            # React to break suggestion (but don't skip question - just reduce fatigue)
            if result.get("should_take_break") or should_break:
                # Disciplined users take breaks, others might push through
                if random.random() < self.profile.discipline:
                    breaks_taken += 1
                    # Short break resets some fatigue (but question was already answered)
                    self._session_questions = max(0, self._session_questions - 3)
                    # DON'T continue - the question was answered, just reset fatigue
                elif actual_questions >= min_before_quit and random.random() < 0.25:
                    # Some users quit when tired (but only after minimum)
                    break

            # Frustrated user might quit (but only after minimum commitment)
            if self.is_frustrated and actual_questions >= min_before_quit and random.random() < 0.20:
                break

            # High cognitive load? Might stop early (but only after minimum)
            if cognitive_load == "high" and actual_questions >= min_before_quit and random.random() < 0.15:
                break

        # Update log (use session_questions_done for accurate count)
        log.questions_answered += session_questions_done
        log.questions_correct += session_correct
        log.xp_earned += session_xp
        self._total_xp += session_xp

        accuracy = session_correct / session_questions_done if session_questions_done > 0 else 0
        avg_difficulty = sum(difficulties_used) / len(difficulties_used) if difficulties_used else 2

        event_details = {
            "questions": session_questions_done,
            "correct": session_correct,
            "accuracy": round(accuracy * 100, 1),
            "xp": session_xp,
            "avg_difficulty": round(avg_difficulty, 1),
            "topic_switches": topic_switches,
            "breaks_taken": breaks_taken,
        }

        # Add AI stats if in AI mode
        if self._use_ai:
            event_details["ai_questions"] = ai_questions_generated

        action_str = f"Session: {session_questions_done}q, {session_correct} correct, {session_xp} XP"
        if self._use_ai:
            action_str += f" [AI: {ai_questions_generated}q]"

        log.events.append(Event(
            time=self._random_time(self.profile.active_hours[0] + 1, self.profile.active_hours[1] - 2),
            category="learning",
            action=action_str,
            details=event_details,
            success=not self.is_frustrated
        ))

    # =========================================================================
    # TASKS BEHAVIOR
    # =========================================================================

    def _create_tasks(self, adapter: 'UniversalAdapter', log: DayLog, date: str):
        """Create tasks for the day"""
        num_tasks = random.randint(*self.profile.tasks_per_day)
        if num_tasks == 0:
            return

        # Maybe create a project
        project_id = None
        if random.random() < self.profile.project_creation_rate / 7:
            name = f"Project {date[:10]} {uuid.uuid4().hex[:4]}"
            result = adapter.post('/api/tasks-db/projects', {
                'name': name,
                'color': random.choice(['#6366f1', '#ef4444', '#22c55e', '#f59e0b']),
                'icon': random.choice(['📋', '🚀', '💼', '🎯', '📚'])
            })
            project_id = result.get("id")
            if project_id:
                self._projects.append(project_id)
                log.events.append(Event(
                    time=self._random_time(self.profile.active_hours[0], 10),
                    category="tasks",
                    action=f"Created project: {name}",
                    details={"project_id": project_id}
                ))

        # Create tasks
        for i in range(num_tasks):
            task_uid = uuid.uuid4().hex[:12]
            title = f"Task {i+1} - {date[:10]}"
            result = adapter.post('/api/tasks-db/tasks', {
                'id': f"task-{task_uid}",
                'title': title,
                'project_id': project_id,
                'priority': random.choice(['high', 'medium', 'low']),
                'effort': random.choice(['S', 'M', 'L'])
            })
            task_id = result.get("id")
            if task_id:
                self._tasks.append(task_id)
                self._pending_tasks.append(task_id)
                log.tasks_created += 1
                log.events.append(Event(
                    time=self._random_time(self.profile.active_hours[0], 12),
                    category="tasks",
                    action=f"Created: {title}",
                    details={"task_id": task_id}
                ))

    def _work_on_tasks(self, adapter: 'UniversalAdapter', log: DayLog):
        """Work on tasks with pomodoros"""
        if not self._pending_tasks:
            return

        # Pomodoro sessions
        num_pomodoros = random.randint(*self.profile.pomodoro_sessions)

        for _ in range(num_pomodoros):
            if not self._pending_tasks:
                break

            task_id = random.choice(self._pending_tasks)
            pomo_id = f"pomo-{uuid.uuid4().hex[:12]}"

            adapter.post('/api/tasks-db/pomodoro', {
                'id': pomo_id,
                'task_id': task_id,
                'duration': 25,
                'session_type': 'focus'
            })

            completed = random.random() < self.profile.pomodoro_completion_rate

            log.events.append(Event(
                time=self._random_time(10, 18),
                category="tasks",
                action=f"Pomodoro {'completed' if completed else 'interrupted'}",
                details={"task_id": task_id, "duration": 25 if completed else random.randint(5, 20)},
                success=completed
            ))

            if completed:
                log.pomodoros += 1

        # Complete tasks - use set for O(1) removal instead of O(n) list.remove()
        to_complete = {t for t in self._pending_tasks if random.random() < self.profile.task_completion_rate}
        completed_tasks = []

        for task_id in to_complete:
            result = adapter.post(f'/api/tasks-db/tasks/{task_id}/toggle')
            if result.get("success") or result.get("completed"):
                completed_tasks.append(task_id)
                log.tasks_completed += 1
                log.events.append(Event(
                    time=self._random_time(14, 20),
                    category="tasks",
                    action="Completed task",
                    details={"task_id": task_id}
                ))

        # Remove completed tasks from pending (O(n) instead of O(n²))
        self._pending_tasks = [t for t in self._pending_tasks if t not in to_complete]

    # =========================================================================
    # HEALTH BEHAVIOR
    # =========================================================================

    def _morning_routine(self, adapter: 'UniversalAdapter', log: DayLog, date: str):
        """Morning health activities"""
        if not self.profile.morning_routine:
            return

        # Weight
        if self.profile.logs_weight and random.random() < self.profile.weight_frequency:
            self._weight += random.gauss(0, 0.3)
            result = adapter.post('/api/health/weight', {
                'date': date,
                'weight': round(self._weight, 1),
                'source': 'simulation'
            })
            log.weight_logged = True
            log.events.append(Event(
                time=self._time(self.profile.active_hours[0], random.randint(0, 30)),
                category="health",
                action=f"Weight: {self._weight:.1f} kg",
                details={"weight": round(self._weight, 1)},
                success=bool(result.get("success") or result.get("id"))
            ))

        # Morning water
        ml = random.choice([250, 300, 500])
        adapter.post('/api/health/hydration', {'amount_ml': ml})
        log.water_ml += ml
        log.events.append(Event(
            time=self._time(self.profile.active_hours[0], random.randint(15, 45)),
            category="health",
            action=f"Water: {ml}ml"
        ))

    def _eat_meals(self, adapter: 'UniversalAdapter', log: DayLog, date: str):
        """Log meals"""
        num_meals = random.randint(*self.profile.meals_per_day)

        meals = ['breakfast', 'lunch', 'dinner', 'snack']
        times = {'breakfast': (7, 9), 'lunch': (12, 14), 'dinner': (19, 21), 'snack': (15, 17)}

        foods = [
            {'food_name': 'Oeufs', 'calories': 180, 'protein': 12, 'grams': 100},
            {'food_name': 'Pain', 'calories': 120, 'protein': 4, 'grams': 50},
            {'food_name': 'Salade', 'calories': 80, 'protein': 3, 'grams': 150},
            {'food_name': 'Poulet', 'calories': 250, 'protein': 30, 'grams': 150},
            {'food_name': 'Riz', 'calories': 200, 'protein': 4, 'grams': 150},
            {'food_name': 'Poisson', 'calories': 220, 'protein': 28, 'grams': 150},
            {'food_name': 'Légumes', 'calories': 100, 'protein': 5, 'grams': 200},
            {'food_name': 'Fruits', 'calories': 80, 'protein': 1, 'grams': 150},
        ]

        for meal in random.sample(meals[:num_meals], min(num_meals, len(meals))):
            meal_foods = random.sample(foods, random.randint(1, 3))
            start, end = times.get(meal, (12, 14))

            adapter.post('/api/health/meals', {
                'date': date,
                'meal_type': meal,
                'foods': meal_foods
            })

            log.meals_logged += 1
            cals = sum(f['calories'] for f in meal_foods)
            log.events.append(Event(
                time=self._random_time(start, end),
                category="health",
                action=f"{meal.capitalize()}: {cals} kcal",
                details={"meal_type": meal, "calories": cals}
            ))

    def _drink_water(self, adapter: 'UniversalAdapter', log: DayLog):
        """Hydration throughout the day"""
        num = random.randint(*self.profile.hydration_entries)

        for _ in range(num):
            ml = random.choice([200, 250, 300, 500])
            adapter.post('/api/health/hydration', {'amount_ml': ml})
            log.water_ml += ml
            log.events.append(Event(
                time=self._random_time(self.profile.active_hours[0] + 2, self.profile.active_hours[1] - 1),
                category="health",
                action=f"Water: {ml}ml"
            ))

    # =========================================================================
    # MAIN SIMULATION METHODS
    # =========================================================================

    def live_day(
        self,
        adapter: 'UniversalAdapter',
        day: int = 1,
        date: str = None,
        topics: List[str] = None,
        modules: List[str] = None
    ) -> DayLog:
        """
        Simulate a complete day for this user.

        Args:
            adapter: The adapter to use
            day: Day number
            date: Date string (YYYY-MM-DD)
            topics: Learning topics
            modules: Which modules to simulate ["learning", "tasks", "health"]
                     Default: all modules

        Returns a DayLog with all events.
        """
        date = date or datetime.now().strftime('%Y-%m-%d')
        topics = topics or ["conjugaison", "grammaire", "vocabulaire", "orthographe"]
        modules = modules or ["learning", "tasks", "health"]

        log = DayLog(day=day, date=date)

        # === NEW: Roll life events ===
        self._roll_life_events(day)

        # Roll daily mood FIRST (affects skip probability)
        self._roll_daily_mood()

        # === NEW: Life event affects skip probability ===
        # Vacation = likely skip, illness = maybe skip
        if self._upcoming_event == "vacation" and random.random() < 0.7:
            log.skipped = True
            log.events.append(Event(time="--:--", category="system", action="On vacation"))
            self._update_inter_session_memory([], date)  # No practice
            if len(self._days) >= self._max_days_history:
                self._days = self._days[-(self._max_days_history - 1):]
            self._days.append(log)
            return log

        # Skip day?
        if self._should_skip_day():
            log.skipped = True
            reason = "Bad day" if self._daily_motivation < 0.8 else "Skipped"
            log.events.append(Event(
                time="--:--",
                category="system",
                action=reason
            ))
            # Update systems even on skipped days
            self._update_skill_progression(day, 0, 0)  # No practice = slight decay
            self._update_inter_session_memory([], date)  # No practice
            if len(self._days) >= self._max_days_history:
                self._days = self._days[-(self._max_days_history - 1):]
            self._days.append(log)
            return log

        # Reset for new day
        self._reset_session()
        self._topics_practiced_today = []  # Reset daily practice tracker
        self._took_break_today = False

        # === NEW: Roll micro-behaviors for the day ===
        learning_hour = random.randint(self.profile.active_hours[0] + 1, self.profile.active_hours[1] - 3)
        self._roll_micro_behaviors(learning_hour)

        # === MASTERY DECAY (Ebbinghaus forgetting curve) ===
        # Apply decay to topics not practiced yesterday
        if "learning" in modules and day > 1:
            stats = adapter.get_user_stats(self.user_id)
            current_mastery = stats.get("mastery", {})

            for topic, mastery in current_mastery.items():
                days_since = self._days_since_practice.get(topic, 1)

                if days_since > 0 and mastery > 0:
                    decayed = self._apply_mastery_decay(
                        mastery,
                        days_since,
                        self.profile.skill_level
                    )
                    decay_amount = mastery - decayed

                    if decay_amount >= 1:  # Only log significant decay
                        # Note: We track decay but the actual mastery is in the engine
                        # The engine's FSRS handles this via retrievability
                        log.events.append(Event(
                            time=self._time(self.profile.active_hours[0], 0),
                            category="learning",
                            action=f"Memory decay: {topic} -{decay_amount:.0f}% (no practice for {days_since}d)",
                            details={"topic": topic, "decay": decay_amount, "days_since": days_since}
                        ))

                # Increment days since practice (will be reset if practiced today)
                self._days_since_practice[topic] = days_since + 1

        # Log mood for human profile
        if self._is_human:
            mood_desc = {
                UserMood.TIRED: "Tired day",
                UserMood.MOTIVATED: "Great day!",
                UserMood.FRESH: "Normal day",
            }.get(self._mood, "Normal day")
            log.events.append(Event(
                time=self._time(self.profile.active_hours[0], 0),
                category="system",
                action=f"{mood_desc} (motivation: {self._daily_motivation:.0%})"
            ))

        # === MORNING (health only) ===
        if "health" in modules:
            self._morning_routine(adapter, log, date)

        # === TASKS PLANNING ===
        if "tasks" in modules:
            self._create_tasks(adapter, log, date)

        # === LEARNING ===
        if "learning" in modules:
            # Morning/afternoon learning session
            # Random hour within active hours for realistic time-of-day effects
            learning_hour = random.randint(self.profile.active_hours[0] + 1, self.profile.active_hours[1] - 3)
            self._learn(adapter, log, topics, hour=learning_hour)

        # === MEALS ===
        if "health" in modules:
            self._eat_meals(adapter, log, date)

        # === HYDRATION ===
        if "health" in modules:
            self._drink_water(adapter, log)

        # === WORK ON TASKS ===
        if "tasks" in modules:
            self._work_on_tasks(adapter, log)

        # === EVENING LEARNING ===
        if "learning" in modules and self.profile.evening_review and random.random() > 0.3:
            self._reset_session()
            # Evening hour - typically lower performance due to circadian rhythm
            evening_hour = self.profile.active_hours[1] - 1
            self._learn(adapter, log, topics[:2], hour=evening_hour)
            log.events.append(Event(
                time=self._time(evening_hour, random.randint(0, 30)),
                category="learning",
                action="Evening review completed"
            ))

        # Sort events
        log.events.sort(key=lambda e: e.time if e.time != "--:--" else "99:99")

        # === UPDATE SKILL PROGRESSION ===
        # Skill improves based on practice today
        if "learning" in modules:
            accuracy_today = log.questions_correct / log.questions_answered if log.questions_answered > 0 else 0
            self._update_skill_progression(day, log.questions_answered, accuracy_today)

        # === UPDATE INTER-SESSION MEMORY ===
        # Track what topics were practiced today for spaced repetition effects
        self._update_inter_session_memory(self._topics_practiced_today, date)

        # Trim first, then append to never exceed max
        if len(self._days) >= self._max_days_history:
            self._days = self._days[-(self._max_days_history - 1):]
        self._days.append(log)

        return log

    def live_week(
        self,
        adapter: 'UniversalAdapter',
        days: int = 7,
        topics: List[str] = None,
        modules: List[str] = None,
        verbose: bool = True
    ) -> Dict:
        """
        Simulate multiple days.

        Args:
            adapter: The adapter to use
            days: Number of days to simulate
            topics: Learning topics
            modules: Which modules to simulate ["learning", "tasks", "health"]
            verbose: Print progress

        Returns comprehensive statistics.
        """
        # Use default topics only if None, not if empty list
        if topics is None:
            topics = ["conjugaison", "grammaire", "vocabulaire", "orthographe"]
        modules = modules or ["learning", "tasks", "health"]
        base_date = datetime.now()

        for day in range(1, days + 1):
            date = (base_date + timedelta(days=day - 1)).strftime('%Y-%m-%d')
            log = self.live_day(adapter, day, date, topics, modules)

            if verbose:
                if log.skipped:
                    print(f"  Day {day}: SKIPPED")
                else:
                    parts = []
                    if "tasks" in modules:
                        parts.append(f"{log.tasks_completed}/{log.tasks_created} tasks")
                    if "learning" in modules:
                        parts.append(f"{log.questions_answered}q/{log.xp_earned}xp")
                    if "health" in modules:
                        parts.append(f"{log.water_ml}ml water")
                    print(f"  Day {day}: {', '.join(parts)}")

        return self.get_stats(adapter)

    def get_stats(self, adapter: 'UniversalAdapter' = None) -> Dict:
        """
        Get comprehensive statistics for this user.

        Args:
            adapter: If provided, fetches REAL mastery from learning engine.
                     Otherwise returns empty mastery dict.
        """
        days_active = sum(1 for d in self._days if not d.skipped)
        num_days = len(self._days)

        total_tasks_created = sum(d.tasks_created for d in self._days)
        total_tasks_completed = sum(d.tasks_completed for d in self._days)
        total_pomodoros = sum(d.pomodoros for d in self._days)
        total_questions = sum(d.questions_answered for d in self._days)
        total_correct = sum(d.questions_correct for d in self._days)
        total_xp = sum(d.xp_earned for d in self._days)
        total_meals = sum(d.meals_logged for d in self._days)
        total_water = sum(d.water_ml for d in self._days)
        weight_days = sum(1 for d in self._days if d.weight_logged)

        # Get REAL mastery from learning engine
        mastery = {}
        if adapter:
            engine_stats = adapter.get_user_stats(self.user_id)
            mastery = engine_stats.get("mastery", {})

        stats = {
            "user_id": self.user_id,
            "profile": self.profile.name,
            "days_simulated": num_days,
            "days_active": days_active,
            "attendance_rate": days_active / num_days if num_days > 0 else 0,

            # Tasks
            "tasks_created": total_tasks_created,
            "tasks_completed": total_tasks_completed,
            "task_completion_rate": total_tasks_completed / total_tasks_created if total_tasks_created > 0 else 0,
            "pomodoros": total_pomodoros,

            # Learning
            "questions": total_questions,
            "correct": total_correct,
            "accuracy": total_correct / total_questions if total_questions > 0 else 0,
            "xp": total_xp,
            "mastery": mastery,

            # Health
            "meals": total_meals,
            "water_ml": total_water,
            "avg_water_per_day": total_water / days_active if days_active > 0 else 0,
            "weight_logged_days": weight_days,

            # State
            "current_mood": self._mood.value,
            "current_weight": round(self._weight, 1),
            "streak": self._streak,
        }

        # Add AI mode stats if enabled
        if self._use_ai:
            stats["ai_mode"] = True
            stats["ai_questions_generated"] = self._ai_questions_generated
            stats["ai_questions_failed"] = self._ai_questions_failed
            stats["ai_success_rate"] = (
                self._ai_questions_generated / (self._ai_questions_generated + self._ai_questions_failed)
                if (self._ai_questions_generated + self._ai_questions_failed) > 0 else 0
            )

        # Add tutoring stats if enabled
        if self._use_tutor:
            stats["tutor_mode"] = True
            stats["tutor_interactions"] = self._tutor_interactions
            stats["tutor_hints_received"] = self._tutor_hints_received
            stats["tutor_guidance_received"] = self._tutor_guidance_received
            stats["tutor_reveals"] = self._tutor_reveals
            stats["tutor_helped_correct"] = self._tutor_helped_correct
            stats["tutor_help_rate"] = (
                self._tutor_helped_correct / self._tutor_interactions
                if self._tutor_interactions > 0 else 0
            )

        return stats

    def cleanup(self, adapter: 'UniversalAdapter') -> List[str]:
        """
        Clean up all created resources.

        Returns:
            List of error messages (empty if all cleanups succeeded)
        """
        errors = []

        for task_id in self._tasks:
            try:
                adapter.delete(f'/api/tasks-db/tasks/{task_id}')
            except Exception as e:
                errors.append(f"Failed to delete task {task_id}: {e}")

        for project_id in self._projects:
            try:
                adapter.delete(f'/api/tasks-db/projects/{project_id}')
            except Exception as e:
                errors.append(f"Failed to delete project {project_id}: {e}")

        self._tasks.clear()
        self._projects.clear()
        self._pending_tasks.clear()

        return errors


def _progress_bar(value: float, width: int = 20) -> str:
    """Create a progress bar string (value should be 0-1)"""
    value = max(0, min(1, value))  # Clamp to 0-1
    filled = int(value * width)
    empty = width - filled
    return "█" * filled + "░" * empty


def print_user_report(stats: Dict, modules: List[str] = None):
    """Print formatted report for an autonomous user"""
    modules = modules or ["learning", "tasks", "health"]

    ai_mode = stats.get("ai_mode", False)
    ai_str = " [AI MODE]" if ai_mode else ""

    print("\n" + "=" * 60)
    print(f"USER SIMULATION REPORT - {stats['profile'].upper()}{ai_str}")
    print(f"User ID: {stats['user_id']}")
    print("=" * 60)

    # Activity (always shown)
    print(f"\n ACTIVITY:")
    print(f"   Days: {stats['days_active']}/{stats['days_simulated']} ({stats['attendance_rate']*100:.0f}% attendance)")
    print(f"   Mood: {stats['current_mood']}")

    # Tasks
    if "tasks" in modules and stats['tasks_created'] > 0:
        print(f"\n TASKS:")
        print(f"   Created: {stats['tasks_created']}")
        print(f"   Completed: {stats['tasks_completed']} ({stats['task_completion_rate']*100:.0f}%)")
        print(f"   Pomodoros: {stats['pomodoros']}")

    # Learning
    if "learning" in modules and stats['questions'] > 0:
        print(f"\n LEARNING:")
        print(f"   Questions: {stats['questions']} ({stats['correct']} correct, {stats['accuracy']*100:.0f}%)")
        print(f"   XP: {stats['xp']}")
        print(f"   Streak: {stats['streak']} correct answers")
        if stats['mastery']:
            print(f"\n   Mastery by topic:")
            for topic, mastery in stats['mastery'].items():
                # Learning engine returns mastery as 0-100 (percent)
                mastery_normalized = mastery / 100 if mastery > 1 else mastery
                bar = _progress_bar(mastery_normalized)
                print(f"     {topic:12} [{bar}] {mastery_normalized*100:5.1f}%")

    # AI Mode Stats
    if ai_mode:
        print(f"\n AI INTEGRATION:")
        print(f"   Questions generated: {stats.get('ai_questions_generated', 0)}")
        print(f"   Generation failures: {stats.get('ai_questions_failed', 0)}")
        print(f"   AI success rate: {stats.get('ai_success_rate', 0)*100:.0f}%")

    # Health
    if "health" in modules and (stats['meals'] > 0 or stats['water_ml'] > 0):
        print(f"\n HEALTH:")
        print(f"   Meals: {stats['meals']}")
        print(f"   Water: {stats['water_ml']}ml ({stats['avg_water_per_day']:.0f}ml/day)")
        print(f"   Weight logged: {stats['weight_logged_days']} days")

    print("\n" + "=" * 60)
