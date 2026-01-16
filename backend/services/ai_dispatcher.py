"""
AI Dispatcher - Routage intelligent vers le modèle optimal
Logique de sélection basée sur la complexité et le type de tâche
Avec retry automatique et fallback gracieux
"""
import os
import json
import logging
import time
from datetime import datetime
from enum import Enum
from typing import Dict, Any, Optional, List, Literal
from dataclasses import dataclass
from openai import OpenAI
from config import settings
from models.learning import Question, QuestionOption
from databases.learning_db import learning_db
import uuid
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log
)
import openai

logger = logging.getLogger(__name__)


class TaskType(str, Enum):
    """Types de tâches pour le routage"""
    QUIZ = "quiz"                    # Questions rapides, flashcards
    EXPLANATION = "explanation"       # Explications détaillées
    CODE_REVIEW = "code_review"      # Analyse de code
    CODE_DEBUG = "code_debug"        # Debugging complexe
    VOCAB = "vocab"                  # Vocabulaire langues
    GRAMMAR = "grammar"              # Grammaire langues
    CHAT = "chat"                    # Chat conversationnel
    PLANNING = "planning"            # Planification de tâches
    ANALYSIS = "analysis"            # Analyse approfondie


class ModelTier(str, Enum):
    """Tiers de modèles par capacité"""
    FAST = "fast"          # GPT-4o-mini - rapide et cheap
    QUALITY = "quality"    # GPT-4o - meilleure qualité


@dataclass
class ModelConfig:
    """Configuration d'un modèle"""
    name: str
    tier: ModelTier
    cost_input: float   # $ par 1M tokens
    cost_output: float  # $ par 1M tokens
    max_tokens: int
    supports_system: bool = True
    supports_streaming: bool = True


# Configuration des modèles disponibles (2 tiers seulement)
MODELS: Dict[ModelTier, ModelConfig] = {
    ModelTier.FAST: ModelConfig(
        name="gpt-4o-mini",
        tier=ModelTier.FAST,
        cost_input=0.15,
        cost_output=0.60,
        max_tokens=16384,
    ),
    ModelTier.QUALITY: ModelConfig(
        name="gpt-4o",
        tier=ModelTier.QUALITY,
        cost_input=2.50,
        cost_output=10.0,
        max_tokens=16384,
    ),
}


# ═══════════════════════════════════════════════════════════════
# LOGIQUE DE ROUTAGE INTELLIGENTE
# Le modèle doit être ADAPTÉ au besoin, pas économique par défaut
# ═══════════════════════════════════════════════════════════════

# Mapping tâche → tier DE BASE (sera ajusté selon difficulté/complexité)
TASK_BASE_TIER: Dict[TaskType, ModelTier] = {
    # Tâches simples → FAST (gpt-4o-mini suffit)
    TaskType.CHAT: ModelTier.FAST,
    TaskType.QUIZ: ModelTier.FAST,
    TaskType.VOCAB: ModelTier.FAST,
    TaskType.GRAMMAR: ModelTier.FAST,

    # Tâches complexes → QUALITY (gpt-4o)
    TaskType.EXPLANATION: ModelTier.QUALITY,
    TaskType.CODE_REVIEW: ModelTier.QUALITY,
    TaskType.CODE_DEBUG: ModelTier.QUALITY,
    TaskType.PLANNING: ModelTier.QUALITY,
    TaskType.ANALYSIS: ModelTier.QUALITY,
}

# Matrice de décision: (task_type, difficulty) → tier optimal
# La difficulté peut MONTER le tier de FAST à QUALITY
DIFFICULTY_UPGRADE: Dict[str, Dict[str, ModelTier]] = {
    "quiz": {
        "easy": ModelTier.FAST,
        "medium": ModelTier.FAST,
        "hard": ModelTier.QUALITY,     # Quiz hard = gpt-4o
    },
    "vocab": {
        "easy": ModelTier.FAST,
        "medium": ModelTier.FAST,
        "hard": ModelTier.QUALITY,
    },
    "grammar": {
        "easy": ModelTier.FAST,
        "medium": ModelTier.FAST,
        "hard": ModelTier.QUALITY,
    },
    "explanation": {
        "beginner": ModelTier.FAST,
        "intermediate": ModelTier.QUALITY,
        "advanced": ModelTier.QUALITY,
    },
    "code_review": {
        "simple": ModelTier.FAST,
        "complex": ModelTier.QUALITY,
    },
}


