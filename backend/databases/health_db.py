"""
Health Database - Gestion santé (poids, repas, hydratation, profil)
Base: health.db
"""

import sqlite3
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).parent.parent / "data" / "health.db"


class HealthDatabase:
    """Manager pour la base de données santé"""

    def __init__(self, db_path: str = None):
        self.db_path = db_path or str(DB_PATH)
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self):
        """Crée une connexion à la base de données"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def _init_db(self):
        """Initialise les tables"""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Table: weight_entries
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

        # Table: meals
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

        # Table: meal_foods
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

        # Table: hydration_entries
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

        # Table: user_health_profile
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

        conn.commit()
        conn.close()
        logger.info(f"✅ Health DB initialized at {self.db_path}")

    # ═══════════════════════════════════════════════════════════════
    # WEIGHT ENTRIES
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
    # MEALS
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
    # HYDRATION
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
    # USER PROFILE
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
    # HEALTH CHECK
    # ═══════════════════════════════════════════════════════════════

    def get_health_check(self) -> Dict[str, Any]:
        """Vérifie l'état de la base avec détails"""
        from pathlib import Path

        result = {
            "ok": False,
            "path": self.db_path,
            "weight_entries": 0,
            "meals": 0,
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

            cursor.execute("SELECT COUNT(*) FROM weight_entries")
            result["weight_entries"] = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM meals")
            result["meals"] = cursor.fetchone()[0]

            conn.close()
            result["ok"] = True

        except Exception as e:
            result["error"] = str(e)

        return result


# Instance globale
health_db = HealthDatabase()
