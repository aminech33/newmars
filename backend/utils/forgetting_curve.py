"""
Personalized Forgetting Curve - Courbe d'oubli personnalisée

Modélise la courbe d'oubli individuelle de chaque utilisateur:
- Chaque personne oublie à un rythme différent
- La courbe varie selon le type de contenu
- L'apprentissage initial affecte la rétention à long terme

Basé sur:
- Ebbinghaus (1885) - Courbe d'oubli originale
- Wixted & Carpenter (2007) - Power law of forgetting
- Averell & Heathcote (2011) - Individual differences

Formule de base: R(t) = e^(-t/S) où S = stabilité personnelle
Avec ajustements pour:
- Type de mémoire (déclarative vs procédurale)
- Qualité de l'encodage initial
- Nombre de révisions
- Espacement des révisions
"""
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from math import exp, log, pow
from collections import defaultdict
import json


# ═══════════════════════════════════════════════════════════════════════════════
# CONSTANTES ET PARAMÈTRES
# ═══════════════════════════════════════════════════════════════════════════════

# Stabilité de base par type de contenu (en jours)
# Plus la stabilité est haute, plus lent est l'oubli
BASE_STABILITY = {
    "vocabulary": 1.5,      # Vocabulaire - oubli rapide
    "facts": 2.0,           # Faits isolés
    "concepts": 3.0,        # Concepts connectés
    "procedures": 4.0,      # Procédures/méthodes
    "skills": 5.0,          # Compétences pratiquées
    "intuition": 7.0,       # Intuition/compréhension profonde
}

# Facteurs d'encodage initial
ENCODING_FACTORS = {
    "passive": 0.5,         # Lecture passive
    "active_recall": 1.2,   # Récupération active
    "elaboration": 1.4,     # Élaboration/connexions
    "generation": 1.6,      # Génération de réponse
    "teaching": 2.0,        # Enseigner à quelqu'un
}

# Bonus de révision (chaque révision augmente la stabilité)
REVISION_MULTIPLIER = 1.5  # +50% de stabilité par révision réussie


