"""
Databases Module - Bases de données séparées par domaine
Chaque domaine a sa propre base SQLite pour isolation et maintenabilité
"""

from .tasks_db import TasksDatabase, tasks_db
from .health_db import HealthDatabase, health_db
from .learning_db import LearningDatabase, learning_db

__all__ = [
    'TasksDatabase', 'tasks_db',
    'HealthDatabase', 'health_db',
    'LearningDatabase', 'learning_db',
]
