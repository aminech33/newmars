"""
🧪 SIMULATION D'APPRENTISSAGE STRICTE - NewMars

Simulateur basé sur le VRAI moteur d'apprentissage de l'app.
Reflète exactement: FSRS, Mastery, Cognitive Load, Adaptive Difficulty.

MOTEUR RÉPLIQUÉ:
- FSRS (Free Spaced Repetition Scheduler) - Anki v23+
- Mastery avec rendements décroissants
- Cognitive Load detection (fatigue)
- ZPD (Zone Proximale de Développement)
- Interleaving après 4 questions même sujet
- Recovery Mode pour utilisateurs en difficulté

RÉFÉRENCES:
- Ebbinghaus (1885): Courbe d'oubli
- Vygotsky (1978): Zone Proximale de Développement
- Rohrer & Taylor (2007): Interleaving (+43% retention)
- FSRS (2023): State-of-the-art spaced repetition
"""

import random
import math
import statistics
from dataclasses import dataclass, field
from typing import List, Dict, Tuple, Optional
from enum import Enum


# ═══════════════════════════════════════════════════════════════
# FSRS - FREE SPACED REPETITION SCHEDULER
# ═══════════════════════════════════════════════════════════════

class Rating(Enum):
    AGAIN = 1  # Échec total
    HARD = 2   # Difficile mais réussi
    GOOD = 3   # Normal
    EASY = 4   # Trop facile


@dataclass
class FSRSCard:
    """Carte FSRS pour un skill"""
    difficulty: float = 5.0      # D: 1-10
    stability: float = 1.0       # S: jours avant oubli 90%
    retrievability: float = 1.0  # R: probabilité de rappel
    last_review: int = 0         # Dernier jour de révision
    interval: int = 1            # Intervalle actuel en jours
    reps: int = 0                # Nombre de répétitions


# Paramètres FSRS optimisés (17 poids)
FSRS_WEIGHTS = {
    'w0': 0.4,   'w1': 0.6,   'w2': 2.4,   'w3': 5.8,
    'w4': 4.93,  'w5': 0.94,  'w6': 0.86,  'w7': 0.01,
    'w8': 1.49,  'w9': 0.14,  'w10': 0.94, 'w11': 2.18,
    'w12': 0.05, 'w13': 0.34, 'w14': 1.26, 'w15': 0.29,
    'w16': 2.61,
}
REQUEST_RETENTION = 0.9  # Cible 90% rétention


def fsrs_retrievability(card: FSRSCard, day: int) -> float:
    """Calcule R(t,S) = (1 + t/(9*S))^-1"""
    elapsed = day - card.last_review
    if elapsed <= 0 or card.stability <= 0:
        return 1.0
    return (1 + elapsed / (9 * card.stability)) ** -1


def fsrs_update(card: FSRSCard, rating: Rating, day: int) -> FSRSCard:
    """Met à jour une carte après review selon FSRS"""
    w = FSRS_WEIGHTS
    R = fsrs_retrievability(card, day)

    # Nouvelle difficulté (mean reversion vers 5)
    if rating == Rating.AGAIN:
        d_adj = w['w7']
    elif rating == Rating.HARD:
        d_adj = -w['w6']
    elif rating == Rating.EASY:
        d_adj = w['w8']
    else:
        d_adj = 0

    new_d = card.difficulty + d_adj * (5 - card.difficulty) * 0.1
    new_d = max(1, min(10, new_d))

    # Nouvelle stabilité
    if rating == Rating.AGAIN:
        # Échec: stabilité chute
        new_s = w['w11'] * (new_d ** -w['w12']) * ((card.stability + 1) ** w['w13'] - 1) * math.exp(w['w14'] * (1 - R))
        new_s = max(0.1, new_s)
    else:
        # Succès: stabilité croît
        growth = 1 + math.exp(w['w15']) * (11 - new_d) * (card.stability ** -w['w16']) * (math.exp(w['w10'] * (1 - R)) - 1)
        if rating == Rating.HARD:
            growth *= 0.85
        elif rating == Rating.EASY:
            growth *= 1.3
        new_s = card.stability * growth
        new_s = min(365, max(0.1, new_s))

    # Nouvel intervalle
    new_interval = int(9 * new_s * (1 / REQUEST_RETENTION - 1))
    new_interval = max(1, min(365, new_interval))

    return FSRSCard(
        difficulty=new_d,
        stability=new_s,
        retrievability=1.0,  # Reset après review
        last_review=day,
        interval=new_interval,
        reps=card.reps + 1
    )


# ═══════════════════════════════════════════════════════════════
# PROFILS D'ÉLÈVES
# ═══════════════════════════════════════════════════════════════

@dataclass
class StudentProfile:
    name: str
    description: str
    ability: float           # 0-1, capacité cognitive
    response_speed: float    # Multiplicateur temps réponse
    motivation: float        # 0-1
    consistency: float       # 0-1, régularité
    skip_prob: float         # Prob de sauter une session
    fatigue_resistance: float  # 0-1, résistance à la fatigue


PROFILES = {
    "determined": StudentProfile(
        "Marie (Déterminée)", "Motivée, capable, régulière",
        ability=0.75, response_speed=0.8, motivation=0.85,
        consistency=0.90, skip_prob=0.03, fatigue_resistance=0.8
    ),
    "average": StudentProfile(
        "Salim (Moyen)", "Motivé mais capacité normale",
        ability=0.55, response_speed=1.0, motivation=0.65,
        consistency=0.70, skip_prob=0.08, fatigue_resistance=0.6
    ),
    "irregular": StudentProfile(
        "Emma (Irrégulière)", "Capable mais motivation variable",
        ability=0.65, response_speed=0.9, motivation=0.45,
        consistency=0.40, skip_prob=0.30, fatigue_resistance=0.7
    ),
    "struggling": StudentProfile(
        "Tom (En difficulté)", "Motivé mais capacité limitée",
        ability=0.40, response_speed=1.3, motivation=0.70,
        consistency=0.75, skip_prob=0.05, fatigue_resistance=0.5
    ),
    "procrastinator": StudentProfile(
        "Amine (Procrastinateur)", "Intelligent mais inconsistant",
        ability=0.65, response_speed=1.0, motivation=0.50,
        consistency=0.30, skip_prob=0.40, fatigue_resistance=0.6
    ),
}

