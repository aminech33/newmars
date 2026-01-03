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
    """Health check"""
    return {"status": "healthy", "gemini": "connected"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
