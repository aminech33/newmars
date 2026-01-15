"""
🧠 Routes API pour le Chat IA avec contexte SQLite
L'IA a accès aux données d'apprentissage pour personnaliser ses réponses
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import logging
from openai import OpenAI
from config import settings
from database import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["Chat"])


class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str


class ChatRequest(BaseModel):
    course_id: str
    course_name: str
    course_description: Optional[str] = None
    course_level: Optional[str] = None
    user_message: str
    conversation_history: List[ChatMessage] = []
    code_context: Optional[str] = None
    code_language: Optional[str] = None
    system_prompt: Optional[str] = None


def get_learning_context(course_id: str) -> Dict[str, Any]:
    """
    Récupère le contexte d'apprentissage depuis SQLite
    pour enrichir le prompt IA
    """
    context = {
        "concepts": [],
        "mastery_stats": {},
        "vocabulary": [],
        "recent_exercises": []
    }

    try:
        # 1. Récupérer les concepts du cours avec leur maîtrise
        concepts = db.get_concepts(course_id)
        if concepts:
            context["concepts"] = [
                {
                    "name": c["concept"],
                    "category": c.get("category"),
                    "mastery": c.get("mastery_level", 0),
                    "times_used": c.get("times_referenced", 0)
                }
                for c in concepts[:10]  # Limiter à 10 concepts
            ]

        # 2. Statistiques globales
        stats = db.get_concept_stats(course_id)
        if stats:
            context["mastery_stats"] = {
                "total_concepts": stats.get("total", 0),
                "avg_mastery": round(stats.get("avg_mastery") or 0, 1),
                "mastered_count": stats.get("mastered", 0),
                "needs_review": stats.get("needs_review", 0)
            }

        logger.info(f"📊 Contexte SQLite chargé pour {course_id}: {len(context['concepts'])} concepts")

    except Exception as e:
        logger.warning(f"⚠️ Erreur chargement contexte SQLite: {e}")

    return context


def build_system_prompt(request: ChatRequest, learning_context: Dict[str, Any]) -> str:
    """
    Construit le prompt système enrichi avec le contexte SQLite
    """
    base_prompt = request.system_prompt or f"Tu es un assistant expert en {request.course_name}."

    # Ajouter les infos du cours
    prompt_parts = [base_prompt]
    prompt_parts.append(f"\n\n📚 COURS: {request.course_name}")

    if request.course_description:
        prompt_parts.append(f"Description: {request.course_description}")

    if request.course_level:
        prompt_parts.append(f"Niveau: {request.course_level}")

    # 🧠 Ajouter le contexte d'apprentissage SQLite
    if learning_context["concepts"]:
        prompt_parts.append("\n\n📊 PROFIL D'APPRENTISSAGE DE L'UTILISATEUR:")

        # Concepts maîtrisés
        mastered = [c for c in learning_context["concepts"] if c["mastery"] >= 70]
        if mastered:
            mastered_names = ", ".join([c["name"] for c in mastered])
            prompt_parts.append(f"✅ Concepts maîtrisés (>70%): {mastered_names}")

        # Concepts à réviser
        needs_review = [c for c in learning_context["concepts"] if c["mastery"] < 50]
        if needs_review:
            review_names = ", ".join([c["name"] for c in needs_review])
            prompt_parts.append(f"⚠️ Concepts à renforcer (<50%): {review_names}")

        # Stats globales
        stats = learning_context["mastery_stats"]
        if stats.get("total_concepts", 0) > 0:
            prompt_parts.append(f"📈 Maîtrise moyenne: {stats['avg_mastery']}%")

    # Ajouter le contexte code si présent
    if request.code_context and request.code_context.strip():
        prompt_parts.append(f"\n\n--- Code actuel ({request.code_language or 'inconnu'}) ---")
        prompt_parts.append(request.code_context)
        prompt_parts.append("--- Fin du code ---")

    # Instructions pour l'IA
    prompt_parts.append("\n\n📝 INSTRUCTIONS:")
    prompt_parts.append("- Adapte tes explications au niveau de maîtrise de l'utilisateur")
    prompt_parts.append("- Ne répète pas les concepts déjà maîtrisés, sauf si demandé")
    prompt_parts.append("- Propose des exercices sur les concepts faibles quand c'est pertinent")
    prompt_parts.append("- Sois concis et pratique")

    return "\n".join(prompt_parts)


async def generate_stream(request: ChatRequest):
    """
    Génère une réponse en streaming via OpenAI
    avec contexte SQLite enrichi
    """
    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        # Charger le contexte SQLite
        learning_context = get_learning_context(request.course_id)

        # Construire le prompt enrichi
        system_prompt = build_system_prompt(request, learning_context)

        # Construire les messages
        messages = [{"role": "system", "content": system_prompt}]

        # Ajouter l'historique (limité aux 20 derniers)
        for msg in request.conversation_history[-20:]:
            messages.append({
                "role": msg.role if msg.role in ["user", "assistant"] else "user",
                "content": msg.content
            })

        # Ajouter le message utilisateur
        messages.append({"role": "user", "content": request.user_message})

        logger.info(f"🤖 Chat streaming pour cours {request.course_id} ({len(messages)} messages)")

        # Appel OpenAI avec streaming
        stream = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
            max_tokens=2048,
            stream=True
        )

        for chunk in stream:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                # Format SSE
                yield f"data: {json.dumps({'content': content})}\n\n"

        # Signal de fin
        yield f"data: {json.dumps({'done': True})}\n\n"

    except Exception as e:
        logger.error(f"❌ Erreur chat streaming: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """
    Endpoint de chat avec streaming et contexte SQLite

    L'IA reçoit:
    - Les concepts maîtrisés par l'utilisateur
    - Les concepts à renforcer
    - Les statistiques d'apprentissage
    - Le contexte du code (si applicable)
    """
    return StreamingResponse(
        generate_stream(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.post("/simple")
async def chat_simple(request: ChatRequest):
    """
    Endpoint de chat non-streaming (pour debug/fallback)
    """
    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        # Charger le contexte SQLite
        learning_context = get_learning_context(request.course_id)

        # Construire le prompt enrichi
        system_prompt = build_system_prompt(request, learning_context)

        # Construire les messages
        messages = [{"role": "system", "content": system_prompt}]

        for msg in request.conversation_history[-20:]:
            messages.append({
                "role": msg.role if msg.role in ["user", "assistant"] else "user",
                "content": msg.content
            })

        messages.append({"role": "user", "content": request.user_message})

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
            max_tokens=2048
        )

        return {
            "success": True,
            "response": response.choices[0].message.content,
            "context_used": {
                "concepts_count": len(learning_context["concepts"]),
                "avg_mastery": learning_context["mastery_stats"].get("avg_mastery", 0)
            }
        }

    except Exception as e:
        logger.error(f"❌ Erreur chat simple: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/context/{course_id}")
async def get_context(course_id: str):
    """
    Debug: Voir le contexte SQLite qui sera envoyé à l'IA
    """
    context = get_learning_context(course_id)
    return {
        "course_id": course_id,
        "context": context
    }