@dataclass
class DispatchResult:
    """Résultat d'un dispatch"""
    content: str
    model_used: str
    tier_used: ModelTier
    latency_ms: int
    tokens_input: int
    tokens_output: int
    cost_estimate: float
    fallback_used: bool = False


class AIDispatcher:
    """
    Dispatcher intelligent pour router les requêtes vers le modèle optimal.

    Logique de sélection:
    1. Détermine le tier basé sur le type de tâche
    2. Peut être forcé vers un tier spécifique
    3. Fallback automatique si le tier demandé échoue
    4. Tracking des coûts et latences
    """

    def __init__(self):
        """Initialise le dispatcher"""
        api_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.warning("⚠️ OPENAI_API_KEY non configurée - dispatcher en mode dégradé")
            self.client = None
        else:
            self.client = OpenAI(api_key=api_key)

        # Stats de session
        self.session_stats = {
            "total_requests": 0,
            "total_cost": 0.0,
            "requests_by_tier": {tier.value: 0 for tier in ModelTier},
            "fallbacks_used": 0,
        }

        logger.info("✅ AI Dispatcher initialisé")

    def get_recommended_tier(
        self,
        task_type: TaskType,
        difficulty: Optional[str] = None,
        force_tier: Optional[ModelTier] = None
    ) -> ModelTier:
        """
        Détermine le tier optimal pour une tâche.

        LOGIQUE: Le modèle est choisi pour être PILE dans le besoin.
        - Quiz easy → 4o-mini (suffisant)
        - Quiz hard → o1-mini (besoin de raisonnement)
        - Explication avancée → o1-mini
        - Debug → toujours o1-mini

        Args:
            task_type: Type de tâche à effectuer
            difficulty: Niveau de difficulté (easy/medium/hard, beginner/intermediate/advanced)
            force_tier: Forcer un tier spécifique (optionnel)

        Returns:
            ModelTier adapté au besoin réel
        """
        # Si forcé, utiliser le tier demandé
        if force_tier:
            logger.info(f"🎯 Tier forcé: {force_tier.value}")
            return force_tier

        # Vérifier si on a une matrice de décision pour ce type de tâche
        task_key = task_type.value
        if task_key in DIFFICULTY_UPGRADE and difficulty:
            # Normaliser la difficulté
            diff_lower = difficulty.lower()
            difficulty_map = DIFFICULTY_UPGRADE[task_key]

            if diff_lower in difficulty_map:
                tier = difficulty_map[diff_lower]
                logger.info(f"🎯 Routage {task_key}/{diff_lower} → {tier.value} ({MODELS[tier].name})")
                return tier

        # Fallback sur le tier de base
        base_tier = TASK_BASE_TIER.get(task_type, ModelTier.FAST)
        logger.info(f"🎯 Routage {task_key} (base) → {base_tier.value} ({MODELS[base_tier].name})")
        return base_tier

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
    def _call_model(
        self,
        model_config: ModelConfig,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: Optional[int] = None,
        timeout: int = 60
    ) -> Dict[str, Any]:
        """
        Appelle un modèle spécifique avec retry.

        Returns:
            Dict avec content, tokens_input, tokens_output
        """
        if not self.client:
            raise ValueError("Client OpenAI non initialisé")

        # Adapter les messages pour les modèles sans system
        if not model_config.supports_system:
            # Fusionner system dans le premier user message
            adapted_messages = []
            system_content = ""
            for msg in messages:
                if msg["role"] == "system":
                    system_content = msg["content"]
                else:
                    if system_content and msg["role"] == "user":
                        msg = {"role": "user", "content": f"{system_content}\n\n{msg['content']}"}
                        system_content = ""
                    adapted_messages.append(msg)
            messages = adapted_messages

        start_time = time.time()

        response = self.client.chat.completions.create(
            model=model_config.name,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens or model_config.max_tokens,
            timeout=timeout
        )

        latency = int((time.time() - start_time) * 1000)

        return {
            "content": response.choices[0].message.content,
            "tokens_input": response.usage.prompt_tokens,
            "tokens_output": response.usage.completion_tokens,
            "latency_ms": latency,
        }

    def dispatch(
        self,
        task_type: TaskType,
        prompt: str,
        system_prompt: Optional[str] = None,
        difficulty: Optional[str] = None,
        force_tier: Optional[ModelTier] = None,
        temperature: float = 0.3,
        max_tokens: Optional[int] = None,
        timeout: int = 60,
        fallback_enabled: bool = True
    ) -> DispatchResult:
        """
        Route une requête vers le modèle optimal selon le besoin réel.

        Args:
            task_type: Type de tâche (quiz, explanation, code_debug, etc.)
            prompt: Le prompt utilisateur
            system_prompt: Prompt système (optionnel)
            difficulty: Niveau de difficulté (easy/medium/hard) - détermine le modèle
            force_tier: Forcer un tier spécifique
            temperature: Température de génération
            max_tokens: Limite de tokens
            timeout: Timeout en secondes
            fallback_enabled: Autoriser le fallback vers tier inférieur

        Returns:
            DispatchResult avec le contenu et les métadonnées
        """
        # Déterminer le tier selon la difficulté
        target_tier = self.get_recommended_tier(task_type, difficulty, force_tier)
        model_config = MODELS[target_tier]

        logger.info(f"🎯 Dispatch: {task_type.value} → {model_config.name} (tier: {target_tier.value})")

        # Construire les messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        fallback_used = False

        try:
            result = self._call_model(
                model_config=model_config,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                timeout=timeout
            )
        except Exception as e:
            logger.error(f"❌ Erreur avec {model_config.name}: {e}")

            # Fallback vers tier inférieur
            if fallback_enabled and target_tier != ModelTier.FAST:
                fallback_tier = ModelTier.FAST
                fallback_config = MODELS[fallback_tier]
                logger.warning(f"⚠️ Fallback vers {fallback_config.name}")

                try:
                    result = self._call_model(
                        model_config=fallback_config,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        timeout=timeout
                    )
                    model_config = fallback_config
                    target_tier = fallback_tier
                    fallback_used = True
                    self.session_stats["fallbacks_used"] += 1
                except Exception as fallback_error:
                    logger.error(f"❌ Fallback aussi en erreur: {fallback_error}")
                    raise
            else:
                raise

        # Calculer le coût estimé
        cost_estimate = (
            (result["tokens_input"] / 1_000_000) * model_config.cost_input +
            (result["tokens_output"] / 1_000_000) * model_config.cost_output
        )

        # Mettre à jour les stats de session
        self.session_stats["total_requests"] += 1
        self.session_stats["total_cost"] += cost_estimate
        self.session_stats["requests_by_tier"][target_tier.value] += 1

        # Persister dans la base de données pour historique
        try:
            learning_db.log_ai_usage(
                task_type=task_type.value,
                model=model_config.name,
                tier=target_tier.value,
                tokens_input=result["tokens_input"],
                tokens_output=result["tokens_output"],
                cost_usd=cost_estimate,
                difficulty=difficulty,
                latency_ms=result["latency_ms"],
                fallback_used=fallback_used
            )
        except Exception as db_error:
            logger.warning(f"⚠️ Erreur persistence AI usage: {db_error}")

        logger.info(
            f"✅ Réponse: {result['tokens_output']} tokens, "
            f"{result['latency_ms']}ms, ~${cost_estimate:.4f}"
        )

        return DispatchResult(
            content=result["content"],
            model_used=model_config.name,
            tier_used=target_tier,
            latency_ms=result["latency_ms"],
            tokens_input=result["tokens_input"],
            tokens_output=result["tokens_output"],
            cost_estimate=cost_estimate,
            fallback_used=fallback_used
        )

    # ═══════════════════════════════════════════════════════════════
    # MÉTHODES SPÉCIALISÉES PAR TYPE DE TÂCHE
    # ═══════════════════════════════════════════════════════════════

    def generate_quiz(
        self,
        topic: str,
        difficulty: str,
        mastery_level: int,
        context: Optional[str] = None
    ) -> DispatchResult:
        """Génère une question de quiz adaptée."""

        system_prompt = """Tu es un tuteur adaptatif expert en calibration de questions.
Tu génères des questions de quiz précises et bien calibrées.
Tu réponds UNIQUEMENT en JSON valide."""

        prompt = f"""Génère une question de quiz sur: {topic}

PROFIL:
- Difficulté: {difficulty}
- Maîtrise: {mastery_level}%
{f"- Contexte: {context}" if context else ""}

FORMAT JSON:
{{
    "question": "La question",
    "options": [
        {{"text": "Option A", "is_correct": false}},
        {{"text": "Option B", "is_correct": true}},
        {{"text": "Option C", "is_correct": false}},
        {{"text": "Option D", "is_correct": false}}
    ],
    "correct_answer": "Option B",
    "explanation": "Explication pédagogique",
    "estimated_time": {30 if difficulty == "easy" else 60 if difficulty == "medium" else 120}
}}"""

        # Le modèle est choisi selon la difficulté:
        # easy → 4o-mini, medium → 4o, hard → o1-mini
        return self.dispatch(
            task_type=TaskType.QUIZ,
            prompt=prompt,
            system_prompt=system_prompt,
            difficulty=difficulty
        )

    def explain_concept(
        self,
        concept: str,
        level: Literal["beginner", "intermediate", "advanced"] = "intermediate",
        language: str = "français"
    ) -> DispatchResult:
        """Génère une explication détaillée d'un concept."""

        system_prompt = f"""Tu es un expert pédagogue qui explique des concepts complexes.
Tu adaptes ton niveau au profil de l'apprenant.
Tu réponds en {language}."""

        prompt = f"""Explique ce concept de manière claire et structurée:

CONCEPT: {concept}
NIVEAU: {level}

Structure ta réponse avec:
1. Définition simple
2. Analogie concrète
3. Exemple pratique
4. Points clés à retenir
5. Erreurs courantes à éviter"""

        # Le modèle est choisi selon le niveau:
        # beginner/intermediate → 4o, advanced → o1-mini
        return self.dispatch(
            task_type=TaskType.EXPLANATION,
            prompt=prompt,
            system_prompt=system_prompt,
            difficulty=level  # beginner, intermediate, advanced
        )

    def debug_code(
        self,
        code: str,
        error_message: Optional[str] = None,
        language: str = "python"
    ) -> DispatchResult:
        """Analyse et debug du code avec raisonnement avancé."""

        system_prompt = f"""Tu es un expert en debugging {language}.
Tu analyses le code méthodiquement et identifies les problèmes.
Tu proposes des corrections claires et expliquées."""

        prompt = f"""Analyse et debug ce code:

```{language}
{code}
```

{f"Erreur signalée: {error_message}" if error_message else ""}

Fournis:
1. Identification du/des problème(s)
2. Explication de la cause
3. Code corrigé
4. Conseils pour éviter ce type d'erreur"""

        # Debug = toujours o1-mini (besoin de raisonnement structuré)
        return self.dispatch(
            task_type=TaskType.CODE_DEBUG,
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.2,  # Plus déterministe pour le code
        )

    def generate_vocab_exercise(
        self,
        word: str,
        target_language: str,
        native_language: str = "français",
        difficulty: str = "medium",
        context: Optional[str] = None
    ) -> DispatchResult:
        """Génère un exercice de vocabulaire."""

        system_prompt = f"""Tu es un tuteur de langues expert.
Tu crées des exercices de vocabulaire engageants.
Tu réponds en JSON."""

        prompt = f"""Crée un exercice pour apprendre ce mot:

MOT: {word}
LANGUE CIBLE: {target_language}
LANGUE NATIVE: {native_language}
DIFFICULTÉ: {difficulty}
{f"CONTEXTE: {context}" if context else ""}

FORMAT JSON:
{{
    "word": "{word}",
    "translation": "traduction",
    "pronunciation": "prononciation phonétique",
    "example_sentence": "phrase d'exemple",
    "example_translation": "traduction de la phrase",
    "mnemonic": "astuce mnémotechnique",
    "difficulty": "{difficulty}"
}}"""

        # Vocab: easy → 4o-mini, medium/hard → 4o
        return self.dispatch(
            task_type=TaskType.VOCAB,
            prompt=prompt,
            system_prompt=system_prompt,
            difficulty=difficulty
        )

    def chat(
        self,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        persona: str = "assistant"
    ) -> DispatchResult:
        """Chat conversationnel simple."""

        system_prompt = f"""Tu es un {persona} amical et utile.
Tu réponds de manière concise et naturelle."""

        # Inclure l'historique si fourni
        if conversation_history:
            context = "\n".join([
                f"{msg['role']}: {msg['content']}"
                for msg in conversation_history[-5:]  # Derniers 5 messages
            ])
            prompt = f"Historique:\n{context}\n\nUtilisateur: {message}"
        else:
            prompt = message

        return self.dispatch(
            task_type=TaskType.CHAT,
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.7  # Plus créatif pour le chat
        )

    # ═══════════════════════════════════════════════════════════════
    # MÉTHODES COMPATIBLES AVEC L'INTERFACE EXISTANTE (learning.py)
    # ═══════════════════════════════════════════════════════════════

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
        Génère une question adaptée - compatible avec gemini_service/openai_service.
        Utilise le dispatcher intelligent pour choisir le modèle optimal.
        """
        logger.info(f"🎯 generate_question: {topic_name} - {difficulty} (mastery: {mastery_level}%)")

        # Construire le prompt avec calibrage de difficulté
        prompt = self._build_question_prompt(
            topic_name, difficulty, mastery_level, learning_style, weak_areas, context
        )

        system_prompt = """Tu es un tuteur adaptatif expert en calibration de questions.
