"""
Routes API pour la génération de plans de projet depuis une idée
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from services.gemini_service import gemini_service
from datetime import datetime, timedelta

router = APIRouter()


class IdeaInput(BaseModel):
    """Input pour la génération de plan"""
    idea: str


class TaskPlan(BaseModel):
    """Tâche dans le plan"""
    title: str


class ProjectPlan(BaseModel):
    """Plan de projet généré"""
    projectName: str
    suggestedDeadline: Optional[str]
    tasks: List[TaskPlan]


@router.post("/generate-project-plan")
async def generate_project_plan(input_data: IdeaInput) -> ProjectPlan:
    """
    Génère un plan de projet actionnable depuis une idée
    
    Args:
        input_data: Contient l'idée de l'utilisateur
        
    Returns:
        Plan avec nom de projet, deadline et tâches
    """
    
    if not input_data.idea or len(input_data.idea.strip()) < 5:
        raise HTTPException(
            status_code=400,
            detail="L'idée doit contenir au moins 5 caractères"
        )
    
    # Construction du prompt pour Gemini
    prompt = f"""Tu es un planificateur pragmatique pour un utilisateur solo.

CONTEXTE :
Cette génération est destinée à la PAGE TÂCHES.
La page Tâches est orientée exécution quotidienne et lutte contre la procrastination.
Les projets servent uniquement à regrouper des tâches par thème
et à donner une visibilité temporelle via une deadline.

Entrée utilisateur :
"{input_data.idea}"

Objectif :
Transformer cette idée en un plan clair et actionnable
qui pourra être validé puis créé par l'utilisateur.

Contraintes :
- Créer UN projet avec un nom court et explicite (max 4 mots)
- Suggérer UNE deadline réaliste si pertinent
  * Si projet court (< 1 semaine): date précise
  * Si projet moyen (1-4 semaines): date dans 2-3 semaines
  * Si projet long ou sans urgence: null
- Générer AUTANT de tâches que nécessaire (ni trop, ni trop peu)
  * Minimum 3 tâches
  * Maximum 15 tâches
- Chaque tâche doit être:
  * Concrète et actionnable (verbe d'action au début)
  * Orientée exécution (pas de tâches vagues type "réfléchir à")
  * Unique (pas de redondance)
  * Courte (max 60 caractères)
- Ordonner les tâches logiquement dans le temps
- Commencer par les tâches de setup/préparation
- Terminer par les tâches de finalisation/validation

Exemples de BONNES tâches :
✅ "Créer un compte GitHub"
✅ "Installer Node.js et npm"
✅ "Rédiger le cahier des charges"
✅ "Acheter le matériel nécessaire"
✅ "Tester la version beta"

Exemples de MAUVAISES tâches :
❌ "Réfléchir au projet" (trop vague)
❌ "Faire des recherches" (pas actionnable)
❌ "Travailler sur le design" (trop général)
❌ "Continuer le développement" (redondant)

FORMAT DE RÉPONSE (JSON strict):
{{
    "projectName": "Nom du projet",
    "suggestedDeadline": "YYYY-MM-DD" ou null,
    "tasks": [
        {{"title": "Première tâche actionnable"}},
        {{"title": "Deuxième tâche actionnable"}},
        ...
    ]
}}

IMPORTANT:
- La deadline doit être réaliste (ne pas sous-estimer le temps)
- Si l'idée est floue, propose un plan simple avec des tâches de découverte
- Si l'idée est ambitieuse, découpe en étapes claires
- Reste pragmatique : focus sur l'exécution, pas la perfection

Génère UNIQUEMENT le JSON, sans texte avant ou après."""

    try:
        # Appel à Gemini
        response = gemini_service.model.generate_content(prompt)
        
        # DÉBOGAGE : Afficher la réponse brute
        print(f"🤖 Réponse brute Gemini : {response.text[:500]}...")
        
        # Parser la réponse
        plan_data = gemini_service._parse_response(response.text)
        
        # DÉBOGAGE : Afficher les données parsées
        print(f"✅ Données parsées : {plan_data}")
        
        # Valider et créer le plan
        project_plan = ProjectPlan(
            projectName=plan_data["projectName"],
            suggestedDeadline=plan_data.get("suggestedDeadline"),
            tasks=[TaskPlan(title=task["title"]) for task in plan_data["tasks"]]
        )
        
        # Valider que le plan a au moins 3 tâches
        if len(project_plan.tasks) < 3:
            raise ValueError("Le plan doit contenir au moins 3 tâches")
        
        print(f"✅ Plan créé avec {len(project_plan.tasks)} tâches")
        return project_plan
        
    except Exception as e:
        # DÉBOGAGE : Afficher l'erreur complète
        print(f"❌ ERREUR lors de la génération : {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # En cas d'erreur, créer un plan fallback simple
        print("⚠️ Utilisation du plan fallback")
        return ProjectPlan(
            projectName=f"Projet: {input_data.idea[:30]}",
            suggestedDeadline=(datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d"),
            tasks=[
                TaskPlan(title="Définir les objectifs du projet"),
                TaskPlan(title="Lister les ressources nécessaires"),
                TaskPlan(title="Créer un plan d'action détaillé"),
                TaskPlan(title="Commencer la première étape"),
                TaskPlan(title="Faire un point d'avancement")
            ]
        )

