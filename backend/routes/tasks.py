"""
Routes API pour la génération de plans de projet pédagogiques depuis une idée
Avec retry automatique et gestion d'erreurs robuste
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Literal
from services.openai_service import openai_service
from datetime import datetime, timedelta
import logging
import openai

# Configuration du logger
logger = logging.getLogger(__name__)

router = APIRouter()


class IdeaInput(BaseModel):
    """Input pour la génération de plan (legacy)"""
    idea: str


class PlanningInput(BaseModel):
    """Input structuré pour la vue Planifier"""
    projectTitle: str  # Titre du projet
    domain: str  # Domaine principal (ex: "Programmation", "Design", "Marketing")
    selectedSkills: List[str]  # Compétences cochées par l'utilisateur
    excludedSkills: Optional[List[str]] = None  # Compétences explicitement exclues


# Mapping effort legacy → level (pour rétrocompatibilité)
EFFORT_TO_LEVEL = {"XS": 1, "S": 2, "M": 3, "L": 4, "XL": 5}
LEVEL_TO_EFFORT = {1: "XS", 2: "S", 3: "M", 4: "L", 5: "XL"}


class TaskPlan(BaseModel):
    """
    Tâche dans le plan avec métadonnées pédagogiques.

    Système de niveaux unifié (1-5):
        1 = Très facile (15 min) - Setup, micro-tâches
        2 = Facile (30 min) - Exercices simples
        3 = Intermédiaire (1h) - Travail principal
        4 = Difficile (2h) - Validation, challenges
        5 = Expert (3h+) - Projets complexes
    """
    title: str
    level: Optional[int] = None  # Niveau 1-5 (recommandé)
    effort: Optional[Literal["XS", "S", "M", "L", "XL"]] = None  # DEPRECATED - utiliser level
    covers: Optional[List[str]] = None  # Compétences couvertes par cette tâche
    isValidation: Optional[bool] = False  # Tâche de validation de phase
    unlockAfter: Optional[str] = None  # Phase ou tâche prérequise

    def __init__(self, **data):
        """Convertit automatiquement effort → level si effort fourni sans level."""
        # Si effort fourni mais pas level, convertir avec warning
        if data.get("effort") and not data.get("level"):
            effort = data["effort"]
            data["level"] = EFFORT_TO_LEVEL.get(effort, 2)
            logger.debug(f"[DEPRECATED] Conversion effort '{effort}' → level {data['level']}")
        super().__init__(**data)

    def get_level(self) -> int:
        """Retourne le niveau normalisé (1-5)."""
        if self.level is not None:
            return max(1, min(5, self.level))
        # Rétrocompatibilité effort legacy
        if self.effort:
            return EFFORT_TO_LEVEL.get(self.effort, 2)
        return 2  # Défaut: niveau 2 (Facile)

    def get_effort(self) -> str:
        """Retourne l'effort legacy pour rétrocompatibilité API."""
        level = self.get_level()
        return LEVEL_TO_EFFORT.get(level, "S")


class PhasePlan(BaseModel):
    """Phase pédagogique du projet"""
    name: str
    objective: str
    tasks: List[TaskPlan]


class ProjectPlan(BaseModel):
    """Plan de projet structuré en phases"""
    projectName: str
    suggestedDeadline: Optional[str] = None
    coverageGrid: Optional[List[str]] = None  # Grille de couverture du domaine
    phases: Optional[List[PhasePlan]] = None
    tasks: List[TaskPlan]  # Fallback pour compatibilité


