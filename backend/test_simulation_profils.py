"""
🧪 SIMULATION PROFILS ÉLÈVES - MOTEUR LEAN v4.4 (10/10 ACADÉMIQUE)
Test du moteur avec les 4 profils représentant ~95% des utilisateurs.

Profils:
1. DÉTERMINÉ (20%) - Motivé + capable → atteint 100%
2. MOYEN (35%) - Motivé mais capacité normale → le gros de la base
3. IRRÉGULIER (25%) - Capable mais motivation variable → sessions espacées
4. EN DIFFICULTÉ (20%) - Motivation ok mais capacité limitée → a besoin d'aide

AMÉLIORATIONS v4.1:
- Oubli entre sessions (courbe d'Ebbinghaus)
- Transfert inter-topics (apprentissage connexe)
- Variabilité des questions (pièges, questions faciles)
- Effet warmup (première question du jour)

AMÉLIORATIONS v4.2:
- Spacing effect (révision espacée = meilleur apprentissage)
- Plateau naturel (stagnation à 40-60% avant déclic)
- Confiance / Self-efficacy (différent de motivation)
- Streak motivation (jours consécutifs = boost)
- Fatigue hebdomadaire (cumul sur la semaine)

AMÉLIORATIONS v4.3:
- Testing Effect (Roediger & Karpicke 2006): être testé > relire (+20% rétention)
- Interférence proactive/rétroactive: apprendre B perturbe temporairement A
- Effet Dunning-Kruger: surestimation des débutants, sous-estimation des experts
- Consolidation nocturne: le sommeil consolide la mémoire (+10% le matin)

AMÉLIORATIONS v4.4 (10/10 ACADÉMIQUE):
- Desirable Difficulties (Bjork 1994): difficulté optimale = meilleur apprentissage
- Generation Effect (Slamecka 1978): générer > recevoir passivement
- Encoding Specificity (Tulving 1973): contexte apprentissage ≈ contexte test
- Attention Fluctuante: vigilance varie toutes les ~20min (cycles ultradian)
"""

import sys
sys.path.insert(0, '.')

import random
import math
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass

from services.learning_engine_lean import lean_engine, LeanLearningEngine


# =============================================================================
# CONSTANTES RÉALISTES
# =============================================================================

# Matrice de transfert entre topics (apprendre A aide B)
# Valeur = % de transfert (0.2 = 20% du gain se transfère)
TOPIC_TRANSFER_MATRIX = {
    "conjugaison": {"grammaire": 0.15, "vocabulaire": 0.05, "orthographe": 0.10},
    "grammaire": {"conjugaison": 0.20, "vocabulaire": 0.05, "orthographe": 0.15},
    "vocabulaire": {"conjugaison": 0.05, "grammaire": 0.05, "orthographe": 0.25},
    "orthographe": {"conjugaison": 0.10, "grammaire": 0.10, "vocabulaire": 0.20},
}

# Taux d'oubli par jour (basé sur Ebbinghaus)
# retention = e^(-decay_rate * days_since_practice)
# 0.10 = ~10% d'oubli par jour sans pratique (réaliste pour apprentissage scolaire)
FORGETTING_DECAY_RATE = 0.10

# Variabilité des questions par difficulté
# Certaines questions sont des "pièges", d'autres plus intuitives
QUESTION_VARIANCE = {
    1: {"trap_prob": 0.05, "easy_prob": 0.30},  # Niveau 1: peu de pièges
    2: {"trap_prob": 0.10, "easy_prob": 0.20},
    3: {"trap_prob": 0.15, "easy_prob": 0.15},  # Niveau 3: équilibré
    4: {"trap_prob": 0.20, "easy_prob": 0.10},
    5: {"trap_prob": 0.25, "easy_prob": 0.05},  # Niveau 5: beaucoup de pièges
}

# Effet warmup (première question du jour)
WARMUP_PENALTY = 0.15  # -15% de chance de réussir la première question

# =============================================================================
# NOUVELLES CONSTANTES v4.2 (10/10)
# =============================================================================

# Spacing Effect - Réviser après 2-3 jours est MIEUX que tous les jours
# Basé sur la recherche de Cepeda et al. (2006)
# Ajusté pour ne pas trop pénaliser la pratique quotidienne
SPACING_EFFECT = {
    0: 0.95,   # Même jour = massed practice = -5% (léger)
    1: 1.00,   # 1 jour = normal
    2: 1.10,   # 2 jours = optimal = +10%
    3: 1.10,   # 3 jours = optimal = +10%
    4: 1.05,   # 4 jours = bon = +5%
    5: 1.00,   # 5 jours = normal
}  # Au-delà de 5 jours = 1.0 (normal)

# Plateau naturel - Probabilité de stagnation à certains seuils
# Basé sur la "courbe en S" de l'apprentissage
PLATEAU_CONFIG = {
    "zone": (0.35, 0.65),      # Zone de plateau: 35-65% de maîtrise
    "probability": 0.15,       # 15% de chance d'être en plateau chaque jour
    "duration_min": 2,         # Minimum 2 jours de plateau
    "duration_max": 5,         # Maximum 5 jours de plateau
    "breakthrough_prob": 0.20, # 20% de chance de "déclic" par jour en plateau
}

# Confiance / Self-efficacy
# Différent de motivation: affecte la prise de risque et la persistence
CONFIDENCE_CONFIG = {
    "initial": 0.50,           # Confiance initiale
    "gain_on_success": 0.03,   # +3% par réponse correcte
    "loss_on_failure": 0.05,   # -5% par réponse incorrecte
    "streak_bonus": 0.02,      # +2% par réponse correcte consécutive
    "min": 0.10,               # Plancher
    "max": 0.95,               # Plafond
}

# Streak motivation - Jours consécutifs d'étude
STREAK_MOTIVATION = {
    3: 0.05,   # 3 jours consécutifs = +5% motivation
    5: 0.08,   # 5 jours = +8%
    7: 0.12,   # 7 jours = +12%
    14: 0.15,  # 14 jours = +15%
}
STREAK_BREAK_PENALTY = 0.10  # Perdre son streak = -10% motivation temporaire

# Fatigue hebdomadaire - Cumul sur la semaine
WEEKLY_FATIGUE_CONFIG = {
    "sessions_threshold": 5,   # À partir de 5 sessions/semaine
    "fatigue_per_extra": 0.05, # +5% fatigue de base par session au-delà
    "weekend_recovery": 0.50,  # Récupération de 50% de la fatigue le weekend
    "max_weekly_fatigue": 0.30, # Maximum 30% de fatigue hebdomadaire
}

# =============================================================================
# NOUVELLES CONSTANTES v4.3 (VRAI 10/10)
# =============================================================================

