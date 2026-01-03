"""
Service d'intégration OpenAI GPT
Génération de questions adaptatives et planification de projets
Avec retry automatique et gestion d'erreurs robuste
"""
import json
import logging
from openai import OpenAI
from typing import Dict, Any, Optional, List
from config import settings
from models.learning import Question, QuestionOption
import uuid
from datetime import datetime
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log
)
import openai

# Configuration du logger
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


class OpenAIService:
    """Service pour interagir avec OpenAI GPT avec retry automatique"""
    
    def __init__(self):
        """Initialise le service OpenAI"""
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "gpt-4o-mini"  # Modèle rapide et économique
        logger.info(f"✅ OpenAI Service initialisé avec modèle: {self.model}")
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=2, max=10),
        retry=retry_if_exception_type((
            openai.APIError,
            openai.APIConnectionError,
            openai.RateLimitError,
            openai.APITimeoutError
        )),
        before_sleep=before_sleep_log(logger, logging.WARNING)
    )
    def generate_content(self, prompt: str, timeout: int = 45) -> str:
        """
        Génère du contenu via GPT avec retry automatique
        
        Args:
            prompt: Le prompt à envoyer
            timeout: Timeout en secondes (default: 45s)
            
        Returns:
            Réponse générée par GPT
            
        Raises:
            openai.APIError: Erreur API après 3 tentatives
            openai.RateLimitError: Rate limit atteint
            openai.APITimeoutError: Timeout après 3 tentatives
        """
        try:
            logger.info(f"🤖 Génération GPT (tentative, timeout={timeout}s)")
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Tu es un expert en planification de tâches. Tu génères des listes de tâches ACTIONNABLES pour un gestionnaire de tâches. Chaque tâche doit être concrète, exécutable et mesurable. Tu réponds UNIQUEMENT en JSON valide, sans commentaires ni explications."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=16000,
                timeout=timeout
            )
            
            content = response.choices[0].message.content
            logger.info(f"✅ Génération réussie ({len(content)} caractères)")
            return content
            
        except openai.RateLimitError as e:
            logger.error(f"⚠️ Rate limit atteint: {e}")
            raise
        except openai.APITimeoutError as e:
            logger.error(f"⏱️ Timeout GPT: {e}")
            raise
        except openai.APIConnectionError as e:
            logger.error(f"🔌 Erreur connexion OpenAI: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ Erreur inattendue: {type(e).__name__}: {e}")
            raise
    
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
        Génère une question adaptée via GPT
        """
        prompt = self._build_adaptive_prompt(
            topic_name,
            difficulty,
            mastery_level,
            learning_style,
            weak_areas,
            context
        )
        
        try:
            response_text = self.generate_content(prompt)
            question_data = self._parse_response(response_text)
            
            question = Question(
                id=str(uuid.uuid4()),
                topic_id="",
                difficulty=difficulty,
                question_text=question_data["question"],
                question_type="multiple_choice",
                options=[
                    QuestionOption(
                        id=str(uuid.uuid4()),
                        text=opt["text"],
                        is_correct=opt["is_correct"]
                    )
                    for opt in question_data["options"]
                ],
                correct_answer=question_data["correct_answer"],
                explanation=question_data.get("explanation"),
                hints=question_data.get("hints", []),
                generated_at=datetime.now(),
                estimated_time=question_data.get("estimated_time", 60),
                tags=question_data.get("tags", [])
            )
            
            return question
            
        except Exception as e:
            print(f"❌ Erreur génération question: {e}")
            return self._create_fallback_question(topic_name, difficulty)
    
    def _build_adaptive_prompt(
        self,
        topic_name: str,
        difficulty: str,
        mastery_level: int,
        learning_style: Optional[str],
        weak_areas: List[str],
        context: Optional[str]
    ) -> str:
        """Construit un prompt adaptatif pour GPT"""
        
        prompt = f"""Tu es un tuteur adaptatif expert en calibration de questions.

PROFIL DE L'APPRENANT:
- Topic: {topic_name}
- Niveau de maîtrise: {mastery_level}%
- Difficulté demandée: {difficulty}
- Style d'apprentissage: {learning_style or "non défini"}
- Points faibles: {", ".join(weak_areas) if weak_areas else "aucun"}

═══════════════════════════════════════════════════════════════
CALIBRAGE DE LA DIFFICULTÉ {difficulty.upper()}
═══════════════════════════════════════════════════════════════

{self._get_difficulty_examples(difficulty, mastery_level)}

⚠️ CRITÈRES STRICTS POUR {difficulty.upper()}:

{"• Temps: 20-45 secondes maximum" if difficulty == "easy" else ""}
{"• Une seule étape de raisonnement" if difficulty == "easy" else ""}
{"• Vocabulaire simple et direct" if difficulty == "easy" else ""}
{"• Pas de pièges ni de cas limites" if difficulty == "easy" else ""}

{"• Temps: 45-90 secondes" if difficulty == "medium" else ""}
{"• 2-3 étapes de raisonnement" if difficulty == "medium" else ""}
{"• Combine 2-3 concepts liés" if difficulty == "medium" else ""}
{"• Application pratique requise" if difficulty == "medium" else ""}

{"• Temps: 90-180 secondes" if difficulty == "hard" else ""}
{"• Analyse multi-niveau" if difficulty == "hard" else ""}
{"• Synthesis de concepts avancés" if difficulty == "hard" else ""}
{"• Demande expertise et réflexion profonde" if difficulty == "hard" else ""}

═══════════════════════════════════════════════════════════════

INSTRUCTIONS:
1. Génère UNE question qui matche EXACTEMENT la complexité des exemples ci-dessus
2. La question doit correspondre au niveau {mastery_level}%
3. Respecte le temps estimé pour {difficulty}
4. Assure-toi que les distracteurs (mauvaises réponses) sont plausibles

