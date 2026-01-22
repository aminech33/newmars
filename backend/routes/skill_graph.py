"""
Routes API pour le système de graphe de compétences (Skill Graph).

Ce module gère le tracking et l'analyse des compétences utilisateur,
distinct de skills.py qui génère des cartographies de domaines.

Endpoints:
- GET /skill-graph/skills - Liste toutes les compétences
- GET /skill-graph/skills/{skill_id} - Détails d'une compétence
- GET /skill-graph/skills/{skill_id}/path - Chemin d'apprentissage
- GET /skill-graph/search/{keyword} - Recherche par mot-clé
- GET /skill-graph/user/{user_id} - Profil de compétences
- GET /skill-graph/user/{user_id}/gaps - Analyse des lacunes
- POST /skill-graph/user/{user_id}/update - Met à jour une compétence
- POST /skill-graph/analyze-project - Analyse un projet
- POST /skill-graph/on-task-completed - Track complétion tâche
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging

from databases import skill_graph_db as db
from databases.skill_graph_db import (
    Skill, SkillCategory, SkillGap,
    get_skill, get_all_skills, find_skill_by_keyword,
    get_prerequisites, get_dependent_skills, get_similar_skills,
    get_user_skills, get_user_skill_summary, update_user_skill,
    analyze_skill_gaps, get_learning_path, get_recommended_next_skills,
    calculate_decayed_mastery
)
from services.skill_bridge import get_skill_bridge, SkillAnalysis

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/skill-graph", tags=["skill-graph"])


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class SkillResponse(BaseModel):
    """Réponse pour une compétence."""
    id: str
    name: str
    category: str
    level: int
    description: str = ""
    keywords: List[str] = []


class SkillDetailResponse(BaseModel):
    """Réponse détaillée pour une compétence."""
    skill: SkillResponse
    prerequisites: List[SkillResponse] = []
    unlocks: List[SkillResponse] = []
    similar: List[SkillResponse] = []


class UserSkillResponse(BaseModel):
    """Réponse pour une compétence utilisateur."""
    skill_id: str
    skill_name: str
    mastery: float
    decayed_mastery: float
    last_practiced: Optional[str]
    practice_count: int


class SkillGapResponse(BaseModel):
    """Réponse pour un gap de compétence."""
    skill_id: str
    skill_name: str
    current_mastery: float
    required_mastery: float
    gap: float
    blocking_skills: List[str] = []
    priority: str


class LearningPathResponse(BaseModel):
    """Réponse pour un chemin d'apprentissage."""
    target_skill: str
    path: List[SkillResponse]
    estimated_effort: str


class TaskInput(BaseModel):
    """Input pour une tâche à analyser."""
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    covers: Optional[List[str]] = None
    effort: Optional[str] = "M"
    isValidation: Optional[bool] = False


class AnalyzeProjectRequest(BaseModel):
    """Requête pour analyser un projet."""
    user_id: str
    project_id: str = "unknown"
    tasks: List[TaskInput]


class AnalyzeProjectResponse(BaseModel):
    """Réponse d'analyse de projet."""
    project_id: str
    detected_skills: List[Dict[str, Any]]
    skill_gaps: List[SkillGapResponse]
    learning_suggestions: List[Dict[str, Any]]
    difficulty_adjustment: int
    ready_percentage: float
    recommendation: str


class TaskCompletedRequest(BaseModel):
    """Requête pour signaler une tâche complétée."""
    user_id: str
    task: TaskInput
    success: bool = True
    time_spent_minutes: Optional[int] = None


class TaskCompletedResponse(BaseModel):
    """Réponse après complétion de tâche."""
    task_id: str
    skills_updated: List[Dict[str, Any]]
    unlocked_skills: List[str]
    next_suggestions: List[str]


class UpdateSkillRequest(BaseModel):
    """Requête pour mettre à jour une compétence."""
    skill_id: str
    mastery_delta: float = Field(..., description="Variation de maîtrise (-100 à +100)")
    is_practice: bool = True


class ReadinessRequest(BaseModel):
    """Requête pour vérifier la préparation."""
    user_id: str
    required_skills: List[str]


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def skill_to_response(skill: Skill) -> SkillResponse:
    """Convert Skill to SkillResponse."""
    return SkillResponse(
        id=skill.id,
        name=skill.name,
        category=skill.category.value,
        level=skill.level,
        description=skill.description,
        keywords=skill.keywords
    )


# ============================================================================
# ENDPOINTS - SKILLS CATALOG
# ============================================================================

@router.get("/skills", response_model=List[SkillResponse])
async def list_skills(
    category: Optional[str] = Query(None, description="Filtrer par catégorie")
):
    """
    Liste toutes les compétences disponibles.
    """
    try:
        skills = get_all_skills(category)
        return [skill_to_response(s) for s in skills]
    except Exception as e:
        logger.error(f"Erreur list_skills: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories")