@dataclass
class MemoryTrace:
    """Trace mnésique d'un item"""
    item_id: str
    content_type: str  # vocabulary, facts, concepts, procedures, skills
    stability: float  # Stabilité personnelle (jours)
    last_review: datetime
    review_count: int
    initial_encoding: str  # passive, active_recall, elaboration, generation
    retrievability: float  # 0-1, probabilité de rappel actuelle

    # Historique pour calibration
    review_history: List[Dict[str, Any]] = field(default_factory=list)
    predicted_vs_actual: List[Tuple[float, bool]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "item_id": self.item_id,
            "content_type": self.content_type,
            "stability": self.stability,
            "last_review": self.last_review.isoformat() if self.last_review else None,
            "review_count": self.review_count,
            "initial_encoding": self.initial_encoding,
            "retrievability": self.retrievability,
            "review_history": self.review_history,
            "predicted_vs_actual": self.predicted_vs_actual
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MemoryTrace":
        return cls(
            item_id=data["item_id"],
            content_type=data.get("content_type", "facts"),
            stability=data.get("stability", 2.0),
            last_review=datetime.fromisoformat(data["last_review"]) if data.get("last_review") else datetime.now(),
            review_count=data.get("review_count", 0),
            initial_encoding=data.get("initial_encoding", "passive"),
            retrievability=data.get("retrievability", 1.0),
            review_history=data.get("review_history", []),
            predicted_vs_actual=[(p, a) for p, a in data.get("predicted_vs_actual", [])]
        )


@dataclass
class UserMemoryProfile:
    """Profil mnésique personnalisé d'un utilisateur"""
    user_id: str

    # Paramètres personnels (appris au fil du temps)
    base_decay_rate: float = 1.0  # 1.0 = normal, <1 = oublie plus lentement
    encoding_efficiency: float = 1.0  # Efficacité de l'encodage initial
    revision_benefit: float = 1.0  # Bénéfice des révisions

    # Paramètres par type de contenu
    stability_by_type: Dict[str, float] = field(default_factory=dict)

    # Données pour calibration
    total_predictions: int = 0
    correct_predictions: int = 0
    calibration_history: List[Dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "base_decay_rate": self.base_decay_rate,
            "encoding_efficiency": self.encoding_efficiency,
            "revision_benefit": self.revision_benefit,
            "stability_by_type": self.stability_by_type,
            "total_predictions": self.total_predictions,
            "correct_predictions": self.correct_predictions,
            "calibration_history": self.calibration_history
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "UserMemoryProfile":
        return cls(
            user_id=data["user_id"],
            base_decay_rate=data.get("base_decay_rate", 1.0),
            encoding_efficiency=data.get("encoding_efficiency", 1.0),
            revision_benefit=data.get("revision_benefit", 1.0),
            stability_by_type=data.get("stability_by_type", {}),
            total_predictions=data.get("total_predictions", 0),
            correct_predictions=data.get("correct_predictions", 0),
            calibration_history=data.get("calibration_history", [])
        )


class PersonalizedForgettingCurve:
    """
    Modèle de courbe d'oubli personnalisée

    Usage:
        curve = PersonalizedForgettingCurve()
        curve.set_user_profile(user_profile)

        # Créer une trace pour un nouvel item
        trace = curve.create_memory_trace("vocab_123", "vocabulary", "active_recall")

        # Prédire la rétention
        retention = curve.predict_retention(trace, days_elapsed=3)

        # Après révision, mettre à jour
        trace = curve.update_after_review(trace, was_recalled=True, response_time=5)
    """

    def __init__(self, user_profile: UserMemoryProfile = None):
        self.user_profile = user_profile or UserMemoryProfile(user_id="default")
        self.memory_traces: Dict[str, MemoryTrace] = {}

    def set_user_profile(self, profile: UserMemoryProfile):
        """Définit le profil utilisateur"""
        self.user_profile = profile

    def create_memory_trace(
        self,
        item_id: str,
        content_type: str = "facts",
        encoding_method: str = "passive"
    ) -> MemoryTrace:
        """
        Crée une nouvelle trace mnésique

        Args:
            item_id: Identifiant unique de l'item
            content_type: Type de contenu (vocabulary, facts, concepts, etc.)
            encoding_method: Méthode d'encodage (passive, active_recall, etc.)

        Returns:
            MemoryTrace initialisée
        """
        # Stabilité de base selon le type
        base_stab = BASE_STABILITY.get(content_type, 2.0)

        # Ajuster selon le profil utilisateur
        user_stab = self.user_profile.stability_by_type.get(content_type, base_stab)

        # Facteur d'encodage
        encoding_factor = ENCODING_FACTORS.get(encoding_method, 1.0)
        encoding_factor *= self.user_profile.encoding_efficiency

        # Stabilité initiale
        initial_stability = user_stab * encoding_factor / self.user_profile.base_decay_rate

        trace = MemoryTrace(
            item_id=item_id,
            content_type=content_type,
            stability=initial_stability,
            last_review=datetime.now(),
            review_count=1,
            initial_encoding=encoding_method,
            retrievability=1.0,
            review_history=[{
                "timestamp": datetime.now().isoformat(),
                "type": "initial_encoding",
                "method": encoding_method
            }]
        )

        self.memory_traces[item_id] = trace
        return trace

    def predict_retention(
        self,
        trace: MemoryTrace,
        days_elapsed: float = None,
        at_time: datetime = None
    ) -> float:
        """
        Prédit la probabilité de rappel

        Utilise la formule de la courbe d'oubli:
        R(t) = e^(-t/S) où S = stabilité

        Args:
            trace: Trace mnésique
            days_elapsed: Jours écoulés depuis la dernière révision
            at_time: Date/heure de prédiction (alternative à days_elapsed)

        Returns:
            Probabilité de rappel (0-1)
        """
        if at_time:
            delta = at_time - trace.last_review
            days_elapsed = delta.total_seconds() / (24 * 3600)
        elif days_elapsed is None:
            delta = datetime.now() - trace.last_review
            days_elapsed = delta.total_seconds() / (24 * 3600)

        if days_elapsed <= 0:
            return 1.0

        # Formule exponentielle: R = e^(-t/S)
        retention = exp(-days_elapsed / trace.stability)

        # Contraindre entre 0.01 et 1.0
        return max(0.01, min(1.0, retention))

    def get_optimal_review_time(
        self,
        trace: MemoryTrace,
        target_retention: float = 0.85
    ) -> datetime:
        """
        Calcule le moment optimal pour réviser

        Args:
            trace: Trace mnésique
            target_retention: Rétention cible (défaut 85%)

        Returns:
            Date/heure optimale de révision
        """
        # t = -S * ln(R)
        days_until_review = -trace.stability * log(target_retention)

        return trace.last_review + timedelta(days=days_until_review)

    def update_after_review(
        self,
        trace: MemoryTrace,
        was_recalled: bool,
        response_time: float = None,  # secondes
        confidence: float = None,  # 0-1
        quality: int = None  # 1-5
    ) -> MemoryTrace:
        """
        Met à jour la trace après une révision

        Args:
            trace: Trace à mettre à jour
            was_recalled: L'item a-t-il été rappelé correctement?
            response_time: Temps de réponse (optionnel)
            confidence: Confiance de l'utilisateur (optionnel)
            quality: Qualité de la réponse 1-5 (optionnel)

        Returns:
            Trace mise à jour
        """
        now = datetime.now()
        days_elapsed = (now - trace.last_review).total_seconds() / (24 * 3600)

        # Prédiction avant la révision (pour calibration)
        predicted_retention = self.predict_retention(trace, days_elapsed)

        # Enregistrer pour calibration
        trace.predicted_vs_actual.append((predicted_retention, was_recalled))
        self._update_calibration(predicted_retention, was_recalled)

        # Calculer le facteur de qualité
        if quality is not None:
            quality_factor = quality / 3.0  # Normaliser autour de 1.0
        elif response_time is not None:
            # Réponse rapide = meilleure qualité
            if response_time < 3:
                quality_factor = 1.3
            elif response_time < 6:
                quality_factor = 1.1
            elif response_time < 12:
                quality_factor = 1.0
            else:
                quality_factor = 0.8
        else:
            quality_factor = 1.0

        # Mettre à jour la stabilité
        if was_recalled:
            # Succès - augmenter la stabilité
            revision_bonus = REVISION_MULTIPLIER * self.user_profile.revision_benefit
            trace.stability *= revision_bonus * quality_factor

            # Bonus si rappelé malgré faible rétention prédite (mémoire plus forte)
            if predicted_retention < 0.5:
                trace.stability *= 1.2  # +20% bonus
        else:
            # Échec - réduire la stabilité
            trace.stability *= 0.6 * quality_factor

            # Pénalité supplémentaire si échec malgré haute rétention prédite
            if predicted_retention > 0.8:
                trace.stability *= 0.8  # -20% supplémentaire

        # Contraindre la stabilité
        trace.stability = max(0.5, min(365, trace.stability))

        # Mettre à jour les métadonnées
        trace.last_review = now
        trace.review_count += 1
        trace.retrievability = 1.0  # Réinitialisé après révision

        # Enregistrer l'historique
        trace.review_history.append({
            "timestamp": now.isoformat(),
            "type": "review",
            "was_recalled": was_recalled,
            "days_elapsed": days_elapsed,
            "predicted_retention": predicted_retention,
            "new_stability": trace.stability
        })

        return trace

    def _update_calibration(self, predicted: float, actual: bool):
        """Met à jour les statistiques de calibration"""
        self.user_profile.total_predictions += 1

        # On considère une prédiction correcte si:
        # - predicted >= 0.5 et actual == True
        # - predicted < 0.5 et actual == False
        if (predicted >= 0.5) == actual:
            self.user_profile.correct_predictions += 1

        # Ajuster les paramètres personnels si assez de données
        if self.user_profile.total_predictions >= 20:
            self._calibrate_user_parameters()

    def _calibrate_user_parameters(self):
        """
        Calibre les paramètres utilisateur basé sur l'historique

        Ajuste base_decay_rate pour améliorer les prédictions
        """
        if self.user_profile.total_predictions < 20:
            return

        accuracy = self.user_profile.correct_predictions / self.user_profile.total_predictions

        # Si précision < 60%, ajuster
        if accuracy < 0.6:
            # Analyser les patterns d'erreur
            # (Version simplifiée - une version complète utiliserait ML)

            # Compter les faux positifs vs faux négatifs
            false_positives = 0  # Prédit succès, échec réel
            false_negatives = 0  # Prédit échec, succès réel

            for trace in self.memory_traces.values():
                for pred, actual in trace.predicted_vs_actual[-10:]:
                    if pred >= 0.5 and not actual:
                        false_positives += 1
                    elif pred < 0.5 and actual:
                        false_negatives += 1

            # Ajuster le taux de decay
            if false_positives > false_negatives * 1.5:
                # Trop optimiste - augmenter le decay
                self.user_profile.base_decay_rate *= 1.1
            elif false_negatives > false_positives * 1.5:
                # Trop pessimiste - diminuer le decay
                self.user_profile.base_decay_rate *= 0.9

            # Contraindre
            self.user_profile.base_decay_rate = max(0.5, min(2.0, self.user_profile.base_decay_rate))

    def get_study_schedule(
        self,
        target_retention: float = 0.85,
        days_ahead: int = 7
    ) -> List[Dict[str, Any]]:
        """
        Génère un planning de révision

        Args:
            target_retention: Rétention cible
            days_ahead: Nombre de jours à planifier

        Returns:
            Liste de révisions planifiées
        """
        schedule = []
        now = datetime.now()
        end_date = now + timedelta(days=days_ahead)

        for item_id, trace in self.memory_traces.items():
            optimal_time = self.get_optimal_review_time(trace, target_retention)

            if optimal_time <= end_date:
                current_retention = self.predict_retention(trace)
                schedule.append({
                    "item_id": item_id,
                    "content_type": trace.content_type,
                    "scheduled_time": optimal_time.isoformat(),
                    "current_retention": round(current_retention, 2),
                    "target_retention": target_retention,
                    "stability": round(trace.stability, 1),
                    "review_count": trace.review_count,
                    "urgency": "high" if current_retention < 0.7 else "normal"
                })

        # Trier par date
        schedule.sort(key=lambda x: x["scheduled_time"])

        return schedule

    def get_memory_statistics(self) -> Dict[str, Any]:
        """
        Retourne les statistiques de mémoire

        Returns:
            Dict avec les métriques
        """
        if not self.memory_traces:
            return {
                "total_items": 0,
                "average_stability": 0,
                "items_at_risk": 0,
                "calibration_accuracy": 0
            }

        stabilities = [t.stability for t in self.memory_traces.values()]
        retentions = [self.predict_retention(t) for t in self.memory_traces.values()]

        at_risk = sum(1 for r in retentions if r < 0.7)

        return {
            "total_items": len(self.memory_traces),
            "average_stability": round(sum(stabilities) / len(stabilities), 1),
            "min_stability": round(min(stabilities), 1),
            "max_stability": round(max(stabilities), 1),
            "average_retention": round(sum(retentions) / len(retentions), 2),
            "items_at_risk": at_risk,
            "calibration_accuracy": round(
                self.user_profile.correct_predictions / max(1, self.user_profile.total_predictions),
                2
            ),
            "user_decay_rate": round(self.user_profile.base_decay_rate, 2)
        }


# ═══════════════════════════════════════════════════════════════════════════════
# FONCTIONS UTILITAIRES
# ═══════════════════════════════════════════════════════════════════════════════

def estimate_retention(
    days_since_learning: float,
    stability: float = 2.0,
    review_count: int = 1
) -> float:
    """
    Estime rapidement la rétention sans créer d'objets

    Args:
        days_since_learning: Jours écoulés
        stability: Stabilité estimée
        review_count: Nombre de révisions

    Returns:
        Probabilité de rappel (0-1)
    """
    # Ajuster la stabilité pour les révisions
    effective_stability = stability * (REVISION_MULTIPLIER ** (review_count - 1))
    effective_stability = min(365, effective_stability)

    retention = exp(-days_since_learning / effective_stability)
    return max(0.01, min(1.0, retention))


def days_until_target_retention(
    current_retention: float,
    target_retention: float,
    stability: float
) -> float:
    """
    Calcule les jours restants jusqu'à une rétention cible

    Args:
        current_retention: Rétention actuelle
        target_retention: Rétention cible
        stability: Stabilité

    Returns:
        Nombre de jours
    """
    if target_retention >= current_retention:
        return 0

    # R = e^(-t/S) => t = -S * ln(R)
    current_days = -stability * log(current_retention)
    target_days = -stability * log(target_retention)

    return max(0, target_days - current_days)


def compare_encoding_methods(content_type: str = "facts") -> Dict[str, Dict[str, float]]:
    """
    Compare l'efficacité des méthodes d'encodage

    Returns:
        Dict avec les statistiques par méthode
    """
    base_stab = BASE_STABILITY.get(content_type, 2.0)

    comparisons = {}
    for method, factor in ENCODING_FACTORS.items():
        stability = base_stab * factor
        comparisons[method] = {
            "stability_days": round(stability, 1),
            "retention_after_1_day": round(estimate_retention(1, stability), 2),
            "retention_after_7_days": round(estimate_retention(7, stability), 2),
            "retention_after_30_days": round(estimate_retention(30, stability), 2),
            "optimal_review_interval": round(-stability * log(0.85), 1)
        }

    return comparisons


def calculate_learning_efficiency(
    items_learned: int,
    total_review_time_minutes: int,
    average_retention: float
) -> Dict[str, float]:
    """
    Calcule l'efficacité de l'apprentissage

    Returns:
        Métriques d'efficacité
    """
    if total_review_time_minutes <= 0:
        return {"error": "Invalid review time"}

    # Items par heure
    items_per_hour = (items_learned / total_review_time_minutes) * 60

    # Score d'efficacité (items * rétention / temps)
    efficiency_score = (items_learned * average_retention) / total_review_time_minutes

    return {
        "items_learned": items_learned,
        "total_time_minutes": total_review_time_minutes,
        "items_per_hour": round(items_per_hour, 1),
        "average_retention": round(average_retention, 2),
        "efficiency_score": round(efficiency_score, 3),
        "estimated_long_term_retention": round(average_retention * 0.8, 2)  # Approximation
    }


__all__ = [
    "PersonalizedForgettingCurve",
    "MemoryTrace",
    "UserMemoryProfile",
    "BASE_STABILITY",
    "ENCODING_FACTORS",
    "estimate_retention",
    "days_until_target_retention",
    "compare_encoding_methods",
    "calculate_learning_efficiency",
]
