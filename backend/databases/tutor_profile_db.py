"""
Tutor Profile Database - Persistence des profils adaptatifs.

Le tuteur apprend à connaître chaque utilisateur avec le temps.
Ce module persiste toutes les données d'adaptation.

Tables:
- tutor_profiles: Profil principal (style, préférences)
- tutor_time_patterns: Performance par heure (0-23)
- tutor_weekly_patterns: Performance par jour de semaine (0-6)
- tutor_topic_mastery: Maîtrise par topic
- tutor_hint_effectiveness: Efficacité des niveaux d'indices
- tutor_interactions: Historique des interactions (rolling window)
"""

import sqlite3
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).parent.parent / "data" / "tutor_profiles.db"


def get_connection():
    """Get database connection with row factory."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize all tables."""
    conn = get_connection()
    cursor = conn.cursor()

    # Profil principal
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tutor_profiles (
            user_id TEXT PRIMARY KEY,

            -- Style d'apprentissage (0-1)
            prefers_examples REAL DEFAULT 0.5,
            prefers_visual REAL DEFAULT 0.5,
            prefers_step_by_step REAL DEFAULT 0.5,
            needs_encouragement REAL DEFAULT 0.5,
            optimal_hint_level REAL DEFAULT 2.0,

            -- Seuils personnalisés
            fatigue_threshold INTEGER DEFAULT 25,
            frustration_sensitivity REAL DEFAULT 0.5,

            -- Stats globales
            total_interactions INTEGER DEFAULT 0,
            total_correct INTEGER DEFAULT 0,
            total_hints_used INTEGER DEFAULT 0,
            avg_response_time REAL DEFAULT 10.0,

            -- Timestamps
            created_at TEXT,
            updated_at TEXT,
            last_session_at TEXT
        )
    """)

    # Patterns temporels par heure
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tutor_time_patterns (
            user_id TEXT,
            hour INTEGER,  -- 0-23
            accuracy REAL DEFAULT 0.5,
            avg_response_time REAL DEFAULT 10.0,
            samples INTEGER DEFAULT 0,
            PRIMARY KEY (user_id, hour)
        )
    """)

    # Patterns par jour de semaine
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tutor_weekly_patterns (
            user_id TEXT,
            day_of_week INTEGER,  -- 0=Monday, 6=Sunday
            accuracy REAL DEFAULT 0.5,
            avg_response_time REAL DEFAULT 10.0,
            samples INTEGER DEFAULT 0,
            best_hour INTEGER DEFAULT 10,
            PRIMARY KEY (user_id, day_of_week)
        )
    """)

    # Maîtrise par topic
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tutor_topic_mastery (
            user_id TEXT,
            topic TEXT,
            mastery REAL DEFAULT 0.5,  -- 0-1
            total_attempts INTEGER DEFAULT 0,
            correct_attempts INTEGER DEFAULT 0,
            last_practiced TEXT,
            streak INTEGER DEFAULT 0,
            PRIMARY KEY (user_id, topic)
        )
    """)

    # Efficacité des hints
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tutor_hint_effectiveness (
            user_id TEXT,
            hint_level INTEGER,  -- 1, 2, 3
            times_used INTEGER DEFAULT 0,
            times_led_to_correct INTEGER DEFAULT 0,
            effectiveness REAL DEFAULT 0.5,
            PRIMARY KEY (user_id, hint_level)
        )
    """)

    # Historique des interactions (rolling window de 500)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tutor_interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            timestamp TEXT,
            hour INTEGER,
            day_of_week INTEGER,
            topic TEXT,
            is_correct INTEGER,
            response_time REAL,
            hint_level_used INTEGER DEFAULT 0
        )
    """)

    # Index séparé pour les requêtes par utilisateur
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_tutor_interactions_user_time
        ON tutor_interactions (user_id, timestamp)
    """)

    # Patterns d'erreurs détectés
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tutor_error_patterns (
            user_id TEXT,
            pattern_type TEXT,  -- haste, fatigue, confusion, gap
            frequency INTEGER DEFAULT 0,
            last_seen TEXT,
            topics_affected TEXT,  -- JSON array
            PRIMARY KEY (user_id, pattern_type)
        )
    """)

    conn.commit()
    conn.close()
    logger.info("✅ Tutor profiles database initialized")