FORMAT DE RÉPONSE (JSON strict):
{{
    "question": "La question",
    "options": [
        {{"text": "Option A", "is_correct": false}},
        {{"text": "Option B", "is_correct": true}},
        {{"text": "Option C", "is_correct": false}},
        {{"text": "Option D", "is_correct": false}}
    ],
    "correct_answer": "Option B",
    "explanation": "Explication claire et pédagogique",
    "hints": ["Indice subtil si l'utilisateur bloque"],
    "estimated_time": {30 if difficulty == "easy" else 60 if difficulty == "medium" else 120},
    "tags": ["tag1", "tag2"]
}}

{f"CONTEXTE: {context}" if context else ""}

Génère UNIQUEMENT le JSON."""

        return prompt
    
    def _get_difficulty_description(self, difficulty: str) -> str:
        descriptions = {
            "easy": "Simple, concepts de base",
            "medium": "Intermédiaire, stimulant",
            "hard": "Avancé, demande réflexion"
        }
        return descriptions.get(difficulty, descriptions["medium"])
    
    def _get_difficulty_examples(self, difficulty: str, mastery_level: int) -> str:
        """Génère des exemples concrets pour calibrer GPT"""
        
        if difficulty == "easy":
            return f"""
EXEMPLES DE QUESTIONS EASY (pour mastery {mastery_level}%):
• "Qu'est-ce qu'une variable en programmation ?"
  → Définition simple, concept fondamental
  → Temps estimé: 20-40s
  → Réponse directe sans piège

• "Quelle est la différence entre = et == ?"
  → Comparaison basique de deux concepts
  → Une seule opération mentale requise
  → Pas de contexte complexe
"""
        
        elif difficulty == "medium":
            return f"""
EXEMPLES DE QUESTIONS MEDIUM (pour mastery {mastery_level}%):
• "Que va afficher ce code : x = [1,2]; y = x; y.append(3); print(x) ?"
  → Nécessite compréhension des références
  → 2-3 étapes de raisonnement
  → Temps estimé: 45-90s
  → Combine plusieurs concepts (listes, références, méthodes)

• "Comment optimiser une boucle qui cherche dans une liste de 10000 éléments ?"
  → Application pratique d'un concept
  → Nécessite analyse et choix de solution
"""
        
        else:  # hard
            return f"""
EXEMPLES DE QUESTIONS HARD (pour mastery {mastery_level}%):
• "Expliquez pourquoi ce code a une complexité O(n²) et proposez une optimisation O(n)"
  → Analyse de complexité algorithmique
  → Nécessite compréhension profonde
  → Temps estimé: 90-180s
  → Synthesis de plusieurs concepts avancés

• "Debuggez ce code qui a un memory leak subtil avec les closures"
  → Problème complexe multi-couches
  → Demande expertise et expérience
"""
    
    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """Parse la réponse JSON de GPT (pour questions)"""
        try:
            clean_text = response_text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
            
            data = json.loads(clean_text.strip())
            
            # Validation simple pour les questions
            # Les champs requis dépendent du contexte (question vs projet)
            # On retourne directement les données parsées
            return data
            
        except json.JSONDecodeError as e:
            print(f"❌ Erreur parsing JSON: {e}")
            print(f"Réponse brute: {response_text[:500]}")
            raise ValueError("Réponse GPT non valide (JSON malformé)")
    
    def _create_fallback_question(self, topic_name: str, difficulty: str) -> Question:
        """Créé une question fallback si GPT échoue"""
        return Question(
            id=str(uuid.uuid4()),
            topic_id="",
            difficulty=difficulty,
            question_text=f"Question sur {topic_name} (fallback)",
            question_type="multiple_choice",
            options=[
                QuestionOption(id=str(uuid.uuid4()), text="Option A", is_correct=False),
                QuestionOption(id=str(uuid.uuid4()), text="Option B", is_correct=True),
                QuestionOption(id=str(uuid.uuid4()), text="Option C", is_correct=False),
                QuestionOption(id=str(uuid.uuid4()), text="Option D", is_correct=False),
            ],
            correct_answer="Option B",
            explanation="Question de secours",
            hints=[],
            generated_at=datetime.now()
        )
    
    async def generate_encouragement(
        self,
        is_correct: bool,
        streak: int,
        mastery_change: int
    ) -> str:
        """Génère un message d'encouragement personnalisé"""
        
        prompt = f"""Tu es un coach motivant pour procrastinateurs.

SITUATION:
- Réponse: {"✅ CORRECTE" if is_correct else "❌ Incorrecte"}
- Streak: {streak} jours
- Changement maîtrise: {mastery_change:+d} points

Génère un message court (max 2 phrases), positif et énergique.
Réponds UNIQUEMENT avec le message, sans JSON, sans formatage."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Tu es un coach motivant. Réponds uniquement avec le message d'encouragement, sans JSON ni formatage."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=100
            )
            message = response.choices[0].message.content.strip()
            # Nettoyer les balises JSON si présentes
            if message.startswith("```"):
                message = message.split("```")[1] if "```" in message[3:] else message
            if message.startswith("{") or message.startswith("["):
                # Essayer d'extraire le texte du JSON
                try:
                    import json
                    data = json.loads(message)
                    message = data.get("message", message) if isinstance(data, dict) else message
                except:
                    pass
            return message.strip()
        except:
            if is_correct:
                return f"🎉 Excellent ! Streak de {streak} jours !" if streak > 0 else "👏 Bien joué !"
            else:
                return "💪 Pas grave ! Réessaye !"


# Instance globale
openai_service = OpenAIService()
