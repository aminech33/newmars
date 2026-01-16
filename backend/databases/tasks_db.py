"""
Tasks Database - Gestion des tâches, projets, pomodoro
Base: tasks.db
"""

import sqlite3
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).parent.parent / "data" / "tasks.db"


class TasksDatabase:
    """Manager pour la base de données des tâches"""

    def __init__(self, db_path: str = None):
        self.db_path = db_path or str(DB_PATH)
        # Créer le dossier data si nécessaire
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

        # Table: projects
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

        # Table: tasks
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

        # Table: subtasks
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

        # Table: task_relations
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

        # Table: categories
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

        # Table: pomodoro_sessions
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
        logger.info(f"✅ Tasks DB initialized at {self.db_path}")

    # ═══════════════════════════════════════════════════════════════
    # PROJECTS
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
    # TASKS
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
            cursor.execute("""
                SELECT * FROM subtasks WHERE task_id = ?
            """, (task['id'],))
            task['subtasks'] = [dict(s) for s in cursor.fetchall()]
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
        """Supprime une tâche"""
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
    # SUBTASKS
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
    # RELATIONS
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
    # CATEGORIES
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
    # POMODORO
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
    # STATISTICS
    # ═══════════════════════════════════════════════════════════════

    def get_stats(self, user_id: str = 'default') -> Dict[str, Any]:
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

    def get_health_check(self) -> Dict[str, Any]:
        """Vérifie l'état de la base avec détails"""
        import os
        from pathlib import Path

        result = {
            "ok": False,
            "path": self.db_path,
            "tasks": 0,
            "projects": 0,
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

            cursor.execute("SELECT COUNT(*) FROM tasks")
            result["tasks"] = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM projects")
            result["projects"] = cursor.fetchone()[0]

            conn.close()
            result["ok"] = True

        except Exception as e:
            result["error"] = str(e)

        return result


# Instance globale
tasks_db = TasksDatabase()