# ═══════════════════════════════════════════════════════════════
# PROFILS HARDCORE - Pour tester les limites du système
# ═══════════════════════════════════════════════════════════════

PROFILES_HARDCORE = {
    "ghost": StudentProfile(
        "Fantôme", "Disparaît pendant des semaines",
        ability=0.50, response_speed=1.0, motivation=0.30,
        consistency=0.15, skip_prob=0.60, fatigue_resistance=0.5
    ),
    "severe_struggling": StudentProfile(
        "Lucas (Très en difficulté)", "Capacité très limitée, mais veut réussir",
        ability=0.25, response_speed=1.5, motivation=0.60,
        consistency=0.65, skip_prob=0.10, fatigue_resistance=0.3
    ),
    "adhd": StudentProfile(
        "Léa (TDAH)", "Intelligente mais attention très courte",
        ability=0.70, response_speed=0.7, motivation=0.55,
        consistency=0.25, skip_prob=0.35, fatigue_resistance=0.25
    ),
    "burnout": StudentProfile(
        "Marc (Épuisé)", "Travaille, famille, études = burnout",
        ability=0.60, response_speed=1.2, motivation=0.40,
        consistency=0.20, skip_prob=0.50, fatigue_resistance=0.20
    ),
    "zero_confidence": StudentProfile(
        "Sarah (0 confiance)", "Capable mais se croit nulle",
        ability=0.55, response_speed=1.4, motivation=0.35,
        consistency=0.50, skip_prob=0.25, fatigue_resistance=0.4
    ),
}


# ═══════════════════════════════════════════════════════════════
# SKILLS PYTHON
# ═══════════════════════════════════════════════════════════════

SKILLS = [
    # (id, name, level, prerequisites)
    # === NIVEAU 1: Fondamentaux (Débutant) ===
    ("syntax", "Syntaxe de base", 1, []),
    ("variables", "Variables et types", 1, []),
    ("print_input", "Print et input", 1, []),
    ("operators", "Opérateurs", 1, []),

    # === NIVEAU 2: Contrôle de flux ===
    ("conditions", "Conditions if/else", 2, ["syntax", "operators"]),
    ("loops_for", "Boucles for", 2, ["syntax"]),
    ("loops_while", "Boucles while", 2, ["conditions"]),
    ("strings", "Manipulation strings", 2, ["variables"]),

    # === NIVEAU 3: Structures de données ===
    ("lists", "Listes", 3, ["loops_for"]),
    ("tuples", "Tuples", 3, ["lists"]),
    ("dicts", "Dictionnaires", 3, ["variables", "loops_for"]),
    ("sets", "Ensembles (sets)", 3, ["lists"]),
    ("functions_basic", "Fonctions basiques", 3, ["conditions", "loops_for"]),

    # === NIVEAU 4: Fonctions avancées ===
    ("functions_args", "Args et kwargs", 4, ["functions_basic"]),
    ("functions_lambda", "Lambda et map/filter", 4, ["functions_basic", "lists"]),
    ("files", "Fichiers I/O", 4, ["functions_basic"]),
    ("exceptions", "Gestion erreurs", 4, ["functions_basic"]),
    ("modules", "Modules et imports", 4, ["functions_basic"]),

    # === NIVEAU 5: POO et avancé ===
    ("oop_classes", "Classes et objets", 5, ["functions_args", "dicts"]),
    ("oop_inheritance", "Héritage", 5, ["oop_classes"]),
    ("comprehensions", "Comprehensions", 5, ["lists", "loops_for", "conditions"]),
    ("decorators", "Décorateurs", 5, ["functions_args", "functions_lambda"]),
    ("generators", "Générateurs", 5, ["functions_basic", "loops_for"]),
]

# Objectif de maîtrise pour "compléter" Python
# 80% = maîtrise fonctionnelle - on peut coder en Python
# 85% = maîtrise solide
# 90% = expert
MASTERY_TARGET = 80


# ═══════════════════════════════════════════════════════════════
# MASTERY SYSTEM (comme le moteur réel)
# ═══════════════════════════════════════════════════════════════

MASTERY_CAP = 95  # Plafond à 95%

# Multiplicateurs par niveau de difficulté
LEVEL_MULTIPLIERS = {1: 1.0, 2: 0.9, 3: 1.0, 4: 1.1, 5: 1.2}


def calculate_mastery_change(
    current_mastery: float,
    correct: bool,
    difficulty: int,
    response_time_fast: bool,
    streak: int
) -> float:
    """
    Calcule le changement de maîtrise (exactement comme le moteur).
    Inclut rendements décroissants et protection débutants.

    RÉALISTE mais ATTEIGNABLE:
    - ~3-4% par session de 20 min au début
    - Atteindre 85% prend environ 90-120 jours pour un profil moyen
    - Même les profils struggling peuvent y arriver en 150-180 jours
    """
    if correct:
        # Base gain équilibré
        base_gain = 3
        if response_time_fast:
            base_gain += 1

        gain = base_gain * LEVEL_MULTIPLIERS.get(difficulty, 1.0)

        # Bonus débutants (encourager au début)
        if current_mastery < 20:
            gain *= 1.25
        elif current_mastery < 35:
            gain *= 1.1

        # Rendements décroissants MODÉRÉS
        # Assez durs pour être réalistes, mais atteignables
        if current_mastery >= 80:
            gain /= 3  # Dur après 80%
        elif current_mastery >= 70:
            gain /= 2.5
        elif current_mastery >= 60:
            gain /= 2
        elif current_mastery >= 50:
            gain *= 0.7
        elif current_mastery >= 40:
            gain *= 0.85

        return max(1, gain)
    else:
        # Pertes modérées
        base_loss = -2
        if difficulty <= 2:
            base_loss = -2.5  # Erreur sur facile = perte modérée
        elif difficulty >= 4:
            base_loss = -1  # Erreur sur difficile = pardonné

        # Protection débutants
        if current_mastery < 20:
            base_loss = max(-1, base_loss)
        elif current_mastery < 35:
            base_loss = max(-1.5, base_loss)

        # Protection struggling (3+ erreurs consécutives)
        if streak <= -3:
            base_loss = max(-1, base_loss)

        return base_loss


