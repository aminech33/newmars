"""
Pre-sleep Review Scheduling - Planification optimale avant le sommeil

Optimise le timing des révisions pour profiter de la consolidation mnésique:
- Le sommeil consolide les apprentissages récents
- Réviser avant de dormir améliore la rétention de 20-40%
- Les premiers cycles de sommeil sont les plus importants

Fenêtres optimales:
- 30-60 min avant le coucher: Révision légère
- 1-2h avant: Apprentissage actif
- Éviter: Juste avant de dormir (trop stimulant)

Basé sur:
- Diekelmann & Born (2010) - Memory consolidation during sleep
- Peigneux et al. (2004) - Sleep and memory
- Rasch & Born (2013) - About sleep's role in memory
"""
from datetime import datetime, timedelta, time
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
import json


# ═══════════════════════════════════════════════════════════════════════════════
# CONSTANTES ET CONFIGURATIONS
# ═══════════════════════════════════════════════════════════════════════════════

class ReviewIntensity(Enum):
    """Intensité de révision recommandée"""
    LIGHT = "light"           # Rappel simple, flashcards faciles
    MODERATE = "moderate"     # Révision normale
    INTENSIVE = "intensive"   # Apprentissage actif, nouveaux concepts
    AVOID = "avoid"           # Éviter l'apprentissage


# Fenêtres de révision optimales (minutes avant le coucher)
REVIEW_WINDOWS = {
    ReviewIntensity.INTENSIVE: (120, 180),   # 2-3h avant
    ReviewIntensity.MODERATE: (60, 120),     # 1-2h avant
    ReviewIntensity.LIGHT: (30, 60),         # 30min-1h avant
    ReviewIntensity.AVOID: (0, 30),          # 30min avant - trop proche
}

# Bénéfices de consolidation par fenêtre (% boost de rétention)
CONSOLIDATION_BENEFITS = {
    ReviewIntensity.INTENSIVE: 0.25,   # +25% rétention
    ReviewIntensity.MODERATE: 0.35,    # +35% rétention (optimal)
    ReviewIntensity.LIGHT: 0.30,       # +30% rétention
    ReviewIntensity.AVOID: 0.10,       # +10% mais sommeil perturbé
}

# Types de contenu optimaux par fenêtre
OPTIMAL_CONTENT = {
    ReviewIntensity.INTENSIVE: [
        "new_concepts",
        "complex_problems",
        "procedural_knowledge"
    ],
    ReviewIntensity.MODERATE: [
        "review_weak_areas",
        "spaced_repetition",
        "vocabulary"
    ],
    ReviewIntensity.LIGHT: [
        "simple_recall",
        "familiar_material",
        "visualization"
    ],
    ReviewIntensity.AVOID: [
        "nothing_stimulating",
        "relaxation_only"
    ]
}


@dataclass
class SleepSchedule:
    """Horaires de sommeil de l'utilisateur"""
    usual_bedtime: time  # Heure de coucher habituelle
    usual_waketime: time  # Heure de lever habituelle
    sleep_quality: float = 0.8  # 0-1, qualité moyenne du sommeil
    nap_time: Optional[time] = None  # Sieste si applicable
    is_night_owl: bool = False  # Couche-tard?
    timezone_offset: int = 0  # Décalage horaire en heures


@dataclass
class ReviewSlot:
    """Créneau de révision recommandé"""
    start_time: datetime
    end_time: datetime
    intensity: ReviewIntensity
    recommended_content: List[str]
    consolidation_benefit: float
    priority: int  # 1=haute, 3=basse


@dataclass
class PreSleepPlan:
    """Plan de révision pré-sommeil"""
    date: datetime
    bedtime: datetime
    review_slots: List[ReviewSlot]
    total_review_time_minutes: int
    expected_retention_boost: float
    personalized_tips: List[str]


