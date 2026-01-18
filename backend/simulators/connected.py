"""
Simulateur connecté au vrai moteur d'apprentissage
==================================================

Ce module permet de tester le VRAI moteur (learning_engine_lean.py)
avec des profils d'étudiants simulés.

AVANTAGES:
- Teste le vrai code, pas une copie
- Détecte les bugs/régressions du moteur
- Garantit que les simulations reflètent le comportement réel

USAGE:
    from simulators import simulate, run, PROFILES

    # Simulation unique avec le vrai moteur
    result = simulate(PROFILES["average"], days_limit=60)

    # Batch de simulations
    results = run(n_runs=10)
"""

import random
import statistics
import tempfile
import os
from dataclasses import dataclass, field
from typing import Dict, List, Optional

# Import du vrai moteur
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.learning_engine_lean import LeanLearningEngine

from .config import (
    SKILLS,
    MASTERY_TARGET,
    MASTERY_CAP,
    DEFAULT_DAYS_LIMIT,
    DEFAULT_N_RUNS,
    SKIP_DAYS_THRESHOLD,
    DROPOUT_BASE_PER_DAY,
    PROGRESS_PROTECTION_MAX,
)
from .profiles import StudentProfile, PROFILES, PROFILES_HARDCORE


@dataclass
class SimResult:
    """
    Résultat d'une simulation.

    Attributes:
        completed: A atteint l'objectif de maîtrise?
        dropout: A abandonné?
        dropout_reason: Raison du dropout
        days: Nombre de jours
        total_hours: Heures totales d'étude
        questions_answered: Questions répondues
        final_mastery: Maîtrise finale moyenne
        retention_30d: Rétention après 30 jours (estimation)
        recovery_mode_triggered: Fois où recovery a été déclenché
        cognitive_overloads: Nombre de surcharges cognitives
    """
    completed: bool
    dropout: bool
    dropout_reason: str
    days: int
    total_hours: float
    questions_answered: int
    final_mastery: float
    retention_30d: float
    recovery_mode_triggered: int
    cognitive_overloads: int