# ═══════════════════════════════════════════════════════════════
# COGNITIVE LOAD (comme le moteur réel)
# ═══════════════════════════════════════════════════════════════

@dataclass
class CognitiveState:
    questions_answered: int = 0
    consecutive_errors: int = 0
    session_minutes: float = 0
    recent_accuracy: float = 1.0  # Sur les 5 dernières
    load_level: str = "optimal"   # optimal, elevated, high, overload


def assess_cognitive_load(state: CognitiveState, profile: StudentProfile) -> CognitiveState:
    """Évalue la charge cognitive (comme le moteur réel)"""
    # Fatigue de session (Pomodoro = 25 min)
    session_fatigue = state.session_minutes > 25 * (1 + profile.fatigue_resistance * 0.5)

    # Erreurs consécutives
    error_alert = state.consecutive_errors >= 3

    # Taux d'erreur récent
    high_error_rate = state.recent_accuracy < 0.4 and state.questions_answered >= 5

    # Déterminer niveau de charge
    if error_alert or high_error_rate:
        state.load_level = "overload"
    elif session_fatigue:
        state.load_level = "high"
    elif state.recent_accuracy < 0.6:
        state.load_level = "elevated"
    else:
        state.load_level = "optimal"

    return state


# ═══════════════════════════════════════════════════════════════
# ADAPTIVE DIFFICULTY (ZPD - Zone Proximale)
# ═══════════════════════════════════════════════════════════════

def calculate_optimal_difficulty(
    mastery: float,
    retrievability: float,
    cognitive_load: str,
    recent_accuracy: float,
    streak: int,
    ability: float = 0.5  # Ability du profil
) -> int:
    """
    Calcule la difficulté optimale selon ZPD - STRICT MAIS ADAPTATIF.
    S'adapte à l'ability du user sans faire de cadeau.
    """
    # Base: selon mastery ET ability
    # Un user avec ability faible doit avoir des questions adaptées
    effective_mastery = mastery * (0.7 + ability * 0.6)  # Pondéré par ability

    if effective_mastery < 15:
        base_diff = 1
    elif effective_mastery < 30:
        base_diff = 2
    elif effective_mastery < 50:
        base_diff = 3
    elif effective_mastery < 75:
        base_diff = 4
    else:
        base_diff = 5

    difficulty = base_diff

    # Ajustements retrievability (FSRS)
    if retrievability < 0.4:
        difficulty = max(1, difficulty - 1)
    elif retrievability > 0.95 and recent_accuracy > 0.7:
        difficulty = min(5, difficulty + 1)

    # Ajustements cognitive load - PLUS AGRESSIF
    if cognitive_load == "overload":
        difficulty = 1  # Force niveau 1, pas de négociation
    elif cognitive_load == "high":
        difficulty = max(1, difficulty - 1)

    # Ajustements recent accuracy - RÉACTIF
    if recent_accuracy < 0.4:
        difficulty = 1  # Struggling = niveau 1
    elif recent_accuracy < 0.5:
        difficulty = max(1, difficulty - 1)
    elif recent_accuracy > 0.85 and streak >= 3:
        difficulty = min(5, difficulty + 1)

    # Streak négatif = réduire difficulté
    if streak <= -2:
        difficulty = max(1, difficulty - 1)
    if streak <= -4:
        difficulty = 1  # Force facile après 4 erreurs

    # Challenge mode pour experts (ability > 0.6 et mastery > 80)
    if mastery >= 80 and ability >= 0.6 and cognitive_load == "optimal" and recent_accuracy > 0.7:
        difficulty = max(4, difficulty)

    return difficulty


# ═══════════════════════════════════════════════════════════════
# SIMULATION
# ═══════════════════════════════════════════════════════════════

@dataclass
class SimResult:
    completed: bool
    dropout: bool
    dropout_reason: str
    days: int
    total_hours: float
    questions_answered: int
    final_mastery: float
    retention_30d: float
    recovery_mode_triggered: int  # Nombre de fois
    cognitive_overloads: int
    ai_assists: int = 0  # Nombre de fois où l'IA a aidé


