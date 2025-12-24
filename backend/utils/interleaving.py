"""
Interleaving Algorithm - Pratique entrelacée pour améliorer la rétention

L'interleaving consiste à mélanger plusieurs topics/concepts pendant l'apprentissage
au lieu de se concentrer sur un seul. Améliore la rétention de 10-15% selon les études.

Stratégie:
- Sélectionne 2-3 topics à pratiquer ensemble
- Mélange difficile + moyen + facile pour équilibre
- Alterne entre topics toutes les 2-3 questions
"""
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timedelta


def select_interleaved_topics(
    user_mastery: Dict[str, Any],
    available_topics: List[str],
    num_topics: int = 3,
    min_topics: int = 2
) -> List[Dict[str, Any]]:
    """
    Sélectionne les topics à pratiquer avec interleaving
    
    Stratégie:
    1. Filtre les topics qui ont besoin de révision (next_review proche)
    2. Sélectionne un mix de niveaux de difficulté:
       - 1 topic difficile (mastery < 50%)
       - 1 topic moyen (50-80%)
       - 1 topic facile (>80%) pour confiance
    
    Args:
        user_mastery: Dict des masteries de l'utilisateur par topic
        available_topics: Liste des topic_ids disponibles
        num_topics: Nombre de topics à sélectionner (default 3)
        min_topics: Minimum de topics (default 2)
        
    Returns:
        Liste de topics avec leurs métadonnées triées par priorité
    """
    
    # Initialiser les topics manquants
    for topic_id in available_topics:
        if topic_id not in user_mastery:
            user_mastery[topic_id] = {
                "mastery_level": 0,
                "ease_factor": 2.5,
                "interval": 1,
                "repetitions": 0,
                "success_rate": 0.0,
                "consecutive_skips": 0,
                "total_attempts": 0,
                "correct_attempts": 0,
                "last_practiced": None,
                "next_review": datetime.now()
            }
    
    # Récupérer les topics avec métadonnées
    topics_with_data = []
    now = datetime.now()
    
    for topic_id, data in user_mastery.items():
        if topic_id not in available_topics:
            continue
            
        # Calculer la priorité de révision
        next_review = data.get("next_review", now)
        if isinstance(next_review, str):
            next_review = datetime.fromisoformat(next_review)
        
        days_until_review = (next_review - now).days
        
        # Calculer le score de priorité (plus bas = plus prioritaire)
        # Facteurs: urgence + faible maîtrise + peu pratiqué
        urgency_score = max(0, -days_until_review)  # Négatif = en retard
        mastery_score = 100 - data["mastery_level"]  # Inverse de la maîtrise
        practice_score = 50 if data["total_attempts"] < 3 else 0  # Boost nouveaux topics
        
        priority_score = urgency_score * 2 + mastery_score + practice_score
        
        topics_with_data.append({
            "topic_id": topic_id,
            "mastery_level": data["mastery_level"],
            "success_rate": data["success_rate"],
            "total_attempts": data["total_attempts"],
            "days_until_review": days_until_review,
            "priority_score": priority_score,
            "ease_factor": data["ease_factor"],
            "interval": data["interval"]
        })
    
    # Trier par priorité
    topics_with_data.sort(key=lambda x: x["priority_score"], reverse=True)
    
    # Si pas assez de topics, retourner ce qu'on a
    if len(topics_with_data) < min_topics:
        return topics_with_data
    
    # Sélectionner un mix équilibré
    selected = []
    
    # 1. Sélectionner topics par niveau de maîtrise
    difficult_topics = [t for t in topics_with_data if t["mastery_level"] < 50]
    medium_topics = [t for t in topics_with_data if 50 <= t["mastery_level"] < 80]
    easy_topics = [t for t in topics_with_data if t["mastery_level"] >= 80]
    
    # Prioriser un topic difficile (celui avec meilleure priorité)
    if difficult_topics:
        selected.append(difficult_topics[0])
    
    # Ajouter un topic moyen
    if medium_topics and len(selected) < num_topics:
        selected.append(medium_topics[0])
    
    # Ajouter un topic facile (pour confiance et interleaving)
    if easy_topics and len(selected) < num_topics:
        selected.append(easy_topics[0])
    
    # Si pas assez de topics, compléter avec les plus prioritaires
    while len(selected) < num_topics and len(selected) < len(topics_with_data):
        for topic in topics_with_data:
            if topic not in selected:
                selected.append(topic)
                break
    
    # Garantir minimum 2 topics
    if len(selected) < min_topics:
        return topics_with_data[:min_topics]
    
    return selected