# ============================================================================
# PROFILE CRUD
# ============================================================================

def get_or_create_profile(user_id: str) -> Dict:
    """Get or create a user's adaptive profile."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM tutor_profiles WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()

    if row:
        profile = dict(row)
    else:
        now = datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO tutor_profiles (user_id, created_at, updated_at, last_session_at)
            VALUES (?, ?, ?, ?)
        """, (user_id, now, now, now))
        conn.commit()
        profile = {
            "user_id": user_id,
            "prefers_examples": 0.5,
            "prefers_visual": 0.5,
            "prefers_step_by_step": 0.5,
            "needs_encouragement": 0.5,
            "optimal_hint_level": 2.0,
            "fatigue_threshold": 25,
            "frustration_sensitivity": 0.5,
            "total_interactions": 0,
            "total_correct": 0,
            "total_hints_used": 0,
            "avg_response_time": 10.0,
            "created_at": now,
            "updated_at": now,
            "last_session_at": now,
        }

    conn.close()
    return profile


def update_profile(user_id: str, updates: Dict):
    """Update profile fields."""
    conn = get_connection()
    cursor = conn.cursor()

    updates["updated_at"] = datetime.now().isoformat()

    set_clause = ", ".join(f"{k} = ?" for k in updates.keys())
    values = list(updates.values()) + [user_id]

    cursor.execute(f"""
        UPDATE tutor_profiles
        SET {set_clause}
        WHERE user_id = ?
    """, values)

    conn.commit()
    conn.close()


# ============================================================================
# TIME PATTERNS
# ============================================================================

def get_time_patterns(user_id: str) -> Dict[int, Dict]:
    """Get all time patterns for a user."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT hour, accuracy, avg_response_time, samples
        FROM tutor_time_patterns
        WHERE user_id = ?
    """, (user_id,))

    patterns = {}
    for row in cursor.fetchall():
        patterns[row["hour"]] = {
            "accuracy": row["accuracy"],
            "response_time": row["avg_response_time"],
            "samples": row["samples"],
        }

    conn.close()
    return patterns


def update_time_pattern(user_id: str, hour: int, is_correct: bool, response_time: float):
    """Update time pattern for an hour."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT accuracy, avg_response_time, samples
        FROM tutor_time_patterns
        WHERE user_id = ? AND hour = ?
    """, (user_id, hour))

    row = cursor.fetchone()

    if row:
        n = row["samples"]
        new_accuracy = (row["accuracy"] * n + (1 if is_correct else 0)) / (n + 1)
        new_rt = (row["avg_response_time"] * n + response_time) / (n + 1)
        cursor.execute("""
            UPDATE tutor_time_patterns
            SET accuracy = ?, avg_response_time = ?, samples = ?
            WHERE user_id = ? AND hour = ?
        """, (new_accuracy, new_rt, n + 1, user_id, hour))
    else:
        cursor.execute("""
            INSERT INTO tutor_time_patterns (user_id, hour, accuracy, avg_response_time, samples)
            VALUES (?, ?, ?, ?, 1)
        """, (user_id, hour, 1.0 if is_correct else 0.0, response_time))

    conn.commit()
    conn.close()


def get_optimal_hours(user_id: str, top_n: int = 3) -> List[int]:
    """Get the best performing hours for a user."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT hour, accuracy
        FROM tutor_time_patterns
        WHERE user_id = ? AND samples >= 3
        ORDER BY accuracy DESC
        LIMIT ?
    """, (user_id, top_n))

    hours = [row["hour"] for row in cursor.fetchall()]
    conn.close()

    return hours if hours else [9, 10, 11]  # Default morning hours


# ============================================================================
# WEEKLY PATTERNS
# ============================================================================