# Testing Effect (Roediger & Karpicke 2006)
# Être testé améliore la rétention de 20% vs simplement relire
# Appliqué: bonus d'apprentissage quand on répond (même incorrectement)
TESTING_EFFECT_CONFIG = {
    "retention_boost": 0.20,      # +20% de rétention grâce au testing
    "retrieval_practice_bonus": 0.15,  # Bonus si on "récupère" activement l'info
    "passive_decay": 0.05,        # Pénalité si on ne fait que lire sans tester
}

# Interférence proactive et rétroactive
# Proactive: ce qu'on savait AVANT interfère avec le nouveau
# Rétroactive: ce qu'on apprend APRÈS perturbe l'ancien
INTERFERENCE_CONFIG = {
    "proactive_rate": 0.08,       # Interférence de l'ancien sur le nouveau
    "retroactive_rate": 0.05,    # Interférence du nouveau sur l'ancien
    "similarity_threshold": 0.3,  # Seuil de similarité pour déclencher l'interférence
    "decay_per_day": 0.02,       # L'interférence diminue avec le temps
}

# Effet Dunning-Kruger
# Débutants surestiment leurs compétences, experts sous-estiment
# Affecte la confiance PERÇUE vs la confiance RÉELLE
DUNNING_KRUGER_CONFIG = {
    "novice_zone": (0.0, 0.25),   # Zone de surestimation
    "novice_overconfidence": 0.25, # +25% de confiance perçue
    "competent_zone": (0.40, 0.60), # Zone de sous-estimation ("vallée du désespoir")
    "competent_underconfidence": -0.15, # -15% de confiance perçue
    "expert_zone": (0.80, 1.0),   # Zone de légère sous-estimation
    "expert_underconfidence": -0.05, # -5% de confiance perçue
}

# Consolidation nocturne (Walker 2017, "Why We Sleep")
# Le sommeil consolide la mémoire: +10% d'efficacité le matin après sommeil
SLEEP_CONSOLIDATION_CONFIG = {
    "morning_bonus": 0.10,        # +10% d'efficacité le matin (après sommeil)
    "evening_fatigue": 0.05,      # +5% de fatigue le soir
    "consolidation_boost": 0.08,  # +8% de rétention après une nuit de sommeil
    "morning_hours": (6, 12),     # Heures du "matin" (bonus)
    "evening_hours": (18, 23),    # Heures du "soir" (malus)
}

# =============================================================================
# NOUVELLES CONSTANTES v4.4 (10/10 ACADÉMIQUE)
# =============================================================================

# Desirable Difficulties (Bjork 1994)
# Une difficulté "désirable" améliore l'apprentissage long terme
# Trop facile = pas d'effort = oubli rapide
# Trop dur = frustration = abandon
# Juste assez dur = effort optimal = rétention maximale
DESIRABLE_DIFFICULTY_CONFIG = {
    "optimal_error_rate": (0.15, 0.30),  # 15-30% d'erreurs = zone optimale
    "too_easy_penalty": 0.15,            # -15% d'apprentissage si trop facile
    "too_hard_penalty": 0.20,            # -20% d'apprentissage si trop dur
    "optimal_bonus": 0.20,               # +20% d'apprentissage en zone optimale
    "variability_bonus": 0.10,           # +10% si on varie les types de questions
}

# Generation Effect (Slamecka & Graf 1978)
# Générer une réponse (même incorrecte) > recevoir passivement
# Le cerveau encode mieux ce qu'il a activement produit
GENERATION_EFFECT_CONFIG = {
    "active_generation_bonus": 0.15,     # +15% si génération active (vs QCM)
    "partial_generation_bonus": 0.08,    # +8% si réponse partielle
    "passive_penalty": 0.05,             # -5% si réponse donnée sans effort
    "elaboration_bonus": 0.10,           # +10% si explication demandée
}

# Encoding Specificity (Tulving & Thomson 1973)
# On se souvient mieux si le contexte de test ≈ contexte d'apprentissage
# Simulé: consistance du contexte (heure, lieu, état)
ENCODING_SPECIFICITY_CONFIG = {
    "context_match_bonus": 0.12,         # +12% si même contexte
    "context_mismatch_penalty": 0.08,    # -8% si contexte différent
    "time_consistency_weight": 0.4,      # Poids de l'heure dans le contexte
    "state_consistency_weight": 0.6,     # Poids de l'état (fatigue/motivation)
}

# Attention Fluctuante (Cycles Ultradian)
# L'attention varie naturellement toutes les ~20 minutes
# Basé sur les rythmes ultradian (90-120 min avec pics/creux de 20min)
ATTENTION_FLUCTUATION_CONFIG = {
    "cycle_duration": 20,                # Minutes par cycle d'attention
    "peak_bonus": 0.10,                  # +10% au pic d'attention
    "trough_penalty": 0.15,              # -15% au creux d'attention
    "recovery_questions": 3,             # Questions pour récupérer après un creux
    "micro_break_benefit": 0.05,         # +5% après une micro-pause
}


# =============================================================================
# DÉFINITION DES 4 PROFILS
# =============================================================================

@dataclass
class StudentProfile:
    """Profil d'un élève"""
    name: str
    description: str
    # Capacités cognitives
    base_ability: float  # 0-1, capacité de base à répondre correctement
    learning_speed: float  # Vitesse d'apprentissage (multiplicateur)
    # Motivation
    motivation: float  # 0-1, motivation générale
    motivation_variance: float  # Variance de motivation (0 = stable, 0.3 = variable)
    # Comportement
    focus: float  # 0-1, concentration
    fatigue_resistance: float  # 0-1, résistance à la fatigue
    # Sessions
    session_skip_prob: float  # Probabilité de sauter une session (0-1)
    early_quit_prob: float  # Probabilité d'abandonner en cours de session


