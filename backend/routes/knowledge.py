"""
🧠 API Routes pour la gestion de la Knowledge Base

Routes pour gérer les concepts appris, leur maîtrise,
et l'application du decay temporel (oubli naturel).
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from database import db
from utils.mastery_decay import apply_decay_to_concepts, get_concepts_needing_review
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/knowledge", tags=["Knowledge"])


# ═══════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════

class ConceptCreate(BaseModel):
    course_id: str
    concept: str
    category: Optional[str] = None
    definition: Optional[str] = None
    example: Optional[str] = None
    keywords: List[str] = []


class ConceptUsageData(BaseModel):
    course_id: str
    user_message: str
    code_context: Optional[str] = None


class MasteryUpdate(BaseModel):
    concept_id: int
    mastery_level: int


# ═══════════════════════════════════════════════════════════════
# ROUTES - CRUD CONCEPTS
# ═══════════════════════════════════════════════════════════════

@router.get("/{course_id}")
async def get_concepts(course_id: str):
    """
    Récupère tous les concepts d'un cours
    """
    try:
        concepts = db.get_concepts(course_id)
        
        return {
            "success": True,
            "course_id": course_id,
            "count": len(concepts),
            "concepts": concepts
        }
    except Exception as e:
        logger.error(f"Error getting concepts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add")
async def add_concept(data: ConceptCreate):
    """
    Ajoute un nouveau concept à la knowledge base
    """
    try:
        concept_id = db.add_concept(
            course_id=data.course_id,
            concept=data.concept,
            category=data.category,
            definition=data.definition,
            example=data.example,
            keywords=data.keywords
        )
        
        return {
            "success": True,
            "concept_id": concept_id,
            "message": f"Concept '{data.concept}' added successfully"
        }
    except Exception as e:
        logger.error(f"Error adding concept: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search/{course_id}")
async def search_concepts(course_id: str, query: str, limit: int = 5):
    """
    Recherche des concepts pertinents dans un cours
    Utilisé pour enrichir le contexte de l'IA
    """
    try:
        concepts = db.search_concepts(course_id, query, limit)
        
        return {
            "success": True,
            "query": query,
            "count": len(concepts),
            "concepts": concepts
        }
    except Exception as e:
        logger.error(f"Error searching concepts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/{course_id}")
async def get_stats(course_id: str):
    """
    Statistiques sur les concepts d'un cours
    """
    try:
        stats = db.get_concept_stats(course_id)
        
        return {
            "success": True,
            "course_id": course_id,
            "stats": stats
        }
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════
# ROUTES - MASTERY TRACKING
# ═══════════════════════════════════════════════════════════════

@router.post("/track-usage")
async def track_concept_usage(data: ConceptUsageData):
    """
    🔍 Détecte l'usage actif de concepts dans les messages/code
    
    Analyse le message de l'utilisateur et son code pour détecter
    quels concepts il utilise activement. Ceux-ci reçoivent un boost
    de mastery adaptatif (+2% à +5% selon niveau actuel).
    
    Critères d'usage actif:
    - Concept mentionné dans un message substantiel (>30 chars)
    - Concept utilisé dans du code fourni
    - Boost adaptatif selon mastery actuelle
    """
    try:
        concepts = db.get_concepts(data.course_id)
        
        if not concepts:
            return {
                "success": True,
                "message": "No concepts to track",
                "updated_count": 0
            }
        
        message_lower = data.user_message.lower()
        code_lower = data.code_context.lower() if data.code_context else ""
        
        updated_concepts = []
        
        for concept in concepts:
            concept_name = concept['concept'].lower()
            current_mastery = concept['mastery_level']
            
            # Vérifier usage actif
            used_in_message = concept_name in message_lower
            used_in_code = code_lower and concept_name in code_lower
            
            # Critères: message substantiel ou code
            is_substantial = len(data.user_message) > 30
            is_active_usage = (used_in_message and is_substantial) or used_in_code
            
            if is_active_usage:
                # Boost adaptatif selon niveau actuel
                if current_mastery < 20:
                    boost = 5  # Débutant: +5%
                elif current_mastery < 50:
                    boost = 3  # Intermédiaire: +3%
                else:
                    boost = 2  # Avancé: +2%
                
                new_mastery = min(100, current_mastery + boost)
                
                # Mise à jour
                db.update_mastery(concept['id'], new_mastery)
                
                # Incrémenter times_referenced
                db.increment_concept_reference(concept['id'])
                
                updated_concepts.append({
                    "concept": concept['concept'],
                    "old_mastery": current_mastery,
                    "new_mastery": new_mastery,
                    "boost": boost
                })
                
                logger.info(f"✅ Active usage detected: {concept['concept']} "
                          f"({current_mastery}% → {new_mastery}%)")
        
        return {
            "success": True,
            "updated_count": len(updated_concepts),
            "updated_concepts": updated_concepts
        }
        
    except Exception as e:
        logger.error(f"Error tracking concept usage: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/apply-decay/{course_id}")
async def apply_mastery_decay(course_id: str):
    """
    ⏰ Applique le decay temporel (oubli naturel) aux concepts
    
    Utilise la courbe d'Ebbinghaus pour simuler l'oubli naturel.
    Les concepts non révisés perdent progressivement en mastery.
    
    Appelé automatiquement au chargement d'un cours.
    """
    try:
        concepts = db.get_concepts(course_id)
        
        if not concepts:
            return {
                "success": True,
                "message": "No concepts to decay",
                "total_concepts": 0,
                "updated_count": 0
            }
        
        # Appliquer le decay avec l'algorithme Ebbinghaus
        updated_count = apply_decay_to_concepts(concepts, db)
        
        logger.info(f"⏰ Decay applied to {updated_count}/{len(concepts)} concepts "
                   f"in course {course_id}")
        
        return {
            "success": True,
            "total_concepts": len(concepts),
            "updated_count": updated_count,
            "message": f"Decay applied to {updated_count} concepts"
        }
        
    except Exception as e:
        logger.error(f"Error applying decay: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{course_id}/review-needed")
async def get_review_needed(course_id: str, limit: int = 10):
    """
    📚 Retourne les concepts qui ont besoin d'une révision
    
    Basé sur:
    - Mastery faible (<50%)
    - Temps écoulé depuis dernière révision
    - Priorité selon urgence
    
    Utilisé pour suggérer des révisions intelligentes.
    """
    try:
        concepts = db.get_concepts(course_id)
        
        if not concepts:
            return {
                "success": True,
                "count": 0,
                "concepts": []
            }
        
        # Obtenir les concepts à réviser (triés par priorité)
        review_concepts = get_concepts_needing_review(concepts, limit)
        
        logger.info(f"📚 Found {len(review_concepts)} concepts needing review "
                   f"in course {course_id}")
        
        return {
            "success": True,
            "course_id": course_id,
            "count": len(review_concepts),
            "concepts": review_concepts
        }
        
    except Exception as e:
        logger.error(f"Error getting review concepts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/mastery")
async def update_mastery(data: MasteryUpdate):
    """
    ✏️ Met à jour manuellement la mastery d'un concept
    
    Utilisé pour:
    - Quiz réussi → +10-15%
    - Corrections manuelles
    - Réinitialisations
    """
    try:
        # Valider la mastery (0-100)
        if not 0 <= data.mastery_level <= 100:
            raise HTTPException(
                status_code=400,
                detail="Mastery level must be between 0 and 100"
            )
        
        db.update_mastery(data.concept_id, data.mastery_level)
        
        logger.info(f"✏️ Mastery updated for concept {data.concept_id} "
                   f"→ {data.mastery_level}%")
        
        return {
            "success": True,
            "concept_id": data.concept_id,
            "new_mastery": data.mastery_level,
            "message": "Mastery updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating mastery: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════
# ROUTES - UTILITIES
# ═══════════════════════════════════════════════════════════════

@router.delete("/{course_id}")
async def delete_course_concepts(course_id: str):
    """
    🗑️ Supprime tous les concepts d'un cours
    
    ⚠️ Attention: action irréversible !
    """
    try:
        count = db.delete_course_concepts(course_id)
        
        logger.warning(f"🗑️ Deleted {count} concepts from course {course_id}")
        
        return {
            "success": True,
            "deleted_count": count,
            "message": f"Deleted {count} concepts from course {course_id}"
        }
        
    except Exception as e:
        logger.error(f"Error deleting concepts: {e}")
        raise HTTPException(status_code=500, detail=str(e))