def update_weekly_pattern(user_id: str, day_of_week: int, hour: int, is_correct: bool, response_time: float):
    """Update weekly pattern."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT accuracy, avg_response_time, samples
        FROM tutor_weekly_patterns
        WHERE user_id = ? AND day_of_week = ?
    """, (user_id, day_of_week))

    row = cursor.fetchone()

    if row:
        n = row["samples"]
        new_accuracy = (row["accuracy"] * n + (1 if is_correct else 0)) / (n + 1)
        new_rt = (row["avg_response_time"] * n + response_time) / (n + 1)
        cursor.execute("""
            UPDATE tutor_weekly_patterns
            SET accuracy = ?, avg_response_time = ?, samples = ?, best_hour = ?
            WHERE user_id = ? AND day_of_week = ?
        """, (new_accuracy, new_rt, n + 1, hour, user_id, day_of_week))
    else:
        cursor.execute("""
            INSERT INTO tutor_weekly_patterns (user_id, day_of_week, accuracy, avg_response_time, samples, best_hour)
            VALUES (?, ?, ?, ?, 1, ?)
        """, (user_id, day_of_week, 1.0 if is_correct else 0.0, response_time, hour))

    conn.commit()
    conn.close()


def get_weekly_patterns(user_id: str) -> Dict[int, Dict]:
    """Get all weekly patterns."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT day_of_week, accuracy, avg_response_time, samples, best_hour
        FROM tutor_weekly_patterns
        WHERE user_id = ?
    """, (user_id,))

    patterns = {}
    for row in cursor.fetchall():
        patterns[row["day_of_week"]] = {
            "accuracy": row["accuracy"],
            "response_time": row["avg_response_time"],
            "samples": row["samples"],
            "best_hour": row["best_hour"],
        }

    conn.close()
    return patterns


# ============================================================================
# TOPIC MASTERY
# ============================================================================

def update_topic_mastery(user_id: str, topic: str, is_correct: bool):
    """Update mastery for a topic."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT mastery, total_attempts, correct_attempts, streak
        FROM tutor_topic_mastery
        WHERE user_id = ? AND topic = ?
    """, (user_id, topic))

    row = cursor.fetchone()
    now = datetime.now().isoformat()

    if row:
        total = row["total_attempts"] + 1
        correct = row["correct_attempts"] + (1 if is_correct else 0)
        # Mastery avec decay
        old_mastery = row["mastery"]
        new_mastery = old_mastery * 0.9 + (1 if is_correct else 0) * 0.1
        streak = row["streak"] + 1 if is_correct else 0

        cursor.execute("""
            UPDATE tutor_topic_mastery
            SET mastery = ?, total_attempts = ?, correct_attempts = ?,
                last_practiced = ?, streak = ?
            WHERE user_id = ? AND topic = ?
        """, (new_mastery, total, correct, now, streak, user_id, topic))
    else:
        cursor.execute("""
            INSERT INTO tutor_topic_mastery
            (user_id, topic, mastery, total_attempts, correct_attempts, last_practiced, streak)
            VALUES (?, ?, ?, 1, ?, ?, ?)
        """, (user_id, topic, 1.0 if is_correct else 0.0, 1 if is_correct else 0, now, 1 if is_correct else 0))

    conn.commit()
    conn.close()


def get_topic_mastery(user_id: str) -> Dict[str, Dict]:
    """Get all topic mastery data."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT topic, mastery, total_attempts, correct_attempts, last_practiced, streak
        FROM tutor_topic_mastery
        WHERE user_id = ?
    """, (user_id,))

    mastery = {}
    for row in cursor.fetchall():
        mastery[row["topic"]] = {
            "mastery": row["mastery"],
            "total": row["total_attempts"],
            "correct": row["correct_attempts"],
            "last_practiced": row["last_practiced"],
            "streak": row["streak"],
        }

    conn.close()
    return mastery


def get_weak_topics(user_id: str, threshold: float = 0.5) -> Dict[str, float]:
    """Get topics where mastery is below threshold."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT topic, mastery
        FROM tutor_topic_mastery
        WHERE user_id = ? AND mastery < ?
        ORDER BY mastery ASC
    """, (user_id, threshold))

    weak = {row["topic"]: row["mastery"] for row in cursor.fetchall()}
    conn.close()
    return weak


