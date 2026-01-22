"""
=============================================================================
ADAPTIVE CONTENT GENERATOR - Génération de contenu IA personnalisé
=============================================================================

Ce module génère du contenu d'apprentissage personnalisé basé sur:
- Les topics faibles de l'utilisateur
- Les patterns d'erreurs détectés
- Le style d'apprentissage préféré
- L'état émotionnel et cognitif

Fonctionnalités:
1. Génération de micro-leçons ciblées
2. Exercices adaptatifs basés sur les lacunes
3. Explications personnalisées selon le style
4. Récapitulatifs intelligents
5. Plans de remédiation automatiques

Basé sur les principes de:
- Zone de Développement Proximal (Vygotsky)
- Théorie de la Charge Cognitive (Sweller)
- Apprentissage Personnalisé (Bloom)
"""

import logging
import json
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

from services.ai_dispatcher import AIDispatcher, TaskType, ModelTier
from services.socratic_tutor import create_socratic_tutor
from databases import tutor_profile_db as profile_db

logger = logging.getLogger(__name__)


def extract_json(text: str) -> dict:
    """
    Extrait un objet JSON d'un texte, même s'il est wrapped dans markdown.

    Gère les cas:
    - JSON pur
    - ```json ... ```
    - Texte avant/après le JSON
    """
    import re

    # Essayer de parser directement
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Chercher un bloc ```json...```
    json_block = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if json_block:
        try:
            return json.loads(json_block.group(1))
        except json.JSONDecodeError:
            pass

    # Chercher un objet JSON dans le texte
    json_match = re.search(r'\{[\s\S]*\}', text)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass

    # Échec
    raise json.JSONDecodeError("No valid JSON found", text, 0)


class ContentType(str, Enum):
    """Types de contenu générables"""
    MICRO_LESSON = "micro_lesson"       # Leçon courte ciblée (3-5 min)
    EXERCISE_SET = "exercise_set"       # Set d'exercices adaptatifs
    EXPLANATION = "explanation"          # Explication personnalisée
    SUMMARY = "summary"                  # Récapitulatif intelligent
    REMEDIATION = "remediation"          # Plan de remédiation
    PRACTICE_QUIZ = "practice_quiz"      # Quiz de pratique ciblé
    CONCEPT_MAP = "concept_map"          # Carte conceptuelle
    MNEMONIC = "mnemonic"                # Aide-mémoire personnalisé


class LearningStyle(str, Enum):
    """Styles d'apprentissage détectés"""
    VISUAL = "visual"           # Préfère diagrammes, schémas
    VERBAL = "verbal"           # Préfère texte, explications
    EXAMPLE_BASED = "example"   # Apprend par exemples
    RULE_BASED = "rule"         # Préfère règles abstraites
    STEP_BY_STEP = "step"       # Préfère approche progressive
    BIG_PICTURE = "big_picture" # Préfère vue d'ensemble d'abord


@dataclass
class LearnerProfile:
    """Profil d'apprentissage agrégé pour la génération"""
    user_id: str
    weak_topics: Dict[str, float]           # topic -> mastery (0-1)
    error_patterns: List[str]                # Types d'erreurs fréquentes
    learning_style: LearningStyle            # Style préféré
    optimal_difficulty: int                  # 1-5
    needs_encouragement: bool
    prefers_examples: bool
    cognitive_state: str                     # "fresh", "tired", "frustrated"
    recent_mistakes: List[Dict[str, Any]]    # Dernières erreurs pour ciblage


@dataclass
class GeneratedContent:
    """Contenu généré par l'IA"""
    type: ContentType
    topic: str
    title: str
    content: str
    exercises: List[Dict[str, Any]] = field(default_factory=list)
    key_points: List[str] = field(default_factory=list)
    estimated_duration_minutes: int = 5
    difficulty: int = 3
    metadata: Dict[str, Any] = field(default_factory=dict)
    generated_at: datetime = field(default_factory=datetime.now)


