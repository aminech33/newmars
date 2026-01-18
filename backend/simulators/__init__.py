"""
Simulators - Test du moteur d'apprentissage NewMars
===================================================

Ce module permet de tester le VRAI moteur d'apprentissage
avec des profils d'étudiants simulés.

Usage:
    from simulators import simulate, run, PROFILES, StudentProfile

    # Simulation unique
    result = simulate(PROFILES["average"], days_limit=60)

    # Batch de simulations
    results = run(n_runs=10)

    # CLI
    python -m simulators --runs 10 --days 60
"""

from .config import (
    SKILLS,
    MASTERY_TARGET,
    MASTERY_CAP,
    DEFAULT_DAYS_LIMIT,
    DEFAULT_N_RUNS,
)
from .profiles import StudentProfile, PROFILES, PROFILES_HARDCORE
from .connected import simulate, run, run_hardcore, SimResult, main

__all__ = [
    # Config
    "SKILLS",
    "MASTERY_TARGET",
    "MASTERY_CAP",
    "DEFAULT_DAYS_LIMIT",
    "DEFAULT_N_RUNS",
    # Profiles
    "StudentProfile",
    "PROFILES",
    "PROFILES_HARDCORE",
    # Simulation
    "simulate",
    "run",
    "run_hardcore",
    "SimResult",
    "main",
]
