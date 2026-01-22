"""
SocraticTutor - Tuteur IA qui évite la décharge cognitive.

Principes fondamentaux:
1. JAMAIS donner la réponse directement
2. Guider par des questions (méthode Socratique)
3. Indices progressifs (vague → moyen → explicite)
4. L'étudiant doit TRAVAILLER pour apprendre
5. Pas de prompt engineering requis côté utilisateur

Architecture:
- 3 niveaux d'indices avant révélation
- Questions de guidage adaptées au topic
- Validation du raisonnement de l'étudiant
- Détection des misconceptions courantes
- Feedback qui pousse à la réflexion

Usage:
    tutor = SocraticTutor(openai_service)

    # Demander un indice (niveau 1, 2, ou 3)
    hint = await tutor.get_hint(question, user_answer, hint_level=1)

    # Guider avec une question socratique
    guidance = await tutor.get_socratic_guidance(question, user_answer, topic)

    # Valider le raisonnement de l'étudiant
    validation = await tutor.validate_reasoning(question, user_explanation)

    # Analyser les misconceptions
    misconceptions = tutor.detect_misconceptions(wrong_answers_history)
"""

import random
import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
from collections import defaultdict

# Import de la persistence DB
from databases import tutor_profile_db as db

logger = logging.getLogger(__name__)


class HintLevel(Enum):
    """Niveaux d'indices progressifs."""
    SUBTLE = 1      # Indice vague - pousse à réfléchir
    MODERATE = 2    # Indice moyen - oriente vers la bonne direction
    EXPLICIT = 3    # Indice explicite - presque la réponse (dernier recours)


class GuidanceType(Enum):
    """Types de guidage socratique."""
    QUESTION = "question"           # Pose une question pour guider
    REFLECTION = "reflection"       # Demande de réfléchir à un aspect
    COMPARISON = "comparison"       # Compare avec un cas connu
    ELIMINATION = "elimination"     # Aide à éliminer les mauvaises options
    PATTERN = "pattern"             # Fait remarquer un pattern


@dataclass
class PedagogicalInsights:
    """
    Insights pédagogiques du Learning Engine.

    Ces données guident le tuteur pour adapter son comportement
    selon les principes scientifiques validés.
    """
    # FSRS - Spaced Repetition
    retrievability: float = 1.0         # Probabilité de rappel (0-1)
    stability: float = 0.0              # Stabilité mémoire (jours)

    # Cognitive Load (Sweller)
    cognitive_load: str = "optimal"     # optimal/elevated/high/overload
    should_take_break: bool = False

    # Performance récente
    recent_accuracy: float = 0.5        # Accuracy sur 10 dernières questions
    streak: int = 0                     # Streak actuel (+/-)
    mastery: int = 0                    # Maîtrise du topic (0-100)

    # Détection d'illusion de compétence
    fast_wrong_count: int = 0           # Réponses rapides mais fausses
    overconfidence_detected: bool = False


# ============================================================================
# ADAPTATION AVANCÉE - Profil d'apprentissage dynamique
# ============================================================================

@dataclass
class TimePattern:
    """Pattern temporel de performance."""
    hour: int
    accuracy: float
    response_time: float
    samples: int = 0


@dataclass
class ErrorPattern:
    """Pattern d'erreur récurrent."""
    pattern_type: str           # "confusion", "haste", "fatigue", "gap"
    description: str
    frequency: int
    last_seen: datetime = None
    topics_affected: List[str] = field(default_factory=list)


@dataclass
class LearningStyle:
    """Style d'apprentissage détecté."""
    prefers_examples: float = 0.5       # vs règles abstraites
    prefers_visual: float = 0.5         # vs textuel
    prefers_step_by_step: float = 0.5   # vs vue d'ensemble
    needs_encouragement: float = 0.5    # vs autonome
    optimal_hint_level: float = 2.0     # niveau d'indice le plus efficace


@dataclass
class EmotionalState:
    """État émotionnel détecté."""
    frustration_level: float = 0.0      # 0-1
    engagement_level: float = 1.0       # 0-1
    confidence_level: float = 0.5       # 0-1
    fatigue_level: float = 0.0          # 0-1


@dataclass
class AdaptiveProfile:
    """
    Profil adaptatif complet de l'apprenant.

    Ce profil évolue avec chaque interaction et permet une
    personnalisation fine du tutorat.
    """
    user_id: str

    # Patterns temporels par heure (0-23)
    time_patterns: Dict[int, TimePattern] = field(default_factory=dict)

    # Patterns d'erreurs détectés
    error_patterns: List[ErrorPattern] = field(default_factory=list)

    # Style d'apprentissage
    learning_style: LearningStyle = field(default_factory=LearningStyle)

    # État émotionnel actuel
    emotional_state: EmotionalState = field(default_factory=EmotionalState)

    # Historique des interactions tuteur (pour méta-adaptation)
    hint_effectiveness: Dict[int, List[bool]] = field(default_factory=lambda: defaultdict(list))

    # Meilleur moment pour apprendre (auto-détecté)
    optimal_hours: List[int] = field(default_factory=list)

    # Topics où l'utilisateur a des lacunes persistantes
    weak_topics: Dict[str, float] = field(default_factory=dict)

    # Dernières sessions
    session_history: List[Dict] = field(default_factory=list)

    # Créé le
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


@dataclass
class TutoringContext:
    """Contexte de tutorat pour un utilisateur."""
    user_id: str
    topic: str
    hints_used: int = 0
    max_hints: int = 3
    socratic_questions_asked: int = 0
    misconceptions_detected: List[str] = field(default_factory=list)
    reasoning_attempts: int = 0
    gave_up: bool = False

    # Historique pour cette question
    wrong_answers: List[str] = field(default_factory=list)
    hint_history: List[str] = field(default_factory=list)

    # === NOUVEAU: Insights pédagogiques du moteur ===
    pedagogical: PedagogicalInsights = field(default_factory=PedagogicalInsights)


@dataclass
class TutoringResponse:
    """Réponse du tuteur."""
    type: str                       # "hint", "guidance", "validation", "reveal"
    content: str                    # Le message du tuteur
    level: Optional[int] = None     # Niveau d'indice (1-3)
    requires_response: bool = True  # L'étudiant doit répondre
    encouragement: str = ""         # Message d'encouragement
    next_action: str = ""           # Suggestion d'action suivante
    cognitive_load: str = "optimal" # optimal/elevated/high


# ============================================================================
# BANQUES DE QUESTIONS SOCRATIQUES PAR TOPIC (Français)
# ============================================================================

SOCRATIC_QUESTIONS = {
    "conjugaison": [
        "Quel est le sujet de cette phrase ?",
        "À quel temps est conjugué le verbe selon toi ?",
        "Ce verbe appartient à quel groupe ?",
        "Quelle est la terminaison typique pour ce temps et cette personne ?",
        "Compare avec un verbe similaire que tu connais bien...",
        "Qu'est-ce qui te fait hésiter entre ces options ?",
        "Si le sujet était 'nous', comment conjuguerais-tu ?",
        "Regarde bien la terminaison... que remarques-tu ?",
    ],
    "grammaire": [
        "Quelle est la fonction de ce mot dans la phrase ?",
        "Peux-tu identifier le sujet et le verbe ?",
        "Y a-t-il un complément d'objet ? Direct ou indirect ?",
        "Cette phrase est-elle simple ou complexe ?",
        "Quel type de proposition est-ce ?",
        "Qu'est-ce qui te fait penser que c'est cette réponse ?",
        "Si tu remplaces ce mot par un autre, la phrase a-t-elle encore du sens ?",
        "Quelle règle de grammaire s'applique ici ?",
    ],
    "orthographe": [
        "Ce mot s'accorde-t-il avec quelque chose ?",
        "Y a-t-il un accord en genre ou en nombre à faire ?",
        "Ce mot est-il invariable ?",
        "Connais-tu la règle pour ce type de mot ?",
        "Peux-tu trouver un mot de la même famille ?",
        "C'est un participe passé... avec quel auxiliaire ?",
        "Regarde le mot qui précède... ça t'aide ?",
        "Cette lettre finale, pourquoi serait-elle là ?",
    ],
    "vocabulaire": [
        "Connais-tu un synonyme de ce mot ?",
        "Dans quel contexte as-tu déjà vu ce mot ?",
        "Peux-tu deviner le sens grâce au contexte de la phrase ?",
        "Ce mot ressemble-t-il à un autre que tu connais ?",
        "Quelle est la racine de ce mot ?",
        "Y a-t-il un préfixe ou suffixe que tu reconnais ?",
        "Si tu devais expliquer ce mot à quelqu'un, que dirais-tu ?",
        "Quel est le contraire de ce mot ?",
    ],
}