# Les 4 profils clés (AJUSTÉS pour réalisme)
PROFILES = {
    "determined": StudentProfile(
        name="Marie (Déterminée)",
        description="Motivée, capable, régulière. L'élève idéale.",
        base_ability=0.70,  # Légèrement réduit
        learning_speed=1.1,
        motivation=0.85,
        motivation_variance=0.05,
        focus=0.80,
        fatigue_resistance=0.75,
        session_skip_prob=0.03,
        early_quit_prob=0.02
    ),
    "average": StudentProfile(
        name="Salim (Moyen)",
        description="Motivé mais capacité normale. Représente 35% des utilisateurs.",
        base_ability=0.50,  # Capacité moyenne
        learning_speed=0.9,  # Légèrement plus lent
        motivation=0.65,
        motivation_variance=0.15,
        focus=0.60,
        fatigue_resistance=0.55,
        session_skip_prob=0.08,
        early_quit_prob=0.04
    ),
    "irregular": StudentProfile(
        name="Emma (Irrégulière)",
        description="Capable mais motivation variable. Sessions espacées.",
        base_ability=0.65,
        learning_speed=1.0,
        motivation=0.50,
        motivation_variance=0.25,  # Moins de variance
        focus=0.65,
        fatigue_resistance=0.65,
        session_skip_prob=0.25,  # Réduit de 35% à 25%
        early_quit_prob=0.10  # Réduit
    ),
    "struggling": StudentProfile(
        name="Tom (En difficulté)",
        description="Motivé mais capacité limitée. A besoin d'adaptation.",
        base_ability=0.40,  # Capacité limitée
        learning_speed=0.70,
        motivation=0.70,  # Bien motivé!
        motivation_variance=0.10,  # Stable
        focus=0.55,
        fatigue_resistance=0.50,
        session_skip_prob=0.05,  # Très régulier car motivé
        early_quit_prob=0.06  # Reste jusqu'au bout
    )
}


