"""
Routes API pour la génération de cartographie de compétences par domaine
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.openai_service import openai_service
import json
import re

router = APIRouter()


class DomainInput(BaseModel):
    """Input pour analyser un domaine"""
    domain: str  # Ex: "Python", "JavaScript", "Design UX"


class Skill(BaseModel):
    """Une compétence dans un niveau"""
    name: str
    description: Optional[str] = None


class SkillLevel(BaseModel):
    """Un niveau de compétences"""
    level: int  # 0 = cœur, 1-3 = niveaux optionnels
    name: str  # Ex: "Cœur", "Intermédiaire", "Avancé", "Expert"
    description: str  # Ex: "Les bases indispensables"
    skills: List[Skill]
    isCore: bool = False  # True pour le niveau 0 (obligatoire)


class DomainMap(BaseModel):
    """Cartographie complète d'un domaine"""
    domain: str
    title: str  # Ex: "Maîtriser Python"
    levels: List[SkillLevel]


@router.post("/generate-domain-map")
async def generate_domain_map(input_data: DomainInput) -> DomainMap:
    """
    Génère la cartographie des compétences d'un domaine en 4 cercles concentriques.
    
    - Cœur : bases obligatoires (toujours incluses)
    - Niveau 1 : intermédiaire (optionnel)
    - Niveau 2 : avancé (optionnel)
    - Niveau 3 : expert/confins du domaine (optionnel)
    """
    
    if not input_data.domain or len(input_data.domain.strip()) < 2:
        raise HTTPException(status_code=400, detail="Le domaine doit contenir au moins 2 caractères")
    
    domain = input_data.domain.strip()
    
    prompt = f"""Tu es un expert en pédagogie et en cartographie des compétences.

DOMAINE À ANALYSER : {domain}

═══════════════════════════════════════════════════════════════
OBJECTIF
═══════════════════════════════════════════════════════════════

Génère une cartographie COMPLÈTE des compétences de ce domaine, organisée en 4 cercles concentriques de maîtrise progressive.

IMPORTANT : Tout doit rester DANS le domaine "{domain}". 
Pas de frameworks, pas de bibliothèques externes, pas d'outils annexes.
Uniquement les compétences PURES du domaine.

═══════════════════════════════════════════════════════════════
STRUCTURE DES 4 NIVEAUX
═══════════════════════════════════════════════════════════════

🎯 CŒUR (level 0) — "Fondations"
   • Les bases INDISPENSABLES pour être autonome
   • Ce qu'un débutant DOIT maîtriser
   • 5-7 compétences fondamentales
   • Exemples : syntaxe de base, structures simples, concepts essentiels

🔵 NIVEAU 1 (level 1) — "Intermédiaire"
   • Compétences qui rendent vraiment productif
   • Ce qu'on apprend après les bases
   • 5-7 compétences
   • Exemples : patterns courants, techniques standard, bonnes pratiques

🟡 NIVEAU 2 (level 2) — "Avancé"
   • Compétences de développeur confirmé
   • Optimisation, abstraction, cas complexes
   • 4-6 compétences
   • Exemples : concepts avancés, techniques expertes, edge cases

🔴 NIVEAU 3 (level 3) — "Expert"
   • Les confins du domaine, expertise rare
   • Ce que seuls les experts maîtrisent
   • 3-5 compétences
   • Exemples : internals, méta-programmation, optimisations bas niveau

═══════════════════════════════════════════════════════════════
RÈGLES STRICTES
═══════════════════════════════════════════════════════════════

• RESTER dans le domaine "{domain}" pur
• NE PAS inclure de frameworks/bibliothèques (ex: Django, React, NumPy...)
• NE PAS inclure d'outils annexes (ex: Git, Docker, IDE...)
• Chaque compétence = un savoir-faire concret et identifiable
• Progression logique : bases → intermédiaire → avancé → expert

═══════════════════════════════════════════════════════════════
FORMAT JSON ATTENDU
═══════════════════════════════════════════════════════════════

{{
    "domain": "{domain}",
    "title": "Maîtriser {domain}",
    "levels": [
        {{
            "level": 0,
            "name": "Fondations",
            "description": "Les bases indispensables pour être autonome",
            "isCore": true,
            "skills": [
                {{"name": "Nom de la compétence", "description": "Brève description"}},
                ...
            ]
        }},
        {{
            "level": 1,
            "name": "Intermédiaire", 
            "description": "Compétences qui rendent productif",
            "isCore": false,
            "skills": [...]
        }},
        {{
            "level": 2,
            "name": "Avancé",
            "description": "Techniques de développeur confirmé",
            "isCore": false,
            "skills": [...]
        }},
        {{
            "level": 3,
            "name": "Expert",
            "description": "Les confins du domaine",
            "isCore": false,
            "skills": [...]
        }}
    ]
}}

Génère UNIQUEMENT le JSON, sans explication."""

    try:
        response_text = openai_service.generate_content(prompt)
        print(f"🗺️ Domain map pour '{domain}': {response_text[:500]}...")
        
        # Parser le JSON
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if not json_match:
            raise ValueError("Pas de JSON valide dans la réponse")
        
        map_data = json.loads(json_match.group())
        
        # Construire la réponse
        levels = []
        for level_data in map_data.get("levels", []):
            skills = [
                Skill(
                    name=s.get("name", ""),
                    description=s.get("description")
                )
                for s in level_data.get("skills", [])
            ]
            levels.append(SkillLevel(
                level=level_data.get("level", 0),
                name=level_data.get("name", ""),
                description=level_data.get("description", ""),
                skills=skills,
                isCore=level_data.get("isCore", level_data.get("level", 0) == 0)
            ))
        
        # Validation
        if len(levels) < 3:
            raise ValueError(f"Cartographie incomplète: {len(levels)} niveaux (minimum: 3)")
        
        total_skills = sum(len(l.skills) for l in levels)
        if total_skills < 15:
            raise ValueError(f"Pas assez de compétences: {total_skills} (minimum: 15)")
        
        print(f"✅ Cartographie générée: {len(levels)} niveaux, {total_skills} compétences")
        
        return DomainMap(
            domain=domain,
            title=map_data.get("title", f"Maîtriser {domain}"),
            levels=levels
        )
        
    except ValueError as e:
        print(f"❌ Validation échouée: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
        
    except Exception as e:
        print(f"❌ Erreur: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Erreur lors de l'analyse du domaine")