# Questions génériques pour tout topic
GENERIC_SOCRATIC_QUESTIONS = [
    "Qu'est-ce qui te fait hésiter ?",
    "Peux-tu éliminer une ou deux options ?",
    "Relis la question... y a-t-il un indice ?",
    "Qu'est-ce que tu sais déjà sur ce sujet ?",
    "Si tu devais expliquer ton choix, que dirais-tu ?",
    "Compare les options... laquelle te semble la plus logique ?",
]


# ============================================================================
# INDICES PROGRESSIFS PAR NIVEAU
# ============================================================================

HINT_TEMPLATES = {
    HintLevel.SUBTLE: [
        # Très vague - pousse à réfléchir sans donner d'info
        "Hmm, pas tout à fait... Relis attentivement la question.",
        "Tu es sur la bonne piste, mais regarde de plus près...",
        "Prends ton temps et réfléchis à ce que tu sais sur ce sujet.",
        "Il y a quelque chose d'important que tu n'as pas remarqué.",
        "Essaie de te rappeler la règle qui s'applique ici.",
        "Qu'est-ce qui différencie les options entre elles ?",
    ],
    HintLevel.MODERATE: [
        # Oriente vers la bonne direction
        "Concentre-toi sur {focus_element}...",
        "La clé est dans {key_element}.",
        "Rappelle-toi que {rule_hint}...",
        "Regarde bien {specific_part} de la phrase.",
        "Pense à la relation entre {element_a} et {element_b}.",
    ],
    HintLevel.EXPLICIT: [
        # Presque la réponse (dernier recours)
        "La bonne réponse concerne {near_answer}.",
        "C'est lié à {direct_hint}.",
        "La règle qui s'applique est: {rule}.",
        "Élimine {wrong_options}, il reste...",
    ],
}


# ============================================================================
# MISCONCEPTIONS COURANTES
# ============================================================================

COMMON_MISCONCEPTIONS = {
    "conjugaison": {
        "confusion_temps": {
            "pattern": ["imparfait", "passé simple"],
            "correction": "L'imparfait décrit une action qui dure, le passé simple une action ponctuelle.",
        },
        "accord_sujet": {
            "pattern": ["ils", "il"],
            "correction": "Attention à bien identifier le sujet ! 'Ils' = pluriel, 'il' = singulier.",
        },
        "terminaison_er_é": {
            "pattern": ["-er", "-é"],
            "correction": "Remplace par 'vendre/vendu' pour savoir si c'est infinitif (-er) ou participe (-é).",
        },
    },
    "grammaire": {
        "cod_coi": {
            "pattern": ["COD", "COI"],
            "correction": "COD répond à 'quoi/qui ?', COI répond à 'à qui/à quoi ?'.",
        },
        "attribut_cod": {
            "pattern": ["attribut", "COD"],
            "correction": "L'attribut qualifie le sujet après un verbe d'état (être, sembler, devenir...).",
        },
    },
    "orthographe": {
        "accord_pp_avoir": {
            "pattern": ["accord", "participe"],
            "correction": "Avec 'avoir', le PP s'accorde avec le COD s'il est placé AVANT le verbe.",
        },
        "leur_leurs": {
            "pattern": ["leur", "leurs"],
            "correction": "'Leur' pronom = invariable. 'Leur(s)' adjectif possessif = s'accorde.",
        },
        "ce_se": {
            "pattern": ["ce", "se"],
            "correction": "'Ce' = démonstratif (ce livre). 'Se' = pronom réfléchi (il se lave).",
        },
    },
    "vocabulaire": {
        "paronymes": {
            "pattern": ["ressemble"],
            "correction": "Attention aux paronymes ! Des mots qui se ressemblent mais ont des sens différents.",
        },
    },
}


# ============================================================================
# MESSAGES D'ENCOURAGEMENT (sans donner la réponse)
# ============================================================================

ENCOURAGEMENTS = {
    "trying": [
        "Continue de réfléchir, tu peux y arriver !",
        "C'est bien d'essayer, persiste !",
        "Chaque erreur te rapproche de la compréhension.",
        "Tu fais l'effort, c'est ça qui compte.",
    ],
    "improving": [
        "Tu progresses, je le vois !",
        "C'est mieux ! Tu es sur la bonne voie.",
        "Ton raisonnement s'améliore.",
        "Tu commences à comprendre le pattern.",
    ],
    "struggling": [
        "Ce n'est pas facile, mais tu vas y arriver.",
        "Prends ton temps, il n'y a pas de rush.",
        "Chacun apprend à son rythme, continue.",
        "C'est normal de trouver ça difficile au début.",
    ],
    "close": [
        "Tu y es presque !",
        "Tu as presque trouvé, réfléchis encore un peu...",
        "C'est tout proche, un petit effort !",
        "Tu touches au but !",
    ],
}


# ============================================================================
# ALERTES PÉDAGOGIQUES (basées sur la recherche)
# ============================================================================

PEDAGOGICAL_ALERTS = {
    # Illusion de compétence (Koriat & Bjork)
    "fluency_illusion": {
        "detection": "Tu réponds vite mais souvent faux.",
        "explanation": "Répondre vite ne veut pas dire bien comprendre. "
                       "La rapidité peut créer une illusion de maîtrise.",
        "recommendation": "Prends quelques secondes de plus pour réfléchir avant de répondre.",
    },

    # Overconfidence (Dunning-Kruger)
    "overconfidence": {
        "detection": "Tu sembles sûr de toi, mais les résultats ne suivent pas.",
        "explanation": "C'est normal ! Notre cerveau nous trompe parfois sur notre niveau réel.",
        "recommendation": "Essaie d'expliquer TON raisonnement à voix haute avant de répondre.",
    },

    # Cognitive overload (Sweller)
    "cognitive_overload": {
        "detection": "Tu montres des signes de fatigue cognitive.",
        "explanation": "Quand le cerveau est surchargé, on apprend moins bien.",
        "recommendation": "Une pause de 5 minutes serait bénéfique. Tu reviendras plus efficace !",
    },

    # Memory decay (Ebbinghaus)
    "memory_decay": {
        "detection": "Ce topic n'a pas été révisé depuis un moment.",
        "explanation": "Sans révision, la mémoire s'efface naturellement (courbe d'oubli).",
        "recommendation": "C'est le bon moment pour réviser ! Ta mémoire a besoin de renforcement.",
    },

    # Desirable difficulties (Bjork)
    "desirable_difficulty": {
        "detection": "Ce n'est pas facile, et c'est BIEN.",
        "explanation": "Les difficultés qui font réfléchir améliorent l'apprentissage à long terme.",
        "recommendation": "L'effort que tu fais maintenant renforce ta mémoire. Continue !",
    },

    # Testing effect (Roediger & Karpicke)
    "testing_effect": {
        "detection": "Se tester est plus efficace que relire.",
        "explanation": "Le simple fait de chercher la réponse renforce ta mémoire, "
                       "même si tu te trompes.",
        "recommendation": "Chaque tentative compte ! L'effort de rappel = apprentissage.",
    },

    # Generation effect (Slamecka & Graf)
    "generation_effect": {
        "detection": "Génère la réponse toi-même plutôt que de la reconnaître.",
        "explanation": "Produire une réponse ancre mieux la connaissance que la choisir.",
        "recommendation": "Avant de regarder les options, essaie de formuler ta réponse.",
    },
}