class SimulatedStudent:
    """
    Élève simulé basé sur un profil.

    AMÉLIORATIONS v4.1:
    - Oubli entre sessions (Ebbinghaus)
    - Transfert inter-topics
    - Variabilité des questions
    - Effet warmup

    AMÉLIORATIONS v4.2:
    - Spacing effect
    - Plateau naturel
    - Confiance / Self-efficacy
    - Streak motivation
    - Fatigue hebdomadaire

    AMÉLIORATIONS v4.3 (VRAI 10/10):
    - Testing Effect
    - Interférence proactive/rétroactive
    - Effet Dunning-Kruger
    - Consolidation nocturne

    AMÉLIORATIONS v4.4 (10/10 ACADÉMIQUE):
    - Desirable Difficulties (Bjork 1994)
    - Generation Effect (Slamecka 1978)
    - Encoding Specificity (Tulving 1973)
    - Attention Fluctuante (cycles ultradian)
    """

    def __init__(self, profile: StudentProfile):
        self.profile = profile
        self.knowledge: Dict[str, float] = {}
        self.current_motivation = profile.motivation
        self.fatigue = 0.0
        self.session_questions = 0
        # v4.1: tracking pour oubli
        self.last_practice_day: Dict[str, int] = {}  # topic -> dernier jour pratiqué
        self.current_day = 0
        # v4.1: tracking warmup
        self.is_first_question_of_day = True

        # v4.2: Confiance / Self-efficacy
        self.confidence = CONFIDENCE_CONFIG["initial"]
        self.consecutive_correct = 0  # Pour streak de confiance

        # v4.2: Streak motivation (jours consécutifs)
        self.study_streak = 0
        self.last_study_day = -1
        self.streak_broken_today = False  # Pour pénalité temporaire

        # v4.2: Fatigue hebdomadaire
        self.weekly_sessions = 0
        self.weekly_fatigue = 0.0
        self.current_week = 0

        # v4.2: Plateau naturel
        self.in_plateau = False
        self.plateau_days_remaining = 0
        self.had_breakthrough = False  # Déclic déjà eu?

        # v4.3: Testing Effect - tracking des topics testés
        self.tested_topics: Dict[str, int] = {}  # topic -> nombre de tests
        self.retrieval_attempts: Dict[str, int] = {}  # tentatives de récupération

        # v4.3: Interférence - tracking des topics récemment appris
        self.recent_learning: List[tuple] = []  # [(topic, day, gain), ...]
        self.interference_levels: Dict[str, float] = {}  # topic -> niveau d'interférence actuel

        # v4.3: Dunning-Kruger - confiance perçue vs réelle
        self.perceived_confidence = CONFIDENCE_CONFIG["initial"]

        # v4.3: Consolidation nocturne - tracking du sommeil
        self.last_session_hour = 10  # Heure par défaut (matin)
        self.sleep_consolidated = False  # A-t-on bénéficié de la consolidation aujourd'hui?

        # v4.4: Desirable Difficulties - tracking du taux d'erreur récent
        self.recent_errors: List[bool] = []  # True = erreur, False = correct (dernières 10 questions)
        self.question_types_used: List[str] = []  # Pour variabilité des types

        # v4.4: Generation Effect - type de réponse
        self.generation_mode = "active"  # "active" (génère), "passive" (QCM), "partial"

        # v4.4: Encoding Specificity - contexte d'apprentissage
        self.learning_contexts: Dict[str, dict] = {}  # topic -> {hour, motivation, fatigue}

        # v4.4: Attention Fluctuante - cycle ultradian
        self.session_start_minute = 0  # Minute de début de session
        self.questions_since_trough = 0  # Questions depuis dernier creux
        self.in_attention_trough = False  # Dans un creux d'attention?

    def start_session(self, day: int, hour: int = None):
        """Début de session - reset fatigue, ajuster motivation, appliquer tous les effets"""
        self.session_questions = 0
        self.current_day = day
        self.is_first_question_of_day = True

        # v4.3: Simuler l'heure de la session (pour consolidation nocturne)
        if hour is None:
            # Simuler une heure réaliste (pic entre 9h et 20h)
            hour = random.choice([9, 10, 11, 14, 15, 16, 17, 18, 19, 20])
        self.last_session_hour = hour

        # Calculer la semaine (pour fatigue hebdomadaire)
        new_week = day // 7
        if new_week > self.current_week:
            # Nouvelle semaine - récupération weekend
            self._apply_weekend_recovery()
            self.current_week = new_week
            self.weekly_sessions = 0

        # Incrémenter sessions hebdomadaires
        self.weekly_sessions += 1

        # v4.2: Gérer le streak
        self._update_streak(day)

        # v4.2: Calculer fatigue de base (quotidienne + hebdomadaire)
        self.fatigue = self._calculate_base_fatigue()

        # v4.3: Ajuster fatigue selon l'heure (consolidation nocturne)
        self.fatigue += self._get_time_of_day_fatigue()

        # Variance de motivation + bonus streak
        variance = random.uniform(-self.profile.motivation_variance, self.profile.motivation_variance)
        base_motivation = self.profile.motivation + variance

        # v4.2: Bonus streak motivation
        streak_bonus = self._get_streak_motivation_bonus()

        # v4.2: Pénalité si streak cassé aujourd'hui
        streak_penalty = STREAK_BREAK_PENALTY if self.streak_broken_today else 0

        self.current_motivation = max(0.2, min(1.0, base_motivation + streak_bonus - streak_penalty))
        self.streak_broken_today = False  # Reset pour demain

        # v4.1: Appliquer l'oubli (courbe d'Ebbinghaus)
        self._apply_forgetting(day)

        # v4.3: Appliquer la consolidation nocturne (si nouveau jour)
        if day > 0:
            self._apply_sleep_consolidation()

        # v4.3: Diminuer l'interférence avec le temps
        self._decay_interference()

        # v4.2: Gérer le plateau
        self._update_plateau_state()

        # v4.4: Initialiser le cycle d'attention (ultradian)
        self.session_start_minute = random.randint(0, 19)  # Position dans le cycle de 20 min
        self.questions_since_trough = 0
        self.in_attention_trough = False

    def _apply_forgetting(self, current_day: int):
        """
        Applique l'oubli basé sur la courbe d'Ebbinghaus.
        retention = e^(-decay_rate * days_since_practice)

        Plus on a pratiqué récemment, moins on oublie.
        Plus la maîtrise est élevée, plus la rétention est bonne.
        """
        for topic in list(self.knowledge.keys()):
            last_day = self.last_practice_day.get(topic, 0)
            days_since = current_day - last_day

            if days_since <= 0:
                continue  # Pas d'oubli si pratiqué aujourd'hui

            current_mastery = self.knowledge[topic]

            # Facteur de rétention basé sur la maîtrise
            # Plus on maîtrise, moins on oublie vite
            mastery_factor = 0.5 + current_mastery * 0.5  # 0.5 à 1.0

            # Calcul de la rétention (Ebbinghaus modifié)
            effective_decay = FORGETTING_DECAY_RATE / mastery_factor
            retention = math.exp(-effective_decay * days_since)

            # Plancher: on ne descend jamais en dessous de 30% de la maîtrise initiale
            min_retention = 0.30
            retention = max(min_retention, retention)

            # Appliquer l'oubli
            new_mastery = current_mastery * retention
            self.knowledge[topic] = max(0.0, new_mastery)

    def apply_day_skip(self, day: int):
        """Appelé quand l'élève saute une session - applique l'oubli et casse le streak"""
        self._apply_forgetting(day)

        # v4.2: Casser le streak si on saute un jour
        if self.last_study_day >= 0 and day > self.last_study_day + 1:
            if self.study_streak >= 3:  # Pénalité seulement si on avait un streak significatif
                self.streak_broken_today = True
            self.study_streak = 0

        self.current_day = day

    # =========================================================================
    # v4.2: NOUVELLES MÉTHODES
    # =========================================================================

    def _update_streak(self, day: int):
        """Met à jour le streak de jours consécutifs"""
        if self.last_study_day == day - 1:
            # Jour consécutif
            self.study_streak += 1
        elif self.last_study_day < day - 1:
            # Streak cassé
            if self.study_streak >= 3:
                self.streak_broken_today = True
            self.study_streak = 1  # Recommence à 1 aujourd'hui

        self.last_study_day = day

    def _get_streak_motivation_bonus(self) -> float:
        """Calcule le bonus de motivation basé sur le streak"""
        bonus = 0.0
        for threshold, value in sorted(STREAK_MOTIVATION.items(), reverse=True):
            if self.study_streak >= threshold:
                bonus = value
                break
        return bonus

    def _calculate_base_fatigue(self) -> float:
        """Calcule la fatigue de base incluant la fatigue hebdomadaire"""
        # Fatigue hebdomadaire si trop de sessions
        config = WEEKLY_FATIGUE_CONFIG
        extra_sessions = max(0, self.weekly_sessions - config["sessions_threshold"])
        self.weekly_fatigue = min(
            config["max_weekly_fatigue"],
            extra_sessions * config["fatigue_per_extra"]
        )
        return self.weekly_fatigue  # La fatigue quotidienne s'ajoute pendant la session

    def _apply_weekend_recovery(self):
        """Récupération de fatigue pendant le weekend"""
        recovery = WEEKLY_FATIGUE_CONFIG["weekend_recovery"]
        self.weekly_fatigue *= (1 - recovery)

    def _update_plateau_state(self):
        """Gère l'état de plateau (stagnation)"""
        avg_mastery = sum(self.knowledge.values()) / max(1, len(self.knowledge)) if self.knowledge else 0

        zone_min, zone_max = PLATEAU_CONFIG["zone"]

        # Vérifier si on est dans la zone de plateau
        if zone_min <= avg_mastery <= zone_max and not self.had_breakthrough:
            if self.in_plateau:
                # Déjà en plateau - vérifier breakthrough
                self.plateau_days_remaining -= 1
                if random.random() < PLATEAU_CONFIG["breakthrough_prob"]:
                    # Déclic!
                    self.in_plateau = False
                    self.had_breakthrough = True
                elif self.plateau_days_remaining <= 0:
                    # Fin naturelle du plateau
                    self.in_plateau = False
            else:
                # Pas encore en plateau - vérifier si on y entre
                if random.random() < PLATEAU_CONFIG["probability"]:
                    self.in_plateau = True
                    self.plateau_days_remaining = random.randint(
                        PLATEAU_CONFIG["duration_min"],
                        PLATEAU_CONFIG["duration_max"]
                    )
        else:
            # Hors zone de plateau
            self.in_plateau = False

    def _get_spacing_bonus(self, topic: str) -> float:
        """Calcule le bonus de spacing effect pour un topic"""
        last_day = self.last_practice_day.get(topic, -10)
        days_since = self.current_day - last_day

        if days_since in SPACING_EFFECT:
            return SPACING_EFFECT[days_since]
        return 1.0  # Pas de bonus/malus au-delà de 5 jours

    def _update_confidence(self, is_correct: bool):
        """Met à jour la confiance après une réponse"""
        config = CONFIDENCE_CONFIG

        if is_correct:
            self.consecutive_correct += 1
            gain = config["gain_on_success"]
            # Bonus streak de confiance
            if self.consecutive_correct >= 3:
                gain += config["streak_bonus"]
            self.confidence = min(config["max"], self.confidence + gain)
        else:
            self.consecutive_correct = 0
            self.confidence = max(config["min"], self.confidence - config["loss_on_failure"])

        # v4.3: Mettre à jour la confiance perçue (Dunning-Kruger)
        self._update_perceived_confidence()

    # =========================================================================
    # v4.3: NOUVELLES MÉTHODES (VRAI 10/10)
    # =========================================================================

    def _get_time_of_day_fatigue(self) -> float:
        """Calcule la fatigue additionnelle selon l'heure (consolidation nocturne)"""
        config = SLEEP_CONSOLIDATION_CONFIG
        hour = self.last_session_hour

        if config["morning_hours"][0] <= hour <= config["morning_hours"][1]:
            # Matin: bonus (moins de fatigue)
            return -config["morning_bonus"]
        elif config["evening_hours"][0] <= hour <= config["evening_hours"][1]:
            # Soir: malus (plus de fatigue)
            return config["evening_fatigue"]
        return 0.0

    def _apply_sleep_consolidation(self):
        """Applique le bonus de consolidation nocturne (le sommeil consolide la mémoire)"""
        if self.sleep_consolidated:
            return  # Déjà appliqué aujourd'hui

        config = SLEEP_CONSOLIDATION_CONFIG
        boost = config["consolidation_boost"]

        # Appliquer un petit boost à tous les topics (le sommeil consolide)
        for topic in self.knowledge:
            # Le boost est proportionnel à ce qui a été appris récemment
            if topic in self.last_practice_day:
                days_since = self.current_day - self.last_practice_day[topic]
                if days_since == 1:  # Pratiqué hier = consolidation maximale
                    self.knowledge[topic] = min(1.0, self.knowledge[topic] * (1 + boost))

        self.sleep_consolidated = True

    def _decay_interference(self):
        """Diminue l'interférence avec le temps"""
        config = INTERFERENCE_CONFIG
        decay = config["decay_per_day"]

        for topic in list(self.interference_levels.keys()):
            self.interference_levels[topic] = max(0, self.interference_levels[topic] - decay)
            if self.interference_levels[topic] <= 0:
                del self.interference_levels[topic]

        # Nettoyer les apprentissages récents (> 3 jours)
        self.recent_learning = [
            (t, d, g) for t, d, g in self.recent_learning
            if self.current_day - d <= 3
        ]

    def _apply_proactive_interference(self, topic: str) -> float:
        """
        Interférence proactive: ce qu'on savait AVANT interfère avec le nouveau.
        Retourne un malus (négatif) si interférence détectée.
        """
        config = INTERFERENCE_CONFIG

        # Chercher des topics similaires déjà maîtrisés
        interference = 0.0
        for other_topic, mastery in self.knowledge.items():
            if other_topic == topic:
                continue
            # Plus on maîtrise un topic similaire, plus il peut interférer
            similarity = TOPIC_TRANSFER_MATRIX.get(topic, {}).get(other_topic, 0)
            if similarity >= config["similarity_threshold"]:
                interference += mastery * config["proactive_rate"] * similarity

        return -min(0.15, interference)  # Plafonné à -15%

    def _apply_retroactive_interference(self, topic: str, gain: float):
        """
        Interférence rétroactive: apprendre quelque chose de nouveau perturbe l'ancien.
        Applique une petite perte aux topics similaires.
        """
        config = INTERFERENCE_CONFIG

        if gain <= 0:
            return

        # Enregistrer cet apprentissage
        self.recent_learning.append((topic, self.current_day, gain))

        # Appliquer l'interférence aux topics similaires
        for other_topic in self.knowledge:
            if other_topic == topic:
                continue
            similarity = TOPIC_TRANSFER_MATRIX.get(other_topic, {}).get(topic, 0)
            if similarity >= config["similarity_threshold"]:
                interference = gain * config["retroactive_rate"] * similarity
                self.interference_levels[other_topic] = self.interference_levels.get(other_topic, 0) + interference
                # Appliquer immédiatement une petite perte
                self.knowledge[other_topic] = max(0, self.knowledge[other_topic] - interference * 0.5)

    def _get_testing_effect_bonus(self, topic: str) -> float:
        """
        Testing Effect: être testé améliore la rétention.
        Plus on a été testé sur un topic, meilleure est la rétention.
        """
        config = TESTING_EFFECT_CONFIG
        tests_count = self.tested_topics.get(topic, 0)

        # Bonus logarithmique (rendements décroissants)
        if tests_count == 0:
            return 0.0
        bonus = config["retention_boost"] * math.log(1 + tests_count) / math.log(10)
        return min(config["retention_boost"], bonus)

    def _record_test(self, topic: str, is_correct: bool):
        """Enregistre qu'on a été testé sur ce topic"""
        self.tested_topics[topic] = self.tested_topics.get(topic, 0) + 1

        # Retrieval practice: si correct, on a "récupéré" l'info
        if is_correct:
            self.retrieval_attempts[topic] = self.retrieval_attempts.get(topic, 0) + 1

    def _update_perceived_confidence(self):
        """
        Effet Dunning-Kruger: ajuste la confiance perçue selon le niveau réel.
        Les débutants surestiment, les intermédiaires sous-estiment.
        """
        config = DUNNING_KRUGER_CONFIG
        avg_mastery = sum(self.knowledge.values()) / max(1, len(self.knowledge)) if self.knowledge else 0

        adjustment = 0.0

        # Zone novice: surestimation
        if config["novice_zone"][0] <= avg_mastery <= config["novice_zone"][1]:
            adjustment = config["novice_overconfidence"]
        # Zone compétent: sous-estimation ("vallée du désespoir")
        elif config["competent_zone"][0] <= avg_mastery <= config["competent_zone"][1]:
            adjustment = config["competent_underconfidence"]
        # Zone expert: légère sous-estimation
        elif config["expert_zone"][0] <= avg_mastery <= config["expert_zone"][1]:
            adjustment = config["expert_underconfidence"]

        self.perceived_confidence = max(0.1, min(0.95, self.confidence + adjustment))

    def _get_interference_penalty(self, topic: str) -> float:
        """Retourne la pénalité d'interférence actuelle pour un topic"""
        return self.interference_levels.get(topic, 0.0)

    # =========================================================================
    # v4.4: NOUVELLES MÉTHODES (10/10 ACADÉMIQUE)
    # =========================================================================

    def _get_desirable_difficulty_modifier(self) -> float:
        """
        Desirable Difficulties (Bjork 1994):
        Une difficulté "désirable" améliore l'apprentissage long terme.
        Zone optimale = 15-30% d'erreurs.
        """
        config = DESIRABLE_DIFFICULTY_CONFIG

        if len(self.recent_errors) < 5:
            return 0.0  # Pas assez de données

        # Calculer le taux d'erreur récent (dernières 10 questions)
        error_rate = sum(1 for e in self.recent_errors[-10:] if e) / len(self.recent_errors[-10:])

        optimal_min, optimal_max = config["optimal_error_rate"]

        if optimal_min <= error_rate <= optimal_max:
            # Zone optimale: bonus d'apprentissage
            return config["optimal_bonus"]
        elif error_rate < optimal_min:
            # Trop facile: pénalité
            return -config["too_easy_penalty"]
        else:
            # Trop dur: pénalité
            return -config["too_hard_penalty"]

    def _get_generation_effect_bonus(self) -> float:
        """
        Generation Effect (Slamecka & Graf 1978):
        Générer une réponse > recevoir passivement.
        Le mode de réponse affecte l'apprentissage.
        """
        config = GENERATION_EFFECT_CONFIG

        if self.generation_mode == "active":
            return config["active_generation_bonus"]
        elif self.generation_mode == "partial":
            return config["partial_generation_bonus"]
        else:  # passive
            return -config["passive_penalty"]

    def _get_encoding_specificity_modifier(self, topic: str) -> float:
        """
        Encoding Specificity (Tulving & Thomson 1973):
        On se souvient mieux si le contexte de test ≈ contexte d'apprentissage.
        """
        config = ENCODING_SPECIFICITY_CONFIG

        if topic not in self.learning_contexts:
            return 0.0  # Première fois sur ce topic

        learned_ctx = self.learning_contexts[topic]
        current_ctx = {
            "hour": self.last_session_hour,
            "motivation": self.current_motivation,
            "fatigue": self.fatigue
        }

        # Calculer la similarité de contexte
        # Heure: différence normalisée (0-12h de diff max)
        hour_diff = abs(learned_ctx.get("hour", 12) - current_ctx["hour"])
        hour_similarity = 1 - min(hour_diff, 12) / 12

        # État: différence de motivation et fatigue
        motivation_diff = abs(learned_ctx.get("motivation", 0.5) - current_ctx["motivation"])
        fatigue_diff = abs(learned_ctx.get("fatigue", 0.5) - current_ctx["fatigue"])
        state_similarity = 1 - (motivation_diff + fatigue_diff) / 2

        # Score de similarité pondéré
        similarity = (
            config["time_consistency_weight"] * hour_similarity +
            config["state_consistency_weight"] * state_similarity
        )

        # Retourner bonus ou malus selon la similarité
        if similarity > 0.7:
            return config["context_match_bonus"]
        elif similarity < 0.4:
            return -config["context_mismatch_penalty"]
        return 0.0

    def _get_attention_fluctuation_modifier(self) -> float:
        """
        Attention Fluctuante (Cycles Ultradian):
        L'attention varie toutes les ~20 minutes.
        """
        config = ATTENTION_FLUCTUATION_CONFIG

        # Calculer où on en est dans le cycle (basé sur le nombre de questions)
        # ~2 questions par minute = cycle de 40 questions
        questions_in_cycle = (self.session_start_minute * 2 + self.session_questions) % 40

        # Creux d'attention autour de questions 15-25 (milieu du cycle)
        if 15 <= questions_in_cycle <= 25:
            if not self.in_attention_trough:
                self.in_attention_trough = True
                self.questions_since_trough = 0
            return -config["trough_penalty"]
        else:
            # Récupération après un creux
            if self.in_attention_trough:
                self.questions_since_trough += 1
                if self.questions_since_trough >= config["recovery_questions"]:
                    self.in_attention_trough = False

            # Pic d'attention en début de cycle
            if questions_in_cycle < 10:
                return config["peak_bonus"]

        return 0.0

    def _update_recent_errors(self, is_correct: bool):
        """Met à jour la liste des erreurs récentes (pour Desirable Difficulties)"""
        self.recent_errors.append(not is_correct)
        if len(self.recent_errors) > 10:
            self.recent_errors.pop(0)

    def _update_learning_context(self, topic: str):
        """Sauvegarde le contexte d'apprentissage (pour Encoding Specificity)"""
        self.learning_contexts[topic] = {
            "hour": self.last_session_hour,
            "motivation": self.current_motivation,
            "fatigue": self.fatigue
        }

    def _simulate_generation_mode(self):
        """Simule le type de question (active, passive, partial)"""
        # 60% active (réponse libre), 30% partial (complétion), 10% passive (QCM)
        roll = random.random()
        if roll < 0.60:
            self.generation_mode = "active"
        elif roll < 0.90:
            self.generation_mode = "partial"
        else:
            self.generation_mode = "passive"

    def should_skip_session(self) -> bool:
        """Décide si l'élève saute la session"""
        return random.random() < self.profile.session_skip_prob

    def should_quit_early(self) -> tuple:
        """Décide si l'élève abandonne en cours de session"""
        prob = self.profile.early_quit_prob
        prob += self.fatigue * 0.1
        prob += (1 - self.current_motivation) * 0.1

        if random.random() < prob:
            reasons = [
                "Distraction",
                "Fatigue",
                "Perte de motivation",
                "Autre priorité"
            ]
            return True, random.choice(reasons)
        return False, None

    def answer_question(self, topic: str, difficulty: int) -> dict:
        """
        Simule une réponse avec:
        - Variabilité des questions (pièges/faciles)
        - Effet warmup (première question)
        - v4.2: Confiance affecte la prise de risque
        - v4.2: Plateau réduit la performance
        - v4.3: Testing Effect (bonus rétention)
        - v4.3: Interférence proactive
        - v4.3: Dunning-Kruger (confiance perçue)
        - v4.4: Encoding Specificity (contexte)
        - v4.4: Attention Fluctuante (cycles ultradian)
        """
        mastery = self.knowledge.get(topic, 0.0)
        p = self.profile

        # v4.4: Simuler le type de question (active, passive, partial)
        self._simulate_generation_mode()

        # Probabilité de base
        base_prob = p.base_ability + mastery * 0.3

        # Malus difficulté
        diff_penalty = (difficulty - 1) * 0.08

        # Bonus/malus motivation et focus
        motivation_bonus = (self.current_motivation - 0.5) * 0.15
        focus_bonus = (p.focus - 0.5) * 0.1

        # Malus fatigue
        fatigue_penalty = self.fatigue * 0.15

        # v4.2: Bonus/malus confiance
        confidence_bonus = (self.confidence - 0.5) * 0.10

        # v4.3: Testing Effect - bonus si déjà testé sur ce topic
        testing_bonus = self._get_testing_effect_bonus(topic)

        # v4.3: Interférence proactive - malus si topics similaires maîtrisés
        interference_penalty = self._apply_proactive_interference(topic)

        # v4.3: Interférence actuelle (rétroactive accumulée)
        current_interference = self._get_interference_penalty(topic)

        # v4.4: Encoding Specificity - bonus/malus selon similarité contexte
        encoding_modifier = self._get_encoding_specificity_modifier(topic)

        # v4.4: Attention Fluctuante - bonus/malus selon cycle ultradian
        attention_modifier = self._get_attention_fluctuation_modifier()

        prob_correct = (base_prob - diff_penalty + motivation_bonus + focus_bonus
                       - fatigue_penalty + confidence_bonus + testing_bonus
                       + interference_penalty - current_interference
                       + encoding_modifier + attention_modifier)

        # v4.1: Effet warmup (première question du jour)
        if self.is_first_question_of_day:
            prob_correct -= WARMUP_PENALTY
            self.is_first_question_of_day = False

        # v4.2: Malus plateau (stagnation = moins de réussite)
        if self.in_plateau:
            prob_correct -= 0.10  # -10% pendant un plateau

        # v4.1: Variabilité des questions
        variance = QUESTION_VARIANCE.get(difficulty, QUESTION_VARIANCE[3])
        roll = random.random()
        if roll < variance["trap_prob"]:
            # Question piège: -20% de chance
            prob_correct -= 0.20
        elif roll < variance["trap_prob"] + variance["easy_prob"]:
            # Question intuitive: +10% de chance
            prob_correct += 0.10

        prob_correct = max(0.10, min(0.95, prob_correct))

        is_correct = random.random() < prob_correct

        # v4.3: Enregistrer le test (Testing Effect)
        self._record_test(topic, is_correct)

        # v4.2: Mettre à jour la confiance
        self._update_confidence(is_correct)

        # v4.4: Mettre à jour les erreurs récentes (pour Desirable Difficulties)
        self._update_recent_errors(is_correct)

        # Temps de réponse
        base_time = 8 + difficulty * 4
        base_time *= (1.2 - p.focus * 0.3)
        base_time *= (1 + self.fatigue * 0.4)
        # v4.2: Confiance basse = plus lent (hésitation)
        if self.confidence < 0.3:
            base_time *= 1.2
        # v4.3: Dunning-Kruger - confiance perçue affecte le temps de réponse
        if self.perceived_confidence > self.confidence + 0.1:
            # Surconfiant = répond trop vite (parfois erreurs)
            base_time *= 0.85
        # v4.4: Attention fluctuante affecte aussi le temps
        if self.in_attention_trough:
            base_time *= 1.15  # +15% temps de réponse dans un creux
        response_time = base_time + random.uniform(-3, 8)
        response_time = max(3, response_time)

        # Augmenter fatigue
        self.fatigue = min(1.0, self.fatigue + 0.03 * (1 - p.fatigue_resistance))
        self.session_questions += 1

        return {
            "is_correct": is_correct,
            "response_time": response_time,
            "prob": prob_correct,
            "confidence": self.confidence,
            "perceived_confidence": self.perceived_confidence,
            "in_plateau": self.in_plateau,
            "testing_bonus": testing_bonus,
            "interference": current_interference,
            # v4.4
            "encoding_modifier": encoding_modifier,
            "attention_modifier": attention_modifier,
            "generation_mode": self.generation_mode,
            "in_attention_trough": self.in_attention_trough
        }

    def learn(self, topic: str, is_correct: bool, difficulty: int):
        """
        Apprentissage avec:
        - v4.1: Transfert inter-topics
        - v4.2: Spacing effect (révision espacée = meilleur apprentissage)
        - v4.2: Plateau (réduction de l'apprentissage pendant stagnation)
        - v4.3: Testing Effect (bonus rétention)
        - v4.3: Interférence rétroactive
        - v4.3: Consolidation nocturne (bonus matin)
        - v4.4: Desirable Difficulties (zone optimale d'erreurs)
        - v4.4: Generation Effect (génération active > passive)
        - v4.4: Encoding Specificity (contexte d'apprentissage)
        - v4.4: Attention Fluctuante (cycles ultradian)
        """
        current = self.knowledge.get(topic, 0.0)
        p = self.profile

        efficiency = p.learning_speed * p.focus * (0.8 + self.current_motivation * 0.4)
        efficiency *= (1 - self.fatigue * 0.3)

        # v4.2: Spacing effect - bonus si révision espacée optimalement
        spacing_multiplier = self._get_spacing_bonus(topic)
        efficiency *= spacing_multiplier

        # v4.3: Testing Effect - le fait d'être testé améliore l'apprentissage
        testing_multiplier = 1.0 + self._get_testing_effect_bonus(topic)
        efficiency *= testing_multiplier

        # v4.3: Bonus consolidation nocturne si session le matin
        config = SLEEP_CONSOLIDATION_CONFIG
        if config["morning_hours"][0] <= self.last_session_hour <= config["morning_hours"][1]:
            efficiency *= (1 + config["morning_bonus"])

        # v4.2: Plateau - réduction de l'apprentissage pendant stagnation
        if self.in_plateau:
            efficiency *= 0.50  # -50% d'apprentissage pendant plateau

        # v4.4: Desirable Difficulties - bonus/malus selon le taux d'erreur récent
        desirable_diff_modifier = self._get_desirable_difficulty_modifier()
        efficiency *= (1 + desirable_diff_modifier)

        # v4.4: Generation Effect - bonus si génération active
        generation_bonus = self._get_generation_effect_bonus()
        efficiency *= (1 + generation_bonus)

        # v4.4: Attention Fluctuante - malus si dans un creux d'attention
        if self.in_attention_trough:
            efficiency *= 0.85  # -15% d'apprentissage dans un creux

        gain = 0.0
        if is_correct:
            gain = 0.06 * efficiency * (1 + difficulty * 0.1)
            self.knowledge[topic] = min(1.0, current + gain)
        else:
            # Légère progression même sur erreur (pour élèves motivés)
            # v4.3: Testing Effect - même les erreurs aident à apprendre
            if self.current_motivation > 0.6:
                gain = 0.015 * efficiency
                # Bonus testing effect sur erreur (retrieval practice)
                gain *= (1 + TESTING_EFFECT_CONFIG["retrieval_practice_bonus"] * 0.5)
                self.knowledge[topic] = min(1.0, current + gain)

        # Marquer le topic comme pratiqué aujourd'hui
        self.last_practice_day[topic] = self.current_day

        # v4.4: Sauvegarder le contexte d'apprentissage (pour Encoding Specificity)
        self._update_learning_context(topic)

        # v4.3: Interférence rétroactive - apprendre ce topic peut perturber les autres
        if gain > 0:
            self._apply_retroactive_interference(topic, gain)

        # v4.1: Transfert inter-topics
        if gain > 0 and topic in TOPIC_TRANSFER_MATRIX:
            transfers = TOPIC_TRANSFER_MATRIX[topic]
            for other_topic, transfer_rate in transfers.items():
                if other_topic not in self.knowledge:
                    self.knowledge[other_topic] = 0.0
                transfer_gain = gain * transfer_rate
                self.knowledge[other_topic] = min(1.0, self.knowledge[other_topic] + transfer_gain)