Tu génères des questions de quiz précises et bien calibrées.
Tu réponds UNIQUEMENT en JSON valide."""

        try:
            # Dispatcher vers le modèle adapté à la difficulté
            # easy → 4o-mini, medium → 4o, hard → o1-mini
            result = self.dispatch(
                task_type=TaskType.QUIZ,
                prompt=prompt,
                system_prompt=system_prompt,
                difficulty=difficulty,  # Le dispatcher choisit le modèle selon ça
                temperature=0.3
            )

            # Parser la réponse JSON
            question_data = self._parse_json_response(result.content)

            return Question(
                id=str(uuid.uuid4()),
                topic_id="",
                difficulty=difficulty,
                question_text=question_data["question"],
                question_type="multiple_choice",
                options=[
                    QuestionOption(
                        id=str(uuid.uuid4()),
                        text=opt["text"],
                        is_correct=opt.get("is_correct", False)
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

        except Exception as e:
            logger.error(f"❌ Erreur génération question: {e}")
            return self._create_fallback_question(topic_name, difficulty)

    async def generate_encouragement(
        self,
        is_correct: bool,
        streak: int,
        mastery_change: int
    ) -> str:
        """
        Génère un message d'encouragement - compatible avec gemini_service.
        Utilise le tier FAST car c'est une tâche simple.
        """
        prompt = f"""SITUATION:
