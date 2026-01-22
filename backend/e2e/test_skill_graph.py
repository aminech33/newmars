"""
Test du système de graphe de compétences (Skill Graph).

Ce script teste:
1. La base de données des compétences
2. La détection de skills dans les tâches
3. L'analyse de gaps
4. Le tracking de progression
5. L'intégration avec la génération de plans

Usage:
    python -m e2e.test_skill_graph
    python -m e2e.test_skill_graph --full  # Test complet avec simulation
"""

import sys
import random
import asyncio
from datetime import datetime
from typing import Dict, List, Any


def print_header(title: str):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")


def print_result(test_name: str, success: bool, details: str = ""):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"  {status} | {test_name}")
    if details:
        print(f"         → {details}")


class SkillGraphTester:
    """
    Testeur complet pour le système de compétences.
    """

    def __init__(self):
        self.results: List[Dict] = []
        self.user_id = f"test_user_{datetime.now().strftime('%H%M%S')}"

    def run_all_tests(self) -> Dict[str, Any]:
        """Execute tous les tests."""
        print_header("TEST DU SYSTÈME SKILL GRAPH")
        print(f"User ID: {self.user_id}")

        # Tests de base
        self.test_database_init()
        self.test_skill_catalog()
        self.test_skill_relations()
        self.test_skill_search()

        # Tests utilisateur
        self.test_user_skills()
        self.test_skill_decay()
        self.test_gap_analysis()
        self.test_learning_path()

        # Tests bridge
        self.test_skill_detection()
        self.test_project_analysis()
        self.test_task_completion()

        # Tests intégration
        self.test_adaptive_plan()

        # Résumé
        return self.print_summary()

    # =========================================================================
    # TESTS DATABASE
    # =========================================================================

    def test_database_init(self):
        """Test l'initialisation de la base de données."""
        print_header("DATABASE TESTS")

        try:
            from databases import skill_graph_db as db

            # Vérifier que la DB existe
            skills = db.get_all_skills()

            self.results.append({
                "test": "Database Init",
                "success": len(skills) > 0,
                "details": f"{len(skills)} skills chargées"
            })
            print_result("Database Init", len(skills) > 0, f"{len(skills)} skills")

        except Exception as e:
            self.results.append({"test": "Database Init", "success": False, "details": str(e)})
            print_result("Database Init", False, str(e))

    def test_skill_catalog(self):
        """Test le catalogue de compétences."""
        try:
            from databases import skill_graph_db as db

            # Lister par catégorie
            all_skills = db.get_all_skills()
            programming = db.get_all_skills("programming")
            frameworks = db.get_all_skills("framework")

            has_categories = len(programming) > 0 and len(frameworks) > 0
            self.results.append({
                "test": "Skill Catalog",
                "success": has_categories,
                "details": f"programming={len(programming)}, framework={len(frameworks)}"
            })
            print_result("Skill Catalog", has_categories,
                        f"prog={len(programming)}, fw={len(frameworks)}")

            # Vérifier structure
            if all_skills:
                skill = all_skills[0]
                has_fields = all([
                    hasattr(skill, 'id'),
                    hasattr(skill, 'name'),
                    hasattr(skill, 'category'),
                    hasattr(skill, 'level'),
                    hasattr(skill, 'keywords')
                ])
                self.results.append({
                    "test": "Skill Structure",
                    "success": has_fields,
                    "details": f"Sample: {skill.id} ({skill.name})"
                })
                print_result("Skill Structure", has_fields, f"{skill.id}")

        except Exception as e:
            self.results.append({"test": "Skill Catalog", "success": False, "details": str(e)})
            print_result("Skill Catalog", False, str(e))

    def test_skill_relations(self):
        """Test les relations entre compétences."""
        try:
            from databases import skill_graph_db as db

            # React nécessite JavaScript
            react_prereqs = db.get_prerequisites("react")
            has_js_prereq = any(p.id == "javascript" for p in react_prereqs)

            self.results.append({
                "test": "Prerequisites",
                "success": has_js_prereq,
                "details": f"react → {[p.id for p in react_prereqs]}"
            })
            print_result("Prerequisites (react→js)", has_js_prereq,
                        f"{[p.id for p in react_prereqs]}")

            # JavaScript débloque React
            js_dependents = db.get_dependent_skills("javascript")
            unlocks_react = any(d.id == "react" for d in js_dependents)

            self.results.append({
                "test": "Dependents",
                "success": unlocks_react,
                "details": f"js unlocks {[d.id for d in js_dependents[:5]]}"
            })
            print_result("Dependents (js→react)", unlocks_react,
                        f"unlocks {len(js_dependents)} skills")

            # Skills similaires
            similar = db.get_similar_skills("react")
            has_similar = len(similar) > 0

            self.results.append({
                "test": "Similar Skills",
                "success": has_similar,
                "details": f"react similar to {[s.id for s in similar]}"
            })
            print_result("Similar Skills", has_similar, f"{[s.id for s in similar]}")

        except Exception as e:
            self.results.append({"test": "Skill Relations", "success": False, "details": str(e)})
            print_result("Skill Relations", False, str(e))

    def test_skill_search(self):
        """Test la recherche de compétences."""
        try:
            from databases import skill_graph_db as db

            # Recherche exacte
            js = db.find_skill_by_keyword("javascript")
            found_js = js is not None and js.id == "javascript"

            # Recherche alias
            py = db.find_skill_by_keyword("py")
            found_py = py is not None and py.id == "python"

            # Recherche partielle
            react = db.find_skill_by_keyword("react")
            found_react = react is not None

            all_found = found_js and found_py and found_react
            self.results.append({
                "test": "Skill Search",
                "success": all_found,
                "details": f"js={found_js}, py={found_py}, react={found_react}"
            })
            print_result("Skill Search", all_found,
                        f"js={found_js}, py={found_py}, react={found_react}")

        except Exception as e:
            self.results.append({"test": "Skill Search", "success": False, "details": str(e)})
            print_result("Skill Search", False, str(e))

    # =========================================================================
    # TESTS USER SKILLS
    # =========================================================================

    def test_user_skills(self):
        """Test la gestion des compétences utilisateur."""
        print_header("USER SKILLS TESTS")

        try:
            from databases import skill_graph_db as db

            # Ajouter des compétences
            db.update_user_skill(self.user_id, "javascript", mastery_delta=50)
            db.update_user_skill(self.user_id, "python", mastery_delta=70)
            db.update_user_skill(self.user_id, "variables", mastery_delta=90)

            # Récupérer
            user_skills = db.get_user_skills(self.user_id)
            has_skills = len(user_skills) >= 3

            self.results.append({
                "test": "User Skills Update",
                "success": has_skills,
                "details": f"{len(user_skills)} skills tracked"
            })
            print_result("User Skills Update", has_skills, f"{len(user_skills)} skills")

            # Vérifier mastery
            js_skill = user_skills.get("javascript")
            correct_mastery = js_skill and js_skill.mastery >= 45  # Peut être un peu moins à cause du decay

            self.results.append({
                "test": "Mastery Value",
                "success": correct_mastery,
                "details": f"javascript mastery = {js_skill.mastery if js_skill else 0}"
            })
            print_result("Mastery Value", correct_mastery,
                        f"js = {js_skill.mastery if js_skill else 0}")

        except Exception as e:
            self.results.append({"test": "User Skills", "success": False, "details": str(e)})
            print_result("User Skills", False, str(e))

    def test_skill_decay(self):
        """Test le decay temporel des compétences."""
        try:
            from databases import skill_graph_db as db
            from datetime import datetime, timedelta

            # Récupérer skill avec decay
            mastery, user_skill = db.get_user_skill_with_decay(self.user_id, "javascript")

            # Le decay ne devrait pas être significatif immédiatement
            no_immediate_decay = mastery >= 45  # Proche de l'original

            self.results.append({
                "test": "Skill Decay Calculation",
                "success": no_immediate_decay,
                "details": f"Current mastery with decay: {mastery:.1f}"
            })
            print_result("Skill Decay", no_immediate_decay, f"mastery = {mastery:.1f}")

        except Exception as e:
            self.results.append({"test": "Skill Decay", "success": False, "details": str(e)})
            print_result("Skill Decay", False, str(e))

    def test_gap_analysis(self):
        """Test l'analyse des lacunes."""
        try:
            from databases import skill_graph_db as db

            # Analyser gaps pour React (nécessite JS que l'utilisateur a)
            gaps = db.analyze_skill_gaps(
                self.user_id,
                ["react", "typescript", "node"],
                min_mastery=60.0
            )

            has_gaps = len(gaps) > 0

            self.results.append({
                "test": "Gap Analysis",
                "success": has_gaps,
                "details": f"{len(gaps)} gaps detected"
            })
            print_result("Gap Analysis", has_gaps, f"{len(gaps)} gaps")

            # Afficher les gaps
            for gap in gaps[:3]:
                print(f"         → {gap.skill.name}: {gap.current_mastery:.0f}% → {gap.required_mastery:.0f}% (gap: {gap.gap:.0f})")
                if gap.blocking_skills:
                    print(f"           Blocked by: {gap.blocking_skills}")

        except Exception as e:
            self.results.append({"test": "Gap Analysis", "success": False, "details": str(e)})
            print_result("Gap Analysis", False, str(e))

    def test_learning_path(self):
        """Test la génération de chemin d'apprentissage."""
        try:
            from databases import skill_graph_db as db

            # Chemin vers React
            path = db.get_learning_path(self.user_id, "react")

            has_path = len(path) > 0

            self.results.append({
                "test": "Learning Path",
                "success": has_path,
                "details": f"Path to react: {[s.id for s in path]}"
            })
            print_result("Learning Path", has_path, f"{len(path)} steps")

            if path:
                print(f"         → Path: {' → '.join(s.name for s in path)}")

        except Exception as e:
            self.results.append({"test": "Learning Path", "success": False, "details": str(e)})
            print_result("Learning Path", False, str(e))

    # =========================================================================
    # TESTS SKILL BRIDGE
    # =========================================================================

    def test_skill_detection(self):
        """Test la détection de compétences dans les tâches."""
        print_header("SKILL BRIDGE TESTS")

        try:
            from services.skill_bridge import get_skill_bridge

            bridge = get_skill_bridge()

            # Test détection dans texte
            text = "Créer un composant React avec des hooks useState"
            detected = bridge.detect_skills_from_text(text)

            found_react = any(d.skill.id == "react" for d in detected)

            self.results.append({
                "test": "Skill Detection (text)",
                "success": found_react,
                "details": f"Detected: {[d.skill.id for d in detected]}"
            })
            print_result("Skill Detection (text)", found_react,
                        f"{[d.skill.id for d in detected]}")

            # Test détection dans tâche
            task = {
                "title": "Implémenter une API REST avec FastAPI",
                "covers": ["python", "fastapi"],
                "effort": "M"
            }
            task_detected = bridge.detect_skills_from_task(task)

            found_python = any(d.skill.id == "python" for d in task_detected)
            found_fastapi = any(d.skill.id == "fastapi" for d in task_detected)

            self.results.append({
                "test": "Skill Detection (task)",
                "success": found_python and found_fastapi,
                "details": f"python={found_python}, fastapi={found_fastapi}"
            })
            print_result("Skill Detection (task)", found_python and found_fastapi,
                        f"{[d.skill.id for d in task_detected]}")

        except Exception as e:
            self.results.append({"test": "Skill Detection", "success": False, "details": str(e)})
            print_result("Skill Detection", False, str(e))

    def test_project_analysis(self):
        """Test l'analyse de projet."""
        try:
            from services.skill_bridge import get_skill_bridge

            bridge = get_skill_bridge()

            # Projet fictif
            tasks = [
                {"title": "Setup environnement Node.js", "covers": ["node"], "effort": "XS"},
                {"title": "Créer composants React", "covers": ["react"], "effort": "M"},
                {"title": "Implémenter hooks personnalisés", "covers": ["react"], "effort": "M"},
                {"title": "Ajouter TypeScript", "covers": ["typescript"], "effort": "S"},
                {"title": "Tests unitaires", "covers": ["javascript"], "effort": "L"},
            ]

            analysis = bridge.analyze_project(
                user_id=self.user_id,
                tasks=tasks,
                project_id="test_project"
            )

            has_analysis = (
                len(analysis.detected_skills) > 0 and
                analysis.ready_percentage >= 0 and
                analysis.difficulty_adjustment >= -2
            )

            self.results.append({
                "test": "Project Analysis",
                "success": has_analysis,
                "details": f"Ready: {analysis.ready_percentage:.0f}%, Adjust: {analysis.difficulty_adjustment}"
            })
            print_result("Project Analysis", has_analysis,
                        f"Ready: {analysis.ready_percentage:.0f}%")

            print(f"         → Detected: {[d.skill.id for d in analysis.detected_skills]}")
            print(f"         → Gaps: {len(analysis.skill_gaps)}")
            print(f"         → Difficulty adjustment: {analysis.difficulty_adjustment}")

        except Exception as e:
            self.results.append({"test": "Project Analysis", "success": False, "details": str(e)})
            print_result("Project Analysis", False, str(e))

    def test_task_completion(self):
        """Test le tracking de complétion de tâche."""
        try:
            from services.skill_bridge import get_skill_bridge
            from databases import skill_graph_db as db

            bridge = get_skill_bridge()

            # Mastery avant
            before_mastery, _ = db.get_user_skill_with_decay(self.user_id, "react")

            # Compléter une tâche
            task = {
                "id": "task_001",
                "title": "Créer un composant React",
                "covers": ["react"],
                "effort": "M",
                "isValidation": False
            }

            result = bridge.on_task_completed(
                user_id=self.user_id,
                task=task,
                success=True
            )

            # Mastery après
            after_mastery, _ = db.get_user_skill_with_decay(self.user_id, "react")

            improved = after_mastery > (before_mastery or 0)

            self.results.append({
                "test": "Task Completion Tracking",
                "success": improved,
                "details": f"React: {before_mastery or 0:.0f}% → {after_mastery:.0f}%"
            })
            print_result("Task Completion", improved,
                        f"{before_mastery or 0:.0f}% → {after_mastery:.0f}%")

            if result.unlocked_skills:
                print(f"         → Unlocked: {result.unlocked_skills}")

        except Exception as e:
            self.results.append({"test": "Task Completion", "success": False, "details": str(e)})
            print_result("Task Completion", False, str(e))

    # =========================================================================
    # TESTS INTEGRATION
    # =========================================================================

    def test_adaptive_plan(self):
        """Test la génération de plan adaptatif (optionnel, nécessite API)."""
        print_header("INTEGRATION TESTS")

        try:
            # Ce test nécessite l'API OpenAI, on le skip si pas disponible
            from services.skill_bridge import get_skill_bridge

            bridge = get_skill_bridge()

            # Test readiness check (ne nécessite pas d'API)
            readiness = bridge.get_user_readiness(
                self.user_id,
                ["javascript", "react", "typescript"]
            )

            has_readiness = "readiness_score" in readiness

            self.results.append({
                "test": "Readiness Check",
                "success": has_readiness,
                "details": f"Score: {readiness.get('readiness_score', 0)}%"
            })
            print_result("Readiness Check", has_readiness,
                        f"Score: {readiness.get('readiness_score', 0)}%")

            print(f"         → Ready: {len(readiness.get('ready', []))} skills")
            print(f"         → Learning: {len(readiness.get('learning', []))} skills")
            print(f"         → Missing: {len(readiness.get('missing', []))} skills")
            print(f"         → Recommendation: {readiness.get('recommendation')}")

        except Exception as e:
            self.results.append({"test": "Adaptive Plan", "success": False, "details": str(e)})
            print_result("Adaptive Plan", False, str(e))

    # =========================================================================
    # SUMMARY
    # =========================================================================

    def print_summary(self) -> Dict[str, Any]:
        """Affiche le résumé des tests."""
        print_header("TEST SUMMARY")

        passed = sum(1 for r in self.results if r["success"])
        failed = len(self.results) - passed
        total = len(self.results)

        print(f"  Total:  {total} tests")
        print(f"  Passed: {passed} ✅")
        print(f"  Failed: {failed} ❌")
        print(f"  Rate:   {passed/total*100:.0f}%")

        if failed > 0:
            print(f"\n  Failed tests:")
            for r in self.results:
                if not r["success"]:
                    print(f"    - {r['test']}: {r.get('details', 'No details')}")

        return {
            "total": total,
            "passed": passed,
            "failed": failed,
            "rate": passed / total if total > 0 else 0,
            "results": self.results
        }