class PreSleepScheduler:
    """
    Planificateur de révisions pré-sommeil

    Usage:
        scheduler = PreSleepScheduler()
        scheduler.set_sleep_schedule(bedtime=time(23, 0), waketime=time(7, 0))

        # Obtenir le plan pour aujourd'hui
        plan = scheduler.get_presleep_plan()

        # Vérifier si c'est le bon moment pour réviser
        is_optimal, recommendation = scheduler.check_current_timing()
    """

    def __init__(self, sleep_schedule: SleepSchedule = None):
        self.sleep_schedule = sleep_schedule or SleepSchedule(
            usual_bedtime=time(23, 0),
            usual_waketime=time(7, 0)
        )
        self.learning_history: List[Dict[str, Any]] = []

    def set_sleep_schedule(
        self,
        bedtime: time = None,
        waketime: time = None,
        sleep_quality: float = None,
        is_night_owl: bool = None
    ):
        """Configure les horaires de sommeil"""
        if bedtime:
            self.sleep_schedule.usual_bedtime = bedtime
        if waketime:
            self.sleep_schedule.usual_waketime = waketime
        if sleep_quality is not None:
            self.sleep_schedule.sleep_quality = sleep_quality
        if is_night_owl is not None:
            self.sleep_schedule.is_night_owl = is_night_owl

    def get_presleep_plan(
        self,
        target_date: datetime = None,
        available_minutes: int = 60
    ) -> PreSleepPlan:
        """
        Génère un plan de révision pré-sommeil

        Args:
            target_date: Date cible (défaut: aujourd'hui)
            available_minutes: Temps disponible pour réviser

        Returns:
            Plan de révision optimisé
        """
        target_date = target_date or datetime.now()

        # Calculer l'heure de coucher pour cette date
        bedtime = datetime.combine(
            target_date.date(),
            self.sleep_schedule.usual_bedtime
        )

        # Si l'heure de coucher est passée, prendre demain
        if bedtime < datetime.now():
            bedtime += timedelta(days=1)

        # Générer les créneaux
        review_slots = self._generate_review_slots(bedtime, available_minutes)

        # Calculer les métriques
        total_time = sum(
            (slot.end_time - slot.start_time).seconds // 60
            for slot in review_slots
        )

        expected_boost = sum(
            slot.consolidation_benefit * (
                (slot.end_time - slot.start_time).seconds / 3600
            )
            for slot in review_slots
        ) / max(1, len(review_slots))

        # Conseils personnalisés
        tips = self._generate_tips()

        return PreSleepPlan(
            date=target_date,
            bedtime=bedtime,
            review_slots=review_slots,
            total_review_time_minutes=total_time,
            expected_retention_boost=round(expected_boost, 2),
            personalized_tips=tips
        )

    def _generate_review_slots(
        self,
        bedtime: datetime,
        available_minutes: int
    ) -> List[ReviewSlot]:
        """Génère les créneaux de révision"""
        slots = []

        # Calculer les fenêtres temporelles
        for intensity in [ReviewIntensity.INTENSIVE, ReviewIntensity.MODERATE, ReviewIntensity.LIGHT]:
            window = REVIEW_WINDOWS[intensity]
            start_offset = window[1]  # Minutes avant coucher (début)
            end_offset = window[0]    # Minutes avant coucher (fin)

            slot_start = bedtime - timedelta(minutes=start_offset)
            slot_end = bedtime - timedelta(minutes=end_offset)

            # Vérifier si le créneau est dans le futur
            if slot_end > datetime.now():
                slots.append(ReviewSlot(
                    start_time=max(slot_start, datetime.now()),
                    end_time=slot_end,
                    intensity=intensity,
                    recommended_content=OPTIMAL_CONTENT[intensity],
                    consolidation_benefit=CONSOLIDATION_BENEFITS[intensity],
                    priority=len(slots) + 1
                ))

        # Limiter au temps disponible
        remaining_time = available_minutes
        filtered_slots = []

        for slot in slots:
            slot_duration = (slot.end_time - slot.start_time).seconds // 60

            if remaining_time <= 0:
                break

            if slot_duration > remaining_time:
                # Raccourcir le créneau
                slot.end_time = slot.start_time + timedelta(minutes=remaining_time)
                slot_duration = remaining_time

            filtered_slots.append(slot)
            remaining_time -= slot_duration

        return filtered_slots

    def _generate_tips(self) -> List[str]:
        """Génère des conseils personnalisés"""
        tips = []

        # Conseil basé sur la qualité du sommeil
        if self.sleep_schedule.sleep_quality < 0.6:
            tips.append(
                "💤 Votre qualité de sommeil est faible. Priorisez le sommeil "
                "sur les révisions ce soir."
            )

        # Conseil pour les couche-tard
        if self.sleep_schedule.is_night_owl:
            tips.append(
                "🦉 Comme couche-tard, vos révisions tardives peuvent être efficaces. "
                "Mais attention à ne pas trop retarder le coucher."
            )

        # Conseils généraux
        tips.extend([
            "📵 Évitez les écrans 30 min avant de dormir pour une meilleure consolidation.",
            "🧘 Une courte méditation après les révisions peut améliorer l'encodage.",
            "💧 Restez hydraté mais évitez trop de liquide avant le coucher."
        ])

        return tips[:3]  # Max 3 conseils

    def check_current_timing(self) -> Tuple[bool, Dict[str, Any]]:
        """
        Vérifie si c'est un bon moment pour réviser

        Returns:
            (is_optimal, recommendation_dict)
        """
        now = datetime.now()
        today_bedtime = datetime.combine(now.date(), self.sleep_schedule.usual_bedtime)

        # Ajuster si après minuit
        if now.time() < self.sleep_schedule.usual_bedtime and now.hour < 6:
            today_bedtime -= timedelta(days=1)
        elif now > today_bedtime:
            today_bedtime += timedelta(days=1)

        minutes_to_bed = (today_bedtime - now).seconds // 60

        # Déterminer l'intensité recommandée
        recommended_intensity = None
        for intensity, (min_window, max_window) in REVIEW_WINDOWS.items():
            if min_window <= minutes_to_bed < max_window:
                recommended_intensity = intensity
                break

        if recommended_intensity is None:
            if minutes_to_bed > 180:
                # Plus de 3h avant le coucher
                return True, {
                    "is_optimal": True,
                    "timing": "early",
                    "minutes_to_bedtime": minutes_to_bed,
                    "recommendation": "Bon moment pour l'apprentissage intensif!",
                    "intensity": ReviewIntensity.INTENSIVE.value,
                    "consolidation_benefit": 0.20
                }
            else:
                # Trop proche du coucher
                return False, {
                    "is_optimal": False,
                    "timing": "too_close",
                    "minutes_to_bedtime": minutes_to_bed,
                    "recommendation": "Trop proche du coucher. Reposez-vous!",
                    "intensity": ReviewIntensity.AVOID.value,
                    "consolidation_benefit": 0.05
                }

        is_optimal = recommended_intensity in [ReviewIntensity.MODERATE, ReviewIntensity.LIGHT]

        return is_optimal, {
            "is_optimal": is_optimal,
            "timing": recommended_intensity.value,
            "minutes_to_bedtime": minutes_to_bed,
            "recommendation": self._get_timing_recommendation(recommended_intensity),
            "intensity": recommended_intensity.value,
            "consolidation_benefit": CONSOLIDATION_BENEFITS[recommended_intensity],
            "recommended_content": OPTIMAL_CONTENT[recommended_intensity]
        }

    def _get_timing_recommendation(self, intensity: ReviewIntensity) -> str:
        """Retourne une recommandation basée sur l'intensité"""
        recommendations = {
            ReviewIntensity.INTENSIVE: (
                "🎯 Fenêtre d'apprentissage actif! "
                "Idéal pour nouveaux concepts et problèmes complexes."
            ),
            ReviewIntensity.MODERATE: (
                "✨ Fenêtre OPTIMALE! Révisez vos points faibles. "
                "Le sommeil consolidera ces apprentissages."
            ),
            ReviewIntensity.LIGHT: (
                "🌙 Révision légère recommandée. "
                "Flashcards et rappel simple uniquement."
            ),
            ReviewIntensity.AVOID: (
                "😴 Trop proche du coucher! "
                "Évitez l'apprentissage stimulant."
            )
        }
        return recommendations.get(intensity, "")

    def record_presleep_session(
        self,
        session_start: datetime,
        session_end: datetime,
        topics_reviewed: List[str],
        performance_score: float
    ):
        """
        Enregistre une session de révision pré-sommeil

        Utile pour calibrer les recommandations futures
        """
        bedtime = datetime.combine(
            session_end.date(),
            self.sleep_schedule.usual_bedtime
        )

        minutes_before_bed = (bedtime - session_end).seconds // 60

        self.learning_history.append({
            "date": session_start.isoformat(),
            "duration_minutes": (session_end - session_start).seconds // 60,
            "minutes_before_bed": minutes_before_bed,
            "topics": topics_reviewed,
            "performance": performance_score
        })

    def get_optimal_topics_for_presleep(
        self,
        available_topics: List[Dict[str, Any]],
        current_time: datetime = None
    ) -> List[Dict[str, Any]]:
        """
        Sélectionne les topics optimaux pour une révision pré-sommeil

        Priorité:
        1. Topics en risque d'oubli
        2. Topics récemment appris (besoin de consolidation)
        3. Topics avec faible maîtrise

        Args:
            available_topics: Liste de topics avec métadonnées
            current_time: Heure actuelle (défaut: maintenant)

        Returns:
            Topics triés par priorité pour révision pré-sommeil
        """
        current_time = current_time or datetime.now()
        is_optimal, timing_info = self.check_current_timing()

        intensity = timing_info.get("intensity", "moderate")

        scored_topics = []
        for topic in available_topics:
            score = 0

            # Score basé sur la rétention estimée
            retention = topic.get("estimated_retention", 0.8)
            if retention < 0.5:
                score += 30  # Priorité haute si risque d'oubli
            elif retention < 0.7:
                score += 20

            # Score basé sur la fraîcheur (appris récemment = bon pour consolidation)
            last_review = topic.get("last_review")
            if last_review:
                hours_since = (current_time - datetime.fromisoformat(last_review)).seconds / 3600
                if hours_since < 4:
                    score += 25  # Très récent - excellente consolidation
                elif hours_since < 12:
                    score += 15

            # Score basé sur la maîtrise
            mastery = topic.get("mastery_level", 50)
            if mastery < 40:
                score += 15
            elif mastery < 60:
                score += 10

            # Ajuster selon l'intensité recommandée
            if intensity == "light":
                # Favoriser les topics bien maîtrisés (rappel simple)
                if mastery > 70:
                    score += 10
            elif intensity == "intensive":
                # Favoriser les nouveaux topics
                if topic.get("is_new", False):
                    score += 20

            scored_topics.append({
                **topic,
                "presleep_score": score,
                "presleep_reason": self._get_topic_reason(retention, mastery, intensity)
            })

        # Trier par score décroissant
        scored_topics.sort(key=lambda x: x["presleep_score"], reverse=True)

        return scored_topics

    def _get_topic_reason(
        self,
        retention: float,
        mastery: int,
        intensity: str
    ) -> str:
        """Génère une raison pour la recommandation"""
        if retention < 0.5:
            return "🔴 Risque d'oubli - révision urgente"
        elif retention < 0.7:
            return "🟡 Consolidation recommandée"
        elif mastery < 40:
            return "📈 Renforcement nécessaire"
        elif intensity == "light" and mastery > 70:
            return "✅ Rappel simple pour solidifier"
        return "📚 Révision standard"