class SocraticTutor:
    """
    Tuteur Socratique qui guide sans donner les réponses.

    Principes:
    1. Jamais de réponse directe (sauf après épuisement des hints)
    2. Questions pour faire réfléchir l'étudiant
    3. Indices progressifs (3 niveaux)
    4. Détection et correction des misconceptions
    5. L'étudiant doit fournir un effort cognitif

    Adaptations avancées (v2):
    6. Adaptation temporelle (heure de la journée)
    7. Adaptation par patterns d'erreurs
    8. Adaptation émotionnelle (frustration, désengagement)
    9. Adaptation par style d'apprentissage
    10. Méta-adaptation (le tuteur apprend ce qui fonctionne)
    """

    def __init__(self, openai_service=None, learning_engine=None):
        """
        Initialise le tuteur.

        Args:
            openai_service: Service OpenAI pour génération avancée (optionnel)
                           Si None, utilise les templates statiques
            learning_engine: Moteur d'apprentissage pour insights pédagogiques (optionnel)
                            Si None, utilise des valeurs par défaut
        """
        self.openai_service = openai_service
        self.learning_engine = learning_engine
        self._contexts: Dict[str, TutoringContext] = {}

        # Tracking pour détection d'illusion de compétence
        self._fast_wrong_answers: Dict[str, List[float]] = {}  # user_id -> response_times

        # === NOUVEAU: Profils adaptatifs par utilisateur ===
        self._adaptive_profiles: Dict[str, AdaptiveProfile] = {}

        # === NOUVEAU: Historique des réponses pour analyse de patterns ===
        self._response_history: Dict[str, List[Dict]] = defaultdict(list)

        logger.info("🎓 SocraticTutor v2 initialisé (avec adaptation avancée)")

    # =========================================================================
    # ADAPTATION AVANCÉE - Profils et Patterns
    # =========================================================================

    def get_adaptive_profile(self, user_id: str) -> AdaptiveProfile:
        """
        Récupère ou crée le profil adaptatif d'un utilisateur.

        Le profil est chargé depuis la DB si disponible, sinon créé.
        Les données sont cachées en mémoire pour la session.
        """
        if user_id not in self._adaptive_profiles:
            # Charger depuis la DB
            db_profile = db.get_or_create_profile(user_id)
            db_time_patterns = db.get_time_patterns(user_id)
            db_topic_mastery = db.get_topic_mastery(user_id)

            # Créer le profil en mémoire
            profile = AdaptiveProfile(user_id=user_id)

            # Hydrater avec les données DB
            profile.learning_style = LearningStyle(
                prefers_examples=db_profile.get("prefers_examples", 0.5),
                prefers_visual=db_profile.get("prefers_visual", 0.5),
                prefers_step_by_step=db_profile.get("prefers_step_by_step", 0.5),
                needs_encouragement=db_profile.get("needs_encouragement", 0.5),
                optimal_hint_level=db_profile.get("optimal_hint_level", 2.0),
            )

            # Time patterns
            for hour, data in db_time_patterns.items():
                profile.time_patterns[hour] = TimePattern(
                    hour=hour,
                    accuracy=data["accuracy"],
                    response_time=data["response_time"],
                    samples=data["samples"]
                )

            # Calculer optimal hours
            if len(profile.time_patterns) >= 3:
                sorted_hours = sorted(
                    profile.time_patterns.values(),
                    key=lambda x: x.accuracy,
                    reverse=True
                )
                profile.optimal_hours = [tp.hour for tp in sorted_hours[:3]]
            else:
                profile.optimal_hours = db.get_optimal_hours(user_id)

            # Weak topics
            profile.weak_topics = db.get_weak_topics(user_id)

            # Error patterns actifs
            for p in db.get_active_error_patterns(user_id, minutes=60):
                profile.error_patterns.append(ErrorPattern(
                    pattern_type=p["type"],
                    description="",
                    frequency=p["frequency"],
                    last_seen=datetime.fromisoformat(p["last_seen"]) if p.get("last_seen") else None,
                    topics_affected=p.get("topics", [])
                ))

            self._adaptive_profiles[user_id] = profile
            logger.info(f"📂 Profil chargé depuis DB pour {user_id} "
                       f"({db_profile.get('total_interactions', 0)} interactions)")

        return self._adaptive_profiles[user_id]

    def record_interaction(
        self,
        user_id: str,
        response_time: float,
        is_correct: bool,
        topic: str,
        hint_level_used: int = 0,
        user_answer: str = "",
        correct_answer: str = "",
        hour_override: int = None
    ):
        """
        Enregistre une interaction pour l'adaptation.

        Cette méthode est le cœur de l'apprentissage du tuteur sur l'étudiant.
        Les données sont sauvegardées en DB pour persistence entre sessions.

        Args:
            hour_override: Optionnel - forcer une heure spécifique (pour tests/simulation)
        """
        profile = self.get_adaptive_profile(user_id)
        now = datetime.now()
        hour = hour_override if hour_override is not None else now.hour

        # === PERSISTANCE DB ===
        # Enregistrer l'interaction en DB (met à jour tous les patterns)
        db.record_interaction(
            user_id=user_id,
            topic=topic,
            is_correct=is_correct,
            response_time=response_time,
            hint_level_used=hint_level_used,
            hour_override=hour  # Passer l'heure (réelle ou override)
        )

        # 1. Mise à jour du pattern temporel (en mémoire pour la session)
        self._update_time_pattern(profile, hour, response_time, is_correct)

        # 2. Détection des patterns d'erreurs
        self._detect_error_patterns(
            profile, user_id, is_correct, response_time, topic,
            user_answer, correct_answer
        )

        # 3. Mise à jour de l'état émotionnel
        self._update_emotional_state(profile, is_correct, response_time)

        # 4. Mise à jour de l'efficacité des hints (méta-adaptation)
        if hint_level_used > 0:
            self._update_hint_effectiveness(profile, hint_level_used, is_correct)
            # Persister en DB aussi
            db.update_hint_effectiveness(user_id, hint_level_used, is_correct)

        # 5. Mise à jour des topics faibles
        self._update_weak_topics(profile, topic, is_correct)

        # 6. Historique de session (en mémoire)
        self._response_history[user_id].append({
            "timestamp": now,
            "hour": hour,
            "response_time": response_time,
            "is_correct": is_correct,
            "topic": topic,
            "hint_level": hint_level_used
        })

        profile.updated_at = now

    def _update_time_pattern(
        self,
        profile: AdaptiveProfile,
        hour: int,
        response_time: float,
        is_correct: bool
    ):
        """Met à jour les patterns temporels."""
        if hour not in profile.time_patterns:
            profile.time_patterns[hour] = TimePattern(
                hour=hour,
                accuracy=1.0 if is_correct else 0.0,
                response_time=response_time,
                samples=1
            )
        else:
            tp = profile.time_patterns[hour]
            n = tp.samples
            # Moyenne mobile
            tp.accuracy = (tp.accuracy * n + (1 if is_correct else 0)) / (n + 1)
            tp.response_time = (tp.response_time * n + response_time) / (n + 1)
            tp.samples += 1

        # Recalculer les heures optimales (top 3 accuracy)
        if len(profile.time_patterns) >= 3:
            sorted_hours = sorted(
                profile.time_patterns.values(),
                key=lambda x: x.accuracy,
                reverse=True
            )
            profile.optimal_hours = [tp.hour for tp in sorted_hours[:3]]

    def _detect_error_patterns(
        self,
        profile: AdaptiveProfile,
        user_id: str,
        is_correct: bool,
        response_time: float,
        topic: str,
        user_answer: str,
        correct_answer: str
    ):
        """Détecte les patterns d'erreurs récurrents."""
        if is_correct:
            return

        history = self._response_history[user_id][-20:]  # 20 dernières

        # Pattern: HASTE - Réponses trop rapides et fausses
        fast_wrong = [r for r in history if r["response_time"] < 3 and not r["is_correct"]]
        if len(fast_wrong) >= 3:
            self._add_error_pattern(
                profile, "haste",
                "Tu réponds trop vite sans réfléchir suffisamment",
                [r.get("topic", topic) for r in fast_wrong[-3:]]
            )

        # Pattern: FATIGUE - Temps de réponse qui augmente + erreurs
        if len(history) >= 5:
            recent_times = [r["response_time"] for r in history[-5:]]
            if recent_times[-1] > recent_times[0] * 1.5 and not is_correct:
                self._add_error_pattern(
                    profile, "fatigue",
                    "Les temps de réponse augmentent, signe de fatigue",
                    [topic]
                )

        # Pattern: CONFUSION - Mêmes types d'erreurs répétées
        topic_errors = [r for r in history if r["topic"] == topic and not r["is_correct"]]
        if len(topic_errors) >= 3:
            self._add_error_pattern(
                profile, "confusion",
                f"Difficultés persistantes en {topic}",
                [topic]
            )

        # Pattern: GAP - Topic non pratiqué depuis longtemps
        last_topic_practice = None
        for r in reversed(history):
            if r["topic"] == topic and r["is_correct"]:
                last_topic_practice = r["timestamp"]
                break
        if last_topic_practice and (datetime.now() - last_topic_practice).days > 7:
            self._add_error_pattern(
                profile, "gap",
                f"Ce topic n'a pas été révisé depuis longtemps",
                [topic]
            )

    def _add_error_pattern(
        self,
        profile: AdaptiveProfile,
        pattern_type: str,
        description: str,
        topics: List[str]
    ):
        """Ajoute ou met à jour un pattern d'erreur."""
        existing = next(
            (p for p in profile.error_patterns if p.pattern_type == pattern_type),
            None
        )
        if existing:
            existing.frequency += 1
            existing.last_seen = datetime.now()
            for t in topics:
                if t not in existing.topics_affected:
                    existing.topics_affected.append(t)
        else:
            profile.error_patterns.append(ErrorPattern(
                pattern_type=pattern_type,
                description=description,
                frequency=1,
                last_seen=datetime.now(),
                topics_affected=topics
            ))

        # Persister en DB
        db.update_error_pattern(profile.user_id, pattern_type, topics)

    def _update_emotional_state(
        self,
        profile: AdaptiveProfile,
        is_correct: bool,
        response_time: float
    ):
        """Met à jour l'état émotionnel détecté."""
        state = profile.emotional_state

        # Frustration: erreurs répétées + temps courts (essais rapides frustrés)
        if not is_correct and response_time < 3:
            state.frustration_level = min(1.0, state.frustration_level + 0.15)
        else:
            state.frustration_level = max(0.0, state.frustration_level - 0.05)

        # Désengagement: temps de réponse très long
        if response_time > 30:
            state.engagement_level = max(0.0, state.engagement_level - 0.1)
        elif response_time < 15 and is_correct:
            state.engagement_level = min(1.0, state.engagement_level + 0.05)

        # Confiance: basée sur les bonnes réponses récentes
        if is_correct:
            state.confidence_level = min(1.0, state.confidence_level + 0.1)
        else:
            state.confidence_level = max(0.0, state.confidence_level - 0.05)

        # Fatigue: détectée via response_time croissant (géré par pattern)
        history = self._response_history.get(profile.user_id, [])[-10:]
        if len(history) >= 5:
            times = [r["response_time"] for r in history]
            if times[-1] > sum(times[:-1]) / len(times[:-1]) * 1.3:
                state.fatigue_level = min(1.0, state.fatigue_level + 0.1)
            else:
                state.fatigue_level = max(0.0, state.fatigue_level - 0.05)

    def _update_hint_effectiveness(
        self,
        profile: AdaptiveProfile,
        hint_level: int,
        led_to_correct: bool
    ):
        """Méta-adaptation: apprend quel niveau d'indice est efficace."""
        profile.hint_effectiveness[hint_level].append(led_to_correct)

        # Garder seulement les 20 derniers
        if len(profile.hint_effectiveness[hint_level]) > 20:
            profile.hint_effectiveness[hint_level] = profile.hint_effectiveness[hint_level][-20:]

        # Recalculer le niveau optimal
        best_level = 2  # default
        best_rate = 0.0
        for level, results in profile.hint_effectiveness.items():
            if len(results) >= 3:
                rate = sum(results) / len(results)
                if rate > best_rate:
                    best_rate = rate
                    best_level = level

        profile.learning_style.optimal_hint_level = best_level

    def _update_weak_topics(
        self,
        profile: AdaptiveProfile,
        topic: str,
        is_correct: bool
    ):
        """Met à jour les topics faibles."""
        if topic not in profile.weak_topics:
            profile.weak_topics[topic] = 0.5

        # Moyenne mobile avec decay
        current = profile.weak_topics[topic]
        profile.weak_topics[topic] = current * 0.8 + (1 if is_correct else 0) * 0.2

    # =========================================================================
    # ADAPTATION INTELLIGENTE - Génération de réponses adaptées
    # =========================================================================

    def get_adaptive_response(
        self,
        user_id: str,
        base_response: TutoringResponse,
        question_data: Dict
    ) -> TutoringResponse:
        """
        Adapte la réponse du tuteur au profil de l'utilisateur.

        C'est la méthode clé qui personnalise TOUT.
        """
        profile = self.get_adaptive_profile(user_id)
        state = profile.emotional_state
        style = profile.learning_style
        hour = datetime.now().hour

        content = base_response.content
        encouragement = base_response.encouragement
        additions = []

        # 1. ADAPTATION TEMPORELLE
        time_adaptation = self._get_time_adaptation(profile, hour)
        if time_adaptation:
            additions.append(time_adaptation)

        # 2. ADAPTATION ÉMOTIONNELLE
        if state.frustration_level > 0.6:
            # Haute frustration → ton plus doux, encouragement renforcé
            encouragement = self._get_frustration_response(state.frustration_level)
            content = self._soften_message(content)

        elif state.engagement_level < 0.4:
            # Désengagement → message stimulant
            additions.append(self._get_engagement_boost())

        elif state.fatigue_level > 0.6:
            # Fatigue → suggérer pause
            additions.append("🧠 Tu sembles fatigué. Une pause de 5 min serait bénéfique !")

        # 3. ADAPTATION PAR PATTERNS D'ERREURS
        active_patterns = [p for p in profile.error_patterns if p.last_seen and
                         (datetime.now() - p.last_seen).seconds < 300]
        for pattern in active_patterns[:1]:  # Max 1 pattern à la fois
            pattern_msg = self._get_pattern_intervention(pattern)
            if pattern_msg:
                additions.append(pattern_msg)

        # 4. ADAPTATION PAR STYLE D'APPRENTISSAGE
        if style.prefers_examples > 0.6 and "règle" in content.lower():
            # Préfère exemples → ajouter un exemple
            content = self._add_example_to_content(content, question_data)

        elif style.needs_encouragement > 0.7:
            # A besoin d'encouragement → renforcer
            encouragement = f"💪 {encouragement} Tu fais du super travail !"

        # 5. ADAPTATION TOPICS FAIBLES
        topic = question_data.get("topic", "")
        if topic in profile.weak_topics and profile.weak_topics[topic] < 0.4:
            # Topic faible → attention particulière
            additions.append(f"📍 Ce topic ({topic}) mérite ton attention. "
                           "Prends ton temps.")

        # Assembler la réponse finale
        if additions:
            content = content + "\n\n---\n" + "\n".join(additions)

        return TutoringResponse(
            type=base_response.type,
            content=content,
            level=base_response.level,
            requires_response=base_response.requires_response,
            encouragement=encouragement,
            next_action=base_response.next_action,
            cognitive_load=base_response.cognitive_load
        )

    def _get_time_adaptation(self, profile: AdaptiveProfile, hour: int) -> Optional[str]:
        """Génère un message d'adaptation temporelle."""
        if hour not in profile.time_patterns:
            return None

        tp = profile.time_patterns[hour]

        # Si c'est une heure où l'utilisateur performe mal
        if tp.accuracy < 0.4 and tp.samples >= 5:
            if profile.optimal_hours:
                optimal = profile.optimal_hours[0]
                return (f"📊 Historiquement, tu performes mieux vers {optimal}h. "
                       f"À cette heure ({hour}h), ton accuracy est de {tp.accuracy*100:.0f}%.")

        # Si c'est une heure optimale
        if hour in profile.optimal_hours and tp.samples >= 3:
            return f"⭐ C'est l'une de tes meilleures heures pour apprendre ! ({tp.accuracy*100:.0f}% accuracy)"

        return None

    def _get_frustration_response(self, level: float) -> str:
        """Génère une réponse adaptée au niveau de frustration."""
        if level > 0.8:
            return ("C'est normal de trouver ça difficile. Chaque effort compte, "
                   "même quand ça ne marche pas tout de suite. Tu progresses !")
        elif level > 0.6:
            return ("Je vois que c'est frustrant. Respire un coup et on continue ensemble.")
        return "Continue, tu vas y arriver !"

    def _get_engagement_boost(self) -> str:
        """Génère un message pour booster l'engagement."""
        boosts = [
            "🎯 Défi: Essaie de trouver sans indice supplémentaire !",
            "💡 Savais-tu que ce concept est utilisé tous les jours en français ?",
            "🔥 Tu es à quelques bonnes réponses d'une série !",
            "🧩 Vois cette question comme un puzzle à résoudre.",
        ]
        return random.choice(boosts)

    def _get_pattern_intervention(self, pattern: ErrorPattern) -> Optional[str]:
        """Génère une intervention basée sur le pattern détecté."""
        interventions = {
            "haste": "⏱️ Prends 3 secondes de plus avant de répondre. La précipitation cause des erreurs.",
            "fatigue": "😴 Tu montres des signes de fatigue. Une courte pause améliorerait ta concentration.",
            "confusion": f"🎯 Je détecte des difficultés persistantes en {', '.join(pattern.topics_affected[:2])}. "
                        "Concentre-toi sur la compréhension de la règle de base.",
            "gap": "📅 Ce sujet n'a pas été révisé depuis un moment. Normal d'être rouillé !",
        }
        return interventions.get(pattern.pattern_type)

    def _soften_message(self, content: str) -> str:
        """Adoucit un message pour un utilisateur frustré."""
        # Remplacer les formulations directes par des plus douces
        replacements = {
            "Tu as tort": "Ce n'est pas tout à fait ça",
            "Faux": "Pas exactement",
            "Non": "Pas tout à fait",
            "Mauvaise réponse": "Essaie encore",
            "Incorrect": "Presque",
        }
        for old, new in replacements.items():
            content = content.replace(old, new)
        return content

    def _add_example_to_content(self, content: str, question_data: Dict) -> str:
        """Ajoute un exemple concret au contenu."""
        topic = question_data.get("topic", "")

        examples = {
            "conjugaison": "Par exemple: 'Je mange' (présent) vs 'Je mangeais' (imparfait).",
            "grammaire": "Par exemple: Dans 'Le chat mange la souris', 'la souris' est COD.",
            "orthographe": "Par exemple: 'Ces' (démonstratif) vs 'Ses' (possessif).",
            "vocabulaire": "Par exemple: 'Éminent' (célèbre) vs 'Imminent' (proche).",
        }

        example = examples.get(topic, "")
        if example:
            return f"{content}\n\n📖 {example}"
        return content

    def get_optimal_hint_level(self, user_id: str) -> int:
        """
        Retourne le niveau d'indice optimal pour cet utilisateur.

        Utilise les données DB pour un calcul basé sur l'historique long terme.
        """
        # D'abord vérifier en DB (données long terme plus fiables)
        db_optimal = db.get_optimal_hint_level(user_id)
        if db_optimal != 2:  # 2 est le défaut, donc si différent = données réelles
            return db_optimal

        # Sinon utiliser le profil en mémoire
        profile = self.get_adaptive_profile(user_id)
        return int(round(profile.learning_style.optimal_hint_level))

    def should_suggest_break(self, user_id: str) -> Tuple[bool, str]:
        """
        Vérifie si une pause devrait être suggérée.

        Combine l'état émotionnel de la session et les patterns DB.
        """
        profile = self.get_adaptive_profile(user_id)
        state = profile.emotional_state

        if state.fatigue_level > 0.7:
            return True, "Tu sembles fatigué. Une pause de 5-10 minutes te fera du bien !"

        if state.frustration_level > 0.8:
            return True, "Prends une courte pause. Tu reviendras avec un regard frais !"

        # Vérifier les patterns de fatigue actifs en DB
        active_patterns = db.get_active_error_patterns(user_id, minutes=10)
        fatigue_patterns = [p for p in active_patterns if p["type"] == "fatigue"]
        if fatigue_patterns and fatigue_patterns[0]["frequency"] >= 2:
            return True, "J'ai détecté des signes de fatigue récurrents. Une pause serait bénéfique !"

        # Trop de questions sans pause (session courante)
        history = self._response_history.get(user_id, [])
        if len(history) >= 30:
            recent_30 = history[-30:]
            if recent_30:
                duration = (recent_30[-1]["timestamp"] - recent_30[0]["timestamp"]).seconds
                if duration < 1800:  # 30 questions en moins de 30 min
                    return True, "Tu travailles intensément ! Une pause aide la mémorisation."

        return False, ""

    def get_profile_summary(self, user_id: str) -> Dict:
        """
        Retourne un résumé du profil pour affichage.

        Combine les données en mémoire (session courante) et celles de la DB
        (historique long terme) pour un résumé complet.
        """
        # Charger le profil complet depuis la DB pour les données long terme
        db_summary = db.get_full_profile_summary(user_id)

        # Charger le profil en mémoire pour les données session
        profile = self.get_adaptive_profile(user_id)
        state = profile.emotional_state

        # Combiner les deux sources
        return {
            # Données long terme (DB)
            "optimal_hours": db_summary.get("optimal_hours") or profile.optimal_hours or [9, 10, 11],
            "best_day": db_summary.get("best_day"),
            "global_accuracy": db_summary.get("global_accuracy", 0),
            "total_interactions": db_summary.get("total_interactions", 0),

            # Style d'apprentissage (DB)
            "learning_style": db_summary.get("learning_style", {
                "prefers_examples": profile.learning_style.prefers_examples > 0.5,
                "needs_encouragement": profile.learning_style.needs_encouragement > 0.5,
                "optimal_hint_level": profile.learning_style.optimal_hint_level,
            }),

            # État émotionnel (session courante)
            "emotional_state": {
                "frustration": f"{state.frustration_level*100:.0f}%",
                "engagement": f"{state.engagement_level*100:.0f}%",
                "confidence": f"{state.confidence_level*100:.0f}%",
                "fatigue": f"{state.fatigue_level*100:.0f}%",
            },

            # Topics (DB pour historique, mémoire pour session)
            "weak_topics": db_summary.get("weak_topics", {}),
            "topic_mastery": db_summary.get("topic_mastery", {}),

            # Patterns (combinaison DB + mémoire)
            "active_patterns": list(set(
                db_summary.get("active_patterns", []) +
                [p.pattern_type for p in profile.error_patterns
                 if p.last_seen and (datetime.now() - p.last_seen).seconds < 600]
            )),

            # Time patterns (DB pour visualisation)
            "time_patterns": db_summary.get("time_patterns", {}),

            # Méta-info
            "created_at": db_summary.get("created_at"),
        }

    # =========================================================================
    # PEDAGOGICAL INSIGHTS (connexion au Learning Engine)
    # =========================================================================

    def update_pedagogical_context(
        self,
        context: TutoringContext,
        user_id: str,
        topic: str,
        response_time: float = None,
        is_correct: bool = None
    ):
        """
        Met à jour les insights pédagogiques depuis le Learning Engine.

        Utilise les données FSRS, cognitive load, etc. pour adapter le tutorat.
        """
        if self.learning_engine:
            try:
                # Récupérer l'état utilisateur du moteur
                state = self.learning_engine._get_user_state(user_id)

                # FSRS data
                if topic in state.get("fsrs_cards", {}):
                    card = state["fsrs_cards"][topic]
                    context.pedagogical.stability = card.stability
                    context.pedagogical.retrievability = self.learning_engine._get_retrievability(state, topic)

                # Cognitive load
                load, should_break = self.learning_engine._assess_cognitive_load(state)
                context.pedagogical.cognitive_load = load
                context.pedagogical.should_take_break = should_break

                # Performance récente
                recent = state.get("responses", [])[-10:]
                if recent:
                    context.pedagogical.recent_accuracy = sum(
                        1 for r in recent if r.get("is_correct", False)
                    ) / len(recent)

                context.pedagogical.streak = state.get("streak", 0)
                context.pedagogical.mastery = state.get("mastery", {}).get(topic, 0)

            except Exception as e:
                logger.warning(f"Erreur récupération insights pédagogiques: {e}")

        # Détection d'illusion de compétence (indépendant du moteur)
        if response_time is not None and is_correct is not None:
            self._detect_fluency_illusion(user_id, response_time, is_correct, context)

    def _detect_fluency_illusion(
        self,
        user_id: str,
        response_time: float,
        is_correct: bool,
        context: TutoringContext
    ):
        """
        Détecte l'illusion de compétence (fluency illusion).

        Principe (Koriat & Bjork): Répondre vite + mal = croire savoir sans savoir.
        """
        if user_id not in self._fast_wrong_answers:
            self._fast_wrong_answers[user_id] = []

        # Réponse rapide (< 5 secondes) mais fausse = signal d'illusion
        if response_time < 5.0 and not is_correct:
            self._fast_wrong_answers[user_id].append(response_time)
            context.pedagogical.fast_wrong_count = len(self._fast_wrong_answers[user_id])

            # 3+ réponses rapides-fausses = overconfidence détectée
            if len(self._fast_wrong_answers[user_id]) >= 3:
                context.pedagogical.overconfidence_detected = True
        elif is_correct:
            # Reset si correct (pas d'illusion sur cette réponse)
            if user_id in self._fast_wrong_answers and len(self._fast_wrong_answers[user_id]) > 0:
                self._fast_wrong_answers[user_id].pop(0)  # Retirer une erreur

    def get_pedagogical_alert(self, context: TutoringContext) -> Optional[str]:
        """
        Génère une alerte pédagogique si nécessaire.

        Basé sur les données du Learning Engine et les principes de recherche.
        """
        alerts = []
        ped = context.pedagogical

        # 1. Illusion de compétence (priorité haute)
        if ped.overconfidence_detected:
            alert = PEDAGOGICAL_ALERTS["fluency_illusion"]
            alerts.append(f"⚠️ {alert['detection']}\n💡 {alert['recommendation']}")

        # 2. Surcharge cognitive (priorité haute)
        if ped.cognitive_load in ["high", "overload"] or ped.should_take_break:
            alert = PEDAGOGICAL_ALERTS["cognitive_overload"]
            alerts.append(f"🧠 {alert['detection']}\n💡 {alert['recommendation']}")

        # 3. Mémoire faible - besoin de révision
        if ped.retrievability < 0.5:
            alert = PEDAGOGICAL_ALERTS["memory_decay"]
            alerts.append(f"📉 {alert['detection']}\n💡 {alert['recommendation']}")

        # 4. Difficulté désirable (encouragement si struggle mais progresse)
        if ped.recent_accuracy < 0.6 and ped.streak > -3:
            alert = PEDAGOGICAL_ALERTS["desirable_difficulty"]
            alerts.append(f"💪 {alert['explanation']}")

        # 5. Testing effect (rappel occasionnel)
        if context.hints_used >= 2 and random.random() < 0.3:
            alert = PEDAGOGICAL_ALERTS["testing_effect"]
            alerts.append(f"🔬 {alert['explanation']}")

        return "\n\n".join(alerts) if alerts else None

    # =========================================================================
    # CONTEXT MANAGEMENT
    # =========================================================================

    def get_context(self, user_id: str, topic: str, question_id: str = None) -> TutoringContext:
        """Récupère ou crée le contexte de tutorat."""
        key = f"{user_id}:{topic}:{question_id or 'default'}"
        if key not in self._contexts:
            self._contexts[key] = TutoringContext(user_id=user_id, topic=topic)
        return self._contexts[key]

    def reset_context(self, user_id: str, topic: str = None, question_id: str = None):
        """Reset le contexte pour une nouvelle question."""
        if topic and question_id:
            key = f"{user_id}:{topic}:{question_id}"
            if key in self._contexts:
                del self._contexts[key]
        else:
            # Reset tous les contextes de cet utilisateur
            keys_to_delete = [k for k in self._contexts if k.startswith(f"{user_id}:")]
            for k in keys_to_delete:
                del self._contexts[k]

    # =========================================================================
    # HINT SYSTEM (Indices progressifs)
    # =========================================================================

    def get_hint(
        self,
        question_data: Dict,
        user_answer: str,
        context: TutoringContext,
        force_level: int = None
    ) -> TutoringResponse:
        """
        Donne un indice progressif SANS révéler la réponse.

        Niveau 1 (SUBTLE): Très vague, pousse à réfléchir
        Niveau 2 (MODERATE): Oriente vers la bonne direction
        Niveau 3 (EXPLICIT): Presque la réponse (dernier recours)

        Après niveau 3, si toujours faux → révèle avec explication

        Args:
            question_data: Dict avec question_text, options, correct_answer, topic
            user_answer: La réponse (incorrecte) de l'utilisateur
            context: Le contexte de tutorat
            force_level: Force un niveau spécifique (pour tests)

        Returns:
            TutoringResponse avec l'indice approprié
        """
        # Track wrong answer
        if user_answer and user_answer not in context.wrong_answers:
            context.wrong_answers.append(user_answer)

        # Determine hint level
        if force_level:
            level = HintLevel(force_level)
        else:
            context.hints_used += 1
            level = HintLevel(min(context.hints_used, 3))

        topic = question_data.get("topic", "général")
        correct_answer = question_data.get("correct_answer", "")
        question_text = question_data.get("question_text", "")
        options = question_data.get("options", [])

        # Si déjà utilisé tous les hints → révéler
        if context.hints_used > context.max_hints:
            return self._reveal_answer(question_data, context)

        # Générer l'indice selon le niveau
        if level == HintLevel.SUBTLE:
            hint = self._generate_subtle_hint(question_data, user_answer)
        elif level == HintLevel.MODERATE:
            hint = self._generate_moderate_hint(question_data, user_answer, topic)
        else:  # EXPLICIT
            hint = self._generate_explicit_hint(question_data, user_answer, topic)

        # Track hint
        context.hint_history.append(hint)

        # Encouragement adapté
        encouragement = self._get_encouragement(context, user_answer, correct_answer)

        # === NOUVEAU: Ajouter alerte pédagogique si pertinente ===
        pedagogical_alert = self.get_pedagogical_alert(context)
        if pedagogical_alert:
            hint = f"{hint}\n\n---\n{pedagogical_alert}"

        # Déterminer la charge cognitive basée sur le contexte pédagogique
        ped_load = context.pedagogical.cognitive_load
        if ped_load in ["high", "overload"]:
            cognitive = "high"
        elif level.value >= 3 or ped_load == "elevated":
            cognitive = "elevated"
        else:
            cognitive = "optimal"

        return TutoringResponse(
            type="hint",
            content=hint,
            level=level.value,
            requires_response=True,
            encouragement=encouragement,
            next_action="Réessaie avec cet indice en tête.",
            cognitive_load=cognitive
        )

    def _generate_subtle_hint(self, question_data: Dict, user_answer: str) -> str:
        """Génère un indice très vague (niveau 1)."""
        templates = HINT_TEMPLATES[HintLevel.SUBTLE]
        return random.choice(templates)

    def _generate_moderate_hint(self, question_data: Dict, user_answer: str, topic: str) -> str:
        """Génère un indice qui oriente (niveau 2)."""
        question_text = question_data.get("question_text", "")
        correct_answer = question_data.get("correct_answer", "")

        # Construire des éléments de focus selon le topic
        focus_elements = {
            "conjugaison": {
                "focus_element": "la terminaison du verbe",
                "key_element": "le temps demandé",
                "rule_hint": "chaque temps a ses terminaisons propres",
                "specific_part": "le sujet",
                "element_a": "le sujet",
                "element_b": "la terminaison",
            },
            "grammaire": {
                "focus_element": "la fonction du mot",
                "key_element": "la structure de la phrase",
                "rule_hint": "identifie d'abord sujet et verbe",
                "specific_part": "les mots qui entourent",
                "element_a": "le verbe",
                "element_b": "ses compléments",
            },
            "orthographe": {
                "focus_element": "l'accord",
                "key_element": "le genre et le nombre",
                "rule_hint": "cherche avec quoi le mot s'accorde",
                "specific_part": "le mot qui précède",
                "element_a": "le nom",
                "element_b": "l'adjectif ou participe",
            },
            "vocabulaire": {
                "focus_element": "le contexte",
                "key_element": "le sens général de la phrase",
                "rule_hint": "le contexte donne souvent des indices",
                "specific_part": "les mots autour",
                "element_a": "le mot",
                "element_b": "son contexte",
            },
        }

        elements = focus_elements.get(topic, focus_elements["grammaire"])

        templates = HINT_TEMPLATES[HintLevel.MODERATE]
        template = random.choice(templates)

        return template.format(**elements)

    def _generate_explicit_hint(self, question_data: Dict, user_answer: str, topic: str) -> str:
        """Génère un indice explicite (niveau 3) - presque la réponse."""
        correct_answer = question_data.get("correct_answer", "")
        options = question_data.get("options", [])

        # Identifier les mauvaises options à éliminer
        wrong_options = [opt for opt in options if opt != correct_answer]

        # Choisir un template explicite
        hints = [
            f"Élimine '{wrong_options[0]}' et '{wrong_options[1] if len(wrong_options) > 1 else wrong_options[0]}'...",
            f"La réponse commence par '{correct_answer[0] if correct_answer else '?'}'...",
            f"Ce n'est PAS '{user_answer}'. Regarde les autres options.",
            f"Il ne reste que {len(options) - len(wrong_options[:2])} options possibles maintenant.",
        ]

        return random.choice(hints)

    def _reveal_answer(self, question_data: Dict, context: TutoringContext) -> TutoringResponse:
        """
        Révèle la réponse UNIQUEMENT après épuisement des indices.
        Avec explication pédagogique.
        """
        context.gave_up = True
        correct = question_data.get("correct_answer", "")
        explanation = question_data.get("explanation", "")

        content = f"La bonne réponse était: **{correct}**\n\n"
        if explanation:
            content += f"📖 Explication: {explanation}\n\n"
        content += "💡 Retiens bien cette règle pour la prochaine fois !"

        return TutoringResponse(
            type="reveal",
            content=content,
            level=4,  # Beyond hints
            requires_response=False,
            encouragement="C'est OK de ne pas savoir. L'important c'est d'apprendre !",
            next_action="Passe à la question suivante.",
            cognitive_load="low"
        )

    # =========================================================================
    # SOCRATIC GUIDANCE (Questions de guidage)
    # =========================================================================

    def get_socratic_guidance(
        self,
        question_data: Dict,
        user_answer: str,
        context: TutoringContext
    ) -> TutoringResponse:
        """
        Pose une question socratique pour guider l'étudiant.

        Ne donne JAMAIS la réponse, mais pousse à réfléchir.

        Args:
            question_data: La question en cours
            user_answer: La réponse de l'étudiant
            context: Contexte de tutorat

        Returns:
            TutoringResponse avec la question socratique
        """
        topic = question_data.get("topic", "général")
        context.socratic_questions_asked += 1

        # Obtenir les questions pour ce topic
        questions = SOCRATIC_QUESTIONS.get(topic, GENERIC_SOCRATIC_QUESTIONS)

        # Éviter de répéter les mêmes questions
        available = [q for q in questions if q not in context.hint_history]
        if not available:
            available = questions

        question = random.choice(available)
        context.hint_history.append(question)

        return TutoringResponse(
            type="guidance",
            content=question,
            requires_response=True,
            encouragement="Prends le temps de réfléchir à cette question.",
            next_action="Réponds à cette question, puis réessaie.",
            cognitive_load="optimal"
        )

    # =========================================================================
    # REASONING VALIDATION
    # =========================================================================

    async def validate_reasoning(
        self,
        question_data: Dict,
        user_explanation: str,
        context: TutoringContext
    ) -> TutoringResponse:
        """
        Valide le raisonnement de l'étudiant SANS dire si c'est juste.

        L'étudiant explique pourquoi il a choisi une réponse.
        Le tuteur valide le raisonnement, pas la réponse.

        Args:
            question_data: La question
            user_explanation: L'explication de l'étudiant
            context: Contexte de tutorat

        Returns:
            TutoringResponse validant (ou questionnant) le raisonnement
        """
        context.reasoning_attempts += 1
        correct_answer = question_data.get("correct_answer", "")
        topic = question_data.get("topic", "")

        # Si OpenAI disponible, utiliser l'IA pour analyser
        if self.openai_service:
            return await self._ai_validate_reasoning(
                question_data, user_explanation, context
            )

        # Sinon, validation basique par mots-clés
        return self._basic_validate_reasoning(
            question_data, user_explanation, context
        )

    async def _ai_validate_reasoning(
        self,
        question_data: Dict,
        user_explanation: str,
        context: TutoringContext
    ) -> TutoringResponse:
        """Utilise l'IA pour valider le raisonnement."""
        prompt = f"""Tu es un tuteur socratique. Un étudiant explique son raisonnement.

Question: {question_data.get('question_text', '')}
Options: {question_data.get('options', [])}
Bonne réponse: {question_data.get('correct_answer', '')}

Explication de l'étudiant: "{user_explanation}"

RÈGLES STRICTES:
1. NE DIS JAMAIS si la réponse est correcte ou incorrecte
2. NE RÉVÈLE JAMAIS la bonne réponse
3. Analyse uniquement le RAISONNEMENT
4. Pose une question pour approfondir ou corriger le raisonnement
5. Sois encourageant mais ne valide pas une mauvaise logique

Réponds en 1-2 phrases maximum. Pose une question de suivi si le raisonnement est incomplet."""

        try:
            response = await self.openai_service.generate_text(
                prompt,
                max_tokens=150,
                temperature=0.7
            )

            return TutoringResponse(
                type="validation",
                content=response,
                requires_response=True,
                encouragement="Continue de réfléchir à voix haute !",
                next_action="Affine ton raisonnement.",
                cognitive_load="optimal"
            )
        except Exception as e:
            logger.error(f"Erreur validation IA: {e}")
            return self._basic_validate_reasoning(
                question_data, user_explanation, context
            )

    def _basic_validate_reasoning(
        self,
        question_data: Dict,
        user_explanation: str,
        context: TutoringContext
    ) -> TutoringResponse:
        """Validation basique sans IA."""
        explanation_lower = user_explanation.lower()

        # Réponses génériques qui poussent à approfondir
        responses = [
            "Intéressant... Peux-tu développer un peu plus ?",
            "D'accord, et qu'est-ce qui te fait penser ça ?",
            "Je vois ton point. Y a-t-il d'autres éléments à considérer ?",
            "Hmm, as-tu pensé à la règle qui s'applique ici ?",
            "Ton raisonnement est un bon début. Que peux-tu ajouter ?",
        ]

        # Si l'explication est trop courte
        if len(user_explanation) < 20:
            return TutoringResponse(
                type="validation",
                content="Peux-tu m'en dire plus ? Explique ton raisonnement en détail.",
                requires_response=True,
                encouragement="Plus tu expliques, mieux tu comprends !",
                next_action="Développe ton explication.",
                cognitive_load="optimal"
            )

        return TutoringResponse(
            type="validation",
            content=random.choice(responses),
            requires_response=True,
            encouragement="C'est bien de réfléchir à haute voix !",
            next_action="Continue à développer ta pensée.",
            cognitive_load="optimal"
        )

    # =========================================================================
    # MISCONCEPTION DETECTION
    # =========================================================================

    def detect_misconceptions(
        self,
        wrong_answers: List[Dict],
        topic: str
    ) -> List[Dict]:
        """
        Détecte les misconceptions basées sur l'historique des erreurs.

        Args:
            wrong_answers: Liste de {answer, correct_answer, question_type}
            topic: Le topic concerné

        Returns:
            Liste de misconceptions détectées avec corrections
        """
        if not wrong_answers:
            return []

        misconceptions_found = []
        topic_misconceptions = COMMON_MISCONCEPTIONS.get(topic, {})

        for misconception_id, misconception in topic_misconceptions.items():
            pattern = misconception["pattern"]

            # Chercher si ce pattern apparaît dans les erreurs
            matches = 0
            for wa in wrong_answers:
                answer_str = str(wa.get("answer", "")).lower()
                correct_str = str(wa.get("correct_answer", "")).lower()

                # Vérifier si les mots du pattern sont présents
                for p in pattern:
                    if p.lower() in answer_str or p.lower() in correct_str:
                        matches += 1
                        break

            # Si assez de matches, c'est probablement cette misconception
            if matches >= 2:
                misconceptions_found.append({
                    "id": misconception_id,
                    "correction": misconception["correction"],
                    "occurrences": matches,
                    "topic": topic,
                })

        return misconceptions_found

    def get_misconception_feedback(self, misconception: Dict) -> TutoringResponse:
        """Génère un feedback pour corriger une misconception."""
        correction = misconception.get("correction", "")

        content = f"💡 J'ai remarqué quelque chose...\n\n{correction}\n\n"
        content += "Garde cette règle en tête pour les prochaines questions !"

        return TutoringResponse(
            type="misconception",
            content=content,
            requires_response=False,
            encouragement="C'est normal de confondre ces notions au début !",
            next_action="Essaie d'appliquer cette règle.",
            cognitive_load="optimal"
        )

    # =========================================================================
    # HELPERS
    # =========================================================================

    def _get_encouragement(
        self,
        context: TutoringContext,
        user_answer: str,
        correct_answer: str
    ) -> str:
        """Sélectionne un encouragement adapté au contexte."""
        # Déterminer le type d'encouragement
        if context.hints_used == 1:
            category = "trying"
        elif context.hints_used == 2:
            category = "improving" if len(context.wrong_answers) < 3 else "struggling"
        else:
            # Vérifier si proche de la réponse (premier caractère identique)
            if user_answer and correct_answer and user_answer[0].lower() == correct_answer[0].lower():
                category = "close"
            else:
                category = "struggling"

        return random.choice(ENCOURAGEMENTS[category])

    # =========================================================================
    # INTERACTION COMPLÈTE
    # =========================================================================

    def process_wrong_answer(
        self,
        question_data: Dict,
        user_answer: str,
        user_id: str,
        response_time: float = None
    ) -> TutoringResponse:
        """
        Point d'entrée principal: traite une mauvaise réponse.

        Logique adaptative:
        1. Premier essai → Question socratique
        2. Deuxième essai → Indice niveau 1 (ou optimal selon profil)
        3. Troisième essai → Indice niveau 2
        4. Quatrième essai → Indice niveau 3
        5. Cinquième essai → Révélation

        Args:
            question_data: La question avec options, correct_answer, topic, etc.
            user_answer: La réponse incorrecte de l'utilisateur
            user_id: ID de l'utilisateur
            response_time: Temps de réponse en secondes (pour adaptation)

        Returns:
            TutoringResponse appropriée et adaptée au profil
        """
        topic = question_data.get("topic", "général")
        question_id = question_data.get("id", "default")
        correct_answer = question_data.get("correct_answer", "")

        context = self.get_context(user_id, topic, question_id)

        # === NOUVEAU: Enregistrer l'interaction pour adaptation ===
        if response_time is not None:
            self.record_interaction(
                user_id=user_id,
                response_time=response_time,
                is_correct=False,
                topic=topic,
                hint_level_used=context.hints_used,
                user_answer=user_answer,
                correct_answer=correct_answer
            )

        # Track cette mauvaise réponse (toujours ajouter pour compter les tentatives)
        context.wrong_answers.append(user_answer)

        attempt = len(context.wrong_answers)

        # === NOUVEAU: Vérifier si pause suggérée ===
        should_break, break_msg = self.should_suggest_break(user_id)
        if should_break and attempt >= 2:
            base_response = TutoringResponse(
                type="break_suggestion",
                content=break_msg,
                requires_response=False,
                encouragement="La pause fait partie de l'apprentissage !",
                next_action="Reviens quand tu te sens prêt.",
                cognitive_load="high"
            )
            return base_response

        # Générer la réponse de base
        if attempt == 1:
            # Premier essai: question socratique
            base_response = self.get_socratic_guidance(question_data, user_answer, context)
        elif attempt <= 4:
            # Essais 2-4: indices progressifs
            base_response = self.get_hint(question_data, user_answer, context)
        else:
            # 5+ essais: révéler
            base_response = self._reveal_answer(question_data, context)

        # === NOUVEAU: Appliquer l'adaptation avancée ===
        adapted_response = self.get_adaptive_response(user_id, base_response, question_data)

        return adapted_response

    def process_correct_answer(
        self,
        question_data: Dict,
        user_id: str,
        attempts: int,
        response_time: float = None,
        hint_level_used: int = 0
    ) -> TutoringResponse:
        """
        Traite une bonne réponse - encourage sans exagérer.

        Args:
            question_data: La question
            user_id: ID utilisateur
            attempts: Nombre d'essais avant de trouver
            response_time: Temps de réponse (pour adaptation)
            hint_level_used: Niveau d'indice qui a mené au succès

        Returns:
            TutoringResponse de félicitation adaptée
        """
        topic = question_data.get("topic", "général")
        correct_answer = question_data.get("correct_answer", "")

        # === NOUVEAU: Enregistrer l'interaction pour adaptation ===
        if response_time is not None:
            self.record_interaction(
                user_id=user_id,
                response_time=response_time,
                is_correct=True,
                topic=topic,
                hint_level_used=hint_level_used
            )

        # === NOUVEAU: Adapter le message selon le profil ===
        profile = self.get_adaptive_profile(user_id)
        state = profile.emotional_state

        if attempts == 1:
            messages = [
                "Correct !",
                "Bien joué !",
                "C'est ça !",
                "Exactement !",
            ]
            encouragement = "Tu maîtrises bien ce sujet."

            # Bonus si première réponse après série d'erreurs
            if state.frustration_level > 0.3:
                encouragement = "Super ! Tu vois, la persévérance paie !"
                state.frustration_level = max(0, state.frustration_level - 0.2)

        elif attempts <= 3:
            messages = [
                "Tu as trouvé !",
                "Bravo, tu y es arrivé !",
                "C'est correct !",
            ]
            encouragement = "La persévérance paie !"

            # Si utilisateur a besoin d'encouragement
            if profile.learning_style.needs_encouragement > 0.6:
                encouragement = "Excellent travail ! Chaque effort compte ! 💪"

        else:
            messages = [
                "Tu as fini par trouver !",
                "C'est ça, bien joué de ne pas avoir abandonné !",
            ]
            encouragement = "L'important c'est d'avoir compris."

            # Rappeler l'importance de l'effort
            if hint_level_used >= 3:
                encouragement = "Tu as travaillé pour cette réponse. C'est ça le vrai apprentissage !"

        # === NOUVEAU: Ajouter stats de session si pertinent ===
        history = self._response_history.get(user_id, [])[-20:]
        if len(history) >= 10:
            recent_correct = sum(1 for r in history if r["is_correct"])
            accuracy = recent_correct / len(history) * 100

            if accuracy >= 80:
                messages.append(f"🔥 Tu es à {accuracy:.0f}% sur les dernières questions !")
            elif accuracy >= 60 and state.confidence_level < 0.5:
                messages.append(f"📈 {accuracy:.0f}% de bonnes réponses. Tu progresses !")

        # Reset context pour cette question
        self.reset_context(user_id, topic)

        # === NOUVEAU: Mention de l'heure optimale si pertinent ===
        hour = datetime.now().hour
        additions = []
        if hour in profile.optimal_hours[:1] and profile.time_patterns.get(hour, TimePattern(hour, 0, 0)).samples >= 5:
            additions.append("C'est ton heure la plus productive !")

        content = random.choice(messages)
        if additions:
            content = f"{content}\n\n{''.join(additions)}"

        return TutoringResponse(
            type="success",
            content=content,
            requires_response=False,
            encouragement=encouragement,
            next_action="Continue avec la question suivante !",
            cognitive_load="low"
        )


# ============================================================================
# FACTORY FUNCTION
# ============================================================================

def create_socratic_tutor(openai_service=None, learning_engine=None) -> SocraticTutor:
    """
    Crée une instance du tuteur socratique.

    Args:
        openai_service: Service OpenAI pour génération avancée (optionnel)
        learning_engine: Moteur d'apprentissage pour insights pédagogiques (optionnel)
                        Si None, tente d'importer lean_engine automatiquement

    Returns:
        Instance configurée de SocraticTutor
    """
    # Auto-import du learning engine si non fourni
    if learning_engine is None:
        try:
            from services.learning_engine_lean import lean_engine
            learning_engine = lean_engine
        except ImportError:
            pass

    return SocraticTutor(openai_service, learning_engine)
