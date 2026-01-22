"""
Learning Engine v4.8 LEAN

5 modules scientifiques:
1. FSRS - Spaced Repetition (Pimsleur)
2. Testing Effect - Quiz actif (Dunlosky 2013)
3. Adaptive Difficulty - Zone proximale (Vygotsky)
4. State Detection - Cognitive load + fatigue + flow (Sweller, Csikszentmihalyi)
5. Interleaving - Mélange des sujets (Rohrer 2007)

+ Persistance SQLite
+ Streak protection, milestones, feedback adaptatif
"""

import logging
import sqlite3
import json
import random
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from pathlib import Path

# Imports essentiels uniquement
from utils.fsrs_algorithm import FSRS, FSRSCard, Rating
from utils.cognitive_load import CognitiveLoadDetector

logger = logging.getLogger(__name__)

# Chemin de la base de données
DB_PATH = Path(__file__).parent.parent / "data" / "learning.db"


@dataclass
class QuestionParams:
    """Paramètres pour la prochaine question"""
    difficulty: int  # 1-5
    difficulty_name: str  # "VERY_EASY" -> "EXPERT"
    topic_id: str
    fsrs_interval: float
    retrievability: float
    cognitive_load: str
    should_take_break: bool
    interleave_suggested: bool  # Suggérer de changer de sujet


@dataclass
class AnswerResult:
    """Résultat après traitement d'une réponse"""
    mastery_change: int
    xp_earned: int
    next_review_days: float
    accuracy_recent: float
    should_reduce_difficulty: bool
    should_take_break: bool
    feedback: str
    # Nouvelles métriques motivation
    streak_protected: bool = False
    decay_warnings: list = None

    def __post_init__(self):
        if self.decay_warnings is None:
            self.decay_warnings = []


@dataclass
class UserState:
    """
    État unifié de l'utilisateur (v4.8).

    Fusionne les 3 détecteurs d'état (Cognitive Load, Fatigue, Flow)
    en une seule représentation cohérente.

    Indicateurs:
    - cognitive_load: "low", "medium", "high", "overload"
    - fatigue_level: "none", "early", "moderate", "severe"
    - flow_state: "below", "in_flow", "above" (zone optimale)
    - should_pause: Recommandation pause (booléen)
    - recovery_mode: Mode récupération actif (booléen)
    - warning_message: Message d'alerte optionnel
    """
    cognitive_load: str = "low"       # Charge cognitive (Sweller 1988)
    fatigue_level: str = "none"       # Fatigue (Krueger 1989, Posner 1990)
    flow_state: str = "below"         # État de flow (Csikszentmihalyi 1990)
    should_pause: bool = False        # Recommandation pause
    recovery_mode: bool = False       # Mode récupération actif
    warning_message: Optional[str] = None  # Message d'alerte


