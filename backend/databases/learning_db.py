"""
Learning Database - Gestion apprentissage (concepts, vocabulaire, messages, exercices)
Base: learning.db
"""

import sqlite3
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).parent.parent / "data" / "learning.db"


class LearningDatabase:
    """Manager pour la base de données apprentissage"""

    def __init__(self, db_path: str = None):
        self.db_path = db_path or str(DB_PATH)
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self):
        """Crée une connexion à la base de données"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        """Initialise les tables"""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Table: concepts (Knowledge Base)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS concepts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                course_id TEXT NOT NULL,
                concept TEXT NOT NULL,
                category TEXT,
                definition TEXT,
                example TEXT,
                keywords TEXT,
                times_referenced INTEGER DEFAULT 0,
                mastery_level INTEGER DEFAULT 0,
                ease_factor REAL DEFAULT 2.5,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_referenced TIMESTAMP,
                UNIQUE(course_id, concept)
            )
        """)

        # Table: course_messages (Technical learning chat history)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS course_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                course_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                code_context TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                archived BOOLEAN DEFAULT 0
            )
        """)

        # Table: language_messages (Language learning chat history)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS language_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                course_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                archived BOOLEAN DEFAULT 0
            )
        """)

        # Table: vocabulary (SM-2++ for language learning)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vocabulary (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                course_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                word TEXT NOT NULL,
                translation TEXT NOT NULL,
                pronunciation TEXT,
                example TEXT,
                context TEXT,
                mastery_level INTEGER DEFAULT 0,
                ease_factor REAL DEFAULT 2.5,
                interval INTEGER DEFAULT 0,
                repetitions INTEGER DEFAULT 0,
                next_review TIMESTAMP,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_reviewed TIMESTAMP,
                UNIQUE(course_id, user_id, word)
            )
        """)

        # Table: completed_exercises
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS completed_exercises (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                exercise_id TEXT NOT NULL,
                course_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                exercise_type TEXT NOT NULL,
                is_correct BOOLEAN NOT NULL,
                user_answer TEXT,
                correct_answer TEXT,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Table: ai_usage (Tracking coûts OpenAI)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ai_usage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date TEXT NOT NULL,
                task_type TEXT NOT NULL,
                difficulty TEXT,
                model TEXT NOT NULL,
                tier TEXT NOT NULL,
                tokens_input INTEGER NOT NULL,
                tokens_output INTEGER NOT NULL,
                cost_usd REAL NOT NULL,
                latency_ms INTEGER,
                fallback_used BOOLEAN DEFAULT 0
            )
        """)

        # Index pour requêtes par date
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage(date)
        """)

        # Table: ai_daily_summary (Agrégation par jour)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ai_daily_summary (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT UNIQUE NOT NULL,
                total_requests INTEGER DEFAULT 0,
                total_tokens_input INTEGER DEFAULT 0,
                total_tokens_output INTEGER DEFAULT 0,
                total_cost_usd REAL DEFAULT 0,
                requests_fast INTEGER DEFAULT 0,
                requests_balanced INTEGER DEFAULT 0,
                requests_reasoning INTEGER DEFAULT 0,
                avg_latency_ms REAL DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()
        conn.close()
        logger.info(f"✅ Learning DB initialized at {self.db_path}")

    # ═══════════════════════════════════════════════════════════════
    # CONCEPTS
    # ═══════════════════════════════════════════════════════════════

    def get_concepts(self, course_id: str) -> List[Dict[str, Any]]:
        """Récupère tous les concepts d'un cours"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM concepts
            WHERE course_id = ?
            ORDER BY added_at DESC
        """, (course_id,))

        rows = cursor.fetchall()
        conn.close()

        concepts = []
        for row in rows:
            concept = dict(row)
            concept['keywords'] = json.loads(concept['keywords']) if concept['keywords'] else []
            concepts.append(concept)

        return concepts

    def add_concept(
        self,
        course_id: str,
        concept: str,
        category: Optional[str] = None,
        definition: Optional[str] = None,
        example: Optional[str] = None,
        keywords: List[str] = None
    ) -> int:
        """Ajoute un nouveau concept"""
        conn = self._get_connection()
        cursor = conn.cursor()

        keywords_json = json.dumps(keywords or [])

        try:
            cursor.execute("""
                INSERT INTO concepts
                (course_id, concept, category, definition, example, keywords)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (course_id, concept, category, definition, example, keywords_json))

            conn.commit()
            concept_id = cursor.lastrowid
            conn.close()

            logger.info(f"✅ Added concept: {concept} (ID: {concept_id})")
            return concept_id

        except sqlite3.IntegrityError:
            conn.close()
            logger.warning(f"⚠️ Concept already exists: {concept}")
            return -1

    def search_concepts(self, course_id: str, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Recherche des concepts pertinents"""
        conn = self._get_connection()
        cursor = conn.cursor()

        query_pattern = f"%{query.lower()}%"

        cursor.execute("""
            SELECT * FROM concepts
            WHERE course_id = ?
            AND (
                LOWER(concept) LIKE ?
                OR LOWER(definition) LIKE ?
                OR LOWER(keywords) LIKE ?
            )
            ORDER BY mastery_level DESC, times_referenced DESC
            LIMIT ?
        """, (course_id, query_pattern, query_pattern, query_pattern, limit))

        rows = cursor.fetchall()
        conn.close()

        concepts = []
        for row in rows:
            concept = dict(row)
            concept['keywords'] = json.loads(concept['keywords']) if concept['keywords'] else []
            concepts.append(concept)

        return concepts

    def update_mastery(self, concept_id: int, mastery_level: int):
        """Met à jour la mastery d'un concept"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE concepts
            SET mastery_level = ?,
                last_referenced = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (mastery_level, concept_id))

        conn.commit()
        conn.close()

    def increment_concept_reference(self, concept_id: int):
        """Incrémente le compteur de références d'un concept"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE concepts
            SET times_referenced = times_referenced + 1,
                last_referenced = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (concept_id,))

        conn.commit()
        conn.close()

    def get_concept_stats(self, course_id: str) -> Dict[str, Any]:
        """Statistiques sur les concepts d'un cours"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                COUNT(*) as total,
                AVG(mastery_level) as avg_mastery,
                SUM(times_referenced) as total_references,
                SUM(CASE WHEN mastery_level >= 80 THEN 1 ELSE 0 END) as mastered,
                SUM(CASE WHEN mastery_level < 50 THEN 1 ELSE 0 END) as needs_review
            FROM concepts
            WHERE course_id = ?
        """, (course_id,))

        row = cursor.fetchone()
        conn.close()

        return dict(row) if row else {}

    def delete_course_concepts(self, course_id: str) -> int:
        """Supprime tous les concepts d'un cours"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM concepts WHERE course_id = ?", (course_id,))
        deleted_count = cursor.rowcount

        conn.commit()
        conn.close()

        return deleted_count

    # ═══════════════════════════════════════════════════════════════
    # LANGUAGE MESSAGES
    # ═══════════════════════════════════════════════════════════════

    def save_language_message(self, course_id: str, user_id: str, message: Dict[str, Any]) -> bool:
        """Sauvegarde un message de conversation langue"""
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT INTO language_messages (course_id, user_id, role, content)
                VALUES (?, ?, ?, ?)
            """, (course_id, user_id, message['role'], message['content']))

            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"Error saving language message: {e}")
            conn.close()
            return False

    def save_language_messages_bulk(self, course_id: str, user_id: str, messages: List[Dict[str, Any]]) -> int:
        """Sauvegarde plusieurs messages en bulk"""
        conn = self._get_connection()
        cursor = conn.cursor()

        saved_count = 0
        for msg in messages:
            try:
                cursor.execute("""
                    INSERT INTO language_messages (course_id, user_id, role, content)
                    VALUES (?, ?, ?, ?)
                """, (course_id, user_id, msg['role'], msg['content']))
                saved_count += 1
            except Exception as e:
                logger.error(f"Error saving message: {e}")

        conn.commit()
        conn.close()
        return saved_count

    def archive_old_language_messages(self, course_id: str, keep_recent: int = 100) -> int:
        """Archive les anciens messages"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE language_messages
            SET archived = 1
            WHERE course_id = ? AND id NOT IN (
                SELECT id FROM language_messages
                WHERE course_id = ?
                ORDER BY timestamp DESC
                LIMIT ?
            )
        """, (course_id, course_id, keep_recent))

        archived_count = cursor.rowcount
        conn.commit()
        conn.close()

        return archived_count

    def get_recent_language_messages(self, course_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Récupère les messages récents"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM language_messages
            WHERE course_id = ? AND archived = 0
            ORDER BY timestamp DESC
            LIMIT ?
        """, (course_id, limit))

        rows = cursor.fetchall()
        conn.close()

        return [dict(row) for row in rows]

    def get_language_message_stats(self, course_id: str) -> Dict[str, Any]:
        """Statistiques sur les messages"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN archived = 0 THEN 1 ELSE 0 END) as recent,
                SUM(CASE WHEN archived = 1 THEN 1 ELSE 0 END) as archived
            FROM language_messages
            WHERE course_id = ?
        """, (course_id,))

        row = cursor.fetchone()
        conn.close()

        return dict(row) if row else {}

    # ═══════════════════════════════════════════════════════════════
    # VOCABULARY (SM-2++)
    # ═══════════════════════════════════════════════════════════════

    def add_vocabulary_word(self, course_id: str, user_id: str, word_data: Dict[str, Any]) -> bool:
        """Ajoute un nouveau mot de vocabulaire"""
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT INTO vocabulary
                (course_id, user_id, word, translation, pronunciation, example, context, next_review)
                VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
            """, (
                course_id,
                user_id,
                word_data['word'],
                word_data['translation'],
                word_data.get('pronunciation'),
                word_data.get('example'),
                word_data.get('context'),
            ))

            conn.commit()
            conn.close()
            return True
        except sqlite3.IntegrityError:
            conn.close()
            logger.warning(f"Word already exists: {word_data['word']}")
            return False

    def get_vocabulary(self, course_id: str, user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Récupère le vocabulaire d'un cours"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM vocabulary
            WHERE course_id = ? AND user_id = ?
            ORDER BY added_at DESC
            LIMIT ?
        """, (course_id, user_id, limit))

        rows = cursor.fetchall()
        conn.close()

        return [dict(row) for row in rows]

    def get_due_vocabulary(self, course_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Récupère les mots à réviser (SM-2++)"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM vocabulary
            WHERE course_id = ? AND user_id = ?
            AND (next_review IS NULL OR next_review <= datetime('now'))
            ORDER BY next_review ASC
            LIMIT 20
        """, (course_id, user_id))

        rows = cursor.fetchall()
        conn.close()

        return [dict(row) for row in rows]

    def update_vocabulary_review(self, word_id: str, quality: int) -> bool:
        """Met à jour un mot après révision (SM-2++)"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM vocabulary WHERE id = ?", (word_id,))
        word = cursor.fetchone()

        if not word:
            conn.close()
            return False

        # Calcul SM-2++
        ease_factor = word['ease_factor']
        interval = word['interval']
        repetitions = word['repetitions']

        ease_factor = max(1.3, ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

        if quality < 3:
            interval = 0
            repetitions = 0
        else:
            if repetitions == 0:
                interval = 1
            elif repetitions == 1:
                interval = 6
            else:
                interval = int(interval * ease_factor)
            repetitions += 1

        mastery_level = min(100, repetitions * 15 + quality * 5)
        next_review = datetime.now() + timedelta(days=interval)

        cursor.execute("""
            UPDATE vocabulary
            SET ease_factor = ?,
                interval = ?,
                repetitions = ?,
                mastery_level = ?,
                next_review = ?,
                last_reviewed = datetime('now')
            WHERE id = ?
        """, (ease_factor, interval, repetitions, mastery_level, next_review, word_id))

        conn.commit()
        conn.close()
        return True

    def get_vocabulary_stats(self, course_id: str, user_id: str) -> Dict[str, Any]:
        """Statistiques sur le vocabulaire"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                COUNT(*) as total,
                AVG(mastery_level) as avg_mastery,
                SUM(CASE WHEN mastery_level >= 80 THEN 1 ELSE 0 END) as mastered,
                COUNT(CASE WHEN next_review <= datetime('now') THEN 1 END) as due_for_review
            FROM vocabulary
            WHERE course_id = ? AND user_id = ?
        """, (course_id, user_id))

        row = cursor.fetchone()
        conn.close()

        return dict(row) if row else {}

    # ═══════════════════════════════════════════════════════════════
    # EXERCISES
    # ═══════════════════════════════════════════════════════════════

    def save_completed_exercise(
        self,
        exercise_id: str,
        course_id: str,
        user_id: str,
        exercise_type: str,
        is_correct: bool,
        user_answer: str = None,
        correct_answer: str = None
    ) -> bool:
        """Sauvegarde un exercice complété"""
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT INTO completed_exercises
                (exercise_id, course_id, user_id, exercise_type, is_correct, user_answer, correct_answer)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (exercise_id, course_id, user_id, exercise_type, is_correct, user_answer, correct_answer))

            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"Error saving exercise: {e}")
            conn.close()
            return False

    # ═══════════════════════════════════════════════════════════════
    # AI USAGE TRACKING
    # ═══════════════════════════════════════════════════════════════

    def log_ai_usage(
        self,
        task_type: str,
        model: str,
        tier: str,
        tokens_input: int,
        tokens_output: int,
        cost_usd: float,
        difficulty: Optional[str] = None,
        latency_ms: Optional[int] = None,
        fallback_used: bool = False
    ) -> int:
        """Enregistre une utilisation AI"""
        conn = self._get_connection()
        cursor = conn.cursor()

        today = datetime.now().strftime("%Y-%m-%d")

        try:
            # Enregistrer l'utilisation
            cursor.execute("""
                INSERT INTO ai_usage
                (date, task_type, difficulty, model, tier, tokens_input, tokens_output, cost_usd, latency_ms, fallback_used)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (today, task_type, difficulty, model, tier, tokens_input, tokens_output, cost_usd, latency_ms, fallback_used))

            usage_id = cursor.lastrowid

            # Mettre à jour le résumé quotidien
            cursor.execute("""
                INSERT INTO ai_daily_summary (date, total_requests, total_tokens_input, total_tokens_output, total_cost_usd,
                    requests_fast, requests_balanced, requests_reasoning, avg_latency_ms)
                VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(date) DO UPDATE SET
                    total_requests = total_requests + 1,
                    total_tokens_input = total_tokens_input + excluded.total_tokens_input,
                    total_tokens_output = total_tokens_output + excluded.total_tokens_output,
                    total_cost_usd = total_cost_usd + excluded.total_cost_usd,
                    requests_fast = requests_fast + excluded.requests_fast,
                    requests_balanced = requests_balanced + excluded.requests_balanced,
                    requests_reasoning = requests_reasoning + excluded.requests_reasoning,
                    avg_latency_ms = (avg_latency_ms * total_requests + excluded.avg_latency_ms) / (total_requests + 1),
                    updated_at = CURRENT_TIMESTAMP
            """, (
                today,
                tokens_input,
                tokens_output,
                cost_usd,
                1 if tier == "fast" else 0,
                1 if tier == "balanced" else 0,
                1 if tier == "reasoning" else 0,
                latency_ms or 0
            ))

            conn.commit()
            conn.close()

            logger.debug(f"📊 AI usage logged: {task_type} on {model} (${cost_usd:.6f})")
            return usage_id

        except Exception as e:
            logger.error(f"Error logging AI usage: {e}")
            conn.close()
            return -1

    def get_ai_usage_today(self) -> Dict[str, Any]:
        """Récupère les stats AI d'aujourd'hui"""
        conn = self._get_connection()
        cursor = conn.cursor()

        today = datetime.now().strftime("%Y-%m-%d")

        cursor.execute("""
            SELECT * FROM ai_daily_summary WHERE date = ?
        """, (today,))

        row = cursor.fetchone()
        conn.close()

        if row:
            return dict(row)
        return {
            "date": today,
            "total_requests": 0,
            "total_tokens_input": 0,
            "total_tokens_output": 0,
            "total_cost_usd": 0,
            "requests_fast": 0,
            "requests_balanced": 0,
            "requests_reasoning": 0,
            "avg_latency_ms": 0
        }

    def get_ai_usage_range(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Récupère les stats AI sur une période"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM ai_daily_summary
            WHERE date BETWEEN ? AND ?
            ORDER BY date DESC
        """, (start_date, end_date))

        rows = cursor.fetchall()
        conn.close()

        return [dict(row) for row in rows]

    def get_ai_usage_this_week(self) -> Dict[str, Any]:
        """Récupère les stats de la semaine en cours"""
        today = datetime.now()
        week_start = (today - timedelta(days=today.weekday())).strftime("%Y-%m-%d")
        today_str = today.strftime("%Y-%m-%d")

        daily_stats = self.get_ai_usage_range(week_start, today_str)

        return {
            "period": "week",
            "start_date": week_start,
            "end_date": today_str,
            "total_requests": sum(d["total_requests"] for d in daily_stats),
            "total_tokens_input": sum(d["total_tokens_input"] for d in daily_stats),
            "total_tokens_output": sum(d["total_tokens_output"] for d in daily_stats),
            "total_cost_usd": sum(d["total_cost_usd"] for d in daily_stats),
            "requests_fast": sum(d["requests_fast"] for d in daily_stats),
            "requests_balanced": sum(d["requests_balanced"] for d in daily_stats),
            "requests_reasoning": sum(d["requests_reasoning"] for d in daily_stats),
            "daily_breakdown": daily_stats
        }

    def get_ai_usage_this_month(self) -> Dict[str, Any]:
        """Récupère les stats du mois en cours"""
        today = datetime.now()
        month_start = today.replace(day=1).strftime("%Y-%m-%d")
        today_str = today.strftime("%Y-%m-%d")

        daily_stats = self.get_ai_usage_range(month_start, today_str)

        return {
            "period": "month",
            "start_date": month_start,
            "end_date": today_str,
            "total_requests": sum(d["total_requests"] for d in daily_stats),
            "total_tokens_input": sum(d["total_tokens_input"] for d in daily_stats),
            "total_tokens_output": sum(d["total_tokens_output"] for d in daily_stats),
            "total_cost_usd": sum(d["total_cost_usd"] for d in daily_stats),
            "requests_fast": sum(d["requests_fast"] for d in daily_stats),
            "requests_balanced": sum(d["requests_balanced"] for d in daily_stats),
            "requests_reasoning": sum(d["requests_reasoning"] for d in daily_stats),
            "daily_breakdown": daily_stats
        }

    def get_ai_usage_all_time(self) -> Dict[str, Any]:
        """Récupère les stats totales depuis le début"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                COUNT(*) as total_requests,
                COALESCE(SUM(total_tokens_input), 0) as total_tokens_input,
                COALESCE(SUM(total_tokens_output), 0) as total_tokens_output,
                COALESCE(SUM(total_cost_usd), 0) as total_cost_usd,
                COALESCE(SUM(requests_fast), 0) as requests_fast,
                COALESCE(SUM(requests_balanced), 0) as requests_balanced,
                COALESCE(SUM(requests_reasoning), 0) as requests_reasoning,
                MIN(date) as first_date,
                MAX(date) as last_date
            FROM ai_daily_summary
        """)

        row = cursor.fetchone()
        conn.close()

        if row:
            result = dict(row)
            # Recalculer total_requests correctement (somme des jours)
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT COALESCE(SUM(total_requests), 0) FROM ai_daily_summary")
            result["total_requests"] = cursor.fetchone()[0]
            conn.close()
            return result

        return {
            "total_requests": 0,
            "total_tokens_input": 0,
            "total_tokens_output": 0,
            "total_cost_usd": 0,
            "requests_fast": 0,
            "requests_balanced": 0,
            "requests_reasoning": 0,
            "first_date": None,
            "last_date": None
        }

    def get_ai_usage_by_task_type(self, days: int = 30) -> List[Dict[str, Any]]:
        """Récupère les stats par type de tâche"""
        conn = self._get_connection()
        cursor = conn.cursor()

        start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

        cursor.execute("""
            SELECT
                task_type,
                COUNT(*) as total_requests,
                SUM(tokens_input) as total_tokens_input,
                SUM(tokens_output) as total_tokens_output,
                SUM(cost_usd) as total_cost_usd,
                AVG(latency_ms) as avg_latency_ms
            FROM ai_usage
            WHERE date >= ?
            GROUP BY task_type
            ORDER BY total_cost_usd DESC
        """, (start_date,))

        rows = cursor.fetchall()
        conn.close()

        return [dict(row) for row in rows]

    def get_ai_recent_calls(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Récupère les derniers appels AI"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM ai_usage
            ORDER BY timestamp DESC
            LIMIT ?
        """, (limit,))

        rows = cursor.fetchall()
        conn.close()

        return [dict(row) for row in rows]

    def recalculate_all_costs(self, prices: Dict[str, Dict[str, float]]) -> Dict[str, Any]:
        """
        Recalcule tous les coûts historiques avec les nouveaux prix.

        Args:
            prices: Dict des prix par modèle, ex:
                {
                    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
                    "gpt-4o": {"input": 2.50, "output": 10.0}
                }

        Returns:
            Stats du recalcul (rows updated, old total, new total)
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        # Récupérer l'ancien total
        cursor.execute("SELECT COALESCE(SUM(cost_usd), 0) FROM ai_usage")
        old_total = cursor.fetchone()[0]

        updated_count = 0

        for model_name, model_prices in prices.items():
            cursor.execute("""
                UPDATE ai_usage
                SET cost_usd = (tokens_input * ? + tokens_output * ?) / 1000000.0
                WHERE model = ?
            """, (model_prices["input"], model_prices["output"], model_name))
            updated_count += cursor.rowcount

        # Recalculer les résumés quotidiens
        cursor.execute("""
            UPDATE ai_daily_summary
            SET total_cost_usd = (
                SELECT COALESCE(SUM(cost_usd), 0)
                FROM ai_usage
                WHERE date = ai_daily_summary.date
            ),
            updated_at = CURRENT_TIMESTAMP
        """)

        conn.commit()

        # Récupérer le nouveau total
        cursor.execute("SELECT COALESCE(SUM(cost_usd), 0) FROM ai_usage")
        new_total = cursor.fetchone()[0]

        conn.close()

        logger.info(f"💰 Coûts recalculés: {updated_count} lignes, ${old_total:.4f} → ${new_total:.4f}")

        return {
            "rows_updated": updated_count,
            "old_total_usd": old_total,
            "new_total_usd": new_total,
            "difference_usd": new_total - old_total
        }

    # ═══════════════════════════════════════════════════════════════
    # HEALTH CHECK
    # ═══════════════════════════════════════════════════════════════

    def get_health_check(self) -> Dict[str, Any]:
        """Vérifie l'état de la base avec détails"""
        from pathlib import Path

        result = {
            "ok": False,
            "path": self.db_path,
            "concepts": 0,
            "vocabulary": 0,
            "error": None,
            "size_kb": 0,
            "last_modified": None
        }

        try:
            # Infos fichier
            db_file = Path(self.db_path)
            if db_file.exists():
                stat = db_file.stat()
                result["size_kb"] = round(stat.st_size / 1024, 1)
                result["last_modified"] = datetime.fromtimestamp(stat.st_mtime).isoformat()

            # Test connexion et comptage
            conn = self._get_connection()
            cursor = conn.cursor()

            cursor.execute("SELECT COUNT(*) FROM concepts")
            result["concepts"] = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM vocabulary")
            result["vocabulary"] = cursor.fetchone()[0]

            conn.close()
            result["ok"] = True

        except Exception as e:
            result["error"] = str(e)

        return result


# Instance globale
learning_db = LearningDatabase()
