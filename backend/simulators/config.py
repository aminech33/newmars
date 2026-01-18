"""
Configuration centralisée pour les simulateurs NewMars
======================================================

Toutes les constantes et paramètres de simulation sont définis ici.
Modifiez ce fichier pour ajuster le comportement global des simulateurs.

IMPORTANT: Ne jamais dupliquer ces constantes ailleurs!
"""

# ═══════════════════════════════════════════════════════════════════════════════
# FSRS - FREE SPACED REPETITION SCHEDULER
# Paramètres optimisés (17 poids) - Anki v23+ compatible
# ═══════════════════════════════════════════════════════════════════════════════

FSRS_WEIGHTS = {
    'w0': 0.4,   'w1': 0.6,   'w2': 2.4,   'w3': 5.8,
    'w4': 4.93,  'w5': 0.94,  'w6': 0.86,  'w7': 0.01,
    'w8': 1.49,  'w9': 0.14,  'w10': 0.94, 'w11': 2.18,
    'w12': 0.05, 'w13': 0.34, 'w14': 1.26, 'w15': 0.29,
    'w16': 2.61,
}

# Cible de rétention (90% = on veut retenir 90% du contenu)
REQUEST_RETENTION = 0.9


# ═══════════════════════════════════════════════════════════════════════════════
# MASTERY SYSTEM
# Système de maîtrise avec rendements décroissants
# ═══════════════════════════════════════════════════════════════════════════════

# Objectif de maîtrise pour "compléter" un sujet
# 80% = maîtrise fonctionnelle - on peut coder
# 85% = maîtrise solide
# 90% = expert
MASTERY_TARGET = 80

# Plafond de maîtrise (impossible d'aller au-delà)
MASTERY_CAP = 95

# Multiplicateurs par niveau de difficulté (1-5)
LEVEL_MULTIPLIERS = {
    1: 1.0,   # Débutant
    2: 0.9,   # Facile
    3: 1.0,   # Moyen
    4: 1.1,   # Difficile
    5: 1.2,   # Expert
}


# ═══════════════════════════════════════════════════════════════════════════════
# COGNITIVE LOAD
# Paramètres de détection de charge cognitive
# ═══════════════════════════════════════════════════════════════════════════════

# Durée de session optimale (Pomodoro = 25 min)
SESSION_OPTIMAL_MINUTES = 25

# Seuil d'erreurs consécutives pour déclencher alerte
CONSECUTIVE_ERRORS_THRESHOLD = 3

# Seuil de précision récente pour overload
ACCURACY_OVERLOAD_THRESHOLD = 0.4

# Seuil de précision pour niveau "elevated"
ACCURACY_ELEVATED_THRESHOLD = 0.6

# Questions minimum avant évaluation de précision
MIN_QUESTIONS_FOR_ACCURACY = 5


# ═══════════════════════════════════════════════════════════════════════════════
# AI TUTOR
# Paramètres du tuteur IA
# ═══════════════════════════════════════════════════════════════════════════════

# Bonus de base de l'IA (toujours actif)
AI_BASE_BONUS = 0.05

# Bonus max pour apprentissage des erreurs passées
AI_ERROR_LEARNING_MAX = 0.15
AI_ERROR_LEARNING_PER_ERROR = 0.03

# Bonus pour hints après erreurs consécutives
AI_HINT_BASE = 0.10
AI_HINT_PER_ERROR = 0.05
AI_HINT_MAX = 0.25

# Bonus pour simplification (users struggling)
AI_SIMPLIFICATION_FACTOR = 0.15

# Bonus pour mémoire cross-session
AI_MEMORY_PER_SESSION = 0.01
AI_MEMORY_MAX = 0.08

# Bonus pour patterns détectés
AI_PATTERN_PER_DETECTION = 0.03
AI_PATTERN_MAX = 0.10

# Bonus pour support motivation
AI_MOTIVATION_FACTOR = 0.10

# Bonus pour intervention prédictive (haut risque)
AI_PREDICTION_BONUS = 0.12

# Bonus pour micro-leçons
AI_MICROLESSON_BONUS = 0.08


# ═══════════════════════════════════════════════════════════════════════════════
# SIMULATION
# Paramètres généraux de simulation
# ═══════════════════════════════════════════════════════════════════════════════

# Durée max de simulation en jours
DEFAULT_DAYS_LIMIT = 180

# Nombre de runs par défaut
DEFAULT_N_RUNS = 30

# Probabilité de base par niveau de difficulté
DIFFICULTY_BASE_PROB = {
    1: 0.70,  # Niveau 1: 70% base pour TOUS
    2: 0.55,  # Niveau 2: 55% base
    3: 0.45,  # Niveau 3: 45% base
    4: 0.35,  # Niveau 4: 35% base
    5: 0.25,  # Niveau 5: 25% base (challenge)
}

# Probabilité min/max de réussite
PROB_MIN = 0.20
PROB_MAX = 0.95

# Seuil de frustration (overloads avant dropout possible)
FRUSTRATION_THRESHOLD_WITH_AI = 15
FRUSTRATION_THRESHOLD_WITHOUT_AI = 10


# ═══════════════════════════════════════════════════════════════════════════════
# DROPOUT
# Paramètres de dropout
# ═══════════════════════════════════════════════════════════════════════════════

# Jours sans pratique avant risque de dropout
SKIP_DAYS_THRESHOLD = 3

# Base dropout par jour skippé
DROPOUT_BASE_PER_DAY = 0.02

# Protection max basée sur la progression
PROGRESS_PROTECTION_MAX = 0.5


# ═══════════════════════════════════════════════════════════════════════════════
# RECOVERY MODE
# Paramètres du mode récupération
# ═══════════════════════════════════════════════════════════════════════════════

# Nombre de questions faciles en recovery
RECOVERY_EASY_QUESTIONS_DEFAULT = 3
RECOVERY_EASY_QUESTIONS_STRUGGLING = 5

# Probabilité de réussite des questions faciles
RECOVERY_SUCCESS_PROB_BASE = 0.80
RECOVERY_SUCCESS_PROB_STRUGGLING_BOOST = 0.15


# ═══════════════════════════════════════════════════════════════════════════════
# SKILLS PYTHON
# Curriculum Python avec prérequis
# ═══════════════════════════════════════════════════════════════════════════════

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


# ═══════════════════════════════════════════════════════════════════════════════
# SCIENCE COGNITIVE (optionnel, pour simulation_master)
# ═══════════════════════════════════════════════════════════════════════════════

FORGETTING_DECAY_RATE = 0.10

SPACING_EFFECT = {
    0: 0.95,  # Même jour
    1: 1.00,  # Jour suivant
    2: 1.10,  # 2 jours
    3: 1.10,  # 3 jours
    4: 1.05,  # 4 jours
    5: 1.00,  # 5+ jours
}

DESIRABLE_DIFFICULTY = {
    "optimal_error_rate": (0.15, 0.30),
    "optimal_bonus": 0.20,
    "too_easy_penalty": 0.15,
    "too_hard_penalty": 0.20,
}

DUNNING_KRUGER = {
    "novice_zone": (0.0, 0.25),
    "novice_boost": 0.25,
    "valley_zone": (0.40, 0.60),
    "valley_penalty": -0.15,
    "expert_zone": (0.80, 1.0),
    "expert_penalty": -0.05,
}

TESTING_EFFECT_BONUS = 0.20
GENERATION_EFFECT_BONUS = 0.15
