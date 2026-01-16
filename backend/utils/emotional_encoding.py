"""
💖 EMOTIONAL ENCODING ENGINE
Basé sur la recherche sur l'encodage émotionnel (Phelps, 2004; McGaugh, 2004)

Principe scientifique:
- Les souvenirs associés à des émotions sont 2-3x plus durables
- L'amygdale module la consolidation en mémoire à long terme
- L'arousal (activation) émotionnel améliore l'attention et l'encodage
- Émotions positives = meilleure créativité et apprentissage (Fredrickson, 2001)

Recherche:
- Phelps (2004): Emotion and cognition: Insights from studies of the human amygdala
- McGaugh (2004): The amygdala modulates the consolidation of memories
- Kensinger & Corkin (2003): Memory enhancement for emotional words
- Fredrickson (2001): Broaden-and-build theory of positive emotions

Efficacité:
- Émotions fortes: +200-300% de rétention
- Émotions modérées positives: +50-100% de rétention
- La curiosité et la surprise sont particulièrement efficaces

Implémentation:
- Détecte l'état émotionnel de l'apprenant
- Ajoute des hooks émotionnels au contenu
- Optimise le timing selon l'arousal
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Tuple
from enum import Enum
import random

logger = logging.getLogger(__name__)


class EmotionalState(Enum):
    """États émotionnels de l'apprenant"""
    CURIOUS = "curious"           # Curieux - optimal pour apprendre
    ENGAGED = "engaged"           # Engagé - bon état
    NEUTRAL = "neutral"           # Neutre - état de base
    ANXIOUS = "anxious"           # Anxieux - à gérer
    BORED = "bored"              # Ennuyé - à stimuler
    FRUSTRATED = "frustrated"     # Frustré - pause recommandée
    CONFIDENT = "confident"       # Confiant - prêt pour challenges
    SURPRISED = "surprised"       # Surpris - bon pour mémorisation
    ACCOMPLISHED = "accomplished"  # Accompli - après succès


class EmotionalValence(Enum):
    """Valence émotionnelle (positif/négatif)"""
    POSITIVE = "positive"   # Joie, curiosité, accomplissement
    NEUTRAL = "neutral"     # Calme, concentré
    NEGATIVE = "negative"   # Anxiété, frustration, ennui


class ArousalLevel(Enum):
    """Niveau d'activation (arousal)"""
    LOW = "low"           # Calme, détendu, peut-être endormi
    MODERATE = "moderate"  # Attentif, concentré - optimal
    HIGH = "high"         # Excité, stressé - mémoire flash


# Mapping état → valence + arousal
EMOTION_DIMENSIONS: Dict[EmotionalState, Tuple[EmotionalValence, ArousalLevel]] = {
    EmotionalState.CURIOUS: (EmotionalValence.POSITIVE, ArousalLevel.MODERATE),
    EmotionalState.ENGAGED: (EmotionalValence.POSITIVE, ArousalLevel.MODERATE),
    EmotionalState.NEUTRAL: (EmotionalValence.NEUTRAL, ArousalLevel.LOW),
    EmotionalState.ANXIOUS: (EmotionalValence.NEGATIVE, ArousalLevel.HIGH),
    EmotionalState.BORED: (EmotionalValence.NEGATIVE, ArousalLevel.LOW),
    EmotionalState.FRUSTRATED: (EmotionalValence.NEGATIVE, ArousalLevel.HIGH),
    EmotionalState.CONFIDENT: (EmotionalValence.POSITIVE, ArousalLevel.MODERATE),
    EmotionalState.SURPRISED: (EmotionalValence.POSITIVE, ArousalLevel.HIGH),
    EmotionalState.ACCOMPLISHED: (EmotionalValence.POSITIVE, ArousalLevel.MODERATE),
}


# Multiplicateurs de rétention par état
RETENTION_MULTIPLIERS: Dict[EmotionalState, float] = {
    EmotionalState.CURIOUS: 1.5,      # +50% - Curiosité = dopamine
    EmotionalState.ENGAGED: 1.3,       # +30%
    EmotionalState.NEUTRAL: 1.0,       # Baseline
    EmotionalState.ANXIOUS: 0.8,       # -20% - Stress inhibe hippocampe
    EmotionalState.BORED: 0.7,         # -30% - Pas d'attention
    EmotionalState.FRUSTRATED: 0.6,    # -40% - Cortisol élevé
    EmotionalState.CONFIDENT: 1.2,     # +20%
    EmotionalState.SURPRISED: 1.6,     # +60% - Amygdale activée
    EmotionalState.ACCOMPLISHED: 1.4,  # +40% - Renforcement positif
}


