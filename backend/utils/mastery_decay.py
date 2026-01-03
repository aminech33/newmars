"""
⏰ Mastery Decay - Système d'oubli naturel des concepts

Implémente la dégradation temporelle de la maîtrise des concepts
selon la courbe d'oubli d'Ebbinghaus.

Les concepts non révisés perdent progressivement en maîtrise,
simulant l'oubli naturel.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any
import math
import logging

logger = logging.getLogger(__name__)


def calculate_decay(
    mastery_level: int,
    days_since_last_review: int,
    ease_factor: float = 2.5,
    learning_strength: int = 1
) -> int:
    """
    Calcule la dégradation de maîtrise selon la courbe d'Ebbinghaus modifiée
    
    Args:
        mastery_level: Niveau actuel (0-100)
        days_since_last_review: Jours depuis dernière révision
        ease_factor: Facteur de facilité (SM-2, 1.3-2.5)
        learning_strength: Force d'apprentissage (nombre de révisions réussies)
    
    Returns:
        Nouveau niveau de maîtrise après decay
    """
    if days_since_last_review <= 0:
        return mastery_level
    
    # Courbe d'Ebbinghaus modifiée avec decay plus progressif
    # R = e^(-t/S) où R=retention, t=time, S=strength
    
    # Strength dépend du ease_factor et du learning_strength
    # On multiplie par des facteurs plus élevés pour ralentir le decay
    base_strength = ease_factor * 10  # Base plus grande pour decay plus lent
    learning_bonus = learning_strength * 5  # Bonus plus important par révision
    retention_strength = base_strength + learning_bonus
    
    # Calculer la rétention (0-1)
    retention = math.exp(-days_since_last_review / retention_strength)
    
    # Appliquer à la maîtrise avec un minimum plus intelligent
    # Le minimum dépend du niveau initial (concepts bien appris gardent plus)
    if mastery_level >= 80:
        min_retention = 0.50  # Haut niveau: garde 50% minimum
    elif mastery_level >= 50:
        min_retention = 0.35  # Niveau moyen: garde 35% minimum
    else:
        min_retention = 0.25  # Faible niveau: garde 25% minimum
    
    effective_retention = min_retention + (1 - min_retention) * retention
    
    new_mastery = int(mastery_level * effective_retention)
    
    return max(0, new_mastery)


def get_decay_schedule(mastery_level: int) -> Dict[str, int]:
    """
    Retourne un planning de dégradation typique
    
    Exemple: Avec mastery=80, retourne:
    {
        "7d": 72,
        "14d": 64,
        "30d": 48,
        "90d": 32
    }
    """
    schedule = {}
    
    for days in [7, 14, 30, 60, 90]:
        decayed = calculate_decay(mastery_level, days)
        schedule[f"{days}d"] = decayed
    
    return schedule


def should_review_concept(
    mastery_level: int,
    days_since_last_review: int,
    ease_factor: float = 2.5
) -> bool:
    """
    Détermine si un concept devrait être révisé maintenant
    
    Basé sur:
    - Niveau de maîtrise actuel
    - Temps écoulé depuis dernière révision
    - Ease factor (difficulté du concept)
    """
    # Concepts à faible maîtrise : révision fréquente
    if mastery_level < 40:
        return days_since_last_review >= 2  # Réviser après 2 jours
    elif mastery_level < 60:
        return days_since_last_review >= 4  # Réviser après 4 jours
    elif mastery_level < 80:
        return days_since_last_review >= 7  # Réviser après 1 semaine
    elif mastery_level < 90:
        return days_since_last_review >= 14  # Réviser après 2 semaines
    else:
        # Concepts bien maîtrisés : révision espacée (3-4 semaines)
        optimal_interval = int(ease_factor * 10)
        return days_since_last_review >= optimal_interval


def apply_decay_to_concepts(
    concepts: List[Dict[str, Any]],
    current_date: datetime = None
) -> List[Dict[str, Any]]:
    """
    Applique la dégradation à une liste de concepts
    
    Args:
        concepts: Liste de concepts avec 'mastery_level', 'last_referenced', 'ease_factor'
        current_date: Date actuelle (par défaut: now)
    
    Returns:
        Liste des concepts avec mastery_level mis à jour
    """
    if current_date is None:
        current_date = datetime.now()
    
    updated_concepts = []
    stats = {
        "total": len(concepts),
        "decayed": 0,
        "avg_decay": 0,
        "max_decay": 0
    }
    
    total_decay = 0
    
    for concept in concepts:
        # Parser la date de dernière référence
        try:
            last_ref_str = concept.get('last_referenced') or concept.get('lastReferenced')
            if not last_ref_str:
                # Jamais référencé, utiliser date d'ajout
                last_ref_str = concept.get('added_at') or concept.get('addedAt')
            
            if not last_ref_str:
                # Pas de date, skip
                updated_concepts.append(concept)
                continue
                
            last_ref = datetime.fromisoformat(last_ref_str.replace('Z', '+00:00'))
            days_since = (current_date - last_ref).days
            
            if days_since <= 0:
                # Pas de decay si < 1 jour
                updated_concepts.append(concept)
                continue
            
            # Calculer decay
            old_mastery = concept.get('mastery_level') or concept.get('masteryLevel', 0)
            ease_factor = concept.get('ease_factor', 2.5)
            repetitions = concept.get('repetitions', 0)
            
            new_mastery = calculate_decay(
                old_mastery,
                days_since,
                ease_factor,
                repetitions
            )
            
            decay_amount = old_mastery - new_mastery
            
            if decay_amount > 0:
                stats["decayed"] += 1
                total_decay += decay_amount
                stats["max_decay"] = max(stats["max_decay"], decay_amount)
                
                logger.debug(
                    f"📉 Concept '{concept.get('concept')}': "
                    f"{old_mastery}% → {new_mastery}% "
                    f"(après {days_since} jours)"
                )
            
            # Créer un nouveau dict avec mastery mis à jour
            updated_concept = concept.copy()
            updated_concept['mastery_level'] = new_mastery
            updated_concept['masteryLevel'] = new_mastery  # Compatibilité
            updated_concepts.append(updated_concept)
            
        except Exception as e:
            logger.error(f"⚠️ Error applying decay to concept: {e}")
            updated_concepts.append(concept)
    
    if stats["decayed"] > 0:
        stats["avg_decay"] = total_decay / stats["decayed"]
        logger.info(
            f"⏰ Decay applied: {stats['decayed']}/{stats['total']} concepts, "
            f"avg decay: {stats['avg_decay']:.1f}%, max: {stats['max_decay']}%"
        )
    
    return updated_concepts


def get_concepts_needing_review(
    concepts: List[Dict[str, Any]],
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Retourne les concepts qui ont le plus besoin de révision
    
    Priorise par:
    1. Temps écoulé vs. interval optimal
    2. Importance du concept (times_referenced)
    3. Niveau de maîtrise actuel
    """
    current_date = datetime.now()
    
    scored_concepts = []
    
    for concept in concepts:
        try:
            last_ref_str = concept.get('last_referenced') or concept.get('lastReferenced')
            if not last_ref_str:
                continue
                
            last_ref = datetime.fromisoformat(last_ref_str.replace('Z', '+00:00'))
            days_since = (current_date - last_ref).days
            
            mastery = concept.get('mastery_level') or concept.get('masteryLevel', 0)
            times_ref = concept.get('times_referenced') or concept.get('timesReferenced', 1)
            
            # Score: combinaison de urgence et importance
            urgency = days_since / max(1, mastery / 10)  # Plus urgent si mastery faible
            importance = math.log(1 + times_ref)  # Logarithme pour éviter sur-pondération
            
            score = urgency * importance
            
            scored_concepts.append({
                "concept": concept,
                "score": score,
                "days_since": days_since,
                "urgency": urgency
            })
            
        except Exception as e:
            logger.error(f"⚠️ Error scoring concept: {e}")
            continue
    
    # Trier par score décroissant
    scored_concepts.sort(key=lambda x: x["score"], reverse=True)
    
    # Retourner les top N concepts
    return [item["concept"] for item in scored_concepts[:limit]]


if __name__ == "__main__":
    # Tests
    print("=== Tests Mastery Decay ===\n")
    
    # Test 1: Dégradation simple
    print("Test 1: Concept bien maîtrisé (80%) après 30 jours")
    decayed = calculate_decay(80, 30, ease_factor=2.5, learning_strength=3)
    print(f"  80% → {decayed}%\n")
    
    # Test 2: Planning
    print("Test 2: Planning de dégradation pour 80%")
    schedule = get_decay_schedule(80)
    for period, mastery in schedule.items():
        print(f"  {period}: {mastery}%")
    print()
    
    # Test 3: Should review?
    print("Test 3: Besoin de révision?")
    test_cases = [
        (30, 1), (30, 5),
        (60, 3), (60, 10),
        (90, 7), (90, 20)
    ]
    for mastery, days in test_cases:
        should = should_review_concept(mastery, days)
        print(f"  Mastery {mastery}%, {days} jours: {'OUI ✓' if should else 'NON'}")

