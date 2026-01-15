"""
💾 Database Manager - SQLite pour Learning System
Gère tous les aspects de persistance:
- Concepts & Knowledge Base
- Messages (Technical & Language)
- Vocabulary avec SM-2++
- Exercises tracking
"""

import sqlite3
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Path vers la base de données
DB_PATH = Path(__file__).parent / "database.db"


class Database:
    """Manager principal de la base de données SQLite"""
    
    def __init__(self, db_path: str = str(DB_PATH)):
        self.db_path = db_path
        self._init_db()
    
    def _get_connection(self):
        """Crée une connexion à la base de données"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Permet d'accéder aux colonnes par nom
        return conn
    
    def _init_db(self):
        """Initialise les tables si elles n'existent pas"""
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
                keywords TEXT,  -- JSON array
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
                role TEXT NOT NULL,  -- 'user' or 'assistant'
                content TEXT NOT NULL,
                code_context TEXT,  -- JSON
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
        
        # Table: completed_exercises (Language exercises tracking)
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

        # ═══════════════════════════════════════════════════════════════
        # HEALTH TABLES
        # ═══════════════════════════════════════════════════════════════

        # Table: weight_entries (Suivi du poids)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS weight_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL DEFAULT 'default',
                date TEXT NOT NULL,
                weight REAL NOT NULL,
                fat_mass_percent REAL,
                muscle_mass REAL,
                bone_mass REAL,
                water_percent REAL,
                heart_rate INTEGER,
                source TEXT DEFAULT 'manual',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, date)
            )
        """)

        # Table: meals (Repas)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS meals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL DEFAULT 'default',
                date TEXT NOT NULL,
                time TEXT,
                meal_type TEXT NOT NULL,
                name TEXT,
                calories REAL DEFAULT 0,
                protein REAL DEFAULT 0,
                carbs REAL DEFAULT 0,
                fat REAL DEFAULT 0,
                fiber REAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Table: meal_foods (Aliments d'un repas)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS meal_foods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                meal_id INTEGER NOT NULL,
                food_id TEXT NOT NULL,
                food_name TEXT NOT NULL,
                grams REAL NOT NULL,
                calories REAL DEFAULT 0,
                protein REAL DEFAULT 0,
                carbs REAL DEFAULT 0,
                fat REAL DEFAULT 0,
                FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
            )
        """)

        # Table: hydration_entries (Suivi hydratation)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS hydration_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL DEFAULT 'default',
                date TEXT NOT NULL,
                time TEXT,
                amount_ml INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Table: user_health_profile (Profil santé utilisateur)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_health_profile (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL UNIQUE DEFAULT 'default',
                height_cm REAL,
                age INTEGER,
                gender TEXT,
                activity_level TEXT DEFAULT 'moderate',
                goal TEXT DEFAULT 'maintain',
                target_weight REAL,
                target_calories INTEGER,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # ═══════════════════════════════════════════════════════════════
        # TASKS TABLES
        # ═══════════════════════════════════════════════════════════════

        # Table: projects (Projets)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL DEFAULT 'default',
                name TEXT NOT NULL,
                color TEXT DEFAULT '#6366f1',
                icon TEXT DEFAULT '🚀',
                status TEXT DEFAULT 'todo',
                linked_course_id TEXT,
                has_phases BOOLEAN DEFAULT 0,
                phase_count INTEGER DEFAULT 0,
                archived BOOLEAN DEFAULT 0,
                ai_plan TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Table: tasks (Tâches)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL DEFAULT 'default',
                project_id TEXT,
                title TEXT NOT NULL,
                description TEXT,
                category TEXT DEFAULT 'personal',
                status TEXT DEFAULT 'todo',
                priority TEXT DEFAULT 'medium',
                effort TEXT DEFAULT 'S',
                due_date TEXT,
                estimated_time INTEGER,
                actual_time INTEGER,
                completed BOOLEAN DEFAULT 0,
                completed_at TIMESTAMP,
                is_visible BOOLEAN DEFAULT 1,
                is_priority BOOLEAN DEFAULT 0,
                temporal_column TEXT DEFAULT 'today',
                phase_index INTEGER,
                is_validation BOOLEAN DEFAULT 0,
                focus_score REAL DEFAULT 0,
                tags TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
            )
        """)

        # Table: subtasks (Sous-tâches)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS subtasks (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                title TEXT NOT NULL,
                completed BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            )
        """)

        # Table: task_relations (Relations entre tâches)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS task_relations (
                id TEXT PRIMARY KEY,
                from_task_id TEXT NOT NULL,
                to_task_id TEXT NOT NULL,
                relation_type TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (from_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (to_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                UNIQUE(from_task_id, to_task_id, relation_type)
            )
        """)

        # Table: categories (Catégories personnalisées)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL DEFAULT 'default',
                label TEXT NOT NULL,
                emoji TEXT DEFAULT '📁',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, label)
            )
        """)

        # Table: pomodoro_sessions (Sessions Pomodoro)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pomodoro_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL DEFAULT 'default',
                task_id TEXT,
                project_id TEXT,
                course_id TEXT,
                book_id TEXT,
                duration INTEGER NOT NULL,
                actual_duration INTEGER,
                session_type TEXT DEFAULT 'focus',
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                date TEXT NOT NULL,
                interrupted BOOLEAN DEFAULT 0,
                interruptions INTEGER DEFAULT 0,
                notes TEXT,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
            )
        """)

        conn.commit()
        conn.close()
        logger.info(f"✅ Database initialized at {self.db_path}")
    
    # ═══════════════════════════════════════════════════════════════
    # CONCEPTS - Knowledge Base
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
            # Parser le JSON keywords
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
            # Concept déjà existant
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
        
        logger.debug(f"Updated mastery for concept {concept_id} → {mastery_level}%")
    
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
        """Archive les anciens messages (garde les N plus récents)"""
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
        """Récupère les messages récents (non archivés)"""
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
    
    def get_archived_language_messages(self, course_id: str, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Récupère les messages archivés"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM language_messages
            WHERE course_id = ? AND archived = 1
            ORDER BY timestamp DESC
            LIMIT ? OFFSET ?
        """, (course_id, limit, offset))
        
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
        
        # Récupérer les données actuelles
        cursor.execute("SELECT * FROM vocabulary WHERE id = ?", (word_id,))
        word = cursor.fetchone()
        
        if not word:
            conn.close()
            return False
        
        # Calcul SM-2++
        ease_factor = word['ease_factor']
        interval = word['interval']
        repetitions = word['repetitions']
        
        # Mise à jour ease_factor
        ease_factor = max(1.3, ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
        
        # Mise à jour interval
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
        
        # Nouvelle mastery (0-100)
        mastery_level = min(100, repetitions * 15 + quality * 5)
        
        # Prochaine révision
        next_review = datetime.now() + timedelta(days=interval)
        
        # Mise à jour
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
    # HEALTH - WEIGHT ENTRIES
    # ═══════════════════════════════════════════════════════════════

    def get_weight_entries(self, user_id: str = 'default', limit: int = 100) -> List[Dict[str, Any]]:
        """Récupère les entrées de poids"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM weight_entries
            WHERE user_id = ?
            ORDER BY date DESC
            LIMIT ?
        """, (user_id, limit))

        rows = cursor.fetchall()
        conn.close()

        return [dict(row) for row in rows]

    def add_weight_entry(self, data: Dict[str, Any], user_id: str = 'default') -> int:
        """Ajoute une entrée de poids"""
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT OR REPLACE INTO weight_entries
                (user_id, date, weight, fat_mass_percent, muscle_mass, bone_mass,
                 water_percent, heart_rate, source, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                data['date'],
                data['weight'],
                data.get('fat_mass_percent'),
                data.get('muscle_mass'),
                data.get('bone_mass'),
                data.get('water_percent'),
                data.get('heart_rate'),
                data.get('source', 'manual'),
                data.get('notes')
            ))

            conn.commit()
            entry_id = cursor.lastrowid
            conn.close()

            logger.info(f"✅ Weight entry added: {data['weight']}kg on {data['date']}")
            return entry_id

        except Exception as e:
            logger.error(f"Error adding weight entry: {e}")
            conn.close()
            return -1

    def delete_weight_entry(self, entry_id: int, user_id: str = 'default') -> bool:
        """Supprime une entrée de poids"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            DELETE FROM weight_entries
            WHERE id = ? AND user_id = ?
        """, (entry_id, user_id))

        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()

        return deleted

    def get_weight_stats(self, user_id: str = 'default') -> Dict[str, Any]:
        """Statistiques de poids"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                COUNT(*) as total_entries,
                MIN(weight) as min_weight,
                MAX(weight) as max_weight,
                AVG(weight) as avg_weight,
                (SELECT weight FROM weight_entries WHERE user_id = ? ORDER BY date DESC LIMIT 1) as current_weight,
                (SELECT weight FROM weight_entries WHERE user_id = ? ORDER BY date ASC LIMIT 1) as first_weight
            FROM weight_entries
            WHERE user_id = ?
        """, (user_id, user_id, user_id))

        row = cursor.fetchone()
        conn.close()

        return dict(row) if row else {}

    # ═══════════════════════════════════════════════════════════════
    # HEALTH - MEALS
    # ═══════════════════════════════════════════════════════════════

    def get_meals(self, user_id: str = 'default', date: str = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Récupère les repas"""
        conn = self._get_connection()
        cursor = conn.cursor()

        if date:
            cursor.execute("""
                SELECT * FROM meals
                WHERE user_id = ? AND date = ?
                ORDER BY time ASC
            """, (user_id, date))
        else:
            cursor.execute("""
                SELECT * FROM meals
                WHERE user_id = ?
                ORDER BY date DESC, time ASC
                LIMIT ?
            """, (user_id, limit))

        rows = cursor.fetchall()

        # Récupérer les aliments pour chaque repas
        meals = []
        for row in rows:
            meal = dict(row)
            cursor.execute("""
                SELECT * FROM meal_foods WHERE meal_id = ?
            """, (meal['id'],))
            meal['foods'] = [dict(f) for f in cursor.fetchall()]
            meals.append(meal)

        conn.close()
        return meals

    def add_meal(self, data: Dict[str, Any], user_id: str = 'default') -> int:
        """Ajoute un repas avec ses aliments"""
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            # Calculer les totaux
            total_calories = sum(f.get('calories', 0) for f in data.get('foods', []))
            total_protein = sum(f.get('protein', 0) for f in data.get('foods', []))
            total_carbs = sum(f.get('carbs', 0) for f in data.get('foods', []))
            total_fat = sum(f.get('fat', 0) for f in data.get('foods', []))

            cursor.execute("""
                INSERT INTO meals
                (user_id, date, time, meal_type, name, calories, protein, carbs, fat)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                data['date'],
                data.get('time'),
                data['meal_type'],
                data.get('name'),
                total_calories,
                total_protein,
                total_carbs,
                total_fat
            ))

            meal_id = cursor.lastrowid

            # Ajouter les aliments
            for food in data.get('foods', []):
                cursor.execute("""
                    INSERT INTO meal_foods
                    (meal_id, food_id, food_name, grams, calories, protein, carbs, fat)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    meal_id,
                    food.get('food_id', ''),
                    food['food_name'],
                    food['grams'],
                    food.get('calories', 0),
                    food.get('protein', 0),
                    food.get('carbs', 0),
                    food.get('fat', 0)
                ))

            conn.commit()
            conn.close()

            logger.info(f"✅ Meal added: {data['meal_type']} ({total_calories} kcal)")
            return meal_id

        except Exception as e:
            logger.error(f"Error adding meal: {e}")
            conn.close()
            return -1

    def delete_meal(self, meal_id: int, user_id: str = 'default') -> bool:
        """Supprime un repas et ses aliments"""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Les meal_foods sont supprimés en cascade
        cursor.execute("""
            DELETE FROM meals
            WHERE id = ? AND user_id = ?
        """, (meal_id, user_id))

        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()

        return deleted

    def get_daily_nutrition(self, user_id: str = 'default', date: str = None) -> Dict[str, Any]:
        """Statistiques nutrition d'une journée"""
        conn = self._get_connection()
        cursor = conn.cursor()

        if not date:
            date = datetime.now().strftime('%Y-%m-%d')

        cursor.execute("""
            SELECT
                COUNT(*) as meals_count,
                COALESCE(SUM(calories), 0) as total_calories,
                COALESCE(SUM(protein), 0) as total_protein,
                COALESCE(SUM(carbs), 0) as total_carbs,
                COALESCE(SUM(fat), 0) as total_fat,
                COALESCE(SUM(fiber), 0) as total_fiber
            FROM meals
            WHERE user_id = ? AND date = ?
        """, (user_id, date))

        row = cursor.fetchone()
        conn.close()

        result = dict(row) if row else {}
        result['date'] = date
        return result

    # ═══════════════════════════════════════════════════════════════
    # HEALTH - HYDRATION
    # ═══════════════════════════════════════════════════════════════

    def add_hydration(self, amount_ml: int, user_id: str = 'default', date: str = None, time: str = None) -> int:
        """Ajoute une entrée d'hydratation"""
        conn = self._get_connection()
        cursor = conn.cursor()

        if not date:
            date = datetime.now().strftime('%Y-%m-%d')
        if not time:
            time = datetime.now().strftime('%H:%M')

        try:
            cursor.execute("""
                INSERT INTO hydration_entries (user_id, date, time, amount_ml)
                VALUES (?, ?, ?, ?)
            """, (user_id, date, time, amount_ml))

            conn.commit()
            entry_id = cursor.lastrowid
            conn.close()

            return entry_id

        except Exception as e:
            logger.error(f"Error adding hydration: {e}")
            conn.close()
            return -1

    def get_daily_hydration(self, user_id: str = 'default', date: str = None) -> Dict[str, Any]:
        """Total d'hydratation d'une journée"""
        conn = self._get_connection()
        cursor = conn.cursor()

        if not date:
            date = datetime.now().strftime('%Y-%m-%d')

        cursor.execute("""
            SELECT
                COUNT(*) as entries_count,
                COALESCE(SUM(amount_ml), 0) as total_ml
            FROM hydration_entries
            WHERE user_id = ? AND date = ?
        """, (user_id, date))

        row = cursor.fetchone()
        conn.close()

        result = dict(row) if row else {'entries_count': 0, 'total_ml': 0}
        result['date'] = date
        return result

    # ═══════════════════════════════════════════════════════════════
    # HEALTH - USER PROFILE
    # ═══════════════════════════════════════════════════════════════

    def get_health_profile(self, user_id: str = 'default') -> Dict[str, Any]:
        """Récupère le profil santé"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM user_health_profile WHERE user_id = ?
        """, (user_id,))

        row = cursor.fetchone()
        conn.close()

        return dict(row) if row else {}

    def update_health_profile(self, data: Dict[str, Any], user_id: str = 'default') -> bool:
        """Met à jour le profil santé"""
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT INTO user_health_profile
                (user_id, height_cm, age, gender, activity_level, goal, target_weight, target_calories)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    height_cm = excluded.height_cm,
                    age = excluded.age,
                    gender = excluded.gender,
                    activity_level = excluded.activity_level,
                    goal = excluded.goal,
                    target_weight = excluded.target_weight,
                    target_calories = excluded.target_calories,
                    updated_at = CURRENT_TIMESTAMP
            """, (
                user_id,
                data.get('height_cm'),
                data.get('age'),
                data.get('gender'),
                data.get('activity_level', 'moderate'),
                data.get('goal', 'maintain'),
                data.get('target_weight'),
                data.get('target_calories')
            ))

            conn.commit()
            conn.close()
            return True

        except Exception as e:
            logger.error(f"Error updating health profile: {e}")
            conn.close()
            return False

    # ═══════════════════════════════════════════════════════════════
    # TASKS - PROJECTS
    # ═══════════════════════════════════════════════════════════════

    def get_projects(self, user_id: str = 'default', include_archived: bool = False) -> List[Dict[str, Any]]:
        """Récupère tous les projets"""
        conn = self._get_connection()
        cursor = conn.cursor()

        if include_archived:
            cursor.execute("""
                SELECT * FROM projects WHERE user_id = ?
                ORDER BY updated_at DESC
            """, (user_id,))
        else:
            cursor.execute("""
                SELECT * FROM projects WHERE user_id = ? AND archived = 0
                ORDER BY updated_at DESC
            """, (user_id,))

        rows = cursor.fetchall()
        projects = []
        for row in rows:
            project = dict(row)
            if project.get('ai_plan'):
                project['ai_plan'] = json.loads(project['ai_plan'])
            projects.append(project)

        conn.close()
        return projects

    def get_project(self, project_id: str, user_id: str = 'default') -> Optional[Dict[str, Any]]:
        """Récupère un projet par ID"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM projects WHERE id = ? AND user_id = ?
        """, (project_id, user_id))

        row = cursor.fetchone()
        conn.close()

        if row:
            project = dict(row)
            if project.get('ai_plan'):
                project['ai_plan'] = json.loads(project['ai_plan'])
            return project
        return None

    def add_project(self, data: Dict[str, Any], user_id: str = 'default') -> str:
        """Ajoute un projet"""
        conn = self._get_connection()
        cursor = conn.cursor()

        project_id = data.get('id') or f"proj-{int(datetime.now().timestamp() * 1000)}"
        ai_plan = json.dumps(data.get('ai_plan')) if data.get('ai_plan') else None

        try:
            cursor.execute("""
                INSERT INTO projects
                (id, user_id, name, color, icon, status, linked_course_id,
                 has_phases, phase_count, archived, ai_plan)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                project_id,
                user_id,
                data['name'],
                data.get('color', '#6366f1'),
                data.get('icon', '🚀'),
                data.get('status', 'todo'),
                data.get('linked_course_id'),
                data.get('has_phases', False),
                data.get('phase_count', 0),
                data.get('archived', False),
                ai_plan
            ))

            conn.commit()
            conn.close()
            logger.info(f"✅ Project added: {data['name']}")
            return project_id

        except Exception as e:
            logger.error(f"Error adding project: {e}")
            conn.close()
            return ""

    def update_project(self, project_id: str, data: Dict[str, Any], user_id: str = 'default') -> bool:
        """Met à jour un projet"""
        conn = self._get_connection()
        cursor = conn.cursor()

        ai_plan = json.dumps(data.get('ai_plan')) if 'ai_plan' in data else None

        try:
            fields = []
            values = []

            for key in ['name', 'color', 'icon', 'status', 'linked_course_id',
                        'has_phases', 'phase_count', 'archived']:
                if key in data:
                    fields.append(f"{key} = ?")
                    values.append(data[key])

            if ai_plan:
                fields.append("ai_plan = ?")
                values.append(ai_plan)

            fields.append("updated_at = CURRENT_TIMESTAMP")
            values.extend([project_id, user_id])

            cursor.execute(f"""
                UPDATE projects SET {', '.join(fields)}
                WHERE id = ? AND user_id = ?
            """, values)

            conn.commit()
            updated = cursor.rowcount > 0
            conn.close()
            return updated

        except Exception as e:
            logger.error(f"Error updating project: {e}")
            conn.close()
            return False

    def delete_project(self, project_id: str, user_id: str = 'default') -> bool:
        """Supprime un projet"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            DELETE FROM projects WHERE id = ? AND user_id = ?
        """, (project_id, user_id))

        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return deleted

    # ═══════════════════════════════════════════════════════════════
    # TASKS - TASKS
    # ═══════════════════════════════════════════════════════════════

    def get_tasks(self, user_id: str = 'default', project_id: str = None,
                  include_completed: bool = True, limit: int = 500) -> List[Dict[str, Any]]:
        """Récupère les tâches"""
        conn = self._get_connection()
        cursor = conn.cursor()

        if project_id:
            if include_completed:
                cursor.execute("""
                    SELECT * FROM tasks WHERE user_id = ? AND project_id = ?
                    ORDER BY created_at DESC LIMIT ?
                """, (user_id, project_id, limit))
            else:
                cursor.execute("""
                    SELECT * FROM tasks WHERE user_id = ? AND project_id = ? AND completed = 0
                    ORDER BY created_at DESC LIMIT ?
                """, (user_id, project_id, limit))
        else:
            if include_completed:
                cursor.execute("""
                    SELECT * FROM tasks WHERE user_id = ?
                    ORDER BY created_at DESC LIMIT ?
                """, (user_id, limit))
            else:
                cursor.execute("""
                    SELECT * FROM tasks WHERE user_id = ? AND completed = 0
                    ORDER BY created_at DESC LIMIT ?
                """, (user_id, limit))

        rows = cursor.fetchall()
        tasks = []

        for row in rows:
            task = dict(row)
            # Récupérer les sous-tâches
            cursor.execute("""
                SELECT * FROM subtasks WHERE task_id = ?
            """, (task['id'],))
            task['subtasks'] = [dict(s) for s in cursor.fetchall()]
            # Parser les tags
            if task.get('tags'):
                task['tags'] = json.loads(task['tags'])
            tasks.append(task)

        conn.close()
        return tasks

    def get_task(self, task_id: str, user_id: str = 'default') -> Optional[Dict[str, Any]]:
        """Récupère une tâche par ID"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM tasks WHERE id = ? AND user_id = ?
        """, (task_id, user_id))

        row = cursor.fetchone()
        if not row:
            conn.close()
            return None

        task = dict(row)
        cursor.execute("""
            SELECT * FROM subtasks WHERE task_id = ?
        """, (task_id,))
        task['subtasks'] = [dict(s) for s in cursor.fetchall()]

        if task.get('tags'):
            task['tags'] = json.loads(task['tags'])

        conn.close()
        return task

    def add_task(self, data: Dict[str, Any], user_id: str = 'default') -> str:
        """Ajoute une tâche"""
        conn = self._get_connection()
        cursor = conn.cursor()

        task_id = data.get('id') or f"task-{int(datetime.now().timestamp() * 1000)}"
        tags = json.dumps(data.get('tags', [])) if data.get('tags') else None

        try:
            cursor.execute("""
                INSERT INTO tasks
                (id, user_id, project_id, title, description, category, status,
                 priority, effort, due_date, estimated_time, actual_time,
                 completed, is_visible, is_priority, temporal_column,
                 phase_index, is_validation, focus_score, tags)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                task_id,
                user_id,
                data.get('project_id'),
                data['title'],
                data.get('description'),
                data.get('category', 'personal'),
                data.get('status', 'todo'),
                data.get('priority', 'medium'),
                data.get('effort', 'S'),
                data.get('due_date'),
                data.get('estimated_time'),
                data.get('actual_time'),
                data.get('completed', False),
                data.get('is_visible', True),
                data.get('is_priority', False),
                data.get('temporal_column', 'today'),
                data.get('phase_index'),
                data.get('is_validation', False),
                data.get('focus_score', 0),
                tags
            ))

            # Ajouter les sous-tâches
            for subtask in data.get('subtasks', []):
                subtask_id = subtask.get('id', f"sub-{int(datetime.now().timestamp() * 1000)}")
                cursor.execute("""
                    INSERT INTO subtasks (id, task_id, title, completed)
                    VALUES (?, ?, ?, ?)
                """, (subtask_id, task_id, subtask['title'], subtask.get('completed', False)))

            conn.commit()
            conn.close()
            logger.info(f"✅ Task added: {data['title']}")
            return task_id

        except Exception as e:
            logger.error(f"Error adding task: {e}")
            conn.close()
            return ""

    def update_task(self, task_id: str, data: Dict[str, Any], user_id: str = 'default') -> bool:
        """Met à jour une tâche"""
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            fields = []
            values = []

            for key in ['project_id', 'title', 'description', 'category', 'status',
                        'priority', 'effort', 'due_date', 'estimated_time', 'actual_time',
                        'completed', 'completed_at', 'is_visible', 'is_priority',
                        'temporal_column', 'phase_index', 'is_validation', 'focus_score']:
                if key in data:
                    fields.append(f"{key} = ?")
                    values.append(data[key])

            if 'tags' in data:
                fields.append("tags = ?")
                values.append(json.dumps(data['tags']) if data['tags'] else None)

            fields.append("updated_at = CURRENT_TIMESTAMP")
            values.extend([task_id, user_id])

            cursor.execute(f"""
                UPDATE tasks SET {', '.join(fields)}
                WHERE id = ? AND user_id = ?
            """, values)

            conn.commit()
            updated = cursor.rowcount > 0
            conn.close()
            return updated

        except Exception as e:
            logger.error(f"Error updating task: {e}")
            conn.close()
            return False

    def delete_task(self, task_id: str, user_id: str = 'default') -> bool:
        """Supprime une tâche (et ses sous-tâches en cascade)"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            DELETE FROM tasks WHERE id = ? AND user_id = ?
        """, (task_id, user_id))

        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return deleted

    def toggle_task(self, task_id: str, user_id: str = 'default') -> Optional[bool]:
        """Toggle le statut d'une tâche"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT completed FROM tasks WHERE id = ? AND user_id = ?
        """, (task_id, user_id))

        row = cursor.fetchone()
        if not row:
            conn.close()
            return None

        new_status = not row['completed']
        completed_at = datetime.now().isoformat() if new_status else None

        cursor.execute("""
            UPDATE tasks SET completed = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
        """, (new_status, completed_at, task_id, user_id))

        conn.commit()
        conn.close()
        return new_status

    # ═══════════════════════════════════════════════════════════════
    # TASKS - SUBTASKS
    # ═══════════════════════════════════════════════════════════════

    def add_subtask(self, task_id: str, data: Dict[str, Any]) -> str:
        """Ajoute une sous-tâche"""
        conn = self._get_connection()
        cursor = conn.cursor()

        subtask_id = data.get('id', f"sub-{int(datetime.now().timestamp() * 1000)}")

        try:
            cursor.execute("""
                INSERT INTO subtasks (id, task_id, title, completed)
                VALUES (?, ?, ?, ?)
            """, (subtask_id, task_id, data['title'], data.get('completed', False)))

            conn.commit()
            conn.close()
            return subtask_id

        except Exception as e:
            logger.error(f"Error adding subtask: {e}")
            conn.close()
            return ""

    def toggle_subtask(self, subtask_id: str) -> Optional[bool]:
        """Toggle une sous-tâche"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT completed FROM subtasks WHERE id = ?
        """, (subtask_id,))

        row = cursor.fetchone()
        if not row:
            conn.close()
            return None

        new_status = not row['completed']
        cursor.execute("""
            UPDATE subtasks SET completed = ? WHERE id = ?
        """, (new_status, subtask_id))

        conn.commit()
        conn.close()
        return new_status

    def delete_subtask(self, subtask_id: str) -> bool:
        """Supprime une sous-tâche"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM subtasks WHERE id = ?", (subtask_id,))

        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return deleted

    # ═══════════════════════════════════════════════════════════════
    # TASKS - RELATIONS
    # ═══════════════════════════════════════════════════════════════

    def get_task_relations(self, task_id: str) -> List[Dict[str, Any]]:
        """Récupère les relations d'une tâche"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM task_relations
            WHERE from_task_id = ? OR to_task_id = ?
        """, (task_id, task_id))

        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def add_task_relation(self, data: Dict[str, Any]) -> str:
        """Ajoute une relation entre tâches"""
        conn = self._get_connection()
        cursor = conn.cursor()

        relation_id = data.get('id', f"rel-{int(datetime.now().timestamp() * 1000)}")

        try:
            cursor.execute("""
                INSERT OR IGNORE INTO task_relations
                (id, from_task_id, to_task_id, relation_type)
                VALUES (?, ?, ?, ?)
            """, (relation_id, data['from_task_id'], data['to_task_id'], data['relation_type']))

            conn.commit()
            conn.close()
            return relation_id

        except Exception as e:
            logger.error(f"Error adding task relation: {e}")
            conn.close()
            return ""

    def delete_task_relation(self, relation_id: str) -> bool:
        """Supprime une relation"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM task_relations WHERE id = ?", (relation_id,))

        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return deleted

    # ═══════════════════════════════════════════════════════════════
    # TASKS - CATEGORIES
    # ═══════════════════════════════════════════════════════════════

    def get_categories(self, user_id: str = 'default') -> List[Dict[str, Any]]:
        """Récupère les catégories"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM categories WHERE user_id = ?
            ORDER BY created_at ASC
        """, (user_id,))

        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def add_category(self, data: Dict[str, Any], user_id: str = 'default') -> str:
        """Ajoute une catégorie"""
        conn = self._get_connection()
        cursor = conn.cursor()

        category_id = data.get('id', f"cat-{int(datetime.now().timestamp() * 1000)}")

        try:
            cursor.execute("""
                INSERT OR IGNORE INTO categories (id, user_id, label, emoji)
                VALUES (?, ?, ?, ?)
            """, (category_id, user_id, data['label'], data.get('emoji', '📁')))

            conn.commit()
            conn.close()
            return category_id

        except Exception as e:
            logger.error(f"Error adding category: {e}")
            conn.close()
            return ""

    def delete_category(self, category_id: str, user_id: str = 'default') -> bool:
        """Supprime une catégorie"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            DELETE FROM categories WHERE id = ? AND user_id = ?
        """, (category_id, user_id))

        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return deleted

    # ═══════════════════════════════════════════════════════════════
    # TASKS - POMODORO SESSIONS
    # ═══════════════════════════════════════════════════════════════

    def get_pomodoro_sessions(self, user_id: str = 'default', date: str = None,
                               limit: int = 100) -> List[Dict[str, Any]]:
        """Récupère les sessions Pomodoro"""
        conn = self._get_connection()
        cursor = conn.cursor()

        if date:
            cursor.execute("""
                SELECT * FROM pomodoro_sessions
                WHERE user_id = ? AND date = ?
                ORDER BY completed_at DESC
            """, (user_id, date))
        else:
            cursor.execute("""
                SELECT * FROM pomodoro_sessions
                WHERE user_id = ?
                ORDER BY completed_at DESC LIMIT ?
            """, (user_id, limit))

        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def add_pomodoro_session(self, data: Dict[str, Any], user_id: str = 'default') -> str:
        """Ajoute une session Pomodoro"""
        conn = self._get_connection()
        cursor = conn.cursor()

        session_id = data.get('id', f"pomo-{int(datetime.now().timestamp() * 1000)}")

        try:
            cursor.execute("""
                INSERT INTO pomodoro_sessions
                (id, user_id, task_id, project_id, course_id, book_id,
                 duration, actual_duration, session_type, started_at,
                 completed_at, date, interrupted, interruptions, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                session_id,
                user_id,
                data.get('task_id'),
                data.get('project_id'),
                data.get('course_id'),
                data.get('book_id'),
                data['duration'],
                data.get('actual_duration'),
                data.get('session_type', 'focus'),
                data.get('started_at'),
                data.get('completed_at', datetime.now().isoformat()),
                data.get('date', datetime.now().strftime('%Y-%m-%d')),
                data.get('interrupted', False),
                data.get('interruptions', 0),
                data.get('notes')
            ))

            conn.commit()
            conn.close()
            logger.info(f"✅ Pomodoro session added: {data['duration']}min")
            return session_id

        except Exception as e:
            logger.error(f"Error adding pomodoro session: {e}")
            conn.close()
            return ""

    # ═══════════════════════════════════════════════════════════════
    # TASKS - STATISTICS
    # ═══════════════════════════════════════════════════════════════

    def get_tasks_stats(self, user_id: str = 'default') -> Dict[str, Any]:
        """Statistiques des tâches"""
        conn = self._get_connection()
        cursor = conn.cursor()

        today = datetime.now().strftime('%Y-%m-%d')

        cursor.execute("""
            SELECT
                COUNT(*) as total_tasks,
                SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_tasks,
                SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending_tasks,
                SUM(CASE WHEN priority = 'urgent' AND completed = 0 THEN 1 ELSE 0 END) as urgent_tasks,
                SUM(CASE WHEN due_date = ? AND completed = 0 THEN 1 ELSE 0 END) as due_today
            FROM tasks
            WHERE user_id = ?
        """, (today, user_id))

        row = cursor.fetchone()
        stats = dict(row) if row else {}

        # Projets
        cursor.execute("""
            SELECT
                COUNT(*) as total_projects,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_projects,
                SUM(CASE WHEN archived = 1 THEN 1 ELSE 0 END) as archived_projects
            FROM projects
            WHERE user_id = ?
        """, (user_id,))

        row = cursor.fetchone()
        stats.update(dict(row) if row else {})

        # Pomodoros aujourd'hui
        cursor.execute("""
            SELECT
                COUNT(*) as sessions_today,
                COALESCE(SUM(actual_duration), 0) as focus_minutes_today
            FROM pomodoro_sessions
            WHERE user_id = ? AND date = ? AND session_type = 'focus'
        """, (user_id, today))

        row = cursor.fetchone()
        stats.update(dict(row) if row else {})

        conn.close()
        return stats

    def get_daily_stats(self, user_id: str = 'default', days: int = 7) -> List[Dict[str, Any]]:
        """Statistiques journalières sur N jours"""
        conn = self._get_connection()
        cursor = conn.cursor()

        stats = []
        for i in range(days):
            date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')

            # Tâches complétées ce jour
            cursor.execute("""
                SELECT COUNT(*) as completed
                FROM tasks
                WHERE user_id = ? AND DATE(completed_at) = ?
            """, (user_id, date))
            tasks_completed = cursor.fetchone()['completed']

            # Minutes de focus
            cursor.execute("""
                SELECT COALESCE(SUM(actual_duration), 0) as minutes
                FROM pomodoro_sessions
                WHERE user_id = ? AND date = ? AND session_type = 'focus'
            """, (user_id, date))
            focus_minutes = cursor.fetchone()['minutes']

            stats.append({
                'date': date,
                'tasks_completed': tasks_completed,
                'focus_minutes': focus_minutes
            })

        conn.close()
        return stats


# Instance globale
db = Database()
