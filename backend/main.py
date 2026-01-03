"""
Backend FastAPI - Apprentissage Adaptatif avec ChatGPT
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routes.learning import router as learning_router
from routes.tasks import router as tasks_router
from routes.terminal import router as terminal_router
from routes.skills import router as skills_router
from routes.withings import router as withings_router
from routes.code_execution import router as code_execution_router

app = FastAPI(
    title="Adaptive Learning API",
    description="Backend Python pour apprentissage adaptatif propulsé par ChatGPT (OpenAI)",
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
app.include_router(withings_router, prefix="/api/withings", tags=["Withings Integration"])
app.include_router(code_execution_router)  # Déjà inclut son prefix


@app.get("/")
async def root():
    """Route racine"""
    return {
        "message": "🚀 Backend Adaptatif - Apprentissage pour procrastinateurs",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "algo": "SM-2++ avec ChatGPT AI"
    }


@app.get("/health")
async def health_check():
    """Health check"""
    return {"status": "healthy", "chatgpt": "connected"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