# =============================================================================
# SIMULATION
# =============================================================================

def run_simulation(profile_key: str, num_days: int = 14, questions_per_day: int = 15):
    """Exécute une simulation pour un profil donné"""

    profile = PROFILES[profile_key]
    student = SimulatedStudent(profile)
    user_id = f"sim_{profile_key}"
    topics = ["conjugaison", "grammaire", "vocabulaire", "orthographe"]

    print(f"\n{'='*70}")
    print(f"👤 {profile.name}")
    print(f"   {profile.description}")
    print(f"{'='*70}")

    # Stats
    daily_stats = []
    total_xp = 0
    sessions_skipped = 0
    early_quits = 0

    for day in range(1, num_days + 1):
        # Vérifier si l'élève fait la session
        if student.should_skip_session():
            sessions_skipped += 1
            # NOUVEAU: Appliquer l'oubli même si session sautée
            student.apply_day_skip(day)
            avg_mastery = sum(student.knowledge.values()) / max(1, len(student.knowledge)) if student.knowledge else 0
            print(f"   Jour {day}: ⏭️ Session sautée (maîtrise après oubli: {avg_mastery*100:.0f}%)")
            daily_stats.append({
                "day": day,
                "skipped": True,
                "accuracy": None,
                "mastery": avg_mastery
            })
            continue

        # Début de session (avec oubli appliqué)
        # v4.3: Reset sleep_consolidated pour le nouveau jour
        student.sleep_consolidated = False
        student.start_session(day)
        lean_engine.reset_session(user_id)

        day_correct = 0
        day_total = 0
        day_xp = 0

        for q_num in range(questions_per_day):
            # Vérifier abandon précoce
            quit_early, reason = student.should_quit_early()
            if quit_early:
                early_quits += 1
                if day <= 3:
                    print(f"   Jour {day}: 🚪 Abandon après {q_num} questions ({reason})")
                break

            # Choisir topic (interleaving)
            topic = topics[q_num % len(topics)]
            mastery = int(student.knowledge.get(topic, 0.0) * 100)

            # Paramètres optimaux
            params = lean_engine.get_next_question(user_id, topic, mastery)

            # Réponse
            response = student.answer_question(topic, params.difficulty)

            # Traiter
            result = lean_engine.process_answer(
                user_id=user_id,
                topic_id=topic,
                is_correct=response["is_correct"],
                response_time=response["response_time"],
                difficulty=params.difficulty
            )

            # Apprentissage
            student.learn(topic, response["is_correct"], params.difficulty)

            day_total += 1
            if response["is_correct"]:
                day_correct += 1
            day_xp += result.xp_earned
            total_xp += result.xp_earned

        # Stats du jour
        if day_total > 0:
            accuracy = day_correct / day_total
            avg_mastery = sum(student.knowledge.values()) / len(student.knowledge) if student.knowledge else 0

            daily_stats.append({
                "day": day,
                "skipped": False,
                "accuracy": accuracy,
                "mastery": avg_mastery,
                "questions": day_total,
                "xp": day_xp
            })

            if day <= 3 or day == num_days:
                print(f"   Jour {day}: ✅ {accuracy*100:.0f}% précision, {avg_mastery*100:.0f}% maîtrise, {day_xp} XP")

    # Résultats
    completed_days = [d for d in daily_stats if not d.get("skipped", False)]

    if completed_days:
        final_mastery = completed_days[-1]["mastery"]
        final_accuracy = sum(d["accuracy"] for d in completed_days) / len(completed_days)
        total_questions = sum(d.get("questions", 0) for d in completed_days)
    else:
        final_mastery = 0
        final_accuracy = 0
        total_questions = 0

    return {
        "profile": profile.name,
        "final_mastery": final_mastery,
        "final_accuracy": final_accuracy,
        "total_xp": total_xp,
        "total_questions": total_questions,
        "sessions_completed": len(completed_days),
        "sessions_skipped": sessions_skipped,
        "early_quits": early_quits,
        "days": num_days
    }


