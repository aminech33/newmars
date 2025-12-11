"""
Service d'intégration Gemini AI
Génération de questions adaptatives
"""
import json
import google.generativeai as genai
from typing import Dict, Any, Optional, List
from config import settings
from models.learning import Question, QuestionOption
import uuid
from datetime import datetime


class GeminiService:
    """Service pour interagir avec Gemini AI"""
    
    def __init__(self):
        """Initialise le service Gemini"""
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
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
        Génère une question adaptée via Gemini
        
        Args:
            topic_name: Nom du topic
            difficulty: "easy" | "medium" | "hard"
            mastery_level: Niveau de maîtrise (0-100)
            learning_style: Style d'apprentissage
            weak_areas: Points faibles identifiés
            context: Contexte additionnel
            
        Returns:
            Question générée
        """
        
        # Construction du prompt adaptatif
        prompt = self._build_adaptive_prompt(
            topic_name,
            difficulty,
            mastery_level,
            learning_style,
            weak_areas,
            context
        )
        
        try:
            response = self.model.generate_content(prompt)
            question_data = self._parse_response(response.text)
            
            # Créer l'objet Question
            question = Question(
                id=str(uuid.uuid4()),
                topic_id="",  # Sera set par l'appelant
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
            # Fallback question si échec
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
        """
        Construit un prompt adaptatif pour Gemini
        
        Le prompt s'adapte au profil de l'apprenant
        """
        
        prompt = f"""Tu es un tuteur adaptatif expert pour des apprenants procrastinateurs.

PROFIL DE L'APPRENANT:
- Topic: {topic_name}
- Niveau de maîtrise: {mastery_level}%
- Difficulté demandée: {difficulty}
- Style d'apprentissage: {learning_style or "non défini"}
- Points faibles identifiés: {", ".join(weak_areas) if weak_areas else "aucun"}

INSTRUCTIONS:
1. Génère UNE question adaptée au niveau {mastery_level}%
2. Difficulté: {self._get_difficulty_description(difficulty)}
3. La question doit être {"très concrète et pratique" if learning_style == "practical" else "claire et engageante"}
4. Inclus un exemple visuel ou diagramme si le style est "visual"
5. Concentre-toi sur les points faibles s'ils existent

FORMAT DE RÉPONSE (JSON strict):
{{
    "question": "La question claire et engageante",
    "options": [
        {{"text": "Option A", "is_correct": false}},
        {{"text": "Option B", "is_correct": true}},
        {{"text": "Option C", "is_correct": false}},
        {{"text": "Option D", "is_correct": false}}
    ],
    "correct_answer": "Option B",
    "explanation": "Explication détaillée et encourageante",
    "hints": ["Indice subtil si besoin d'aide"],
    "estimated_time": 45,
    "tags": ["tag1", "tag2"]
}}

IMPORTANT:
- Rends la question juste assez difficile pour être stimulante mais pas frustrante
- Utilise un ton encourageant et motivant (pour procrastinateurs!)
- Si niveau bas (<30%), questions très simples pour succès rapide
- Si niveau élevé (>70%), questions challengeantes

{f"CONTEXTE ADDITIONNEL: {context}" if context else ""}

Génère UNIQUEMENT le JSON, sans texte avant ou après."""

        return prompt
    
    def _get_difficulty_description(self, difficulty: str) -> str:
        """Description de la difficulté pour le prompt"""
        descriptions = {
            "easy": "Simple, concepts de base, succès rapide garanti",
            "medium": "Intermédiaire, nécessite compréhension, stimulant sans être frustrant",
            "hard": "Avancé, demande réflexion, pour experts"
        }
        return descriptions.get(difficulty, descriptions["medium"])
    
    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """Parse la réponse JSON de Gemini"""
        try:
            # Nettoyer la réponse (enlever markdown potentiel)
            clean_text = response_text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
            
            return json.loads(clean_text.strip())
        except json.JSONDecodeError:
            # Si parsing échoue, fallback
            raise ValueError("Failed to parse Gemini response")
    
    def _create_fallback_question(self, topic_name: str, difficulty: str) -> Question:
        """
        Créé une question fallback si Gemini échoue
        """
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
            explanation="Ceci est une question de secours",
            hints=[],
            generated_at=datetime.now()
        )
    
    async def generate_encouragement(
        self,
        is_correct: bool,
        streak: int,
        mastery_change: int
    ) -> str:
        """
        Génère un message d'encouragement personnalisé
        
        Args:
            is_correct: Réponse correcte?
            streak: Streak actuel
            mastery_change: Changement de maîtrise
            
        Returns:
            Message d'encouragement
        """
        
        prompt = f"""Tu es un coach motivant pour procrastinateurs.

SITUATION:
- Réponse: {"✅ CORRECTE" if is_correct else "❌ Incorrecte"}
- Streak actuel: {streak} jours
- Changement maîtrise: {mastery_change:+d} points

Génère un message court (max 2 phrases) qui:
1. {"Félicite chaleureusement" if is_correct else "Encourage sans critiquer"}
2. {"Met en avant le streak si > 0" if streak > 0 else "Motive à démarrer un streak"}
3. Reste positif et énergique

Ton: Ami supportif, jamais condescendant."""

        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except:
            # Fallback messages
            if is_correct:
                return f"🎉 Excellent ! Tu es sur un streak de {streak} jours !" if streak > 0 else "👏 Bien joué ! Continue comme ça !"
            else:
                return "💪 Pas grave ! On apprend de nos erreurs. Réessaye !"


# Instance globale
gemini_service = GeminiService()
