"""
📋 Routes API pour la Persistance des Tâches et Projets
Endpoints pour le stockage SQLite (remplace localStorage)
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import logging
from databases import tasks_db

logger = logging.getLogger(__name__)

# Alias pour compatibilité
db = tasks_db
router = APIRouter(prefix="/api/tasks-db", tags=["Tasks Persistence"])


# ═══════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════

class SubTaskRequest(BaseModel):
    id: Optional[str] = None
    title: str
    completed: Optional[bool] = False


class TaskRequest(BaseModel):
    id: Optional[str] = None
    project_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    category: Optional[str] = "personal"
    status: Optional[str] = "todo"
    priority: Optional[str] = "medium"
    effort: Optional[str] = "S"
    due_date: Optional[str] = None
    estimated_time: Optional[int] = None
    actual_time: Optional[int] = None
    completed: Optional[bool] = False
    is_visible: Optional[bool] = True
    is_priority: Optional[bool] = False
    temporal_column: Optional[str] = "today"
    phase_index: Optional[int] = None
    is_validation: Optional[bool] = False
    focus_score: Optional[float] = 0
    tags: Optional[List[str]] = None
    subtasks: Optional[List[SubTaskRequest]] = []


class TaskUpdateRequest(BaseModel):
    project_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    effort: Optional[str] = None
    due_date: Optional[str] = None
    estimated_time: Optional[int] = None
    actual_time: Optional[int] = None
    completed: Optional[bool] = None
    completed_at: Optional[str] = None
    is_visible: Optional[bool] = None
    is_priority: Optional[bool] = None
    temporal_column: Optional[str] = None
    phase_index: Optional[int] = None
    is_validation: Optional[bool] = None
    focus_score: Optional[float] = None
    tags: Optional[List[str]] = None


class ProjectRequest(BaseModel):
    id: Optional[str] = None
    name: str
    color: Optional[str] = "#6366f1"
    icon: Optional[str] = "🚀"
    status: Optional[str] = "todo"
    linked_course_id: Optional[str] = None
    has_phases: Optional[bool] = False
    phase_count: Optional[int] = 0
    archived: Optional[bool] = False
    ai_plan: Optional[dict] = None


class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    status: Optional[str] = None
    linked_course_id: Optional[str] = None
    has_phases: Optional[bool] = None
    phase_count: Optional[int] = None
    archived: Optional[bool] = None
    ai_plan: Optional[dict] = None


class TaskRelationRequest(BaseModel):
    id: Optional[str] = None
    from_task_id: str
    to_task_id: str
    relation_type: str  # blocks, blocked_by, related, duplicate, parent, child


class CategoryRequest(BaseModel):
    id: Optional[str] = None
    label: str
    emoji: Optional[str] = "📁"


class PomodoroRequest(BaseModel):
    id: Optional[str] = None
    task_id: Optional[str] = None
    project_id: Optional[str] = None
    course_id: Optional[str] = None
    book_id: Optional[str] = None
    duration: int
    actual_duration: Optional[int] = None
    session_type: Optional[str] = "focus"
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    date: Optional[str] = None
    interrupted: Optional[bool] = False
    interruptions: Optional[int] = 0
    notes: Optional[str] = None


class BulkTasksRequest(BaseModel):
    tasks: List[TaskRequest]
    project_id: Optional[str] = None


class BulkProjectsRequest(BaseModel):
    projects: List[ProjectRequest]


# ═══════════════════════════════════════════════════════════════
# PROJECTS ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@router.get("/projects")
async def get_projects(include_archived: bool = False):
    """Récupère tous les projets"""
    projects = db.get_projects(include_archived=include_archived)
    return {
        "success": True,
        "count": len(projects),
        "projects": projects
    }


@router.get("/projects/{project_id}")
async def get_project(project_id: str):
    """Récupère un projet par ID"""
    project = db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    return {"success": True, "project": project}


@router.post("/projects")
async def create_project(request: ProjectRequest):
    """Crée un projet"""
    project_id = db.add_project(request.model_dump())
    if not project_id:
        raise HTTPException(status_code=400, detail="Erreur lors de la création")
    return {
        "success": True,
        "id": project_id,
        "message": f"Projet '{request.name}' créé"
    }


@router.put("/projects/{project_id}")
async def update_project(project_id: str, request: ProjectUpdateRequest):
    """Met à jour un projet"""
    data = {k: v for k, v in request.model_dump().items() if v is not None}
    updated = db.update_project(project_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    return {"success": True, "message": "Projet mis à jour"}


@router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    """Supprime un projet"""
    deleted = db.delete_project(project_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    return {"success": True, "message": "Projet supprimé"}


@router.post("/projects/bulk")
async def bulk_create_projects(request: BulkProjectsRequest):
    """Crée plusieurs projets en une fois (import depuis localStorage)"""
    created_ids = []
    for project in request.projects:
        project_id = db.add_project(project.model_dump())
        if project_id:
            created_ids.append(project_id)

    return {
        "success": True,
        "created": len(created_ids),
        "ids": created_ids
    }


# ═══════════════════════════════════════════════════════════════
# TASKS ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@router.get("/tasks")
async def get_tasks(project_id: Optional[str] = None, include_completed: bool = True, limit: int = 500):
    """Récupère les tâches"""
    tasks = db.get_tasks(project_id=project_id, include_completed=include_completed, limit=limit)
    return {
        "success": True,
        "count": len(tasks),
        "tasks": tasks
    }


@router.get("/tasks/{task_id}")
async def get_task(task_id: str):
    """Récupère une tâche par ID"""
    task = db.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
    return {"success": True, "task": task}


@router.post("/tasks")
async def create_task(request: TaskRequest):
    """Crée une tâche"""
    data = request.model_dump()
    # Convertir les subtasks
    if data.get('subtasks'):
        data['subtasks'] = [s if isinstance(s, dict) else s.model_dump() for s in data['subtasks']]

    task_id = db.add_task(data)
    if not task_id:
        raise HTTPException(status_code=400, detail="Erreur lors de la création")
    return {
        "success": True,
        "id": task_id,
        "message": f"Tâche '{request.title}' créée"
    }


@router.put("/tasks/{task_id}")
async def update_task(task_id: str, request: TaskUpdateRequest):
    """Met à jour une tâche"""
    data = {k: v for k, v in request.model_dump().items() if v is not None}
    updated = db.update_task(task_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
    return {"success": True, "message": "Tâche mise à jour"}


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """Supprime une tâche"""
    deleted = db.delete_task(task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
    return {"success": True, "message": "Tâche supprimée"}


@router.post("/tasks/{task_id}/toggle")
async def toggle_task(task_id: str):
    """Toggle le statut d'une tâche"""
    new_status = db.toggle_task(task_id)
    if new_status is None:
        raise HTTPException(status_code=404, detail="Tâche non trouvée")
    return {
        "success": True,
        "completed": new_status,
        "message": "Tâche complétée" if new_status else "Tâche réouverte"
    }