# ═══════════════════════════════════════════════════════════════════════════════
# FONCTIONS UTILITAIRES
# ═══════════════════════════════════════════════════════════════════════════════

def get_sleep_consolidation_estimate(
    review_time: datetime,
    bedtime: time,
    sleep_duration_hours: float = 7.5
) -> Dict[str, Any]:
    """
    Estime le bénéfice de consolidation du sommeil

    Args:
        review_time: Heure de fin de révision
        bedtime: Heure de coucher
        sleep_duration_hours: Durée du sommeil

    Returns:
        Estimation des bénéfices
    """
    # Calculer le temps entre révision et coucher
    bedtime_dt = datetime.combine(review_time.date(), bedtime)
    if bedtime_dt < review_time:
        bedtime_dt += timedelta(days=1)

    gap_minutes = (bedtime_dt - review_time).seconds // 60

    # Estimer le bénéfice
    if gap_minutes < 30:
        benefit = 0.10
        quality = "poor"
        note = "Trop proche du coucher - consolidation réduite"
    elif gap_minutes < 60:
        benefit = 0.30
        quality = "good"
        note = "Révision légère idéale à cette heure"
    elif gap_minutes < 120:
        benefit = 0.35
        quality = "excellent"
        note = "Fenêtre optimale pour la consolidation"
    elif gap_minutes < 180:
        benefit = 0.25
        quality = "good"
        note = "Bon timing pour apprentissage actif"
    else:
        benefit = 0.15
        quality = "moderate"
        note = "Apprentissage sera partiellement consolidé"

    # Ajuster pour la durée du sommeil
    sleep_factor = min(1.0, sleep_duration_hours / 8)
    adjusted_benefit = benefit * sleep_factor

    return {
        "consolidation_benefit": round(adjusted_benefit, 2),
        "quality": quality,
        "gap_minutes": gap_minutes,
        "note": note,
        "expected_retention_day_after": round(0.8 + adjusted_benefit * 0.2, 2)
    }


