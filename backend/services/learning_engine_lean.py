"""
🧠 LEARNING ENGINE v4.1 LEAN
Version épurée avec uniquement les 5 modules ESSENTIELS scientifiquement prouvés.
+ Persistance DB pour sauvegarder l'état entre les sessions.

Modules conservés:
1. FSRS - Spaced Repetition (Pimsleur, état de l'art)
2. Testing Effect - Quiz actif (Dunlosky 2013, technique #1)
3. Adaptive Difficulty - Zone proximale de développement (Vygotsky)
4. Cognitive Load Detection - Détection fatigue (Sweller 1988)
5. Interleaving - Mélange des sujets (Rohrer 2007)

Modules SUPPRIMÉS (redondants ou marginaux):
- Forgetting Curve (doublon FSRS)
- Emotional Encoding (hooks artificiels)
- Dual Coding (pas de vraies images)
- Chunking (contenu déjà découpé)
- Elaborative Interrogation (GPT fait déjà)
- Pre-sleep (timing imprécis)
- Confidence Tracking (gens mentent)
- Transfer Learning (complexe pour peu de gain)
- Variation Practice (doublon interleaving)

Utilisation:
    from services.learning_engine_lean import lean_engine

    # Pour une nouvelle question
    params = lean_engine.get_next_question(user_id, topic_id, mastery)

    # Après une réponse
    result = lean_engine.process_answer(user_id, topic_id, is_correct, response_time, difficulty)

    # Sauvegarder l'état (automatique après chaque réponse, ou manuel)
    lean_engine.save_state(user_id)

    # Charger l'état (automatique au démarrage)
    lean_engine.load_state(user_id)
"""

import logging
import sqlite3
import json
from datetime import datetime
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


