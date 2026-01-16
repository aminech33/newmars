"""
🏥 Routes API pour la Santé (Poids, Repas, Hydratation)
Endpoints pour le suivi santé avec persistance SQLite
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import logging
from databases import health_db

logger = logging.getLogger(__name__)

# Alias pour compatibilité
db = health_db
router = APIRouter(prefix="/api/health", tags=["Health"])


# ═══════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════

class WeightEntryRequest(BaseModel):
    date: str
    weight: float
    fat_mass_percent: Optional[float] = None
    muscle_mass: Optional[float] = None
    bone_mass: Optional[float] = None
    water_percent: Optional[float] = None
    heart_rate: Optional[int] = None
    source: Optional[str] = "manual"
    notes: Optional[str] = None


class FoodItem(BaseModel):
    food_id: Optional[str] = ""
    food_name: str
    grams: float
    calories: Optional[float] = 0
    protein: Optional[float] = 0
    carbs: Optional[float] = 0
    fat: Optional[float] = 0


class MealRequest(BaseModel):
    date: str
    time: Optional[str] = None
    meal_type: str  # breakfast, lunch, dinner, snack
    name: Optional[str] = None
    foods: List[FoodItem] = []


class HydrationRequest(BaseModel):
    amount_ml: int
    date: Optional[str] = None
    time: Optional[str] = None


class HealthProfileRequest(BaseModel):
    height_cm: Optional[float] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    activity_level: Optional[str] = "moderate"
    goal: Optional[str] = "maintain"
    target_weight: Optional[float] = None
    target_calories: Optional[int] = None


# ═══════════════════════════════════════════════════════════════
# WEIGHT ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@router.get("/weight")
async def get_weight_entries(limit: int = 100):
    """Récupère les entrées de poids"""
    entries = db.get_weight_entries(limit=limit)
    return {
        "success": True,
        "count": len(entries),
        "entries": entries
    }


@router.post("/weight")
async def add_weight_entry(request: WeightEntryRequest):
    """Ajoute une entrée de poids"""
    entry_id = db.add_weight_entry(request.model_dump())

    if entry_id < 0:
        raise HTTPException(status_code=400, detail="Erreur lors de l'ajout")

    return {
        "success": True,
        "id": entry_id,
        "message": f"Poids {request.weight}kg enregistré pour {request.date}"
    }


@router.delete("/weight/{entry_id}")
async def delete_weight_entry(entry_id: int):
    """Supprime une entrée de poids"""
    deleted = db.delete_weight_entry(entry_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Entrée non trouvée")

    return {"success": True, "message": "Entrée supprimée"}


@router.get("/weight/stats")
async def get_weight_stats():
    """Statistiques de poids"""
    stats = db.get_weight_stats()
    return {
        "success": True,
        "stats": stats
    }


# ═══════════════════════════════════════════════════════════════
# MEALS ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@router.get("/meals")
async def get_meals(date: Optional[str] = None, limit: int = 100):
    """Récupère les repas"""
    meals = db.get_meals(date=date, limit=limit)
    return {
        "success": True,
        "count": len(meals),
        "meals": meals
    }


@router.get("/meals/today")
async def get_today_meals():
    """Récupère les repas du jour"""
    today = datetime.now().strftime('%Y-%m-%d')
    meals = db.get_meals(date=today)
    nutrition = db.get_daily_nutrition(date=today)

    return {
        "success": True,
        "date": today,
        "meals": meals,
        "nutrition": nutrition
    }


@router.post("/meals")
async def add_meal(request: MealRequest):
    """Ajoute un repas"""
    data = request.model_dump()
    # Convertir les FoodItem en dict
    data['foods'] = [f.model_dump() if hasattr(f, 'model_dump') else f for f in request.foods]

    meal_id = db.add_meal(data)

    if meal_id < 0:
        raise HTTPException(status_code=400, detail="Erreur lors de l'ajout")

    return {
        "success": True,
        "id": meal_id,
        "message": f"Repas {request.meal_type} ajouté"
    }


@router.delete("/meals/{meal_id}")
async def delete_meal(meal_id: int):
    """Supprime un repas"""
    deleted = db.delete_meal(meal_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Repas non trouvé")

    return {"success": True, "message": "Repas supprimé"}


@router.get("/nutrition/{date}")
async def get_daily_nutrition(date: str):
    """Nutrition d'une journée"""
    nutrition = db.get_daily_nutrition(date=date)
    return {
        "success": True,
        "nutrition": nutrition
    }


# ═══════════════════════════════════════════════════════════════
# HYDRATION ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@router.post("/hydration")
async def add_hydration(request: HydrationRequest):
    """Ajoute une entrée d'hydratation"""
    entry_id = db.add_hydration(
        amount_ml=request.amount_ml,
        date=request.date,
        time=request.time
    )

    if entry_id < 0:
        raise HTTPException(status_code=400, detail="Erreur lors de l'ajout")

    return {
        "success": True,
        "id": entry_id,
        "message": f"{request.amount_ml}ml ajoutés"
    }


@router.get("/hydration")
async def get_hydration(date: Optional[str] = None):
    """Hydratation d'une journée"""
    hydration = db.get_daily_hydration(date=date)
    return {
        "success": True,
        "hydration": hydration
    }


# ═══════════════════════════════════════════════════════════════
# PROFILE ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@router.get("/profile")
async def get_health_profile():
    """Récupère le profil santé"""
    profile = db.get_health_profile()
    return {
        "success": True,
        "profile": profile
    }


@router.post("/profile")
async def update_health_profile(request: HealthProfileRequest):
    """Met à jour le profil santé"""
    success = db.update_health_profile(request.model_dump())

    if not success:
        raise HTTPException(status_code=400, detail="Erreur lors de la mise à jour")

    return {
        "success": True,
        "message": "Profil mis à jour"
    }


# ═══════════════════════════════════════════════════════════════
# DASHBOARD ENDPOINT
# ═══════════════════════════════════════════════════════════════

@router.get("/dashboard")
async def get_health_dashboard():
    """Dashboard santé complet"""
    today = datetime.now().strftime('%Y-%m-%d')

    return {
        "success": True,
        "date": today,
        "weight": db.get_weight_stats(),
        "nutrition": db.get_daily_nutrition(date=today),
        "hydration": db.get_daily_hydration(date=today),
        "profile": db.get_health_profile()
    }
