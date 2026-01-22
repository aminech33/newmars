"""
Skill Bridge - Pont intelligent entre planification projet et apprentissage.

Ce service connecte:
- La planification IA (tasks.py) → détecte les skills requises
- Le graphe de compétences (skill_graph_db) → analyse les gaps
- Le contenu adaptatif (adaptive_content_generator) → génère du support
- Le tuteur socratique (socratic_tutor) → guide l'apprentissage

Fonctionnalités:
1. Détection de compétences depuis les tâches d'un projet
2. Analyse des gaps par rapport au profil utilisateur
3. Suggestions de micro-leçons pour combler les lacunes
4. Ajustement de la difficulté des plans selon le niveau
5. Tracking de progression à la complétion des tâches
"""

import logging
import re
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime

from databases import skill_graph_db as skill_db
from databases.skill_graph_db import (
    Skill, SkillGap, SkillCategory,
    get_skill, find_skill_by_keyword, get_user_skills,
    analyze_skill_gaps, get_learning_path, update_user_skill,
    calculate_decayed_mastery, get_prerequisites
)

logger = logging.getLogger(__name__)


# ============================================================================
# SYSTÈME DE NIVEAUX UNIFIÉ (1-5)
# ============================================================================

# Niveaux de difficulté des tâches
TASK_LEVELS = {
    1: {"name": "Très facile", "duration": "15 min", "description": "Setup, micro-tâches, installation"},
    2: {"name": "Facile", "duration": "30 min", "description": "Exercices simples, manipulations basiques"},
    3: {"name": "Intermédiaire", "duration": "1h", "description": "Travail principal, exercices substantiels"},
    4: {"name": "Difficile", "duration": "2h", "description": "Validation, intégration, challenges"},
    5: {"name": "Expert", "duration": "3h+", "description": "Projets complexes, architecture, optimisation"},
}

# Mapping legacy (rétrocompatibilité temporaire)
EFFORT_LEGACY_MAP = {
    "XS": 1,
    "S": 2,
    "M": 3,
    "L": 4,
    "XL": 5,
}

# Niveau de skill requis par niveau de tâche
TASK_LEVEL_TO_SKILL_LEVEL = {
    1: 1,  # Tâche très facile → Skill débutant suffisant
    2: 2,  # Tâche facile → Skill basique
    3: 3,  # Tâche intermédiaire → Skill intermédiaire
    4: 4,  # Tâche difficile → Skill avancé
    5: 5,  # Tâche expert → Skill expert
}

# Labels de difficulté
DIFFICULTY_LABELS = {
    1: "Très facile",
    2: "Facile",
    3: "Intermédiaire",
    4: "Difficile",
    5: "Expert"
}

# XP gagnée par niveau
XP_BY_LEVEL = {
    1: 5,
    2: 10,
    3: 20,
    4: 35,
    5: 50,
}

# Mastery gain par niveau de tâche
MASTERY_GAIN_BY_LEVEL = {
    1: 3,   # Très facile
    2: 5,   # Facile
    3: 8,   # Intermédiaire
    4: 12,  # Difficile
    5: 18,  # Expert
}


def normalize_task_level(level_input) -> int:
    """
    Normalise un niveau de tâche vers 1-5.

    Accepte:
    - int (1-5): retourné tel quel
    - str numérique ("1"-"5"): converti en int
    - str legacy ("XS", "S", "M", "L", "XL"): converti via mapping
    """
    if isinstance(level_input, int):
        return max(1, min(5, level_input))

    if isinstance(level_input, str):
        # Essayer conversion numérique
        if level_input.isdigit():
            return max(1, min(5, int(level_input)))

        # Legacy mapping
        return EFFORT_LEGACY_MAP.get(level_input.upper(), 3)

    return 3  # Défaut: intermédiaire


@dataclass
class DetectedSkill:
    """Compétence détectée dans une tâche."""
    skill: Skill
    confidence: float  # 0-1, confiance de la détection
    source: str  # "title", "covers", "description"
    task_id: Optional[str] = None


@dataclass
class SkillAnalysis:
    """Résultat d'analyse des compétences d'un projet."""
    project_id: str
    detected_skills: List[DetectedSkill]
    skill_gaps: List[SkillGap]
    learning_suggestions: List[Dict[str, Any]]
    difficulty_adjustment: int  # -2 à +2
    ready_percentage: float  # % de compétences maîtrisées


