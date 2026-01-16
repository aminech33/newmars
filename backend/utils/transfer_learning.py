"""
Transfer Learning Detection - Détection du transfert de connaissances

Détecte quand la maîtrise d'un topic aide à apprendre un autre topic:
- Topics liés (ex: algèbre → calcul)
- Compétences transversales (ex: logique → programmation)
- Patterns de progression accélérée

Effets:
- Bonus de maîtrise pour topics liés
- Suggestions de topics connexes
- Parcours d'apprentissage optimisé

Basé sur la théorie du transfert de Thorndike (1901) et Singley & Anderson (1989)
"""
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple, Set
from dataclasses import dataclass
from collections import defaultdict
import json


# ═══════════════════════════════════════════════════════════════════════════════
# KNOWLEDGE GRAPH - Relations entre topics
# ═══════════════════════════════════════════════════════════════════════════════

# Matrice de transfert (topic_source -> topic_target -> coefficient)
# Coefficient 0.0-1.0: portion de maîtrise transférable
TRANSFER_MATRIX = {
    # Mathématiques
    "arithmetic": {
        "algebra": 0.4,
        "statistics": 0.3,
        "calculus": 0.2,
    },
    "algebra": {
        "calculus": 0.5,
        "linear_algebra": 0.4,
        "statistics": 0.3,
        "physics": 0.3,
    },
    "geometry": {
        "trigonometry": 0.5,
        "calculus": 0.2,
        "linear_algebra": 0.3,
        "physics": 0.3,
    },
    "trigonometry": {
        "calculus": 0.4,
        "physics": 0.4,
        "complex_numbers": 0.3,
    },
    "calculus": {
        "differential_equations": 0.6,
        "physics": 0.4,
        "optimization": 0.5,
        "machine_learning": 0.3,
    },
    "linear_algebra": {
        "machine_learning": 0.5,
        "computer_graphics": 0.4,
        "statistics": 0.3,
        "physics": 0.3,
    },
    "statistics": {
        "probability": 0.6,
        "machine_learning": 0.4,
        "data_science": 0.5,
        "economics": 0.3,
    },
    "probability": {
        "statistics": 0.5,
        "machine_learning": 0.4,
        "finance": 0.3,
    },

    # Programmation
    "programming_basics": {
        "python": 0.5,
        "javascript": 0.5,
        "java": 0.4,
        "algorithms": 0.3,
    },
    "python": {
        "data_science": 0.4,
        "machine_learning": 0.3,
        "web_backend": 0.3,
    },
    "javascript": {
        "web_frontend": 0.5,
        "react": 0.4,
        "nodejs": 0.4,
    },
    "algorithms": {
        "data_structures": 0.6,
        "competitive_programming": 0.5,
        "system_design": 0.3,
    },
    "data_structures": {
        "algorithms": 0.5,
        "databases": 0.3,
        "system_design": 0.3,
    },
    "databases": {
        "sql": 0.6,
        "backend": 0.4,
        "data_engineering": 0.4,
    },

    # Sciences
    "physics": {
        "engineering": 0.4,
        "chemistry": 0.2,
        "astronomy": 0.3,
    },
    "chemistry": {
        "biochemistry": 0.5,
        "pharmacy": 0.4,
        "materials_science": 0.3,
    },
    "biology": {
        "biochemistry": 0.4,
        "medicine": 0.3,
        "ecology": 0.4,
    },

    # Langues
    "french": {
        "spanish": 0.3,
        "italian": 0.3,
        "portuguese": 0.3,
        "latin": 0.2,
    },
    "spanish": {
        "portuguese": 0.5,
        "italian": 0.4,
        "french": 0.3,
    },
    "latin": {
        "french": 0.3,
        "spanish": 0.3,
        "italian": 0.3,
        "medical_terminology": 0.4,
    },
    "german": {
        "dutch": 0.4,
        "english": 0.2,
    },

    # Compétences transversales
    "logic": {
        "programming_basics": 0.4,
        "mathematics": 0.3,
        "philosophy": 0.3,
        "debate": 0.3,
    },
    "critical_thinking": {
        "research": 0.4,
        "writing": 0.3,
        "analysis": 0.4,
    },
    "reading_comprehension": {
        "writing": 0.3,
        "research": 0.3,
        "literature": 0.4,
    },
}

