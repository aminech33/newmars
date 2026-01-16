"""
Script de migration - Sépare database.db en 3 bases isolées
Exécuter une seule fois: python migrate_databases.py
"""

import sqlite3
import shutil
from pathlib import Path
from datetime import datetime

# Chemins
OLD_DB = Path(__file__).parent / "database.db"
DATA_DIR = Path(__file__).parent / "data"
TASKS_DB = DATA_DIR / "tasks.db"
HEALTH_DB = DATA_DIR / "health.db"
LEARNING_DB = DATA_DIR / "learning.db"
BACKUP_DIR = Path(__file__).parent / "backups"


def backup_old_db():
    """Crée une sauvegarde de l'ancienne base"""
    if not OLD_DB.exists():
        print("⚠️  Ancienne base non trouvée, rien à migrer")
        return False

    BACKUP_DIR.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = BACKUP_DIR / f"database_backup_{timestamp}.db"
    shutil.copy2(OLD_DB, backup_path)
    print(f"✅ Backup créé: {backup_path}")
    return True


def migrate_tasks():
    """Migre les tables tasks vers tasks.db"""
    print("\n📋 Migration Tasks...")

    # Importer pour créer les tables
    from databases.tasks_db import TasksDatabase
    tasks_db = TasksDatabase(str(TASKS_DB))

    if not OLD_DB.exists():
        print("  ⚠️  Pas de données à migrer")
        return

    old_conn = sqlite3.connect(str(OLD_DB))
    old_conn.row_factory = sqlite3.Row
    old_cursor = old_conn.cursor()

    new_conn = sqlite3.connect(str(TASKS_DB))
    new_cursor = new_conn.cursor()

    # Migrer projects
    try:
        old_cursor.execute("SELECT * FROM projects")
        rows = old_cursor.fetchall()
        for row in rows:
            try:
                new_cursor.execute("""
                    INSERT OR IGNORE INTO projects
                    (id, user_id, name, color, icon, status, linked_course_id,
                     has_phases, phase_count, archived, ai_plan, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, tuple(row))
            except Exception as e:
                print(f"  ⚠️  Erreur projet: {e}")
        print(f"  ✅ {len(rows)} projets migrés")
    except Exception as e:
        print(f"  ⚠️  Table projects non trouvée: {e}")

    # Migrer tasks
    try:
        old_cursor.execute("SELECT * FROM tasks")
        rows = old_cursor.fetchall()
        for row in rows:
            try:
                new_cursor.execute("""
                    INSERT OR IGNORE INTO tasks
                    (id, user_id, project_id, title, description, category, status,
                     priority, effort, due_date, estimated_time, actual_time,
                     completed, completed_at, is_visible, is_priority, temporal_column,
                     phase_index, is_validation, focus_score, tags, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, tuple(row))
            except Exception as e:
                print(f"  ⚠️  Erreur tâche: {e}")
        print(f"  ✅ {len(rows)} tâches migrées")
    except Exception as e:
        print(f"  ⚠️  Table tasks non trouvée: {e}")

    # Migrer subtasks
    try:
        old_cursor.execute("SELECT * FROM subtasks")
        rows = old_cursor.fetchall()
        for row in rows:
            try:
                new_cursor.execute("""
                    INSERT OR IGNORE INTO subtasks
                    (id, task_id, title, completed, created_at)
                    VALUES (?, ?, ?, ?, ?)
                """, tuple(row))
            except Exception as e:
                print(f"  ⚠️  Erreur subtask: {e}")
        print(f"  ✅ {len(rows)} sous-tâches migrées")
    except Exception as e:
        print(f"  ⚠️  Table subtasks non trouvée: {e}")

    # Migrer categories
    try:
        old_cursor.execute("SELECT * FROM categories")
        rows = old_cursor.fetchall()
        for row in rows:
            try:
                new_cursor.execute("""
                    INSERT OR IGNORE INTO categories
                    (id, user_id, label, emoji, created_at)
                    VALUES (?, ?, ?, ?, ?)
                """, tuple(row))
            except Exception as e:
                print(f"  ⚠️  Erreur catégorie: {e}")
        print(f"  ✅ {len(rows)} catégories migrées")
    except Exception as e:
        print(f"  ⚠️  Table categories non trouvée: {e}")

    # Migrer pomodoro_sessions
    try:
        old_cursor.execute("SELECT * FROM pomodoro_sessions")
        rows = old_cursor.fetchall()
        for row in rows:
            try:
                new_cursor.execute("""
                    INSERT OR IGNORE INTO pomodoro_sessions
                    (id, user_id, task_id, project_id, course_id, book_id,
                     duration, actual_duration, session_type, started_at,
                     completed_at, date, interrupted, interruptions, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, tuple(row))
            except Exception as e:
                print(f"  ⚠️  Erreur pomodoro: {e}")
        print(f"  ✅ {len(rows)} sessions pomodoro migrées")
    except Exception as e:
        print(f"  ⚠️  Table pomodoro_sessions non trouvée: {e}")

    new_conn.commit()
    new_conn.close()
    old_conn.close()


def migrate_health():
    """Migre les tables health vers health.db"""
    print("\n❤️  Migration Health...")

    from databases.health_db import HealthDatabase
    health_db = HealthDatabase(str(HEALTH_DB))

    if not OLD_DB.exists():
        print("  ⚠️  Pas de données à migrer")
        return

    old_conn = sqlite3.connect(str(OLD_DB))
    old_conn.row_factory = sqlite3.Row
    old_cursor = old_conn.cursor()

    new_conn = sqlite3.connect(str(HEALTH_DB))
    new_cursor = new_conn.cursor()

    # Migrer weight_entries
    try:
        old_cursor.execute("SELECT * FROM weight_entries")
        rows = old_cursor.fetchall()
        for row in rows:
            try:
                new_cursor.execute("""
                    INSERT OR IGNORE INTO weight_entries
                    (id, user_id, date, weight, fat_mass_percent, muscle_mass,
                     bone_mass, water_percent, heart_rate, source, notes, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, tuple(row))
            except Exception as e:
                print(f"  ⚠️  Erreur weight: {e}")
        print(f"  ✅ {len(rows)} entrées poids migrées")
    except Exception as e:
        print(f"  ⚠️  Table weight_entries non trouvée: {e}")

    # Migrer meals
    try:
        old_cursor.execute("SELECT * FROM meals")
        rows = old_cursor.fetchall()
        for row in rows:
            try:
                new_cursor.execute("""
                    INSERT OR IGNORE INTO meals
                    (id, user_id, date, time, meal_type, name,
                     calories, protein, carbs, fat, fiber, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, tuple(row))
            except Exception as e:
                print(f"  ⚠️  Erreur meal: {e}")
        print(f"  ✅ {len(rows)} repas migrés")
    except Exception as e:
        print(f"  ⚠️  Table meals non trouvée: {e}")

    # Migrer meal_foods
    try:
        old_cursor.execute("SELECT * FROM meal_foods")
        rows = old_cursor.fetchall()
        for row in rows:
            try:
                new_cursor.execute("""
                    INSERT OR IGNORE INTO meal_foods
                    (id, meal_id, food_id, food_name, grams, calories, protein, carbs, fat)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, tuple(row))
            except Exception as e:
                print(f"  ⚠️  Erreur meal_food: {e}")
        print(f"  ✅ {len(rows)} aliments migrés")
    except Exception as e:
        print(f"  ⚠️  Table meal_foods non trouvée: {e}")

    # Migrer hydration_entries
    try:
        old_cursor.execute("SELECT * FROM hydration_entries")
        rows = old_cursor.fetchall()
        for row in rows:
            try:
                new_cursor.execute("""
                    INSERT OR IGNORE INTO hydration_entries
                    (id, user_id, date, time, amount_ml, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, tuple(row))
            except Exception as e:
                print(f"  ⚠️  Erreur hydration: {e}")
        print(f"  ✅ {len(rows)} entrées hydratation migrées")
    except Exception as e:
        print(f"  ⚠️  Table hydration_entries non trouvée: {e}")

    # Migrer user_health_profile
    try:
        old_cursor.execute("SELECT * FROM user_health_profile")
        rows = old_cursor.fetchall()
        for row in rows:
            try:
                new_cursor.execute("""
                    INSERT OR IGNORE INTO user_health_profile
                    (id, user_id, height_cm, age, gender, activity_level,
                     goal, target_weight, target_calories, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, tuple(row))
            except Exception as e:
                print(f"  ⚠️  Erreur profile: {e}")
        print(f"  ✅ {len(rows)} profils migrés")
    except Exception as e:
        print(f"  ⚠️  Table user_health_profile non trouvée: {e}")

    new_conn.commit()
    new_conn.close()
    old_conn.close()


def migrate_learning():
    """Migre les tables learning vers learning.db"""
    print("\n📚 Migration Learning...")

    from databases.learning_db import LearningDatabase
    learning_db = LearningDatabase(str(LEARNING_DB))

    if not OLD_DB.exists():
        print("  ⚠️  Pas de données à migrer")
        return

    old_conn = sqlite3.connect(str(OLD_DB))
    old_conn.row_factory = sqlite3.Row
    old_cursor = old_conn.cursor()

    new_conn = sqlite3.connect(str(LEARNING_DB))
    new_cursor = new_conn.cursor()

    # Migrer concepts
    try:
        old_cursor.execute("SELECT * FROM concepts")
        rows = old_cursor.fetchall()
        for row in rows:
            try:
                new_cursor.execute("""
                    INSERT OR IGNORE INTO concepts
                    (id, course_id, concept, category, definition, example,
                     keywords, times_referenced, mastery_level, ease_factor,
                     added_at, last_referenced)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, tuple(row))
            except Exception as e:
                print(f"  ⚠️  Erreur concept: {e}")
        print(f"  ✅ {len(rows)} concepts migrés")
    except Exception as e:
        print(f"  ⚠️  Table concepts non trouvée: {e}")

    # Migrer vocabulary
    try:
        old_cursor.execute("SELECT * FROM vocabulary")
        rows = old_cursor.fetchall()
        for row in rows:
            try:
                new_cursor.execute("""
                    INSERT OR IGNORE INTO vocabulary
                    (id, course_id, user_id, word, translation, pronunciation,
                     example, context, mastery_level, ease_factor, interval,
                     repetitions, next_review, added_at, last_reviewed)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, tuple(row))
            except Exception as e:
                print(f"  ⚠️  Erreur vocabulary: {e}")
        print(f"  ✅ {len(rows)} mots migrés")
    except Exception as e:
        print(f"  ⚠️  Table vocabulary non trouvée: {e}")

    # Migrer language_messages
    try:
        old_cursor.execute("SELECT * FROM language_messages")
        rows = old_cursor.fetchall()
        for row in rows:
            try:
                new_cursor.execute("""
                    INSERT OR IGNORE INTO language_messages
                    (id, course_id, user_id, role, content, timestamp, archived)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, tuple(row))
            except Exception as e:
                print(f"  ⚠️  Erreur message: {e}")
        print(f"  ✅ {len(rows)} messages migrés")
    except Exception as e:
        print(f"  ⚠️  Table language_messages non trouvée: {e}")

    # Migrer completed_exercises
    try:
        old_cursor.execute("SELECT * FROM completed_exercises")
        rows = old_cursor.fetchall()
        for row in rows:
            try:
                new_cursor.execute("""
                    INSERT OR IGNORE INTO completed_exercises
                    (id, exercise_id, course_id, user_id, exercise_type,
                     is_correct, user_answer, correct_answer, completed_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, tuple(row))
            except Exception as e:
                print(f"  ⚠️  Erreur exercise: {e}")
        print(f"  ✅ {len(rows)} exercices migrés")
    except Exception as e:
        print(f"  ⚠️  Table completed_exercises non trouvée: {e}")

    new_conn.commit()
    new_conn.close()
    old_conn.close()


def main():
    print("=" * 50)
    print("🔄 Migration des bases de données")
    print("=" * 50)

    # Créer le dossier data
    DATA_DIR.mkdir(exist_ok=True)

    # Backup
    if not backup_old_db():
        print("\n⚠️  Aucune base existante - création des nouvelles bases vides")

    # Migrations
    migrate_tasks()
    migrate_health()
    migrate_learning()

    print("\n" + "=" * 50)
    print("✅ Migration terminée!")
    print(f"   📁 Nouvelles bases dans: {DATA_DIR}")
    print("   - tasks.db")
    print("   - health.db")
    print("   - learning.db")
    print("=" * 50)


if __name__ == "__main__":
    main()