@dataclass
class TaskCompletionResult:
    """Résultat de complétion d'une tâche pour le tracking."""
    task_id: str
    skills_updated: List[Tuple[str, float]]  # (skill_id, new_mastery)
    unlocked_skills: List[str]  # Skills nouvellement accessibles
    next_suggestions: List[str]  # Prochaines tâches suggérées


@dataclass
class TaskDistance:
    """
    Distance multi-facteurs entre le niveau utilisateur et une tâche.

    Distance totale de 0 (parfait match) à 1 (impossible).
    """
    task_id: str
    total_distance: float  # 0-1, moyenne pondérée

    # Composantes de la distance
    skill_level_distance: float  # Écart niveau skill requis vs user
    mastery_distance: float      # Écart maîtrise requise vs actuelle
    prerequisite_penalty: float  # Pénalité si prérequis manquants
    cognitive_load_factor: float # Facteur de charge cognitive

    # Diagnostic
    required_skills: List[str]
    missing_prerequisites: List[str]
    required_skill_level: int    # Niveau requis par la tâche (1-5)
    user_avg_skill_level: float  # Niveau moyen de l'utilisateur

    # Recommandation
    difficulty_label: str        # "Très facile", "Facile", etc.
    is_appropriate: bool         # True si distance < 0.4
    recommendation: str          # Conseil pour l'utilisateur


@dataclass
class ProjectDistance:
    """
    Analyse de distance pour un projet entier.
    """
    project_id: str
    overall_distance: float      # Distance moyenne
    task_distances: List[TaskDistance]

    # Répartition par difficulté
    trivial_count: int           # distance < 0.2
    appropriate_count: int       # 0.2 <= distance < 0.4
    challenging_count: int       # 0.4 <= distance < 0.6
    hard_count: int              # 0.6 <= distance < 0.8
    impossible_count: int        # distance >= 0.8

    # Recommandations
    readiness_score: float       # % de tâches appropriées/triviales
    recommended_order: List[str] # IDs de tâches ordonnées par distance
    scaffolding_needed: List[str]  # Skills à apprendre avant