class AdaptiveContentGenerator:
    """
    Générateur de contenu adaptatif utilisant l'IA.

    Crée du contenu personnalisé basé sur le profil de l'apprenant,
    ses faiblesses, et son style d'apprentissage.
    """

    def __init__(self, ai_dispatcher: AIDispatcher = None):
        """Initialise le générateur."""
        self.ai = ai_dispatcher or AIDispatcher()
        self.tutor = create_socratic_tutor()

        # Templates de prompts par type de contenu
        self._prompts = self._load_prompt_templates()

        logger.info("🎨 AdaptiveContentGenerator initialisé")

    def _load_prompt_templates(self) -> Dict[ContentType, str]:
        """Charge les templates de prompts."""
        return {
            ContentType.MICRO_LESSON: """
Tu es un professeur expert en pédagogie. Crée une MICRO-LEÇON de 3-5 minutes sur le sujet suivant.

SUJET: {topic}
NIVEAU DE MAÎTRISE ACTUEL: {mastery}%
ERREURS FRÉQUENTES: {errors}
STYLE D'APPRENTISSAGE: {style}
ÉTAT COGNITIF: {cognitive_state}

CONSIGNES:
1. Commence par un HOOK engageant (question ou fait surprenant)
2. Explique le concept de manière {style_instruction}
3. Donne {example_count} exemple(s) concret(s)
4. Termine par 3 points clés à retenir
5. Adapte le ton: {tone}

FORMAT JSON:
{{
    "title": "Titre accrocheur",
    "hook": "Question ou fait engageant",
    "explanation": "Explication principale adaptée au style",
    "examples": ["exemple 1", "exemple 2"],
    "key_points": ["point 1", "point 2", "point 3"],
    "practice_hint": "Conseil pour pratiquer"
}}
""",
            ContentType.EXERCISE_SET: """
Tu es un créateur d'exercices pédagogiques. Crée un SET D'EXERCICES ciblés.

SUJET: {topic}
NIVEAU: {difficulty}/5
ERREURS À CORRIGER: {errors}
STYLE PRÉFÉRÉ: {style}

CONSIGNES:
1. Crée 5 exercices progressifs (du plus simple au plus complexe)
2. Chaque exercice doit cibler une erreur fréquente
3. Inclus des feedbacks explicatifs pour chaque réponse
4. Varie les types: QCM, vrai/faux, complétion, association

FORMAT JSON:
{{
    "title": "Titre du set",
    "exercises": [
        {{
            "type": "mcq|true_false|fill|match",
            "question": "Question",
            "options": ["A", "B", "C", "D"],
            "correct": "A",
            "explanation": "Pourquoi c'est correct",
            "targets_error": "Type d'erreur ciblée"
        }}
    ],
    "progression_tip": "Conseil de progression"
}}
""",
            ContentType.EXPLANATION: """
Tu es un tuteur patient et expert. Explique ce concept de manière personnalisée.

CONCEPT: {topic}
CE QUE L'ÉLÈVE NE COMPREND PAS: {confusion}
STYLE PRÉFÉRÉ: {style}
NIVEAU: {difficulty}/5
A BESOIN D'ENCOURAGEMENT: {needs_encouragement}

CONSIGNES:
1. Utilise une approche {style_instruction}
2. Commence par ce que l'élève SAIT déjà
3. Construis progressivement vers le concept difficile
4. Utilise des analogies si approprié
5. Termine par une vérification de compréhension

FORMAT JSON:
{{
    "intro": "Connexion avec ce que l'élève sait",
    "explanation": "Explication principale",
    "analogy": "Analogie si utile (null sinon)",
    "steps": ["étape 1", "étape 2", "étape 3"],
    "check_understanding": "Question pour vérifier",
    "encouragement": "Message d'encouragement"
}}
""",
            ContentType.REMEDIATION: """
Tu es un spécialiste en remédiation pédagogique. Crée un PLAN DE REMÉDIATION.

ÉLÈVE: {user_id}
TOPICS FAIBLES: {weak_topics}
PATTERNS D'ERREUR: {error_patterns}
HISTORIQUE: {history}

CONSIGNES:
1. Analyse les lacunes fondamentales
2. Propose un plan de 7 jours
3. Priorise par impact sur la progression
4. Inclus des checkpoints de validation
5. Adapte la charge cognitive

FORMAT JSON:
{{
    "diagnosis": "Analyse des lacunes",
    "priority_topics": ["topic1", "topic2"],
    "daily_plan": [
        {{
            "day": 1,
            "focus": "Topic principal",
            "activities": ["activité 1", "activité 2"],
            "duration_minutes": 20,
            "checkpoint": "Question de validation"
        }}
    ],
    "success_criteria": "Comment savoir que c'est maîtrisé",
    "motivation_tips": ["tip1", "tip2"]
}}
""",
            ContentType.MNEMONIC: """
Tu es expert en techniques de mémorisation. Crée un AIDE-MÉMOIRE personnalisé.

CONCEPT À RETENIR: {topic}
RÈGLE/INFO: {rule}
ERREURS FRÉQUENTES: {errors}
STYLE: {style}

CONSIGNES:
1. Crée un acronyme OU une phrase mnémotechnique
2. Utilise des associations visuelles si style visuel
3. Crée une histoire mémorable si besoin
4. Inclus un truc anti-erreur

FORMAT JSON:
{{
    "mnemonic": "La technique principale",
    "visual": "Description visuelle (null si pas applicable)",
    "story": "Mini-histoire mémorable (null si pas applicable)",
    "anti_error_trick": "Truc pour éviter l'erreur courante",
    "practice_phrase": "Phrase pour pratiquer"
}}
"""
        }

    def get_learner_profile(self, user_id: str) -> LearnerProfile:
        """
        Récupère et construit le profil d'apprentissage complet.

        Agrège les données du tuteur socratique et de la DB.
        """
        # Récupérer le profil du tuteur
        tutor_summary = self.tutor.get_profile_summary(user_id)

        # Déterminer le style d'apprentissage
        learning_style = LearningStyle.EXAMPLE_BASED  # Default
        style_data = tutor_summary.get("learning_style", {})
        if style_data.get("prefers_examples"):
            learning_style = LearningStyle.EXAMPLE_BASED
        elif style_data.get("prefers_step_by_step", False):
            learning_style = LearningStyle.STEP_BY_STEP

        # Déterminer l'état cognitif
        emotional = tutor_summary.get("emotional_state", {})
        frustration = float(emotional.get("frustration", "0%").replace("%", "")) / 100
        fatigue = float(emotional.get("fatigue", "0%").replace("%", "")) / 100

        if frustration > 0.6:
            cognitive_state = "frustrated"
        elif fatigue > 0.5:
            cognitive_state = "tired"
        else:
            cognitive_state = "fresh"

        # Récupérer les erreurs récentes
        recent_mistakes = []
        active_patterns = tutor_summary.get("active_patterns", [])

        # Weak topics avec leur mastery
        weak_topics = {}
        for topic, mastery_str in tutor_summary.get("weak_topics", {}).items():
            try:
                mastery = float(mastery_str.replace("%", "")) / 100
                weak_topics[topic] = mastery
            except:
                weak_topics[topic] = 0.3

        # Calculer la difficulté optimale basée sur l'accuracy globale
        global_acc = tutor_summary.get("global_accuracy", 0.5)
        if global_acc > 0.8:
            optimal_difficulty = 4
        elif global_acc > 0.6:
            optimal_difficulty = 3
        elif global_acc > 0.4:
            optimal_difficulty = 2
        else:
            optimal_difficulty = 1

        return LearnerProfile(
            user_id=user_id,
            weak_topics=weak_topics,
            error_patterns=active_patterns,
            learning_style=learning_style,
            optimal_difficulty=optimal_difficulty,
            needs_encouragement=style_data.get("needs_encouragement", False),
            prefers_examples=style_data.get("prefers_examples", True),
            cognitive_state=cognitive_state,
            recent_mistakes=recent_mistakes
        )

    def generate_micro_lesson(
        self,
        user_id: str,
        topic: str,
        force_style: LearningStyle = None
    ) -> GeneratedContent:
        """
        Génère une micro-leçon personnalisée sur un topic.

        La leçon est adaptée au:
        - Niveau de maîtrise actuel
        - Style d'apprentissage préféré
        - État cognitif
        - Erreurs fréquentes
        """
        profile = self.get_learner_profile(user_id)
        style = force_style or profile.learning_style

        # Récupérer la maîtrise du topic
        topic_mastery = profile.weak_topics.get(topic, 0.5) * 100

        # Adapter les instructions au style
        style_instructions = {
            LearningStyle.VISUAL: "visuelle avec des schémas mentaux décrits",
            LearningStyle.VERBAL: "textuelle détaillée",
            LearningStyle.EXAMPLE_BASED: "basée sur des exemples concrets",
            LearningStyle.RULE_BASED: "structurée avec des règles claires",
            LearningStyle.STEP_BY_STEP: "progressive étape par étape",
            LearningStyle.BIG_PICTURE: "en commençant par la vue d'ensemble",
        }

        # Adapter le ton à l'état cognitif
        tone_map = {
            "fresh": "énergique et stimulant",
            "tired": "calme et encourageant, phrases courtes",
            "frustrated": "très patient et rassurant, beaucoup d'encouragement"
        }

        # Construire le prompt
        prompt = self._prompts[ContentType.MICRO_LESSON].format(
            topic=topic,
            mastery=topic_mastery,
            errors=", ".join(profile.error_patterns) if profile.error_patterns else "aucune erreur spécifique",
            style=style.value,
            cognitive_state=profile.cognitive_state,
            style_instruction=style_instructions.get(style, "claire et accessible"),
            example_count=3 if profile.prefers_examples else 1,
            tone=tone_map.get(profile.cognitive_state, "neutre")
        )

        try:
            result = self.ai.dispatch(
                task_type=TaskType.EXPLANATION,
                prompt=prompt,
                system_prompt="Tu es un expert pédagogue. Réponds UNIQUEMENT en JSON valide.",
                difficulty="intermediate",
                temperature=0.7
            )

            content_data = extract_json(result.content)

            return GeneratedContent(
                type=ContentType.MICRO_LESSON,
                topic=topic,
                title=content_data.get("title", f"Leçon: {topic}"),
                content=content_data.get("explanation", ""),
                key_points=content_data.get("key_points", []),
                exercises=[],
                estimated_duration_minutes=5,
                difficulty=profile.optimal_difficulty,
                metadata={
                    "hook": content_data.get("hook"),
                    "examples": content_data.get("examples", []),
                    "practice_hint": content_data.get("practice_hint"),
                    "style_used": style.value,
                    "model_used": result.model_used
                }
            )
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parsing failed, extracting from content: {e}")
            # Essayer d'extraire le JSON du contenu (souvent wrapped dans ```json```)
            content_text = result.content if 'result' in locals() else ""
            try:
                # Chercher le JSON dans le contenu
                import re
                json_match = re.search(r'\{[\s\S]*\}', content_text)
                if json_match:
                    content_data = json.loads(json_match.group())
                    return GeneratedContent(
                        type=ContentType.MICRO_LESSON,
                        topic=topic,
                        title=content_data.get("title", f"Leçon: {topic}"),
                        content=content_data.get("explanation", content_text),
                        key_points=content_data.get("key_points", []),
                        exercises=[],
                        estimated_duration_minutes=5,
                        difficulty=profile.optimal_difficulty,
                        metadata={
                            "hook": content_data.get("hook"),
                            "examples": content_data.get("examples", []),
                            "practice_hint": content_data.get("practice_hint"),
                            "style_used": style.value
                        }
                    )
            except:
                pass
            # Fallback: retourner le contenu brut
            return GeneratedContent(
                type=ContentType.MICRO_LESSON,
                topic=topic,
                title=f"Leçon: {topic}",
                content=content_text,
                key_points=[],
                difficulty=profile.optimal_difficulty
            )
        except Exception as e:
            logger.error(f"Erreur génération micro-leçon: {e}")
            raise

    def generate_targeted_exercises(
        self,
        user_id: str,
        topic: str,
        count: int = 5
    ) -> GeneratedContent:
        """
        Génère des exercices ciblés sur les erreurs de l'utilisateur.

        Les exercices sont conçus pour:
        - Corriger les erreurs fréquentes
        - Progresser en difficulté
        - Fournir des feedbacks explicatifs
        """
        profile = self.get_learner_profile(user_id)

        prompt = self._prompts[ContentType.EXERCISE_SET].format(
            topic=topic,
            difficulty=profile.optimal_difficulty,
            errors=", ".join(profile.error_patterns) if profile.error_patterns else "variées",
            style=profile.learning_style.value
        )

        try:
            result = self.ai.dispatch(
                task_type=TaskType.QUIZ,
                prompt=prompt,
                system_prompt="Tu es un créateur d'exercices. Réponds UNIQUEMENT en JSON valide.",
                difficulty="medium",
                temperature=0.6
            )

            content_data = extract_json(result.content)

            return GeneratedContent(
                type=ContentType.EXERCISE_SET,
                topic=topic,
                title=content_data.get("title", f"Exercices: {topic}"),
                content="",
                exercises=content_data.get("exercises", [])[:count],
                key_points=[],
                estimated_duration_minutes=count * 2,
                difficulty=profile.optimal_difficulty,
                metadata={
                    "progression_tip": content_data.get("progression_tip"),
                    "targets_errors": profile.error_patterns
                }
            )
        except Exception as e:
            logger.error(f"Erreur génération exercices: {e}")
            raise

    def generate_personalized_explanation(
        self,
        user_id: str,
        topic: str,
        confusion: str = None
    ) -> GeneratedContent:
        """
        Génère une explication personnalisée pour un concept difficile.

        L'explication s'adapte au:
        - Ce que l'élève ne comprend pas
        - Son style d'apprentissage
        - Son besoin d'encouragement
        """
        profile = self.get_learner_profile(user_id)

        style_instructions = {
            LearningStyle.VISUAL: "avec des descriptions visuelles et des schémas mentaux",
            LearningStyle.EXAMPLE_BASED: "en partant d'exemples concrets vers la règle",
            LearningStyle.RULE_BASED: "en énonçant d'abord la règle puis les applications",
            LearningStyle.STEP_BY_STEP: "de manière très progressive, une idée à la fois"
        }

        prompt = self._prompts[ContentType.EXPLANATION].format(
            topic=topic,
            confusion=confusion or "le concept général",
            style=profile.learning_style.value,
            difficulty=profile.optimal_difficulty,
            needs_encouragement="oui" if profile.needs_encouragement else "non",
            style_instruction=style_instructions.get(profile.learning_style, "claire")
        )

        try:
            result = self.ai.dispatch(
                task_type=TaskType.EXPLANATION,
                prompt=prompt,
                system_prompt="Tu es un tuteur patient. Réponds UNIQUEMENT en JSON valide.",
                difficulty="intermediate",
                temperature=0.5
            )

            content_data = extract_json(result.content)

            full_content = content_data.get("intro", "") + "\n\n"
            full_content += content_data.get("explanation", "") + "\n\n"
            if content_data.get("analogy"):
                full_content += f"💡 Analogie: {content_data['analogy']}\n\n"
            if content_data.get("steps"):
                full_content += "📝 Étapes:\n" + "\n".join(f"  {i+1}. {s}" for i, s in enumerate(content_data["steps"]))

            return GeneratedContent(
                type=ContentType.EXPLANATION,
                topic=topic,
                title=f"Explication: {topic}",
                content=full_content,
                key_points=content_data.get("steps", []),
                estimated_duration_minutes=3,
                difficulty=profile.optimal_difficulty,
                metadata={
                    "check_understanding": content_data.get("check_understanding"),
                    "encouragement": content_data.get("encouragement"),
                    "analogy": content_data.get("analogy")
                }
            )
        except Exception as e:
            logger.error(f"Erreur génération explication: {e}")
            raise

    def generate_remediation_plan(
        self,
        user_id: str,
        days: int = 7
    ) -> GeneratedContent:
        """
        Génère un plan de remédiation personnalisé sur N jours.

        Analyse les lacunes et propose un programme structuré
        pour combler les gaps de manière optimale.
        """
        profile = self.get_learner_profile(user_id)

        # Trier les topics par faiblesse
        sorted_topics = sorted(profile.weak_topics.items(), key=lambda x: x[1])

        prompt = self._prompts[ContentType.REMEDIATION].format(
            user_id=user_id,
            weak_topics=json.dumps({t: f"{m*100:.0f}%" for t, m in sorted_topics}),
            error_patterns=", ".join(profile.error_patterns),
            history=f"Difficulté optimale: {profile.optimal_difficulty}/5, État: {profile.cognitive_state}"
        )

        try:
            result = self.ai.dispatch(
                task_type=TaskType.PLANNING,
                prompt=prompt,
                system_prompt="Tu es un spécialiste en remédiation. Réponds UNIQUEMENT en JSON valide.",
                temperature=0.4
            )

            content_data = extract_json(result.content)

            # Construire le contenu lisible
            content = f"📊 Diagnostic: {content_data.get('diagnosis', '')}\n\n"
            content += "📌 Priorités:\n"
            for p in content_data.get("priority_topics", []):
                content += f"  • {p}\n"
            content += "\n📅 Plan:\n"
            for day in content_data.get("daily_plan", [])[:days]:
                content += f"\nJour {day.get('day')}: {day.get('focus')}\n"
                for act in day.get("activities", []):
                    content += f"  → {act}\n"

            return GeneratedContent(
                type=ContentType.REMEDIATION,
                topic="remediation",
                title="Plan de Remédiation Personnalisé",
                content=content,
                key_points=content_data.get("priority_topics", []),
                estimated_duration_minutes=days * 20,
                difficulty=profile.optimal_difficulty,
                metadata={
                    "daily_plan": content_data.get("daily_plan", []),
                    "success_criteria": content_data.get("success_criteria"),
                    "motivation_tips": content_data.get("motivation_tips", [])
                }
            )
        except Exception as e:
            logger.error(f"Erreur génération plan remédiation: {e}")
            raise

    def generate_mnemonic(
        self,
        user_id: str,
        topic: str,
        rule: str
    ) -> GeneratedContent:
        """
        Génère un aide-mémoire personnalisé pour une règle.

        Crée des techniques de mémorisation adaptées au style
        de l'apprenant (visuel, verbal, etc.).
        """
        profile = self.get_learner_profile(user_id)

        prompt = self._prompts[ContentType.MNEMONIC].format(
            topic=topic,
            rule=rule,
            errors=", ".join(profile.error_patterns) if profile.error_patterns else "aucune",
            style=profile.learning_style.value
        )

        try:
            result = self.ai.dispatch(
                task_type=TaskType.EXPLANATION,
                prompt=prompt,
                system_prompt="Tu es expert en mnémotechnique. Réponds UNIQUEMENT en JSON valide.",
                temperature=0.8  # Plus créatif pour les mnémoniques
            )

            content_data = extract_json(result.content)

            content = f"🧠 {content_data.get('mnemonic', '')}\n\n"
            if content_data.get("visual"):
                content += f"👁️ Visualise: {content_data['visual']}\n\n"
            if content_data.get("story"):
                content += f"📖 Histoire: {content_data['story']}\n\n"
            content += f"⚠️ Astuce anti-erreur: {content_data.get('anti_error_trick', '')}\n"
            content += f"✏️ Pratique: {content_data.get('practice_phrase', '')}"

            return GeneratedContent(
                type=ContentType.MNEMONIC,
                topic=topic,
                title=f"Aide-mémoire: {topic}",
                content=content,
                key_points=[content_data.get("mnemonic", "")],
                estimated_duration_minutes=2,
                difficulty=1,  # Les mnémoniques sont faciles à retenir
                metadata=content_data
            )
        except Exception as e:
            logger.error(f"Erreur génération mnémonique: {e}")
            raise

    def get_recommended_content(
        self,
        user_id: str,
        limit: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Recommande du contenu personnalisé basé sur le profil.

        Analyse les faiblesses et l'état actuel pour suggérer
        le contenu le plus pertinent à étudier maintenant.
        """
        profile = self.get_learner_profile(user_id)
        recommendations = []

        # 1. Si frustré/fatigué → recommander pause ou contenu léger
        if profile.cognitive_state == "frustrated":
            recommendations.append({
                "type": "break",
                "reason": "Tu sembles frustré. Une pause t'aiderait!",
                "action": "Prends 5 minutes, puis reviens avec un mnémonique fun."
            })
        elif profile.cognitive_state == "tired":
            recommendations.append({
                "type": "light_review",
                "reason": "Tu es fatigué. Révision légère recommandée.",
                "action": "Révise des concepts déjà maîtrisés pour garder le momentum."
            })

        # 2. Topics faibles → micro-leçons ciblées
        for topic, mastery in sorted(profile.weak_topics.items(), key=lambda x: x[1])[:2]:
            if mastery < 0.4:
                recommendations.append({
                    "type": ContentType.MICRO_LESSON.value,
                    "topic": topic,
                    "reason": f"Maîtrise faible ({mastery*100:.0f}%). Une micro-leçon t'aiderait.",
                    "priority": "high"
                })
            elif mastery < 0.6:
                recommendations.append({
                    "type": ContentType.EXERCISE_SET.value,
                    "topic": topic,
                    "reason": f"Maîtrise moyenne ({mastery*100:.0f}%). Pratique recommandée.",
                    "priority": "medium"
                })

        # 3. Si error patterns → exercices ciblés
        if profile.error_patterns:
            recommendations.append({
                "type": ContentType.EXERCISE_SET.value,
                "reason": f"Erreurs fréquentes détectées: {', '.join(profile.error_patterns[:2])}",
                "priority": "high"
            })

        return recommendations[:limit]


# Singleton pour import facile
_generator = None

def get_content_generator() -> AdaptiveContentGenerator:
    """Retourne l'instance singleton du générateur."""
    global _generator
    if _generator is None:
        _generator = AdaptiveContentGenerator()
    return _generator