def create_presleep_reminder(
    bedtime: time,
    reminder_minutes_before: int = 90
) -> Dict[str, Any]:
    """
    Crée un rappel pour la révision pré-sommeil

    Returns:
        Configuration du rappel
    """
    bedtime_dt = datetime.combine(datetime.now().date(), bedtime)

    # Ajuster si l'heure est passée
    if bedtime_dt < datetime.now():
        bedtime_dt += timedelta(days=1)

    reminder_time = bedtime_dt - timedelta(minutes=reminder_minutes_before)

    return {
        "reminder_time": reminder_time.isoformat(),
        "bedtime": bedtime_dt.isoformat(),
        "message": f"🌙 C'est le moment idéal pour {reminder_minutes_before // 60}h de révision avant le coucher!",
        "review_window_ends": (bedtime_dt - timedelta(minutes=30)).isoformat(),
        "suggested_duration_minutes": min(60, reminder_minutes_before - 30)
    }


def calculate_weekly_presleep_schedule(
    bedtimes: Dict[str, time],  # {"monday": time(23, 0), ...}
    available_topics: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Génère un planning hebdomadaire de révisions pré-sommeil

    Args:
        bedtimes: Heures de coucher par jour
        available_topics: Topics à réviser

    Returns:
        Planning de la semaine
    """
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

    weekly_plan = {}
    topics_to_review = available_topics.copy()

    for i, day in enumerate(days):
        bedtime = bedtimes.get(day, time(23, 0))

        # Sélectionner 3-5 topics pour ce jour
        day_topics = topics_to_review[:4]

        # Rotation des topics
        topics_to_review = topics_to_review[4:] + day_topics

        weekly_plan[day] = {
            "bedtime": bedtime.isoformat(),
            "optimal_review_start": (
                datetime.combine(datetime.now().date() + timedelta(days=i), bedtime)
                - timedelta(minutes=90)
            ).strftime("%H:%M"),
            "topics": [t.get("name", t.get("id", "")) for t in day_topics],
            "estimated_duration_minutes": len(day_topics) * 10,
            "expected_consolidation_benefit": 0.30
        }

    return weekly_plan


__all__ = [
    "PreSleepScheduler",
    "PreSleepPlan",
    "ReviewSlot",
    "SleepSchedule",
    "ReviewIntensity",
    "get_sleep_consolidation_estimate",
    "create_presleep_reminder",
    "calculate_weekly_presleep_schedule",
    "REVIEW_WINDOWS",
    "CONSOLIDATION_BENEFITS",
]