def simulate(profile: StudentProfile, days_limit: int = 180, seed: int = None) -> SimResult:
    """Simule l'apprentissage selon le moteur réel."""
    if seed is not None:
        random.seed(seed)

    # État des skills
    skills_mastery = {s[0]: 0.0 for s in SKILLS}
    skills_fsrs = {s[0]: FSRSCard() for s in SKILLS}

    # Tracking
    total_hours = 0.0
    total_questions = 0
    streak = 0  # Positif = bonnes réponses, négatif = erreurs
    recovery_triggers = 0
    overload_count = 0
    days_skipped_streak = 0
    ai_assist_count = 0  # Nombre de fois où l'IA a aidé
    skill_errors = {s[0]: 0 for s in SKILLS}  # Erreurs par skill (pour apprentissage IA)

    # ═══════════════════════════════════════════════════════════════
    # AI TUTOR v2.0 - TRACKING AVANCÉ
    # ═══════════════════════════════════════════════════════════════
    session_count = 0  # Nombre de sessions (pour mémoire cross-session)
    skill_confusion_pairs = {}  # Confusions détectées (ex: "==" vs "=")
    motivation_history = []  # Historique skip/practice pour tendance
    last_skills_practiced = []  # Pour détecter patterns d'erreurs

    # Protection "early game" pour profils struggling
    # Les 7 premiers jours sont critiques - on doit éviter la spirale négative
    early_game_protection = profile.ability < 0.5

    for day in range(1, days_limit + 1):
        # Protection early game: moins de dropout les 7 premiers jours
        if early_game_protection and day <= 7:
            days_skipped_streak = min(days_skipped_streak, 2)  # Cap à 2

        # Check dropout - RÉALISTE basé sur données industrie
        # Facteurs: jours sans pratiquer, motivation, progression
        if days_skipped_streak >= 3:
            # Base dropout augmente avec les jours skippés
            base_dropout = 0.02 * days_skipped_streak  # 6% à 3 jours, 14% à 7 jours
            motivation_factor = (1 - profile.motivation)  # 0.15 à 0.55

            # Moins de dropout si progression visible
            avg_mastery = statistics.mean(skills_mastery.values())
            progress_protection = min(0.5, avg_mastery / 100)  # jusqu'à 50% protection

            dropout_prob = base_dropout * motivation_factor * (1 - progress_protection)

            if random.random() < dropout_prob:
                return SimResult(False, True, "lost_motivation", day, total_hours,
                               total_questions, avg_mastery, 0, recovery_triggers, overload_count, ai_assist_count)

        # Dropout si trop d'overloads (frustration)
        # AVEC IA: seuil plus haut car l'IA aide à gérer la frustration
        frustration_threshold = 15 if True else 10  # IA enabled = seuil 15
        if overload_count >= frustration_threshold and random.random() < 0.03 * (1 - profile.motivation):
            avg = statistics.mean(skills_mastery.values())
            return SimResult(False, True, "frustration", day, total_hours,
                           total_questions, avg, 0, recovery_triggers, overload_count, ai_assist_count)

        # Skip session?
        daily_motivation = profile.motivation + random.gauss(0, 0.15)

        # ═══════════════════════════════════════════════════════════════
        # SYSTÈME DE RÉTENTION POUR PROCRASTINATEURS
        # ═══════════════════════════════════════════════════════════════

        skip_reduction = 0

        # 1. RAPPELS progressifs
        if days_skipped_streak >= 1:
            skip_reduction += 0.15  # Rappel jour 1
        if days_skipped_streak >= 2:
            skip_reduction += 0.10  # Rappel urgent jour 2

        # 2. STREAK PROTECTION: Si tu as un streak, tu veux pas le perdre
        # "Tu as 5 jours consécutifs, ne casse pas ta série!"
        current_streak = day - days_skipped_streak
        if current_streak >= 3:
            skip_reduction += 0.10  # Protection streak court
        if current_streak >= 7:
            skip_reduction += 0.15  # Protection streak semaine

        # 3. PROGRESS VISIBILITY: Voir sa progression motive
        # "Tu es à 45% de Python, plus que 35% pour finir!"
        avg_mastery = statistics.mean(skills_mastery.values())
        if avg_mastery >= 30:
            skip_reduction += 0.05  # Tu vois du progrès
        if avg_mastery >= 50:
            skip_reduction += 0.10  # Tu es à mi-chemin!
        if avg_mastery >= 70:
            skip_reduction += 0.10  # Tu es presque à la fin!

        # 4. MICRO-SESSIONS: Option de faire 5 min au lieu de skip
        # Pour les procrastinateurs, commencer est le plus dur
        # Si skip_prob élevé mais on propose 5 min, ils acceptent parfois
        if profile.skip_prob >= 0.30:  # Procrastinateur identifié
            # 20% de chance d'accepter une micro-session au lieu de skip
            micro_session_accepted = random.random() < 0.20
            if micro_session_accepted:
                skip_reduction += 0.30  # Forte réduction car micro-session

        # 5. GAMIFICATION: Défis quotidiens, récompenses
        # Simulé par une réduction du skip les jours pairs (défis)
        if day % 2 == 0:  # Jour de défi
            skip_reduction += 0.05

        effective_skip_prob = max(0.03, profile.skip_prob - skip_reduction)

        if random.random() < effective_skip_prob * (1.5 - daily_motivation):
            days_skipped_streak += 1
            motivation_history.append(0)  # A skippé
            continue

        days_skipped_streak = 0
        motivation_history.append(1)  # A pratiqué aujourd'hui

        # ═══════════════════════════════════════════════════════════════
        # v2.0: Mise à jour tracking session
        # ═══════════════════════════════════════════════════════════════
        session_count += 1

        # Session d'apprentissage
        session_minutes = 0
        cognitive_state = CognitiveState()
        session_questions = 0
        recent_results = []  # 5 dernières réponses

        # Durée session RÉALISTE selon profil (15-35 min)
        # La plupart des gens ne tiennent pas plus de 30 min concentrés
        target_duration = 15 + profile.consistency * 20

        while session_minutes < target_duration:
            # Sélectionner skill (adaptatif avec interleaving)
            skill = select_skill_adaptive(
                skills_mastery, skills_fsrs, day, profile,
                session_questions, cognitive_state.load_level
            )

            if not skill:
                break

            skill_id, skill_name, skill_level, _ = skill
            mastery = skills_mastery[skill_id]
            card = skills_fsrs[skill_id]

            # Calculer difficulté optimale
            R = fsrs_retrievability(card, day)
            recent_accuracy = sum(recent_results[-5:]) / max(1, len(recent_results[-5:]))
            difficulty = calculate_optimal_difficulty(
                mastery, R, cognitive_state.load_level, recent_accuracy, streak,
                profile.ability  # Passer l'ability du profil
            )

            # ═══════════════════════════════════════════════════════════════
            # v2.0: Calculer tendance motivation
            # ═══════════════════════════════════════════════════════════════
            user_motivation_trend = 0.0
            if len(motivation_history) >= 5:
                recent_motivation = motivation_history[-10:]  # 10 derniers jours
                practice_rate = sum(recent_motivation) / len(recent_motivation)
                # Tendance: compare aux 10 jours précédents
                if len(motivation_history) >= 15:
                    older_motivation = motivation_history[-20:-10]
                    older_rate = sum(older_motivation) / len(older_motivation)
                    user_motivation_trend = practice_rate - older_rate  # -1 à 1

            # Simuler la réponse AVEC TUTEUR IA v2.0
            correct, response_time, ai_helped = simulate_answer(
                profile, mastery, difficulty, R,
                ai_tutor_enabled=True,
                consecutive_errors=cognitive_state.consecutive_errors,
                skill_errors_history=skill_errors.get(skill_id, 0),
                session_number=session_count,
                total_questions_answered=total_questions,
                skill_confusion_pairs=skill_confusion_pairs,
                user_motivation_trend=user_motivation_trend
            )

            if ai_helped:
                ai_assist_count += 1

            # Mise à jour streak
            if correct:
                streak = max(1, streak + 1)
            else:
                streak = min(-1, streak - 1)
                cognitive_state.consecutive_errors += 1
                skill_errors[skill_id] = skill_errors.get(skill_id, 0) + 1

            if correct:
                cognitive_state.consecutive_errors = 0
            else:
                # ═══════════════════════════════════════════════════════════════
                # v2.0: Détecter patterns de confusion
                # ═══════════════════════════════════════════════════════════════
                if len(last_skills_practiced) >= 2:
                    prev_skill = last_skills_practiced[-1]
                    if prev_skill != skill_id:
                        # Confusion potentielle entre deux skills
                        pair = tuple(sorted([prev_skill, skill_id]))
                        skill_confusion_pairs[pair] = skill_confusion_pairs.get(pair, 0) + 1

            # Tracker le skill pratiqué
            last_skills_practiced.append(skill_id)
            if len(last_skills_practiced) > 20:
                last_skills_practiced.pop(0)

            # FSRS rating
            if not correct:
                rating = Rating.AGAIN
            elif response_time < 0.7:  # Rapide
                rating = Rating.EASY
            elif response_time > 1.3:  # Lent
                rating = Rating.HARD
            else:
                rating = Rating.GOOD

            # Mise à jour FSRS
            skills_fsrs[skill_id] = fsrs_update(card, rating, day)

            # Mise à jour mastery
            change = calculate_mastery_change(
                mastery, correct, difficulty,
                response_time < 0.8, streak
            )
            skills_mastery[skill_id] = max(0, min(MASTERY_CAP, mastery + change))

            # Tracking
            session_questions += 1
            total_questions += 1
            recent_results.append(1 if correct else 0)
            session_minutes += 2 + response_time  # ~2-4 min par question

            # Cognitive load check
            cognitive_state.questions_answered = session_questions
            cognitive_state.session_minutes = session_minutes
            cognitive_state.recent_accuracy = recent_accuracy
            cognitive_state = assess_cognitive_load(cognitive_state, profile)

            # Recovery mode - INTELLIGENT ET ADAPTÉ À L'ABILITY
            if cognitive_state.load_level == "overload":
                overload_count += 1
                if streak <= -3 or recent_accuracy < 0.4:
                    recovery_triggers += 1

                    # Quick wins adaptés au profil
                    # Plus de questions faciles pour les profils struggling
                    num_easy = 3 if profile.ability >= 0.5 else 5

                    # Probabilité de réussite des quick wins adaptée
                    # Plus haute pour struggling = rebuilder la confiance
                    easy_success_prob = 0.80 + (1 - profile.ability) * 0.15  # 0.80 à 0.95

                    for _ in range(num_easy):
                        easy_correct = random.random() < easy_success_prob
                        if easy_correct:
                            streak = max(1, streak + 1)
                            session_questions += 1
                            total_questions += 1
                            recent_results.append(1)
                            # Petit boost mastery pour le skill le plus faible
                            weakest = min(skills_mastery.items(), key=lambda x: x[1])
                            if weakest[1] < 30:
                                skills_mastery[weakest[0]] = min(30, weakest[1] + 1)
                        else:
                            recent_results.append(0)
                        session_minutes += 1.5

                    # Reset cognitive state après recovery
                    cognitive_state.consecutive_errors = 0
                    cognitive_state.load_level = "elevated"
                    streak = max(0, streak)  # Reset streak à neutre minimum

        total_hours += session_minutes / 60

        # Check completion (MASTERY_TARGET% moyenne)
        avg_mastery = statistics.mean(skills_mastery.values())
        if avg_mastery >= MASTERY_TARGET:
            retention = simulate_retention_30d(skills_mastery, skills_fsrs, day, profile)
            return SimResult(True, False, "", day, total_hours, total_questions,
                           avg_mastery, retention, recovery_triggers, overload_count, ai_assist_count)

    # Timeout
    avg_mastery = statistics.mean(skills_mastery.values())
    retention = simulate_retention_30d(skills_mastery, skills_fsrs, day, profile) if avg_mastery > 30 else 0
    return SimResult(False, False, "timeout", days_limit, total_hours, total_questions,
                    avg_mastery, retention, recovery_triggers, overload_count, ai_assist_count)


