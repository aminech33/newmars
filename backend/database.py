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
DB_PATH = Path(__file__).parent / "learning.db"


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


# Instance globale
db = Database()