def simulate(
    profile: StudentProfile,
    days_limit: int = DEFAULT_DAYS_LIMIT,
    seed: Optional[int] = None,
) -> SimResult:
    """
    Simule l'apprentissage en utilisant le VRAI moteur d'apprentissage.

    Args:
        profile: Profil de l'étudiant simulé
        days_limit: Limite de jours
        seed: Seed pour reproductibilité

    Returns:
        SimResult avec les métriques
    """
    if seed is not None:
        random.seed(seed)

    # Créer une DB temporaire pour ce run
    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp:
        db_path = tmp.name

    try:
        # Initialiser le VRAI moteur
        engine = LeanLearningEngine(db_path=db_path)
        user_id = f"sim_{profile.name}_{seed or random.randint(0, 99999)}"

        # Tracking
        total_hours = 0.0
        total_questions = 0
        recovery_triggers = 0
        overload_count = 0
        days_skipped_streak = 0

        # Mastery par skill (pour suivre la progression)
        skills_mastery = {s[0]: 0 for s in SKILLS}

        for day in range(1, days_limit + 1):
            # Check dropout
            if days_skipped_streak >= SKIP_DAYS_THRESHOLD:
                avg_mastery = statistics.mean(skills_mastery.values())
                base_dropout = DROPOUT_BASE_PER_DAY * days_skipped_streak
                motivation_factor = (1 - profile.motivation)
                progress_protection = min(PROGRESS_PROTECTION_MAX, avg_mastery / 100)
                dropout_prob = base_dropout * motivation_factor * (1 - progress_protection)

                if random.random() < dropout_prob:
                    return SimResult(
                        completed=False,
                        dropout=True,
                        dropout_reason="lost_motivation",
                        days=day,
                        total_hours=total_hours,
                        questions_answered=total_questions,
                        final_mastery=avg_mastery,
                        retention_30d=0,
                        recovery_mode_triggered=recovery_triggers,
                        cognitive_overloads=overload_count,
                    )

            # Skip session?
            daily_motivation = profile.motivation + random.gauss(0, profile.motivation_variance)
            effective_skip_prob = max(0.03, profile.skip_prob * (1.5 - daily_motivation))

            if random.random() < effective_skip_prob:
                days_skipped_streak += 1
                continue

            days_skipped_streak = 0

            # Session d'apprentissage
            session_minutes = 0
            target_duration = 15 + profile.consistency * 20

            while session_minutes < target_duration:
                # Sélectionner un skill (priorité au moins maîtrisé)
                available = [(s[0], skills_mastery[s[0]]) for s in SKILLS if skills_mastery[s[0]] < MASTERY_CAP]
                if not available:
                    break

                available.sort(key=lambda x: x[1])
                skill_id = available[0][0]
                current_mastery = skills_mastery[skill_id]

                # Utiliser le VRAI moteur pour obtenir la difficulté
                question_params = engine.get_next_question(
                    user_id=user_id,
                    topic_id=skill_id,
                    current_mastery=int(current_mastery)
                )

                difficulty = question_params.difficulty

                # Simuler si l'étudiant répond correctement
                # Probabilité basée sur ability + mastery + difficulté
                base_prob = {1: 0.85, 2: 0.75, 3: 0.60, 4: 0.45, 5: 0.30}[difficulty]
                ability_bonus = profile.ability * 0.15
                mastery_bonus = current_mastery / 100 * 0.20
                prob = min(0.95, max(0.15, base_prob + ability_bonus + mastery_bonus))

                correct = random.random() < prob
                response_time = profile.response_speed * (0.8 + random.random() * 0.4)

                # Utiliser le VRAI moteur pour traiter la réponse
                result = engine.process_answer(
                    user_id=user_id,
                    topic_id=skill_id,
                    is_correct=correct,
                    response_time=response_time,
                    difficulty=difficulty
                )

                # Mettre à jour mastery locale
                skills_mastery[skill_id] = max(0, min(MASTERY_CAP,
                    current_mastery + result.mastery_change))

                # Tracking
                total_questions += 1
                session_minutes += 2 + response_time

                # Check cognitive overload
                if question_params.cognitive_load == "overload":
                    overload_count += 1

                if question_params.should_take_break:
                    recovery_triggers += 1
                    break

            total_hours += session_minutes / 60

            # Sauvegarder l'état du moteur
            engine.save_state(user_id)

            # Check completion
            avg_mastery = statistics.mean(skills_mastery.values())
            if avg_mastery >= MASTERY_TARGET:
                return SimResult(
                    completed=True,
                    dropout=False,
                    dropout_reason="",
                    days=day,
                    total_hours=total_hours,
                    questions_answered=total_questions,
                    final_mastery=avg_mastery,
                    retention_30d=avg_mastery * 0.8,
                    recovery_mode_triggered=recovery_triggers,
                    cognitive_overloads=overload_count,
                )

        # Timeout
        avg_mastery = statistics.mean(skills_mastery.values())
        return SimResult(
            completed=False,
            dropout=False,
            dropout_reason="timeout",
            days=days_limit,
            total_hours=total_hours,
            questions_answered=total_questions,
            final_mastery=avg_mastery,
            retention_30d=avg_mastery * 0.7 if avg_mastery > 30 else 0,
            recovery_mode_triggered=recovery_triggers,
            cognitive_overloads=overload_count,
        )

    finally:
        # Nettoyer la DB temporaire
        try:
            os.unlink(db_path)
        except:
            pass