@dataclass
class EmotionalHook:
    """Un hook émotionnel pour le contenu"""
    type: str               # "story", "surprise", "challenge", "relevance", "humor"
    content: str            # Le contenu du hook
    target_emotion: EmotionalState
    intensity: float        # 0-1
    placement: str          # "before", "during", "after"


@dataclass
class EmotionallyEncodedContent:
    """Contenu enrichi avec des hooks émotionnels"""
    original_content: str
    hooks: List[EmotionalHook]
    opening_hook: Optional[str]   # Accroche d'ouverture
    closing_hook: Optional[str]   # Renforcement de clôture
    curiosity_gaps: List[str]     # Questions pour créer de la curiosité
    relevance_bridges: List[str]  # Liens avec la vie de l'apprenant
    estimated_engagement: float   # 0-1


@dataclass
class UserEmotionalProfile:
    """Profil émotionnel de l'apprenant"""
    user_id: str
    current_state: EmotionalState = EmotionalState.NEUTRAL
    state_history: List[Dict] = field(default_factory=list)
    preferred_hooks: List[str] = field(default_factory=list)  # Types de hooks efficaces
    emotional_triggers: Dict[str, float] = field(default_factory=dict)
    peak_learning_states: List[EmotionalState] = field(default_factory=list)
    average_session_mood: float = 0.5  # 0 = négatif, 1 = positif
    curiosity_score: float = 0.5
    frustration_tolerance: float = 0.5
    last_emotional_check: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)


# Templates de hooks émotionnels
HOOK_TEMPLATES: Dict[str, List[str]] = {
    "curiosity": [
        "🤔 Saviez-vous que {fact}? Découvrez pourquoi...",
        "❓ Qu'est-ce qui se passe quand {scenario}? La réponse va vous surprendre!",
        "🔍 Il y a un secret derrière {topic}. Pouvez-vous le deviner?",
        "💡 {number}% des gens se trompent sur {topic}. Et vous?",
    ],
    "story": [
        "📖 Imaginez-vous dans cette situation: {scenario}",
        "🎭 L'histoire de {person} montre que {lesson}",
        "🌍 Dans le monde réel, {application}",
        "⏰ En 1969, quand {historical_event}, cela a révélé {insight}",
    ],
    "challenge": [
        "🎯 Défi: Pouvez-vous {challenge} en moins de {time}?",
        "🏆 Seulement {percent}% réussissent cela du premier coup. Êtes-vous prêt?",
        "💪 C'est difficile, mais vous êtes capable. Essayons {task}!",
        "⚡ Mode turbo: {quick_challenge}",
    ],
    "relevance": [
        "🔗 Vous utilisez {concept} chaque fois que {daily_activity}",
        "💼 Dans votre futur métier, {professional_application}",
        "🏠 À la maison, cela explique pourquoi {home_example}",
        "📱 Votre smartphone utilise {concept} pour {tech_application}",
    ],
    "humor": [
        "😄 On pourrait dire que {funny_analogy}",
        "🎪 C'est comme si {absurd_comparison}",
        "😅 Erreur classique: {common_mistake} (on l'a tous fait!)",
        "🤖 Même un robot serait confus par {confusing_thing}",
    ],
    "accomplishment": [
        "🌟 Excellent! Vous venez de maîtriser {skill}!",
        "🎉 Niveau débloqué: {achievement}",
        "📈 Votre compréhension de {topic} a augmenté de {percent}%!",
        "💎 Rare: Seulement {percent}% arrivent à ce niveau!",
    ],
    "surprise": [
        "😲 Plot twist: {unexpected_fact}!",
        "🎭 Contrairement à ce qu'on pense, {counterintuitive}",
        "⚡ Fait choquant: {shocking_fact}",
        "🔄 C'est l'inverse de ce que vous pensiez: {reversal}",
    ],
}