@router.post("/generate-project-plan")
async def generate_project_plan(input_data: IdeaInput) -> ProjectPlan:
    """
    Génère un plan de projet pédagogique structuré en phases
    
    Args:
        input_data: Contient l'idée de l'utilisateur
        
    Returns:
        Plan avec phases pédagogiques et tâches progressives
    """
    
    if not input_data.idea or len(input_data.idea.strip()) < 5:
        raise HTTPException(
            status_code=400,
            detail="L'idée doit contenir au moins 5 caractères"
        )
    
    # Prompt : planification de tâches (pas cours théorique)
    prompt = f"""Tu es un expert en planification de tâches et progression structurée.

⚠️ CONTEXTE CRITIQUE :
Tu génères une PLANIFICATION DE TÂCHES pour un gestionnaire de tâches.
PAS un cours théorique. PAS du contenu éducatif. Des TÂCHES ACTIONNABLES.

═══════════════════════════════════════════════════════════════
OBJECTIF DU PROJET
═══════════════════════════════════════════════════════════════
"{input_data.idea}"

═══════════════════════════════════════════════════════════════
CE QUE TU GÉNÈRES
═══════════════════════════════════════════════════════════════

Une liste de TÂCHES organisées en PHASES de travail.
Ces tâches seront affichées dans des colonnes temporelles :
• Aujourd'hui (actionnable maintenant)
• En cours (déjà commencé)
• À venir (prochaines étapes)
• Lointain (horizon futur)

═══════════════════════════════════════════════════════════════
CONTRAINTES DE VOLUME (OBLIGATOIRES — RESPECTER STRICTEMENT)
═══════════════════════════════════════════════════════════════

• EXACTEMENT 7 PHASES (ni plus, ni moins)
• 7 à 8 TÂCHES par phase (ni plus, ni moins)
• EXACTEMENT 49-56 TÂCHES au total
• Chaque tâche : 15 min à 3h selon le niveau

Structure de chaque phase (OBLIGATOIRE) :
  - 1 tâche niveau 1 (setup/découverte de début de phase)
  - 3-4 tâches niveau 2 (exercices simples, manipulation)
  - 2-3 tâches niveau 3 (travail principal, exercice conséquent)
  - 1 tâche niveau 4 (validation de fin de phase uniquement)
  - Occasionnellement niveau 5 (expert, projets avancés - rare)

Distribution cible par phase de 8 tâches :
Niveau 1=1 | Niveau 2=4 | Niveau 3=2 | Niveau 4=1

⚠️ REJET AUTOMATIQUE si :
  - <45 tâches totales
  - <6 tâches dans une phase
  - <10 tâches niveau 2 au total
  - >8 tâches niveau 4+ au total

═══════════════════════════════════════════════════════════════
DÉFINITION D'UNE PHASE
═══════════════════════════════════════════════════════════════

Une PHASE = une étape de TRAVAIL (pas un chapitre théorique)
• Nom court (2-4 mots)
• Objectif opérationnel (ce qu'on SAIT FAIRE après)
• 5-12 tâches concrètes

═══════════════════════════════════════════════════════════════
DÉFINITION D'UNE TÂCHE
═══════════════════════════════════════════════════════════════

Une TÂCHE = une action EXÉCUTABLE et MESURABLE

✅ BONS EXEMPLES :
• "Installer Python et configurer VS Code"
• "Écrire un script qui lit un fichier CSV"
• "Créer 3 fonctions de calcul avec paramètres"
• "Déboguer un script contenant 5 erreurs"
• "Construire un CLI qui accepte des arguments"
• "Implémenter une classe avec 3 méthodes"
• "Tester son code avec 10 cas différents"

❌ MAUVAIS EXEMPLES (INTERDITS) :
• "Comprendre les variables"
• "Apprendre les boucles"
• "Se familiariser avec..."
• "Introduction à..."
• "Les bases de..."
• "Réviser..."

VERBES OBLIGATOIRES :
écrire, créer, construire, implémenter, configurer, tester, 
déboguer, refactorer, optimiser, déployer, documenter

═══════════════════════════════════════════════════════════════
TÂCHES DE VALIDATION (1-2 par phase)
═══════════════════════════════════════════════════════════════

En fin de phase, ajouter des tâches de VALIDATION :
• isValidation: true
• Prouve la maîtrise de la phase
• Mini-projet ou défi concret

Exemples :
• "Construire un script complet sans aide"
• "Résoudre 5 exercices en autonomie"
• "Créer un mini-projet utilisant toutes les notions de la phase"

═══════════════════════════════════════════════════════════════
OBJECTIF FINAL DU PROJET
═══════════════════════════════════════════════════════════════

À la fin, l'utilisateur DOIT pouvoir :
• Travailler seul dans ce domaine
• Créer des projets de A à Z
• Résoudre ses problèmes sans aide
• Continuer à progresser en autonomie

═══════════════════════════════════════════════════════════════
FORMAT JSON
═══════════════════════════════════════════════════════════════

{{
    "projectName": "Nom clair du projet (max 6 mots)",
    "suggestedDeadline": null,
    "coverageGrid": ["Domaine 1", "Domaine 2", "..."],
    "phases": [
        {{
            "name": "Nom de phase court",
            "objective": "Ce qu'on sait FAIRE après cette phase",
            "tasks": [
                {{
                    "title": "Verbe + action concrète",
                    "level": 3,
                    "covers": ["Domaine"],
                    "isValidation": false,
                    "unlockAfter": null
                }},
                {{
                    "title": "VALIDATION : mini-projet ou défi",
                    "level": 4,
                    "covers": ["Domaine"],
                    "isValidation": true,
                    "unlockAfter": null
                }}
            ]
        }}
    ],
    "tasks": []
}}

═══════════════════════════════════════════════════════════════
CALIBRAGE DES NIVEAUX (important)
═══════════════════════════════════════════════════════════════

Chaque tâche doit avoir un niveau de difficulté (1-5) :

• Niveau 1 - Très facile (15min) : installation, setup rapide, configuration simple
  Ex: "Installer Python", "Créer un dossier projet", "Ouvrir VS Code"

• Niveau 2 - Facile (30min) : manipulation simple, exercice court, test rapide
  Ex: "Écrire un hello world", "Tester 3 commandes de base", "Créer une variable"
  Ex: "Afficher une liste dans le terminal", "Lire les 5 premières lignes d'un fichier"

• Niveau 3 - Intermédiaire (1h) : script complet, exercice conséquent
  Ex: "Écrire un script de calcul complet", "Implémenter 3 fonctions avec paramètres"
  Ex: "Créer un script qui lit et transforme un fichier CSV"

• Niveau 4 - Difficile (2h) : projet, validation de phase, défi complexe
  Ex: "Construire un mini-projet complet", "Créer une application CLI fonctionnelle"

• Niveau 5 - Expert (3h+) : architecture complexe, optimisation avancée
  Ex: "Concevoir un système distribué", "Optimiser les performances d'une app"
  (Rare - réservé aux projets avancés)

⚠️ DISTRIBUTION CIBLE (sur 50 tâches) :
• Niveau 1 : 7-10 tâches (14-20%) — setup, config, micro-tâches
• Niveau 2 : 18-22 tâches (36-44%) — exercices courts ← LE PLUS GROS VOLUME
• Niveau 3 : 14-18 tâches (28-36%) — travail principal
• Niveau 4 : 6-8 tâches (12-16%) — validations uniquement
• Niveau 5 : 0-2 tâches (0-4%) — projets experts (optionnel)

❌ REJET si niveau 2 < 35% (il faut BEAUCOUP de petits exercices)
❌ REJET si niveau 4+ > 16% (les niveaux élevés sont RARES)
❌ REJET si niveau 3 > 40% (le plan serait trop dense)

RÈGLE D'OR : Chaque phase commence FACILE (1-2) et finit DIFFICILE (3-4)

═══════════════════════════════════════════════════════════════
RAPPEL FINAL
═══════════════════════════════════════════════════════════════

✅ Tu génères des TÂCHES pour un gestionnaire de tâches
❌ Tu ne génères PAS un cours ou un tutoriel

CHECKLIST FINALE (tout doit être vrai) :
☐ 7 phases exactement
☐ 49-56 tâches au total
☐ 7-8 tâches par phase
☐ Niveau 2 ≥ 35% du total (au moins 18 tâches niveau 2)
☐ Niveau 4+ ≤ 16% du total (max 8 tâches niveau 4, 1 par phase)
☐ Chaque phase finit par une validation (isValidation: true)
☐ Progression niveau 1 → 2 → 3 → 4 dans chaque phase

Génère UNIQUEMENT le JSON."""

    try:
        logger.info(f"🚀 Génération plan pour: '{input_data.idea[:50]}...'")
        
        # Appel à OpenAI GPT avec retry automatique
        response_text = openai_service.generate_content(prompt)
        
        logger.info(f"✅ Réponse GPT reçue ({len(response_text)} caractères)")
        
        # Parser la réponse
        plan_data = openai_service._parse_response(response_text)
        
        # Extraire la grille de couverture
        coverage_grid = plan_data.get("coverageGrid", [])
        
        # Extraire toutes les tâches des phases pour le champ tasks (compatibilité)
        all_tasks = []
        phases = []
        
        if "phases" in plan_data and plan_data["phases"]:
            for phase_data in plan_data["phases"]:
                phase_tasks = []
                for task_data in phase_data.get("tasks", []):
                    # Nouveau format: level (1-5), fallback sur effort legacy
                    level = task_data.get("level")
                    effort = task_data.get("effort")

                    task = TaskPlan(
                        title=task_data["title"],
                        level=level,
                        effort=effort,
                        covers=task_data.get("covers", []),
                        isValidation=task_data.get("isValidation", False),
                        unlockAfter=task_data.get("unlockAfter")
                    )
                    phase_tasks.append(task)
                    all_tasks.append(task)

                phases.append(PhasePlan(
                    name=phase_data["name"],
                    objective=phase_data.get("objective", ""),
                    tasks=phase_tasks
                ))

        # Fallback si pas de phases
        if not phases and "tasks" in plan_data:
            all_tasks = [
                TaskPlan(
                    title=t["title"],
                    level=t.get("level"),
                    effort=t.get("effort"),
                    covers=t.get("covers", []),
                    isValidation=t.get("isValidation", False),
                    unlockAfter=t.get("unlockAfter")
                )
                for t in plan_data["tasks"]
            ]
        
        # ═══════════════════════════════════════════════════════════════
        # VALIDATION QUALITÉ DU PLAN (obligatoire)
        # ═══════════════════════════════════════════════════════════════
        
        # ═══════════════════════════════════════════════════════════════
        # SEUILS STRICTS V4 (Niveaux 1-5)
        # ═══════════════════════════════════════════════════════════════
        MIN_TASKS = 42  # Minimum strict
        MIN_PHASES = 6  # Minimum strict
        MIN_TASKS_PER_PHASE = 6  # Minimum par phase
        MIN_LEVEL_2_RATIO = 0.30  # Au moins 30% niveau 2 (facile)
        MAX_LEVEL_4_RATIO = 0.20  # Max 20% niveau 4+ (difficile/expert)
        MAX_LEVEL_3_RATIO = 0.45  # Max 45% niveau 3 (intermédiaire)
        
        # Validation volume
        if len(all_tasks) < MIN_TASKS:
            print(f"❌ REJET: {len(all_tasks)} tâches (min: {MIN_TASKS})")
            raise ValueError(f"Volume insuffisant: {len(all_tasks)} tâches (minimum: {MIN_TASKS})")
        
        if len(phases) < MIN_PHASES:
            print(f"❌ REJET: {len(phases)} phases (min: {MIN_PHASES})")
            raise ValueError(f"Phases insuffisantes: {len(phases)} (minimum: {MIN_PHASES})")
        
        # Vérifier tâches par phase
        for phase in phases:
            if len(phase.tasks) < MIN_TASKS_PER_PHASE:
                print(f"❌ REJET: Phase '{phase.name}' = {len(phase.tasks)} tâches")
                raise ValueError(f"Phase '{phase.name}' trop courte: {len(phase.tasks)} tâches (minimum: {MIN_TASKS_PER_PHASE})")
        
        # Compter les tâches de validation par phase
        validation_count = sum(1 for t in all_tasks if t.isValidation)
        phases_with_validation = sum(
            1 for p in phases 
            if any(t.isValidation for t in p.tasks)
        )
        
        # Exiger que 80% des phases aient au moins une validation
        MIN_VALIDATION_RATIO = 0.8
        min_phases_with_validation = int(len(phases) * MIN_VALIDATION_RATIO)
        
        if phases_with_validation < min_phases_with_validation:
            print(f"⚠️ Validations insuffisantes: {phases_with_validation}/{len(phases)} phases ({min_phases_with_validation} requis)")
            raise ValueError(
                f"Validations insuffisantes: seulement {phases_with_validation}/{len(phases)} phases ont une validation "
                f"(minimum {min_phases_with_validation} requis, soit {int(MIN_VALIDATION_RATIO*100)}%)"
            )
        
        print(f"📊 Validations: {validation_count} tâches, {phases_with_validation}/{len(phases)} phases couvertes")
        
        # ═══════════════════════════════════════════════════════════════
        # VALIDATION DISTRIBUTION NIVEAUX (STRICT)
        # ═══════════════════════════════════════════════════════════════
        level_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for t in all_tasks:
            level = t.get_level()  # Utilise la méthode qui gère level et effort
            level_counts[level] += 1

        total = len(all_tasks)
        level2_ratio = level_counts[2] / total
        level3_ratio = level_counts[3] / total
        level4_ratio = (level_counts[4] + level_counts[5]) / total  # 4 et 5 ensemble

        print(f"📊 Distribution niveaux: 1={level_counts[1]} | 2={level_counts[2]} ({int(level2_ratio*100)}%) | 3={level_counts[3]} ({int(level3_ratio*100)}%) | 4={level_counts[4]} | 5={level_counts[5]}")

        # Validation distribution (STRICT)
        if level2_ratio < MIN_LEVEL_2_RATIO:
            print(f"❌ REJET: Niveau 2={int(level2_ratio*100)}% (min: {int(MIN_LEVEL_2_RATIO*100)}%)")
            raise ValueError(f"Pas assez de tâches niveau 2: {int(level2_ratio*100)}% (minimum: {int(MIN_LEVEL_2_RATIO*100)}%). Ajoutez plus d'exercices simples.")

        if level4_ratio > MAX_LEVEL_4_RATIO:
            print(f"❌ REJET: Niveau 4+={int(level4_ratio*100)}% (max: {int(MAX_LEVEL_4_RATIO*100)}%)")
            raise ValueError(f"Trop de tâches niveau 4+: {int(level4_ratio*100)}% (maximum: {int(MAX_LEVEL_4_RATIO*100)}%). Les niveaux élevés sont réservés aux validations.")

        if level3_ratio > MAX_LEVEL_3_RATIO:
            print(f"❌ REJET: Niveau 3={int(level3_ratio*100)}% (max: {int(MAX_LEVEL_3_RATIO*100)}%)")
            raise ValueError(f"Trop de tâches niveau 3: {int(level3_ratio*100)}% (maximum: {int(MAX_LEVEL_3_RATIO*100)}%). Ajoutez plus de tâches niveau 1-2.")
        
        project_plan = ProjectPlan(
            projectName=plan_data["projectName"],
            suggestedDeadline=None,
            coverageGrid=coverage_grid if coverage_grid else None,
            phases=phases if phases else None,
            tasks=all_tasks
        )
        
        print(f"✅ Plan validé : {len(phases)} phases, {len(all_tasks)} tâches, {validation_count} validations")
        return project_plan
        
    except openai.RateLimitError as e:
        logger.error(f"⚠️ Rate limit OpenAI: {e}")
        raise HTTPException(
            status_code=429,
            detail="Trop de requêtes à l'API OpenAI. Réessayez dans 1 minute."
        )
        
    except openai.APITimeoutError as e:
        logger.error(f"⏱️ Timeout OpenAI: {e}")
        raise HTTPException(
            status_code=504,
            detail="La génération a pris trop de temps. Simplifiez votre description et réessayez."
        )
        
    except openai.APIConnectionError as e:
        logger.error(f"🔌 Erreur connexion OpenAI: {e}")
        raise HTTPException(
            status_code=503,
            detail="Impossible de contacter l'API OpenAI. Vérifiez votre connexion et réessayez."
        )
        
    except ValueError as e:
        # Erreur de validation (plan insuffisant)
        logger.warning(f"⚠️ Validation plan échouée: {e}")
        raise HTTPException(
            status_code=422,
            detail=f"Le plan généré est insuffisant : {str(e)}. Reformulez votre idée avec plus de détails et réessayez."
        )
        
    except Exception as e:
        # Erreur technique inattendue
        logger.critical(f"❌ Erreur critique inattendue: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Une erreur inattendue s'est produite lors de la génération. Réessayez dans quelques instants."
        )