async def list_categories():
    """Liste toutes les catégories de compétences."""
    return {
        "categories": [
            {"id": cat.value, "name": cat.value.replace("_", " ").title()}
            for cat in SkillCategory
        ]
    }


@router.get("/search/{keyword}", response_model=Optional[SkillResponse])
async def search_skill(keyword: str):
    """
    Recherche une compétence par mot-clé (fuzzy matching).
    """
    skill = find_skill_by_keyword(keyword)
    if not skill:
        raise HTTPException(status_code=404, detail=f"Aucune compétence trouvée pour '{keyword}'")
    return skill_to_response(skill)


@router.get("/skills/{skill_id}", response_model=SkillDetailResponse)
async def get_skill_detail(skill_id: str):
    """
    Récupère les détails d'une compétence avec prérequis et dépendances.
    """
    skill = get_skill(skill_id)
    if not skill:
        skill = find_skill_by_keyword(skill_id)

    if not skill:
        raise HTTPException(status_code=404, detail=f"Compétence '{skill_id}' non trouvée")

    prereqs = get_prerequisites(skill.id, include_recommended=True)
    unlocks = get_dependent_skills(skill.id)
    similar = get_similar_skills(skill.id)

    return SkillDetailResponse(
        skill=skill_to_response(skill),
        prerequisites=[skill_to_response(p) for p in prereqs],
        unlocks=[skill_to_response(u) for u in unlocks],
        similar=[skill_to_response(s) for s in similar]
    )


@router.get("/skills/{skill_id}/path", response_model=LearningPathResponse)
async def get_skill_path(
    skill_id: str,
    user_id: str = Query(..., description="ID de l'utilisateur")
):
    """
    Calcule le chemin d'apprentissage optimal vers une compétence.
    """
    skill = get_skill(skill_id) or find_skill_by_keyword(skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail=f"Compétence '{skill_id}' non trouvée")

    path = get_learning_path(user_id, skill.id)

    total_levels = sum(s.level for s in path)
    hours = total_levels * 2
    effort = f"{hours}-{hours + len(path)} heures"

    return LearningPathResponse(
        target_skill=skill.name,
        path=[skill_to_response(s) for s in path],
        estimated_effort=effort
    )


# ============================================================================
# ENDPOINTS - USER SKILLS
# ============================================================================

@router.get("/user/{user_id}", response_model=Dict[str, Any])
async def get_user_skill_profile(user_id: str):
    """
    Récupère le profil de compétences complet d'un utilisateur.
    """
    try:
        summary = get_user_skill_summary(user_id)
        return {
            "success": True,
            "user_id": user_id,
            "profile": summary
        }
    except Exception as e:
        logger.error(f"Erreur get_user_skill_profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_id}/recommendations")
async def get_recommendations(
    user_id: str,
    limit: int = Query(5, ge=1, le=10)
):
    """
    Recommandations de prochaines compétences à apprendre.
    """
    try:
        recommendations = get_recommended_next_skills(user_id, limit)
        return {
            "success": True,
            "user_id": user_id,
            "recommendations": [
                {
                    "skill": skill_to_response(skill),
                    "score": score,
                    "reason": "Prérequis remplis, débloque d'autres compétences"
                }
                for skill, score in recommendations
            ]
        }
    except Exception as e:
        logger.error(f"Erreur get_recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_id}/gaps", response_model=List[SkillGapResponse])
async def get_user_gaps(
    user_id: str,
    skills: str = Query(..., description="Liste de skills séparées par virgule")
):
    """
    Analyse les lacunes pour un ensemble de compétences requises.
    """
    try:
        skill_list = [s.strip() for s in skills.split(",") if s.strip()]
        gaps = analyze_skill_gaps(user_id, skill_list, min_mastery=60.0)

        return [
            SkillGapResponse(
                skill_id=g.skill.id,
                skill_name=g.skill.name,
                current_mastery=round(g.current_mastery, 1),
                required_mastery=g.required_mastery,
                gap=round(g.gap, 1),
                blocking_skills=g.blocking_skills,
                priority="high" if g.gap > 40 else "medium" if g.gap > 20 else "low"
            )
            for g in gaps
        ]
    except Exception as e:
        logger.error(f"Erreur get_user_gaps: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/user/{user_id}/update")
