"""
🧠 API Routes pour la Knowledge Base (base de connaissances)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from database import concepts_manager
from utils.mastery_decay import (
    apply_decay_to_concepts,
    get_concepts_needing_review,
    should_review_concept
)
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/knowledge", tags=["Knowledge Base"])


# ═══════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════

class ConceptCreate(BaseModel):
    concept: str
    courseId: str
    category: Optional[str] = None
    definition: Optional[str] = None
    example: Optional[str] = None
    keywords: Optional[List[str]] = None


class ConceptUpdate(BaseModel):
    conceptId: int
    masteryLevel: int


class ConceptSearch(BaseModel):
    courseId: str
    query: str
    limit: Optional[int] = 10


# ═══════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════

@router.post("/add")
async def add_concept(data: ConceptCreate):
    """
    Ajoute ou met à jour un concept dans la base de connaissances
    
    L'IA appelle automatiquement cet endpoint après chaque réponse
    pour stocker les concepts mentionnés.
    """
    try:
        success = concepts_manager.add_concept(
            concept=data.concept,
            course_id=data.courseId,
            category=data.category,
            definition=data.definition,
            example=data.example,
            keywords=data.keywords
        )
        
        if success:
            return {"success": True, "message": "Concept added/updated"}
        else:
            raise HTTPException(status_code=500, detail="Failed to add concept")
            
    except Exception as e:
        logger.error(f"❌ Error in add_concept: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{course_id}")
async def get_concepts(course_id: str, limit: Optional[int] = None):
    """
    Récupère tous les concepts d'un cours
    
    Appelé au chargement du cours pour avoir le "repère" complet
    de ce que l'étudiant connaît.
    """
    try:
        concepts = concepts_manager.get_concepts(course_id, limit)
        return {
            "concepts": concepts,
            "total": len(concepts)
        }
        
    except Exception as e:
        logger.error(f"❌ Error in get_concepts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search")
async def search_concepts(data: ConceptSearch):
    """
    Recherche des concepts pertinents pour un message
    
    Appelé avant chaque message à l'IA pour enrichir le contexte
    avec les concepts déjà connus et pertinents.
    """
    try:
        concepts = concepts_manager.search_concepts(
            course_id=data.courseId,
            query=data.query,
            limit=data.limit
        )
        return {
            "concepts": concepts,
            "found": len(concepts)
        }
        
    except Exception as e:
        logger.error(f"❌ Error in search_concepts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update-mastery")
async def update_mastery(data: ConceptUpdate):
    """
    Met à jour le niveau de maîtrise d'un concept
    
    Peut être appelé manuellement par l'utilisateur ou
    automatiquement après évaluation IA.
    """
    try:
        success = concepts_manager.update_mastery(
            concept_id=data.conceptId,
            mastery_level=data.masteryLevel
        )
        
        if success:
            return {"success": True, "message": "Mastery updated"}
        else:
            raise HTTPException(status_code=500, detail="Failed to update mastery")
            
    except Exception as e:
        logger.error(f"❌ Error in update_mastery: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{course_id}/stats")
async def get_stats(course_id: str):
    """
    Récupère les stats de la base de connaissances d'un cours
    
    Utilisé pour afficher des métriques globales dans l'UI.
    """
    try:
        stats = concepts_manager.get_stats(course_id)
        return stats
        
    except Exception as e:
        logger.error(f"❌ Error in get_stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-add")
async def batch_add_concepts(concepts: List[ConceptCreate]):
    """
    Ajoute plusieurs concepts en batch
    
    Utilisé quand l'IA mentionne plusieurs concepts dans une seule réponse.
    Plus efficace que des appels individuels.
    """
    try:
        added = 0
        failed = 0
        
        for concept_data in concepts:
            success = concepts_manager.add_concept(
                concept=concept_data.concept,
                course_id=concept_data.courseId,
                category=concept_data.category,
                definition=concept_data.definition,
                example=concept_data.example,
                keywords=concept_data.keywords
            )
            
            if success:
                added += 1
            else:
                failed += 1
        
        return {
            "success": True,
            "added": added,
            "failed": failed,
            "total": len(concepts)
        }
        
    except Exception as e:
        logger.error(f"❌ Error in batch_add_concepts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/track-usage")
async def track_concept_usage(data: dict):
    """
    Track l'usage actif d'un concept par l'étudiant
    
    Appelé quand l'étudiant:
    - Utilise un concept dans une question/réponse
    - Écrit du code utilisant ce concept
    - Référence le concept dans sa conversation
    
    Augmente légèrement la maîtrise pour indiquer utilisation active.
    """
    try:
        course_id = data.get("courseId")
        user_message = data.get("userMessage", "")
        code_context = data.get("codeContext")
        
        if not course_id or not user_message:
            raise HTTPException(status_code=400, detail="courseId and userMessage required")
        
        # Récupérer tous les concepts du cours
        concepts = concepts_manager.get_concepts(course_id, limit=None)
        
        # Analyser le message pour détecter l'usage de concepts
        message_lower = user_message.lower()
        code_lower = code_context.lower() if code_context else ""
        
        updated_concepts = []
        
        for concept in concepts:
            concept_lower = concept['concept'].lower()
            keywords_lower = [k.lower() for k in concept['keywords']]
            
            # Vérifier si le concept est utilisé
            used_in_message = concept_lower in message_lower
            used_in_code = code_lower and concept_lower in code_lower
            keyword_match = any(kw in message_lower or (code_lower and kw in code_lower) 
                               for kw in keywords_lower)
            
            # Critères d'usage actif (plus strict qu'une simple mention)
            is_active_usage = (
                (used_in_message or used_in_code) and
                len(user_message) > 30  # Message substantiel
            ) or (
                keyword_match and 
                (used_in_code or len(user_message) > 50)  # Code ou question détaillée
            )
            
            if is_active_usage:
                # Incrémenter mastery légèrement (+2-5% selon le niveau actuel)
                current_mastery = concept['mastery_level']
                
                # Plus la maîtrise est faible, plus le boost est important
                if current_mastery < 20:
                    boost = 5
                elif current_mastery < 50:
                    boost = 3
                else:
                    boost = 2
                
                new_mastery = min(100, current_mastery + boost)
                
                success = concepts_manager.update_mastery(concept['id'], new_mastery)
                
                if success:
                    updated_concepts.append({
                        "concept": concept['concept'],
                        "old_mastery": current_mastery,
                        "new_mastery": new_mastery,
                        "boost": boost
                    })
                    
                    logger.info(f"📈 Active usage detected: '{concept['concept']}' {current_mastery}% → {new_mastery}%")
        
        return {
            "success": True,
            "updated_count": len(updated_concepts),
            "updated_concepts": updated_concepts
        }
        
    except Exception as e:
        logger.error(f"❌ Error in track_concept_usage: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/apply-decay/{course_id}")
async def apply_decay(course_id: str):
    """
    Applique la dégradation temporelle aux concepts d'un cours
    
    Devrait être appelé:
    - Au chargement d'un cours (pour mettre à jour les mastery)
    - Périodiquement (cron job quotidien)
    - Avant de générer des quiz/révisions
    
    Simule l'oubli naturel selon la courbe d'Ebbinghaus.
    """
    try:
        # Récupérer tous les concepts du cours
        concepts = concepts_manager.get_concepts(course_id, limit=None)
        
        if not concepts:
            return {
                "success": True,
                "message": "No concepts to decay",
                "updated_count": 0
            }
        
        # Appliquer le decay
        updated_concepts = apply_decay_to_concepts(concepts)
        
        # Mettre à jour chaque concept dans la DB
        updated_count = 0
        
        for old_concept, new_concept in zip(concepts, updated_concepts):
            old_mastery = old_concept['mastery_level']
            new_mastery = new_concept['mastery_level']
            
            if old_mastery != new_mastery:
                success = concepts_manager.update_mastery(
                    old_concept['id'],
                    new_mastery
                )
                
                if success:
                    updated_count += 1
        
        logger.info(f"⏰ Decay applied to course {course_id}: {updated_count}/{len(concepts)} concepts updated")
        
        return {
            "success": True,
            "message": f"Decay applied to {updated_count} concepts",
            "total_concepts": len(concepts),
            "updated_count": updated_count
        }
        
    except Exception as e:
        logger.error(f"❌ Error in apply_decay: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{course_id}/review-needed")
async def get_review_needed(course_id: str, limit: int = 10):
    """
    Retourne les concepts qui ont le plus besoin de révision
    
    Basé sur:
    - Temps depuis dernière révision
    - Niveau de maîtrise
    - Importance du concept (times_referenced)
    """
    try:
        # Récupérer tous les concepts
        concepts = concepts_manager.get_concepts(course_id, limit=None)
        
        if not concepts:
            return {
                "success": True,
                "concepts": [],
                "count": 0
            }
        
        # Appliquer decay d'abord (pour avoir mastery à jour)
        updated_concepts = apply_decay_to_concepts(concepts)
        
        # Trouver ceux qui ont besoin de révision
        review_needed = get_concepts_needing_review(updated_concepts, limit=limit)
        
        return {
            "success": True,
            "concepts": review_needed,
            "count": len(review_needed)
        }
        
    except Exception as e:
        logger.error(f"❌ Error in get_review_needed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