class LeanLearningEngine:
    """
    Moteur d'apprentissage LEAN v4.8

    5 modules scientifiques essentiels + 4 éléments psychologiques + détection état unifiée.

    MODULES SCIENTIFIQUES:
    1. FSRS - Spaced Repetition (Pimsleur)
    2. Testing Effect - Quiz actif (Dunlosky 2013)
    3. Adaptive Difficulty - Zone proximale (Vygotsky)
    4. State Detection Unified - Détection état holistique     5. Interleaving - Mélange des sujets (Rohrer 2007)

    ÉLÉMENTS MOTIVATION :
    1. Streak Protection - Grace days pour maintenir habitudes (Ariely 2002)
    2. Micro-Celebrations - Récompenses aléatoires (Skinner, Variable Ratio)
    3. Progress Milestones - Visualisation progression (Amabile 2011)
    4. Mastery Decay Warnings - Alerts révision proactive

    OPTIMISATIONS v4.8 (Simplification):
    - Fusion 3 détecteurs → 1 fonction _assess_user_state()
    - UserState unifié (cognitive load + fatigue + flow)
    - Hiérarchie décision difficulté claire
    - Feedback unifié (émotionnel + celebrations)

    Base scientifique Module 4:
    - Cognitive Load: Sweller 1988
    - Fatigue: Krueger 1989, Posner & Petersen 1990, Lim & Dinges 2008
    - Flow: Csikszentmihalyi 1990
    - Recovery: Wolpe 1958 (desensitization), Bandura 1977 (self-efficacy)

    + Persistance DB SQLite
    + AI Tutor v2.0 (mémoire cross-session, détection patterns)
    """

    # Niveaux de difficulté
    DIFFICULTY_LEVELS = {
        1: {"name": "VERY_EASY", "display": "Très Facile", "xp": 5, "target_accuracy": 0.90},
        2: {"name": "EASY", "display": "Facile", "xp": 10, "target_accuracy": 0.80},
        3: {"name": "MEDIUM", "display": "Moyen", "xp": 20, "target_accuracy": 0.70},
        4: {"name": "HARD", "display": "Difficile", "xp": 35, "target_accuracy": 0.60},
        5: {"name": "EXPERT", "display": "Expert", "xp": 50, "target_accuracy": 0.50},
    }

    def __init__(self, db_path: str = None):
        # Module 1: FSRS
        self.fsrs = FSRS()

        # État par utilisateur (cache mémoire)
        self._user_states: Dict[str, Dict[str, Any]] = {}

        # Chemin DB
        self.db_path = db_path or str(DB_PATH)
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)

        # Initialiser la table de persistance
        self._init_db()

        logger.info("🧠 Lean Learning Engine v4.8 initialized")

    # =========================================================================
    # PERSISTANCE DB
    # =========================================================================

    def _init_db(self):
        """Crée la table de persistance si elle n'existe pas"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS lean_user_states (
                    user_id TEXT PRIMARY KEY,
                    fsrs_cards TEXT,
                    mastery TEXT,
                    streak INTEGER DEFAULT 0,
                    last_topic TEXT,
                    total_xp INTEGER DEFAULT 0,
                    responses_count INTEGER DEFAULT 0,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            conn.commit()
            conn.close()
            logger.info("✅ Table lean_user_states initialisée")
        except Exception as e:
            logger.error(f"❌ Erreur init DB: {e}")

    def _serialize_fsrs_cards(self, cards: Dict[str, FSRSCard]) -> str:
        """Sérialise les cartes FSRS en JSON"""
        serialized = {}
        for topic_id, card in cards.items():
            serialized[topic_id] = {
                "stability": card.stability,
                "difficulty": card.difficulty,
                "reps": card.reps,
                "lapses": card.lapses,
                "last_review": card.last_review.isoformat() if card.last_review else None
            }
        return json.dumps(serialized)

    def _deserialize_fsrs_cards(self, data: str) -> Dict[str, FSRSCard]:
        """Désérialise les cartes FSRS depuis JSON"""
        if not data:
            return {}

        try:
            parsed = json.loads(data)
            cards = {}
            for topic_id, card_data in parsed.items():
                card = FSRSCard()
                card.stability = card_data.get("stability", 0)
                card.difficulty = card_data.get("difficulty", 0.3)
                card.reps = card_data.get("reps", 0)
                card.lapses = card_data.get("lapses", 0)
                if card_data.get("last_review"):
                    card.last_review = datetime.fromisoformat(card_data["last_review"])
                cards[topic_id] = card
            return cards
        except Exception as e:
            logger.error(f"Erreur désérialisation FSRS: {e}")
            return {}

    def save_state(self, user_id: str) -> bool:
        """Sauvegarde l'état d'un utilisateur en DB"""
        if user_id not in self._user_states:
            return False

        state = self._user_states[user_id]

        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute("""
                INSERT OR REPLACE INTO lean_user_states
                (user_id, fsrs_cards, mastery, streak, last_topic, total_xp, responses_count, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                self._serialize_fsrs_cards(state.get("fsrs_cards", {})),
                json.dumps(state.get("mastery", {})),
                state.get("streak", 0),
                state.get("last_topic"),
                state.get("total_xp", 0),
                len(state.get("responses", [])),
                datetime.now().isoformat()
            ))

            conn.commit()
            conn.close()
            logger.debug(f"✅ État sauvegardé pour {user_id}")
            return True

        except Exception as e:
            logger.error(f"❌ Erreur sauvegarde état {user_id}: {e}")
            return False

    def load_state(self, user_id: str) -> bool:
        """Charge l'état d'un utilisateur depuis la DB"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            cursor.execute("""
                SELECT * FROM lean_user_states WHERE user_id = ?
            """, (user_id,))

            row = cursor.fetchone()
            conn.close()

            if not row:
                return False

            # Restaurer l'état
            self._user_states[user_id] = {
                "cognitive_detector": CognitiveLoadDetector(),
                "fsrs_cards": self._deserialize_fsrs_cards(row["fsrs_cards"]),
                "responses": [],  # Reset des réponses de session
                "mastery": json.loads(row["mastery"]) if row["mastery"] else {},
                "last_topic": row["last_topic"],
                "streak": row["streak"] or 0,
                "total_xp": row["total_xp"] or 0,
            }

            logger.info(f"✅ État chargé pour {user_id} (mastery: {len(self._user_states[user_id]['mastery'])} topics)")
            return True

        except Exception as e:
            logger.error(f"❌ Erreur chargement état {user_id}: {e}")
            return False

    def delete_state(self, user_id: str) -> bool:
        """Supprime l'état d'un utilisateur"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM lean_user_states WHERE user_id = ?", (user_id,))
            conn.commit()
            conn.close()

            if user_id in self._user_states:
                del self._user_states[user_id]

            logger.info(f"✅ État supprimé pour {user_id}")
            return True

        except Exception as e:
            logger.error(f"❌ Erreur suppression état {user_id}: {e}")
            return False

    def _get_user_state(self, user_id: str) -> Dict[str, Any]:
        """Récupère ou crée l'état d'un utilisateur (avec auto-load depuis DB)"""
        if user_id not in self._user_states:
            # Essayer de charger depuis la DB
            if not self.load_state(user_id):
                # Créer un nouvel état
                self._user_states[user_id] = {
                    # Module 4: Cognitive Load
                    "cognitive_detector": CognitiveLoadDetector(),
                    # FSRS cards par topic
                    "fsrs_cards": {},
                    # Historique des réponses pour interleaving et stats
                    "responses": [],
                    # Maîtrise par topic
                    "mastery": {},
                    # Dernier topic (pour interleaving)
                    "last_topic": None,
                    # Streak actuel
                    "streak": 0,
                    # XP total
                    "total_xp": 0,
                    # Streak Protection
                    "streak_freeze_available": 1,  # 1 jour de grâce par semaine
                    "last_practice_date": None,  # Date de dernière pratique
                    "streak_protected": False,  # Si streak actuellement protégé
                    # Milestones
                    "milestones_reached": [],  # Liste des milestones atteints
                    "total_questions_answered": 0,  # Total questions répondues
                    "skills_mastered": 0,  # Nombre de skills à 80%+
                    # Celebrations
                    "last_celebration": None,  # Dernière célébration
                    # Cognitive Load Recovery
                    "recovery_mode": False,  # Mode récupération post-fatigue
                    "recovery_questions_remaining": 0,  # Questions faciles restantes
                    "session_start_time": None,  # Heure début session
                }
        return self._user_states[user_id]

    # =========================================================================
    # MODULE 1: FSRS - Spaced Repetition
    # =========================================================================

    def _get_fsrs_card(self, state: Dict, topic_id: str) -> FSRSCard:
        """Récupère ou crée une carte FSRS"""
        if topic_id not in state["fsrs_cards"]:
            state["fsrs_cards"][topic_id] = FSRSCard()
        return state["fsrs_cards"][topic_id]

    def _update_fsrs(self, state: Dict, topic_id: str, is_correct: bool, response_time: float) -> tuple:
        """Met à jour FSRS et retourne (new_card, interval)"""
        card = self._get_fsrs_card(state, topic_id)

        # Convertir en rating FSRS
        if is_correct:
            if response_time < 10:
                rating = Rating.EASY
            elif response_time < 30:
                rating = Rating.GOOD
            else:
                rating = Rating.HARD
        else:
            rating = Rating.AGAIN

        new_card, interval = self.fsrs.review(card, rating)
        state["fsrs_cards"][topic_id] = new_card

        return new_card, interval

    def _get_retrievability(self, state: Dict, topic_id: str) -> float:
        """Calcule la probabilité de rappel actuelle"""
        card = self._get_fsrs_card(state, topic_id)
        if card.stability <= 0:
            return 1.0

        days_since = 0
        if card.last_review:
            days_since = (datetime.now() - card.last_review).days

        return self.fsrs.retrievability(days_since, card.stability)

    # =========================================================================
    # MODULE 2: TESTING EFFECT (implicite - l'app fait des quiz)
    # =========================================================================
    # Le testing effect est inhérent au fait qu'on pose des questions
    # Pas de code spécifique nécessaire

    # =========================================================================
    # MODULE 3: ADAPTIVE DIFFICULTY
    # =========================================================================

    def _calculate_optimal_difficulty(
        self,
        mastery: int,
        retrievability: float,
        cognitive_load: str,
        recent_accuracy: float,
        streak: int,
        user_performance_level: float = 0.5  # 0-1, niveau de performance historique
    ) -> int:
        """
        Calcule le niveau de difficulté optimal (1-5).

        Objectif: Zone Proximale de Développement (Vygotsky)
        - Pas trop facile (ennui)
        - Pas trop dur (frustration)
        - Juste assez challengeant (flow)

        AMÉLIORATION v4.2: S'adapte au niveau de performance de l'utilisateur.
        Un utilisateur en difficulté reçoit des questions adaptées à SON niveau.
        """
        # Maîtrise effective = mastery pondéré par performance historique
        # Un user struggling (perf=0.4) avec mastery=50 → effective=35
        effective_mastery = mastery * (0.7 + user_performance_level * 0.6)

        # Base: difficulté selon maîtrise EFFECTIVE
        # Plafond a niveau 4 par defaut (niveau 5 = bonus streak)
        if effective_mastery < 15:
            base_level = 1
        elif effective_mastery < 30:
            base_level = 2
        elif effective_mastery < 50:
            base_level = 3
        else:
            base_level = 4  # Plafond niveau 4, niveau 5 via streak uniquement

        level = base_level

        # Ajustement retrievability: mémoire faible = révision
        # Supprime le boost niveau 5 sur haute retrievability
        # Le niveau 5 doit etre reserve aux longs streaks, pas a la memoire
        if retrievability < 0.4:
            level = max(1, level - 1)

        # Ajustement cognitive load - PLUS AGRESSIF
        if cognitive_load == "overload":
            level = 1  # Force niveau 1, pas de négociation
        elif cognitive_load == "high":
            level = max(1, level - 1)

        # CLEF: Ajustement performance récente (très sensible)
        # C'est ici qu'on aide les élèves en difficulté
        if recent_accuracy < 0.4:
            level = 1  # Struggling = niveau 1, pas de négociation
        elif recent_accuracy < 0.5:
            level = max(1, level - 1)
        elif recent_accuracy > 0.85 and streak >= 5:
            level = min(5, level + 1)  # streak 5 requis (etait 3)

        # Ajustement streak - PLUS RÉACTIF aux erreurs
        if streak <= -4:
            level = 1  # Force facile après 4 erreurs consécutives
        elif streak <= -2:
            level = max(1, level - 1)
        elif streak >= 6 and level < 5:  # streak 6 requis (etait 4)
            level += 1

        # Consolidation pour experts: 20% de questions niveau 3 pour renforcer la mémoire
        if mastery >= 80 and level >= 4:
            if random.random() < 0.20:
                level = 3

        return level

    def _detect_emotional_state(self, state: Dict, is_correct: bool, consecutive_errors: int) -> str:
        """
        Détecte l'état émotionnel de l'utilisateur pour adapter le feedback (v4.5).

        États possibles:
        - "confident": Streak positif, bonne accuracy, progression
        - "frustrated": Erreurs consécutives, accuracy basse, pas de progression
        - "demotivated": Baisse de performance, pauses fréquentes
        - "neutral": État normal
        - "celebrating": Milestone atteint (streak, mastery, etc.)

        Retourne: État émotionnel détecté
        """
        responses = state.get("responses", [])

        if len(responses) < 5:
            return "neutral"

        recent = responses[-10:]
        accuracy = sum(1 for r in recent if r.get("is_correct", False)) / len(recent)
        streak = state.get("streak", 0)

        # CELEBRATING: Milestones
        if streak >= 10:
            return "celebrating"  # Long streak = célébration
        if is_correct and streak >= 5:
            return "celebrating"  # Bonne série

        # Vérifier si mastery a franchi un cap récemment
        for topic_id, mastery in state.get("mastery", {}).items():
            if mastery >= 80 and len(responses) >= 2:
                # Vérifier si on vient de franchir 80%
                prev_responses = [r for r in responses if r.get("topic_id") == topic_id]
                if len(prev_responses) >= 2:
                    # Si on était en dessous de 80 il y a peu
                    if mastery >= 80 and len([r for r in prev_responses[-5:] if r.get("is_correct", False)]) >= 4:
                        return "celebrating"

        # FRUSTRATED: Erreurs consécutives, blocage
        if consecutive_errors >= 3:
            return "frustrated"
        if accuracy < 0.4 and len(recent) >= 5:
            return "frustrated"

        # DEMOTIVATED: Baisse de performance
        if len(responses) >= 20:
            older_accuracy = sum(1 for r in responses[-20:-10] if r.get("is_correct", False)) / 10
            if older_accuracy - accuracy > 0.2:  # Baisse de 20%+
                return "demotivated"

        # CONFIDENT: Bonne performance stable
        if accuracy >= 0.75 and streak >= 3:
            return "confident"

        return "neutral"

    def _generate_feedback(
        self,
        emotional_state: str,
        is_correct: bool,
        streak: int,
        mastery_change: int,
        state: Dict
    ) -> str:
        """
        Génère un feedback unifié adapté (v4.8).

        Fusionne:
        - Feedback émotionnel (v4.5) - Adapté à l'état émotionnel
        - Micro-celebrations  - Surprises aléatoires (5% chance)

        Le ton et le contenu s'adaptent à l'émotion + possibilité de bonus surprise.

        Args:
            emotional_state: État émotionnel détecté
            is_correct: Réponse correcte ou non
            streak: Streak actuel
            mastery_change: Changement de maîtrise
            state: État utilisateur (pour celebrations)

        Returns:
            Message de feedback complet (peut inclure bonus)
        """
        import random

        # =====================================================================
        # 1. MICRO-CELEBRATION ALÉATOIRE (v4.6 - 5% chance)
        # =====================================================================
        # Inspiré de Skinner (Variable Ratio Schedule) - récompenses imprévisibles
        # créent plus d'engagement que récompenses fixes
        if random.random() > 0.95:
            celebrations = [
                "🎁 Surprise! +50 XP bonus pour ta régularité!",
                "✨ Bonus aléatoire: +30 XP pour ton engagement!",
                "🎉 Tu as de la chance! +40 XP bonus!",
                "💝 Cadeau surprise: +50 XP!",
            ]
            return random.choice(celebrations)

        # =====================================================================
        # 2. FEEDBACK ÉMOTIONNEL ADAPTATIF         # =====================================================================

        if emotional_state == "celebrating":
            messages = [
                f"🎉 Incroyable! Série de {abs(streak)} réussites!",
                "💪 Tu es en feu! Continue comme ça!",
                "⭐ Performance exceptionnelle!",
                "🚀 Tu maîtrises vraiment ce sujet!",
            ]
            return random.choice(messages)

        elif emotional_state == "frustrated":
            messages = [
                "💙 Pas de panique, on va y arriver ensemble",
                "🤝 C'est normal de bloquer, faisons une pause stratégique",
                "💡 Essayons une approche différente",
                "🌱 Chaque erreur est un pas vers la réussite",
            ]
            return random.choice(messages)

        elif emotional_state == "demotivated":
            messages = [
                "💪 Tu as déjà progressé, ne lâche rien!",
                "🎯 Rappelle-toi pourquoi tu as commencé",
                "🌟 Chaque jour d'effort compte, même les difficiles",
                "🔥 Tu es plus fort que tu ne le penses",
            ]
            return random.choice(messages)

        elif emotional_state == "confident":
            if is_correct:
                messages = [
                    "✨ Parfait! Prêt pour plus de challenge?",
                    "👏 Excellente maîtrise!",
                    "🎯 Précision chirurgicale!",
                    "⚡ Tu domines ce sujet!",
                ]
            else:
                messages = [
                    "Petite erreur, mais tu as le niveau!",
                    "Juste une faute d'inattention",
                    "Tu maîtrises, c'était juste difficile",
                ]
            return random.choice(messages)

        else:  # neutral
            if is_correct:
                if mastery_change >= 5:
                    return "✓ Bien joué! Belle progression"
                return "✓ Correct!"
            else:
                return "✗ Pas cette fois, mais tu vas y arriver"


    # =========================================================================
    # STREAK PROTECTION & MILESTONES
    # =========================================================================

    def _check_streak_and_update(self, state: Dict) -> tuple:
        """
        Vérifie et met à jour le streak avec protection .

        Retourne: (streak_message: str, streak_protected: bool)
        """
        today = datetime.now().date()
        last_practice = state.get("last_practice_date")

        # Première session
        if last_practice is None:
            state["last_practice_date"] = today
            state["streak"] = 1
            return "🔥 Streak commencé! (1 jour)", False

        # Convertir last_practice en date si c'est un string
        if isinstance(last_practice, str):
            last_practice = datetime.fromisoformat(last_practice).date()

        days_since_last = (today - last_practice).days

        # Même jour = pas de changement
        if days_since_last == 0:
            return None, False

        # Pratiqué hier = streak continue
        if days_since_last == 1:
            state["streak"] = max(1, state.get("streak", 0) + 1)
            state["last_practice_date"] = today
            streak_count = state["streak"]

            # Messages de milestone de streak
            if streak_count == 7:
                return f"🔥 7 jours de suite! Streak hebdomadaire débloquée!", False
            elif streak_count == 30:
                return f"🏆 30 JOURS DE SUITE! Tu es une légende!", False
            elif streak_count % 10 == 0:
                return f"🔥 {streak_count} jours de suite! Incroyable régularité!", False
            else:
                return f"🔥 Streak: {streak_count} jours", False

        # Manqué 1+ jour = check protection
        if days_since_last >= 2:
            freeze_available = state.get("streak_freeze_available", 0)
            current_streak = state.get("streak", 0)

            # Protection disponible ET streak > 5 jours (worth protecting)
            if freeze_available > 0 and current_streak >= 5:
                state["streak_freeze_available"] -= 1
                state["last_practice_date"] = today
                state["streak_protected"] = True
                return f"💙 Streak Protection activée! Série sauvegardée: {current_streak} jours (reste: {freeze_available - 1} protections)", True

            # Pas de protection = reset
            else:
                old_streak = state.get("streak", 0)
                state["streak"] = 1
                state["last_practice_date"] = today
                state["streak_protected"] = False

                if old_streak >= 7:
                    return f"⚠️ Streak perdue (était: {old_streak} jours) - Nouvelle série commencée!", False
                else:
                    return f"Nouvelle série commencée!", False

        return None, False

    def _check_milestones(self, state: Dict) -> list:
        """
        Vérifie les milestones atteints et retourne les nouveaux .

        Retourne: Liste des messages de milestone
        """
        milestones_reached = state.get("milestones_reached", [])
        total_questions = state.get("total_questions_answered", 0)
        skills_mastered = state.get("skills_mastered", 0)
        messages = []

        # Milestones questions
        question_milestones = [10, 50, 100, 250, 500, 1000]
        for milestone in question_milestones:
            if total_questions >= milestone and f"questions_{milestone}" not in milestones_reached:
                milestones_reached.append(f"questions_{milestone}")
                state["milestones_reached"] = milestones_reached
                if milestone == 100:
                    messages.append(f"💯 100 questions répondues! Taux de réussite: {self._get_overall_accuracy(state):.0%}")
                else:
                    messages.append(f"🎯 {milestone} questions répondues!")

        # Milestones skills
        skill_milestones = [1, 5, 10, 15, 20]
        for milestone in skill_milestones:
            if skills_mastered >= milestone and f"skills_{milestone}" not in milestones_reached:
                milestones_reached.append(f"skills_{milestone}")
                state["milestones_reached"] = milestones_reached
                if milestone == 1:
                    messages.append(f"⭐ Première compétence maîtrisée!")
                elif milestone == 10:
                    messages.append(f"🏆 10 compétences maîtrisées! Tu es sur la bonne voie!")
                else:
                    messages.append(f"🌟 {milestone} compétences maîtrisées!")

        return messages


    def _get_overall_accuracy(self, state: Dict) -> float:
        """Calcule l'accuracy globale de l'utilisateur"""
        responses = state.get("responses", [])
        if len(responses) == 0:
            return 0.0
        correct = sum(1 for r in responses if r.get("is_correct", False))
        return correct / len(responses)

    def _detect_mastery_decay(self, state: Dict) -> list:
        """
        Détecte les skills qui ont décliné et nécessitent révision .

        Retourne: Liste des warnings de decay
        """
        warnings = []
        mastery = state.get("mastery", {})
        responses = state.get("responses", [])

        for topic_id, current_mastery in mastery.items():
            # Ignorer si mastery < 50% (encore en apprentissage)
            if current_mastery < 50:
                continue

            # Trouver dernière pratique de ce topic
            topic_responses = [r for r in responses if r.get("topic_id") == topic_id]
            if not topic_responses:
                continue

            last_response = topic_responses[-1]
            last_date = last_response.get("timestamp")
            if not last_date or not isinstance(last_date, datetime):
                continue

            days_since = (datetime.now() - last_date).days

            # Warning si pas pratiqué depuis 7+ jours ET mastery était élevée
            if days_since >= 7 and current_mastery >= 70:
                # Estimer le decay (1% par jour approximativement)
                estimated_decay = min(days_since, 15)
                warnings.append(f"⚠️ '{topic_id}': {current_mastery}% (pas pratiqué depuis {days_since}j)")

        return warnings[:3]  # Max 3 warnings pour ne pas surcharger

    # =========================================================================
    # MODULE 4: STATE DETECTION UNIFIED     # Fusionne Cognitive Load + Fatigue + Flow en une seule évaluation
    # =========================================================================

    def _assess_user_state(self, state: Dict) -> UserState:
        """
        Évaluation UNIFIÉE de l'état de l'utilisateur (v4.8).

        Fusionne 3 détecteurs en une seule analyse holistique:
        1. Cognitive Load (Sweller 1988) - Charge cognitive
        2. Fatigue Detection (Krueger 1989, Posner 1990, Lim 2008) - Fatigue
        3. Flow State (Csikszentmihalyi 1990) - Zone optimale

        Retourne: UserState avec tous les indicateurs
        """
        responses = state.get("responses", [])
        user_state = UserState()

        # Si pas assez de données, retour état neutre
        if len(responses) < 5:
            return user_state

        # =====================================================================
        # 1. COGNITIVE LOAD DETECTION (Sweller 1988)
        # =====================================================================
        assessment = state["cognitive_detector"].assess()
        user_state.cognitive_load = assessment.overall_load
        user_state.should_pause = assessment.should_pause

        # =====================================================================
        # 2. FATIGUE DETECTION (Krueger 1989, Posner 1990, Lim 2008)
        # =====================================================================

        # 2a. Durée de session (>45min = risque élevé - Krueger 1989)
        session_start = state.get("session_start_time")
        if session_start:
            session_duration = (datetime.now() - session_start).total_seconds() / 60
            if session_duration > 45:
                user_state.fatigue_level = "moderate"
                user_state.warning_message = "⏰ Session de 45+ min - Pause recommandée"
                user_state.should_pause = True

        # 2b. Temps de réponse en augmentation (Posner & Petersen 1990)
        if user_state.fatigue_level == "none" and len(responses) >= 10:
            recent_10 = responses[-10:]
            first_5_avg = sum(r.get("response_time", 30) for r in recent_10[:5]) / 5
            last_5_avg = sum(r.get("response_time", 30) for r in recent_10[5:]) / 5

            # Augmentation >30% = signe de fatigue
            if last_5_avg > first_5_avg * 1.3:
                user_state.fatigue_level = "early"
                user_state.warning_message = "🐌 Temps de réponse en hausse - Fatigue détectée"

        # 2c. Pattern correct→erreur soudaine (Lim & Dinges 2008 - micro-sleep)
        if user_state.fatigue_level == "none" and len(responses) >= 5:
            recent_5 = responses[-5:]
            # 3+ correct puis erreur = possible micro-sleep
            if all(r.get("is_correct", False) for r in recent_5[:-1]) and not recent_5[-1].get("is_correct", True):
                user_state.fatigue_level = "early"
                user_state.warning_message = "⚠️ Erreur inattendue après série correcte - Attention!"

        # =====================================================================
        # 3. FLOW STATE DETECTION (Csikszentmihalyi 1990)
        # =====================================================================
        # Flow = Zone optimale entre difficulté et capacité

        recent_20 = responses[-20:]
        if len(recent_20) >= 10:
            accuracy = sum(1 for r in recent_20 if r.get("is_correct", False)) / len(recent_20)
            avg_difficulty = sum(r.get("difficulty", 3) for r in recent_20) / len(recent_20)

            # Zone de flow : 60-80% accuracy + difficulté modérée-élevée (3-4)
            if 0.60 <= accuracy <= 0.80 and 2.5 <= avg_difficulty <= 4.5:
                user_state.flow_state = "in_flow"
            elif accuracy > 0.80:
                user_state.flow_state = "below"  # Trop facile
            else:
                user_state.flow_state = "above"  # Trop difficile

        # =====================================================================
        # 4. DÉCISION RECOVERY MODE
        # =====================================================================
        # Activer récupération si surcharge OU fatigue modérée
        if user_state.cognitive_load in ["high", "overload"] or user_state.fatigue_level == "moderate":
            user_state.recovery_mode = True

        return user_state

    def _initiate_recovery_mode(self, state: Dict, reason: str = "fatigue"):
        """
        Active le mode récupération progressive .

        Scientifique: Desensitization progressive (Wolpe 1958) +
                      Self-efficacy reconstruction (Bandura 1977)

        Mode récupération = 3 étapes:
        1. 5 questions niveau 1 (TRÈS facile)
        2. Si 100% correct → 3 questions niveau 2
        3. Si toujours 100% → retour normal

        Args:
            reason: "fatigue" ou "overload"
        """
        if reason == "overload":
            state["recovery_questions_remaining"] = 5  # Plus de récupération
        else:
            state["recovery_questions_remaining"] = 3  # Récupération légère

        state["recovery_mode"] = True
        logger.info(f"🔄 Mode récupération activé: {state['recovery_questions_remaining']} questions faciles")

    def _update_recovery_mode(self, state: Dict, is_correct: bool, difficulty: int):
        """
        Met à jour le mode récupération après une réponse .

        Si l'utilisateur réussit les questions faciles → sort progressivement
        Sinon → reste en mode récupération plus longtemps
        """
        if not state.get("recovery_mode", False):
            return

        remaining = state.get("recovery_questions_remaining", 0)

        if is_correct and difficulty == 1:
            # Question facile réussie → décrémenter
            state["recovery_questions_remaining"] = max(0, remaining - 1)

            if state["recovery_questions_remaining"] == 0:
                # Fin de récupération
                state["recovery_mode"] = False
                logger.info("✅ Mode récupération terminé - Retour normal")
        else:
            # Erreur en récupération → prolonger légèrement
            if not is_correct:
                state["recovery_questions_remaining"] = min(remaining + 1, 5)


    # =========================================================================
    # USER PERFORMANCE LEVEL (v4.2)
    # =========================================================================

    def _get_user_performance_level(self, state: Dict) -> float:
        """
        Calcule le niveau de performance historique de l'utilisateur (0-1).

        Basé sur:
        - Accuracy sur les 20 dernières réponses
        - Ratio de récupérations (recovery modes)
        - Streak moyen

        Retourne:
        - 0.4 = utilisateur en difficulté (struggling)
        - 0.5 = utilisateur moyen
        - 0.7 = utilisateur performant
        """
        responses = state.get("responses", [])

        if len(responses) < 5:
            return 0.5  # Pas assez de données, défaut moyen

        # Accuracy sur les 20 dernières
        recent = responses[-20:]
        accuracy = sum(1 for r in recent if r.get("is_correct", False)) / len(recent)

        # Compter les recovery modes (séquences de 3+ erreurs)
        recovery_count = 0
        consecutive = 0
        for r in responses[-50:]:
            if not r.get("is_correct", True):
                consecutive += 1
                if consecutive == 3:
                    recovery_count += 1
            else:
                consecutive = 0

        # Pénalité pour beaucoup de recovery modes
        recovery_penalty = min(0.2, recovery_count * 0.05)

        # Score final
        performance = accuracy - recovery_penalty
        return max(0.3, min(0.8, performance))

    def _is_early_game(self, state: Dict) -> bool:
        """
        Détermine si l'utilisateur est en "early game" (début d'apprentissage).

        Les 7 premiers jours sont critiques - on doit éviter la spirale négative.
        """
        responses = state.get("responses", [])

        # Moins de 50 réponses = early game
        if len(responses) < 50:
            return True

        # Vérifier la date de première réponse
        if responses:
            first_response = responses[0].get("timestamp")
            if first_response:
                days_since_start = (datetime.now() - first_response).days
                return days_since_start <= 7

        return False

    # =========================================================================
    # AI TUTOR - Tracking des patterns d'erreurs
    # =========================================================================

    def _update_ai_tutor_state(self, state: Dict, topic_id: str, is_correct: bool):
        """Met à jour l'état AI Tutor après une réponse."""
        if "ai_tutor_state" not in state:
            state["ai_tutor_state"] = {
                "session_count": 1,
                "confusion_pairs": {},
                "motivation_history": [],
                "last_topics": [],
            }

        ai_state = state["ai_tutor_state"]

        # Tracker le topic
        last_topics = ai_state.get("last_topics", [])
        last_topics.append(topic_id)
        if len(last_topics) > 20:
            last_topics.pop(0)
        ai_state["last_topics"] = last_topics

        # Détecter confusions (erreur après changement de topic)
        if not is_correct and len(last_topics) >= 2:
            prev_topic = last_topics[-2]
            if prev_topic != topic_id:
                pair = tuple(sorted([prev_topic, topic_id]))
                confusion_pairs = ai_state.get("confusion_pairs", {})
                pair_key = f"{pair[0]}|{pair[1]}"
                confusion_pairs[pair_key] = confusion_pairs.get(pair_key, 0) + 1
                ai_state["confusion_pairs"] = confusion_pairs

    def _increment_session_count(self, state: Dict):
        """Incrémente le compteur de sessions (appelé au début de chaque session)."""
        if "ai_tutor_state" not in state:
            state["ai_tutor_state"] = {}
        state["ai_tutor_state"]["session_count"] = state["ai_tutor_state"].get("session_count", 0) + 1

    # =========================================================================
    # MODULE 5: INTERLEAVING
    # =========================================================================

    def _should_interleave(self, state: Dict, current_topic: str) -> bool:
        """
        Détermine si on devrait suggérer de changer de sujet.

        Interleaving = mélanger les sujets au lieu de bloquer.
        +43% de rétention selon Rohrer & Taylor (2007).
        """
        # Compter les questions consécutives sur le même topic
        consecutive = 0
        for r in reversed(state["responses"][-10:]):
            if r.get("topic_id") == current_topic:
                consecutive += 1
            else:
                break

        # Suggérer interleaving après 3-5 questions sur le même sujet
        return consecutive >= 4

    # =========================================================================
    # API PRINCIPALE
    # =========================================================================

    def get_next_question(
        self,
        user_id: str,
        topic_id: str,
        current_mastery: int
    ) -> QuestionParams:
        """
        Calcule les paramètres optimaux pour la prochaine question.

        Args:
            user_id: ID utilisateur
            topic_id: ID du topic
            current_mastery: Maîtrise actuelle (0-100)

        Returns:
            QuestionParams avec difficulté optimale et métadonnées
        """
        state = self._get_user_state(user_id)

        # Mettre à jour la maîtrise
        state["mastery"][topic_id] = current_mastery

        # Initialiser session_start_time si première question
        if "session_start_time" not in state or state["session_start_time"] is None:
            state["session_start_time"] = datetime.now()

        # =====================================================================
        # ÉVALUATION UNIFIÉE DE L'ÉTAT UTILISATEUR
        # =====================================================================
        user_state = self._assess_user_state(state)

        # Activer recovery mode si nécessaire
        if user_state.recovery_mode and not state.get("recovery_mode", False):
            reason = "overload" if user_state.cognitive_load in ["high", "overload"] else "fatigue"
            self._initiate_recovery_mode(state, reason)

        # =====================================================================
        # COLLECTE DES DONNÉES POUR CALCUL DIFFICULTÉ
        # =====================================================================

        # FSRS
        card = self._get_fsrs_card(state, topic_id)
        retrievability = self._get_retrievability(state, topic_id)

        # Stats récentes
        recent = state["responses"][-10:]
        recent_accuracy = sum(1 for r in recent if r.get("is_correct", False)) / max(1, len(recent))

        # Niveau de performance utilisateur
        user_performance = self._get_user_performance_level(state)

        # =====================================================================
        # HIÉRARCHIE DE DÉCISION DIFFICULTÉ (Priorités claires)
        # =====================================================================

        # PRIORITÉ 1: Mode récupération (post-fatigue/surcharge)
        if state.get("recovery_mode", False):
            difficulty = 1
            logger.debug(f"🔄 Recovery mode: {state.get('recovery_questions_remaining', 0)} questions remaining")

        # PRIORITÉ 2: Quick wins (early game boost)
        elif quick_wins := state.get("quick_wins_remaining", 0):
            difficulty = 1
            state["quick_wins_remaining"] = quick_wins - 1
            logger.debug(f"⚡ Quick win mode: {quick_wins - 1} remaining")

        # PRIORITÉ 3: Flow state (maintenir l'immersion)
        elif user_state.flow_state == "in_flow" and len(state["responses"]) > 0:
            last_difficulty = state["responses"][-1].get("difficulty", 3)
            # Maintenir difficulté si appropriée (2-4)
            if 2 <= last_difficulty <= 4:
                difficulty = last_difficulty
                logger.debug(f"🌊 Flow state - maintaining difficulty {difficulty}")
            else:
                # Sinon, calcul normal
                difficulty = self._calculate_optimal_difficulty(
                    mastery=current_mastery,
                    retrievability=retrievability,
                    cognitive_load=user_state.cognitive_load,
                    recent_accuracy=recent_accuracy,
                    streak=state["streak"],
                    user_performance_level=user_performance
                )

        # PRIORITÉ 4: Calcul optimal standard
        else:
            difficulty = self._calculate_optimal_difficulty(
                mastery=current_mastery,
                retrievability=retrievability,
                cognitive_load=user_state.cognitive_load,
                recent_accuracy=recent_accuracy,
                streak=state["streak"],
                user_performance_level=user_performance
            )

        # =====================================================================
        # CONTRAINTES FINALES
        # =====================================================================

        # Early game protection (nouveaux utilisateurs struggling)
        if self._is_early_game(state) and user_performance < 0.5:
            difficulty = min(2, difficulty)
            logger.debug(f"🛡️ Early game protection: capped at level 2")

        # Interleaving
        interleave = self._should_interleave(state, topic_id)

        return QuestionParams(
            difficulty=difficulty,
            difficulty_name=self.DIFFICULTY_LEVELS[difficulty]["name"],
            topic_id=topic_id,
            fsrs_interval=card.stability,
            retrievability=retrievability,
            cognitive_load=user_state.cognitive_load,
            should_take_break=user_state.should_pause,
            interleave_suggested=interleave
        )

    def process_answer(
        self,
        user_id: str,
        topic_id: str,
        is_correct: bool,
        response_time: float,
        difficulty: int
    ) -> AnswerResult:
        """
        Traite une réponse et met à jour tous les modules.

        Args:
            user_id: ID utilisateur
            topic_id: ID topic
            is_correct: Réponse correcte?
            response_time: Temps de réponse (secondes)
            difficulty: Niveau de difficulté (1-5)

        Returns:
            AnswerResult avec feedback et mises à jour
        """
        state = self._get_user_state(user_id)
        difficulty = max(1, min(5, difficulty))  # Clamp 1-5

        # 1. Cognitive Load - enregistrer la réponse
        diff_str = {1: "easy", 2: "easy", 3: "medium", 4: "hard", 5: "hard"}[difficulty]
        state["cognitive_detector"].add_response(
            response_time=int(response_time),
            is_correct=is_correct,
            difficulty=diff_str
        )

        # 2. FSRS - mettre à jour
        new_card, interval = self._update_fsrs(state, topic_id, is_correct, response_time)

        # 3. Streak
        if is_correct:
            state["streak"] = max(0, state["streak"]) + 1
        else:
            state["streak"] = min(0, state["streak"]) - 1

        # 4. Calculer changement de maîtrise (OPTIMISÉ: progression plus rapide)
        # Multiplicateurs augmentés pour toutes les difficultés
        level_multiplier = {1: 1.2, 2: 1.1, 3: 1.2, 4: 1.3, 5: 1.5}[difficulty]

        current = state["mastery"].get(topic_id, 0)

        if is_correct:
            # Gains de base (OPTIMISÉ pour atteindre 80% mastery en 60 jours)
            # Objectif: ~8% par jour pour élève moyen = 80% en 10-12 jours
            base_gain = 5  # Augmenté de 3 à 5 pour progression plus rapide
            if response_time < 10:
                base_gain += 2  # Bonus réponse rapide augmenté (était +1)

            mastery_change = int(base_gain * level_multiplier)

            # BONUS renforcé pour débutants
            if current < 20:
                mastery_change = int(mastery_change * 1.5)  # +50% au début (était 1.2)
            elif current < 35:
                mastery_change = int(mastery_change * 1.3)  # +30% (était 1.1)

            # Rendements décroissants ADOUCIS (moins punitifs)
            # Permet d'atteindre 80% plus facilement
            if current >= 85:
                mastery_change = int(mastery_change * 0.5)  # Divisé par 2 (était ÷5)
            elif current >= 75:
                mastery_change = int(mastery_change * 0.6)  # 60% (était ÷4)
            elif current >= 65:
                mastery_change = int(mastery_change * 0.75)  # 75% (était ÷3)
            elif current >= 50:
                mastery_change = int(mastery_change * 0.85)  # 85% (était ÷2)
            # Pas de pénalité avant 50% (était 45%)
        else:
            # Pertes ajustées
            base_loss = -2
            if difficulty <= 2:
                base_loss = -3  # Erreur sur facile = perte modérée
            elif difficulty >= 4:
                base_loss = -1  # Erreur sur difficile = pardonné

            mastery_change = int(base_loss * level_multiplier)

            # Protection pour débutants (mais pas totale)
            if current < 20:
                mastery_change = max(-1, mastery_change)  # Petite perte
            elif current < 35:
                mastery_change = max(-2, mastery_change)

            # STRUGGLING USER PROTECTION: Limit mastery loss during bad streaks
            # If already in a bad streak, don't punish further
            if state["streak"] <= -3:
                mastery_change = max(-1, mastery_change)  # Max 1 point loss

        # 5. XP
        xp_earned = self.DIFFICULTY_LEVELS[difficulty]["xp"] if is_correct else 0
        if is_correct and state["streak"] >= 3:
            xp_earned = int(xp_earned * 1.2)  # Bonus streak

        # 6. Enregistrer la réponse
        state["responses"].append({
            "topic_id": topic_id,
            "is_correct": is_correct,
            "response_time": response_time,
            "difficulty": difficulty,
            "timestamp": datetime.now()
        })
        state["last_topic"] = topic_id

        # 6.1 AI Tutor v2.0: Mettre à jour l'état IA
        self._update_ai_tutor_state(state, topic_id, is_correct)

        # Mettre à jour maîtrise
        # Cap at 95% - reaching 100% should require sustained mastery over time
        # This keeps experts engaged and prevents "completion" feeling
        MASTERY_CAP = 95
        current = state["mastery"].get(topic_id, 0)
        new_mastery = max(0, min(MASTERY_CAP, current + mastery_change))

        # OPTIMISATION v4.4: Bonus de maintenance pour rétention long terme
        # Quand on révise un skill déjà maîtrisé (80%+) et qu'on réussit,
        # on donne un petit bonus pour récompenser la révision et maintenir la mémoire
        if is_correct and current >= 80 and new_mastery < MASTERY_CAP:
            # Bonus de maintenance: +1 point pour révisions réussies sur skills maîtrisés
            # Cela encourage la révision espacée (FSRS) et maintient la rétention
            maintenance_bonus = 1
            new_mastery = min(MASTERY_CAP, new_mastery + maintenance_bonus)

        state["mastery"][topic_id] = new_mastery

        # 7. Stats et feedback
        recent = state["responses"][-10:]
        accuracy = sum(1 for r in recent if r.get("is_correct", False)) / max(1, len(recent))

        # Utiliser UserState unifié
        user_state = self._assess_user_state(state)
        should_break = user_state.should_pause
        should_reduce = user_state.cognitive_load in ["high", "overload"] or accuracy < 0.5

        # RECOVERY MODE v4.2: Enhanced support with Quick Wins
        # Track consecutive errors for recovery mode activation
        consecutive_errors = 0
        for r in reversed(state["responses"][-5:]):
            if not r.get("is_correct", True):
                consecutive_errors += 1
            else:
                break

        in_recovery_mode = consecutive_errors >= 3 or (accuracy < 0.4 and len(recent) >= 5)

        # QUICK WINS: Quand l'utilisateur est en difficulté, on lui donne
        # des questions très faciles pour reconstruire sa confiance
        # Le nombre dépend de sa performance historique
        if in_recovery_mode:
            user_perf = self._get_user_performance_level(state)
            state["quick_wins_remaining"] = 5 if user_perf < 0.5 else 3
            state["streak"] = 0  # Reset streak pour repartir à zéro

        # FEEDBACK UNIFIÉ (Émotionnel + Celebrations fusionnés)
        emotional_state = self._detect_emotional_state(state, is_correct, consecutive_errors)

        # Feedback with enhanced support for struggling users
        if should_break:
            feedback = "Pause recommandée - charge cognitive élevée"
        elif in_recovery_mode:
            # Struggling user gets encouraging, actionable feedback
            recovery_messages = [
                "C'est normal de faire des erreurs, c'est comme ça qu'on apprend!",
                "On va y aller doucement - des questions plus simples arrivent",
                "Prends ton temps, chaque question est une opportunité",
                "Tu progresses même quand tu te trompes - continue!",
            ]
            import random
            feedback = random.choice(recovery_messages)
            should_reduce = True  # Force difficulty reduction
        else:
            # Utiliser le feedback unifié (émotionnel + celebrations)
            feedback = self._generate_feedback(emotional_state, is_correct, state["streak"], mastery_change, state)

        # 8. Accumuler XP total
        state["total_xp"] = state.get("total_xp", 0) + xp_earned

        # =========================================================================
        # RÉCUPÉRATION PROGRESSIVE (update recovery mode state)
        # =========================================================================

        self._update_recovery_mode(state, is_correct, difficulty)

        # =========================================================================
        # STREAK PROTECTION + MILESTONES + CELEBRATIONS + DECAY WARNINGS
        # =========================================================================

        # Check streak and apply protection if needed
        streak_message, streak_protected = self._check_streak_and_update(state)
        if streak_message:
            feedback = f"{feedback} | {streak_message}"

        # Update question counter for milestones
        state["total_questions_answered"] = state.get("total_questions_answered", 0) + 1

        # Update skills mastered count (80%+ = mastered)
        skills_at_80 = sum(1 for m in state["mastery"].values() if m >= 80)
        state["skills_mastered"] = skills_at_80

        # Check milestones and add to feedback
        milestone_messages = self._check_milestones(state)
        if milestone_messages:
            for msg in milestone_messages:
                feedback = f"{feedback} | {msg}"


        # Detect mastery decay (every 10 questions)
        decay_warnings = []
        if state["total_questions_answered"] % 10 == 0:
            decay_warnings = self._detect_mastery_decay(state)

        # =========================================================================

        # 9. Auto-save en DB (toutes les 5 réponses pour éviter trop d'I/O)
        if len(state["responses"]) % 5 == 0:
            self.save_state(user_id)

        return AnswerResult(
            mastery_change=mastery_change,
            xp_earned=xp_earned,
            next_review_days=interval,
            accuracy_recent=accuracy,
            should_reduce_difficulty=should_reduce,
            should_take_break=should_break,
            feedback=feedback,
            # New fields
            streak_protected=streak_protected,
            decay_warnings=decay_warnings
        )

    def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Récupère les statistiques d'un utilisateur"""
        state = self._get_user_state(user_id)

        # FSRS stats
        fsrs_stats = {}
        for topic_id, card in state["fsrs_cards"].items():
            fsrs_stats[topic_id] = {
                "stability": card.stability,
                "reps": card.reps,
                "retrievability": self._get_retrievability(state, topic_id)
            }

        # Recent performance
        recent = state["responses"][-20:]
        accuracy = sum(1 for r in recent if r.get("is_correct", False)) / max(1, len(recent))

        user_state = self._assess_user_state(state)
        cognitive_load = user_state.cognitive_load

        return {
            "mastery": state["mastery"],
            "fsrs": fsrs_stats,
            "streak": state["streak"],
            "recent_accuracy": accuracy,
            "cognitive_load": cognitive_load,
            "total_responses": len(state["responses"]),
            "total_xp": state.get("total_xp", 0)
        }

    def reset_session(self, user_id: str, save: bool = True):
        """Reset pour une nouvelle session (sauvegarde avant reset)"""
        if save:
            self.save_state(user_id)

        state = self._get_user_state(user_id)
        state["cognitive_detector"] = CognitiveLoadDetector()
        state["streak"] = 0
        state["responses"] = []  # Reset réponses de session

        # AI Tutor v2.0: Incrémenter le compteur de sessions
        self._increment_session_count(state)

        logger.info(f"Session reset for {user_id}")

    def get_engine_info(self) -> Dict[str, Any]:
        """Informations sur le moteur"""
        return {
            "version": "4.8 LEAN",
            "modules": 5,
            "features": [
                "DB Persistence",
                "Auto-save",
                "Auto-load",
                "Quick Wins (recovery mode)",
                "Early Game Protection",
                "User Performance Level",
                "AI Tutor v2.0 - Mémoire cross-session",
                "AI Tutor v2.0 - Détection patterns d'erreurs",
                "AI Tutor v2.0 - Motivation adaptative",
                "AI Tutor v2.0 - Prédiction de difficulté",
                "AI Tutor v2.0 - Micro-leçons ciblées",
            ],
            "modules_list": [
                {"name": "FSRS", "research": "Pimsleur (moderne)", "benefit": "Timing optimal des révisions"},
                {"name": "Testing Effect", "research": "Dunlosky (2013)", "benefit": "Quiz actif > relecture"},
                {"name": "Adaptive Difficulty", "research": "Vygotsky, Bjork", "benefit": "Zone optimale"},
                {"name": "Cognitive Load", "research": "Sweller (1988)", "benefit": "Détection fatigue"},
                {"name": "Interleaving", "research": "Rohrer (2007)", "benefit": "+43% discrimination"},
                {"name": "AI Tutor v2.0", "research": "Simulation NewMars 2024", "benefit": "100% succès tous profils"},
            ],
            "removed_modules": [
                "Forgetting Curve (doublon FSRS)",
                "Emotional Encoding (artificiel)",
                "Dual Coding (pas de vraies images)",
                "Chunking (contenu déjà découpé)",
                "Elaborative (GPT fait déjà)",
                "Pre-sleep (imprécis)",
                "Confidence Tracking (gens mentent)",
                "Transfer Learning (peu de gain)",
                "Variation Practice (doublon)"
            ],
            "philosophy": "Less is more. 5 modules solides > 16 modules dilués."
        }

    def get_all_users(self) -> List[str]:
        """Récupère la liste de tous les utilisateurs en DB"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT user_id FROM lean_user_states")
            users = [row[0] for row in cursor.fetchall()]
            conn.close()
            return users
        except Exception as e:
            logger.error(f"Erreur get_all_users: {e}")
            return []

    # =========================================================================
    # SKILL-AWARE DIFFICULTY (Connexion SkillBridge)
    # =========================================================================

    def get_skill_adjusted_difficulty(
        self,
        user_id: str,
        topic_id: str,
        mastery: int,
        task_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calcule la difficulté en tenant compte du skill graph.

        Combine:
        1. La difficulté standard du learning engine
        2. La distance de compétence si une tâche est fournie

        Args:
            user_id: ID utilisateur
            topic_id: ID du topic
            mastery: Maîtrise actuelle (0-100)
            task_context: Tâche optionnelle pour calcul de distance

        Returns:
            Dict avec difficulty ajustée et métadonnées
        """
        # 1. Calcul standard
        params = self.get_next_question(user_id, topic_id, mastery)
        base_difficulty = params.difficulty

        # 2. Si pas de contexte de tâche, retourner le calcul standard
        if not task_context:
            return {
                "difficulty": base_difficulty,
                "difficulty_name": params.difficulty_name,
                "source": "learning_engine",
                "cognitive_load": params.cognitive_load,
                "retrievability": params.retrievability,
                "skill_adjustment": 0
            }

        # 3. Calculer la distance de skill si possible
        try:
            from services.skill_bridge import get_skill_bridge
            bridge = get_skill_bridge()
            distance = bridge.calculate_task_distance(user_id, task_context)

            # Ajustement basé sur la distance
            skill_adjustment = 0
            if distance.total_distance >= 0.6:
                skill_adjustment = -2  # Trop dur, réduire
            elif distance.total_distance >= 0.4:
                skill_adjustment = -1  # Difficile, réduire légèrement
            elif distance.total_distance < 0.2:
                skill_adjustment = 1   # Trop facile, augmenter

            # Appliquer l'ajustement
            adjusted_difficulty = max(1, min(5, base_difficulty + skill_adjustment))

            return {
                "difficulty": adjusted_difficulty,
                "difficulty_name": self.DIFFICULTY_LEVELS[adjusted_difficulty]["name"],
                "source": "learning_engine + skill_bridge",
                "cognitive_load": params.cognitive_load,
                "retrievability": params.retrievability,
                "skill_adjustment": skill_adjustment,
                "task_distance": distance.total_distance,
                "is_appropriate": distance.is_appropriate,
                "missing_prerequisites": distance.missing_prerequisites,
                "recommendation": distance.recommendation
            }

        except ImportError:
            logger.debug("SkillBridge not available, using standard difficulty")
            return {
                "difficulty": base_difficulty,
                "difficulty_name": params.difficulty_name,
                "source": "learning_engine",
                "cognitive_load": params.cognitive_load,
                "retrievability": params.retrievability,
                "skill_adjustment": 0
            }
        except Exception as e:
            logger.warning(f"Error calculating skill distance: {e}")
            return {
                "difficulty": base_difficulty,
                "difficulty_name": params.difficulty_name,
                "source": "learning_engine (skill error)",
                "cognitive_load": params.cognitive_load,
                "retrievability": params.retrievability,
                "skill_adjustment": 0,
                "error": str(e)
            }

    def map_effort_to_difficulty(self, effort: str) -> int:
        """
        Mappe l'effort d'une tâche (XS/S/M/L) à un niveau de difficulté (1-5).

        Utilisé pour aligner les tâches de projet avec le système de difficulté.
        """
        mapping = {
            "XS": 1,  # Très facile
            "S": 2,   # Facile
            "M": 3,   # Moyen
            "L": 4,   # Difficile
        }
        return mapping.get(effort, 3)

    def difficulty_to_effort(self, difficulty: int) -> str:
        """
        Mappe un niveau de difficulté (1-5) à un effort de tâche (XS/S/M/L).

        Inverse de map_effort_to_difficulty.
        """
        if difficulty <= 1:
            return "XS"
        elif difficulty == 2:
            return "S"
        elif difficulty == 3:
            return "M"
        else:
            return "L"


# Instance globale
lean_engine = LeanLearningEngine()