class LeanLearningEngine:
    """
    Moteur d'apprentissage LEAN v4.1
    5 modules essentiels + persistance DB.
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

        logger.info("🧠 Lean Learning Engine v4.1 initialized (5 modules + DB persistence)")

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
        streak: int
    ) -> int:
        """
        Calcule le niveau de difficulté optimal (1-5).

        Objectif: Zone Proximale de Développement (Vygotsky)
        - Pas trop facile (ennui)
        - Pas trop dur (frustration)
        - Juste assez challengeant (flow)
        """
        # Base: difficulté selon maîtrise (seuils progressifs)
        if mastery < 20:
            base_level = 1
        elif mastery < 40:
            base_level = 2
        elif mastery < 60:
            base_level = 3
        elif mastery < 80:
            base_level = 4
        else:
            base_level = 5

        level = base_level

        # Ajustement retrievability: mémoire faible = révision
        if retrievability < 0.4:
            level = max(1, level - 1)
        elif retrievability > 0.95 and level < 5:
            level += 1

        # Ajustement cognitive load
        if cognitive_load == "overload":
            level = max(1, level - 2)
        elif cognitive_load == "high":
            level = max(1, level - 1)

        # CLEF: Ajustement performance récente (très sensible)
        # C'est ici qu'on aide les élèves en difficulté
        if recent_accuracy < 0.35:
            level = 1  # Forcer niveau 1 si vraiment en galère
        elif recent_accuracy < 0.5:
            level = max(1, level - 2)
        elif recent_accuracy < 0.6:
            level = max(1, level - 1)
        elif recent_accuracy > 0.9 and level < 5:
            level += 1

        # Ajustement streak
        if streak >= 4 and level < 5:
            level += 1
        elif streak <= -2:
            level = max(1, level - 1)

        return level

    # =========================================================================
    # MODULE 4: COGNITIVE LOAD DETECTION
    # =========================================================================

    def _assess_cognitive_load(self, state: Dict) -> tuple:
        """Évalue la charge cognitive et retourne (load_level, should_break)"""
        assessment = state["cognitive_detector"].assess()
        return assessment.overall_load, assessment.should_pause

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

        # 1. Cognitive Load
        cognitive_load, should_break = self._assess_cognitive_load(state)

        # 2. FSRS
        card = self._get_fsrs_card(state, topic_id)
        retrievability = self._get_retrievability(state, topic_id)

        # 3. Stats récentes
        recent = state["responses"][-10:]
        recent_accuracy = sum(1 for r in recent if r.get("is_correct", False)) / max(1, len(recent))

        # 4. Difficulté optimale
        difficulty = self._calculate_optimal_difficulty(
            mastery=current_mastery,
            retrievability=retrievability,
            cognitive_load=cognitive_load,
            recent_accuracy=recent_accuracy,
            streak=state["streak"]
        )

        # 5. Interleaving
        interleave = self._should_interleave(state, topic_id)

        return QuestionParams(
            difficulty=difficulty,
            difficulty_name=self.DIFFICULTY_LEVELS[difficulty]["name"],
            topic_id=topic_id,
            fsrs_interval=card.stability,
            retrievability=retrievability,
            cognitive_load=cognitive_load,
            should_take_break=should_break,
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

        # 4. Calculer changement de maîtrise (AJUSTÉ: équilibré pour tous les profils)
        # Multiplicateur inversé pour niveau 1: on veut encourager les élèves en difficulté
        level_multiplier = {1: 1.0, 2: 0.9, 3: 1.0, 4: 1.1, 5: 1.2}[difficulty]

        current = state["mastery"].get(topic_id, 0)

        if is_correct:
            # Gains de base (CALIBRÉ pour progression réaliste)
            # Objectif: ~5% par jour pour élève moyen = ~65% en 14 jours
            base_gain = 3  # Ajusté pour atteindre objectifs réalistes
            if response_time < 10:
                base_gain += 1  # Bonus réponse rapide

            mastery_change = int(base_gain * level_multiplier)

            # BONUS modéré pour débutants
            if current < 20:
                mastery_change = int(mastery_change * 1.2)  # +20% au début
            elif current < 35:
                mastery_change = int(mastery_change * 1.1)  # +10%

            # Rendements décroissants progressifs
            # Plus on monte, plus c'est difficile de progresser
            if current >= 90:
                mastery_change = max(1, mastery_change // 5)  # Très dur après 90%
            elif current >= 80:
                mastery_change = max(1, mastery_change // 4)
            elif current >= 70:
                mastery_change = max(1, mastery_change // 3)
            elif current >= 55:
                mastery_change = max(1, mastery_change // 2)
            elif current >= 45:
                mastery_change = int(mastery_change * 0.75)
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

        # Mettre à jour maîtrise
        current = state["mastery"].get(topic_id, 0)
        state["mastery"][topic_id] = max(0, min(100, current + mastery_change))

        # 7. Stats et feedback
        recent = state["responses"][-10:]
        accuracy = sum(1 for r in recent if r.get("is_correct", False)) / max(1, len(recent))

        cognitive_load, should_break = self._assess_cognitive_load(state)
        should_reduce = cognitive_load in ["high", "overload"] or accuracy < 0.5

        # Feedback
        if should_break:
            feedback = "Pause recommandée - charge cognitive élevée"
        elif not is_correct and state["streak"] <= -3:
            feedback = "Essaie un niveau plus facile"
        elif is_correct and state["streak"] >= 5:
            feedback = "Excellent! Prêt pour plus de challenge?"
        elif is_correct:
            feedback = "Bien joué!"
        else:
            feedback = "Pas grave, la prochaine sera la bonne"

        # 8. Accumuler XP total
        state["total_xp"] = state.get("total_xp", 0) + xp_earned

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
            feedback=feedback
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

        cognitive_load, _ = self._assess_cognitive_load(state)

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
        logger.info(f"Session reset for {user_id}")

    def get_engine_info(self) -> Dict[str, Any]:
        """Informations sur le moteur"""
        return {
            "version": "4.1 LEAN",
            "modules": 5,
            "features": ["DB Persistence", "Auto-save", "Auto-load"],
            "modules_list": [
                {"name": "FSRS", "research": "Pimsleur (moderne)", "benefit": "Timing optimal des révisions"},
                {"name": "Testing Effect", "research": "Dunlosky (2013)", "benefit": "Quiz actif > relecture"},
                {"name": "Adaptive Difficulty", "research": "Vygotsky, Bjork", "benefit": "Zone optimale"},
                {"name": "Cognitive Load", "research": "Sweller (1988)", "benefit": "Détection fatigue"},
                {"name": "Interleaving", "research": "Rohrer (2007)", "benefit": "+43% discrimination"},
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


# Instance globale
lean_engine = LeanLearningEngine()
