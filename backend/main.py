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


@app.get("/")
async def root():
    """Route racine"""
    return {
        "message": "🚀 Backend Adaptatif - Apprentissage pour procrastinateurs",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "algo": "SM-2++ avec Gemini AI"
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
    """Vérifie l'état de chaque module de la base de données"""
    from database import db
    import sqlite3

    status = {
        "connected": False,
        "modules": {
            "tasks": {"ok": False, "count": 0},
            "health": {"ok": False, "count": 0},
            "learning": {"ok": False, "count": 0},
        }
    }

    try:
        conn = db._get_connection()
        cursor = conn.cursor()
        status["connected"] = True

        # Vérifier module Tasks (tasks + projects)
        try:
            cursor.execute("SELECT COUNT(*) FROM tasks")
            tasks_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM projects")
            projects_count = cursor.fetchone()[0]
            status["modules"]["tasks"] = {"ok": True, "count": tasks_count + projects_count}
        except:
            pass

        # Vérifier module Health (weight_entries + meals)
        try:
            cursor.execute("SELECT COUNT(*) FROM weight_entries")
            weight_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM meals")
            meals_count = cursor.fetchone()[0]
            status["modules"]["health"] = {"ok": True, "count": weight_count + meals_count}
        except:
            pass

        # Vérifier module Learning (concepts + vocabulary)
        try:
            cursor.execute("SELECT COUNT(*) FROM concepts")
            concepts_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM vocabulary")
            vocab_count = cursor.fetchone()[0]
            status["modules"]["learning"] = {"ok": True, "count": concepts_count + vocab_count}
        except:
            pass

        conn.close()

    except Exception as e:
        status["error"] = str(e)

    return status


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
