"""
🚀 Code Execution Service - Simple & Élégant

Philosophie :
- Exécution directe dans Docker (isolation + sécurité)
- Streaming en temps réel (feedback immédiat)
- Timeout court (pas d'attente infinie)
- Support multi-langages (Python, JS, etc.)
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import docker
import asyncio
from typing import Optional, AsyncGenerator
import json

router = APIRouter(prefix="/api/code", tags=["code-execution"])

# Client Docker
try:
    docker_client = docker.from_env()
except Exception:
    docker_client = None

class CodeExecutionRequest(BaseModel):
    code: str
    language: str  # python, javascript, typescript, etc.
    stdin: Optional[str] = ""

class CodeExecutionResult(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    execution_time_ms: int
    error: Optional[str] = None

# Configuration des images Docker par langage
LANGUAGE_IMAGES = {
    "python": "python:3.11-slim",
    "javascript": "node:20-slim",
    "typescript": "node:20-slim",
    "java": "openjdk:17-slim",
    "cpp": "gcc:latest",
    "rust": "rust:latest",
    "go": "golang:latest",
    "ruby": "ruby:latest",
    "php": "php:latest",
}

# Commandes d'exécution par langage
LANGUAGE_COMMANDS = {
    "python": ["python", "-c"],
    "javascript": ["node", "-e"],
    "typescript": ["ts-node", "-e"],  # Nécessite ts-node installé
    "java": None,  # Nécessite compilation
    "cpp": None,   # Nécessite compilation
    "rust": None,  # Nécessite compilation
    "go": ["go", "run", "/tmp/code.go"],
    "ruby": ["ruby", "-e"],
    "php": ["php", "-r"],
}


async def execute_code_in_docker(
    code: str, 
    language: str, 
    stdin: str = ""
) -> AsyncGenerator[str, None]:
    """
    Exécute du code dans un container Docker isolé
    Yield des chunks de résultat en streaming
    """
    
    if not docker_client:
        yield json.dumps({
            "type": "error",
            "data": "Docker n'est pas disponible sur ce système"
        }) + "\n"
        return
    
    if language not in LANGUAGE_IMAGES:
        yield json.dumps({
            "type": "error",
            "data": f"Langage '{language}' non supporté"
        }) + "\n"
        return
    
    image = LANGUAGE_IMAGES[language]
    command = LANGUAGE_COMMANDS.get(language)
    
    if command is None:
        yield json.dumps({
            "type": "error",
            "data": f"Exécution de {language} nécessite compilation (non implémenté)"
        }) + "\n"
        return
    
    try:
        # Signal de démarrage
        yield json.dumps({
            "type": "status",
            "data": "Démarrage du container..."
        }) + "\n"
        
        # Créer et démarrer le container
        container = docker_client.containers.run(
            image=image,
            command=command + [code],
            detach=True,
            remove=True,
            mem_limit="128m",  # Limite mémoire
            cpu_quota=50000,   # Limite CPU
            network_disabled=True,  # Pas d'accès réseau
            stdin_open=bool(stdin),
            stdout=True,
            stderr=True,
        )
        
        yield json.dumps({
            "type": "status",
            "data": "Exécution en cours..."
        }) + "\n"
        
        # Attendre l'exécution avec timeout
        try:
            result = container.wait(timeout=10)  # 10 secondes max
            exit_code = result['StatusCode']
            
            # Récupérer les logs
            logs = container.logs(stdout=True, stderr=True).decode('utf-8')
            
            # Séparer stdout et stderr (simplifié)
            stdout = logs
            stderr = ""
            
            if exit_code != 0:
                stderr = logs
                stdout = ""
            
            # Envoyer le résultat
            yield json.dumps({
                "type": "result",
                "data": {
                    "stdout": stdout,
                    "stderr": stderr,
                    "exit_code": exit_code
                }
            }) + "\n"
            
        except Exception as timeout_error:
            # Timeout ou erreur
            try:
                container.kill()
            except:
                pass
            
            yield json.dumps({
                "type": "error",
                "data": f"Timeout : exécution trop longue (>10s)"
            }) + "\n"
            
    except docker.errors.ImageNotFound:
        yield json.dumps({
            "type": "error",
            "data": f"Image Docker '{image}' introuvable. Exécutez: docker pull {image}"
        }) + "\n"
        
    except docker.errors.APIError as e:
        yield json.dumps({
            "type": "error",
            "data": f"Erreur Docker : {str(e)}"
        }) + "\n"
        
    except Exception as e:
        yield json.dumps({
            "type": "error",
            "data": f"Erreur inattendue : {str(e)}"
        }) + "\n"


@router.post("/execute/stream")
async def execute_code_stream(request: CodeExecutionRequest):
    """
    Exécute du code et stream le résultat en temps réel
    
    Format de réponse (Server-Sent Events) :
    - {"type": "status", "data": "message"}
    - {"type": "result", "data": {...}}
    - {"type": "error", "data": "message"}
    """
    
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code vide")
    
    return StreamingResponse(
        execute_code_in_docker(
            request.code,
            request.language,
            request.stdin
        ),
        media_type="text/event-stream"
    )


@router.post("/execute")
async def execute_code(request: CodeExecutionRequest) -> CodeExecutionResult:
    """
    Exécute du code et retourne le résultat complet
    (Version non-streaming pour compatibilité)
    """
    
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code vide")
    
    result_data = {
        "stdout": "",
        "stderr": "",
        "exit_code": 1,
        "execution_time_ms": 0,
        "error": None
    }
    
    # Collecter tous les événements du stream
    async for event_json in execute_code_in_docker(
        request.code, 
        request.language, 
        request.stdin
    ):
        try:
            event = json.loads(event_json)
            
            if event["type"] == "result":
                result_data["stdout"] = event["data"]["stdout"]
                result_data["stderr"] = event["data"]["stderr"]
                result_data["exit_code"] = event["data"]["exit_code"]
                
            elif event["type"] == "error":
                result_data["error"] = event["data"]
                result_data["exit_code"] = 1
                
        except json.JSONDecodeError:
            continue
    
    return CodeExecutionResult(**result_data)


@router.get("/languages")
async def get_supported_languages():
    """
    Liste les langages supportés
    """
    return {
        "languages": [
            {"id": lang, "name": lang.capitalize(), "supported": cmd is not None}
            for lang, cmd in LANGUAGE_COMMANDS.items()
        ]
    }


@router.get("/health")
async def health_check():
    """
    Vérifie que Docker est disponible
    """
    if not docker_client:
        return {
            "status": "error",
            "message": "Docker non disponible",
            "docker_available": False
        }
    
    try:
        docker_client.ping()
        return {
            "status": "ok",
            "message": "Service d'exécution opérationnel",
            "docker_available": True
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Docker inaccessible : {str(e)}",
            "docker_available": False
        }


