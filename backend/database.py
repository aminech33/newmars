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
        
        # Table des concepts (Knowledge Base)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS concepts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                concept TEXT NOT NULL,
                category TEXT,
                definition TEXT,
                example TEXT,
                keywords TEXT,
                course_id TEXT NOT NULL,
                added_at TEXT NOT NULL,
                last_referenced TEXT,
                times_referenced INTEGER DEFAULT 1,
                mastery_level INTEGER DEFAULT 1,
                source TEXT DEFAULT 'ai',
                UNIQUE(concept, course_id)
            )
        """)
        
        # Index pour recherche rapide
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_concept_course 
            ON concepts(concept, course_id)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_course_id 
            ON concepts(course_id)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_last_referenced 
            ON concepts(last_referenced DESC)
        """)
        
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
                success_by_difficulty TEXT DEFAULT '{"easy": 0.0, "medium": 0.0, "hard": 0.0}',
                attempts_by_difficulty TEXT DEFAULT '{"easy": 0, "medium": 0, "hard": 0}',
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
        
        # Table des questions (pour question rating et auto-calibration)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS questions (
                id TEXT PRIMARY KEY,
                topic_id TEXT NOT NULL,
                question_text TEXT NOT NULL,
                target_difficulty TEXT NOT NULL,
                actual_difficulty TEXT,
                total_attempts INTEGER DEFAULT 0,
                correct_attempts INTEGER DEFAULT 0,
                avg_response_time REAL DEFAULT 0.0,
                perceived_too_easy INTEGER DEFAULT 0,
                perceived_just_right INTEGER DEFAULT 0,
                perceived_too_hard INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(target_difficulty, actual_difficulty)")
        
        # Table des messages de cours (pour archivage)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS course_messages (
                id TEXT PRIMARY KEY,
                course_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                is_archived BOOLEAN DEFAULT 0,
                archived_at TEXT,
                metadata TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_course_messages_course ON course_messages(course_id, timestamp DESC)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_archived ON course_messages(is_archived, timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_user ON course_messages(user_id)")
        
        # Table des messages de langues (conversations)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS language_messages (
                id TEXT PRIMARY KEY,
                course_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                translation TEXT,
                corrections TEXT,
                timestamp INTEGER NOT NULL,
                is_archived BOOLEAN DEFAULT 0,
                archived_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_lang_messages_course ON language_messages(course_id, timestamp DESC)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_lang_messages_archived ON language_messages(is_archived, timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_lang_messages_user ON language_messages(user_id)")
        
        # Table du vocabulaire avec spaced repetition (SM-2)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vocabulary (
                id TEXT PRIMARY KEY,
                course_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                word TEXT NOT NULL,
                translation TEXT NOT NULL,
                pronunciation TEXT,
                example TEXT,
                context TEXT,
                ease_factor REAL DEFAULT 2.5,
                interval INTEGER DEFAULT 1,
                repetitions INTEGER DEFAULT 0,
                next_review TEXT,
                last_reviewed TEXT,
                mastery_level INTEGER DEFAULT 0,
                times_reviewed INTEGER DEFAULT 0,
                added_at TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(course_id, user_id, word)
            )
        """)
        
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_vocab_course ON vocabulary(course_id, user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_vocab_review ON vocabulary(next_review, course_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_vocab_word ON vocabulary(word, course_id)")
        
        # Table des exercices complétés
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS completed_exercises (
                id TEXT PRIMARY KEY,
                course_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                exercise_id TEXT NOT NULL,
                exercise_type TEXT NOT NULL,
                score INTEGER,
                max_score INTEGER,
                completed_at TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_exercises_course ON completed_exercises(course_id, user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_exercises_date ON completed_exercises(completed_at DESC)")
        
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
                    correct_attempts, last_practiced, next_review, concepts,
                    success_by_difficulty, attempts_by_difficulty, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                json.dumps(mastery_data.get('success_by_difficulty', {"easy": 0.0, "medium": 0.0, "hard": 0.0})),
                json.dumps(mastery_data.get('attempts_by_difficulty', {"easy": 0, "medium": 0, "hard": 0})),
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
                'concepts': json.loads(row['concepts']),
                'success_by_difficulty': json.loads(row.get('success_by_difficulty', '{"easy": 0.0, "medium": 0.0, "hard": 0.0}')),
                'attempts_by_difficulty': json.loads(row.get('attempts_by_difficulty', '{"easy": 0, "medium": 0, "hard": 0}'))
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
                    'concepts': json.loads(row['concepts']),
                    'success_by_difficulty': json.loads(row.get('success_by_difficulty', '{"easy": 0.0, "medium": 0.0, "hard": 0.0}')),
                    'attempts_by_difficulty': json.loads(row.get('attempts_by_difficulty', '{"easy": 0, "medium": 0, "hard": 0}'))
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


    # ═══════════════════════════════════════════════════════════════
    # QUESTION RATING & AUTO-CALIBRATION
    # ═══════════════════════════════════════════════════════════════
    
    def save_question_stats(self, question_id: str, topic_id: str, question_text: str, 
                           target_difficulty: str) -> bool:
        """Crée ou initialise une question pour le tracking"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT OR IGNORE INTO questions (
                    id, topic_id, question_text, target_difficulty
                ) VALUES (?, ?, ?, ?)
            """, (question_id, topic_id, question_text, target_difficulty))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"❌ Error saving question stats: {e}")
            return False
    
    def update_question_stats(self, question_id: str, is_correct: bool, 
                             response_time: int, perceived_difficulty: Optional[str] = None) -> bool:
        """Met à jour les stats d'une question après une réponse"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Récupérer les stats actuelles
            cursor.execute("SELECT * FROM questions WHERE id = ?", (question_id,))
            row = cursor.fetchone()
            
            if not row:
                conn.close()
                return False
            
            total_attempts = row['total_attempts'] + 1
            correct_attempts = row['correct_attempts'] + (1 if is_correct else 0)
            
            # Moyenne mobile du temps de réponse
            current_avg = row['avg_response_time']
            new_avg = ((current_avg * row['total_attempts']) + response_time) / total_attempts
            
            # Feedback de difficulté perçue
            perceived_too_easy = row['perceived_too_easy']
            perceived_just_right = row['perceived_just_right']
            perceived_too_hard = row['perceived_too_hard']
            
            if perceived_difficulty == "too_easy":
                perceived_too_easy += 1
            elif perceived_difficulty == "just_right":
                perceived_just_right += 1
            elif perceived_difficulty == "too_hard":
                perceived_too_hard += 1
            
            # Auto-calibration de la difficulté réelle
            success_rate = correct_attempts / total_attempts
            actual_difficulty = self._calculate_actual_difficulty(
                success_rate, 
                new_avg, 
                perceived_too_easy, 
                perceived_just_right, 
                perceived_too_hard,
                total_attempts
            )
            
            # Mettre à jour
            cursor.execute("""
                UPDATE questions
                SET total_attempts = ?, correct_attempts = ?, avg_response_time = ?,
                    perceived_too_easy = ?, perceived_just_right = ?, perceived_too_hard = ?,
                    actual_difficulty = ?, updated_at = ?
                WHERE id = ?
            """, (
                total_attempts, correct_attempts, new_avg,
                perceived_too_easy, perceived_just_right, perceived_too_hard,
                actual_difficulty, datetime.now().isoformat(), question_id
            ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"❌ Error updating question stats: {e}")
            return False
    
    def _calculate_actual_difficulty(self, success_rate: float, avg_time: float,
                                     too_easy: int, just_right: int, too_hard: int,
                                     total_attempts: int) -> Optional[str]:
        """Calcule la difficulté réelle basée sur les stats empiriques"""
        
        # Besoin d'au moins 5 tentatives pour calibrer
        if total_attempts < 5:
            return None
        
        # Score basé sur plusieurs facteurs
        score = 0.0
        
        # 1. Success rate (poids: 50%)
        if success_rate > 0.85:
            score += 0  # Facile
        elif success_rate > 0.65:
            score += 0.5  # Moyen
        else:
            score += 1.0  # Difficile
        
        # 2. Temps de réponse (poids: 20%)
        if avg_time < 30:
            score += 0 * 0.4
        elif avg_time < 90:
            score += 0.5 * 0.4
        else:
            score += 1.0 * 0.4
        
        # 3. Feedback utilisateur (poids: 30%)
        total_feedback = too_easy + just_right + too_hard
        if total_feedback >= 3:  # Au moins 3 feedbacks
            if too_easy > just_right and too_easy > too_hard:
                score += 0 * 0.6
            elif too_hard > just_right and too_hard > too_easy:
                score += 1.0 * 0.6
            else:
                score += 0.5 * 0.6
        
        # Mapping du score à la difficulté
        if score < 0.35:
            return "easy"
        elif score < 0.7:
            return "medium"
        else:
            return "hard"
    
    def get_question_stats(self, question_id: str) -> Optional[Dict[str, Any]]:
        """Récupère les stats d'une question"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM questions WHERE id = ?", (question_id,))
            row = cursor.fetchone()
            conn.close()
            
            if not row:
                return None
            
            success_rate = row['correct_attempts'] / row['total_attempts'] if row['total_attempts'] > 0 else 0
            
            return {
                'question_id': row['id'],
                'topic_id': row['topic_id'],
                'target_difficulty': row['target_difficulty'],
                'actual_difficulty': row['actual_difficulty'],
                'total_attempts': row['total_attempts'],
                'success_rate': round(success_rate * 100, 1),
                'avg_response_time': round(row['avg_response_time'], 1),
                'perceived_feedback': {
                    'too_easy': row['perceived_too_easy'],
                    'just_right': row['perceived_just_right'],
                    'too_hard': row['perceived_too_hard']
                },
                'is_miscalibrated': row['actual_difficulty'] != row['target_difficulty'] if row['actual_difficulty'] else False
            }
        except Exception as e:
            logger.error(f"❌ Error getting question stats: {e}")
            return None
    
    def get_miscalibrated_questions(self, topic_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Récupère les questions mal calibrées (actual != target)"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            query = """
                SELECT * FROM questions 
                WHERE actual_difficulty IS NOT NULL 
                AND actual_difficulty != target_difficulty
                AND total_attempts >= 5
            """
            
            if topic_id:
                query += " AND topic_id = ?"
                cursor.execute(query, (topic_id,))
            else:
                cursor.execute(query)
            
            rows = cursor.fetchall()
            conn.close()
            
            results = []
            for row in rows:
                success_rate = row['correct_attempts'] / row['total_attempts'] if row['total_attempts'] > 0 else 0
                results.append({
                    'question_id': row['id'],
                    'question_text': row['question_text'][:100] + '...' if len(row['question_text']) > 100 else row['question_text'],
                    'topic_id': row['topic_id'],
                    'target_difficulty': row['target_difficulty'],
                    'actual_difficulty': row['actual_difficulty'],
                    'success_rate': round(success_rate * 100, 1),
                    'total_attempts': row['total_attempts']
                })
            
            return results
        except Exception as e:
            logger.error(f"❌ Error getting miscalibrated questions: {e}")
            return []


    # ═══════════════════════════════════════════════════════════════
    # COURSE MESSAGES - Archivage automatique
    # ═══════════════════════════════════════════════════════════════
    
    def save_message(self, course_id: str, user_id: str, message: Dict[str, Any]) -> bool:
        """Sauvegarde un message de cours dans la DB"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Extraire metadata
            metadata = {
                'codeBlocks': message.get('codeBlocks', []),
                'liked': message.get('liked', False),
                'savedAsNote': message.get('savedAsNote', False),
                'isStreaming': message.get('isStreaming', False),
                'isError': message.get('isError', False),
                'errorMessage': message.get('errorMessage')
            }
            
            cursor.execute("""
                INSERT OR REPLACE INTO course_messages (
                    id, course_id, user_id, role, content, timestamp, 
                    is_archived, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)
            """, (
                message['id'],
                course_id,
                user_id,
                message['role'],
                message['content'],
                message['timestamp'],
                json.dumps(metadata)
            ))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            logger.error(f"❌ Error saving message: {e}")
            return False
    
    def save_messages_bulk(self, course_id: str, user_id: str, messages: List[Dict[str, Any]]) -> int:
        """Sauvegarde plusieurs messages en bulk (plus efficace)"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            saved_count = 0
            for message in messages:
                metadata = {
                    'codeBlocks': message.get('codeBlocks', []),
                    'liked': message.get('liked', False),
                    'savedAsNote': message.get('savedAsNote', False),
                    'isStreaming': message.get('isStreaming', False),
                    'isError': message.get('isError', False),
                    'errorMessage': message.get('errorMessage')
                }
                
                cursor.execute("""
                    INSERT OR REPLACE INTO course_messages (
                        id, course_id, user_id, role, content, timestamp, 
                        is_archived, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)
                """, (
                    message['id'],
                    course_id,
                    user_id,
                    message['role'],
                    message['content'],
                    message['timestamp'],
                    json.dumps(metadata)
                ))
                saved_count += 1
            
            conn.commit()
            conn.close()
            
            logger.info(f"✅ Saved {saved_count} messages in bulk for course {course_id}")
            return saved_count
            
        except Exception as e:
            logger.error(f"❌ Error saving messages bulk: {e}")
            return 0
    
    def archive_old_messages(self, course_id: str, keep_recent: int = 50) -> int:
        """
        Archive les vieux messages d'un cours en gardant les N plus récents
        Returns: nombre de messages archivés
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Récupérer tous les messages non-archivés, triés par date
            cursor.execute("""
                SELECT id FROM course_messages 
                WHERE course_id = ? AND is_archived = 0
                ORDER BY timestamp DESC
            """, (course_id,))
            
            all_messages = [row['id'] for row in cursor.fetchall()]
            
            if len(all_messages) <= keep_recent:
                conn.close()
                return 0  # Rien à archiver
            
            # Marquer comme archivés tous sauf les N derniers
            messages_to_archive = all_messages[keep_recent:]
            
            if not messages_to_archive:
                conn.close()
                return 0
            
            placeholders = ','.join(['?'] * len(messages_to_archive))
            cursor.execute(f"""
                UPDATE course_messages
                SET is_archived = 1, archived_at = ?
                WHERE id IN ({placeholders})
            """, (datetime.now().isoformat(), *messages_to_archive))
            
            archived_count = cursor.rowcount
            conn.commit()
            conn.close()
            
            logger.info(f"✅ Archived {archived_count} messages for course {course_id}")
            return archived_count
            
        except Exception as e:
            logger.error(f"❌ Error archiving messages: {e}")
            return 0
    
    def get_recent_messages(self, course_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Récupère les N messages les plus récents (non-archivés)"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM course_messages 
                WHERE course_id = ? AND is_archived = 0
                ORDER BY timestamp ASC
                LIMIT ?
            """, (course_id, limit))
            
            rows = cursor.fetchall()
            conn.close()
            
            messages = []
            for row in rows:
                metadata = json.loads(row['metadata']) if row['metadata'] else {}
                messages.append({
                    'id': row['id'],
                    'role': row['role'],
                    'content': row['content'],
                    'timestamp': row['timestamp'],
                    'codeBlocks': metadata.get('codeBlocks', []),
                    'liked': metadata.get('liked', False),
                    'savedAsNote': metadata.get('savedAsNote', False),
                    'isStreaming': metadata.get('isStreaming', False),
                    'isError': metadata.get('isError', False),
                    'errorMessage': metadata.get('errorMessage')
                })
            
            return messages
            
        except Exception as e:
            logger.error(f"❌ Error getting recent messages: {e}")
            return []
    
    def get_archived_messages(self, course_id: str, limit: int = 100, 
                             offset: int = 0) -> List[Dict[str, Any]]:
        """Récupère les messages archivés (pagination pour consultation)"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM course_messages 
                WHERE course_id = ? AND is_archived = 1
                ORDER BY timestamp DESC
                LIMIT ? OFFSET ?
            """, (course_id, limit, offset))
            
            rows = cursor.fetchall()
            conn.close()
            
            messages = []
            for row in rows:
                metadata = json.loads(row['metadata']) if row['metadata'] else {}
                messages.append({
                    'id': row['id'],
                    'role': row['role'],
                    'content': row['content'],
                    'timestamp': row['timestamp'],
                    'archived_at': row['archived_at'],
                    'codeBlocks': metadata.get('codeBlocks', []),
                    'liked': metadata.get('liked', False),
                    'savedAsNote': metadata.get('savedAsNote', False)
                })
            
            return messages
            
        except Exception as e:
            logger.error(f"❌ Error getting archived messages: {e}")
            return []
    
    def get_message_stats(self, course_id: str) -> Dict[str, int]:
        """Récupère les stats de messages pour un cours"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_archived = 0 THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN is_archived = 1 THEN 1 ELSE 0 END) as archived
                FROM course_messages
                WHERE course_id = ?
            """, (course_id,))
            
            row = cursor.fetchone()
            conn.close()
            
            return {
                'total': row['total'] or 0,
                'active': row['active'] or 0,
                'archived': row['archived'] or 0
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting message stats: {e}")
            return {'total': 0, 'active': 0, 'archived': 0}


    # ═══════════════════════════════════════════════════════════════
    # LANGUAGE MESSAGES - Archivage conversations langues
    # ═══════════════════════════════════════════════════════════════
    
    def save_language_message(self, course_id: str, user_id: str, message: Dict[str, Any]) -> bool:
        """Sauvegarde un message de conversation linguistique"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT OR REPLACE INTO language_messages (
                    id, course_id, user_id, role, content, translation,
                    corrections, timestamp, is_archived
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
            """, (
                message['id'],
                course_id,
                user_id,
                message['role'],
                message['content'],
                message.get('translation'),
                json.dumps(message.get('corrections', [])),
                message['timestamp']
            ))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            logger.error(f"❌ Error saving language message: {e}")
            return False
    
    def save_language_messages_bulk(self, course_id: str, user_id: str, messages: List[Dict[str, Any]]) -> int:
        """Sauvegarde plusieurs messages de langue en bulk"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            saved_count = 0
            for message in messages:
                cursor.execute("""
                    INSERT OR REPLACE INTO language_messages (
                        id, course_id, user_id, role, content, translation,
                        corrections, timestamp, is_archived
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
                """, (
                    message['id'],
                    course_id,
                    user_id,
                    message['role'],
                    message['content'],
                    message.get('translation'),
                    json.dumps(message.get('corrections', [])),
                    message['timestamp']
                ))
                saved_count += 1
            
            conn.commit()
            conn.close()
            
            logger.info(f"✅ Saved {saved_count} language messages for course {course_id}")
            return saved_count
            
        except Exception as e:
            logger.error(f"❌ Error saving language messages bulk: {e}")
            return 0
    
    def archive_old_language_messages(self, course_id: str, keep_recent: int = 50) -> int:
        """Archive les vieux messages de langue"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id FROM language_messages 
                WHERE course_id = ? AND is_archived = 0
                ORDER BY timestamp DESC
            """, (course_id,))
            
            all_messages = [row['id'] for row in cursor.fetchall()]
            
            if len(all_messages) <= keep_recent:
                conn.close()
                return 0
            
            messages_to_archive = all_messages[keep_recent:]
            
            if not messages_to_archive:
                conn.close()
                return 0
            
            placeholders = ','.join(['?'] * len(messages_to_archive))
            cursor.execute(f"""
                UPDATE language_messages
                SET is_archived = 1, archived_at = ?
                WHERE id IN ({placeholders})
            """, (datetime.now().isoformat(), *messages_to_archive))
            
            archived_count = cursor.rowcount
            conn.commit()
            conn.close()
            
            logger.info(f"✅ Archived {archived_count} language messages for course {course_id}")
            return archived_count
            
        except Exception as e:
            logger.error(f"❌ Error archiving language messages: {e}")
            return 0
    
    def get_recent_language_messages(self, course_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Récupère les messages de langue récents"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM language_messages 
                WHERE course_id = ? AND is_archived = 0
                ORDER BY timestamp ASC
                LIMIT ?
            """, (course_id, limit))
            
            rows = cursor.fetchall()
            conn.close()
            
            messages = []
            for row in rows:
                messages.append({
                    'id': row['id'],
                    'role': row['role'],
                    'content': row['content'],
                    'translation': row['translation'],
                    'corrections': json.loads(row['corrections']) if row['corrections'] else [],
                    'timestamp': row['timestamp']
                })
            
            return messages
            
        except Exception as e:
            logger.error(f"❌ Error getting recent language messages: {e}")
            return []
    
    def get_archived_language_messages(self, course_id: str, limit: int = 100, 
                                      offset: int = 0) -> List[Dict[str, Any]]:
        """Récupère les messages de langue archivés"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM language_messages 
                WHERE course_id = ? AND is_archived = 1
                ORDER BY timestamp DESC
                LIMIT ? OFFSET ?
            """, (course_id, limit, offset))
            
            rows = cursor.fetchall()
            conn.close()
            
            messages = []
            for row in rows:
                messages.append({
                    'id': row['id'],
                    'role': row['role'],
                    'content': row['content'],
                    'translation': row['translation'],
                    'corrections': json.loads(row['corrections']) if row['corrections'] else [],
                    'timestamp': row['timestamp'],
                    'archived_at': row['archived_at']
                })
            
            return messages
            
        except Exception as e:
            logger.error(f"❌ Error getting archived language messages: {e}")
            return []
    
    def get_language_message_stats(self, course_id: str) -> Dict[str, int]:
        """Récupère les stats de messages de langue"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_archived = 0 THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN is_archived = 1 THEN 1 ELSE 0 END) as archived
                FROM language_messages
                WHERE course_id = ?
            """, (course_id,))
            
            row = cursor.fetchone()
            conn.close()
            
            return {
                'total': row['total'] or 0,
                'active': row['active'] or 0,
                'archived': row['archived'] or 0
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting language message stats: {e}")
            return {'total': 0, 'active': 0, 'archived': 0}
    
    
    # ═══════════════════════════════════════════════════════════════
    # VOCABULARY - Gestion vocabulaire avec Spaced Repetition (SM-2)
    # ═══════════════════════════════════════════════════════════════
    
    def add_vocabulary_word(self, course_id: str, user_id: str, word_data: Dict[str, Any]) -> bool:
        """Ajoute un mot de vocabulaire"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT OR REPLACE INTO vocabulary (
                    id, course_id, user_id, word, translation, pronunciation,
                    example, context, ease_factor, interval, repetitions,
                    next_review, last_reviewed, mastery_level, times_reviewed, added_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                word_data.get('id', f"word-{datetime.now().timestamp()}"),
                course_id,
                user_id,
                word_data['word'],
                word_data['translation'],
                word_data.get('pronunciation'),
                word_data.get('example'),
                word_data.get('context', ''),
                word_data.get('easeFactor', 2.5),
                word_data.get('interval', 1),
                word_data.get('repetitions', 0),
                word_data.get('nextReview'),
                word_data.get('lastReviewed'),
                word_data.get('mastery_level', 0),
                word_data.get('times_reviewed', 0),
                word_data.get('addedAt', datetime.now().isoformat())
            ))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            logger.error(f"❌ Error adding vocabulary word: {e}")
            return False
    
    def get_vocabulary(self, course_id: str, user_id: str, limit: int = None) -> List[Dict[str, Any]]:
        """Récupère tout le vocabulaire d'un cours"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            query = """
                SELECT * FROM vocabulary 
                WHERE course_id = ? AND user_id = ?
                ORDER BY added_at DESC
            """
            
            if limit:
                query += f" LIMIT {limit}"
            
            cursor.execute(query, (course_id, user_id))
            rows = cursor.fetchall()
            conn.close()
            
            words = []
            for row in rows:
                words.append({
                    'id': row['id'],
                    'word': row['word'],
                    'translation': row['translation'],
                    'pronunciation': row['pronunciation'],
                    'example': row['example'],
                    'context': row['context'],
                    'easeFactor': row['ease_factor'],
                    'interval': row['interval'],
                    'repetitions': row['repetitions'],
                    'nextReview': row['next_review'],
                    'lastReviewed': row['last_reviewed'],
                    'masteryLevel': row['mastery_level'],
                    'timesReviewed': row['times_reviewed'],
                    'addedAt': row['added_at']
                })
            
            return words
            
        except Exception as e:
            logger.error(f"❌ Error getting vocabulary: {e}")
            return []
    
    def get_due_vocabulary(self, course_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Récupère les mots à réviser aujourd'hui"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            today = datetime.now().date().isoformat()
            
            cursor.execute("""
                SELECT * FROM vocabulary 
                WHERE course_id = ? AND user_id = ?
                AND (next_review IS NULL OR next_review <= ?)
                ORDER BY next_review ASC, added_at ASC
                LIMIT 20
            """, (course_id, user_id, today))
            
            rows = cursor.fetchall()
            conn.close()
            
            words = []
            for row in rows:
                words.append({
                    'id': row['id'],
                    'word': row['word'],
                    'translation': row['translation'],
                    'pronunciation': row['pronunciation'],
                    'example': row['example'],
                    'context': row['context'],
                    'easeFactor': row['ease_factor'],
                    'interval': row['interval'],
                    'repetitions': row['repetitions'],
                    'nextReview': row['next_review'],
                    'lastReviewed': row['last_reviewed'],
                    'masteryLevel': row['mastery_level'],
                    'timesReviewed': row['times_reviewed']
                })
            
            return words
            
        except Exception as e:
            logger.error(f"❌ Error getting due vocabulary: {e}")
            return []
    
    def update_vocabulary_review(self, word_id: str, quality: int) -> bool:
        """
        Met à jour un mot après révision avec algorithme SM-2
        quality: 0-5 (0=oublié, 5=parfait)
        """
        try:
            from utils.sm2_algorithm import calculate_next_review
            
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Récupérer le mot actuel
            cursor.execute("SELECT * FROM vocabulary WHERE id = ?", (word_id,))
            row = cursor.fetchone()
            
            if not row:
                conn.close()
                return False
            
            # Calculer nouveau schedule avec SM-2
            new_ease, new_interval, next_review = calculate_next_review(
                quality=quality,
                ease_factor=row['ease_factor'],
                interval=row['interval'],
                repetitions=row['repetitions'],
                skip_days=0,
                consecutive_skips=0
            )
            
            # Calculer nouveau mastery level (0-100)
            new_mastery = min(100, row['mastery_level'] + (quality * 5))
            if quality < 3:  # Si difficile/oublié
                new_mastery = max(0, new_mastery - 10)
            
            # Mettre à jour
            cursor.execute("""
                UPDATE vocabulary
                SET ease_factor = ?,
                    interval = ?,
                    repetitions = repetitions + 1,
                    next_review = ?,
                    last_reviewed = ?,
                    mastery_level = ?,
                    times_reviewed = times_reviewed + 1
                WHERE id = ?
            """, (
                new_ease,
                new_interval,
                next_review,
                datetime.now().isoformat(),
                new_mastery,
                word_id
            ))
            
            conn.commit()
            conn.close()
            
            logger.info(f"✅ Updated vocabulary word {word_id}: quality={quality}, next in {new_interval} days")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error updating vocabulary review: {e}")
            return False
    
    def get_vocabulary_stats(self, course_id: str, user_id: str) -> Dict[str, Any]:
        """Récupère les stats de vocabulaire"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    COUNT(*) as total,
                    AVG(mastery_level) as avg_mastery,
                    SUM(times_reviewed) as total_reviews,
                    COUNT(CASE WHEN mastery_level >= 80 THEN 1 END) as mastered,
                    COUNT(CASE WHEN next_review IS NULL OR next_review <= date('now') THEN 1 END) as due_today
                FROM vocabulary
                WHERE course_id = ? AND user_id = ?
            """, (course_id, user_id))
            
            row = cursor.fetchone()
            conn.close()
            
            return {
                'total': row['total'] or 0,
                'avgMastery': round(row['avg_mastery'] or 0, 1),
                'totalReviews': row['total_reviews'] or 0,
                'mastered': row['mastered'] or 0,
                'dueToday': row['due_today'] or 0
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting vocabulary stats: {e}")
            return {
                'total': 0,
                'avgMastery': 0,
                'totalReviews': 0,
                'mastered': 0,
                'dueToday': 0
            }


# Import pour timedelta
from datetime import timedelta

# Instance globale
db = LearningDatabase()


# ═══════════════════════════════════════════════════════════════
# KNOWLEDGE BASE - Méthodes pour gérer les concepts
# ═══════════════════════════════════════════════════════════════

class ConceptsManager:
    """Gestionnaire de la base de connaissances"""
    
    def __init__(self, database: LearningDatabase):
        self.db = database
    
    def add_concept(
        self,
        concept: str,
        course_id: str,
        category: str = None,
        definition: str = None,
        example: str = None,
        keywords: List[str] = None
    ) -> bool:
        """Ajoute ou met à jour un concept"""
        try:
            conn = self.db._get_connection()
            cursor = conn.cursor()
            
            keywords_str = json.dumps(keywords) if keywords else None
            now = datetime.now().isoformat()
            
            cursor.execute("""
                INSERT INTO concepts 
                (concept, category, definition, example, keywords, course_id, added_at, last_referenced)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(concept, course_id) DO UPDATE SET
                    last_referenced = ?,
                    times_referenced = times_referenced + 1,
                    definition = COALESCE(excluded.definition, definition),
                    example = COALESCE(excluded.example, example),
                    category = COALESCE(excluded.category, category)
            """, (concept, category, definition, example, keywords_str, course_id, now, now, now))
            
            conn.commit()
            conn.close()
            
            logger.info(f"✅ Concept added/updated: {concept} for course {course_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error adding concept: {e}")
            return False
    
    def get_concepts(self, course_id: str, limit: int = None) -> List[Dict[str, Any]]:
        """Récupère tous les concepts d'un cours"""
        try:
            conn = self.db._get_connection()
            cursor = conn.cursor()
            
            query = """
                SELECT * FROM concepts 
                WHERE course_id = ?
                ORDER BY last_referenced DESC
            """
            
            if limit:
                query += f" LIMIT {limit}"
            
            cursor.execute(query, (course_id,))
            rows = cursor.fetchall()
            conn.close()
            
            concepts = []
            for row in rows:
                concepts.append({
                    'id': row['id'],
                    'concept': row['concept'],
                    'category': row['category'],
                    'definition': row['definition'],
                    'example': row['example'],
                    'keywords': json.loads(row['keywords']) if row['keywords'] else [],
                    'timesReferenced': row['times_referenced'],
                    'masteryLevel': row['mastery_level'],
                    'addedAt': row['added_at'],
                    'lastReferenced': row['last_referenced']
                })
            
            logger.info(f"✅ Retrieved {len(concepts)} concepts for course {course_id}")
            return concepts
            
        except Exception as e:
            logger.error(f"❌ Error getting concepts: {e}")
            return []
    
    def search_concepts(
        self,
        course_id: str,
        query: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Recherche des concepts pertinents"""
        try:
            conn = self.db._get_connection()
            cursor = conn.cursor()
            
            search_pattern = f"%{query.lower()}%"
            
            cursor.execute("""
                SELECT * FROM concepts 
                WHERE course_id = ?
                AND (
                    LOWER(concept) LIKE ?
                    OR LOWER(definition) LIKE ?
                    OR LOWER(keywords) LIKE ?
                )
                ORDER BY 
                    mastery_level ASC,
                    times_referenced DESC,
                    last_referenced DESC
                LIMIT ?
            """, (course_id, search_pattern, search_pattern, search_pattern, limit))
            
            rows = cursor.fetchall()
            conn.close()
            
            concepts = []
            for row in rows:
                concepts.append({
                    'id': row['id'],
                    'concept': row['concept'],
                    'category': row['category'],
                    'definition': row['definition'],
                    'example': row['example'],
                    'keywords': json.loads(row['keywords']) if row['keywords'] else [],
                    'timesReferenced': row['times_referenced'],
                    'masteryLevel': row['mastery_level'],
                    'addedAt': row['added_at'],
                    'lastReferenced': row['last_referenced']
                })
            
            logger.info(f"✅ Found {len(concepts)} matching concepts for '{query}'")
            return concepts
            
        except Exception as e:
            logger.error(f"❌ Error searching concepts: {e}")
            return []
    
    def update_mastery(self, concept_id: int, mastery_level: int) -> bool:
        """Met à jour le niveau de maîtrise d'un concept"""
        try:
            conn = self.db._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE concepts 
                SET mastery_level = ?,
                    last_referenced = ?
                WHERE id = ?
            """, (mastery_level, datetime.now().isoformat(), concept_id))
            
            conn.commit()
            conn.close()
            
            logger.info(f"✅ Updated mastery for concept {concept_id} to {mastery_level}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error updating mastery: {e}")
            return False
    
    def get_stats(self, course_id: str) -> Dict[str, Any]:
        """Récupère des stats sur les concepts d'un cours"""
        try:
            conn = self.db._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    COUNT(*) as total,
                    AVG(mastery_level) as avg_mastery,
                    SUM(times_referenced) as total_references,
                    COUNT(CASE WHEN mastery_level >= 4 THEN 1 END) as mastered,
                    COUNT(CASE WHEN mastery_level <= 2 THEN 1 END) as needs_review
                FROM concepts
                WHERE course_id = ?
            """, (course_id,))
            
            row = cursor.fetchone()
            conn.close()
            
            return {
                'total': row['total'],
                'avgMastery': round(row['avg_mastery'], 1) if row['avg_mastery'] else 0,
                'totalReferences': row['total_references'] or 0,
                'mastered': row['mastered'],
                'needsReview': row['needs_review']
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting concept stats: {e}")
            return {
                'total': 0,
                'avgMastery': 0,
                'totalReferences': 0,
                'mastered': 0,
                'needsReview': 0
            }

# Instance globale
concepts_manager = ConceptsManager(db)












