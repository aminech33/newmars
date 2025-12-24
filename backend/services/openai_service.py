"""
Service d'intégration OpenAI GPT
Génération de questions adaptatives et planification de projets
"""
import json
from openai import OpenAI
from typing import Dict, Any, Optional, List
from config import settings
from models.learning import Question, QuestionOption
import uuid
from datetime import datetime


class OpenAIService:
    """Service pour interagir avec OpenAI GPT"""
    
    def __init__(self):
        """Initialise le service OpenAI"""
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "gpt-4o-mini"  # Modèle rapide et économique
    
    def generate_content(self, prompt: str) -> str:
        """
        Génère du contenu via GPT
        """
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "Tu es un expert en planification de tâches. Tu génères des listes de tâches ACTIONNABLES pour un gestionnaire de tâches. Chaque tâche doit être concrète, exécutable et mesurable. Tu réponds UNIQUEMENT en JSON valide, sans commentaires ni explications."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,  # Basse pour JSON structuré et cohérent
            max_tokens=16000  # Max pour permettre des plans complets (40-80 tâches)
        )
        return response.choices[0].message.content
    
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
        
        prompt = f"""Tu es un tuteur adaptatif expert.

PROFIL DE L'APPRENANT:
- Topic: {topic_name}
- Niveau de maîtrise: {mastery_level}%
- Difficulté demandée: {difficulty}
- Style d'apprentissage: {learning_style or "non défini"}
- Points faibles: {", ".join(weak_areas) if weak_areas else "aucun"}

INSTRUCTIONS:
1. Génère UNE question adaptée au niveau {mastery_level}%
2. Difficulté: {self._get_difficulty_description(difficulty)}
3. Question claire et engageante

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
    "explanation": "Explication",
    "hints": ["Indice"],
    "estimated_time": 45,
    "tags": ["tag1"]
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