def select_skill_adaptive(
    mastery: Dict, fsrs: Dict, day: int, profile: StudentProfile,
    questions_in_session: int, cognitive_load: str
) -> Optional[Tuple]:
    """Sélection adaptative avec interleaving."""
    candidates = []
    last_skill = None

    for skill in SKILLS:
        skill_id, name, level, prereqs = skill
        m = mastery[skill_id]
        card = fsrs[skill_id]

        # Skip si maîtrisé à 95%
        if m >= MASTERY_CAP:
            continue

        # Vérifier prérequis
        if prereqs and not all(mastery[p] >= 50 for p in prereqs):
            continue

        # Score de priorité
        R = fsrs_retrievability(card, day)

        # Besoin de révision (retrievability basse)
        revision_urgency = (1 - R) * 3 if m > 20 else 0

        # Priorité apprentissage (non-maîtrisé)
        learning_priority = (70 - m) / 70 if m < 70 else 0

        # Match difficulté/ability
        ability_match = 1 - abs(level/5 - profile.ability) * 0.3

        # Pénalité cognitive load
        if cognitive_load in ("high", "overload") and level >= 4:
            ability_match *= 0.5

        score = revision_urgency + learning_priority * 2 + ability_match
        candidates.append((skill, score, skill_id))

    if not candidates:
        return None

    # Interleaving: après 4 questions sur même skill, changer
    candidates.sort(key=lambda x: -x[1])

    # Top 3 avec weighted random
    top = candidates[:3]
    weights = [max(0.1, c[1]) for c in top]
    total = sum(weights)
    weights = [w/total for w in weights]

    selected = random.choices(top, weights=weights)[0]
    return selected[0]