async def update_user_skill_endpoint(
    user_id: str,
    request: UpdateSkillRequest
):
    """
    Met à jour manuellement une compétence utilisateur.
    """
    try:
        skill = get_skill(request.skill_id) or find_skill_by_keyword(request.skill_id)
        if not skill:
            raise HTTPException(status_code=404, detail=f"Compétence '{request.skill_id}' non trouvée")

        updated = update_user_skill(
            user_id=user_id,
            skill_id=skill.id,
            mastery_delta=request.mastery_delta,
            is_practice=request.is_practice
        )

        return {
            "success": True,
            "skill_id": skill.id,
            "new_mastery": round(updated.mastery, 1),
            "practice_count": updated.practice_count
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur update_user_skill: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS - PROJECT/TASK ANALYSIS
# ============================================================================

@router.post("/analyze-project", response_model=AnalyzeProjectResponse)
async def analyze_project(request: AnalyzeProjectRequest):
    """
    Analyse les compétences requises par un projet.

    Retourne:
    - Compétences détectées
    - Lacunes par rapport au profil utilisateur
    - Suggestions d'apprentissage
    - Ajustement de difficulté recommandé
    """
    try:
        bridge = get_skill_bridge()
        tasks = [t.model_dump() for t in request.tasks]

        analysis = bridge.analyze_project(
            user_id=request.user_id,
            tasks=tasks,
            project_id=request.project_id
        )

        return AnalyzeProjectResponse(
            project_id=analysis.project_id,
            detected_skills=[
                {
                    "skill_id": d.skill.id,
                    "skill_name": d.skill.name,
                    "confidence": round(d.confidence, 2),
                    "source": d.source
                }
                for d in analysis.detected_skills
            ],
            skill_gaps=[
                SkillGapResponse(
                    skill_id=g.skill.id,
                    skill_name=g.skill.name,
                    current_mastery=round(g.current_mastery, 1),
                    required_mastery=g.required_mastery,
                    gap=round(g.gap, 1),
                    blocking_skills=g.blocking_skills,
                    priority="high" if g.gap > 40 else "medium" if g.gap > 20 else "low"
                )
                for g in analysis.skill_gaps
            ],
            learning_suggestions=analysis.learning_suggestions,
            difficulty_adjustment=analysis.difficulty_adjustment,
            ready_percentage=round(analysis.ready_percentage, 1),
            recommendation=(
                "Prêt à commencer!" if analysis.ready_percentage >= 70
                else "Quelques révisions recommandées" if analysis.ready_percentage >= 40
                else "Formation préalable conseillée"
            )
        )
    except Exception as e:
        logger.error(f"Erreur analyze_project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/on-task-completed", response_model=TaskCompletedResponse)
async def on_task_completed(request: TaskCompletedRequest):
    """
    Signale qu'une tâche a été complétée.

    Met à jour les compétences de l'utilisateur.
    """
    try:
        bridge = get_skill_bridge()

        task = request.task.model_dump()
        result = bridge.on_task_completed(
            user_id=request.user_id,
            task=task,
            success=request.success,
            time_spent_minutes=request.time_spent_minutes
        )

        return TaskCompletedResponse(
            task_id=result.task_id,
            skills_updated=[
                {"skill_id": sid, "new_mastery": round(m, 1)}
                for sid, m in result.skills_updated
            ],
            unlocked_skills=result.unlocked_skills,
            next_suggestions=result.next_suggestions
        )
    except Exception as e:
        logger.error(f"Erreur on_task_completed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/check-readiness")
async def check_readiness(request: ReadinessRequest):
    """
    Vérifie si un utilisateur est prêt pour un ensemble de compétences.
    """
    try:
        bridge = get_skill_bridge()
        readiness = bridge.get_user_readiness(request.user_id, request.required_skills)
        return {
            "success": True,
            **readiness
        }
    except Exception as e:
        logger.error(f"Erreur check_readiness: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINTS - DISTANCE CALCULATION (NOUVEAU)
# ============================================================================

class TaskDistanceRequest(BaseModel):
    """Requête pour calculer la distance d'une tâche."""
    user_id: str
    task: TaskInput
    cognitive_load: float = Field(0.5, ge=0, le=1, description="Charge cognitive 0-1")


class TaskDistanceResponse(BaseModel):
    """Réponse avec la distance calculée."""
    task_id: str
    total_distance: float
    skill_level_distance: float
    mastery_distance: float
    prerequisite_penalty: float
    cognitive_load_factor: float
    required_skills: List[str]
    missing_prerequisites: List[str]
    required_skill_level: int
    user_avg_skill_level: float
    difficulty_label: str
    is_appropriate: bool
    recommendation: str


class ProjectDistanceRequest(BaseModel):
    """Requête pour calculer la distance d'un projet."""
    user_id: str
    project_id: str = "unknown"
    tasks: List[TaskInput]


class ProjectDistanceResponse(BaseModel):
    """Réponse avec la distance du projet."""
    project_id: str
    overall_distance: float
    task_count: int
    trivial_count: int
    appropriate_count: int
    challenging_count: int
    hard_count: int
    impossible_count: int
    readiness_score: float
    recommended_order: List[str]
    scaffolding_needed: List[str]
    task_distances: List[TaskDistanceResponse]


@router.post("/calculate-task-distance", response_model=TaskDistanceResponse)
async def calculate_task_distance(request: TaskDistanceRequest):
    """
    Calcule la distance entre l'utilisateur et une tâche.

    La distance est un score de 0 (parfait match) à 1 (impossible).

    Composantes:
    - skill_level_distance (30%): Écart niveau skill requis vs user
    - mastery_distance (40%): Écart maîtrise requise vs actuelle
    - prerequisite_penalty (20%): Pénalité si prérequis manquants
    - cognitive_load_factor (10%): Facteur de charge cognitive
    """
    try:
        bridge = get_skill_bridge()
        task = request.task.model_dump()

        td = bridge.calculate_task_distance(
            user_id=request.user_id,
            task=task,
            cognitive_load=request.cognitive_load
        )

        return TaskDistanceResponse(
            task_id=td.task_id,
            total_distance=td.total_distance,
            skill_level_distance=td.skill_level_distance,
            mastery_distance=td.mastery_distance,
            prerequisite_penalty=td.prerequisite_penalty,
            cognitive_load_factor=td.cognitive_load_factor,
            required_skills=td.required_skills,
            missing_prerequisites=td.missing_prerequisites,
            required_skill_level=td.required_skill_level,
            user_avg_skill_level=td.user_avg_skill_level,
            difficulty_label=td.difficulty_label,
            is_appropriate=td.is_appropriate,
            recommendation=td.recommendation
        )
    except Exception as e:
        logger.error(f"Erreur calculate_task_distance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/calculate-project-distance", response_model=ProjectDistanceResponse)
async def calculate_project_distance(request: ProjectDistanceRequest):
    """
    Calcule la distance pour un projet entier.

    Retourne:
    - Distribution des tâches par difficulté
    - Ordre recommandé (plus facile d'abord)
    - Skills à apprendre avant de commencer
    - Score de readiness (% tâches accessibles)
    """
    try:
        bridge = get_skill_bridge()
        tasks = [t.model_dump() for t in request.tasks]

        pd = bridge.calculate_project_distance(
            user_id=request.user_id,
            tasks=tasks,
            project_id=request.project_id
        )

        return ProjectDistanceResponse(
            project_id=pd.project_id,
            overall_distance=pd.overall_distance,
            task_count=len(pd.task_distances),
            trivial_count=pd.trivial_count,
            appropriate_count=pd.appropriate_count,
            challenging_count=pd.challenging_count,
            hard_count=pd.hard_count,
            impossible_count=pd.impossible_count,
            readiness_score=pd.readiness_score,
            recommended_order=pd.recommended_order,
            scaffolding_needed=pd.scaffolding_needed,
            task_distances=[
                TaskDistanceResponse(
                    task_id=td.task_id,
                    total_distance=td.total_distance,
                    skill_level_distance=td.skill_level_distance,
                    mastery_distance=td.mastery_distance,
                    prerequisite_penalty=td.prerequisite_penalty,
                    cognitive_load_factor=td.cognitive_load_factor,
                    required_skills=td.required_skills,
                    missing_prerequisites=td.missing_prerequisites,
                    required_skill_level=td.required_skill_level,
                    user_avg_skill_level=td.user_avg_skill_level,
                    difficulty_label=td.difficulty_label,
                    is_appropriate=td.is_appropriate,
                    recommendation=td.recommendation
                )
                for td in pd.task_distances
            ]
        )
    except Exception as e:
        logger.error(f"Erreur calculate_project_distance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimal-task-order")
async def get_optimal_task_order(request: ProjectDistanceRequest):
    """
    Retourne les tâches réordonnées par difficulté progressive.

    Principe: commencer par les tâches accessibles pour
    construire la confiance et les compétences.
    """
    try:
        bridge = get_skill_bridge()
        tasks = [t.model_dump() for t in request.tasks]

        ordered = bridge.get_optimal_task_order(
            user_id=request.user_id,
            tasks=tasks
        )

        return {
            "success": True,
            "user_id": request.user_id,
            "project_id": request.project_id,
            "task_count": len(ordered),
            "tasks": ordered
        }
    except Exception as e:
        logger.error(f"Erreur get_optimal_task_order: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/health")
async def health_check():
    """Vérifie que le service est opérationnel."""
    skills = get_all_skills()

    return {
        "status": "healthy",
        "service": "SkillGraph",
        "version": "2.0.0",
        "skills_count": len(skills),
        "features": [
            "skill_catalog",
            "prerequisites_graph",
            "user_mastery_tracking",
            "decay_calculation",
            "gap_analysis",
            "learning_paths",
            "task_skill_detection",
            "project_analysis",
            "task_distance_calculation",
            "project_distance_analysis",
            "optimal_task_ordering"
        ]
    }