def run(
    n_runs: int = DEFAULT_N_RUNS,
    days_limit: int = DEFAULT_DAYS_LIMIT,
    profiles_dict: Optional[Dict[str, StudentProfile]] = None,
    title: str = "SIMULATION NEWMARS"
) -> Dict:
    """
    Lance des simulations avec le VRAI moteur.

    Args:
        n_runs: Nombre de runs par profil
        days_limit: Limite de jours
        profiles_dict: Dict de profils (défaut: PROFILES standard)
        title: Titre à afficher

    Returns:
        Dict avec résultats par profil
    """
    if profiles_dict is None:
        profiles_dict = PROFILES

    print("\n" + "=" * 80)
    print(f"{title} - Moteur RÉEL")
    print("=" * 80)
    print(f"   {len(profiles_dict)} profils x {n_runs} runs")
    print(f"   Moteur: LeanLearningEngine v4.3")
    print(f"   Objectif: {MASTERY_TARGET}% mastery en {days_limit} jours max")

    results = {}

    for profile_key, profile in profiles_dict.items():
        runs = []
        for i in range(n_runs):
            result = simulate(profile, days_limit=days_limit, seed=4000 + i * 17)
            runs.append(result)

        successes = [r for r in runs if r.completed]
        dropouts = [r for r in runs if r.dropout]

        results[profile.name] = {
            "success_rate": len(successes) / n_runs * 100,
            "dropout_rate": len(dropouts) / n_runs * 100,
            "timeout_rate": len([r for r in runs if not r.completed and not r.dropout]) / n_runs * 100,
            "avg_days": statistics.mean([r.days for r in successes]) if successes else 0,
            "avg_hours": statistics.mean([r.total_hours for r in successes]) if successes else 0,
            "avg_mastery": statistics.mean([r.final_mastery for r in runs]),
            "avg_questions": statistics.mean([r.questions_answered for r in runs]),
            "avg_recovery": statistics.mean([r.recovery_mode_triggered for r in runs]),
            "avg_overloads": statistics.mean([r.cognitive_overloads for r in runs]),
        }

    # Affichage
    print("\n" + "-" * 85)
    print(f"{'Profil':<22} {'Succès':>7} {'Drop':>6} {'Time':>6} {'Jours':>6} {'Mastery':>8} {'Quest.':>7}")
    print("-" * 85)

    for name, stats in results.items():
        short = name.split('(')[0].strip()[:18]
        days = f"{stats['avg_days']:.0f}" if stats['success_rate'] > 0 else "-"

        print(f"{short:<22} {stats['success_rate']:>6.0f}% {stats['dropout_rate']:>5.0f}% "
              f"{stats['timeout_rate']:>5.0f}% {days:>6} {stats['avg_mastery']:>7.0f}% {stats['avg_questions']:>7.0f}")

    # Résumé
    print("\n" + "=" * 85)
    avg_success = statistics.mean([r["success_rate"] for r in results.values()])
    avg_dropout = statistics.mean([r["dropout_rate"] for r in results.values()])
    avg_mastery = statistics.mean([r["avg_mastery"] for r in results.values()])

    print(f"GLOBAL: {avg_success:.0f}% succès | {avg_dropout:.0f}% dropout | {avg_mastery:.0f}% mastery moyenne")

    if avg_success >= 85 and avg_dropout <= 10:
        print("Système EXCELLENT")
    elif avg_success >= 70 and avg_dropout <= 15:
        print("Système EFFICACE")
    elif avg_success >= 50:
        print("Performance MOYENNE")
    else:
        print("Performance FAIBLE - le moteur doit être amélioré")

    print("=" * 85)
    return results


def run_hardcore(n_runs: int = DEFAULT_N_RUNS, days_limit: int = DEFAULT_DAYS_LIMIT) -> Dict:
    """Lance la simulation pour les profils hardcore."""
    return run(n_runs=n_runs, days_limit=days_limit, profiles_dict=PROFILES_HARDCORE,
               title="SIMULATION HARDCORE")


def main():
    """Point d'entrée CLI."""
    import argparse

    parser = argparse.ArgumentParser(
        description="NewMars Simulator - Test du moteur d'apprentissage réel"
    )
    parser.add_argument(
        "--days", type=int, default=DEFAULT_DAYS_LIMIT,
        help=f"Limite en jours (défaut: {DEFAULT_DAYS_LIMIT})"
    )
    parser.add_argument(
        "--runs", type=int, default=DEFAULT_N_RUNS,
        help=f"Nombre de runs par profil (défaut: {DEFAULT_N_RUNS})"
    )
    parser.add_argument(
        "--hardcore", action="store_true",
        help="Utiliser les profils extrêmes"
    )
    parser.add_argument(
        "--profile", type=str,
        help="Simuler un seul profil (ex: determined, average, burnout)"
    )
    parser.add_argument(
        "--all", action="store_true",
        help="Tous les profils (standard + hardcore)"
    )

    args = parser.parse_args()

    all_profiles = {**PROFILES, **PROFILES_HARDCORE}

    if args.profile:
        profile_key = args.profile.lower()
        if profile_key in all_profiles:
            profiles = {profile_key: all_profiles[profile_key]}
            title = f"SIMULATION - {all_profiles[profile_key].name}"
        else:
            print(f"Profil '{args.profile}' non trouvé")
            print(f"Disponibles: {list(all_profiles.keys())}")
            return
    elif args.all:
        profiles = all_profiles
        title = "SIMULATION COMPLÈTE"
    elif args.hardcore:
        profiles = PROFILES_HARDCORE
        title = "SIMULATION HARDCORE"
    else:
        profiles = PROFILES
        title = "SIMULATION STANDARD"

    run(n_runs=args.runs, days_limit=args.days, profiles_dict=profiles, title=title)


if __name__ == "__main__":
    main()