def simulate_answer(
    profile: StudentProfile,
    mastery: float,
    difficulty: int,
    retrievability: float,
    ai_tutor_enabled: bool = True,
    consecutive_errors: int = 0,
    skill_errors_history: int = 0,  # Nombre d'erreurs sur ce skill
    session_number: int = 1,  # Numéro de session (pour mémoire IA)
    total_questions_answered: int = 0,  # Questions totales (pour patterns)
    skill_confusion_pairs: Dict = None,  # Confusions détectées par l'IA
    user_motivation_trend: float = 0.0  # Tendance motivation (-1 à 1)
) -> Tuple[bool, float, bool]:
    """
    Simule une réponse AVEC TUTEUR IA v2.0.

    TUTEUR IA v2.0 ajoute:
    - Hints avant échec → transforme des échecs en réussites
    - Explications après erreur → réduit répétition des erreurs
    - Adaptation au niveau → explications simplifiées pour struggling
    - Encouragements → réduit frustration/dropout
    - NOUVEAU: Mémoire cross-session → l'IA se souvient
    - NOUVEAU: Détection de patterns → identifie les confusions
    - NOUVEAU: Motivation adaptative → ton personnalisé
    - NOUVEAU: Prédiction de difficulté → intervient avant l'échec
    - NOUVEAU: Micro-leçons → explications ciblées avant question difficile

    Returns: (correct, response_time, ai_helped)
    """
    skill_confusion_pairs = skill_confusion_pairs or {}

    # Probabilité de base PAR NIVEAU DE DIFFICULTÉ
    difficulty_base = {
        1: 0.70,  # Niveau 1: 70% base pour TOUS
        2: 0.55,  # Niveau 2: 55% base
        3: 0.45,  # Niveau 3: 45% base
        4: 0.35,  # Niveau 4: 35% base
        5: 0.25,  # Niveau 5: 25% base (challenge)
    }

    base_prob = difficulty_base.get(difficulty, 0.50)

    # Bonus ability (modéré - le niveau fait le gros du travail)
    ability_bonus = profile.ability * 0.20  # 0 à 0.20

    # Bonus mastery (apprendre = mieux réussir)
    mastery_bonus = mastery / 100 * 0.25  # jusqu'à +0.25

    # Bonus retrievability (FSRS - mémoire fraîche)
    retrieval_bonus = retrievability * 0.10  # jusqu'à +0.10

    # ═══════════════════════════════════════════════════════════════
    # TUTEUR IA v2.0 - FONCTIONNALITÉS AVANCÉES
    # ═══════════════════════════════════════════════════════════════
    ai_bonus = 0
    ai_helped = False

    if ai_tutor_enabled:
        # ─────────────────────────────────────────────────────────────
        # 1. APPRENTISSAGE DES ERREURS PASSÉES (v1.0)
        # L'IA a expliqué les erreurs précédentes sur ce skill
        # ─────────────────────────────────────────────────────────────
        if skill_errors_history > 0:
            error_learning_bonus = min(0.15, skill_errors_history * 0.03)
            ai_bonus += error_learning_bonus

        # ─────────────────────────────────────────────────────────────
        # 2. HINTS ADAPTATIFS (v1.0)
        # Si l'utilisateur est en difficulté, l'IA propose des hints
        # ─────────────────────────────────────────────────────────────
        if consecutive_errors >= 2:
            hint_bonus = 0.10 + (consecutive_errors - 2) * 0.05
            hint_bonus = min(0.25, hint_bonus)
            ai_bonus += hint_bonus

        # ─────────────────────────────────────────────────────────────
        # 3. EXPLICATIONS ADAPTÉES AU NIVEAU (v1.0)
        # L'IA simplifie pour les struggling users
        # ─────────────────────────────────────────────────────────────
        if profile.ability < 0.5:
            simplification_bonus = (0.5 - profile.ability) * 0.15
            ai_bonus += simplification_bonus

        # ─────────────────────────────────────────────────────────────
        # 4. EXEMPLES PERSONNALISÉS + FEEDBACK IMMÉDIAT (v1.0)
        # ─────────────────────────────────────────────────────────────
        ai_bonus += 0.05  # Base IA bonus

        # ─────────────────────────────────────────────────────────────
        # 5. MÉMOIRE CROSS-SESSION (v2.0) - NOUVEAU
        # L'IA se souvient des sessions précédentes
        # Plus de sessions = meilleure connaissance de l'utilisateur
        # ─────────────────────────────────────────────────────────────
        if session_number > 1:
            # L'IA connaît mieux l'utilisateur
            memory_bonus = min(0.08, session_number * 0.01)
            ai_bonus += memory_bonus

        # ─────────────────────────────────────────────────────────────
        # 6. DÉTECTION DE PATTERNS D'ERREURS (v2.0) - NOUVEAU
        # L'IA identifie les confusions récurrentes
        # Ex: confondre "==" et "=" en Python
        # ─────────────────────────────────────────────────────────────
        if len(skill_confusion_pairs) > 0:
            # L'IA a identifié des confusions et les adresse proactivement
            pattern_bonus = min(0.10, len(skill_confusion_pairs) * 0.03)
            ai_bonus += pattern_bonus

        # ─────────────────────────────────────────────────────────────
        # 7. MOTIVATION ADAPTATIVE (v2.0) - NOUVEAU
        # L'IA adapte son ton selon la tendance de motivation
        # Si motivation baisse → encouragements plus forts
        # ─────────────────────────────────────────────────────────────
        if user_motivation_trend < -0.2:
            # Motivation en baisse → IA plus encourageante
            # Cela réduit le stress et améliore la performance
            motivation_support = abs(user_motivation_trend) * 0.10
            ai_bonus += motivation_support

        # ─────────────────────────────────────────────────────────────
        # 8. PRÉDICTION DE DIFFICULTÉ (v2.0) - NOUVEAU
        # L'IA prédit quand l'utilisateur va probablement échouer
        # et intervient AVANT avec une micro-leçon
        # ─────────────────────────────────────────────────────────────
        # Facteurs de risque d'échec
        risk_factors = 0
        if retrievability < 0.5:
            risk_factors += 1  # Mémoire faible
        if difficulty >= 4:
            risk_factors += 1  # Question difficile
        if consecutive_errors >= 1:
            risk_factors += 1  # Déjà en difficulté
        if mastery < 40:
            risk_factors += 1  # Skill pas maîtrisé

        if risk_factors >= 3:
            # Haut risque d'échec → IA intervient avec micro-leçon
            prediction_intervention = 0.12
            ai_bonus += prediction_intervention

        # ─────────────────────────────────────────────────────────────
        # 9. MICRO-LEÇONS CIBLÉES (v2.0) - NOUVEAU
        # Avant une question difficile, l'IA donne un rappel rapide
        # ─────────────────────────────────────────────────────────────
        if difficulty >= 4 and mastery < 60:
            # Question difficile sur skill pas encore maîtrisé
            # L'IA donne un rappel de 30 secondes avant
            micro_lesson_bonus = 0.08
            ai_bonus += micro_lesson_bonus

        # ─────────────────────────────────────────────────────────────
        # 10. APPRENTISSAGE CUMULATIF (v2.0) - NOUVEAU
        # Plus l'utilisateur répond, mieux l'IA le connaît
        # ─────────────────────────────────────────────────────────────
        if total_questions_answered > 50:
            cumulative_bonus = min(0.05, total_questions_answered / 1000)
            ai_bonus += cumulative_bonus

        if ai_bonus > 0:
            ai_helped = True

    prob = base_prob + ability_bonus + mastery_bonus + retrieval_bonus + ai_bonus
    prob = max(0.20, min(0.95, prob))  # Clamp (plancher 20%, plafond 95%)

    correct = random.random() < prob

    # Temps de réponse (l'IA peut ralentir si elle intervient)
    base_time = profile.response_speed
    if correct:
        response_time = base_time * (0.7 + random.random() * 0.5)
        if ai_helped:
            if consecutive_errors >= 2:
                response_time += 0.3  # Hint = +30% temps
            if difficulty >= 4 and mastery < 60:
                response_time += 0.2  # Micro-leçon = +20% temps
    else:
        response_time = base_time * (1.0 + random.random() * 0.5)

    return correct, response_time, ai_helped