# ============================================================================
# HINT EFFECTIVENESS
# ============================================================================

def update_hint_effectiveness(user_id: str, hint_level: int, led_to_correct: bool):
    """Update hint effectiveness tracking."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT times_used, times_led_to_correct
        FROM tutor_hint_effectiveness
        WHERE user_id = ? AND hint_level = ?
    """, (user_id, hint_level))

    row = cursor.fetchone()

    if row:
        used = row["times_used"] + 1
        correct = row["times_led_to_correct"] + (1 if led_to_correct else 0)
        effectiveness = correct / used
        cursor.execute("""
            UPDATE tutor_hint_effectiveness
            SET times_used = ?, times_led_to_correct = ?, effectiveness = ?
            WHERE user_id = ? AND hint_level = ?
        """, (used, correct, effectiveness, user_id, hint_level))
    else:
        cursor.execute("""
            INSERT INTO tutor_hint_effectiveness (user_id, hint_level, times_used, times_led_to_correct, effectiveness)
            VALUES (?, ?, 1, ?, ?)
        """, (user_id, hint_level, 1 if led_to_correct else 0, 1.0 if led_to_correct else 0.0))

    conn.commit()
    conn.close()


def get_optimal_hint_level(user_id: str) -> int:
    """Get the most effective hint level for this user."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT hint_level, effectiveness
        FROM tutor_hint_effectiveness
        WHERE user_id = ? AND times_used >= 3
        ORDER BY effectiveness DESC
        LIMIT 1
    """, (user_id,))

    row = cursor.fetchone()
    conn.close()

    return row["hint_level"] if row else 2  # Default level 2


# ============================================================================
# INTERACTIONS HISTORY
# ============================================================================