def run_simulation(days: int = 7):
    """
    Simulation complète avec utilisateurs autonomes.

    Crée plusieurs utilisateurs qui:
    1. Génèrent des projets
    2. Complètent des tâches
    3. Progressent dans leurs compétences
    """
    print_header("SIMULATION COMPLÈTE")

    from databases import skill_graph_db as db
    from services.skill_bridge import get_skill_bridge

    bridge = get_skill_bridge()

    # Créer des profils utilisateurs
    users = [
        {"id": "sim_beginner", "name": "Débutant", "skill_boost": 0},
        {"id": "sim_intermediate", "name": "Intermédiaire", "skill_boost": 40},
        {"id": "sim_advanced", "name": "Avancé", "skill_boost": 70},
    ]

    # Initialiser les compétences de base
    for user in users:
        # Variables de base pour tout le monde
        db.update_user_skill(user["id"], "variables", mastery_delta=50 + user["skill_boost"])
        db.update_user_skill(user["id"], "conditions", mastery_delta=40 + user["skill_boost"])
        db.update_user_skill(user["id"], "loops", mastery_delta=30 + user["skill_boost"])
        db.update_user_skill(user["id"], "functions", mastery_delta=20 + user["skill_boost"])

        if user["skill_boost"] > 0:
            db.update_user_skill(user["id"], "javascript", mastery_delta=user["skill_boost"])

        if user["skill_boost"] > 30:
            db.update_user_skill(user["id"], "python", mastery_delta=user["skill_boost"] - 20)

    # Projets à simuler
    projects = [
        {
            "name": "App React Todo",
            "tasks": [
                {"title": "Setup Create React App", "covers": ["react", "javascript"], "effort": "XS"},
                {"title": "Créer composant TodoList", "covers": ["react"], "effort": "S"},
                {"title": "Ajouter state avec useState", "covers": ["react"], "effort": "S"},
                {"title": "Implémenter ajout de todo", "covers": ["react", "javascript"], "effort": "M"},
                {"title": "Ajouter suppression", "covers": ["react"], "effort": "S"},
                {"title": "Persister en localStorage", "covers": ["javascript"], "effort": "M"},
                {"title": "Ajouter filtres", "covers": ["react"], "effort": "M", "isValidation": True},
            ]
        },
        {
            "name": "API Python",
            "tasks": [
                {"title": "Setup FastAPI", "covers": ["python", "fastapi"], "effort": "XS"},
                {"title": "Créer endpoint GET", "covers": ["fastapi"], "effort": "S"},
                {"title": "Ajouter endpoint POST", "covers": ["fastapi"], "effort": "S"},
                {"title": "Connexion base de données", "covers": ["python", "sql"], "effort": "M"},
                {"title": "Implémenter CRUD complet", "covers": ["fastapi", "sql"], "effort": "L", "isValidation": True},
            ]
        }
    ]

    print(f"\nSimulation sur {days} jours avec {len(users)} utilisateurs\n")

    # Simuler chaque jour
    for day in range(1, days + 1):
        print(f"\n--- Jour {day} ---")

        for user in users:
            # Choisir un projet aléatoire
            project = random.choice(projects)

            # Analyser le projet pour cet utilisateur
            analysis = bridge.analyze_project(
                user_id=user["id"],
                tasks=project["tasks"],
                project_id=f"{project['name']}_{user['id']}"
            )

            # Compléter 1-3 tâches selon le niveau
            tasks_to_complete = random.randint(1, 3)
            completed = 0

            for task in project["tasks"][:tasks_to_complete]:
                # Probabilité de succès basée sur readiness
                success_prob = analysis.ready_percentage / 100
                success = random.random() < success_prob + 0.3  # Bonus de 30%

                result = bridge.on_task_completed(
                    user_id=user["id"],
                    task=task,
                    success=success
                )

                if success:
                    completed += 1

            print(f"  {user['name']}: {completed}/{tasks_to_complete} tâches (ready: {analysis.ready_percentage:.0f}%)")

    # Résumé final
    print_header("RÉSULTATS SIMULATION")

    for user in users:
        summary = db.get_user_skill_summary(user["id"])

        print(f"\n{user['name']}:")
        print(f"  Total skills: {summary['total_skills']}")
        print(f"  Mastered: {summary['mastered']}")
        print(f"  Learning: {summary['learning']}")

        if summary['strongest']:
            print(f"  Strongest: {summary['strongest']['name']} ({summary['strongest']['mastery']}%)")

        if summary['recommendations']:
            print(f"  Next to learn: {[r['name'] for r in summary['recommendations'][:3]]}")


def main():
    """Point d'entrée principal."""
    import argparse

    parser = argparse.ArgumentParser(description="Test du système Skill Graph")
    parser.add_argument("--full", action="store_true", help="Inclure simulation complète")
    parser.add_argument("--days", type=int, default=7, help="Jours de simulation")
    args = parser.parse_args()

    # Tests de base
    tester = SkillGraphTester()
    results = tester.run_all_tests()

    # Simulation si demandée
    if args.full:
        run_simulation(days=args.days)

    # Exit code basé sur les résultats
    sys.exit(0 if results["failed"] == 0 else 1)


if __name__ == "__main__":
    main()