class EmotionalEncodingEngine:
    """
    Moteur d'encodage émotionnel.

    Détecte l'état émotionnel de l'apprenant et enrichit le contenu
    avec des hooks émotionnels pour améliorer la mémorisation.
    """

    def __init__(self):
        self._user_profiles: Dict[str, UserEmotionalProfile] = {}

        # Indicateurs comportementaux → état émotionnel
        self._behavioral_indicators = {
            "fast_response": EmotionalState.CONFIDENT,
            "slow_response": EmotionalState.ANXIOUS,
            "streak_correct": EmotionalState.CONFIDENT,
            "streak_incorrect": EmotionalState.FRUSTRATED,
            "quick_abandon": EmotionalState.BORED,
            "long_session": EmotionalState.ENGAGED,
            "question_asking": EmotionalState.CURIOUS,
        }

        logger.info("💖 Emotional Encoding Engine initialized")

    def _get_user_profile(self, user_id: str) -> UserEmotionalProfile:
        """Récupère ou crée le profil utilisateur"""
        if user_id not in self._user_profiles:
            self._user_profiles[user_id] = UserEmotionalProfile(user_id=user_id)
        return self._user_profiles[user_id]

    def detect_emotional_state(
        self,
        user_id: str,
        recent_accuracy: float,
        response_times: List[float],
        session_duration: float,
        streak: int,
        self_reported: Optional[EmotionalState] = None
    ) -> EmotionalState:
        """
        Détecte l'état émotionnel basé sur les comportements.

        Args:
            user_id: ID utilisateur
            recent_accuracy: Précision récente (0-1)
            response_times: Temps de réponse récents (secondes)
            session_duration: Durée de session (minutes)
            streak: Streak actuel (positif = correct, négatif = incorrect)
            self_reported: État auto-rapporté (optionnel, prioritaire)

        Returns:
            EmotionalState détecté
        """
        profile = self._get_user_profile(user_id)

        # 1. Si auto-rapporté, utiliser directement
        if self_reported:
            profile.current_state = self_reported
            self._record_state(profile, self_reported, "self_reported")
            return self_reported

        # 2. Analyse comportementale
        state_scores: Dict[EmotionalState, float] = {state: 0 for state in EmotionalState}

        # Précision
        if recent_accuracy >= 0.9:
            state_scores[EmotionalState.CONFIDENT] += 2
            state_scores[EmotionalState.ACCOMPLISHED] += 1
        elif recent_accuracy >= 0.7:
            state_scores[EmotionalState.ENGAGED] += 1
        elif recent_accuracy >= 0.5:
            state_scores[EmotionalState.NEUTRAL] += 1
        elif recent_accuracy >= 0.3:
            state_scores[EmotionalState.ANXIOUS] += 1
        else:
            state_scores[EmotionalState.FRUSTRATED] += 2

        # Temps de réponse (moyenne)
        if response_times:
            avg_time = sum(response_times) / len(response_times)
            if avg_time < 10:  # Très rapide
                state_scores[EmotionalState.CONFIDENT] += 1
            elif avg_time < 20:  # Normal
                state_scores[EmotionalState.ENGAGED] += 1
            elif avg_time < 40:  # Lent
                state_scores[EmotionalState.ANXIOUS] += 1
            else:  # Très lent
                state_scores[EmotionalState.BORED] += 1

        # Durée de session
        if session_duration > 30:  # Plus de 30 min
            state_scores[EmotionalState.ENGAGED] += 2
        elif session_duration > 15:
            state_scores[EmotionalState.ENGAGED] += 1
        elif session_duration < 5:  # Très court
            state_scores[EmotionalState.BORED] += 1

        # Streak
        if streak >= 5:
            state_scores[EmotionalState.CONFIDENT] += 2
            state_scores[EmotionalState.ACCOMPLISHED] += 1
        elif streak >= 3:
            state_scores[EmotionalState.ENGAGED] += 1
        elif streak <= -3:
            state_scores[EmotionalState.FRUSTRATED] += 2
        elif streak <= -1:
            state_scores[EmotionalState.ANXIOUS] += 1

        # Trouver l'état dominant
        detected_state = max(state_scores, key=state_scores.get)

        # Mise à jour du profil
        profile.current_state = detected_state
        self._record_state(profile, detected_state, "behavioral")

        return detected_state

    def _record_state(
        self,
        profile: UserEmotionalProfile,
        state: EmotionalState,
        source: str
    ) -> None:
        """Enregistre un état émotionnel dans l'historique"""
        profile.state_history.append({
            "state": state.value,
            "source": source,
            "timestamp": datetime.now().isoformat()
        })

        # Garder seulement les 100 derniers
        if len(profile.state_history) > 100:
            profile.state_history = profile.state_history[-100:]

        profile.last_emotional_check = datetime.now()

        # Mettre à jour la moyenne de mood
        valence, _ = EMOTION_DIMENSIONS[state]
        mood_value = {
            EmotionalValence.POSITIVE: 0.8,
            EmotionalValence.NEUTRAL: 0.5,
            EmotionalValence.NEGATIVE: 0.2
        }[valence]

        n = len(profile.state_history)
        profile.average_session_mood += (mood_value - profile.average_session_mood) / n

    def get_retention_multiplier(self, state: EmotionalState) -> float:
        """
        Retourne le multiplicateur de rétention pour un état.

        Args:
            state: L'état émotionnel

        Returns:
            Multiplicateur (1.0 = baseline)
        """
        return RETENTION_MULTIPLIERS.get(state, 1.0)

    def generate_hooks(
        self,
        content: str,
        topic: str,
        target_state: EmotionalState = EmotionalState.CURIOUS,
        num_hooks: int = 2
    ) -> List[EmotionalHook]:
        """
        Génère des hooks émotionnels pour le contenu.

        Args:
            content: Le contenu d'apprentissage
            topic: Le sujet
            target_state: L'état émotionnel visé
            num_hooks: Nombre de hooks à générer

        Returns:
            Liste de hooks émotionnels
        """
        hooks = []

        # Déterminer les types de hooks selon l'état visé
        hook_types = {
            EmotionalState.CURIOUS: ["curiosity", "surprise"],
            EmotionalState.ENGAGED: ["relevance", "challenge"],
            EmotionalState.CONFIDENT: ["challenge", "accomplishment"],
            EmotionalState.SURPRISED: ["surprise", "curiosity"],
            EmotionalState.ACCOMPLISHED: ["accomplishment", "relevance"],
        }.get(target_state, ["curiosity", "relevance"])

        for i in range(num_hooks):
            hook_type = hook_types[i % len(hook_types)]
            templates = HOOK_TEMPLATES.get(hook_type, HOOK_TEMPLATES["curiosity"])
            template = random.choice(templates)

            # Remplir le template avec des placeholders contextuels
            hook_content = template.format(
                fact=f"ce concept de {topic}",
                scenario=f"vous utilisez {topic}",
                topic=topic,
                number=random.randint(60, 90),
                person="un expert",
                lesson=f"l'importance de {topic}",
                application=f"{topic} est utilisé partout",
                historical_event="cela a été découvert",
                insight=f"l'importance de {topic}",
                challenge=f"maîtriser {topic}",
                time="2 minutes",
                percent=random.randint(20, 40),
                task=f"ce défi sur {topic}",
                quick_challenge=f"répondez en 30 secondes",
                concept=topic,
                daily_activity="vous faites ceci",
                professional_application=f"{topic} sera essentiel",
                home_example="cela fonctionne",
                tech_application="fonctionner",
                funny_analogy=f"{topic} c'est comme...",
                absurd_comparison="un chat qui programme",
                common_mistake=f"confondre {topic}",
                confusing_thing="cette subtilité",
                skill=topic,
                achievement=f"Expert en {topic}",
                unexpected_fact=f"{topic} n'est pas ce que vous croyez",
                counterintuitive=f"{topic} fonctionne à l'inverse",
                shocking_fact=f"{topic} change tout",
                reversal=f"voici la vérité sur {topic}",
            )

            placement = "before" if i == 0 else "after"

            hooks.append(EmotionalHook(
                type=hook_type,
                content=hook_content,
                target_emotion=target_state,
                intensity=0.5 + random.random() * 0.3,
                placement=placement
            ))

        return hooks

    def encode_content(
        self,
        content: str,
        topic: str,
        user_id: Optional[str] = None
    ) -> EmotionallyEncodedContent:
        """
        Encode le contenu avec des hooks émotionnels.

        Args:
            content: Le contenu original
            topic: Le sujet
            user_id: ID utilisateur pour personnalisation

        Returns:
            Contenu enrichi émotionnellement
        """
        # Déterminer l'état cible
        target_state = EmotionalState.CURIOUS

        if user_id:
            profile = self._get_user_profile(user_id)
            current = profile.current_state

            # Adapter selon l'état actuel
            if current == EmotionalState.BORED:
                target_state = EmotionalState.SURPRISED  # Stimuler
            elif current == EmotionalState.ANXIOUS:
                target_state = EmotionalState.CONFIDENT  # Rassurer
            elif current == EmotionalState.FRUSTRATED:
                target_state = EmotionalState.ACCOMPLISHED  # Valoriser
            elif current == EmotionalState.CONFIDENT:
                target_state = EmotionalState.CURIOUS  # Challenger

        # Générer les hooks
        hooks = self.generate_hooks(content, topic, target_state, num_hooks=3)

        # Opening hook (curiosity gap)
        opening = f"🤔 Avant de continuer, que savez-vous déjà sur {topic}? Préparez-vous à être surpris(e)..."

        # Closing hook (accomplishment)
        closing = f"🌟 Bravo! Vous venez d'explorer {topic}. Cette connaissance vous sera utile pour..."

        # Curiosity gaps
        curiosity_gaps = [
            f"Pourquoi est-ce que {topic} fonctionne ainsi?",
            f"Que se passerait-il si {topic} n'existait pas?",
            f"Quel est le lien entre {topic} et votre quotidien?",
        ]

        # Relevance bridges
        relevance_bridges = [
            f"Dans votre vie quotidienne, {topic} apparaît quand...",
            f"Les professionnels utilisent {topic} pour...",
            f"Sans {topic}, vous ne pourriez pas...",
        ]

        # Estimer l'engagement
        estimated_engagement = 0.6
        if user_id:
            profile = self._get_user_profile(user_id)
            estimated_engagement += profile.curiosity_score * 0.2
            if profile.current_state in [EmotionalState.CURIOUS, EmotionalState.ENGAGED]:
                estimated_engagement += 0.1

        return EmotionallyEncodedContent(
            original_content=content,
            hooks=hooks,
            opening_hook=opening,
            closing_hook=closing,
            curiosity_gaps=curiosity_gaps,
            relevance_bridges=relevance_bridges,
            estimated_engagement=min(1.0, estimated_engagement)
        )

    def get_state_recommendation(self, state: EmotionalState) -> Dict[str, Any]:
        """
        Obtient des recommandations basées sur l'état émotionnel.

        Args:
            state: L'état actuel

        Returns:
            Dict avec recommandations
        """
        recommendations = {
            EmotionalState.CURIOUS: {
                "action": "continue",
                "message": "🔥 Vous êtes dans un état optimal pour apprendre!",
                "difficulty_adjust": 0,  # Garder la difficulté
                "break_needed": False,
            },
            EmotionalState.ENGAGED: {
                "action": "continue",
                "message": "👍 Bonne concentration! Continuez comme ça.",
                "difficulty_adjust": 0,
                "break_needed": False,
            },
            EmotionalState.NEUTRAL: {
                "action": "stimulate",
                "message": "💡 Essayons quelque chose de plus stimulant!",
                "difficulty_adjust": 1,  # Augmenter un peu
                "break_needed": False,
            },
            EmotionalState.ANXIOUS: {
                "action": "ease",
                "message": "🌸 Pas de stress! Allons-y doucement.",
                "difficulty_adjust": -1,  # Réduire
                "break_needed": False,
            },
            EmotionalState.BORED: {
                "action": "challenge",
                "message": "🎯 Besoin de challenge? Montons le niveau!",
                "difficulty_adjust": 2,  # Augmenter significativement
                "break_needed": False,
            },
            EmotionalState.FRUSTRATED: {
                "action": "break",
                "message": "☕ Une petite pause serait bénéfique. Vous reviendrez plus fort!",
                "difficulty_adjust": -2,  # Réduire beaucoup
                "break_needed": True,
            },
            EmotionalState.CONFIDENT: {
                "action": "challenge",
                "message": "💪 Vous êtes en forme! Un défi?",
                "difficulty_adjust": 1,
                "break_needed": False,
            },
            EmotionalState.SURPRISED: {
                "action": "continue",
                "message": "😲 Cette surprise va bien s'ancrer en mémoire!",
                "difficulty_adjust": 0,
                "break_needed": False,
            },
            EmotionalState.ACCOMPLISHED: {
                "action": "continue",
                "message": "🏆 Super travail! Profitons de cet élan!",
                "difficulty_adjust": 0,
                "break_needed": False,
            },
        }

        rec = recommendations.get(state, recommendations[EmotionalState.NEUTRAL])

        # Ajouter le multiplicateur de rétention
        rec["retention_multiplier"] = self.get_retention_multiplier(state)

        # Ajouter les dimensions
        valence, arousal = EMOTION_DIMENSIONS.get(state, (EmotionalValence.NEUTRAL, ArousalLevel.MODERATE))
        rec["valence"] = valence.value
        rec["arousal"] = arousal.value

        return rec

    def should_inject_emotion(
        self,
        user_id: str,
        content_position: float  # 0-1 (début à fin du contenu)
    ) -> Tuple[bool, Optional[str]]:
        """
        Détermine si on devrait injecter un hook émotionnel.

        Args:
            user_id: ID utilisateur
            content_position: Position dans le contenu (0-1)

        Returns:
            (should_inject, hook_type)
        """
        profile = self._get_user_profile(user_id)

        # Toujours au début pour capter l'attention
        if content_position < 0.1:
            return True, "curiosity"

        # À la fin pour renforcer
        if content_position > 0.9:
            return True, "accomplishment"

        # Au milieu si l'engagement baisse
        if content_position > 0.4 and content_position < 0.6:
            if profile.current_state in [EmotionalState.BORED, EmotionalState.NEUTRAL]:
                return True, "surprise"

        return False, None

    def update_from_feedback(
        self,
        user_id: str,
        hook_type: str,
        was_effective: bool
    ) -> None:
        """
        Met à jour le profil basé sur l'efficacité des hooks.

        Args:
            user_id: ID utilisateur
            hook_type: Type de hook utilisé
            was_effective: Si le hook a été efficace
        """
        profile = self._get_user_profile(user_id)

        # Mettre à jour les triggers émotionnels
        current_score = profile.emotional_triggers.get(hook_type, 0.5)
        if was_effective:
            profile.emotional_triggers[hook_type] = min(1.0, current_score + 0.1)
            if hook_type not in profile.preferred_hooks:
                profile.preferred_hooks.append(hook_type)
        else:
            profile.emotional_triggers[hook_type] = max(0.0, current_score - 0.05)

    def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Retourne le profil émotionnel de l'utilisateur"""
        profile = self._get_user_profile(user_id)

        # Analyser l'historique
        recent_states = profile.state_history[-20:] if profile.state_history else []
        state_counts: Dict[str, int] = {}
        for entry in recent_states:
            state = entry["state"]
            state_counts[state] = state_counts.get(state, 0) + 1

        dominant_state = max(state_counts, key=state_counts.get) if state_counts else "neutral"

        return {
            "user_id": profile.user_id,
            "current_state": profile.current_state.value,
            "dominant_state": dominant_state,
            "average_mood": profile.average_session_mood,
            "mood_description": self._describe_mood(profile.average_session_mood),
            "curiosity_score": profile.curiosity_score,
            "frustration_tolerance": profile.frustration_tolerance,
            "preferred_hooks": profile.preferred_hooks,
            "emotional_triggers": profile.emotional_triggers,
            "current_retention_multiplier": self.get_retention_multiplier(profile.current_state),
            "recommendation": self.get_state_recommendation(profile.current_state),
            "state_history_count": len(profile.state_history)
        }

    def _describe_mood(self, mood: float) -> str:
        """Décrit le mood en texte"""
        if mood >= 0.8:
            return "Très positif - excellent pour l'apprentissage"
        elif mood >= 0.6:
            return "Positif - bon état d'esprit"
        elif mood >= 0.4:
            return "Neutre - état de base"
        elif mood >= 0.2:
            return "Légèrement négatif - attention requise"
        else:
            return "Négatif - pause recommandée"


# Instance globale
emotional_engine = EmotionalEncodingEngine()