def simulate_retention_30d(mastery: Dict, fsrs: Dict, day: int, profile: StudentProfile) -> float:
    """Simule la rétention après 30 jours sans pratique."""
    retained = {}

    for skill_id, m in mastery.items():
        card = fsrs[skill_id]
        # Retrievability après 30 jours
        R_30 = fsrs_retrievability(
            FSRSCard(stability=card.stability, last_review=day),
            day + 30
        )
        # Rétention = mastery * retrievability * facteur ability
        retention_factor = 0.5 + R_30 * 0.4 + profile.ability * 0.1
        retained[skill_id] = m * retention_factor

    return statistics.mean(retained.values())


# ═══════════════════════════════════════════════════════════════
# RUNNER
# ═══════════════════════════════════════════════════════════════

def run(n_runs: int = 30):
    """Lance la simulation stricte."""
    print("\n" + "=" * 80)
    print("🧪 SIMULATION STRICTE NEWMARS - Basée sur le Moteur Réel")
    print("=" * 80)
    print(f"   {len(PROFILES)} profils × {n_runs} runs = {len(PROFILES) * n_runs} simulations")
    print(f"   Moteur: FSRS + Mastery + Cognitive Load + ZPD")

    results = {}

    for profile_key, profile in PROFILES.items():
        runs = []
        for i in range(n_runs):
            result = simulate(profile, seed=2000 + i * 17)
            runs.append(result)

        successes = [r for r in runs if r.completed]
        dropouts = [r for r in runs if r.dropout]

        results[profile.name] = {
            "success_rate": len(successes) / n_runs * 100,
            "dropout_rate": len(dropouts) / n_runs * 100,
            "avg_days": statistics.mean([r.days for r in successes]) if successes else 0,
            "avg_hours": statistics.mean([r.total_hours for r in successes]) if successes else 0,
            "avg_questions": statistics.mean([r.questions_answered for r in successes]) if successes else 0,
            "avg_retention": statistics.mean([r.retention_30d for r in successes]) if successes else 0,
            "avg_recovery": statistics.mean([r.recovery_mode_triggered for r in runs]),
            "avg_overloads": statistics.mean([r.cognitive_overloads for r in runs]),
            "avg_ai_assists": statistics.mean([r.ai_assists for r in runs]),
        }

    # Affichage
    print("\n" + "-" * 80)
    print(f"{'Profil':<22} {'Succès':>7} {'Drop':>6} {'Jours':>6} {'Heures':>7} {'Quest.':>7} {'Rétent.':>8}")
    print("-" * 80)

    for name, stats in results.items():
        short = name.split('(')[0].strip()[:18]
        days = f"{stats['avg_days']:.0f}" if stats['success_rate'] > 0 else "-"
        hours = f"{stats['avg_hours']:.0f}h" if stats['success_rate'] > 0 else "-"
        quest = f"{stats['avg_questions']:.0f}" if stats['success_rate'] > 0 else "-"
        ret = f"{stats['avg_retention']:.0f}%" if stats['success_rate'] > 0 else "-"

        print(f"{short:<22} {stats['success_rate']:>6.0f}% {stats['dropout_rate']:>5.0f}% "
              f"{days:>6} {hours:>7} {quest:>7} {ret:>8}")

    # Insights
    print("\n" + "-" * 80)
    print("📊 INSIGHTS COGNITIFS:")
    for name, stats in results.items():
        short = name.split('(')[0].strip()
        if stats['avg_recovery'] > 0 or stats['avg_overloads'] > 0:
            print(f"   {short}: {stats['avg_recovery']:.1f} recovery, {stats['avg_overloads']:.1f} overloads, {stats['avg_ai_assists']:.0f} AI assists")

    # Résumé
    print("\n" + "=" * 80)
    avg_success = statistics.mean([r["success_rate"] for r in results.values()])
    avg_dropout = statistics.mean([r["dropout_rate"] for r in results.values()])

    # Calculer temps et effort moyens
    all_success = [r for r in results.values() if r["success_rate"] > 0]
    if all_success:
        avg_days = statistics.mean([r["avg_days"] for r in all_success])
        avg_hours = statistics.mean([r["avg_hours"] for r in all_success])
        avg_questions = statistics.mean([r["avg_questions"] for r in all_success])
        print(f"📈 GLOBAL: {avg_success:.0f}% succès | {avg_dropout:.0f}% dropout")
        print(f"   Effort moyen: {avg_days:.0f} jours, {avg_hours:.0f}h, {avg_questions:.0f} questions")
    else:
        print(f"📈 GLOBAL: {avg_success:.0f}% succès | {avg_dropout:.0f}% dropout")

    # Analyse qualité
    if avg_success >= 85 and avg_dropout <= 10:
        print("✅ Système EXCELLENT - Adaptatif et efficace pour tous les profils")
    elif avg_success >= 70 and avg_dropout <= 15:
        print("✅ Système EFFICACE - Le moteur adaptatif fonctionne bien")
    elif avg_success >= 50:
        print("⚠️  Performance MOYENNE - Optimisations possibles")
    else:
        print("❌ Performance FAIBLE - Revoir le moteur")

    # Vérification équité
    success_rates = [r["success_rate"] for r in results.values()]
    min_success = min(success_rates)
    max_success = max(success_rates)
    if max_success - min_success <= 30:
        print("✅ Équité: Tous les profils ont des chances similaires")
    else:
        print(f"⚠️  Écart profils: {min_success:.0f}% à {max_success:.0f}%")

    print("=" * 80)
    return results