- Réponse: {"✅ CORRECTE" if is_correct else "❌ Incorrecte"}
- Streak: {streak} bonnes réponses d'affilée
- Changement maîtrise: {mastery_change:+d} points

Génère un message court (max 2 phrases), positif et énergique.
Réponds UNIQUEMENT avec le message, sans JSON."""

        system_prompt = """Tu es un coach motivant pour apprenants.
Tu génères des messages courts et encourageants.
Réponds uniquement avec le message, sans formatage."""

        try:
            result = self.dispatch(
                task_type=TaskType.CHAT,
                prompt=prompt,
                system_prompt=system_prompt,
                difficulty="easy",  # Encouragements = tâche simple → 4o-mini
                temperature=0.7,
                max_tokens=100
            )

            message = result.content.strip()
            # Nettoyer si JSON accidentel
            if message.startswith("{") or message.startswith("["):
                try:
                    data = json.loads(message)
                    message = data.get("message", message) if isinstance(data, dict) else message
                except:
                    pass
            return message

        except Exception as e:
            logger.warning(f"⚠️ Fallback encouragement: {e}")
            if is_correct:
                return f"🎉 Excellent ! {streak} bonnes réponses !" if streak > 0 else "👏 Bien joué !"
            else:
                return "💪 Pas grave ! Continue !"

    def _build_question_prompt(
        self,
        topic_name: str,
        difficulty: str,
        mastery_level: int,
        learning_style: Optional[str],
        weak_areas: List[str],
        context: Optional[str]
    ) -> str:
        """Construit un prompt calibré pour génération de question."""

        difficulty_guide = {
            "easy": {
                "time": "20-45 secondes",
                "steps": "Une seule étape de raisonnement",
                "criteria": [
                    "Vocabulaire simple et direct",
                    "Pas de pièges ni de cas limites",
                    "Concept fondamental unique"
                ]
            },
            "medium": {
                "time": "45-90 secondes",
                "steps": "2-3 étapes de raisonnement",
                "criteria": [
                    "Combine 2-3 concepts liés",
                    "Application pratique requise",
                    "Distracteurs plausibles"
                ]
            },
            "hard": {
                "time": "90-180 secondes",
                "steps": "Analyse multi-niveau",
                "criteria": [
                    "Synthèse de concepts avancés",
                    "Demande expertise et réflexion",
                    "Cas limites ou edge cases"
                ]
            }
        }

        guide = difficulty_guide.get(difficulty, difficulty_guide["medium"])

        return f"""PROFIL DE L'APPRENANT:
