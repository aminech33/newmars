"""
Service d'intégration Google Gemini
Génération de questions adaptatives avec fallback OpenAI
"""
import logging
from typing import Dict, Any, Optional, List
from config import settings
from models.learning import Question
from services.openai_service import openai_service

# Configuration du logger
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


class GeminiService:
    """
    Service pour interagir avec Google Gemini
    Pour l'instant, utilise OpenAI comme fallback
    """
    
    def __init__(self):
        """Initialise le service Gemini"""
        logger.info("⚠️ Gemini Service: Utilise OpenAI comme fallback")
        self.fallback_service = openai_service
    
    async def generate_question(
        self,
        topic_name: str,
        difficulty: str,
        mastery_level: int,
        learning_style: Optional[str] = None,
        weak_areas: List[str] = [],
        context: Optional[str] = None
    ) -> Question:
        """
        Génère une question adaptée via Gemini (ou OpenAI en fallback)
        """
        logger.info(f"🤖 Génération question (via OpenAI fallback): {topic_name} - {difficulty}")
        
        return await self.fallback_service.generate_question(
            topic_name=topic_name,
            difficulty=difficulty,
            mastery_level=mastery_level,
            learning_style=learning_style,
            weak_areas=weak_areas,
            context=context
        )
    
    async def generate_encouragement(
        self,
        is_correct: bool,
        streak: int,
        mastery_change: int
    ) -> str:
        """Génère un message d'encouragement personnalisé"""
        logger.info(f"💬 Génération encouragement (via OpenAI fallback)")
        
        return await self.fallback_service.generate_encouragement(
            is_correct=is_correct,
            streak=streak,
            mastery_change=mastery_change
        )


# Instance globale
gemini_service = GeminiService()