def get_next_topic_in_sequence(
    session_history: List[str],
    available_topics: List[Dict[str, Any]],
    switch_frequency: int = 2
) -> str:
    """
    Détermine quel topic pratiquer maintenant selon l'historique
    
    Stratégie d'alternance:
    - Change de topic toutes les `switch_frequency` questions
    - Évite de répéter le même topic 2 fois de suite sauf si c'est le seul
    
    Args:
        session_history: Liste des topic_ids pratiqués dans cette session
        available_topics: Topics disponibles pour interleaving
        switch_frequency: Nombre de questions avant de changer de topic
        
    Returns:
        topic_id à pratiquer maintenant
    """
    
    if not available_topics:
        raise ValueError("Aucun topic disponible")
    
    if len(available_topics) == 1:
        return available_topics[0]["topic_id"]
    
    # Si pas d'historique, commencer par le topic le plus prioritaire
    if not session_history:
        return available_topics[0]["topic_id"]
    
    # Compter les questions consécutives du dernier topic
    last_topic = session_history[-1]
    consecutive_count = 1
    
    for i in range(len(session_history) - 2, -1, -1):
        if session_history[i] == last_topic:
            consecutive_count += 1
        else:
            break
    
    # Si on a atteint la fréquence de switch, changer de topic
    if consecutive_count >= switch_frequency:
        # Sélectionner un topic différent
        for topic in available_topics:
            if topic["topic_id"] != last_topic:
                return topic["topic_id"]
    
    # Sinon, continuer avec le même topic
    return last_topic


def calculate_interleaving_benefit(
    num_topics: int,
    session_length: int,
    mastery_variance: float
) -> float:
    """
    Estime le bénéfice de l'interleaving pour cette session
    
    Facteurs:
    - Plus de topics = plus de bénéfice (jusqu'à 3-4)
    - Sessions plus longues = plus de bénéfice
    - Variance de maîtrise élevée = meilleur équilibre
    
    Args:
        num_topics: Nombre de topics dans la session
        session_length: Nombre de questions prévues
        mastery_variance: Variance des niveaux de maîtrise
        
    Returns:
        Pourcentage de bonus de rétention estimé (0-15%)
    """
    
    # Bénéfice de base selon le nombre de topics
    if num_topics <= 1:
        return 0.0
    elif num_topics == 2:
        topic_benefit = 8.0
    elif num_topics == 3:
        topic_benefit = 12.0
    else:
        topic_benefit = 15.0
    
    # Bonus pour sessions longues (plus d'alternances possibles)
    length_multiplier = min(1.0, session_length / 10)
    
    # Bonus pour variance (mix difficile/facile)
    variance_multiplier = min(1.0, mastery_variance / 30)
    
    total_benefit = topic_benefit * length_multiplier * (0.7 + 0.3 * variance_multiplier)
    
    return round(total_benefit, 1)


def should_use_interleaving(
    user_mastery: Dict[str, Any],
    available_topics: List[str]
) -> bool:
    """
    Détermine si l'interleaving est approprié pour cet utilisateur
    
    L'interleaving N'est PAS recommandé si:
    - Moins de 2 topics disponibles
    - Tous les topics sont nouveaux (mastery = 0)
    - Pas assez de pratique (< 5 tentatives totales)
    - L'utilisateur est en difficulté (success_rate < 0.4)
    - Tous les topics ont mastery < 20% (encore en apprentissage initial)
    
    ⚠️ L'interleaving est UNIQUEMENT pour les révisions, pas l'apprentissage initial
    
    Args:
        user_mastery: Masteries de l'utilisateur
        available_topics: Topics disponibles
        
    Returns:
        True si l'interleaving est recommandé
    """
    
    if len(available_topics) < 2:
        return False
    
    # Vérifier si au moins un topic a été pratiqué
    practiced_topics = [
        t for t in available_topics
        if t in user_mastery and user_mastery[t].get("total_attempts", 0) > 0
    ]
    
    if len(practiced_topics) < 1:
        # Débutant complet - commencer par un seul topic
        return False
    
    # NOUVEAU : Vérifier le niveau de maîtrise minimum
    # Interleaving uniquement si au moins un topic a mastery >= 20%
    masteries = [
        user_mastery.get(t, {}).get("mastery_level", 0)
        for t in available_topics
        if t in user_mastery
    ]
    
    if masteries and max(masteries) < 20:
        # Tous les topics sont en apprentissage initial
        # Mieux vaut se concentrer sur un seul
        return False
    
    # Vérifier le nombre total de tentatives
    total_attempts = sum(
        user_mastery.get(t, {}).get("total_attempts", 0)
        for t in available_topics
    )
    
    # NOUVEAU : Besoin d'au moins 5 tentatives pour avoir des stats fiables
    if total_attempts < 5:
        return False
    
    correct_attempts = sum(
        user_mastery.get(t, {}).get("correct_attempts", 0)
        for t in available_topics
    )
    
    if total_attempts > 0:
        global_success_rate = correct_attempts / total_attempts
        
        # MODIFIÉ : Seuil augmenté de 0.3 à 0.4
        # Si en difficulté, se concentrer sur un seul topic
        if global_success_rate < 0.4:
            return False
    
    return True