# Tags de compétences partagées
SHARED_SKILLS = {
    "analytical_thinking": ["mathematics", "programming", "physics", "logic", "economics"],
    "pattern_recognition": ["mathematics", "music", "languages", "programming"],
    "spatial_reasoning": ["geometry", "architecture", "art", "geography"],
    "verbal_reasoning": ["languages", "law", "philosophy", "writing"],
    "numerical_fluency": ["arithmetic", "accounting", "statistics", "physics"],
    "abstraction": ["mathematics", "programming", "philosophy", "art"],
    "memorization": ["languages", "biology", "history", "law"],
    "problem_solving": ["mathematics", "programming", "engineering", "physics"],
}


@dataclass
class TransferRelation:
    """Relation de transfert entre deux topics"""
    source_topic: str
    target_topic: str
    transfer_coefficient: float  # 0-1
    relation_type: str  # "direct", "skill_based", "conceptual"
    shared_skills: List[str]


@dataclass
class TransferBonus:
    """Bonus de transfert calculé"""
    target_topic: str
    bonus_mastery: int  # Points de maîtrise bonus
    source_topics: List[str]  # Topics sources du transfert
    transfer_explanation: str


class TransferLearningDetector:
    """
    Détecteur de transfert de connaissances

    Usage:
        detector = TransferLearningDetector()
        detector.set_mastery("algebra", 80)
        detector.set_mastery("geometry", 70)
        bonus = detector.calculate_transfer_bonus("calculus")
    """

    def __init__(self, custom_matrix: Dict[str, Dict[str, float]] = None):
        self.transfer_matrix = custom_matrix or TRANSFER_MATRIX
        self.topic_masteries: Dict[str, int] = {}
        self.topic_history: Dict[str, List[Dict]] = defaultdict(list)

    def set_mastery(self, topic_id: str, mastery_level: int):
        """Définit le niveau de maîtrise d'un topic"""
        self.topic_masteries[topic_id] = mastery_level

    def set_all_masteries(self, masteries: Dict[str, int]):
        """Définit tous les niveaux de maîtrise"""
        self.topic_masteries = masteries.copy()

    def get_related_topics(self, topic_id: str) -> List[TransferRelation]:
        """
        Trouve tous les topics qui peuvent transférer vers le topic cible

        Returns:
            Liste de relations de transfert
        """
        relations = []

        # Transferts directs (depuis la matrice)
        for source, targets in self.transfer_matrix.items():
            if topic_id in targets:
                relations.append(TransferRelation(
                    source_topic=source,
                    target_topic=topic_id,
                    transfer_coefficient=targets[topic_id],
                    relation_type="direct",
                    shared_skills=self._find_shared_skills(source, topic_id)
                ))

        # Transferts basés sur les compétences partagées
        topic_skills = self._get_topic_skills(topic_id)
        for source_topic, source_mastery in self.topic_masteries.items():
            if source_topic == topic_id:
                continue

            # Vérifier si déjà dans les relations directes
            if any(r.source_topic == source_topic for r in relations):
                continue

            source_skills = self._get_topic_skills(source_topic)
            shared = topic_skills.intersection(source_skills)

            if shared:
                # Coefficient basé sur le nombre de compétences partagées
                coef = min(0.3, len(shared) * 0.1)
                relations.append(TransferRelation(
                    source_topic=source_topic,
                    target_topic=topic_id,
                    transfer_coefficient=coef,
                    relation_type="skill_based",
                    shared_skills=list(shared)
                ))

        return relations

    def _get_topic_skills(self, topic_id: str) -> Set[str]:
        """Trouve les compétences associées à un topic"""
        skills = set()
        for skill, topics in SHARED_SKILLS.items():
            # Matching flexible (le topic peut contenir le mot-clé)
            if topic_id in topics:
                skills.add(skill)
            elif any(t in topic_id for t in topics):
                skills.add(skill)
        return skills

    def _find_shared_skills(self, topic1: str, topic2: str) -> List[str]:
        """Trouve les compétences partagées entre deux topics"""
        skills1 = self._get_topic_skills(topic1)
        skills2 = self._get_topic_skills(topic2)
        return list(skills1.intersection(skills2))

    def calculate_transfer_bonus(self, target_topic: str) -> Optional[TransferBonus]:
        """
        Calcule le bonus de transfert pour un topic cible

        Le bonus est basé sur:
        - Maîtrise des topics sources
        - Coefficients de transfert
        - Diminishing returns (bonus plafonné)

        Returns:
            TransferBonus ou None si pas de transfert significatif
        """
        relations = self.get_related_topics(target_topic)

        if not relations:
            return None

        total_bonus = 0.0
        contributing_sources = []
        explanations = []

        for relation in relations:
            source_mastery = self.topic_masteries.get(relation.source_topic, 0)

            if source_mastery < 30:
                # Pas assez de maîtrise pour transférer
                continue

            # Calcul du bonus
            # Formule: (mastery - 30) * coefficient * diminishing_factor
            effective_mastery = source_mastery - 30  # Seuil minimum
            raw_bonus = effective_mastery * relation.transfer_coefficient

            # Diminishing returns: chaque source suivante contribue moins
            diminishing = 1.0 / (1 + len(contributing_sources) * 0.3)
            bonus = raw_bonus * diminishing

            if bonus >= 1:
                total_bonus += bonus
                contributing_sources.append(relation.source_topic)

                if relation.shared_skills:
                    explanations.append(
                        f"✨ {relation.source_topic} → {int(bonus)} pts "
                        f"(compétences: {', '.join(relation.shared_skills[:2])})"
                    )
                else:
                    explanations.append(
                        f"✨ {relation.source_topic} → {int(bonus)} pts"
                    )

        if total_bonus < 1:
            return None

        # Plafonner le bonus total (max 25 points)
        capped_bonus = int(min(25, total_bonus))

        return TransferBonus(
            target_topic=target_topic,
            bonus_mastery=capped_bonus,
            source_topics=contributing_sources,
            transfer_explanation="\n".join(explanations)
        )

    def detect_accelerated_learning(
        self,
        topic_id: str,
        learning_speed: float,  # questions/jour
        success_rate: float
    ) -> Optional[Dict[str, Any]]:
        """
        Détecte si l'apprentissage est accéléré grâce au transfert

        Returns:
            Dict avec l'analyse ou None
        """
        # Obtenir le bonus de transfert
        bonus = self.calculate_transfer_bonus(topic_id)

        if not bonus or bonus.bonus_mastery < 5:
            return None

        # Seuils d'apprentissage "normal"
        expected_success_for_new = 0.6  # Taux de réussite attendu pour un nouveau topic

        # Si le taux de réussite est significativement plus élevé
        if success_rate > expected_success_for_new + 0.15:
            acceleration_factor = success_rate / expected_success_for_new

            return {
                "detected": True,
                "topic_id": topic_id,
                "acceleration_factor": round(acceleration_factor, 2),
                "transfer_bonus": bonus.bonus_mastery,
                "source_topics": bonus.source_topics,
                "message": f"🚀 Apprentissage accéléré détecté! "
                          f"Vos connaissances en {', '.join(bonus.source_topics[:2])} "
                          f"vous aident à apprendre {topic_id} plus vite.",
                "recommendation": "Continuez sur cette lancée! "
                                 "Considérez d'autres topics connexes."
            }

        return None

    def suggest_next_topics(self, learned_topics: List[str], available_topics: List[str]) -> List[Dict[str, Any]]:
        """
        Suggère les prochains topics à apprendre basé sur le transfert

        Args:
            learned_topics: Topics déjà maîtrisés
            available_topics: Topics disponibles à apprendre

        Returns:
            Liste triée de suggestions
        """
        suggestions = []

        for target in available_topics:
            if target in learned_topics:
                continue

            # Temporairement définir les maîtrises des topics appris
            temp_masteries = {t: self.topic_masteries.get(t, 70) for t in learned_topics}
            old_masteries = self.topic_masteries.copy()
            self.topic_masteries = temp_masteries

            bonus = self.calculate_transfer_bonus(target)

            # Restaurer
            self.topic_masteries = old_masteries

            if bonus:
                suggestions.append({
                    "topic_id": target,
                    "transfer_bonus": bonus.bonus_mastery,
                    "source_topics": bonus.source_topics,
                    "explanation": bonus.transfer_explanation,
                    "priority_score": bonus.bonus_mastery  # Plus le bonus est haut, plus c'est prioritaire
                })
            else:
                suggestions.append({
                    "topic_id": target,
                    "transfer_bonus": 0,
                    "source_topics": [],
                    "explanation": "Nouveau domaine - pas de transfert détecté",
                    "priority_score": 0
                })

        # Trier par score de priorité
        suggestions.sort(key=lambda x: x["priority_score"], reverse=True)

        return suggestions