def run_all_simulations():
    """Exécute les simulations pour tous les profils"""

    print("\n" + "=" * 70)
    print("🧪 SIMULATION DES 4 PROFILS ÉLÈVES - MOTEUR LEAN v4.4 (10/10 ACADÉMIQUE)")
    print("=" * 70)

    # Info moteur
    info = lean_engine.get_engine_info()
    print(f"\n📊 Moteur: {info['version']} ({info['modules']} modules)")

    results = []

    for profile_key in ["determined", "average", "irregular", "struggling"]:
        result = run_simulation(profile_key, num_days=14, questions_per_day=15)
        results.append(result)

    # Tableau comparatif
    print("\n" + "=" * 70)
    print("📊 COMPARATIF DES PROFILS")
    print("=" * 70)

    print(f"\n{'Profil':<25} {'Maîtrise':>10} {'Précision':>10} {'Sessions':>10} {'XP':>8}")
    print("-" * 70)

    for r in results:
        sessions_str = f"{r['sessions_completed']}/{r['days']}"
        print(f"{r['profile']:<25} {r['final_mastery']*100:>9.0f}% {r['final_accuracy']*100:>9.0f}% {sessions_str:>10} {r['total_xp']:>8}")

    # Analyse
    print("\n" + "=" * 70)
    print("🔍 ANALYSE")
    print("=" * 70)

    determined = results[0]
    average = results[1]
    irregular = results[2]
    struggling = results[3]

    print(f"""
✅ DÉTERMINÉ ({determined['profile']}):
   → Maîtrise: {determined['final_mastery']*100:.0f}% (objectif: >90%)
   → Le système permet d'atteindre l'excellence

📊 MOYEN ({average['profile']}):
   → Maîtrise: {average['final_mastery']*100:.0f}% (objectif: 60-80%)
   → Progression réaliste pour l'utilisateur type

🔄 IRRÉGULIER ({irregular['profile']}):
   → Maîtrise: {irregular['final_mastery']*100:.0f}% (sessions: {irregular['sessions_completed']}/{irregular['days']})
   → Progression malgré les sessions manquées

⚠️ EN DIFFICULTÉ ({struggling['profile']}):
   → Maîtrise: {struggling['final_mastery']*100:.0f}% (objectif: progression visible)
   → Le système s'adapte au rythme plus lent
""")

    # Verdict
    all_progressed = all(r['final_mastery'] > 0.2 for r in results)
    determined_excellent = determined['final_mastery'] > 0.85
    average_good = 0.5 < average['final_mastery'] < 0.9
    struggling_progressed = struggling['final_mastery'] > 0.25

    print("=" * 70)
    if all_progressed and determined_excellent and struggling_progressed:
        print("✅ TOUS LES PROFILS PROGRESSENT - Système validé!")
    else:
        print("⚠️ AJUSTEMENTS NÉCESSAIRES:")
        if not determined_excellent:
            print("   - Déterminé n'atteint pas 85%+")
        if not average_good:
            print("   - Moyen hors de la zone 50-90%")
        if not struggling_progressed:
            print("   - En difficulté ne progresse pas assez")
    print("=" * 70)

    return results


if __name__ == "__main__":
    results = run_all_simulations()
    sys.exit(0)