# ═══════════════════════════════════════════════════════════════════════════════
# NOUVEAU ENDPOINT : Planification basée sur compétences sélectionnées
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/generate-skill-based-plan")
async def generate_skill_based_plan(input_data: PlanningInput) -> ProjectPlan:
    """
    Génère un plan basé sur les compétences sélectionnées par l'utilisateur.
    
    Args:
        input_data: Titre du projet, domaine et compétences cochées
        
    Returns:
        Plan structuré couvrant UNIQUEMENT les compétences sélectionnées
    """
    
    # Validation des entrées
    if not input_data.projectTitle or len(input_data.projectTitle.strip()) < 3:
        raise HTTPException(status_code=400, detail="Le titre du projet doit contenir au moins 3 caractères")
    
    if not input_data.selectedSkills or len(input_data.selectedSkills) < 1:
        raise HTTPException(status_code=400, detail="Sélectionnez au moins une compétence")
    
    skills_list = "\n".join([f"  • {skill}" for skill in input_data.selectedSkills])
    excluded_list = ""
    if input_data.excludedSkills:
        excluded_list = "\n".join([f"  ❌ {skill}" for skill in input_data.excludedSkills])
    
    prompt = f"""Tu es un expert en planification de tâches.

═══════════════════════════════════════════════════════════════
CONTEXTE DU PROJET
═══════════════════════════════════════════════════════════════

Titre : {input_data.projectTitle}
Domaine : {input_data.domain}

COMPÉTENCES À COUVRIR (UNIQUEMENT CELLES-CI) :
{skills_list}

{f"COMPÉTENCES EXCLUES (NE PAS TOUCHER) :{chr(10)}{excluded_list}" if excluded_list else ""}

═══════════════════════════════════════════════════════════════
RÈGLES STRICTES
═══════════════════════════════════════════════════════════════

1. PÉRIMÈTRE STRICT
   • Générer des tâches UNIQUEMENT pour les compétences listées ci-dessus
   • NE JAMAIS introduire de compétences non sélectionnées
   • NE JAMAIS élargir le périmètre au-delà des compétences cochées
   • Chaque tâche doit explicitement couvrir 1-2 compétences de la liste

2. STRUCTURE (CRITIQUE — RESPECTER EXACTEMENT)
   
   NOMBRE DE PHASES : 6 phases obligatoires
   Phase 1 : Installation / Setup
   Phase 2 : Fondamentaux
   Phase 3 : Pratique guidée
   Phase 4 : Exercices intermédiaires
   Phase 5 : Projets intégration
   Phase 6 : Validation finale
   
   NOMBRE DE TÂCHES : 7 par phase = 42 au total
   
   ❌ REJET AUTOMATIQUE si :
   - Moins de 6 phases
   - Moins de 35 tâches
   - Une phase avec moins de 5 tâches

3. FORMAT DES TÂCHES
   • Action concrète et réalisable
   • Verbes : créer, écrire, implémenter, tester, construire, configurer
   • Pas de théorie, pas de "comprendre", pas de "apprendre"

4. DISTRIBUTION DES NIVEAUX (1-5)
   • Niveau 1 (15min) : 1 par phase (setup, démarrage)
   • Niveau 2 (30min) : 3-4 par phase (exercices simples)
   • Niveau 3 (1h) : 2 par phase (travail principal)
   • Niveau 4 (2h) : 1 par phase (validation finale)

5. CHAQUE TÂCHE DOIT SPÉCIFIER
   • "level": niveau de difficulté 1-5
   • "covers": liste des compétences couvertes (1-2 max)
   • Ces compétences DOIVENT être dans la liste ci-dessus

═══════════════════════════════════════════════════════════════
FORMAT JSON ATTENDU
═══════════════════════════════════════════════════════════════

{{
    "projectName": "{input_data.projectTitle}",
    "suggestedDeadline": null,
    "coverageGrid": {input_data.selectedSkills},
    "phases": [
        {{
            "name": "Nom de phase",
            "objective": "Objectif opérationnel",
            "tasks": [
                {{
                    "title": "Action concrète",
                    "level": 2,
                    "covers": ["Compétence 1"],
                    "isValidation": false,
                    "unlockAfter": null
                }}
            ]
        }}
    ],
    "tasks": []
}}

Génère UNIQUEMENT le JSON, sans explication."""

    try:
        logger.info(f"🚀 Génération skill-based pour: '{input_data.projectTitle}'")
        logger.info(f"   Domain: {input_data.domain}, Skills: {len(input_data.selectedSkills)}")
        
        response_text = openai_service.generate_content(prompt)
        logger.info(f"✅ Réponse GPT reçue (skill-based, {len(response_text)} caractères)")
        
        # Parser le JSON
        import json
        import re
        
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if not json_match:
            raise ValueError("Pas de JSON valide dans la réponse")
        
        plan_data = json.loads(json_match.group())
        
        # Extraire les phases et tâches
        phases = []
        all_tasks = []
        
        if "phases" in plan_data and plan_data["phases"]:
            for phase_data in plan_data["phases"]:
                phase_tasks = [
                    TaskPlan(
                        title=t["title"],
                        level=t.get("level"),  # Nouveau format 1-5
                        effort=t.get("effort"),  # Legacy fallback
                        covers=t.get("covers"),
                        isValidation=t.get("isValidation", False),
                        unlockAfter=t.get("unlockAfter")
                    )
                    for t in phase_data.get("tasks", [])
                ]
                phases.append(PhasePlan(
                    name=phase_data["name"],
                    objective=phase_data.get("objective", ""),
                    tasks=phase_tasks
                ))
                all_tasks.extend(phase_tasks)
        
        # Validation : vérifier que les compétences sont bien dans le périmètre
        allowed_skills = set(s.lower() for s in input_data.selectedSkills)
        out_of_scope = []
        
        for task in all_tasks:
            if task.covers:
                for skill in task.covers:
                    if skill.lower() not in allowed_skills:
                        out_of_scope.append(f"{task.title} → {skill}")
        
        if out_of_scope and len(out_of_scope) > 5:
            print(f"⚠️ Compétences hors périmètre détectées : {out_of_scope[:5]}...")
        
        # Validation volume
        if len(all_tasks) < 25:
            raise ValueError(f"Plan trop court : {len(all_tasks)} tâches (minimum: 25)")
        
        if len(phases) < 4:
            raise ValueError(f"Pas assez de phases : {len(phases)} (minimum: 4)")
        
        # Compter validations
        validation_count = sum(1 for t in all_tasks if t.isValidation)
        logger.info(f"✅ Plan skill-based validé: {len(phases)} phases, {len(all_tasks)} tâches, {validation_count} validations")
        
        return ProjectPlan(
            projectName=input_data.projectTitle,
            suggestedDeadline=None,
            coverageGrid=input_data.selectedSkills,
            phases=phases,
            tasks=all_tasks
        )
        
    except openai.RateLimitError:
        logger.error("⚠️ Rate limit skill-based")
        raise HTTPException(429, "Trop de requêtes. Réessayez dans 1 minute.")
        
    except openai.APITimeoutError:
        logger.error("⏱️ Timeout skill-based")
        raise HTTPException(504, "Génération trop longue. Simplifiez les compétences sélectionnées.")
        
    except openai.APIConnectionError:
        logger.error("🔌 Erreur connexion skill-based")
        raise HTTPException(503, "Service temporairement indisponible.")
        
    except ValueError as e:
        logger.warning(f"⚠️ Validation skill-based échouée: {e}")
        raise HTTPException(422, str(e))
        
    except Exception as e:
        logger.error(f"❌ Erreur skill-based: {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(500, "Erreur de génération. Réessayez.")


# ═══════════════════════════════════════════════════════════════════════════════
# NOUVEAU ENDPOINT : Plan enrichi avec analyse des compétences utilisateur
# ═══════════════════════════════════════════════════════════════════════════════

class AdaptivePlanInput(BaseModel):
    """Input pour un plan adaptatif basé sur le profil utilisateur."""
    user_id: str  # ID de l'utilisateur pour l'analyse
    idea: Optional[str] = None  # Mode idée libre
    projectTitle: Optional[str] = None  # Mode skill-based
    domain: Optional[str] = None
    selectedSkills: Optional[List[str]] = None
    excludedSkills: Optional[List[str]] = None
    adapt_difficulty: bool = True  # Ajuster selon le niveau de l'utilisateur


class AdaptivePlanResponse(BaseModel):
    """Réponse enrichie avec analyse des compétences."""
    plan: ProjectPlan
    skill_analysis: dict  # Analyse des compétences détectées
    readiness: dict  # Niveau de préparation de l'utilisateur
    suggestions: List[dict]  # Suggestions d'apprentissage
    difficulty_adjusted: bool
    adjustment_reason: Optional[str] = None


@router.post("/generate-adaptive-plan")
async def generate_adaptive_plan(input_data: AdaptivePlanInput) -> AdaptivePlanResponse:
    """
    Génère un plan de projet adapté au profil de compétences de l'utilisateur.

    Ce endpoint combine:
    1. La génération de plan (idée ou skill-based)
    2. L'analyse des compétences requises vs acquises
    3. L'ajustement de difficulté si nécessaire
    4. Des suggestions d'apprentissage pour les lacunes

    Args:
        input_data: Paramètres incluant user_id pour l'adaptation

    Returns:
        Plan enrichi avec analyse et suggestions
    """
    from services.skill_bridge import get_skill_bridge

    # Déterminer le mode de génération
    if input_data.selectedSkills and len(input_data.selectedSkills) > 0:
        # Mode skill-based
        planning_input = PlanningInput(
            projectTitle=input_data.projectTitle or "Projet",
            domain=input_data.domain or "Général",
            selectedSkills=input_data.selectedSkills,
            excludedSkills=input_data.excludedSkills
        )
        base_plan = await generate_skill_based_plan(planning_input)
    elif input_data.idea:
        # Mode idée libre
        idea_input = IdeaInput(idea=input_data.idea)
        base_plan = await generate_project_plan(idea_input)
    else:
        raise HTTPException(
            status_code=400,
            detail="Fournissez soit 'idea' soit 'selectedSkills'"
        )

    # Analyser les compétences du plan
    bridge = get_skill_bridge()

    # Convertir les tâches pour l'analyse
    tasks_for_analysis = [
        {
            "id": f"task_{i}",
            "title": task.title,
            "covers": task.covers or [],
            "effort": task.effort,
            "isValidation": task.isValidation
        }
        for i, task in enumerate(base_plan.tasks)
    ]

    # Analyse des compétences
    analysis = bridge.analyze_project(
        user_id=input_data.user_id,
        tasks=tasks_for_analysis,
        project_id=base_plan.projectName
    )

    # Préparer les réponses
    skill_analysis = {
        "detected_skills": [
            {
                "id": d.skill.id,
                "name": d.skill.name,
                "confidence": round(d.confidence, 2)
            }
            for d in analysis.detected_skills
        ],
        "total_detected": len(analysis.detected_skills)
    }

    readiness = {
        "score": round(analysis.ready_percentage, 1),
        "status": (
            "ready" if analysis.ready_percentage >= 70
            else "partial" if analysis.ready_percentage >= 40
            else "needs_preparation"
        ),
        "gaps_count": len(analysis.skill_gaps)
    }

    suggestions = analysis.learning_suggestions

    # Ajustement de difficulté si demandé et nécessaire
    adjusted = False
    adjustment_reason = None
    final_plan = base_plan

    if input_data.adapt_difficulty and analysis.difficulty_adjustment != 0:
        # Adapter le plan
        plan_dict = base_plan.model_dump()
        adjusted_plan_dict = bridge.adapt_plan_difficulty(analysis, plan_dict)

        if adjusted_plan_dict.get("difficulty_adjusted"):
            adjusted = True
            adjustment_reason = adjusted_plan_dict.get("adjustment_reason")

            # Reconstruire le plan avec les modifications
            # (les tâches de scaffolding sont ajoutées dans adapt_plan_difficulty)
            logger.info(f"📊 Plan adapté pour {input_data.user_id}: adjustment={analysis.difficulty_adjustment}")

    return AdaptivePlanResponse(
        plan=final_plan,
        skill_analysis=skill_analysis,
        readiness=readiness,
        suggestions=suggestions,
        difficulty_adjusted=adjusted,
        adjustment_reason=adjustment_reason
    )
