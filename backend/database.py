"""
Base de données SQLite pour persistence des sessions et mastery
"""
import sqlite3
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Chemin de la base de données
DB_PATH = Path(__file__).parent / "learning.db"


class LearningDatabase:
    """Gestionnaire de base de données pour l'apprentissage"""
    
    def __init__(self, db_path: str = str(DB_PATH)):
        self.db_path = db_path
        self._init_db()
    
    def _get_connection(self):
        """Crée une nouvelle connexion à la base de données"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Permet d'accéder aux colonnes par nom
        return conn
    
    def _init_db(self):
        """Initialise les tables si elles n'existent pas"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Table des sessions
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                course_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                topic_ids TEXT NOT NULL,
                current_topic_idx INTEGER DEFAULT 0,
                started_at TEXT NOT NULL,
                questions_answered INTEGER DEFAULT 0,
                correct_answers INTEGER DEFAULT 0,
                xp_earned INTEGER DEFAULT 0,
                question_history TEXT DEFAULT '[]',
                interleaving_enabled BOOLEAN DEFAULT 0,
                switch_frequency INTEGER DEFAULT 2,
                estimated_benefit REAL DEFAULT 0.0,
                streak INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Table de la maîtrise par topic
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS topic_mastery (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                topic_id TEXT NOT NULL,
                mastery_level INTEGER DEFAULT 0,
                ease_factor REAL DEFAULT 2.5,
                interval INTEGER DEFAULT 1,
                repetitions INTEGER DEFAULT 0,
                success_rate REAL DEFAULT 0.0,
                consecutive_skips INTEGER DEFAULT 0,
                total_attempts INTEGER DEFAULT 0,
                correct_attempts INTEGER DEFAULT 0,
                last_practiced TEXT,
                next_review TEXT,
                concepts TEXT DEFAULT '{}',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, topic_id)
            )
        """)
        
        # Table des streaks de révision
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS review_streaks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                course_id TEXT,
                current_streak INTEGER DEFAULT 0,
                longest_streak INTEGER DEFAULT 0,
                last_review_date TEXT,
                total_reviews INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, course_id)
            )
        """)
        
        # Index pour performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_mastery_user ON topic_mastery(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_mastery_user_topic ON topic_mastery(user_id, topic_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_streaks_user ON review_streaks(user_id)")
        
        conn.commit()
        conn.close()
        logger.info(f"✅ Database initialized at {self.db_path}")
    
    # ═══════════════════════════════════════════════════════════════
    # SESSIONS
    # ═══════════════════════════════════════════════════════════════
    
    def save_session(self, session_data: Dict[str, Any]) -> bool:
        """Sauvegarde une session"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT OR REPLACE INTO sessions (
                    id, course_id, user_id, topic_ids, current_topic_idx,
                    started_at, questions_answered, correct_answers, xp_earned,
                    question_history, interleaving_enabled, switch_frequency,
                    estimated_benefit, streak, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                session_data['id'],
                session_data['course_id'],
                session_data['user_id'],
                json.dumps(session_data['topic_ids']),
                session_data['current_topic_idx'],
                session_data['started_at'],
                session_data['questions_answered'],
                session_data['correct_answers'],
                session_data['xp_earned'],
                json.dumps(session_data['question_history']),
                session_data['interleaving_enabled'],
                session_data['switch_frequency'],
                session_data['estimated_benefit'],
                session_data.get('streak', 0),
                datetime.now().isoformat()
            ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"❌ Error saving session: {e}")
            return False
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Récupère une session par ID"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
            row = cursor.fetchone()
            conn.close()
            
            if not row:
                return None
            
            return {
                'id': row['id'],
                'course_id': row['course_id'],
                'user_id': row['user_id'],
                'topic_ids': json.loads(row['topic_ids']),
                'current_topic_idx': row['current_topic_idx'],
                'started_at': row['started_at'],
                'questions_answered': row['questions_answered'],
                'correct_answers': row['correct_answers'],
                'xp_earned': row['xp_earned'],
                'question_history': json.loads(row['question_history']),
                'interleaving_enabled': bool(row['interleaving_enabled']),
                'switch_frequency': row['switch_frequency'],
                'estimated_benefit': row['estimated_benefit'],
                'streak': row['streak']
            }
        except Exception as e:
            logger.error(f"❌ Error getting session: {e}")
            return None
    
    def get_all_sessions(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Récupère toutes les sessions (optionnellement filtrées par user)"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            if user_id:
                cursor.execute("SELECT * FROM sessions WHERE user_id = ? ORDER BY started_at DESC", (user_id,))
            else:
                cursor.execute("SELECT * FROM sessions ORDER BY started_at DESC")
            
            rows = cursor.fetchall()
            conn.close()
            
            sessions = []
            for row in rows:
                sessions.append({
                    'id': row['id'],
                    'course_id': row['course_id'],
                    'user_id': row['user_id'],
                    'topic_ids': json.loads(row['topic_ids']),
                    'questions_answered': row['questions_answered'],
                    'correct_answers': row['correct_answers'],
                    'xp_earned': row['xp_earned'],
                    'started_at': row['started_at']
                })
            
            return sessions
        except Exception as e:
            logger.error(f"❌ Error getting sessions: {e}")
            return []
    
    def delete_session(self, session_id: str) -> bool:
        """Supprime une session"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"❌ Error deleting session: {e}")
            return False
    
    # ═══════════════════════════════════════════════════════════════
    # TOPIC MASTERY
    # ═══════════════════════════════════════════════════════════════
    
    def save_mastery(self, user_id: str, topic_id: str, mastery_data: Dict[str, Any]) -> bool:
        """Sauvegarde la maîtrise d'un topic"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT OR REPLACE INTO topic_mastery (
                    user_id, topic_id, mastery_level, ease_factor, interval,
                    repetitions, success_rate, consecutive_skips, total_attempts,
                    correct_attempts, last_practiced, next_review, concepts, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                topic_id,
                mastery_data['mastery_level'],
                mastery_data['ease_factor'],
                mastery_data['interval'],
                mastery_data['repetitions'],
                mastery_data['success_rate'],
                mastery_data['consecutive_skips'],
                mastery_data['total_attempts'],
                mastery_data['correct_attempts'],
                mastery_data.get('last_practiced'),
                mastery_data.get('next_review'),
                json.dumps(mastery_data.get('concepts', {})),
                datetime.now().isoformat()
            ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"❌ Error saving mastery: {e}")
            return False
    
    def get_mastery(self, user_id: str, topic_id: str) -> Optional[Dict[str, Any]]:
        """Récupère la maîtrise d'un topic"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute(
                "SELECT * FROM topic_mastery WHERE user_id = ? AND topic_id = ?",
                (user_id, topic_id)
            )
            row = cursor.fetchone()
            conn.close()
            
            if not row:
                return None
            
            return {
                'mastery_level': row['mastery_level'],
                'ease_factor': row['ease_factor'],
                'interval': row['interval'],
                'repetitions': row['repetitions'],
                'success_rate': row['success_rate'],
                'consecutive_skips': row['consecutive_skips'],
                'total_attempts': row['total_attempts'],
                'correct_attempts': row['correct_attempts'],
                'last_practiced': row['last_practiced'],
                'next_review': row['next_review'],
                'concepts': json.loads(row['concepts'])
            }
        except Exception as e:
            logger.error(f"❌ Error getting mastery: {e}")
            return None
    
    def get_all_mastery(self, user_id: str) -> Dict[str, Dict[str, Any]]:
        """Récupère toute la maîtrise d'un utilisateur"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM topic_mastery WHERE user_id = ?", (user_id,))
            rows = cursor.fetchall()
            conn.close()
            
            mastery_dict = {}
            for row in rows:
                mastery_dict[row['topic_id']] = {
                    'mastery_level': row['mastery_level'],
                    'ease_factor': row['ease_factor'],
                    'interval': row['interval'],
                    'repetitions': row['repetitions'],
                    'success_rate': row['success_rate'],
                    'consecutive_skips': row['consecutive_skips'],
                    'total_attempts': row['total_attempts'],
                    'correct_attempts': row['correct_attempts'],
                    'last_practiced': row['last_practiced'],
                    'next_review': row['next_review'],
                    'concepts': json.loads(row['concepts'])
                }
            
            return mastery_dict
        except Exception as e:
            logger.error(f"❌ Error getting all mastery: {e}")
            return {}
    
    # ═══════════════════════════════════════════════════════════════
    # REVIEW STREAKS
    # ═══════════════════════════════════════════════════════════════
    
    def update_streak(self, user_id: str, course_id: Optional[str] = None) -> Dict[str, int]:
        """Met à jour le streak de révision"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            today = datetime.now().date().isoformat()
            
            # Récupérer le streak actuel
            cursor.execute(
                "SELECT * FROM review_streaks WHERE user_id = ? AND course_id IS ?",
                (user_id, course_id)
            )
            row = cursor.fetchone()
            
            if not row:
                # Créer nouveau streak
                cursor.execute("""
                    INSERT INTO review_streaks (
                        user_id, course_id, current_streak, longest_streak,
                        last_review_date, total_reviews
                    ) VALUES (?, ?, 1, 1, ?, 1)
                """, (user_id, course_id, today))
                
                conn.commit()
                conn.close()
                return {'current_streak': 1, 'longest_streak': 1, 'total_reviews': 1}
            
            last_review = row['last_review_date']
            current_streak = row['current_streak']
            longest_streak = row['longest_streak']
            total_reviews = row['total_reviews']
            
            # Calculer le nouveau streak
            if last_review == today:
                # Déjà révisé aujourd'hui, pas de changement
                conn.close()
                return {
                    'current_streak': current_streak,
                    'longest_streak': longest_streak,
                    'total_reviews': total_reviews
                }
            
            yesterday = (datetime.now().date() - timedelta(days=1)).isoformat()
            
            if last_review == yesterday:
                # Continuation du streak
                new_streak = current_streak + 1
                new_longest = max(new_streak, longest_streak)
            else:
                # Streak cassé, recommencer à 1
                new_streak = 1
                new_longest = longest_streak
            
            # Mettre à jour
            cursor.execute("""
                UPDATE review_streaks
                SET current_streak = ?, longest_streak = ?,
                    last_review_date = ?, total_reviews = ?,
                    updated_at = ?
                WHERE user_id = ? AND course_id IS ?
            """, (
                new_streak, new_longest, today, total_reviews + 1,
                datetime.now().isoformat(), user_id, course_id
            ))
            
            conn.commit()
            conn.close()
            
            return {
                'current_streak': new_streak,
                'longest_streak': new_longest,
                'total_reviews': total_reviews + 1
            }
        except Exception as e:
            logger.error(f"❌ Error updating streak: {e}")
            return {'current_streak': 0, 'longest_streak': 0, 'total_reviews': 0}
    
    def get_streak(self, user_id: str, course_id: Optional[str] = None) -> Dict[str, int]:
        """Récupère le streak de révision"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute(
                "SELECT * FROM review_streaks WHERE user_id = ? AND course_id IS ?",
                (user_id, course_id)
            )
            row = cursor.fetchone()
            conn.close()
            
            if not row:
                return {'current_streak': 0, 'longest_streak': 0, 'total_reviews': 0}
            
            return {
                'current_streak': row['current_streak'],
                'longest_streak': row['longest_streak'],
                'total_reviews': row['total_reviews']
            }
        except Exception as e:
            logger.error(f"❌ Error getting streak: {e}")
            return {'current_streak': 0, 'longest_streak': 0, 'total_reviews': 0}


# Import pour timedelta
from datetime import timedelta

# Instance globale
db = LearningDatabase()