def record_interaction(
    user_id: str,
    topic: str,
    is_correct: bool,
    response_time: float,
    hint_level_used: int = 0,
    hour_override: int = None
):
    """
    Record an interaction and update all patterns.

    Args:
        hour_override: Optionnel - forcer une heure spécifique (pour tests/simulation)
    """
    conn = get_connection()
    cursor = conn.cursor()

    now = datetime.now()
    hour = hour_override if hour_override is not None else now.hour
    day_of_week = now.weekday()

    # Insert interaction
    cursor.execute("""
        INSERT INTO tutor_interactions
        (user_id, timestamp, hour, day_of_week, topic, is_correct, response_time, hint_level_used)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, now.isoformat(), hour, day_of_week, topic, 1 if is_correct else 0, response_time, hint_level_used))

    # Keep only last 500 interactions per user
    cursor.execute("""
        DELETE FROM tutor_interactions
        WHERE user_id = ? AND id NOT IN (
            SELECT id FROM tutor_interactions
            WHERE user_id = ?
            ORDER BY timestamp DESC
            LIMIT 500
        )
    """, (user_id, user_id))

    conn.commit()
    conn.close()

    # Update all patterns
    update_time_pattern(user_id, hour, is_correct, response_time)
    update_weekly_pattern(user_id, day_of_week, hour, is_correct, response_time)
    update_topic_mastery(user_id, topic, is_correct)

    if hint_level_used > 0:
        update_hint_effectiveness(user_id, hint_level_used, is_correct)

    # Update profile stats
    profile = get_or_create_profile(user_id)
    update_profile(user_id, {
        "total_interactions": profile["total_interactions"] + 1,
        "total_correct": profile["total_correct"] + (1 if is_correct else 0),
        "total_hints_used": profile["total_hints_used"] + (1 if hint_level_used > 0 else 0),
        "last_session_at": now.isoformat(),
    })


def get_recent_interactions(user_id: str, limit: int = 20) -> List[Dict]:
    """Get recent interactions for pattern analysis."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT timestamp, hour, day_of_week, topic, is_correct, response_time, hint_level_used
        FROM tutor_interactions
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
    """, (user_id, limit))

    interactions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return interactions


# ============================================================================
# ERROR PATTERNS
# ============================================================================

def update_error_pattern(user_id: str, pattern_type: str, topics: List[str]):
    """Update or create an error pattern."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT frequency, topics_affected
        FROM tutor_error_patterns
        WHERE user_id = ? AND pattern_type = ?
    """, (user_id, pattern_type))

    row = cursor.fetchone()
    now = datetime.now().isoformat()

    if row:
        existing_topics = json.loads(row["topics_affected"]) if row["topics_affected"] else []
        all_topics = list(set(existing_topics + topics))
        cursor.execute("""
            UPDATE tutor_error_patterns
            SET frequency = ?, last_seen = ?, topics_affected = ?
            WHERE user_id = ? AND pattern_type = ?
        """, (row["frequency"] + 1, now, json.dumps(all_topics), user_id, pattern_type))
    else:
        cursor.execute("""
            INSERT INTO tutor_error_patterns (user_id, pattern_type, frequency, last_seen, topics_affected)
            VALUES (?, ?, 1, ?, ?)
        """, (user_id, pattern_type, now, json.dumps(topics)))

    conn.commit()
    conn.close()


def get_active_error_patterns(user_id: str, minutes: int = 10) -> List[Dict]:
    """Get error patterns seen in the last N minutes."""
    conn = get_connection()
    cursor = conn.cursor()

    cutoff = (datetime.now() - timedelta(minutes=minutes)).isoformat()

    cursor.execute("""
        SELECT pattern_type, frequency, last_seen, topics_affected
        FROM tutor_error_patterns
        WHERE user_id = ? AND last_seen > ?
    """, (user_id, cutoff))

    patterns = []
    for row in cursor.fetchall():
        patterns.append({
            "type": row["pattern_type"],
            "frequency": row["frequency"],
            "last_seen": row["last_seen"],
            "topics": json.loads(row["topics_affected"]) if row["topics_affected"] else [],
        })

    conn.close()
    return patterns


# ============================================================================
# FULL PROFILE SUMMARY
# ============================================================================

def get_full_profile_summary(user_id: str) -> Dict:
    """Get complete profile summary for display."""
    profile = get_or_create_profile(user_id)
    time_patterns = get_time_patterns(user_id)
    weekly_patterns = get_weekly_patterns(user_id)
    topic_mastery = get_topic_mastery(user_id)
    weak_topics = get_weak_topics(user_id)
    optimal_hours = get_optimal_hours(user_id)
    optimal_hint = get_optimal_hint_level(user_id)
    active_patterns = get_active_error_patterns(user_id)

    # Calculate best day
    best_day = None
    best_day_accuracy = 0
    for day, data in weekly_patterns.items():
        if data["samples"] >= 5 and data["accuracy"] > best_day_accuracy:
            best_day_accuracy = data["accuracy"]
            best_day = day

    day_names = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

    return {
        "user_id": user_id,
        "created_at": profile["created_at"],
        "total_interactions": profile["total_interactions"],
        "global_accuracy": profile["total_correct"] / max(1, profile["total_interactions"]),
        "avg_response_time": profile["avg_response_time"],

        "learning_style": {
            "prefers_examples": profile["prefers_examples"] > 0.5,
            "needs_encouragement": profile["needs_encouragement"] > 0.5,
            "optimal_hint_level": optimal_hint,
        },

        "optimal_hours": optimal_hours,
        "best_day": day_names[best_day] if best_day is not None else None,
        "best_day_accuracy": best_day_accuracy,

        "time_patterns": {
            h: {"accuracy": f"{d['accuracy']*100:.0f}%", "samples": d["samples"]}
            for h, d in time_patterns.items() if d["samples"] >= 3
        },

        "weak_topics": {t: f"{m*100:.0f}%" for t, m in weak_topics.items()},
        "topic_mastery": {
            t: {"mastery": f"{d['mastery']*100:.0f}%", "streak": d["streak"]}
            for t, d in topic_mastery.items()
        },

        "active_patterns": [p["type"] for p in active_patterns],
    }


# Initialize on import
init_db()