- Topic: {topic_name}
- Niveau de maîtrise: {mastery_level}%
- Difficulté: {difficulty.upper()}
- Style: {learning_style or "non défini"}
- Points faibles: {", ".join(weak_areas) if weak_areas else "aucun"}

CALIBRAGE DIFFICULTÉ {difficulty.upper()}:
- Temps estimé: {guide["time"]}
- Raisonnement: {guide["steps"]}
- Critères: {", ".join(guide["criteria"])}

{f"CONTEXTE: {context}" if context else ""}

FORMAT JSON STRICT:
{{
    "question": "La question adaptée au niveau {mastery_level}%",
    "options": [
        {{"text": "Option A", "is_correct": false}},
        {{"text": "Option B", "is_correct": true}},
        {{"text": "Option C", "is_correct": false}},
        {{"text": "Option D", "is_correct": false}}
    ],
    "correct_answer": "Option B",
    "explanation": "Explication pédagogique",
    "hints": ["Indice subtil"],
    "estimated_time": {30 if difficulty == "easy" else 60 if difficulty == "medium" else 120},
    "tags": ["tag1"]
}}

Génère UNIQUEMENT le JSON."""

    def _parse_json_response(self, response_text: str) -> Dict[str, Any]:
        """Parse une réponse JSON, en nettoyant les markdown si présents."""
        clean_text = response_text.strip()

        # Retirer les balises markdown
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]

        return json.loads(clean_text.strip())

    def _create_fallback_question(self, topic_name: str, difficulty: str) -> Question:
        """Question de fallback si la génération échoue."""
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
            explanation="Question de secours - erreur de génération",
            hints=[],
            generated_at=datetime.now()
        )

    # ═══════════════════════════════════════════════════════════════
    # UTILITAIRES
    # ═══════════════════════════════════════════════════════════════

    def get_session_stats(self) -> Dict[str, Any]:
        """Retourne les statistiques de session."""
        return {
            **self.session_stats,
            "models_available": [m.name for m in MODELS.values()],
        }

    def get_health_status(self) -> Dict[str, Any]:
        """Vérifie l'état du dispatcher."""
        return {
            "ok": self.client is not None,
            "models": {
                tier.value: {
                    "name": config.name,
                    "cost_per_1m_input": config.cost_input,
                    "cost_per_1m_output": config.cost_output,
                }
                for tier, config in MODELS.items()
            },
            "session_stats": self.session_stats,
        }

    def estimate_cost(
        self,
        task_type: TaskType,
        estimated_tokens: int = 1000
    ) -> Dict[str, float]:
        """Estime le coût pour une tâche donnée."""
        tier = self.get_recommended_tier(task_type)
        config = MODELS[tier]

        # Estimation: 20% input, 80% output
        input_tokens = int(estimated_tokens * 0.2)
        output_tokens = int(estimated_tokens * 0.8)

        cost = (
            (input_tokens / 1_000_000) * config.cost_input +
            (output_tokens / 1_000_000) * config.cost_output
        )

        return {
            "tier": tier.value,
            "model": config.name,
            "estimated_tokens": estimated_tokens,
            "estimated_cost": cost,
        }

    # ═══════════════════════════════════════════════════════════════
    # STATS HISTORIQUES (PERSISTÉES)
    # ═══════════════════════════════════════════════════════════════

    def get_usage_today(self) -> Dict[str, Any]:
        """Récupère les stats d'aujourd'hui depuis la base."""
        return learning_db.get_ai_usage_today()

    def get_usage_this_week(self) -> Dict[str, Any]:
        """Récupère les stats de la semaine."""
        return learning_db.get_ai_usage_this_week()

    def get_usage_this_month(self) -> Dict[str, Any]:
        """Récupère les stats du mois."""
        return learning_db.get_ai_usage_this_month()

    def get_usage_all_time(self) -> Dict[str, Any]:
        """Récupère les stats totales."""
        return learning_db.get_ai_usage_all_time()

    def get_usage_by_task_type(self, days: int = 30) -> List[Dict[str, Any]]:
        """Récupère la répartition par type de tâche."""
        return learning_db.get_ai_usage_by_task_type(days)

    def get_recent_calls(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Récupère les derniers appels AI."""
        return learning_db.get_ai_recent_calls(limit)

    def get_complete_stats(self) -> Dict[str, Any]:
        """
        Récupère toutes les stats (session + historique) pour l'UI.
        C'est la méthode principale pour ConnectionsPage.
        """
        return {
            "session": self.session_stats,
            "today": learning_db.get_ai_usage_today(),
            "this_week": learning_db.get_ai_usage_this_week(),
            "this_month": learning_db.get_ai_usage_this_month(),
            "all_time": learning_db.get_ai_usage_all_time(),
            "by_task_type": learning_db.get_ai_usage_by_task_type(30),
        }

    def recalculate_costs(self) -> Dict[str, Any]:
        """
        Recalcule tous les coûts historiques avec les prix actuels de MODELS.
        À appeler après avoir modifié les prix dans MODELS.

        Returns:
            Stats du recalcul
        """
        # Construire le dict de prix depuis MODELS
        prices = {
            config.name: {"input": config.cost_input, "output": config.cost_output}
            for config in MODELS.values()
        }

        logger.info(f"🔄 Recalcul des coûts avec prix: {prices}")
        return learning_db.recalculate_all_costs(prices)

    def get_current_prices(self) -> Dict[str, Dict[str, float]]:
        """Retourne les prix actuels configurés."""
        return {
            config.name: {
                "input": config.cost_input,
                "output": config.cost_output,
                "tier": tier.value
            }
            for tier, config in MODELS.items()
        }


# Instance globale
ai_dispatcher = AIDispatcher()