class SkillBridge:
    """
    Pont entre planification projet et système d'apprentissage.

    Usage:
        bridge = SkillBridge()

        # Analyser un projet
        analysis = bridge.analyze_project(user_id, project_tasks)

        # Obtenir des suggestions
        suggestions = bridge.get_learning_suggestions(user_id, analysis.skill_gaps)

        # Tracker une complétion
        result = bridge.on_task_completed(user_id, task, success=True)
    """

    def __init__(self, content_generator=None, tutor=None):
        """
        Initialize SkillBridge.

        Args:
            content_generator: AdaptiveContentGenerator instance (optional)
            tutor: SocraticTutor instance (optional)
        """
        self._content_generator = content_generator
        self._tutor = tutor

        # Patterns pour détecter des skills dans le texte
        self._skill_patterns = self._build_skill_patterns()

        logger.info("SkillBridge initialized")

    def _build_skill_patterns(self) -> Dict[str, re.Pattern]:
        """Build regex patterns for skill detection."""
        patterns = {}

        # Get all skills and their keywords
        all_skills = skill_db.get_all_skills()

        for skill in all_skills:
            keywords = [skill.name.lower(), skill.id.lower()] + [kw.lower() for kw in skill.keywords]
            # Create pattern that matches any keyword
            pattern = r'\b(' + '|'.join(re.escape(kw) for kw in keywords) + r')\b'
            patterns[skill.id] = re.compile(pattern, re.IGNORECASE)

        return patterns

    # =========================================================================
    # DISTANCE CALCULATION (NOUVEAU)
    # =========================================================================

    def calculate_task_distance(
        self,
        user_id: str,
        task: Dict[str, Any],
        cognitive_load: float = 0.5
    ) -> TaskDistance:
        """
        Calcule la distance multi-facteurs entre l'utilisateur et une tâche.

        La distance est un score de 0 (parfait match) à 1 (impossible).

        Formule:
            distance = 0.30 * skill_level_distance
                     + 0.40 * mastery_distance
                     + 0.20 * prerequisite_penalty
                     + 0.10 * cognitive_load_factor

        Args:
            user_id: ID utilisateur
            task: Tâche à évaluer (title, effort, covers, etc.)
            cognitive_load: Charge cognitive actuelle (0-1)

        Returns:
            TaskDistance avec tous les détails
        """
        task_id = task.get("id", "unknown")

        # 1. Niveau requis par la tâche (supporte ancien format "effort" et nouveau "level")
        level_input = task.get("level") or task.get("effort", 3)
        task_level = normalize_task_level(level_input)
        required_skill_level = TASK_LEVEL_TO_SKILL_LEVEL.get(task_level, 3)

        # 2. Détecter les skills requises
        detected = self.detect_skills_from_task(task)
        required_skill_ids = [d.skill.id for d in detected if d.confidence >= 0.5]

        # 3. Récupérer le profil utilisateur
        user_skills = get_user_skills(user_id)

        # 4. Calculer niveau moyen de l'utilisateur sur les skills requises
        user_skill_levels = []
        user_masteries = []
        missing_prereqs = []

        for skill_id in required_skill_ids:
            skill = get_skill(skill_id)
            if not skill:
                continue

            if skill_id in user_skills:
                us = user_skills[skill_id]
                mastery = calculate_decayed_mastery(us)
                user_masteries.append(mastery)
                # Estimer le niveau utilisateur basé sur la maîtrise
                if mastery >= 80:
                    user_skill_levels.append(4)
                elif mastery >= 60:
                    user_skill_levels.append(3)
                elif mastery >= 40:
                    user_skill_levels.append(2)
                else:
                    user_skill_levels.append(1)
            else:
                user_masteries.append(0)
                user_skill_levels.append(0)  # Skill inconnue

            # Vérifier les prérequis
            prereqs = get_prerequisites(skill_id)
            for prereq in prereqs:
                if prereq.id not in user_skills:
                    missing_prereqs.append(prereq.name)
                else:
                    prereq_mastery = calculate_decayed_mastery(user_skills[prereq.id])
                    if prereq_mastery < 40:
                        missing_prereqs.append(prereq.name)

        # Dédupliquer
        missing_prereqs = list(set(missing_prereqs))

        # 5. Calcul des composantes de distance

        # A. Skill Level Distance (écart de niveau)
        user_avg_level = sum(user_skill_levels) / len(user_skill_levels) if user_skill_levels else 0
        level_gap = max(0, required_skill_level - user_avg_level)
        skill_level_distance = min(1.0, level_gap / 4)  # Normalisé sur 4 niveaux max

        # B. Mastery Distance (écart de maîtrise)
        avg_mastery = sum(user_masteries) / len(user_masteries) if user_masteries else 0
        required_mastery = 60.0  # Seuil standard
        mastery_gap = max(0, required_mastery - avg_mastery)
        mastery_distance = mastery_gap / 100  # Normalisé sur 100%

        # C. Prerequisite Penalty
        if len(missing_prereqs) == 0:
            prerequisite_penalty = 0.0
        elif len(missing_prereqs) <= 2:
            prerequisite_penalty = 0.3
        else:
            prerequisite_penalty = 0.6

        # D. Cognitive Load Factor
        cognitive_load_factor = cognitive_load

        # 6. Distance totale pondérée
        total_distance = (
            0.30 * skill_level_distance +
            0.40 * mastery_distance +
            0.20 * prerequisite_penalty +
            0.10 * cognitive_load_factor
        )
        total_distance = min(1.0, total_distance)

        # 7. Diagnostic et recommandation
        difficulty_label = DIFFICULTY_LABELS.get(task_level, "Intermédiaire")

        is_appropriate = total_distance < 0.4

        if total_distance < 0.2:
            recommendation = "Parfait! Cette tâche est à ton niveau."
        elif total_distance < 0.4:
            recommendation = "Bon challenge, tu peux y arriver!"
        elif total_distance < 0.6:
            recommendation = "Tâche difficile. Révise les bases d'abord."
        elif total_distance < 0.8:
            recommendation = "Trop difficile pour l'instant. Apprends les prérequis."
        else:
            recommendation = "Hors de portée. Concentre-toi sur les fondamentaux."

        return TaskDistance(
            task_id=task_id,
            total_distance=round(total_distance, 3),
            skill_level_distance=round(skill_level_distance, 3),
            mastery_distance=round(mastery_distance, 3),
            prerequisite_penalty=round(prerequisite_penalty, 3),
            cognitive_load_factor=round(cognitive_load_factor, 3),
            required_skills=required_skill_ids,
            missing_prerequisites=missing_prereqs,
            required_skill_level=required_skill_level,
            user_avg_skill_level=round(user_avg_level, 2),
            difficulty_label=difficulty_label,
            is_appropriate=is_appropriate,
            recommendation=recommendation
        )

    def calculate_project_distance(
        self,
        user_id: str,
        tasks: List[Dict[str, Any]],
        project_id: str = "unknown"
    ) -> ProjectDistance:
        """
        Calcule la distance pour un projet entier.

        Analyse chaque tâche et fournit:
        - Distribution par difficulté
        - Ordre recommandé
        - Skills à acquérir avant de commencer
        """
        task_distances = []

        for task in tasks:
            td = self.calculate_task_distance(user_id, task)
            task_distances.append(td)

        # Statistiques
        trivial = sum(1 for td in task_distances if td.total_distance < 0.2)
        appropriate = sum(1 for td in task_distances if 0.2 <= td.total_distance < 0.4)
        challenging = sum(1 for td in task_distances if 0.4 <= td.total_distance < 0.6)
        hard = sum(1 for td in task_distances if 0.6 <= td.total_distance < 0.8)
        impossible = sum(1 for td in task_distances if td.total_distance >= 0.8)

        # Distance moyenne
        overall = sum(td.total_distance for td in task_distances) / len(task_distances) if task_distances else 0

        # Score de readiness (% de tâches accessibles)
        accessible = trivial + appropriate
        readiness = (accessible / len(task_distances) * 100) if task_distances else 100

        # Ordre recommandé (par distance croissante)
        sorted_tasks = sorted(task_distances, key=lambda td: td.total_distance)
        recommended_order = [td.task_id for td in sorted_tasks]

        # Skills à apprendre (agrégation des prérequis manquants)
        all_missing = []
        for td in task_distances:
            all_missing.extend(td.missing_prerequisites)
        scaffolding_needed = list(set(all_missing))

        return ProjectDistance(
            project_id=project_id,
            overall_distance=round(overall, 3),
            task_distances=task_distances,
            trivial_count=trivial,
            appropriate_count=appropriate,
            challenging_count=challenging,
            hard_count=hard,
            impossible_count=impossible,
            readiness_score=round(readiness, 1),
            recommended_order=recommended_order,
            scaffolding_needed=scaffolding_needed
        )

    def get_optimal_task_order(
        self,
        user_id: str,
        tasks: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Réordonne les tâches par difficulté progressive optimale.

        Principe: commencer par les tâches accessibles pour
        construire la confiance et les compétences.
        """
        # Calculer les distances
        task_with_distance = []
        for task in tasks:
            td = self.calculate_task_distance(user_id, task)
            task_with_distance.append((task, td))

        # Trier par distance (plus facile d'abord)
        task_with_distance.sort(key=lambda x: x[1].total_distance)

        # Reconstruire la liste avec métadonnées
        result = []
        for task, td in task_with_distance:
            enriched_task = task.copy()
            enriched_task["_distance"] = {
                "total": td.total_distance,
                "appropriate": td.is_appropriate,
                "label": td.difficulty_label,
                "recommendation": td.recommendation
            }
            result.append(enriched_task)

        return result

    # =========================================================================
    # SKILL DETECTION
    # =========================================================================

    def detect_skills_from_text(self, text: str) -> List[DetectedSkill]:
        """
        Detect skills mentioned in a text.

        Uses pattern matching and fuzzy search.
        """
        detected = []
        text_lower = text.lower()

        for skill_id, pattern in self._skill_patterns.items():
            matches = pattern.findall(text_lower)
            if matches:
                skill = get_skill(skill_id)
                if skill:
                    # Confidence based on number of matches and specificity
                    confidence = min(1.0, 0.5 + len(matches) * 0.2)
                    detected.append(DetectedSkill(
                        skill=skill,
                        confidence=confidence,
                        source="text"
                    ))

        return detected

    def detect_skills_from_task(self, task: Dict[str, Any]) -> List[DetectedSkill]:
        """
        Detect skills required by a task.

        Analyzes:
        - title: High confidence if match
        - covers: Explicit skill list (if available)
        - description: Lower confidence
        """
        detected = []
        seen_skills = set()

        # 1. Explicit covers field (highest confidence)
        if "covers" in task and task["covers"]:
            for cover in task["covers"]:
                skill = find_skill_by_keyword(cover)
                if skill and skill.id not in seen_skills:
                    detected.append(DetectedSkill(
                        skill=skill,
                        confidence=1.0,
                        source="covers",
                        task_id=task.get("id")
                    ))
                    seen_skills.add(skill.id)

        # 2. Title analysis (high confidence)
        title = task.get("title", "")
        title_detections = self.detect_skills_from_text(title)
        for d in title_detections:
            if d.skill.id not in seen_skills:
                d.confidence = min(1.0, d.confidence + 0.2)  # Boost for title
                d.source = "title"
                d.task_id = task.get("id")
                detected.append(d)
                seen_skills.add(d.skill.id)

        # 3. Description analysis (lower confidence)
        description = task.get("description", "")
        if description:
            desc_detections = self.detect_skills_from_text(description)
            for d in desc_detections:
                if d.skill.id not in seen_skills:
                    d.confidence = max(0.3, d.confidence - 0.2)  # Reduce for description
                    d.source = "description"
                    d.task_id = task.get("id")
                    detected.append(d)
                    seen_skills.add(d.skill.id)

        return detected

    def detect_skills_from_project(self, tasks: List[Dict[str, Any]]) -> List[DetectedSkill]:
        """
        Detect all skills required by a project's tasks.

        Aggregates detections and calculates overall confidence.
        """
        all_detections = []
        skill_counts = {}  # skill_id -> count

        for task in tasks:
            task_detections = self.detect_skills_from_task(task)
            for d in task_detections:
                if d.skill.id not in skill_counts:
                    skill_counts[d.skill.id] = {
                        "skill": d.skill,
                        "count": 0,
                        "max_confidence": 0,
                        "sources": set()
                    }
                skill_counts[d.skill.id]["count"] += 1
                skill_counts[d.skill.id]["max_confidence"] = max(
                    skill_counts[d.skill.id]["max_confidence"],
                    d.confidence
                )
                skill_counts[d.skill.id]["sources"].add(d.source)

        # Create aggregated detections
        for skill_id, data in skill_counts.items():
            # Confidence increases with more occurrences
            confidence = min(1.0, data["max_confidence"] + data["count"] * 0.1)
            all_detections.append(DetectedSkill(
                skill=data["skill"],
                confidence=confidence,
                source=", ".join(data["sources"])
            ))

        # Sort by confidence
        all_detections.sort(key=lambda d: -d.confidence)
        return all_detections

    # =========================================================================
    # SKILL GAP ANALYSIS
    # =========================================================================

    def analyze_project(
        self,
        user_id: str,
        tasks: List[Dict[str, Any]],
        project_id: str = "unknown"
    ) -> SkillAnalysis:
        """
        Analyze a project for skill gaps.

        Returns comprehensive analysis including:
        - Detected skills
        - Gaps compared to user profile
        - Learning suggestions
        - Difficulty adjustment recommendation
        """
        # Detect required skills
        detected = self.detect_skills_from_project(tasks)

        # Filter by confidence threshold
        confident_detections = [d for d in detected if d.confidence >= 0.5]
        required_skill_ids = [d.skill.id for d in confident_detections]

        # Analyze gaps
        gaps = []
        if required_skill_ids:
            gaps = analyze_skill_gaps(user_id, required_skill_ids, min_mastery=60.0)

        # Calculate readiness
        user_skills = get_user_skills(user_id)
        ready_count = 0
        for d in confident_detections:
            if d.skill.id in user_skills:
                mastery = calculate_decayed_mastery(user_skills[d.skill.id])
                if mastery >= 60:
                    ready_count += 1

        ready_percentage = (ready_count / len(confident_detections) * 100) if confident_detections else 100

        # Calculate difficulty adjustment
        difficulty_adjustment = self._calculate_difficulty_adjustment(
            gaps, ready_percentage, len(confident_detections)
        )

        # Generate learning suggestions
        suggestions = self._generate_learning_suggestions(user_id, gaps[:5])

        return SkillAnalysis(
            project_id=project_id,
            detected_skills=confident_detections,
            skill_gaps=gaps,
            learning_suggestions=suggestions,
            difficulty_adjustment=difficulty_adjustment,
            ready_percentage=ready_percentage
        )

    def _calculate_difficulty_adjustment(
        self,
        gaps: List[SkillGap],
        ready_percentage: float,
        total_skills: int
    ) -> int:
        """
        Calculate recommended difficulty adjustment.

        Returns -2 to +2:
        - -2: User is way ahead, make it harder
        - -1: User is slightly ahead
        - 0: Good match
        - +1: User needs some help
        - +2: User needs significant scaffolding
        """
        if total_skills == 0:
            return 0

        # Count blocking gaps (prerequisites missing)
        blocking_gaps = sum(1 for g in gaps if g.blocking_skills)

        if blocking_gaps >= 3:
            return 2  # Significant scaffolding needed
        elif blocking_gaps >= 1:
            return 1  # Some help needed

        if ready_percentage >= 90:
            return -1  # Slightly ahead
        elif ready_percentage >= 70:
            return 0  # Good match
        elif ready_percentage >= 50:
            return 1  # Some help needed
        else:
            return 2  # Significant scaffolding needed

    def _generate_learning_suggestions(
        self,
        user_id: str,
        gaps: List[SkillGap]
    ) -> List[Dict[str, Any]]:
        """Generate learning suggestions for gaps."""
        suggestions = []

        for gap in gaps:
            suggestion = {
                "skill_id": gap.skill.id,
                "skill_name": gap.skill.name,
                "current_mastery": round(gap.current_mastery, 1),
                "required_mastery": gap.required_mastery,
                "gap": round(gap.gap, 1),
                "priority": "high" if gap.gap > 40 else "medium" if gap.gap > 20 else "low",
                "actions": []
            }

            # If prerequisites missing
            if gap.blocking_skills:
                suggestion["blocking"] = True
                suggestion["blocking_skills"] = gap.blocking_skills
                suggestion["actions"].append({
                    "type": "learn_prerequisites",
                    "message": f"D'abord maîtriser: {', '.join(gap.blocking_skills)}"
                })
            else:
                # Suggest micro-lesson
                suggestion["actions"].append({
                    "type": "micro_lesson",
                    "topic": gap.skill.name,
                    "message": f"Micro-leçon recommandée sur {gap.skill.name}"
                })

                # Suggest exercises if partially known
                if gap.current_mastery > 20:
                    suggestion["actions"].append({
                        "type": "exercises",
                        "topic": gap.skill.name,
                        "count": 3,
                        "message": f"3 exercices ciblés sur {gap.skill.name}"
                    })

            suggestions.append(suggestion)

        return suggestions

    # =========================================================================
    # TASK COMPLETION TRACKING
    # =========================================================================

    def on_task_completed(
        self,
        user_id: str,
        task: Dict[str, Any],
        success: bool = True,
        time_spent_minutes: Optional[int] = None
    ) -> TaskCompletionResult:
        """
        Track skill progress when a task is completed.

        Updates user skills based on:
        - Task level (1-5)
        - Whether it's a validation task
        - Success/failure
        - Time spent
        """
        detected = self.detect_skills_from_task(task)
        skills_updated = []
        unlocked = []

        # Calculate mastery gain based on task level (1-5)
        level_input = task.get("level") or task.get("effort", 3)
        task_level = normalize_task_level(level_input)
        is_validation = task.get("isValidation", False)

        base_gain = MASTERY_GAIN_BY_LEVEL.get(task_level, 8)

        # Validation tasks give bonus
        if is_validation:
            base_gain *= 1.5

        # Success multiplier
        if not success:
            base_gain *= 0.3  # Still learn from failure, but less

        # Update each detected skill
        for detection in detected:
            # Weighted by detection confidence
            gain = base_gain * detection.confidence

            updated_skill = update_user_skill(
                user_id=user_id,
                skill_id=detection.skill.id,
                mastery_delta=gain,
                is_practice=True
            )

            skills_updated.append((detection.skill.id, updated_skill.mastery))

            # Check if this unlocks new skills
            dependents = skill_db.get_dependent_skills(detection.skill.id)
            for dep in dependents:
                # Check if all prerequisites now met
                prereqs = get_prerequisites(dep.id)
                all_met = True
                for prereq in prereqs:
                    _, us = skill_db.get_user_skill_with_decay(user_id, prereq.id)
                    if not us or calculate_decayed_mastery(us) < 50:
                        all_met = False
                        break

                if all_met:
                    unlocked.append(dep.id)

        # Generate next task suggestions based on unlocked skills
        next_suggestions = []
        if unlocked:
            for skill_id in unlocked[:3]:
                skill = get_skill(skill_id)
                if skill:
                    next_suggestions.append(f"Tu peux maintenant apprendre: {skill.name}")

        return TaskCompletionResult(
            task_id=task.get("id", "unknown"),
            skills_updated=skills_updated,
            unlocked_skills=unlocked,
            next_suggestions=next_suggestions
        )

    def on_phase_completed(
        self,
        user_id: str,
        phase_tasks: List[Dict[str, Any]],
        phase_name: str
    ) -> Dict[str, Any]:
        """
        Track progress when a phase is completed.

        Aggregates skill gains and provides phase summary.
        """
        total_skills_updated = {}

        for task in phase_tasks:
            if task.get("completed", False):
                result = self.on_task_completed(user_id, task, success=True)
                for skill_id, mastery in result.skills_updated:
                    if skill_id not in total_skills_updated:
                        total_skills_updated[skill_id] = 0
                    total_skills_updated[skill_id] = mastery  # Take latest

        return {
            "phase": phase_name,
            "skills_progressed": len(total_skills_updated),
            "skill_levels": {
                sid: round(m, 1) for sid, m in total_skills_updated.items()
            },
            "message": f"Phase '{phase_name}' terminée! {len(total_skills_updated)} compétences progressées."
        }

    # =========================================================================
    # PLAN ADAPTATION
    # =========================================================================

    def adapt_plan_difficulty(
        self,
        analysis: SkillAnalysis,
        plan: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Adapt a generated plan based on skill analysis.

        Modifications based on difficulty_adjustment:
        - Add scaffolding tasks for gaps
        - Adjust effort estimates
        - Insert learning checkpoints
        """
        adjusted_plan = plan.copy()
        adjustment = analysis.difficulty_adjustment

        if adjustment == 0:
            return adjusted_plan  # No changes needed

        phases = adjusted_plan.get("phases", [])

        if adjustment > 0:
            # User needs help - add scaffolding
            for gap in analysis.skill_gaps[:3]:  # Top 3 gaps
                if gap.blocking_skills:
                    continue  # Prerequisites missing, can't help here

                # Insert learning task at start of relevant phase
                learning_task = {
                    "title": f"Mini-leçon: {gap.skill.name}",
                    "effort": "S",
                    "covers": [gap.skill.id],
                    "isValidation": False,
                    "isScaffolding": True,  # Custom flag
                    "unlockAfter": None
                }

                # Find best phase to insert
                if phases:
                    phases[0]["tasks"].insert(0, learning_task)

        elif adjustment < 0:
            # User is ahead - can skip some basics
            for phase in phases:
                phase["tasks"] = [
                    t for t in phase["tasks"]
                    if t.get("effort") != "XS" or t.get("isValidation")
                ]

        adjusted_plan["phases"] = phases
        adjusted_plan["difficulty_adjusted"] = adjustment
        adjusted_plan["adjustment_reason"] = (
            "Plan simplifié (vous maîtrisez les bases)" if adjustment < 0
            else "Tâches de support ajoutées pour les lacunes détectées"
        )

        return adjusted_plan

    def enrich_plan_with_skills(
        self,
        plan: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Enrich a plan with detected skill information.

        Adds skill IDs to tasks for future tracking.
        """
        enriched = plan.copy()

        for phase in enriched.get("phases", []):
            for task in phase.get("tasks", []):
                if "covers" not in task or not task["covers"]:
                    # Detect skills from title
                    detected = self.detect_skills_from_task(task)
                    task["detected_skills"] = [
                        {"id": d.skill.id, "name": d.skill.name, "confidence": d.confidence}
                        for d in detected
                    ]

        return enriched

    # =========================================================================
    # INTEGRATION HELPERS
    # =========================================================================

    def get_user_readiness(
        self,
        user_id: str,
        required_skills: List[str]
    ) -> Dict[str, Any]:
        """
        Quick check of user readiness for a set of skills.

        Returns readiness report without full analysis.
        """
        user_skills = get_user_skills(user_id)
        ready = []
        learning = []
        missing = []

        for skill_id in required_skills:
            skill = get_skill(skill_id) or find_skill_by_keyword(skill_id)
            if not skill:
                continue

            if skill.id in user_skills:
                mastery = calculate_decayed_mastery(user_skills[skill.id])
                if mastery >= 60:
                    ready.append({"id": skill.id, "name": skill.name, "mastery": round(mastery, 1)})
                else:
                    learning.append({"id": skill.id, "name": skill.name, "mastery": round(mastery, 1)})
            else:
                missing.append({"id": skill.id, "name": skill.name})

        total = len(ready) + len(learning) + len(missing)
        readiness_score = (len(ready) / total * 100) if total > 0 else 100

        return {
            "readiness_score": round(readiness_score, 1),
            "ready": ready,
            "learning": learning,
            "missing": missing,
            "recommendation": (
                "Prêt à commencer!" if readiness_score >= 70
                else "Quelques révisions recommandées" if readiness_score >= 40
                else "Formation préalable conseillée"
            )
        }

    def suggest_learning_path(
        self,
        user_id: str,
        target_skill: str
    ) -> List[Dict[str, Any]]:
        """
        Suggest optimal learning path to acquire a skill.
        """
        skill = get_skill(target_skill) or find_skill_by_keyword(target_skill)
        if not skill:
            return []

        path = get_learning_path(user_id, skill.id)

        return [
            {
                "skill_id": s.id,
                "skill_name": s.name,
                "level": s.level,
                "category": s.category.value,
                "is_target": s.id == skill.id
            }
            for s in path
        ]


# ============================================================================
# TIER PROGRESSION HELPERS
# ============================================================================

def get_domain_tier_progress(user_id: str, domain: str) -> Dict[int, Dict[str, Any]]:
    """
    Récupère la progression par tier (0-3) pour un domaine.

    Wrapper pour skill_graph_db.get_tier_progress()
    """
    from databases.skill_graph_db import get_tier_progress
    return get_tier_progress(user_id, domain)


def get_current_tier(user_id: str, domain: str) -> int:
    """
    Retourne le tier actuel de l'utilisateur (le plus haut débloqué et non complété).

    Returns:
        0-3 selon la progression
    """
    progress = get_domain_tier_progress(user_id, domain)
    if not progress:
        return 0

    current = 0
    for tier in range(4):
        if tier in progress:
            if progress[tier]["progress"] >= 80:
                current = tier + 1
            elif progress[tier]["unlocked"]:
                current = tier
                break

    return min(current, 3)


def should_unlock_next_tier(user_id: str, domain: str) -> Tuple[bool, Optional[int]]:
    """
    Vérifie si l'utilisateur peut débloquer le tier suivant.

    Returns:
        (can_unlock, next_tier) - (True, 2) si tier 2 peut être débloqué
    """
    progress = get_domain_tier_progress(user_id, domain)
    if not progress:
        return False, None

    for tier in range(3):  # 0, 1, 2
        if tier in progress and progress[tier]["progress"] >= 80:
            next_tier = tier + 1
            if next_tier in progress and not progress[next_tier]["unlocked"]:
                return True, next_tier

    return False, None


def get_tier_summary(user_id: str, domain: str) -> Dict[str, Any]:
    """
    Retourne un résumé de la progression pour affichage.

    Returns:
        {
            "domain": "Python",
            "current_tier": 1,
            "current_tier_name": "Intermédiaire",
            "overall_progress": 42.5,
            "tiers": [...],
            "next_unlock": {"tier": 2, "name": "Avancé", "needs": 35.0}
        }
    """
    progress = get_domain_tier_progress(user_id, domain)
    if not progress:
        return {"domain": domain, "error": "Carte non trouvée"}

    current = get_current_tier(user_id, domain)

    # Calculer progression globale
    total_skills = sum(t["skills"] for t in progress.values())
    total_mastered = sum(t["mastered"] for t in progress.values())
    overall = (total_mastered / total_skills * 100) if total_skills > 0 else 0

    # Prochain déblocage
    next_unlock = None
    for tier in range(3):
        if tier in progress and progress[tier]["progress"] < 80:
            needs = 80 - progress[tier]["progress"]
            next_tier = tier + 1
            if next_tier in progress:
                next_unlock = {
                    "tier": next_tier,
                    "name": progress[next_tier]["name"],
                    "needs": round(needs, 1)
                }
            break

    return {
        "domain": domain,
        "current_tier": current,
        "current_tier_name": progress.get(current, {}).get("name", "Inconnu"),
        "overall_progress": round(overall, 1),
        "tiers": [
            {
                "tier": tier,
                **data
            }
            for tier, data in sorted(progress.items())
        ],
        "next_unlock": next_unlock
    }


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_bridge_instance: Optional[SkillBridge] = None


def get_skill_bridge() -> SkillBridge:
    """Get or create SkillBridge singleton."""
    global _bridge_instance
    if _bridge_instance is None:
        _bridge_instance = SkillBridge()
    return _bridge_instance


def create_skill_bridge(content_generator=None, tutor=None) -> SkillBridge:
    """Create SkillBridge with optional dependencies."""
    global _bridge_instance
    _bridge_instance = SkillBridge(content_generator, tutor)
    return _bridge_instance