@router.post("/tasks/bulk")
async def bulk_create_tasks(request: BulkTasksRequest):
    """Crée plusieurs tâches en une fois (import depuis localStorage)"""
    created_ids = []
    for task in request.tasks:
        data = task.model_dump()
        if request.project_id:
            data['project_id'] = request.project_id
        task_id = db.add_task(data)
        if task_id:
            created_ids.append(task_id)

    return {
        "success": True,
        "created": len(created_ids),
        "ids": created_ids
    }


# ═══════════════════════════════════════════════════════════════
# SUBTASKS ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@router.post("/tasks/{task_id}/subtasks")
async def add_subtask(task_id: str, request: SubTaskRequest):
    """Ajoute une sous-tâche"""
    subtask_id = db.add_subtask(task_id, request.model_dump())
    if not subtask_id:
        raise HTTPException(status_code=400, detail="Erreur lors de la création")
    return {"success": True, "id": subtask_id}


@router.post("/subtasks/{subtask_id}/toggle")
async def toggle_subtask(subtask_id: str):
    """Toggle une sous-tâche"""
    new_status = db.toggle_subtask(subtask_id)
    if new_status is None:
        raise HTTPException(status_code=404, detail="Sous-tâche non trouvée")
    return {"success": True, "completed": new_status}


