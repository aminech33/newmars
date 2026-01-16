"""
Backend FastAPI - Apprentissage Adaptatif avec Gemini
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routes.learning import router as learning_router
from routes.tasks import router as tasks_router
from routes.terminal import router as terminal_router
from routes.skills import router as skills_router
from routes.knowledge import router as knowledge_router
from routes.languages import router as languages_router
from routes.code_execution import router as code_router
from routes.withings import router as withings_router
from routes.chat import router as chat_router
from routes.health import router as health_router
from routes.tasks_persistence import router as tasks_db_router
from routes.advanced_learning import router as advanced_learning_router

app = FastAPI(
    title="Adaptive Learning API",
    description="Backend Python pour apprentissage adaptatif propulsé par Gemini AI",
    version="1.0.0"
)

# CORS pour permettre les requêtes depuis le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # À restreindre en production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(learning_router, prefix="/api/learning", tags=["Learning"])
app.include_router(tasks_router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(terminal_router, prefix="/api/terminal", tags=["Terminal"])
app.include_router(skills_router, prefix="/api/skills", tags=["Skills"])
app.include_router(knowledge_router)  # Prefix déjà défini dans le router
app.include_router(languages_router)  # Prefix déjà défini dans le router
app.include_router(code_router)       # Prefix déjà défini (/api/code)
app.include_router(withings_router, prefix="/api/withings", tags=["Withings"])
app.include_router(chat_router)       # Prefix déjà défini (/api/chat)
app.include_router(health_router)     # Prefix déjà défini (/api/health)
app.include_router(tasks_db_router)   # Prefix déjà défini (/api/tasks-db)
app.include_router(advanced_learning_router, prefix="/api/learning", tags=["Advanced Learning"])


@app.get("/")
async def root():
    """Route racine"""
    return {
        "message": "🚀 Backend Adaptatif - Apprentissage pour procrastinateurs",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs",
        "algo": "FSRS + SM-2++ avec AI",
        "advanced_features": [
            "FSRS (Free Spaced Repetition Scheduler)",
            "Cognitive Load Detection",
            "Transfer Learning Detection",
            "Personalized Forgetting Curve",
            "Variation Practice",
            "Pre-sleep Review Scheduling"
        ]
    }


@app.get("/health")
async def health_check():
    """Health check avec vérification des APIs"""
    import os

    # Vérifier si la clé OpenAI est configurée
    openai_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
    ai_status = "connected" if openai_key else "not_configured"

    return {
        "status": "healthy",
        "ai": ai_status,
        # Rétrocompatibilité avec le frontend qui cherche "gemini"
        "gemini": ai_status
    }


@app.get("/health/databases")
async def databases_health():
    """Vérifie l'état de chaque base de données isolée"""
    from databases import tasks_db, health_db, learning_db

    return {
        "connected": True,
        "databases": {
            "tasks": tasks_db.get_health_check(),
            "health": health_db.get_health_check(),
            "learning": learning_db.get_health_check(),
        }
    }


@app.get("/health/ai")
async def ai_health():
    """Vérifie l'état du dispatcher AI avec détails et stats"""
    from services.ai_dispatcher import ai_dispatcher

    # Récupérer le status du dispatcher
    dispatcher_status = ai_dispatcher.get_health_status()

    return {
        **dispatcher_status,
        "provider": "openai",
        "dispatcher": "ai_dispatcher",
        "version": "1.0.0"
    }


@app.get("/health/ai/stats")
async def ai_stats():
    """Stats de session du dispatcher AI"""
    from services.ai_dispatcher import ai_dispatcher
    return ai_dispatcher.get_session_stats()


@app.get("/health/ai/estimate")
async def ai_estimate_cost(task_type: str = "quiz", tokens: int = 1000):
    """Estime le coût pour une tâche donnée"""
    from services.ai_dispatcher import ai_dispatcher, TaskType

    try:
        task = TaskType(task_type)
    except ValueError:
        return {
            "error": f"Type de tâche invalide: {task_type}",
            "valid_types": [t.value for t in TaskType]
        }

    return ai_dispatcher.estimate_cost(task, tokens)


# ═══════════════════════════════════════════════════════════════
# STATS AI HISTORIQUES (persistées en base)
# ═══════════════════════════════════════════════════════════════

@app.get("/health/ai/history")
async def ai_history():
    """
    Stats complètes AI : session + aujourd'hui + semaine + mois + all-time.
    Endpoint principal pour l'UI ConnectionsPage.
    """
    from services.ai_dispatcher import ai_dispatcher
    return ai_dispatcher.get_complete_stats()


@app.get("/health/ai/today")
async def ai_usage_today():
    """Stats AI d'aujourd'hui"""
    from services.ai_dispatcher import ai_dispatcher
    return ai_dispatcher.get_usage_today()


@app.get("/health/ai/week")
async def ai_usage_week():
    """Stats AI de la semaine en cours"""
    from services.ai_dispatcher import ai_dispatcher
    return ai_dispatcher.get_usage_this_week()


@app.get("/health/ai/month")
async def ai_usage_month():
    """Stats AI du mois en cours"""
    from services.ai_dispatcher import ai_dispatcher
    return ai_dispatcher.get_usage_this_month()


@app.get("/health/ai/all-time")
async def ai_usage_all_time():
    """Stats AI depuis le début (toutes périodes confondues)"""
    from services.ai_dispatcher import ai_dispatcher
    return ai_dispatcher.get_usage_all_time()


@app.get("/health/ai/by-task")
async def ai_usage_by_task(days: int = 30):
    """Répartition des coûts par type de tâche sur les N derniers jours"""
    from services.ai_dispatcher import ai_dispatcher
    return ai_dispatcher.get_usage_by_task_type(days)


@app.get("/health/ai/recent")
async def ai_recent_calls(limit: int = 50):
    """Derniers appels AI (pour debug/monitoring)"""
    from services.ai_dispatcher import ai_dispatcher
    return ai_dispatcher.get_recent_calls(limit)


@app.get("/health/ai/prices")
async def ai_current_prices():
    """Retourne les prix actuels configurés pour chaque modèle"""
    from services.ai_dispatcher import ai_dispatcher
    return ai_dispatcher.get_current_prices()


@app.post("/health/ai/recalculate")
async def ai_recalculate_costs():
    """
    Recalcule tous les coûts historiques avec les prix actuels.
    À appeler après modification des prix dans MODELS.
    """
    from services.ai_dispatcher import ai_dispatcher
    return ai_dispatcher.recalculate_costs()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