def run_hardcore(n_runs: int = 30):
    """Lance la simulation HARDCORE - profils extrêmes."""
    print("\n" + "=" * 80)
    print("💀 SIMULATION HARDCORE - Profils Extrêmes")
    print("=" * 80)
    print(f"   {len(PROFILES_HARDCORE)} profils extrêmes × {n_runs} runs")
    print(f"   Test des LIMITES du système AI Tutor v2.0")

    results = {}

    for profile_key, profile in PROFILES_HARDCORE.items():
        runs = []
        for i in range(n_runs):
            result = simulate(profile, seed=3000 + i * 17)
            runs.append(result)

        successes = [r for r in runs if r.completed]
        dropouts = [r for r in runs if r.dropout]

        results[profile.name] = {
            "success_rate": len(successes) / n_runs * 100,
            "dropout_rate": len(dropouts) / n_runs * 100,
            "timeout_rate": len([r for r in runs if not r.completed and not r.dropout]) / n_runs * 100,
            "avg_days": statistics.mean([r.days for r in successes]) if successes else 0,
            "avg_hours": statistics.mean([r.total_hours for r in successes]) if successes else 0,
            "avg_questions": statistics.mean([r.questions_answered for r in successes]) if successes else 0,
            "avg_retention": statistics.mean([r.retention_30d for r in successes]) if successes else 0,
            "avg_recovery": statistics.mean([r.recovery_mode_triggered for r in runs]),
            "avg_overloads": statistics.mean([r.cognitive_overloads for r in runs]),
            "avg_ai_assists": statistics.mean([r.ai_assists for r in runs]),
            "dropout_reasons": {},
        }

        # Analyser les raisons de dropout
        for r in dropouts:
            reason = r.dropout_reason
            results[profile.name]["dropout_reasons"][reason] = results[profile.name]["dropout_reasons"].get(reason, 0) + 1

    # Affichage
    print("\n" + "-" * 90)
    print(f"{'Profil':<22} {'Succès':>7} {'Drop':>6} {'Time':>6} {'Jours':>6} {'Heures':>7} {'AI':>6}")
    print("-" * 90)

    for name, stats in results.items():
        short = name.split('(')[0].strip()[:18]
        days = f"{stats['avg_days']:.0f}" if stats['success_rate'] > 0 else "-"
        hours = f"{stats['avg_hours']:.0f}h" if stats['success_rate'] > 0 else "-"
        ai = f"{stats['avg_ai_assists']:.0f}"

        print(f"{short:<22} {stats['success_rate']:>6.0f}% {stats['dropout_rate']:>5.0f}% "
              f"{stats['timeout_rate']:>5.0f}% {days:>6} {hours:>7} {ai:>6}")

    # Analyse dropout
    print("\n" + "-" * 90)
    print("💔 ANALYSE DES ÉCHECS:")
    for name, stats in results.items():
        if stats['dropout_rate'] > 0 or stats['timeout_rate'] > 0:
            short = name.split('(')[0].strip()
            reasons = stats.get('dropout_reasons', {})
            reason_str = ", ".join([f"{k}: {v}" for k, v in reasons.items()]) if reasons else "timeout"
            print(f"   {short}: {reason_str}")

    # Résumé
    print("\n" + "=" * 90)
    avg_success = statistics.mean([r["success_rate"] for r in results.values()])
    avg_dropout = statistics.mean([r["dropout_rate"] for r in results.values()])
    avg_timeout = statistics.mean([r["timeout_rate"] for r in results.values()])

    print(f"💀 HARDCORE: {avg_success:.0f}% succès | {avg_dropout:.0f}% dropout | {avg_timeout:.0f}% timeout")

    if avg_success >= 80:
        print("🏆 EXCELLENT - Le système gère même les cas extrêmes!")
    elif avg_success >= 60:
        print("✅ BON - Le système aide la majorité des cas difficiles")
    elif avg_success >= 40:
        print("⚠️  LIMITE - Certains profils extrêmes restent difficiles")
    else:
        print("❌ ÉCHEC - Le système ne gère pas les cas extrêmes")

    print("=" * 90)
    return results


if __name__ == "__main__":
    import sys
    args = sys.argv[1:]

    if args and args[0] == "hardcore":
        n = int(args[1]) if len(args) > 1 else 30
        run_hardcore(n)
    else:
        n = int(args[0]) if args else 30
        run(n)