@router.delete("/subtasks/{subtask_id}")
async def delete_subtask(subtask_id: str):
    """Supprime une sous-tâche"""
    deleted = db.delete_subtask(subtask_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Sous-tâche non trouvée")
    return {"success": True, "message": "Sous-tâche supprimée"}


# ═══════════════════════════════════════════════════════════════
# TASK RELATIONS ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@router.get("/tasks/{task_id}/relations")
async def get_task_relations(task_id: str):
    """Récupère les relations d'une tâche"""
    relations = db.get_task_relations(task_id)
    return {"success": True, "relations": relations}


@router.post("/relations")
async def create_task_relation(request: TaskRelationRequest):
    """Crée une relation entre tâches"""
    relation_id = db.add_task_relation(request.model_dump())
    if not relation_id:
        raise HTTPException(status_code=400, detail="Erreur lors de la création")
    return {"success": True, "id": relation_id}


@router.delete("/relations/{relation_id}")
async def delete_task_relation(relation_id: str):
    """Supprime une relation"""
    deleted = db.delete_task_relation(relation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Relation non trouvée")
    return {"success": True, "message": "Relation supprimée"}


# ═══════════════════════════════════════════════════════════════
# CATEGORIES ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@router.get("/categories")
async def get_categories():
    """Récupère les catégories"""
    categories = db.get_categories()
    return {"success": True, "categories": categories}


@router.post("/categories")
async def create_category(request: CategoryRequest):
    """Crée une catégorie"""
    category_id = db.add_category(request.model_dump())
    if not category_id:
        raise HTTPException(status_code=400, detail="Erreur lors de la création")
    return {"success": True, "id": category_id}


@router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    """Supprime une catégorie"""
    deleted = db.delete_category(category_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")
    return {"success": True, "message": "Catégorie supprimée"}


# ═══════════════════════════════════════════════════════════════
# POMODORO ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@router.get("/pomodoro")
async def get_pomodoro_sessions(date: Optional[str] = None, limit: int = 100):
    """Récupère les sessions Pomodoro"""
    sessions = db.get_pomodoro_sessions(date=date, limit=limit)
    return {"success": True, "sessions": sessions}


@router.post("/pomodoro")
async def create_pomodoro_session(request: PomodoroRequest):
    """Crée une session Pomodoro"""
    session_id = db.add_pomodoro_session(request.model_dump())
    if not session_id:
        raise HTTPException(status_code=400, detail="Erreur lors de la création")
    return {"success": True, "id": session_id}


# ═══════════════════════════════════════════════════════════════
# STATISTICS ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@router.get("/stats")
async def get_tasks_stats():
    """Statistiques des tâches"""
    stats = db.get_stats()
    return {"success": True, "stats": stats}


@router.get("/stats/daily")
async def get_daily_stats(days: int = 7):
    """Statistiques journalières"""
    # TODO: Implémenter get_daily_stats dans tasks_db
    return {"success": True, "stats": []}


# ═══════════════════════════════════════════════════════════════
# SYNC / MIGRATION ENDPOINT
# ═══════════════════════════════════════════════════════════════

@router.get("/dashboard")
async def get_tasks_dashboard():
    """Dashboard complet des tâches"""
    today = datetime.now().strftime('%Y-%m-%d')

    return {
        "success": True,
        "date": today,
        "stats": db.get_stats(),
        "projects_count": len(db.get_projects()),
        "pending_tasks": len(db.get_tasks(include_completed=False))
    }
