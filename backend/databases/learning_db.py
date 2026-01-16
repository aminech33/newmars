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


# ═══════════════════════════════════════════════════════════════════════════════
# 🔍 FUZZY MATCHING UTILS - Pour le Generation Effect
# ═══════════════════════════════════════════════════════════════════════════════

def levenshtein_distance(s1: str, s2: str) -> int:
    """Calcule la distance de Levenshtein entre deux strings."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]


def get_word_stem(word: str) -> str:
    """
    Simple stemming français/anglais - retire suffixes courants.
    Ex: "multiplication" -> "multipl", "calculs" -> "calcul"
    """
    word = word.lower().strip()

    # Suffixes français courants (ordre décroissant de longueur)
    suffixes_fr = [
        'issement', 'ification', 'isation', 'ations', 'ition', 'ation',
        'ement', 'ments', 'ment', 'iques', 'ique', 'eurs', 'eur',
        'ables', 'able', 'ibles', 'ible', 'ions', 'ion', 'ies', 'ie',
        'aux', 'eaux', 'eux', 'ifs', 'if', 'ives', 'ive',
        'és', 'ées', 'er', 'ir', 'ant', 'ent', 'és', 'ée', 'é',
        's', 'x'
    ]

    for suffix in suffixes_fr:
        if word.endswith(suffix) and len(word) > len(suffix) + 2:
            return word[:-len(suffix)]

    return word


def fuzzy_keyword_match(keyword: str, text: str, threshold: float = 0.75) -> bool:
    """
    Vérifie si un keyword est présent dans le texte avec fuzzy matching.

    Strategies:
    1. Match exact (insensible à la casse)
    2. Match de stem (racine du mot)
    3. Match par distance de Levenshtein (fautes de frappe)
    4. Match partiel (le keyword est contenu dans un mot plus long)

    Args:
        keyword: Le mot-clé à chercher
        text: Le texte dans lequel chercher
        threshold: Seuil de similarité (0.0-1.0)

    Returns:
        True si le keyword est trouvé (exact ou fuzzy)
    """
    keyword_lower = keyword.lower().strip()
    text_lower = text.lower()

    # 1. Match exact
    if keyword_lower in text_lower:
        return True

    # 2. Extraire les mots du texte
    words = text_lower.replace(',', ' ').replace('.', ' ').replace('!', ' ').replace('?', ' ').split()

    # 3. Match de stem
    keyword_stem = get_word_stem(keyword_lower)
    if len(keyword_stem) >= 3:  # Stem doit avoir au moins 3 caractères
        for word in words:
            word_stem = get_word_stem(word)
            if keyword_stem == word_stem:
                return True
            # Vérifier si un stem contient l'autre
            if len(keyword_stem) >= 4 and len(word_stem) >= 4:
                if keyword_stem in word_stem or word_stem in keyword_stem:
                    return True

    # 4. Match par distance de Levenshtein
    max_distance = max(1, int(len(keyword_lower) * (1 - threshold)))
    for word in words:
        if abs(len(word) - len(keyword_lower)) <= max_distance:
            distance = levenshtein_distance(keyword_lower, word)
            if distance <= max_distance:
                return True

    # 5. Match partiel - le keyword est une partie significative d'un mot
    if len(keyword_lower) >= 4:
        for word in words:
            if len(word) >= len(keyword_lower):
                if keyword_lower in word:
                    return True

    return False


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

        # Table: learning_sessions (Sessions persistées)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS learning_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                course_id TEXT,
                topic_id TEXT,
                topic_name TEXT,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ended_at TIMESTAMP,
                questions_answered INTEGER DEFAULT 0,
                correct_answers INTEGER DEFAULT 0,
                xp_earned INTEGER DEFAULT 0,
                streak INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                current_question_data TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Index pour recherche par user_id
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_sessions_user ON learning_sessions(user_id)
        """)

        # Table: user_mastery (Maîtrise par utilisateur/topic)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_mastery (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                topic_id TEXT NOT NULL,
                mastery_level INTEGER DEFAULT 0,
                ease_factor REAL DEFAULT 2.5,
                interval INTEGER DEFAULT 1,
                repetitions INTEGER DEFAULT 0,
                success_rate REAL DEFAULT 0.0,
                total_attempts INTEGER DEFAULT 0,
                correct_attempts INTEGER DEFAULT 0,
                consecutive_skips INTEGER DEFAULT 0,
                success_by_difficulty TEXT DEFAULT '{"easy": {"correct": 0, "total": 0}, "medium": {"correct": 0, "total": 0}, "hard": {"correct": 0, "total": 0}}',
                last_reviewed TIMESTAMP,
                next_review TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, topic_id)
            )
        """)

        # Migration: ajouter la colonne si elle n'existe pas
        try:
            cursor.execute("ALTER TABLE user_mastery ADD COLUMN success_by_difficulty TEXT DEFAULT '{\"easy\": {\"correct\": 0, \"total\": 0}, \"medium\": {\"correct\": 0, \"total\": 0}, \"hard\": {\"correct\": 0, \"total\": 0}}'")
        except sqlite3.OperationalError:
            pass  # La colonne existe déjà

        # Index pour recherche par user_id
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_mastery_user ON user_mastery(user_id)
        """)

        # ═══════════════════════════════════════════════════════════════
        # 🆕 ADVANCED LEARNING SYSTEM TABLES
        # ═══════════════════════════════════════════════════════════════

        # Table: session_performance_by_hour (Chronotype Detection)
        # Tracks performance metrics by hour to detect optimal learning times
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS session_performance_by_hour (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                hour INTEGER NOT NULL,
                day_of_week INTEGER,
                total_attempts INTEGER DEFAULT 0,
                correct_attempts INTEGER DEFAULT 0,
                avg_response_time REAL DEFAULT 0,
                total_mastery_change INTEGER DEFAULT 0,
                session_count INTEGER DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, hour, day_of_week)
            )
        """)

        # Table: user_chronotype (Detected chronotype profile)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_chronotype (
                user_id TEXT PRIMARY KEY,
                chronotype TEXT DEFAULT 'unknown',
                best_hours TEXT DEFAULT '[]',
                worst_hours TEXT DEFAULT '[]',
                optimal_session_length INTEGER DEFAULT 25,
                attention_span_minutes INTEGER DEFAULT 45,
                confidence_score REAL DEFAULT 0.0,
                data_points INTEGER DEFAULT 0,
                last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Table: concept_prerequisites (Knowledge Graph)
        # Links concepts with their prerequisites for optimal learning order
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS concept_prerequisites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                course_id TEXT NOT NULL,
                concept_id TEXT NOT NULL,
                prerequisite_id TEXT NOT NULL,
                strength REAL DEFAULT 1.0,
                auto_detected BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(course_id, concept_id, prerequisite_id)
            )
        """)

        # Table: concept_similarity (Interference detection)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS concept_similarity (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                course_id TEXT NOT NULL,
                concept_a_id TEXT NOT NULL,
                concept_b_id TEXT NOT NULL,
                similarity_score REAL DEFAULT 0.0,
                interference_risk REAL DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(course_id, concept_a_id, concept_b_id)
            )
        """)

        # Table: user_learning_style (Learning Style Detection)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_learning_style (
                user_id TEXT PRIMARY KEY,
                visual_score REAL DEFAULT 0.25,
                auditory_score REAL DEFAULT 0.25,
                reading_score REAL DEFAULT 0.25,
                kinesthetic_score REAL DEFAULT 0.25,
                dominant_style TEXT DEFAULT 'unknown',
                calibration_questions_answered INTEGER DEFAULT 0,
                confidence_score REAL DEFAULT 0.0,
                format_preferences TEXT DEFAULT '{}',
                last_calibrated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Table: learning_style_responses (Calibration data)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS learning_style_responses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                question_format TEXT NOT NULL,
                was_correct BOOLEAN NOT NULL,
                response_time INTEGER,
                perceived_difficulty TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Table: generation_effect_responses (Track Generation Effect performance)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS generation_effect_responses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                question_id TEXT NOT NULL,
                topic_id TEXT NOT NULL,
                difficulty TEXT NOT NULL,

                -- Phase 1: Génération
                generated_answer TEXT NOT NULL,
                generation_time INTEGER DEFAULT 0,
                keywords_matched TEXT DEFAULT '[]',
                keywords_total INTEGER DEFAULT 0,
                generation_quality REAL DEFAULT 0.0,
                pre_generation_confidence REAL,

                -- Phase 2: QCM
                selected_answer TEXT,
                selection_time INTEGER DEFAULT 0,
                is_correct BOOLEAN DEFAULT 0,

                -- Cohérence & Bonus
                was_consistent BOOLEAN DEFAULT 0,
                generation_bonus INTEGER DEFAULT 0,
                consistency_bonus INTEGER DEFAULT 0,
                total_xp INTEGER DEFAULT 0,
                mastery_change INTEGER DEFAULT 0,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Table: user_generation_stats (Aggregate stats for Generation Effect)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_generation_stats (
                user_id TEXT PRIMARY KEY,
                total_generations INTEGER DEFAULT 0,
                avg_generation_quality REAL DEFAULT 0.0,
                avg_consistency_rate REAL DEFAULT 0.0,
                total_generation_bonus INTEGER DEFAULT 0,
                total_consistency_bonus INTEGER DEFAULT 0,
                best_streak INTEGER DEFAULT 0,
                current_streak INTEGER DEFAULT 0,
                preferred_mode TEXT DEFAULT 'mixed',
                last_generation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Index pour performance queries
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_perf_user_hour
            ON session_performance_by_hour(user_id, hour)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_prereq_concept
            ON concept_prerequisites(course_id, concept_id)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_generation_user
            ON generation_effect_responses(user_id, topic_id)
        """)

        # Table: interleaving_sessions (Track interleaving practice sessions)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS interleaving_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT UNIQUE NOT NULL,
                user_id TEXT NOT NULL,
                course_id TEXT NOT NULL,
                topic_ids TEXT NOT NULL,
                current_topic_idx INTEGER DEFAULT 0,
                switch_frequency INTEGER DEFAULT 2,
                questions_answered INTEGER DEFAULT 0,
                correct_answers INTEGER DEFAULT 0,
                topic_history TEXT DEFAULT '[]',
                estimated_benefit REAL DEFAULT 0.15,
                status TEXT DEFAULT 'active',
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ended_at TIMESTAMP
            )
        """)

        # Table: user_interleaving_stats (Aggregate interleaving performance)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_interleaving_stats (
                user_id TEXT PRIMARY KEY,
                total_interleaving_sessions INTEGER DEFAULT 0,
                total_questions_interleaved INTEGER DEFAULT 0,
                avg_success_rate REAL DEFAULT 0.0,
                retention_boost_measured REAL DEFAULT 0.0,
                preferred_switch_frequency INTEGER DEFAULT 2,
                topics_interleaved TEXT DEFAULT '[]',
                last_interleaving TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_interleaving_user
            ON interleaving_sessions(user_id, status)
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
    # LEARNING SESSIONS (Persistées)
    # ═══════════════════════════════════════════════════════════════

    def create_session(
        self,
        session_id: str,
        user_id: str,
        course_id: Optional[str] = None,
        topic_id: Optional[str] = None,
        topic_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Crée une nouvelle session d'apprentissage"""
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT INTO learning_sessions
                (id, user_id, course_id, topic_id, topic_name)
                VALUES (?, ?, ?, ?, ?)
            """, (session_id, user_id, course_id, topic_id, topic_name))

            conn.commit()
            conn.close()

            logger.info(f"✅ Session créée: {session_id} pour user {user_id}")

            return {
                "id": session_id,
                "user_id": user_id,
                "course_id": course_id,
                "topic_id": topic_id,
                "topic_name": topic_name,
                "started_at": datetime.now().isoformat(),
                "questions_answered": 0,
                "correct_answers": 0,
                "xp_earned": 0,
                "streak": 0,
                "status": "active"
            }
        except Exception as e:
            conn.close()
            logger.error(f"❌ Erreur création session: {e}")
            raise

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Récupère une session par ID"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM learning_sessions WHERE id = ?", (session_id,))
        row = cursor.fetchone()
        conn.close()

        if row:
            session = dict(row)
            # Parser current_question_data si présent
            if session.get("current_question_data"):
                session["current_question_data"] = json.loads(session["current_question_data"])
            return session
        return None

    def update_session(self, session_id: str, updates: Dict[str, Any]) -> bool:
        """Met à jour une session"""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Sérialiser current_question_data si présent
        if "current_question_data" in updates and updates["current_question_data"] is not None:
            updates["current_question_data"] = json.dumps(updates["current_question_data"])

        # Construire la requête dynamiquement
        set_clauses = ", ".join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values()) + [session_id]

        cursor.execute(f"""
            UPDATE learning_sessions
            SET {set_clauses}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, values)

        conn.commit()
        updated = cursor.rowcount > 0
        conn.close()

        return updated

    def update_session_atomic(self, session_id: str, updates: Dict[str, Any]) -> bool:
        """
        Met à jour une session de manière atomique (évite les race conditions).
        Utilise des deltas pour les champs numériques.

        Champs supportés:
        - questions_answered_delta: +N
        - correct_answers_delta: +N
        - xp_earned_delta: +N
        - streak: valeur absolue (reset ou nouvelle valeur)
        - current_question_data: JSON ou None
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        set_parts = []
        values = []

        # Deltas pour les compteurs (opération atomique)
        if "questions_answered_delta" in updates:
            set_parts.append("questions_answered = questions_answered + ?")
            values.append(updates["questions_answered_delta"])

        if "correct_answers_delta" in updates:
            set_parts.append("correct_answers = correct_answers + ?")
            values.append(updates["correct_answers_delta"])

        if "xp_earned_delta" in updates:
            set_parts.append("xp_earned = xp_earned + ?")
            values.append(updates["xp_earned_delta"])

        # Streak: supporte increment atomique ou reset
        if "streak_increment" in updates:
            # Increment conditionnel: streak + 1 si correct, 0 si incorrect
            # Utilise CASE pour opération 100% atomique
            if updates["streak_increment"]:
                set_parts.append("streak = streak + 1")
            else:
                set_parts.append("streak = 0")
        elif "streak" in updates:
            # Fallback: valeur absolue (moins safe)
            set_parts.append("streak = ?")
            values.append(updates["streak"])

        if "current_question_data" in updates:
            set_parts.append("current_question_data = ?")
            if updates["current_question_data"] is not None:
                values.append(json.dumps(updates["current_question_data"]))
            else:
                values.append(None)

        if not set_parts:
            conn.close()
            return False

        set_parts.append("updated_at = CURRENT_TIMESTAMP")
        values.append(session_id)

        cursor.execute(f"""
            UPDATE learning_sessions
            SET {", ".join(set_parts)}
            WHERE id = ?
        """, values)

        conn.commit()
        updated = cursor.rowcount > 0
        conn.close()

        return updated

    def end_session(self, session_id: str) -> bool:
        """Termine une session"""
        return self.update_session(session_id, {
            "status": "completed",
            "ended_at": datetime.now().isoformat()
        })

    def get_user_sessions(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Récupère les sessions d'un utilisateur"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM learning_sessions
            WHERE user_id = ?
            ORDER BY started_at DESC
            LIMIT ?
        """, (user_id, limit))

        rows = cursor.fetchall()
        conn.close()

        return [dict(row) for row in rows]

    # ═══════════════════════════════════════════════════════════════
    # USER MASTERY (Persistée)
    # ═══════════════════════════════════════════════════════════════

    def get_or_create_mastery(self, user_id: str, topic_id: str) -> Dict[str, Any]:
        """Récupère ou crée les données de maîtrise d'un utilisateur pour un topic"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM user_mastery WHERE user_id = ? AND topic_id = ?
        """, (user_id, topic_id))

        row = cursor.fetchone()

        if row:
            conn.close()
            result = dict(row)
            # Parser success_by_difficulty JSON
            if result.get("success_by_difficulty"):
                try:
                    result["success_by_difficulty"] = json.loads(result["success_by_difficulty"])
                except json.JSONDecodeError:
                    result["success_by_difficulty"] = {"easy": {"correct": 0, "total": 0}, "medium": {"correct": 0, "total": 0}, "hard": {"correct": 0, "total": 0}}
            return result

        # Créer une nouvelle entrée
        cursor.execute("""
            INSERT INTO user_mastery (user_id, topic_id)
            VALUES (?, ?)
        """, (user_id, topic_id))

        conn.commit()

        # Récupérer l'entrée créée
        cursor.execute("""
            SELECT * FROM user_mastery WHERE user_id = ? AND topic_id = ?
        """, (user_id, topic_id))

        row = cursor.fetchone()
        conn.close()

        logger.info(f"✅ Mastery créé: user={user_id}, topic={topic_id}")
        result = dict(row)
        result["success_by_difficulty"] = {"easy": {"correct": 0, "total": 0}, "medium": {"correct": 0, "total": 0}, "hard": {"correct": 0, "total": 0}}
        return result

    def update_mastery_data(
        self,
        user_id: str,
        topic_id: str,
        updates: Dict[str, Any]
    ) -> bool:
        """Met à jour les données de maîtrise"""
        conn = self._get_connection()
        cursor = conn.cursor()

        set_clauses = ", ".join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values()) + [user_id, topic_id]

        cursor.execute(f"""
            UPDATE user_mastery
            SET {set_clauses}, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND topic_id = ?
        """, values)

        conn.commit()
        updated = cursor.rowcount > 0
        conn.close()

        return updated

    def update_success_by_difficulty(
        self,
        user_id: str,
        topic_id: str,
        difficulty: str,
        is_correct: bool
    ) -> Dict[str, float]:
        """
        Met à jour les stats de réussite par difficulté et retourne les success rates calculés.

        Args:
            user_id: ID de l'utilisateur
            topic_id: ID du topic
            difficulty: "easy" | "medium" | "hard"
            is_correct: Si la réponse était correcte

        Returns:
            Dict avec les success rates: {"easy": 0.8, "medium": 0.5, "hard": 0.2}
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        # Récupérer les données actuelles
        cursor.execute("""
            SELECT success_by_difficulty FROM user_mastery
            WHERE user_id = ? AND topic_id = ?
        """, (user_id, topic_id))

        row = cursor.fetchone()
        if not row:
            conn.close()
            return {"easy": 0.0, "medium": 0.0, "hard": 0.0}

        # Parser le JSON
        try:
            stats = json.loads(row["success_by_difficulty"]) if row["success_by_difficulty"] else {}
        except json.JSONDecodeError:
            stats = {}

        # Initialiser si nécessaire
        default_stat = {"correct": 0, "total": 0}
        for d in ["easy", "medium", "hard"]:
            if d not in stats:
                stats[d] = default_stat.copy()

        # Mettre à jour
        stats[difficulty]["total"] += 1
        if is_correct:
            stats[difficulty]["correct"] += 1

        # Sauvegarder
        cursor.execute("""
            UPDATE user_mastery
            SET success_by_difficulty = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND topic_id = ?
        """, (json.dumps(stats), user_id, topic_id))

        conn.commit()
        conn.close()

        # Calculer les success rates
        success_rates = {}
        for d in ["easy", "medium", "hard"]:
            total = stats[d].get("total", 0)
            correct = stats[d].get("correct", 0)
            success_rates[d] = correct / total if total > 0 else 0.0

        logger.debug(f"📊 Success by difficulty updated: {success_rates}")
        return success_rates

    def get_success_rates_by_difficulty(self, user_id: str, topic_id: str) -> Dict[str, float]:
        """Récupère les success rates par difficulté"""
        mastery = self.get_or_create_mastery(user_id, topic_id)
        stats = mastery.get("success_by_difficulty", {})

        success_rates = {}
        for d in ["easy", "medium", "hard"]:
            if d in stats:
                total = stats[d].get("total", 0)
                correct = stats[d].get("correct", 0)
                success_rates[d] = correct / total if total > 0 else 0.0
            else:
                success_rates[d] = 0.0

        return success_rates

    def get_user_all_mastery(self, user_id: str) -> List[Dict[str, Any]]:
        """Récupère toutes les données de maîtrise d'un utilisateur"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM user_mastery
            WHERE user_id = ?
            ORDER BY mastery_level DESC
        """, (user_id,))

        rows = cursor.fetchall()
        conn.close()

        return [dict(row) for row in rows]

    def get_topics_due_for_review(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Récupère les topics à réviser (next_review dépassé)"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM user_mastery
            WHERE user_id = ?
            AND (next_review IS NULL OR next_review <= datetime('now'))
            ORDER BY next_review ASC
            LIMIT ?
        """, (user_id, limit))

        rows = cursor.fetchall()
        conn.close()

        return [dict(row) for row in rows]

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

    # ═══════════════════════════════════════════════════════════════════════════
    # 🕐 CHRONOTYPE DETECTION - Optimal Learning Time
    # ═══════════════════════════════════════════════════════════════════════════

    def record_session_performance(
        self,
        user_id: str,
        is_correct: bool,
        response_time: int,
        mastery_change: int
    ) -> None:
        """
        Enregistre la performance d'une réponse pour l'analyse chronotype.
        Appelé après chaque réponse pour construire le profil temporel.
        """
        now = datetime.now()
        hour = now.hour
        day_of_week = now.weekday()  # 0=Lundi, 6=Dimanche

        conn = self._get_connection()
        cursor = conn.cursor()

        # Upsert: créer ou mettre à jour les stats pour cette heure/jour
        cursor.execute("""
            INSERT INTO session_performance_by_hour
            (user_id, hour, day_of_week, total_attempts, correct_attempts,
             avg_response_time, total_mastery_change, session_count)
            VALUES (?, ?, ?, 1, ?, ?, ?, 1)
            ON CONFLICT(user_id, hour, day_of_week) DO UPDATE SET
                total_attempts = total_attempts + 1,
                correct_attempts = correct_attempts + ?,
                avg_response_time = (avg_response_time * total_attempts + ?) / (total_attempts + 1),
                total_mastery_change = total_mastery_change + ?,
                session_count = session_count + 1,
                updated_at = CURRENT_TIMESTAMP
        """, (
            user_id, hour, day_of_week,
            1 if is_correct else 0, response_time, mastery_change,
            1 if is_correct else 0, response_time, mastery_change
        ))

        conn.commit()
        conn.close()

    def calculate_chronotype(self, user_id: str) -> Dict[str, Any]:
        """
        Calcule le chronotype de l'utilisateur basé sur ses performances.

        Returns:
            {
                "chronotype": "morning" | "evening" | "neutral",
                "best_hours": [9, 10, 11],
                "worst_hours": [14, 15],
                "optimal_session_length": 25,
                "confidence": 0.75,
                "recommendation": "Tu es 23% plus efficace le matin entre 9h et 11h"
            }
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        # Récupérer toutes les stats par heure
        cursor.execute("""
            SELECT hour,
                   SUM(total_attempts) as attempts,
                   SUM(correct_attempts) as correct,
                   AVG(avg_response_time) as avg_time,
                   SUM(total_mastery_change) as mastery_gain
            FROM session_performance_by_hour
            WHERE user_id = ?
            GROUP BY hour
            HAVING attempts >= 3
            ORDER BY hour
        """, (user_id,))

        rows = cursor.fetchall()
        conn.close()

        if len(rows) < 3:
            # Pas assez de données
            return {
                "chronotype": "unknown",
                "best_hours": [],
                "worst_hours": [],
                "optimal_session_length": 25,
                "confidence": 0.0,
                "data_points": sum(r["attempts"] for r in rows) if rows else 0,
                "recommendation": "Continue à pratiquer pour que je puisse détecter tes heures optimales!"
            }

        # Calculer le score de performance pour chaque heure
        # Score = (success_rate * 0.5) + (mastery_per_attempt * 0.3) + (speed_score * 0.2)
        hour_scores = []
        total_attempts = sum(r["attempts"] for r in rows)

        for row in rows:
            success_rate = row["correct"] / max(1, row["attempts"])
            mastery_per_attempt = row["mastery_gain"] / max(1, row["attempts"])
            # Speed score inversé (moins de temps = meilleur)
            avg_time = row["avg_time"] or 30
            speed_score = max(0, 1 - (avg_time / 120))  # Normaliser sur 2 minutes

            # Score composite
            score = (success_rate * 0.5) + (mastery_per_attempt / 20 * 0.3) + (speed_score * 0.2)

            hour_scores.append({
                "hour": row["hour"],
                "score": score,
                "success_rate": success_rate,
                "attempts": row["attempts"]
            })

        # Trier par score
        hour_scores.sort(key=lambda x: x["score"], reverse=True)

        # Déterminer les meilleures et pires heures
        best_hours = [h["hour"] for h in hour_scores[:3]]
        worst_hours = [h["hour"] for h in hour_scores[-2:]] if len(hour_scores) > 2 else []

        # Déterminer le chronotype
        avg_best_hour = sum(best_hours) / len(best_hours)
        if avg_best_hour < 12:
            chronotype = "morning"
            emoji = "🌅"
        elif avg_best_hour > 17:
            chronotype = "evening"
            emoji = "🌙"
        else:
            chronotype = "neutral"
            emoji = "☀️"

        # Calculer la confiance (basée sur le nombre de données)
        confidence = min(1.0, total_attempts / 100)

        # Calculer l'amélioration potentielle
        if len(hour_scores) >= 2:
            best_sr = hour_scores[0]["success_rate"]
            avg_sr = sum(h["success_rate"] for h in hour_scores) / len(hour_scores)
            improvement = int((best_sr - avg_sr) / max(0.01, avg_sr) * 100)
        else:
            improvement = 0

        # Générer la recommandation
        best_range = f"{min(best_hours)}h-{max(best_hours)}h"
        recommendation = f"{emoji} Tu es {improvement}% plus efficace {best_range}. C'est ton moment optimal pour apprendre!"

        result = {
            "chronotype": chronotype,
            "best_hours": best_hours,
            "worst_hours": worst_hours,
            "optimal_session_length": 25,  # Pomodoro standard
            "confidence": round(confidence, 2),
            "data_points": total_attempts,
            "improvement_potential": improvement,
            "recommendation": recommendation
        }

        # Sauvegarder le profil
        self._save_chronotype(user_id, result)

        return result

    def _save_chronotype(self, user_id: str, data: Dict[str, Any]) -> None:
        """Sauvegarde le profil chronotype"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO user_chronotype
            (user_id, chronotype, best_hours, worst_hours, confidence_score, data_points)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                chronotype = ?,
                best_hours = ?,
                worst_hours = ?,
                confidence_score = ?,
                data_points = ?,
                last_calculated = CURRENT_TIMESTAMP
        """, (
            user_id, data["chronotype"], json.dumps(data["best_hours"]),
            json.dumps(data["worst_hours"]), data["confidence"], data["data_points"],
            data["chronotype"], json.dumps(data["best_hours"]),
            json.dumps(data["worst_hours"]), data["confidence"], data["data_points"]
        ))

        conn.commit()
        conn.close()

    def get_chronotype(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Récupère le profil chronotype sauvegardé"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM user_chronotype WHERE user_id = ?
        """, (user_id,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        result = dict(row)
        result["best_hours"] = json.loads(result["best_hours"]) if result["best_hours"] else []
        result["worst_hours"] = json.loads(result["worst_hours"]) if result["worst_hours"] else []
        return result

    def is_optimal_learning_time(self, user_id: str) -> Dict[str, Any]:
        """
        Vérifie si c'est un bon moment pour apprendre.

        Returns:
            {
                "is_optimal": True/False,
                "current_hour": 10,
                "message": "C'est ton meilleur moment! 🌅",
                "suggestion": None ou "Tu serais 15% plus efficace à 10h"
            }
        """
        current_hour = datetime.now().hour
        chronotype = self.get_chronotype(user_id)

        if not chronotype or chronotype.get("confidence_score", 0) < 0.3:
            return {
                "is_optimal": True,  # Pas assez de données, ne pas décourager
                "current_hour": current_hour,
                "message": "Continue à pratiquer pour que je détecte tes heures optimales!",
                "suggestion": None
            }

        best_hours = chronotype.get("best_hours", [])
        worst_hours = chronotype.get("worst_hours", [])

        if current_hour in best_hours:
            return {
                "is_optimal": True,
                "current_hour": current_hour,
                "message": f"🌟 C'est ton meilleur moment pour apprendre! ({current_hour}h)",
                "suggestion": None
            }
        elif current_hour in worst_hours:
            best_hour = best_hours[0] if best_hours else 10
            return {
                "is_optimal": False,
                "current_hour": current_hour,
                "message": f"😴 Ce n'est pas ton heure la plus productive ({current_hour}h)",
                "suggestion": f"Tu serais plus efficace vers {best_hour}h"
            }
        else:
            return {
                "is_optimal": True,
                "current_hour": current_hour,
                "message": "Bon moment pour apprendre!",
                "suggestion": None
            }

    # ═══════════════════════════════════════════════════════════════════════════
    # 🧠 KNOWLEDGE GRAPH - Prerequisites & Dependencies
    # ═══════════════════════════════════════════════════════════════════════════

    def add_prerequisite(
        self,
        course_id: str,
        concept_id: str,
        prerequisite_id: str,
        strength: float = 1.0,
        auto_detected: bool = False
    ) -> bool:
        """Ajoute une relation prérequis entre deux concepts"""
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT INTO concept_prerequisites
                (course_id, concept_id, prerequisite_id, strength, auto_detected)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(course_id, concept_id, prerequisite_id) DO UPDATE SET
                    strength = ?,
                    auto_detected = ?
            """, (course_id, concept_id, prerequisite_id, strength, auto_detected,
                  strength, auto_detected))

            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"Error adding prerequisite: {e}")
            conn.close()
            return False

    def get_prerequisites(self, course_id: str, concept_id: str) -> List[Dict[str, Any]]:
        """Récupère les prérequis d'un concept"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT cp.prerequisite_id, cp.strength, cp.auto_detected,
                   c.concept as name, c.mastery_level
            FROM concept_prerequisites cp
            LEFT JOIN concepts c ON c.id = cp.prerequisite_id
            WHERE cp.course_id = ? AND cp.concept_id = ?
            ORDER BY cp.strength DESC
        """, (course_id, concept_id))

        rows = cursor.fetchall()
        conn.close()

        return [dict(row) for row in rows]

    def get_missing_prerequisites(
        self,
        user_id: str,
        course_id: str,
        concept_id: str,
        min_mastery: int = 40
    ) -> List[Dict[str, Any]]:
        """
        Trouve les prérequis non maîtrisés pour un concept.

        Args:
            user_id: ID utilisateur
            course_id: ID du cours
            concept_id: Concept cible
            min_mastery: Niveau de maîtrise minimum requis (défaut 40%)

        Returns:
            Liste des prérequis manquants avec leur niveau de maîtrise actuel
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT cp.prerequisite_id, cp.strength,
                   c.concept as name,
                   COALESCE(um.mastery_level, 0) as current_mastery
            FROM concept_prerequisites cp
            LEFT JOIN concepts c ON c.id = cp.prerequisite_id
            LEFT JOIN user_mastery um ON um.topic_id = cp.prerequisite_id
                                      AND um.user_id = ?
            WHERE cp.course_id = ? AND cp.concept_id = ?
              AND COALESCE(um.mastery_level, 0) < ?
            ORDER BY cp.strength DESC
        """, (user_id, course_id, concept_id, min_mastery))

        rows = cursor.fetchall()
        conn.close()

        return [dict(row) for row in rows]

    def get_learning_path(
        self,
        user_id: str,
        course_id: str,
        target_concept_id: str
    ) -> List[Dict[str, Any]]:
        """
        Génère un chemin d'apprentissage optimal vers un concept cible.
        Utilise un tri topologique pour respecter les prérequis.

        Returns:
            Liste ordonnée des concepts à apprendre
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        # Récupérer tous les prérequis récursivement (jusqu'à 5 niveaux)
        cursor.execute("""
            WITH RECURSIVE prereq_chain(concept_id, prereq_id, depth) AS (
                -- Base: prérequis directs
                SELECT concept_id, prerequisite_id, 1
                FROM concept_prerequisites
                WHERE course_id = ? AND concept_id = ?

                UNION ALL

                -- Récursif: prérequis des prérequis
                SELECT cp.concept_id, cp.prerequisite_id, pc.depth + 1
                FROM concept_prerequisites cp
                JOIN prereq_chain pc ON cp.concept_id = pc.prereq_id
                WHERE cp.course_id = ? AND pc.depth < 5
            )
            SELECT DISTINCT prereq_id as concept_id, MAX(depth) as depth
            FROM prereq_chain
            GROUP BY prereq_id
            ORDER BY depth DESC
        """, (course_id, target_concept_id, course_id))

        prereqs = cursor.fetchall()

        # Récupérer la maîtrise de chaque concept
        result = []
        for prereq in prereqs:
            cursor.execute("""
                SELECT c.id, c.concept as name, c.category,
                       COALESCE(um.mastery_level, 0) as mastery
                FROM concepts c
                LEFT JOIN user_mastery um ON um.topic_id = c.id AND um.user_id = ?
                WHERE c.id = ?
            """, (user_id, prereq["concept_id"]))

            row = cursor.fetchone()
            if row:
                data = dict(row)
                data["depth"] = prereq["depth"]
                data["needs_review"] = data["mastery"] < 40
                result.append(data)

        conn.close()

        # Ajouter le concept cible à la fin
        result.append({
            "id": target_concept_id,
            "name": "Target Concept",
            "depth": 0,
            "needs_review": False
        })

        return result

    # ═══════════════════════════════════════════════════════════════════════════
    # 🎨 LEARNING STYLE DETECTION
    # ═══════════════════════════════════════════════════════════════════════════

    def get_or_create_learning_style(self, user_id: str) -> Dict[str, Any]:
        """Récupère ou crée le profil de style d'apprentissage"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM user_learning_style WHERE user_id = ?
        """, (user_id,))

        row = cursor.fetchone()

        if row:
            conn.close()
            result = dict(row)
            result["format_preferences"] = json.loads(result["format_preferences"]) if result["format_preferences"] else {}
            return result

        # Créer un nouveau profil
        cursor.execute("""
            INSERT INTO user_learning_style (user_id) VALUES (?)
        """, (user_id,))
        conn.commit()

        cursor.execute("""
            SELECT * FROM user_learning_style WHERE user_id = ?
        """, (user_id,))

        row = cursor.fetchone()
        conn.close()

        result = dict(row)
        result["format_preferences"] = {}
        return result

    def record_learning_style_response(
        self,
        user_id: str,
        question_format: str,
        was_correct: bool,
        response_time: int,
        perceived_difficulty: str = None
    ) -> None:
        """
        Enregistre une réponse pour la calibration du style d'apprentissage.

        question_format: "visual" | "text" | "code" | "audio" | "diagram"
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO learning_style_responses
            (user_id, question_format, was_correct, response_time, perceived_difficulty)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, question_format, was_correct, response_time, perceived_difficulty))

        conn.commit()
        conn.close()

        # Recalculer le style après chaque réponse
        self._recalculate_learning_style(user_id)

    def _recalculate_learning_style(self, user_id: str) -> None:
        """Recalcule les scores de style d'apprentissage"""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Mapping des formats vers les styles VARK
        format_to_style = {
            "visual": "visual",
            "diagram": "visual",
            "image": "visual",
            "text": "reading",
            "definition": "reading",
            "code": "kinesthetic",
            "exercise": "kinesthetic",
            "audio": "auditory",
            "explanation": "auditory"
        }

        # Récupérer les stats par format
        cursor.execute("""
            SELECT question_format,
                   COUNT(*) as total,
                   SUM(CASE WHEN was_correct THEN 1 ELSE 0 END) as correct,
                   AVG(response_time) as avg_time
            FROM learning_style_responses
            WHERE user_id = ?
            GROUP BY question_format
        """, (user_id,))

        rows = cursor.fetchall()

        if not rows:
            conn.close()
            return

        # Calculer les scores par style
        style_scores = {
            "visual": {"total": 0, "correct": 0, "time": 0},
            "auditory": {"total": 0, "correct": 0, "time": 0},
            "reading": {"total": 0, "correct": 0, "time": 0},
            "kinesthetic": {"total": 0, "correct": 0, "time": 0}
        }

        for row in rows:
            fmt = row["question_format"]
            style = format_to_style.get(fmt, "reading")

            style_scores[style]["total"] += row["total"]
            style_scores[style]["correct"] += row["correct"]
            style_scores[style]["time"] += row["avg_time"] * row["total"]

        # Calculer les scores normalisés (success_rate + speed_bonus)
        final_scores = {}
        for style, data in style_scores.items():
            if data["total"] > 0:
                success_rate = data["correct"] / data["total"]
                avg_time = data["time"] / data["total"]
                speed_score = max(0, 1 - (avg_time / 60))  # Normaliser sur 1 minute

                # Score = 70% success + 30% speed
                final_scores[style] = (success_rate * 0.7) + (speed_score * 0.3)
            else:
                final_scores[style] = 0.25  # Default

        # Normaliser pour que la somme = 1
        total = sum(final_scores.values())
        if total > 0:
            for style in final_scores:
                final_scores[style] = final_scores[style] / total

        # Déterminer le style dominant
        dominant = max(final_scores, key=final_scores.get)
        confidence = final_scores[dominant] - 0.25  # Au-dessus de random (25%)

        total_responses = sum(s["total"] for s in style_scores.values())

        # Sauvegarder
        cursor.execute("""
            UPDATE user_learning_style
            SET visual_score = ?,
                auditory_score = ?,
                reading_score = ?,
                kinesthetic_score = ?,
                dominant_style = ?,
                calibration_questions_answered = ?,
                confidence_score = ?,
                last_calibrated = CURRENT_TIMESTAMP
            WHERE user_id = ?
        """, (
            final_scores["visual"],
            final_scores["auditory"],
            final_scores["reading"],
            final_scores["kinesthetic"],
            dominant,
            total_responses,
            max(0, min(1, confidence * 2)),  # Scale to 0-1
            user_id
        ))

        conn.commit()
        conn.close()

    def get_recommended_format(self, user_id: str) -> Dict[str, Any]:
        """
        Recommande le format de question optimal pour cet utilisateur.

        Returns:
            {
                "recommended_format": "visual",
                "style_scores": {"visual": 0.4, "reading": 0.3, ...},
                "confidence": 0.75,
                "suggestion": "Tu apprends mieux avec des diagrammes et images"
            }
        """
        style = self.get_or_create_learning_style(user_id)

        format_mapping = {
            "visual": ["diagram", "image", "flowchart"],
            "auditory": ["explanation", "analogy"],
            "reading": ["text", "definition", "documentation"],
            "kinesthetic": ["code", "exercise", "interactive"]
        }

        suggestions = {
            "visual": "Tu apprends mieux avec des diagrammes et schémas 📊",
            "auditory": "Tu retiens mieux les explications et analogies 🎧",
            "reading": "Tu préfères les définitions et textes structurés 📚",
            "kinesthetic": "Tu apprends mieux en pratiquant (code, exercices) 💻"
        }

        dominant = style.get("dominant_style", "unknown")
        confidence = style.get("confidence_score", 0)

        if dominant == "unknown" or confidence < 0.2:
            return {
                "recommended_format": "mixed",
                "style_scores": {
                    "visual": style.get("visual_score", 0.25),
                    "auditory": style.get("auditory_score", 0.25),
                    "reading": style.get("reading_score", 0.25),
                    "kinesthetic": style.get("kinesthetic_score", 0.25)
                },
                "confidence": confidence,
                "formats": ["text", "code", "diagram"],
                "suggestion": "Continue à pratiquer pour que je détecte ton style optimal!"
            }

        return {
            "recommended_format": dominant,
            "style_scores": {
                "visual": style.get("visual_score", 0.25),
                "auditory": style.get("auditory_score", 0.25),
                "reading": style.get("reading_score", 0.25),
                "kinesthetic": style.get("kinesthetic_score", 0.25)
            },
            "confidence": confidence,
            "formats": format_mapping.get(dominant, ["text"]),
            "suggestion": suggestions.get(dominant, "")
        }

    # ═══════════════════════════════════════════════════════════════════════════
    # 🧠 GENERATION EFFECT - Force generation before seeing options
    # ═══════════════════════════════════════════════════════════════════════════

    def record_generation_response(
        self,
        user_id: str,
        question_id: str,
        topic_id: str,
        difficulty: str,
        generated_answer: str,
        generation_time: int,
        keywords_matched: List[str],
        keywords_total: int,
        generation_quality: float,
        pre_generation_confidence: float = None,
        selected_answer: str = None,
        selection_time: int = 0,
        is_correct: bool = False,
        was_consistent: bool = False,
        generation_bonus: int = 0,
        consistency_bonus: int = 0,
        total_xp: int = 0,
        mastery_change: int = 0
    ) -> int:
        """
        Enregistre une réponse complète du Generation Effect (phases 1 & 2).

        Args:
            user_id: ID de l'utilisateur
            question_id: ID de la question
            topic_id: ID du topic
            difficulty: Difficulté de la question
            generated_answer: Réponse générée par l'élève (phase 1)
            generation_time: Temps de génération en secondes
            keywords_matched: Mots-clés trouvés dans la génération
            keywords_total: Nombre total de mots-clés attendus
            generation_quality: Score de qualité 0-1
            pre_generation_confidence: Confiance avant de voir les options
            selected_answer: Réponse QCM sélectionnée (phase 2)
            selection_time: Temps de sélection
            is_correct: Réponse finale correcte?
            was_consistent: Génération cohérente avec la sélection?
            generation_bonus: XP bonus pour bonne génération
            consistency_bonus: XP bonus pour cohérence
            total_xp: XP total gagné
            mastery_change: Changement de maîtrise

        Returns:
            ID de l'enregistrement créé
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT INTO generation_effect_responses
                (user_id, question_id, topic_id, difficulty,
                 generated_answer, generation_time, keywords_matched, keywords_total,
                 generation_quality, pre_generation_confidence,
                 selected_answer, selection_time, is_correct,
                 was_consistent, generation_bonus, consistency_bonus,
                 total_xp, mastery_change)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id, question_id, topic_id, difficulty,
                generated_answer, generation_time, json.dumps(keywords_matched), keywords_total,
                generation_quality, pre_generation_confidence,
                selected_answer, selection_time, is_correct,
                was_consistent, generation_bonus, consistency_bonus,
                total_xp, mastery_change
            ))

            record_id = cursor.lastrowid
            conn.commit()

            # Mettre à jour les stats agrégées
            self._update_generation_stats(user_id, generation_quality, was_consistent,
                                         generation_bonus, consistency_bonus, is_correct)

            conn.close()
            logger.info(f"📝 Generation Effect recorded: user={user_id}, quality={generation_quality:.2f}")
            return record_id

        except Exception as e:
            logger.error(f"Error recording generation response: {e}")
            conn.close()
            return -1

    def _update_generation_stats(
        self,
        user_id: str,
        generation_quality: float,
        was_consistent: bool,
        generation_bonus: int,
        consistency_bonus: int,
        is_correct: bool
    ) -> None:
        """Met à jour les stats agrégées de génération pour un utilisateur."""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Récupérer les stats actuelles
        cursor.execute("""
            SELECT * FROM user_generation_stats WHERE user_id = ?
        """, (user_id,))

        row = cursor.fetchone()

        if not row:
            # Créer une nouvelle entrée
            cursor.execute("""
                INSERT INTO user_generation_stats
                (user_id, total_generations, avg_generation_quality, avg_consistency_rate,
                 total_generation_bonus, total_consistency_bonus,
                 current_streak, best_streak)
                VALUES (?, 1, ?, ?, ?, ?, ?, ?)
            """, (
                user_id, generation_quality, 1.0 if was_consistent else 0.0,
                generation_bonus, consistency_bonus,
                1 if is_correct else 0, 1 if is_correct else 0
            ))
        else:
            # Mettre à jour les stats existantes
            total = row["total_generations"] + 1
            new_avg_quality = (row["avg_generation_quality"] * row["total_generations"] + generation_quality) / total
            consistency_count = row["avg_consistency_rate"] * row["total_generations"]
            new_consistency_rate = (consistency_count + (1 if was_consistent else 0)) / total

            # Gérer le streak
            new_streak = (row["current_streak"] + 1) if is_correct else 0
            best_streak = max(row["best_streak"], new_streak)

            cursor.execute("""
                UPDATE user_generation_stats
                SET total_generations = ?,
                    avg_generation_quality = ?,
                    avg_consistency_rate = ?,
                    total_generation_bonus = total_generation_bonus + ?,
                    total_consistency_bonus = total_consistency_bonus + ?,
                    current_streak = ?,
                    best_streak = ?,
                    last_generation = CURRENT_TIMESTAMP
                WHERE user_id = ?
            """, (
                total, new_avg_quality, new_consistency_rate,
                generation_bonus, consistency_bonus,
                new_streak, best_streak,
                user_id
            ))

        conn.commit()
        conn.close()

    def get_generation_stats(self, user_id: str) -> Dict[str, Any]:
        """
        Récupère les statistiques de génération d'un utilisateur.

        Returns:
            {
                "total_generations": 50,
                "avg_generation_quality": 0.75,
                "avg_consistency_rate": 0.85,
                "total_generation_bonus": 500,
                "total_consistency_bonus": 250,
                "current_streak": 5,
                "best_streak": 12,
                "retention_boost_estimate": 27.5
            }
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM user_generation_stats WHERE user_id = ?
        """, (user_id,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            return {
                "total_generations": 0,
                "avg_generation_quality": 0.0,
                "avg_consistency_rate": 0.0,
                "total_generation_bonus": 0,
                "total_consistency_bonus": 0,
                "current_streak": 0,
                "best_streak": 0,
                "retention_boost_estimate": 0.0
            }

        result = dict(row)
        # Estimer le boost de rétention basé sur la qualité et la cohérence
        # Recherche montre +25-30% avec generation effect, modulé par la qualité
        base_boost = 25.0
        quality_modifier = result.get("avg_generation_quality", 0) * 10  # +0 à +10%
        result["retention_boost_estimate"] = round(base_boost + quality_modifier, 1)

        return result

    def get_generation_history(
        self,
        user_id: str,
        topic_id: str = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Récupère l'historique des générations d'un utilisateur."""
        conn = self._get_connection()
        cursor = conn.cursor()

        if topic_id:
            cursor.execute("""
                SELECT * FROM generation_effect_responses
                WHERE user_id = ? AND topic_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            """, (user_id, topic_id, limit))
        else:
            cursor.execute("""
                SELECT * FROM generation_effect_responses
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            """, (user_id, limit))

        rows = cursor.fetchall()
        conn.close()

        results = []
        for row in rows:
            data = dict(row)
            # Parser keywords_matched JSON
            if data.get("keywords_matched"):
                try:
                    data["keywords_matched"] = json.loads(data["keywords_matched"])
                except json.JSONDecodeError:
                    data["keywords_matched"] = []
            results.append(data)

        return results

    def calculate_generation_quality(
        self,
        generated_answer: str,
        expected_keywords: List[str],
        correct_answer: str = None
    ) -> Dict[str, Any]:
        """
        Calcule la qualité d'une génération.

        Args:
            generated_answer: Réponse générée par l'élève
            expected_keywords: Mots-clés attendus
            correct_answer: Réponse correcte (optionnel)

        Returns:
            {
                "quality": 0.0-1.0,
                "keywords_matched": ["keyword1", "keyword2"],
                "keywords_missed": ["keyword3"],
                "is_close_match": True/False
            }
        """
        if not generated_answer:
            return {
                "quality": 0.0,
                "keywords_matched": [],
                "keywords_missed": expected_keywords,
                "is_close_match": False
            }

        answer_lower = generated_answer.lower()
        matched = []
        missed = []

        # 🔍 Utilise fuzzy matching pour tolérer variations et fautes de frappe
        for keyword in expected_keywords:
            if fuzzy_keyword_match(keyword, generated_answer):
                matched.append(keyword)
            else:
                missed.append(keyword)

        # Calculer le score de qualité
        keyword_score = len(matched) / max(1, len(expected_keywords))

        # Bonus pour longueur raisonnable (pas trop court)
        word_count = len(generated_answer.split())
        length_score = min(1.0, word_count / 10)  # 10+ mots = score max

        # Score combiné
        quality = (keyword_score * 0.7) + (length_score * 0.3)

        # Vérifier si proche de la bonne réponse
        is_close_match = False
        if correct_answer:
            correct_lower = correct_answer.lower()
            # Vérifier si la génération contient des éléments clés de la réponse
            correct_words = set(correct_lower.split())
            generated_words = set(answer_lower.split())
            overlap = len(correct_words & generated_words) / max(1, len(correct_words))
            is_close_match = overlap > 0.5

        return {
            "quality": round(quality, 2),
            "keywords_matched": matched,
            "keywords_missed": missed,
            "is_close_match": is_close_match
        }

    def should_use_generation_mode(self, user_id: str, topic_id: str) -> Dict[str, Any]:
        """
        Détermine si le mode Generation Effect devrait être utilisé.

        Critères:
        - Utilisateur a un minimum de maîtrise (>30%)
        - Pas trop de générations récentes (éviter fatigue)
        - Performance récente suggère que c'est bénéfique

        Returns:
            {
                "recommended": True/False,
                "reason": "...",
                "frequency_suggestion": "every_3_questions"
            }
        """
        # Récupérer la maîtrise
        mastery = self.get_or_create_mastery(user_id, topic_id)
        mastery_level = mastery.get("mastery_level", 0)

        # Récupérer les stats de génération
        gen_stats = self.get_generation_stats(user_id)

        # Récupérer les générations récentes pour ce topic
        recent = self.get_generation_history(user_id, topic_id, limit=5)

        # Critères de décision
        reasons = []

        # 1. Niveau de maîtrise minimum
        if mastery_level < 30:
            return {
                "recommended": False,
                "reason": "Maîtrise trop faible - focus d'abord sur les bases",
                "frequency_suggestion": "none"
            }

        # 2. Qualité historique
        avg_quality = gen_stats.get("avg_generation_quality", 0)
        if gen_stats["total_generations"] >= 5 and avg_quality < 0.3:
            return {
                "recommended": False,
                "reason": "Les générations précédentes étaient difficiles - continue avec le QCM classique",
                "frequency_suggestion": "occasionally"
            }

        # 3. Éviter la fatigue (pas plus de 3 générations sur les 5 dernières)
        if len(recent) >= 3:
            return {
                "recommended": False,
                "reason": "Tu as fait beaucoup de générations récemment - variété!",
                "frequency_suggestion": "after_break"
            }

        # 4. Recommander selon le niveau
        if mastery_level >= 60:
            return {
                "recommended": True,
                "reason": "Ton niveau est bon - la génération va renforcer la rétention!",
                "frequency_suggestion": "every_2_questions"
            }
        else:
            return {
                "recommended": True,
                "reason": "Essaie de générer ta réponse avant de voir les options",
                "frequency_suggestion": "every_3_questions"
            }

    # ═══════════════════════════════════════════════════════════════════════════
    # 🔄 INTERLEAVING - Alterner entre plusieurs topics pour +15-20% rétention
    # ═══════════════════════════════════════════════════════════════════════════

    def create_interleaving_session(
        self,
        session_id: str,
        user_id: str,
        course_id: str,
        topic_ids: List[str],
        switch_frequency: int = 2
    ) -> Dict[str, Any]:
        """
        Crée une session d'interleaving avec plusieurs topics.

        Args:
            session_id: ID unique de la session
            user_id: ID de l'utilisateur
            course_id: ID du cours
            topic_ids: Liste des topics à alterner (min 2)
            switch_frequency: Nombre de questions avant de changer de topic

        Returns:
            Session créée avec infos
        """
        if len(topic_ids) < 2:
            raise ValueError("Interleaving requires at least 2 topics")

        conn = self._get_connection()
        cursor = conn.cursor()

        # Calculer le bénéfice estimé selon le nombre de topics
        # Plus de topics = plus de bénéfice (jusqu'à un certain point)
        benefit_by_topics = {
            2: 0.12,  # +12%
            3: 0.15,  # +15%
            4: 0.18,  # +18%
            5: 0.20   # +20% (max)
        }
        estimated_benefit = benefit_by_topics.get(min(len(topic_ids), 5), 0.20)

        try:
            cursor.execute("""
                INSERT INTO interleaving_sessions
                (session_id, user_id, course_id, topic_ids, switch_frequency,
                 estimated_benefit, topic_history)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                session_id, user_id, course_id,
                json.dumps(topic_ids), switch_frequency,
                estimated_benefit, json.dumps([])
            ))

            conn.commit()
            conn.close()

            logger.info(f"🔄 Interleaving session created: {session_id} with {len(topic_ids)} topics")

            return {
                "session_id": session_id,
                "user_id": user_id,
                "course_id": course_id,
                "topic_ids": topic_ids,
                "current_topic_idx": 0,
                "current_topic": topic_ids[0],
                "switch_frequency": switch_frequency,
                "estimated_benefit": estimated_benefit,
                "status": "active",
                "message": f"Session interleaving démarrée avec {len(topic_ids)} topics (+{int(estimated_benefit*100)}% rétention estimée)"
            }

        except Exception as e:
            logger.error(f"Error creating interleaving session: {e}")
            conn.close()
            raise

    def get_interleaving_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Récupère une session d'interleaving."""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM interleaving_sessions WHERE session_id = ?
        """, (session_id,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        result = dict(row)
        result["topic_ids"] = json.loads(result.get("topic_ids", "[]"))
        result["topic_history"] = json.loads(result.get("topic_history", "[]"))

        # Ajouter le topic actuel
        if result["topic_ids"]:
            result["current_topic"] = result["topic_ids"][result["current_topic_idx"] % len(result["topic_ids"])]

        return result

    def get_next_interleaving_topic(self, session_id: str) -> Dict[str, Any]:
        """
        Détermine le prochain topic pour une question interleaving.

        Logique:
        - Après switch_frequency questions sur un topic, passe au suivant
        - Retourne le topic actuel + si on doit switch

        Returns:
            {
                "topic_id": "topic-123",
                "topic_idx": 0,
                "should_switch": False,
                "questions_on_current": 2,
                "switch_frequency": 3
            }
        """
        session = self.get_interleaving_session(session_id)
        if not session:
            raise ValueError(f"Interleaving session not found: {session_id}")

        topic_ids = session["topic_ids"]
        current_idx = session["current_topic_idx"]
        switch_freq = session["switch_frequency"]
        questions_answered = session["questions_answered"]
        topic_history = session["topic_history"]

        # Compter les questions sur le topic actuel
        questions_on_current = 0
        for topic in reversed(topic_history):
            if topic == topic_ids[current_idx]:
                questions_on_current += 1
            else:
                break

        # Déterminer si on doit switch
        should_switch = questions_on_current >= switch_freq

        if should_switch:
            # Passer au topic suivant (round-robin)
            next_idx = (current_idx + 1) % len(topic_ids)
        else:
            next_idx = current_idx

        return {
            "topic_id": topic_ids[next_idx],
            "topic_idx": next_idx,
            "should_switch": should_switch,
            "questions_on_current": questions_on_current,
            "switch_frequency": switch_freq,
            "total_topics": len(topic_ids)
        }

    def record_interleaving_answer(
        self,
        session_id: str,
        topic_id: str,
        is_correct: bool
    ) -> Dict[str, Any]:
        """
        Enregistre une réponse dans une session d'interleaving.

        Met à jour:
        - questions_answered
        - correct_answers
        - topic_history
        - current_topic_idx (si switch)

        Returns:
            {
                "next_topic": "topic-456",
                "switched": True,
                "interleaving_bonus": 1.15
            }
        """
        session = self.get_interleaving_session(session_id)
        if not session:
            raise ValueError(f"Interleaving session not found: {session_id}")

        conn = self._get_connection()
        cursor = conn.cursor()

        topic_ids = session["topic_ids"]
        topic_history = session["topic_history"]
        topic_history.append(topic_id)

        # Déterminer le prochain topic
        next_info = self.get_next_interleaving_topic(session_id)

        # Mettre à jour la session
        new_questions = session["questions_answered"] + 1
        new_correct = session["correct_answers"] + (1 if is_correct else 0)
        new_idx = next_info["topic_idx"] if next_info["should_switch"] else session["current_topic_idx"]

        cursor.execute("""
            UPDATE interleaving_sessions
            SET questions_answered = ?,
                correct_answers = ?,
                topic_history = ?,
                current_topic_idx = ?
            WHERE session_id = ?
        """, (
            new_questions, new_correct,
            json.dumps(topic_history), new_idx,
            session_id
        ))

        conn.commit()
        conn.close()

        # Calculer le bonus d'interleaving (appliqué au mastery change)
        # Le bonus augmente légèrement avec le nombre de switches
        switches = sum(1 for i in range(1, len(topic_history)) if topic_history[i] != topic_history[i-1])
        base_bonus = 1.0 + session["estimated_benefit"]  # 1.15 à 1.20
        switch_bonus = min(0.05, switches * 0.005)  # +0.5% par switch, max +5%
        interleaving_bonus = base_bonus + switch_bonus

        return {
            "next_topic": topic_ids[new_idx],
            "switched": next_info["should_switch"],
            "interleaving_bonus": round(interleaving_bonus, 3),
            "questions_answered": new_questions,
            "success_rate": new_correct / max(1, new_questions)
        }

    def end_interleaving_session(self, session_id: str) -> Dict[str, Any]:
        """
        Termine une session d'interleaving et met à jour les stats utilisateur.

        Returns:
            Résumé de la session avec bénéfices mesurés
        """
        session = self.get_interleaving_session(session_id)
        if not session:
            raise ValueError(f"Interleaving session not found: {session_id}")

        conn = self._get_connection()
        cursor = conn.cursor()

        # Marquer la session comme terminée
        cursor.execute("""
            UPDATE interleaving_sessions
            SET status = 'completed',
                ended_at = CURRENT_TIMESTAMP
            WHERE session_id = ?
        """, (session_id,))

        # Mettre à jour les stats utilisateur
        user_id = session["user_id"]
        questions = session["questions_answered"]
        correct = session["correct_answers"]
        success_rate = correct / max(1, questions)

        cursor.execute("""
            SELECT * FROM user_interleaving_stats WHERE user_id = ?
        """, (user_id,))
        stats_row = cursor.fetchone()

        if not stats_row:
            cursor.execute("""
                INSERT INTO user_interleaving_stats
                (user_id, total_interleaving_sessions, total_questions_interleaved,
                 avg_success_rate, topics_interleaved)
                VALUES (?, 1, ?, ?, ?)
            """, (
                user_id, questions, success_rate,
                json.dumps(session["topic_ids"])
            ))
        else:
            # Mettre à jour les moyennes
            total_sessions = stats_row["total_interleaving_sessions"] + 1
            total_questions = stats_row["total_questions_interleaved"] + questions
            new_avg_sr = (stats_row["avg_success_rate"] * stats_row["total_interleaving_sessions"] + success_rate) / total_sessions

            # Merger les topics
            existing_topics = json.loads(stats_row["topics_interleaved"] or "[]")
            all_topics = list(set(existing_topics + session["topic_ids"]))

            cursor.execute("""
                UPDATE user_interleaving_stats
                SET total_interleaving_sessions = ?,
                    total_questions_interleaved = ?,
                    avg_success_rate = ?,
                    topics_interleaved = ?,
                    last_interleaving = CURRENT_TIMESTAMP
                WHERE user_id = ?
            """, (
                total_sessions, total_questions, new_avg_sr,
                json.dumps(all_topics), user_id
            ))

        conn.commit()
        conn.close()

        # Calculer le nombre de switches effectués
        topic_history = session["topic_history"]
        switches = sum(1 for i in range(1, len(topic_history)) if topic_history[i] != topic_history[i-1])

        return {
            "session_id": session_id,
            "questions_answered": questions,
            "correct_answers": correct,
            "success_rate": round(success_rate * 100, 1),
            "topics_practiced": len(session["topic_ids"]),
            "topic_switches": switches,
            "estimated_retention_boost": round(session["estimated_benefit"] * 100, 1),
            "message": f"Session terminée! {questions} questions sur {len(session['topic_ids'])} topics (+{round(session['estimated_benefit'] * 100)}% rétention)"
        }

    def get_interleaving_stats(self, user_id: str) -> Dict[str, Any]:
        """Récupère les statistiques d'interleaving d'un utilisateur."""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM user_interleaving_stats WHERE user_id = ?
        """, (user_id,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            return {
                "total_interleaving_sessions": 0,
                "total_questions_interleaved": 0,
                "avg_success_rate": 0.0,
                "retention_boost_measured": 0.0,
                "preferred_switch_frequency": 2,
                "topics_interleaved": [],
                "recommendation": "Essaie l'interleaving pour améliorer ta rétention de 15-20%!"
            }

        result = dict(row)
        result["topics_interleaved"] = json.loads(result.get("topics_interleaved", "[]"))

        # Ajouter une recommandation basée sur les stats
        if result["total_interleaving_sessions"] >= 5:
            if result["avg_success_rate"] >= 0.7:
                result["recommendation"] = "L'interleaving fonctionne bien pour toi! Continue!"
            else:
                result["recommendation"] = "Essaie de réduire la fréquence de switch pour consolider"
        else:
            result["recommendation"] = "Continue à pratiquer l'interleaving pour voir les bénéfices"

        return result

    def should_suggest_interleaving(self, user_id: str, current_topic_id: str) -> Dict[str, Any]:
        """
        Détermine si l'interleaving devrait être suggéré à l'utilisateur.

        Critères:
        - L'utilisateur a plusieurs topics avec maîtrise suffisante (>30%)
        - Pas déjà en session interleaving
        - Plateau détecté ou performance stagnante

        Returns:
            {
                "suggested": True/False,
                "reason": "...",
                "available_topics": ["topic1", "topic2", ...],
                "estimated_benefit": 0.15
            }
        """
        # Récupérer tous les topics de l'utilisateur
        all_mastery = self.get_user_all_mastery(user_id)

        # Filtrer les topics avec maîtrise suffisante (>30%)
        eligible_topics = [
            m["topic_id"] for m in all_mastery
            if m.get("mastery_level", 0) >= 30 and m["topic_id"] != current_topic_id
        ]

        if len(eligible_topics) < 1:
            return {
                "suggested": False,
                "reason": "Pas assez de topics maîtrisés pour l'interleaving",
                "available_topics": [],
                "estimated_benefit": 0
            }

        # Vérifier si pas déjà en session interleaving active
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COUNT(*) as count FROM interleaving_sessions
            WHERE user_id = ? AND status = 'active'
        """, (user_id,))
        active = cursor.fetchone()["count"]
        conn.close()

        if active > 0:
            return {
                "suggested": False,
                "reason": "Tu as déjà une session interleaving active",
                "available_topics": eligible_topics,
                "estimated_benefit": 0
            }

        # Récupérer mastery du topic actuel
        current_mastery = self.get_or_create_mastery(user_id, current_topic_id)

        # Suggérer si:
        # 1. Maîtrise du topic actuel >= 50% (consolidation)
        # 2. OU stagnation détectée (success_rate entre 40-75%)
        mastery_level = current_mastery.get("mastery_level", 0)
        success_rate = current_mastery.get("success_rate", 0)

        is_consolidating = mastery_level >= 50
        is_stagnating = 0.4 <= success_rate <= 0.75 and current_mastery.get("total_attempts", 0) >= 10

        if is_consolidating or is_stagnating:
            # Inclure le topic actuel dans la liste
            all_topics = [current_topic_id] + eligible_topics[:3]  # Max 4 topics

            benefit = {2: 0.12, 3: 0.15, 4: 0.18}.get(len(all_topics), 0.15)

            reason = "Tu maîtrises bien ce topic - l'interleaving va renforcer ta mémoire!" if is_consolidating else "Tu sembles stagner - l'interleaving peut aider à débloquer!"

            return {
                "suggested": True,
                "reason": reason,
                "available_topics": all_topics,
                "estimated_benefit": benefit,
                "message": f"Alterne entre {len(all_topics)} topics pour +{int(benefit*100)}% de rétention!"
            }

        return {
            "suggested": False,
            "reason": "Continue à progresser sur ce topic d'abord",
            "available_topics": [current_topic_id] + eligible_topics,
            "estimated_benefit": 0
        }


# Instance globale
learning_db = LearningDatabase()