# ═══════════════════════════════════════════════════════════════════════════════
# FONCTIONS UTILITAIRES
# ═══════════════════════════════════════════════════════════════════════════════

def calculate_transfer_bonus_for_user(
    user_masteries: Dict[str, int],
    target_topic: str,
    custom_matrix: Dict[str, Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Fonction utilitaire pour calculer le bonus de transfert

    Args:
        user_masteries: Dict {topic_id: mastery_level}
        target_topic: Topic cible
        custom_matrix: Matrice de transfert personnalisée (optionnel)

    Returns:
        Dict avec le bonus et les détails
    """
    detector = TransferLearningDetector(custom_matrix)
    detector.set_all_masteries(user_masteries)

    bonus = detector.calculate_transfer_bonus(target_topic)

    if bonus:
        return {
            "has_transfer": True,
            "bonus_mastery": bonus.bonus_mastery,
            "source_topics": bonus.source_topics,
            "explanation": bonus.transfer_explanation
        }
    else:
        return {
            "has_transfer": False,
            "bonus_mastery": 0,
            "source_topics": [],
            "explanation": "Aucun transfert significatif détecté"
        }


def get_learning_path_with_transfer(
    start_topic: str,
    goal_topic: str,
    available_topics: List[str]
) -> List[Dict[str, Any]]:
    """
    Génère un parcours d'apprentissage optimisé pour le transfert

    Returns:
        Liste ordonnée de topics à apprendre
    """
    detector = TransferLearningDetector()
    path = []
    learned = set()

    # BFS simplifié pour trouver le chemin avec le plus de transfert
    current = start_topic
    learned.add(current)
    path.append({"topic": current, "transfer_bonus": 0, "step": 1})

    while goal_topic not in learned and len(path) < 10:
        # Simuler la maîtrise des topics appris
        detector.set_all_masteries({t: 70 for t in learned})

        # Trouver le meilleur prochain topic
        remaining = [t for t in available_topics if t not in learned]
        if not remaining:
            break

        suggestions = detector.suggest_next_topics(list(learned), remaining)

        # Prendre le meilleur (ou le goal si disponible)
        if goal_topic in [s["topic_id"] for s in suggestions]:
            best = next(s for s in suggestions if s["topic_id"] == goal_topic)
        elif suggestions:
            best = suggestions[0]
        else:
            break

        path.append({
            "topic": best["topic_id"],
            "transfer_bonus": best["transfer_bonus"],
            "step": len(path) + 1,
            "from_topics": best["source_topics"]
        })
        learned.add(best["topic_id"])

    return path


def add_custom_transfer_relation(
    source_topic: str,
    target_topic: str,
    coefficient: float
) -> Dict[str, Dict[str, float]]:
    """
    Ajoute une relation de transfert personnalisée

    Returns:
        Nouvelle matrice mise à jour (ne modifie pas l'originale)
    """
    new_matrix = {k: dict(v) for k, v in TRANSFER_MATRIX.items()}

    if source_topic not in new_matrix:
        new_matrix[source_topic] = {}

    new_matrix[source_topic][target_topic] = coefficient

    return new_matrix


__all__ = [
    "TransferLearningDetector",
    "TransferRelation",
    "TransferBonus",
    "TRANSFER_MATRIX",
    "SHARED_SKILLS",
    "calculate_transfer_bonus_for_user",
    "get_learning_path_with_transfer",
    "add_custom_transfer_relation",
]
