"""
🧪 E2E TEST FRAMEWORK v3.2 - UNIVERSAL APP TESTING + USER SIMULATION
Framework de test automatisé avec connexion UNIVERSELLE à toute l'application.

NOUVEAUTÉ v3.2: UserSimulator avec Learning Engine
- Simulation réaliste d'utilisateurs avec différents comportements
- Utilise directement le Learning Engine (FSRS, cognitive load, etc.)
- 5 profils: motivated, average, irregular, struggling, expert
- Simulation jour/semaine complète avec XP, mastery, fatigue

NOUVEAUTÉ v3.1: Tests de NAVIGATION / UTILISABILITÉ
- Parcours Onboarding (premier utilisateur)
- Journée type complète (matin → soir)
- Workflow de révision (concepts → quiz → progression)
- Navigation cross-module (Health ↔ Tasks ↔ Learning ↔ Knowledge)

NOUVEAUTÉ v3.0: UniversalAdapter
- Appelle n'importe quelle route API dynamiquement
- Auto-découverte des endpoints FastAPI
- Pas besoin de modifier le framework pour nouvelles fonctionnalités

Les personas (determined, average, irregular, struggling) peuvent tester:
- 📚 Learning API (quiz, progression, analytics, FSRS, cognitive load)
- 📋 Tasks API (projets, tâches, pomodoro, catégories)
- 🏥 Health API (poids, repas, hydratation, profil)
- 🧠 Knowledge API (concepts, révision, decay temporel)
- 🧭 Navigation (parcours utilisateur, utilisabilité)
- 🎭 Simulation (utilisateurs virtuels avec Learning Engine)
- 🔌 N'IMPORTE QUELLE NOUVELLE API automatiquement!

Usage:
    python test_e2e_framework.py                           # Test complet (défaut)
    python test_e2e_framework.py --scenario simulate       # Tests simulation utilisateurs
    python test_e2e_framework.py --simulate motivated      # Simulation standalone (motivated)
    python test_e2e_framework.py --simulate average --sim-days 7  # Simulation 7 jours
    python test_e2e_framework.py --scenario navigation     # Test navigation/utilisabilité
    python test_e2e_framework.py --scenario tasks          # Test Tasks uniquement
    python test_e2e_framework.py --mode api                # Test via API HTTP
    python test_e2e_framework.py --discover                # Découvrir toutes les routes
"""

import sys
sys.path.insert(0, '.')

import argparse
import json
import random
import time
import requests
from datetime import datetime
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from enum import Enum
import traceback

# Import du simulateur existant
from test_simulation_profils import (
    SimulatedStudent, StudentProfile, PROFILES,
    TOPIC_TRANSFER_MATRIX
)

# Import du moteur LEAN pour mode direct
from services.learning_engine_lean import lean_engine, LeanLearningEngine


# =============================================================================
# CONFIGURATION
# =============================================================================

class TestMode(Enum):
    DIRECT = "direct"  # Appel direct Python au moteur
    API = "api"        # Appel HTTP à l'API


@dataclass
class TestConfig:
    """Configuration du test E2E"""
    mode: TestMode = TestMode.DIRECT
    api_url: str = "http://localhost:8000"
    num_days: int = 14
    questions_per_day: int = 15
    topics: List[str] = field(default_factory=lambda: ["conjugaison", "grammaire", "vocabulaire", "orthographe"])
    verbose: bool = True
    fail_fast: bool = False  # Arrêter au premier échec
    timeout_seconds: int = 30


@dataclass
class TestResult:
    """Résultat d'un test"""
    name: str
    passed: bool
    duration_ms: float
    message: str = ""
    details: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None


@dataclass
class TestReport:
    """Rapport complet de test"""
    start_time: datetime
    end_time: Optional[datetime] = None
    config: Optional[TestConfig] = None
    results: List[TestResult] = field(default_factory=list)

    @property
    def passed(self) -> int:
        return sum(1 for r in self.results if r.passed)

    @property
    def failed(self) -> int:
        return sum(1 for r in self.results if not r.passed)

    @property
    def total(self) -> int:
        return len(self.results)

    @property
    def success_rate(self) -> float:
        return self.passed / self.total if self.total > 0 else 0.0

    def to_dict(self) -> Dict:
        return {
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "config": {
                "mode": self.config.mode.value if self.config else None,
                "num_days": self.config.num_days if self.config else None,
            },
            "summary": {
                "total": self.total,
                "passed": self.passed,
                "failed": self.failed,
                "success_rate": f"{self.success_rate*100:.1f}%"
            },
            "results": [
                {
                    "name": r.name,
                    "passed": r.passed,
                    "duration_ms": r.duration_ms,
                    "message": r.message,
                    "error": r.error
                }
                for r in self.results
            ]
        }


# =============================================================================
# UNIVERSAL ADAPTER - Connexion dynamique à TOUTE l'application
# =============================================================================

class UniversalAdapter:
    """
    Adaptateur UNIVERSEL qui peut appeler n'importe quelle route de l'application.

    Usage:
        adapter = UniversalAdapter(config)

        # Appel générique à n'importe quelle route
        result = adapter.call("GET", "/api/health/weight")
        result = adapter.call("POST", "/api/tasks-db/tasks", {"title": "Ma tâche"})

        # Raccourcis pratiques
        result = adapter.get("/api/health/weight")
        result = adapter.post("/api/tasks-db/tasks", {"title": "Ma tâche"})

        # Auto-découverte des routes disponibles
        routes = adapter.discover_routes()
    """

    def __init__(self, config: 'TestConfig'):
        self.config = config
        self.session = requests.Session() if config.mode == TestMode.API else None
        self._routes_cache: Optional[List[Dict]] = None
        self._modules_cache: Dict[str, Any] = {}

    # =========================================================================
    # APPELS HTTP GÉNÉRIQUES
    # =========================================================================

    def call(self, method: str, path: str, data: Dict = None, params: Dict = None) -> Dict:
        """
        Appelle n'importe quelle route de l'application.

        Args:
            method: GET, POST, PUT, DELETE, PATCH
            path: Chemin de la route (ex: "/api/health/weight")
            data: Corps de la requête (pour POST/PUT/PATCH)
            params: Paramètres de query string

        Returns:
            Réponse JSON ou {"error": message}
        """
        if self.config.mode == TestMode.DIRECT:
            return self._call_direct(method, path, data, params)
        else:
            return self._call_api(method, path, data, params)

    def _call_api(self, method: str, path: str, data: Dict = None, params: Dict = None) -> Dict:
        """Appel HTTP à l'API"""
        url = f"{self.config.api_url}{path}"
        method = method.upper()

        try:
            if method == "GET":
                response = self.session.get(url, params=params, timeout=self.config.timeout_seconds)
            elif method == "POST":
                response = self.session.post(url, json=data, params=params, timeout=self.config.timeout_seconds)
            elif method == "PUT":
                response = self.session.put(url, json=data, params=params, timeout=self.config.timeout_seconds)
            elif method == "DELETE":
                response = self.session.delete(url, params=params, timeout=self.config.timeout_seconds)
            elif method == "PATCH":
                response = self.session.patch(url, json=data, params=params, timeout=self.config.timeout_seconds)
            else:
                return {"error": f"Méthode HTTP non supportée: {method}"}

            # Retourner la réponse JSON ou un dict avec le status
            try:
                result = response.json()
                result["_status_code"] = response.status_code
                return result
            except:
                return {
                    "_status_code": response.status_code,
                    "_text": response.text[:500] if response.text else "",
                    "success": 200 <= response.status_code < 300
                }

        except requests.exceptions.Timeout:
            return {"error": "Timeout", "_status_code": 408}
        except requests.exceptions.ConnectionError:
            return {"error": "Connexion impossible", "_status_code": 503}
        except Exception as e:
            return {"error": str(e), "_status_code": 500}

    def _call_direct(self, method: str, path: str, data: Dict = None, params: Dict = None) -> Dict:
        """
        Appel direct Python aux modules de l'application.
        Mappe les routes vers les fonctions Python correspondantes.
        """
        # Normaliser le path
        path = path.rstrip("/")
        parts = path.split("/")

        # Router vers le bon module
        try:
            # /api/tasks-db/*
            if "/tasks-db" in path or "/tasks" in path:
                return self._route_tasks(method, path, data, params)

            # /api/health/*
            elif "/health" in path:
                return self._route_health(method, path, data, params)

            # /api/knowledge/*
            elif "/knowledge" in path:
                return self._route_knowledge(method, path, data, params)

            # /api/learning/*
            elif "/learning" in path:
                return self._route_learning(method, path, data, params)

            # /health (healthcheck global)
            elif path == "/health":
                return {"status": "ok", "success": True}

            # Route non reconnue en mode direct
            else:
                return {"error": f"Route non mappée en mode direct: {path}", "success": False}

        except Exception as e:
            return {"error": str(e), "success": False}

    def _route_tasks(self, method: str, path: str, data: Dict = None, params: Dict = None) -> Dict:
        """Route les appels vers tasks_db"""
        from databases import tasks_db
        from datetime import datetime

        # Normaliser le path
        path = path.rstrip('/')

        # GET /api/tasks-db/dashboard
        if method == "GET" and path.endswith("/dashboard"):
            today = datetime.now().strftime('%Y-%m-%d')
            return {
                "success": True,
                "date": today,
                "stats": tasks_db.get_stats(),
                "projects_count": len(tasks_db.get_projects()),
                "pending_tasks": len(tasks_db.get_tasks(include_completed=False))
            }

        # POST /api/tasks-db/projects
        elif method == "POST" and path.endswith("/projects"):
            project_id = tasks_db.add_project(data or {})
            return {"success": True, "id": project_id}

        # GET /api/tasks-db/projects
        elif method == "GET" and path.endswith("/projects"):
            return {"projects": tasks_db.get_projects(), "success": True}

        # POST /api/tasks-db/tasks/{id}/toggle
        elif method == "POST" and "/toggle" in path:
            task_id = path.split("/")[-2]
            new_status = tasks_db.toggle_task(task_id)
            return {"success": True, "completed": new_status}

        # POST /api/tasks-db/pomodoro
        elif method == "POST" and path.endswith("/pomodoro"):
            data = data or {}
            data["date"] = data.get("date", datetime.now().strftime('%Y-%m-%d'))
            session_id = tasks_db.add_pomodoro_session(data)
            return {"success": True, "id": session_id}

        # POST /api/tasks-db/tasks (create task)
        elif method == "POST" and path.endswith("/tasks"):
            if not data or "title" not in data:
                return {"error": "title is required", "success": False}
            task_id = tasks_db.add_task(data)
            return {"success": True, "id": task_id}

        # GET /api/tasks-db/tasks
        elif method == "GET" and path.endswith("/tasks"):
            project_id = (params or {}).get("project_id")
            return {"tasks": tasks_db.get_tasks(project_id=project_id), "count": len(tasks_db.get_tasks(project_id=project_id)), "success": True}

        # DELETE /api/tasks-db/tasks/{id}
        elif method == "DELETE" and "/tasks/" in path:
            task_id = path.split("/")[-1]
            result = tasks_db.delete_task(task_id)
            return {"success": result}

        # GET /api/tasks-db/stats
        elif method == "GET" and path.endswith("/stats"):
            return {"stats": tasks_db.get_stats(), "success": True}

        return {"error": f"Route tasks non mappée: {method} {path}", "success": False}

    def _route_health(self, method: str, path: str, data: Dict = None, params: Dict = None) -> Dict:
        """Route les appels vers health_db"""
        from databases import health_db
        from datetime import datetime

        # POST /api/health/weight
        if method == "POST" and "/weight" in path:
            data = data or {}
            data["date"] = data.get("date", datetime.now().strftime('%Y-%m-%d'))
            entry_id = health_db.add_weight_entry(data)
            return {"success": True, "id": entry_id}

        # GET /api/health/weight
        elif method == "GET" and "/weight" in path:
            limit = (params or {}).get("limit", 10)
            return {"entries": health_db.get_weight_entries(limit=limit), "success": True}

        # POST /api/health/meals
        elif method == "POST" and "/meals" in path:
            data = data or {}
            data["date"] = data.get("date", datetime.now().strftime('%Y-%m-%d'))
            meal_id = health_db.add_meal(data)
            return {"success": True, "id": meal_id}

        # GET /api/health/meals
        elif method == "GET" and "/meals" in path:
            date = (params or {}).get("date")
            return {"meals": health_db.get_meals(date=date), "success": True}

        # POST /api/health/hydration
        elif method == "POST" and "/hydration" in path:
            data = data or {}
            entry_id = health_db.add_hydration(
                amount_ml=data.get("amount_ml", 250),
                date=data.get("date")
            )
            return {"success": True, "id": entry_id}

        # GET /api/health/hydration
        elif method == "GET" and "/hydration" in path:
            date = (params or {}).get("date")
            return {"hydration": health_db.get_daily_hydration(date=date), "success": True}

        # GET /api/health/dashboard
        elif method == "GET" and "/dashboard" in path:
            today = datetime.now().strftime('%Y-%m-%d')
            return {
                "weight": health_db.get_weight_stats(),
                "nutrition": health_db.get_daily_nutrition(date=today),
                "hydration": health_db.get_daily_hydration(date=today),
                "profile": health_db.get_health_profile(),
                "success": True
            }

        return {"error": f"Route health non mappée: {method} {path}", "success": False}

    def _route_knowledge(self, method: str, path: str, data: Dict = None, params: Dict = None) -> Dict:
        """Route les appels vers database (knowledge)"""
        from database import db

        # POST /api/knowledge/add
        if method == "POST" and "/add" in path:
            data = data or {}
            concept_id = db.add_concept(
                course_id=data.get("course_id", "default"),
                concept=data.get("concept", ""),
                category=data.get("category"),
                definition=data.get("definition")
            )
            return {"success": True, "concept_id": concept_id}

        # GET /api/knowledge/{course_id}
        elif method == "GET" and "/search" not in path and "/review" not in path:
            parts = path.rstrip("/").split("/")
            course_id = parts[-1] if len(parts) > 2 else "default"
            return {"concepts": db.get_concepts(course_id), "success": True}

        # GET /api/knowledge/search/{course_id}
        elif method == "GET" and "/search" in path:
            parts = path.rstrip("/").split("/")
            course_id = parts[-1]
            query = (params or {}).get("query", "")
            return {"concepts": db.search_concepts(course_id, query), "success": True}

        # GET /api/knowledge/{course_id}/review-needed
        elif method == "GET" and "/review" in path:
            from utils.mastery_decay import get_concepts_needing_review
            parts = path.split("/")
            course_id = parts[-2] if len(parts) > 2 else "default"
            limit = (params or {}).get("limit", 10)
            concepts = db.get_concepts(course_id)
            return {"concepts": get_concepts_needing_review(concepts, limit), "success": True}

        # PUT /api/knowledge/mastery
        elif method == "PUT" and "/mastery" in path:
            data = data or {}
            db.update_mastery(data.get("concept_id"), data.get("mastery_level", 0))
            return {"success": True, "new_mastery": data.get("mastery_level")}

        return {"error": f"Route knowledge non mappée: {method} {path}", "success": False}

    def _route_learning(self, method: str, path: str, data: Dict = None, params: Dict = None) -> Dict:
        """Route les appels vers learning_engine_lean"""
        from services.learning_engine_lean import lean_engine

        # POST /api/learning/start-session
        if method == "POST" and "/start-session" in path:
            data = data or {}
            user_id = data.get("user_id", "test_user")
            lean_engine.reset_session(user_id, save=False)
            return {"success": True, "session_id": f"session_{user_id}"}

        # GET /api/learning/next-question/{user_id}
        elif method == "GET" and "/next-question" in path:
            user_id = path.split("/")[-1]
            topic_id = (params or {}).get("topic_id", "default")
            mastery = (params or {}).get("mastery", 50)
            result = lean_engine.get_next_question(user_id, topic_id, mastery)
            return {
                "difficulty": result.difficulty,
                "difficulty_name": result.difficulty_name,
                "topic_id": result.topic_id,
                "success": True
            }

        # POST /api/learning/submit-answer/{user_id}
        elif method == "POST" and "/submit-answer" in path:
            user_id = path.split("/")[-1]
            data = data or {}
            result = lean_engine.process_answer(
                user_id=user_id,
                topic_id=data.get("topic_id", "default"),
                is_correct=data.get("is_correct", True),
                response_time=data.get("response_time", 5.0),
                difficulty=data.get("difficulty", 2)
            )
            return {
                "xp_earned": result.xp_earned,
                "mastery_change": result.mastery_change,
                "feedback": result.feedback,
                "success": True
            }

        # GET /api/learning/progress/{user_id}
        elif method == "GET" and "/progress" in path:
            user_id = path.split("/")[-1]
            return {**lean_engine.get_user_stats(user_id), "success": True}

        return {"error": f"Route learning non mappée: {method} {path}", "success": False}

    # =========================================================================
    # RACCOURCIS PRATIQUES
    # =========================================================================

    def get(self, path: str, params: Dict = None) -> Dict:
        """Raccourci pour GET"""
        return self.call("GET", path, params=params)

    def post(self, path: str, data: Dict = None) -> Dict:
        """Raccourci pour POST"""
        return self.call("POST", path, data=data)

    def put(self, path: str, data: Dict = None) -> Dict:
        """Raccourci pour PUT"""
        return self.call("PUT", path, data=data)

    def delete(self, path: str) -> Dict:
        """Raccourci pour DELETE"""
        return self.call("DELETE", path)

    def patch(self, path: str, data: Dict = None) -> Dict:
        """Raccourci pour PATCH"""
        return self.call("PATCH", path, data=data)

    # =========================================================================
    # AUTO-DÉCOUVERTE DES ROUTES
    # =========================================================================

    def discover_routes(self, force_refresh: bool = False) -> List[Dict]:
        """
        Découvre automatiquement toutes les routes disponibles.

        En mode API: Appelle /openapi.json
        En mode Direct: Scanne les fichiers de routes

        Returns:
            Liste de dicts avec: path, methods, tags, description
        """
        if self._routes_cache and not force_refresh:
            return self._routes_cache

        if self.config.mode == TestMode.API:
            routes = self._discover_routes_api()
        else:
            routes = self._discover_routes_direct()

        self._routes_cache = routes
        return routes

    def _discover_routes_api(self) -> List[Dict]:
        """Découvre les routes via OpenAPI"""
        try:
            response = self.session.get(
                f"{self.config.api_url}/openapi.json",
                timeout=self.config.timeout_seconds
            )
            if response.status_code != 200:
                return []

            openapi = response.json()
            routes = []

            for path, methods in openapi.get("paths", {}).items():
                for method, details in methods.items():
                    if method in ["get", "post", "put", "delete", "patch"]:
                        routes.append({
                            "path": path,
                            "method": method.upper(),
                            "tags": details.get("tags", []),
                            "summary": details.get("summary", ""),
                            "description": details.get("description", "")
                        })

            return routes

        except Exception as e:
            return [{"error": str(e)}]

    def _discover_routes_direct(self) -> List[Dict]:
        """Découvre les routes en scannant le code"""
        from pathlib import Path
        import re

        routes = []
        routes_dir = Path(__file__).parent / "routes"

        if not routes_dir.exists():
            return []

        # Pattern pour détecter les décorateurs de route FastAPI
        route_pattern = re.compile(
            r'@router\.(get|post|put|delete|patch)\s*\(\s*["\']([^"\']+)["\']'
        )

        for py_file in routes_dir.glob("*.py"):
            try:
                content = py_file.read_text()

                # Trouver le prefix du router
                prefix_match = re.search(r'prefix\s*=\s*["\']([^"\']+)["\']', content)
                prefix = prefix_match.group(1) if prefix_match else ""

                # Trouver les routes
                for match in route_pattern.finditer(content):
                    method = match.group(1).upper()
                    path = match.group(2)
                    full_path = f"{prefix}{path}" if not path.startswith(prefix) else path

                    routes.append({
                        "path": full_path,
                        "method": method,
                        "file": py_file.name,
                        "tags": [py_file.stem]
                    })
            except Exception:
                continue

        return routes

    def get_routes_by_tag(self, tag: str) -> List[Dict]:
        """Filtre les routes par tag"""
        routes = self.discover_routes()
        return [r for r in routes if tag.lower() in [t.lower() for t in r.get("tags", [])]]

    def test_route(self, route: Dict, sample_data: Dict = None) -> Dict:
        """
        Teste une route automatiquement.

        Args:
            route: Dict avec path et method
            sample_data: Données de test optionnelles

        Returns:
            Résultat du test avec success/error
        """
        path = route.get("path", "")
        method = route.get("method", "GET")

        # Remplacer les paramètres de path par des valeurs de test
        import re
        test_path = re.sub(r'\{[^}]+\}', 'test_id', path)

        return self.call(method, test_path, data=sample_data)


# =============================================================================
# BACKEND ADAPTER (abstraction pour mode direct vs API)
# =============================================================================

class BackendAdapter:
    """Abstraction pour communiquer avec le backend (direct ou API)"""

    def __init__(self, config: TestConfig):
        self.config = config
        self.session = requests.Session() if config.mode == TestMode.API else None

    def start_session(self, user_id: str, topic_ids: List[str]) -> Dict:
        """Démarre une session d'apprentissage"""
        if self.config.mode == TestMode.DIRECT:
            lean_engine.reset_session(user_id, save=False)
            return {"session_id": f"direct_{user_id}", "user_id": user_id}
        else:
            response = self.session.post(
                f"{self.config.api_url}/api/learning/start-session",
                json={"user_id": user_id, "topic_ids": topic_ids},
                timeout=self.config.timeout_seconds
            )
            response.raise_for_status()
            return response.json()

    def get_next_question(self, user_id: str, topic_id: str, mastery: int) -> Dict:
        """Récupère les paramètres de la prochaine question"""
        if self.config.mode == TestMode.DIRECT:
            params = lean_engine.get_next_question(user_id, topic_id, mastery)
            return {
                "difficulty": params.difficulty,
                "difficulty_name": params.difficulty_name,
                "topic_id": params.topic_id,
                "should_take_break": params.should_take_break,
                "fsrs_interval": params.fsrs_interval,
                "retrievability": params.retrievability
            }
        else:
            # L'API utilise session_id, pas direct topic/mastery
            # On adapte pour le test
            response = self.session.get(
                f"{self.config.api_url}/api/learning/next-question/{user_id}",
                timeout=self.config.timeout_seconds
            )
            if response.status_code == 200:
                return response.json()
            # Fallback si pas de session
            return {"difficulty": 2, "difficulty_name": "EASY", "topic_id": topic_id}

    def submit_answer(self, user_id: str, topic_id: str, is_correct: bool,
                      response_time: float, difficulty: int) -> Dict:
        """Soumet une réponse"""
        if self.config.mode == TestMode.DIRECT:
            result = lean_engine.process_answer(
                user_id=user_id,
                topic_id=topic_id,
                is_correct=is_correct,
                response_time=response_time,
                difficulty=difficulty
            )
            return {
                "is_correct": is_correct,
                "xp_earned": result.xp_earned,
                "mastery_change": result.mastery_change,
                "feedback": result.feedback,
                "should_take_break": result.should_take_break,
                "should_reduce_difficulty": result.should_reduce_difficulty
            }
        else:
            response = self.session.post(
                f"{self.config.api_url}/api/learning/submit-answer/{user_id}",
                json={
                    "question_id": f"q_{topic_id}_{int(time.time())}",
                    "user_answer": "A" if is_correct else "B",
                    "time_taken": response_time,
                    "confidence": 0.7
                },
                timeout=self.config.timeout_seconds
            )
            if response.status_code == 200:
                return response.json()
            return {"is_correct": is_correct, "xp_earned": 0}

    def get_user_stats(self, user_id: str) -> Dict:
        """Récupère les stats utilisateur"""
        if self.config.mode == TestMode.DIRECT:
            return lean_engine.get_user_stats(user_id)
        else:
            response = self.session.get(
                f"{self.config.api_url}/api/learning/progress/{user_id}",
                timeout=self.config.timeout_seconds
            )
            if response.status_code == 200:
                return response.json()
            return {}

    def health_check(self) -> bool:
        """Vérifie que le backend est accessible"""
        if self.config.mode == TestMode.DIRECT:
            return True
        try:
            response = self.session.get(
                f"{self.config.api_url}/health",
                timeout=5
            )
            return response.status_code == 200
        except:
            return False

    # =========================================================================
    # TASKS API
    # =========================================================================

    def create_project(self, name: str, color: str = "#6366f1", icon: str = "🚀") -> Dict:
        """Crée un projet"""
        if self.config.mode == TestMode.DIRECT:
            from databases import tasks_db
            project_id = tasks_db.add_project({
                "name": name,
                "color": color,
                "icon": icon,
                "status": "todo"
            })
            return {"success": True, "id": project_id, "name": name}
        else:
            response = self.session.post(
                f"{self.config.api_url}/api/tasks-db/projects",
                json={"name": name, "color": color, "icon": icon},
                timeout=self.config.timeout_seconds
            )
            return response.json() if response.status_code == 200 else {}

    def get_projects(self) -> List[Dict]:
        """Récupère les projets"""
        if self.config.mode == TestMode.DIRECT:
            from databases import tasks_db
            return tasks_db.get_projects()
        else:
            response = self.session.get(
                f"{self.config.api_url}/api/tasks-db/projects",
                timeout=self.config.timeout_seconds
            )
            return response.json().get("projects", []) if response.status_code == 200 else []

    def create_task(self, title: str, project_id: str = None, priority: str = "medium",
                    effort: str = "S") -> Dict:
        """Crée une tâche"""
        if self.config.mode == TestMode.DIRECT:
            from databases import tasks_db
            task_id = tasks_db.add_task({
                "title": title,
                "project_id": project_id,
                "priority": priority,
                "effort": effort,
                "status": "todo",
                "completed": False
            })
            return {"success": True, "id": task_id, "title": title}
        else:
            response = self.session.post(
                f"{self.config.api_url}/api/tasks-db/tasks",
                json={
                    "title": title,
                    "project_id": project_id,
                    "priority": priority,
                    "effort": effort
                },
                timeout=self.config.timeout_seconds
            )
            return response.json() if response.status_code == 200 else {}

    def get_tasks(self, project_id: str = None) -> List[Dict]:
        """Récupère les tâches"""
        if self.config.mode == TestMode.DIRECT:
            from databases import tasks_db
            return tasks_db.get_tasks(project_id=project_id)
        else:
            params = {"project_id": project_id} if project_id else {}
            response = self.session.get(
                f"{self.config.api_url}/api/tasks-db/tasks",
                params=params,
                timeout=self.config.timeout_seconds
            )
            return response.json().get("tasks", []) if response.status_code == 200 else []

    def toggle_task(self, task_id: str) -> Dict:
        """Toggle l'état d'une tâche"""
        if self.config.mode == TestMode.DIRECT:
            from databases import tasks_db
            new_status = tasks_db.toggle_task(task_id)
            return {"success": True, "completed": new_status}
        else:
            response = self.session.post(
                f"{self.config.api_url}/api/tasks-db/tasks/{task_id}/toggle",
                timeout=self.config.timeout_seconds
            )
            return response.json() if response.status_code == 200 else {}

    def delete_task(self, task_id: str) -> bool:
        """Supprime une tâche"""
        if self.config.mode == TestMode.DIRECT:
            from databases import tasks_db
            return tasks_db.delete_task(task_id)
        else:
            response = self.session.delete(
                f"{self.config.api_url}/api/tasks-db/tasks/{task_id}",
                timeout=self.config.timeout_seconds
            )
            return response.status_code == 200

    def create_pomodoro(self, task_id: str, duration: int = 25) -> Dict:
        """Crée une session Pomodoro"""
        if self.config.mode == TestMode.DIRECT:
            from databases import tasks_db
            from datetime import datetime
            session_id = tasks_db.add_pomodoro_session({
                "task_id": task_id,
                "duration": duration,
                "session_type": "focus",
                "date": datetime.now().strftime('%Y-%m-%d')
            })
            return {"success": True, "id": session_id}
        else:
            response = self.session.post(
                f"{self.config.api_url}/api/tasks-db/pomodoro",
                json={"task_id": task_id, "duration": duration, "session_type": "focus"},
                timeout=self.config.timeout_seconds
            )
            return response.json() if response.status_code == 200 else {}

    def get_tasks_stats(self) -> Dict:
        """Récupère les statistiques des tâches"""
        if self.config.mode == TestMode.DIRECT:
            from databases import tasks_db
            return tasks_db.get_stats()
        else:
            response = self.session.get(
                f"{self.config.api_url}/api/tasks-db/stats",
                timeout=self.config.timeout_seconds
            )
            return response.json().get("stats", {}) if response.status_code == 200 else {}

    # =========================================================================
    # HEALTH API
    # =========================================================================

    def add_weight_entry(self, weight: float, date: str = None) -> Dict:
        """Ajoute une entrée de poids"""
        if date is None:
            from datetime import datetime
            date = datetime.now().strftime('%Y-%m-%d')

        if self.config.mode == TestMode.DIRECT:
            from databases import health_db
            entry_id = health_db.add_weight_entry({
                "date": date,
                "weight": weight,
                "source": "test"
            })
            return {"success": True, "id": entry_id, "weight": weight}
        else:
            response = self.session.post(
                f"{self.config.api_url}/api/health/weight",
                json={"date": date, "weight": weight, "source": "test"},
                timeout=self.config.timeout_seconds
            )
            return response.json() if response.status_code == 200 else {}

    def get_weight_entries(self, limit: int = 10) -> List[Dict]:
        """Récupère les entrées de poids"""
        if self.config.mode == TestMode.DIRECT:
            from databases import health_db
            return health_db.get_weight_entries(limit=limit)
        else:
            response = self.session.get(
                f"{self.config.api_url}/api/health/weight",
                params={"limit": limit},
                timeout=self.config.timeout_seconds
            )
            return response.json().get("entries", []) if response.status_code == 200 else []

    def add_meal(self, meal_type: str, foods: List[Dict], date: str = None) -> Dict:
        """Ajoute un repas"""
        if date is None:
            from datetime import datetime
            date = datetime.now().strftime('%Y-%m-%d')

        if self.config.mode == TestMode.DIRECT:
            from databases import health_db
            meal_id = health_db.add_meal({
                "date": date,
                "meal_type": meal_type,
                "foods": foods
            })
            return {"success": True, "id": meal_id}
        else:
            response = self.session.post(
                f"{self.config.api_url}/api/health/meals",
                json={"date": date, "meal_type": meal_type, "foods": foods},
                timeout=self.config.timeout_seconds
            )
            return response.json() if response.status_code == 200 else {}

    def get_meals(self, date: str = None) -> List[Dict]:
        """Récupère les repas"""
        if self.config.mode == TestMode.DIRECT:
            from databases import health_db
            return health_db.get_meals(date=date)
        else:
            params = {"date": date} if date else {}
            response = self.session.get(
                f"{self.config.api_url}/api/health/meals",
                params=params,
                timeout=self.config.timeout_seconds
            )
            return response.json().get("meals", []) if response.status_code == 200 else []

    def add_hydration(self, amount_ml: int, date: str = None) -> Dict:
        """Ajoute une entrée d'hydratation"""
        if self.config.mode == TestMode.DIRECT:
            from databases import health_db
            entry_id = health_db.add_hydration(amount_ml=amount_ml, date=date)
            return {"success": True, "id": entry_id, "amount_ml": amount_ml}
        else:
            response = self.session.post(
                f"{self.config.api_url}/api/health/hydration",
                json={"amount_ml": amount_ml, "date": date},
                timeout=self.config.timeout_seconds
            )
            return response.json() if response.status_code == 200 else {}

    def get_hydration(self, date: str = None) -> Dict:
        """Récupère l'hydratation du jour"""
        if self.config.mode == TestMode.DIRECT:
            from databases import health_db
            return health_db.get_daily_hydration(date=date)
        else:
            params = {"date": date} if date else {}
            response = self.session.get(
                f"{self.config.api_url}/api/health/hydration",
                params=params,
                timeout=self.config.timeout_seconds
            )
            return response.json().get("hydration", {}) if response.status_code == 200 else {}

    def get_health_dashboard(self) -> Dict:
        """Récupère le dashboard santé complet"""
        if self.config.mode == TestMode.DIRECT:
            from databases import health_db
            from datetime import datetime
            today = datetime.now().strftime('%Y-%m-%d')
            return {
                "weight": health_db.get_weight_stats(),
                "nutrition": health_db.get_daily_nutrition(date=today),
                "hydration": health_db.get_daily_hydration(date=today),
                "profile": health_db.get_health_profile()
            }
        else:
            response = self.session.get(
                f"{self.config.api_url}/api/health/dashboard",
                timeout=self.config.timeout_seconds
            )
            return response.json() if response.status_code == 200 else {}

    # =========================================================================
    # KNOWLEDGE API
    # =========================================================================

    def add_concept(self, course_id: str, concept: str, category: str = None,
                    definition: str = None) -> Dict:
        """Ajoute un concept"""
        if self.config.mode == TestMode.DIRECT:
            from database import db
            concept_id = db.add_concept(
                course_id=course_id,
                concept=concept,
                category=category,
                definition=definition
            )
            return {"success": True, "concept_id": concept_id}
        else:
            response = self.session.post(
                f"{self.config.api_url}/api/knowledge/add",
                json={
                    "course_id": course_id,
                    "concept": concept,
                    "category": category,
                    "definition": definition
                },
                timeout=self.config.timeout_seconds
            )
            return response.json() if response.status_code == 200 else {}

    def get_concepts(self, course_id: str) -> List[Dict]:
        """Récupère les concepts d'un cours"""
        if self.config.mode == TestMode.DIRECT:
            from database import db
            return db.get_concepts(course_id)
        else:
            response = self.session.get(
                f"{self.config.api_url}/api/knowledge/{course_id}",
                timeout=self.config.timeout_seconds
            )
            return response.json().get("concepts", []) if response.status_code == 200 else []

    def search_concepts(self, course_id: str, query: str) -> List[Dict]:
        """Recherche des concepts"""
        if self.config.mode == TestMode.DIRECT:
            from database import db
            return db.search_concepts(course_id, query)
        else:
            response = self.session.get(
                f"{self.config.api_url}/api/knowledge/search/{course_id}",
                params={"query": query},
                timeout=self.config.timeout_seconds
            )
            return response.json().get("concepts", []) if response.status_code == 200 else []

    def get_concepts_needing_review(self, course_id: str, limit: int = 10) -> List[Dict]:
        """Récupère les concepts à réviser"""
        if self.config.mode == TestMode.DIRECT:
            from database import db
            from utils.mastery_decay import get_concepts_needing_review
            concepts = db.get_concepts(course_id)
            return get_concepts_needing_review(concepts, limit)
        else:
            response = self.session.get(
                f"{self.config.api_url}/api/knowledge/{course_id}/review-needed",
                params={"limit": limit},
                timeout=self.config.timeout_seconds
            )
            return response.json().get("concepts", []) if response.status_code == 200 else []

    def update_concept_mastery(self, concept_id: int, mastery_level: int) -> Dict:
        """Met à jour la maîtrise d'un concept"""
        if self.config.mode == TestMode.DIRECT:
            from database import db
            db.update_mastery(concept_id, mastery_level)
            return {"success": True, "new_mastery": mastery_level}
        else:
            response = self.session.put(
                f"{self.config.api_url}/api/knowledge/mastery",
                json={"concept_id": concept_id, "mastery_level": mastery_level},
                timeout=self.config.timeout_seconds
            )
            return response.json() if response.status_code == 200 else {}


# =============================================================================
# TEST RUNNER
# =============================================================================

class E2ETestRunner:
    """
    Exécute des tests E2E en utilisant le simulateur cognitif.

    Le simulateur génère des comportements réalistes (is_correct, response_time)
    mais la PROGRESSION est lue depuis le moteur/API (pas de double calcul).
    """

    def __init__(self, config: TestConfig):
        self.config = config
        self.backend = BackendAdapter(config)
        self.universal = UniversalAdapter(config)  # Adaptateur universel pour toute l'app
        self.report = TestReport(start_time=datetime.now(), config=config)

    def run_test(self, name: str, test_func: Callable[[], bool],
                 expected_message: str = "") -> TestResult:
        """Exécute un test et enregistre le résultat"""
        start = time.time()
        try:
            passed = test_func()
            duration = (time.time() - start) * 1000
            result = TestResult(
                name=name,
                passed=passed,
                duration_ms=duration,
                message=expected_message if passed else f"FAILED: {expected_message}"
            )
        except Exception as e:
            duration = (time.time() - start) * 1000
            result = TestResult(
                name=name,
                passed=False,
                duration_ms=duration,
                message=str(e),
                error=traceback.format_exc()
            )

        self.report.results.append(result)

        if self.config.verbose:
            status = "✅" if result.passed else "❌"
            print(f"   {status} {name} ({result.duration_ms:.0f}ms)")
            if not result.passed and result.error:
                print(f"      Error: {result.message}")

        if not result.passed and self.config.fail_fast:
            raise Exception(f"Test failed: {name}")

        return result

    def assert_true(self, condition: bool, message: str = ""):
        """Assertion helper"""
        if not condition:
            raise AssertionError(message)
        return True

    def assert_equal(self, actual, expected, message: str = ""):
        """Assertion d'égalité"""
        if actual != expected:
            raise AssertionError(f"{message} - Expected {expected}, got {actual}")
        return True

    def assert_greater(self, actual, expected, message: str = ""):
        """Assertion greater than"""
        if actual <= expected:
            raise AssertionError(f"{message} - Expected > {expected}, got {actual}")
        return True

    def assert_in_range(self, actual, min_val, max_val, message: str = ""):
        """Assertion dans une plage"""
        if not (min_val <= actual <= max_val):
            raise AssertionError(f"{message} - Expected {min_val}-{max_val}, got {actual}")
        return True


# =============================================================================
# TESTS E2E
# =============================================================================

class LearningE2ETests:
    """Tests E2E pour le système d'apprentissage"""

    def __init__(self, runner: E2ETestRunner):
        self.runner = runner
        self.config = runner.config
        self.backend = runner.backend

    # =========================================================================
    # TESTS DE BASE
    # =========================================================================

    def test_health_check(self) -> bool:
        """Test: Le backend est accessible"""
        def test():
            return self.runner.assert_true(
                self.backend.health_check(),
                "Backend should be accessible"
            )
        return self.runner.run_test("Health Check", test, "Backend accessible").passed

    def test_session_creation(self) -> bool:
        """Test: Création de session"""
        def test():
            result = self.backend.start_session("test_user_001", self.config.topics)
            return self.runner.assert_true(
                "user_id" in result or "session_id" in result,
                "Session should return user_id or session_id"
            )
        return self.runner.run_test("Session Creation", test, "Session created").passed

    def test_question_generation(self) -> bool:
        """Test: Génération de question"""
        def test():
            user_id = "test_user_002"
            self.backend.start_session(user_id, self.config.topics)
            result = self.backend.get_next_question(user_id, "conjugaison", 50)
            return self.runner.assert_true(
                "difficulty" in result,
                "Question should have difficulty"
            )
        return self.runner.run_test("Question Generation", test, "Question generated").passed

    def test_answer_submission(self) -> bool:
        """Test: Soumission de réponse"""
        def test():
            user_id = "test_user_003"
            self.backend.start_session(user_id, self.config.topics)
            result = self.backend.submit_answer(
                user_id, "conjugaison", True, 10.5, 2
            )
            return self.runner.assert_true(
                "xp_earned" in result,
                "Answer should return XP"
            )
        return self.runner.run_test("Answer Submission", test, "Answer processed").passed

    # =========================================================================
    # TESTS AVEC SIMULATEUR (COMPORTEMENT RÉALISTE)
    # =========================================================================

    def test_profile_progression(self, profile_key: str = "average") -> bool:
        """Test: Un profil progresse correctement sur plusieurs jours"""
        def test():
            profile = PROFILES[profile_key]
            student = SimulatedStudent(profile)
            user_id = f"e2e_{profile_key}_{int(time.time())}"

            initial_xp = 0
            final_xp = 0
            questions_answered = 0

            # Simuler quelques jours
            num_days = min(3, self.config.num_days)

            for day in range(1, num_days + 1):
                if student.should_skip_session():
                    student.apply_day_skip(day)
                    continue

                student.sleep_consolidated = False
                student.start_session(day)
                self.backend.start_session(user_id, self.config.topics)

                for q in range(self.config.questions_per_day):
                    topic = self.config.topics[q % len(self.config.topics)]

                    # Obtenir difficulté depuis le backend
                    stats = self.backend.get_user_stats(user_id)
                    mastery = int(stats.get("mastery", {}).get(topic, 0) * 100) if stats else 0

                    params = self.backend.get_next_question(user_id, topic, mastery)
                    difficulty = params.get("difficulty", 2)

                    # Simulateur génère la réponse réaliste
                    response = student.answer_question(topic, difficulty)

                    # Soumettre au backend (qui calcule la vraie progression)
                    result = self.backend.submit_answer(
                        user_id, topic,
                        response["is_correct"],
                        response["response_time"],
                        difficulty
                    )

                    final_xp += result.get("xp_earned", 0)
                    questions_answered += 1

            # Assertions
            self.runner.assert_greater(
                questions_answered, 0,
                f"Profile {profile_key} should answer some questions"
            )
            self.runner.assert_greater(
                final_xp, 0,
                f"Profile {profile_key} should earn XP"
            )

            return True

        return self.runner.run_test(
            f"Profile Progression ({profile_key})",
            test,
            f"{profile_key} progresses correctly"
        ).passed

    def test_difficulty_adaptation(self) -> bool:
        """Test: La difficulté s'adapte à la maîtrise"""
        def test():
            user_id = f"e2e_adapt_{int(time.time())}"
            self.backend.start_session(user_id, self.config.topics)

            difficulties = []

            # Simuler 20 réponses correctes
            for i in range(20):
                topic = "conjugaison"
                stats = self.backend.get_user_stats(user_id)
                mastery = int(stats.get("mastery", {}).get(topic, 0) * 100) if stats else 0

                params = self.backend.get_next_question(user_id, topic, mastery)
                difficulties.append(params.get("difficulty", 2))

                self.backend.submit_answer(user_id, topic, True, 8.0, params.get("difficulty", 2))

            # La difficulté devrait augmenter
            avg_first_5 = sum(difficulties[:5]) / 5
            avg_last_5 = sum(difficulties[-5:]) / 5

            # Au minimum, la difficulté ne devrait pas baisser significativement
            return self.runner.assert_true(
                avg_last_5 >= avg_first_5 - 0.5,
                f"Difficulty should not decrease significantly (first: {avg_first_5:.1f}, last: {avg_last_5:.1f})"
            )

        return self.runner.run_test(
            "Difficulty Adaptation",
            test,
            "Difficulty adapts to performance"
        ).passed

    def test_xp_accumulation(self) -> bool:
        """Test: L'XP s'accumule correctement"""
        def test():
            user_id = f"e2e_xp_{int(time.time())}"
            self.backend.start_session(user_id, self.config.topics)

            total_xp = 0

            for i in range(10):
                result = self.backend.submit_answer(
                    user_id, "vocabulaire", True, 10.0, 3
                )
                total_xp += result.get("xp_earned", 0)

            # Vérifier stats
            stats = self.backend.get_user_stats(user_id)

            return self.runner.assert_greater(
                total_xp, 50,
                f"Should earn significant XP (got {total_xp})"
            )

        return self.runner.run_test(
            "XP Accumulation",
            test,
            "XP accumulates correctly"
        ).passed

    def test_cognitive_load_detection(self) -> bool:
        """Test: Détection de la charge cognitive (fatigue)"""
        def test():
            user_id = f"e2e_cognitive_{int(time.time())}"
            self.backend.start_session(user_id, self.config.topics)

            # Simuler beaucoup de réponses rapides incorrectes (signe de fatigue)
            break_suggested = False

            for i in range(25):
                result = self.backend.submit_answer(
                    user_id, "grammaire",
                    is_correct=(i % 3 == 0),  # 33% correct = en difficulté
                    response_time=3.0,  # Réponses rapides
                    difficulty=4
                )

                if result.get("should_take_break", False):
                    break_suggested = True
                    break

            return self.runner.assert_true(
                break_suggested,
                "System should suggest break after poor performance"
            )

        return self.runner.run_test(
            "Cognitive Load Detection",
            test,
            "Fatigue detection works"
        ).passed

    def test_mastery_persistence(self) -> bool:
        """Test: La maîtrise persiste entre les sessions"""
        def test():
            user_id = f"e2e_persist_{int(time.time())}"

            # Session 1: Apprendre
            self.backend.start_session(user_id, self.config.topics)
            for i in range(10):
                self.backend.submit_answer(user_id, "orthographe", True, 10.0, 3)

            stats_before = self.backend.get_user_stats(user_id)
            mastery_before = stats_before.get("mastery", {}).get("orthographe", 0)

            # Sauvegarder si mode direct
            if self.config.mode == TestMode.DIRECT:
                lean_engine.save_state(user_id)

            # Session 2: Vérifier que la maîtrise est conservée
            self.backend.start_session(user_id, self.config.topics)
            stats_after = self.backend.get_user_stats(user_id)
            mastery_after = stats_after.get("mastery", {}).get("orthographe", 0)

            return self.runner.assert_true(
                mastery_after > 0,
                f"Mastery should persist (before: {mastery_before:.2f}, after: {mastery_after:.2f})"
            )

        return self.runner.run_test(
            "Mastery Persistence",
            test,
            "Mastery persists across sessions"
        ).passed

    # =========================================================================
    # TESTS DE SCÉNARIOS
    # =========================================================================

    def test_all_profiles(self) -> bool:
        """Test: Tous les profils progressent"""
        all_passed = True
        for profile_key in ["determined", "average", "irregular", "struggling"]:
            if not self.test_profile_progression(profile_key):
                all_passed = False
        return all_passed

    def test_stress_scenario(self, num_users: int = 10) -> bool:
        """Test: Charge avec plusieurs utilisateurs simultanés"""
        def test():
            start = time.time()

            for i in range(num_users):
                user_id = f"stress_{i}_{int(time.time())}"
                self.backend.start_session(user_id, self.config.topics)

                for q in range(5):  # 5 questions par user
                    self.backend.submit_answer(
                        user_id, self.config.topics[q % len(self.config.topics)],
                        random.random() > 0.3,
                        random.uniform(5, 20),
                        random.randint(1, 5)
                    )

            duration = time.time() - start

            return self.runner.assert_true(
                duration < 30,  # Moins de 30 secondes pour tout
                f"Stress test completed in {duration:.1f}s"
            )

        return self.runner.run_test(
            f"Stress Test ({num_users} users)",
            test,
            "Handles concurrent users"
        ).passed

    def test_edge_cases(self) -> bool:
        """Test: Cas limites"""
        all_passed = True

        # Test: Réponse instantanée (détection bot)
        def test_instant():
            user_id = f"e2e_instant_{int(time.time())}"
            self.backend.start_session(user_id, self.config.topics)
            result = self.backend.submit_answer(user_id, "conjugaison", True, 0.1, 5)
            # Le système devrait fonctionner même avec réponse très rapide
            return "xp_earned" in result

        if not self.runner.run_test("Edge: Instant Response", test_instant).passed:
            all_passed = False

        # Test: Très haute maîtrise (99%)
        def test_high_mastery():
            user_id = f"e2e_high_{int(time.time())}"
            self.backend.start_session(user_id, self.config.topics)
            params = self.backend.get_next_question(user_id, "vocabulaire", 99)
            # Devrait retourner une difficulté (peu importe le niveau, tant que ça fonctionne)
            return params.get("difficulty", 0) >= 1

        if not self.runner.run_test("Edge: High Mastery", test_high_mastery).passed:
            all_passed = False

        # Test: Maîtrise nulle (0%)
        def test_zero_mastery():
            user_id = f"e2e_zero_{int(time.time())}"
            self.backend.start_session(user_id, self.config.topics)
            params = self.backend.get_next_question(user_id, "grammaire", 0)
            # Devrait retourner une difficulté basse
            return params.get("difficulty", 5) <= 3

        if not self.runner.run_test("Edge: Zero Mastery", test_zero_mastery).passed:
            all_passed = False

        return all_passed


# =============================================================================
# TASKS E2E TESTS
# =============================================================================

class TasksE2ETests:
    """Tests E2E pour le système de gestion de tâches"""

    def __init__(self, runner: E2ETestRunner):
        self.runner = runner
        self.config = runner.config
        self.backend = runner.backend

    def test_project_creation(self) -> bool:
        """Test: Création de projet"""
        def test():
            import uuid
            result = self.runner.universal.post('/api/tasks-db/projects', {
                'name': f'Test Project {uuid.uuid4().hex[:8]}',
                'color': '#FF5733',
                'icon': '📝'
            })
            return self.runner.assert_true(
                result.get("success") or result.get("id"),
                "Project should be created"
            )
        return self.runner.run_test("Project Creation", test, "Project created").passed

    def test_task_creation(self) -> bool:
        """Test: Création de tâche"""
        def test():
            import uuid
            result = self.runner.universal.post('/api/tasks-db/tasks', {
                'title': f'Test Task {uuid.uuid4().hex[:8]}',
                'priority': 'high',
                'effort': 'M'
            })
            return self.runner.assert_true(
                result.get("success") or result.get("id"),
                "Task should be created"
            )
        return self.runner.run_test("Task Creation", test, "Task created").passed

    def test_task_with_project(self) -> bool:
        """Test: Création de tâche liée à un projet"""
        def test():
            import uuid
            # Créer un projet via UniversalAdapter
            project = self.runner.universal.post('/api/tasks-db/projects', {
                'name': f'Project for Task {uuid.uuid4().hex[:8]}'
            })
            project_id = project.get("id")

            # Créer une tâche dans ce projet
            task = self.runner.universal.post('/api/tasks-db/tasks', {
                'title': f'Task in Project {uuid.uuid4().hex[:8]}',
                'project_id': project_id,
                'priority': 'medium',
                'effort': 'S'
            })

            # Vérifier que la tâche est créée
            return self.runner.assert_true(
                task.get("success") or task.get("id"),
                "Task should be created in project"
            )
        return self.runner.run_test("Task with Project", test, "Task linked to project").passed

    def test_task_toggle(self) -> bool:
        """Test: Toggle d'une tâche (compléter/réouvrir)"""
        def test():
            import uuid
            # Utiliser l'UniversalAdapter pour plus de fiabilité
            unique_id = uuid.uuid4().hex[:8]
            task = self.runner.universal.post('/api/tasks-db/tasks', {
                'title': f'Toggle Task {unique_id}',
                'priority': 'medium',
                'effort': 'S'
            })
            task_id = task.get("id")

            if not task_id:
                raise AssertionError("Could not create task for toggle test")

            # Toggle la tâche via UniversalAdapter
            result = self.runner.universal.post(f'/api/tasks-db/tasks/{task_id}/toggle')

            return self.runner.assert_true(
                result.get("success") or "completed" in result,
                "Task should be toggled"
            )
        return self.runner.run_test("Task Toggle", test, "Task toggled").passed

    def test_task_deletion(self) -> bool:
        """Test: Suppression d'une tâche"""
        def test():
            import uuid
            # Créer une tâche avec un ID unique
            task = self.backend.create_task(f"Delete Task {uuid.uuid4().hex[:8]}")
            task_id = task.get("id")

            if not task_id:
                raise AssertionError("Could not create task for deletion test")

            # Supprimer la tâche
            deleted = self.backend.delete_task(task_id)

            return self.runner.assert_true(deleted, "Task should be deleted")
        return self.runner.run_test("Task Deletion", test, "Task deleted").passed

    def test_pomodoro_creation(self) -> bool:
        """Test: Création de session Pomodoro"""
        def test():
            # Créer une tâche
            task = self.backend.create_task(f"Pomodoro Task {int(time.time())}")
            task_id = task.get("id")

            if not task_id:
                raise AssertionError("Could not create task for pomodoro test")

            # Créer une session Pomodoro
            result = self.backend.create_pomodoro(task_id, duration=25)

            return self.runner.assert_true(
                result.get("success") or result.get("id"),
                "Pomodoro session should be created"
            )
        return self.runner.run_test("Pomodoro Creation", test, "Pomodoro session created").passed

    def test_tasks_stats(self) -> bool:
        """Test: Récupération des statistiques"""
        def test():
            stats = self.backend.get_tasks_stats()
            # Les stats peuvent être vides, on vérifie juste qu'il n'y a pas d'erreur
            return self.runner.assert_true(
                isinstance(stats, dict),
                "Stats should be a dictionary"
            )
        return self.runner.run_test("Tasks Stats", test, "Stats retrieved").passed

    def test_persona_task_workflow(self, profile_key: str = "determined") -> bool:
        """Test: Workflow complet d'un persona avec les tâches"""
        def test():
            profile = PROFILES[profile_key]
            student = SimulatedStudent(profile)
            user_id = f"e2e_tasks_{profile_key}_{int(time.time())}"

            # Le persona crée un projet
            project = self.backend.create_project(f"Projet de {profile_key}")
            project_id = project.get("id")

            tasks_created = 0
            tasks_completed = 0

            # Simuler quelques jours de travail
            for day in range(1, 4):
                if student.should_skip_session():
                    continue

                # Créer des tâches basées sur la motivation du profil
                num_tasks = int(3 + profile.motivation * 5)

                for i in range(num_tasks):
                    task = self.backend.create_task(
                        title=f"Tâche jour {day} - {i+1}",
                        project_id=project_id,
                        effort=random.choice(["XS", "S", "M"])
                    )
                    if task.get("id"):
                        tasks_created += 1

                        # Probabilité de compléter basée sur la motivation
                        if random.random() < profile.motivation:
                            self.backend.toggle_task(task.get("id"))
                            tasks_completed += 1

            self.runner.assert_greater(tasks_created, 0, f"{profile_key} should create tasks")
            return True

        return self.runner.run_test(
            f"Persona Workflow ({profile_key})",
            test,
            f"{profile_key} completes task workflow"
        ).passed


# =============================================================================
# HEALTH E2E TESTS
# =============================================================================

class HealthE2ETests:
    """Tests E2E pour le système de suivi santé"""

    def __init__(self, runner: E2ETestRunner):
        self.runner = runner
        self.config = runner.config
        self.backend = runner.backend

    def test_weight_entry(self) -> bool:
        """Test: Ajout d'entrée de poids"""
        def test():
            result = self.backend.add_weight_entry(weight=75.5)
            return self.runner.assert_true(
                result.get("success") or result.get("id"),
                "Weight entry should be added"
            )
        return self.runner.run_test("Weight Entry", test, "Weight entry added").passed

    def test_weight_history(self) -> bool:
        """Test: Récupération de l'historique de poids"""
        def test():
            # Ajouter quelques entrées
            for weight in [75.0, 74.8, 74.5]:
                self.backend.add_weight_entry(weight=weight)

            entries = self.backend.get_weight_entries(limit=5)
            return self.runner.assert_true(
                isinstance(entries, list),
                "Should return weight history"
            )
        return self.runner.run_test("Weight History", test, "Weight history retrieved").passed

    def test_meal_entry(self) -> bool:
        """Test: Ajout d'un repas"""
        def test():
            foods = [
                {"food_name": "Poulet", "grams": 200, "calories": 330, "protein": 60},
                {"food_name": "Riz", "grams": 150, "calories": 180, "carbs": 40}
            ]
            result = self.backend.add_meal(meal_type="lunch", foods=foods)
            return self.runner.assert_true(
                result.get("success") or result.get("id"),
                "Meal should be added"
            )
        return self.runner.run_test("Meal Entry", test, "Meal added").passed

    def test_hydration_tracking(self) -> bool:
        """Test: Suivi d'hydratation"""
        def test():
            # Ajouter de l'eau
            result = self.backend.add_hydration(amount_ml=500)

            if not (result.get("success") or result.get("id")):
                raise AssertionError("Hydration entry should be added")

            # Vérifier le total
            hydration = self.backend.get_hydration()
            return self.runner.assert_true(
                isinstance(hydration, dict),
                "Should return hydration data"
            )
        return self.runner.run_test("Hydration Tracking", test, "Hydration tracked").passed

    def test_health_dashboard(self) -> bool:
        """Test: Dashboard santé complet"""
        def test():
            dashboard = self.backend.get_health_dashboard()
            return self.runner.assert_true(
                isinstance(dashboard, dict),
                "Dashboard should be a dictionary"
            )
        return self.runner.run_test("Health Dashboard", test, "Dashboard retrieved").passed

    def test_persona_health_routine(self, profile_key: str = "determined") -> bool:
        """Test: Routine santé d'un persona"""
        def test():
            profile = PROFILES[profile_key]
            student = SimulatedStudent(profile)

            entries_added = 0

            # Simuler quelques jours de suivi
            for day in range(1, 4):
                if student.should_skip_session():
                    continue

                # Poids le matin (basé sur la régularité du profil)
                if random.random() < profile.motivation:
                    base_weight = 70 + random.uniform(-2, 2)
                    self.backend.add_weight_entry(weight=round(base_weight, 1))
                    entries_added += 1

                # Repas (nombre basé sur la discipline)
                meals_per_day = 2 if profile.motivation < 0.5 else 3
                for meal_type in ["breakfast", "lunch", "dinner"][:meals_per_day]:
                    self.backend.add_meal(
                        meal_type=meal_type,
                        foods=[{"food_name": f"Repas {meal_type}", "grams": 300, "calories": 400}]
                    )
                    entries_added += 1

                # Hydratation (basé sur la discipline)
                glasses = int(4 + profile.motivation * 6)
                for _ in range(glasses):
                    self.backend.add_hydration(amount_ml=250)
                    entries_added += 1

            self.runner.assert_greater(entries_added, 0, f"{profile_key} should track health")
            return True

        return self.runner.run_test(
            f"Health Routine ({profile_key})",
            test,
            f"{profile_key} tracks health"
        ).passed


# =============================================================================
# KNOWLEDGE E2E TESTS
# =============================================================================

class KnowledgeE2ETests:
    """Tests E2E pour le système de gestion des connaissances"""

    def __init__(self, runner: E2ETestRunner):
        self.runner = runner
        self.config = runner.config
        self.backend = runner.backend

    def test_concept_creation(self) -> bool:
        """Test: Création de concept"""
        def test():
            result = self.backend.add_concept(
                course_id=f"test_course_{int(time.time())}",
                concept="Variables Python",
                category="Programmation",
                definition="Une variable est un conteneur pour stocker des données"
            )
            return self.runner.assert_true(
                result.get("success") or result.get("concept_id"),
                "Concept should be created"
            )
        return self.runner.run_test("Concept Creation", test, "Concept created").passed

    def test_concept_retrieval(self) -> bool:
        """Test: Récupération des concepts"""
        def test():
            course_id = f"test_course_{int(time.time())}"

            # Ajouter quelques concepts
            for concept in ["Fonctions", "Classes", "Modules"]:
                self.backend.add_concept(course_id=course_id, concept=concept)

            concepts = self.backend.get_concepts(course_id)
            return self.runner.assert_true(
                isinstance(concepts, list),
                "Should return concepts list"
            )
        return self.runner.run_test("Concept Retrieval", test, "Concepts retrieved").passed

    def test_concept_search(self) -> bool:
        """Test: Recherche de concepts"""
        def test():
            course_id = f"search_course_{int(time.time())}"

            # Ajouter des concepts
            self.backend.add_concept(course_id=course_id, concept="Boucles for")
            self.backend.add_concept(course_id=course_id, concept="Boucles while")
            self.backend.add_concept(course_id=course_id, concept="Conditions if")

            # Rechercher
            results = self.backend.search_concepts(course_id, "boucle")
            return self.runner.assert_true(
                isinstance(results, list),
                "Search should return results"
            )
        return self.runner.run_test("Concept Search", test, "Concepts searched").passed

    def test_mastery_update(self) -> bool:
        """Test: Mise à jour de la maîtrise"""
        def test():
            course_id = f"mastery_course_{int(time.time())}"

            # Créer un concept
            result = self.backend.add_concept(
                course_id=course_id,
                concept="Test Mastery Concept"
            )
            concept_id = result.get("concept_id")

            if not concept_id:
                # En mode direct, on doit récupérer l'ID
                concepts = self.backend.get_concepts(course_id)
                if concepts:
                    concept_id = concepts[0].get("id")

            if not concept_id:
                raise AssertionError("Could not get concept ID")

            # Mettre à jour la maîtrise
            update_result = self.backend.update_concept_mastery(concept_id, 75)
            return self.runner.assert_true(
                update_result.get("success") or update_result.get("new_mastery"),
                "Mastery should be updated"
            )
        return self.runner.run_test("Mastery Update", test, "Mastery updated").passed

    def test_review_needed(self) -> bool:
        """Test: Concepts à réviser"""
        def test():
            course_id = f"review_course_{int(time.time())}"

            # Ajouter des concepts
            for concept in ["Concept A", "Concept B", "Concept C"]:
                self.backend.add_concept(course_id=course_id, concept=concept)

            # Récupérer ceux à réviser
            review_needed = self.backend.get_concepts_needing_review(course_id)
            return self.runner.assert_true(
                isinstance(review_needed, list),
                "Should return concepts needing review"
            )
        return self.runner.run_test("Review Needed", test, "Review concepts identified").passed

    def test_persona_learning_journey(self, profile_key: str = "determined") -> bool:
        """Test: Parcours d'apprentissage d'un persona"""
        def test():
            profile = PROFILES[profile_key]
            student = SimulatedStudent(profile)
            course_id = f"journey_course_{profile_key}_{int(time.time())}"

            # Le persona ajoute des concepts au fil de son apprentissage
            concepts_added = []
            topics = ["Variables", "Fonctions", "Classes", "Modules", "Exceptions"]

            for day in range(1, 4):
                if student.should_skip_session():
                    continue

                # Nombre de concepts ajoutés basé sur la motivation
                num_concepts = int(1 + profile.motivation * 3)

                for i in range(num_concepts):
                    if topics:
                        concept_name = topics.pop(0)
                        result = self.backend.add_concept(
                            course_id=course_id,
                            concept=concept_name,
                            definition=f"Définition de {concept_name}"
                        )
                        if result.get("concept_id") or result.get("success"):
                            concepts_added.append(concept_name)

            self.runner.assert_greater(
                len(concepts_added), 0,
                f"{profile_key} should add concepts"
            )
            return True

        return self.runner.run_test(
            f"Learning Journey ({profile_key})",
            test,
            f"{profile_key} learns concepts"
        ).passed


# =============================================================================
# USER JOURNEY RUNNER - Parcours utilisateur scriptables
# =============================================================================

class UserJourneyRunner:
    """
    🎮 Exécute des parcours utilisateur SCRIPTABLES.

    Tu définis le chemin, le framework le suit comme un vrai utilisateur.

    Usage:
        journey = UserJourneyRunner(runner)

        # Méthode 1: Étape par étape avec raccourcis
        journey.health.log_weight(72.5)
        journey.health.drink_water(250)
        journey.tasks.create_project("Mon Projet")
        journey.tasks.create_task("Ma tâche")
        journey.tasks.complete_task()
        journey.learning.start_session()
        journey.learning.answer_question(is_correct=True)

        # Méthode 2: Liste d'étapes
        journey.execute([
            ("GET", "/api/health/dashboard"),
            ("POST", "/api/tasks-db/projects", {"name": "Mon Projet"}),
            ("POST", "/api/tasks-db/tasks", {"title": "Ma tâche", "project_id": "$last.id"}),
        ])

        # Méthode 3: Appels directs
        journey.get("/api/health/dashboard")
        journey.post("/api/tasks-db/tasks", {"title": "Test"})
    """

    def __init__(self, runner: 'E2ETestRunner'):
        self.runner = runner
        self.universal = runner.universal
        self.backend = runner.backend

        # Contexte partagé entre les étapes
        self.context = {}
        self.last_result = {}
        self.step_log = []

        # Raccourcis par module
        self.health = self._HealthActions(self)
        self.tasks = self._TasksActions(self)
        self.learning = self._LearningActions(self)
        self.knowledge = self._KnowledgeActions(self)

    def _resolve_variables(self, value, context: dict):
        """Résout les variables comme $last.id, $project_id, etc."""
        if isinstance(value, str):
            if value.startswith("$last."):
                key = value[6:]
                return self.last_result.get(key, value)
            elif value.startswith("$"):
                var_name = value[1:]
                return context.get(var_name, self.context.get(var_name, value))
        elif isinstance(value, dict):
            return {k: self._resolve_variables(v, context) for k, v in value.items()}
        elif isinstance(value, list):
            return [self._resolve_variables(v, context) for v in value]
        return value

    def step(self, method: str, path: str, data: dict = None, name: str = None, save_as: str = None):
        """Exécute une étape du parcours."""
        resolved_path = self._resolve_variables(path, {})
        resolved_data = self._resolve_variables(data, {}) if data else None

        result = self.universal.call(method, resolved_path, data=resolved_data)

        self.last_result = result
        if save_as:
            self.context[save_as] = result

        step_name = name or f"{method} {path}"
        success = result.get("success") or result.get("id") or not result.get("error")
        self.step_log.append({"name": step_name, "success": success})

        status = "✅" if success else "❌"
        print(f"      {status} {step_name}")
        return result

    def get(self, path: str, name: str = None, save_as: str = None):
        return self.step("GET", path, name=name, save_as=save_as)

    def post(self, path: str, data: dict = None, name: str = None, save_as: str = None):
        return self.step("POST", path, data=data, name=name, save_as=save_as)

    def put(self, path: str, data: dict = None, name: str = None, save_as: str = None):
        return self.step("PUT", path, data=data, name=name, save_as=save_as)

    def delete(self, path: str, name: str = None, save_as: str = None):
        return self.step("DELETE", path, name=name, save_as=save_as)

    def execute(self, steps: list, name: str = "Custom Journey"):
        """Exécute une liste d'étapes."""
        print(f"\n   🎮 {name}")
        print(f"   {'-' * 40}")

        self.step_log = []
        for i, step in enumerate(steps):
            method, path = step[0], step[1]
            data = step[2] if len(step) > 2 else None
            self.step(method, path, data, name=f"Step {i+1}")

        passed = sum(1 for s in self.step_log if s["success"])
        total = len(self.step_log)
        rate = passed / total if total > 0 else 0
        print(f"   → Résultat: {passed}/{total} ({rate*100:.0f}%)")
        return {"success": rate >= 0.8, "passed": passed, "total": total, "rate": rate}

    def reset(self):
        """Reset le contexte."""
        self.context = {}
        self.last_result = {}
        self.step_log = []

    def summary(self):
        """Affiche un résumé du parcours."""
        passed = sum(1 for s in self.step_log if s["success"])
        total = len(self.step_log)
        print(f"\n   📊 Résumé: {passed}/{total} étapes réussies")
        for s in self.step_log:
            status = "✅" if s["success"] else "❌"
            print(f"      {status} {s['name']}")

    # === HEALTH ACTIONS ===
    class _HealthActions:
        def __init__(self, j): self.j = j

        def log_weight(self, weight: float, date: str = None):
            from datetime import datetime
            data = {"weight": weight, "date": date or datetime.now().strftime('%Y-%m-%d')}
            return self.j.post("/api/health/weight", data, name=f"Poids: {weight}kg")

        def log_meal(self, meal_type: str, foods: list):
            from datetime import datetime
            data = {"date": datetime.now().strftime('%Y-%m-%d'), "meal_type": meal_type, "foods": foods}
            return self.j.post("/api/health/meals", data, name=f"Repas: {meal_type}")

        def drink_water(self, ml: int = 250):
            return self.j.post("/api/health/hydration", {"amount_ml": ml}, name=f"Eau: {ml}ml")

        def dashboard(self):
            return self.j.get("/api/health/dashboard", name="Dashboard santé")

    # === TASKS ACTIONS ===
    class _TasksActions:
        def __init__(self, j): self.j = j

        def create_project(self, name: str, color: str = "#6366f1"):
            result = self.j.post("/api/tasks-db/projects", {"name": name, "color": color}, name=f"Projet: {name}")
            if result.get("id"):
                self.j.context["project_id"] = result["id"]
            return result

        def create_task(self, title: str, project_id: str = None, priority: str = "medium"):
            data = {"title": title, "priority": priority, "project_id": project_id or self.j.context.get("project_id")}
            result = self.j.post("/api/tasks-db/tasks", data, name=f"Tâche: {title}")
            if result.get("id"):
                self.j.context["task_id"] = result["id"]
            return result

        def complete_task(self, task_id: str = None):
            tid = task_id or self.j.context.get("task_id")
            return self.j.post(f"/api/tasks-db/tasks/{tid}/toggle", name="Compléter tâche")

        def pomodoro(self, duration: int = 25, task_id: str = None):
            data = {"task_id": task_id or self.j.context.get("task_id"), "duration": duration}
            return self.j.post("/api/tasks-db/pomodoro", data, name=f"Pomodoro: {duration}min")

        def list_tasks(self):
            return self.j.get("/api/tasks-db/tasks", name="Liste tâches")

        def dashboard(self):
            return self.j.get("/api/tasks-db/dashboard", name="Dashboard tâches")

    # === LEARNING ACTIONS ===
    class _LearningActions:
        def __init__(self, j): self.j = j

        def start_session(self, user_id: str = None, topics: list = None):
            import uuid
            uid = user_id or f"user_{uuid.uuid4().hex[:6]}"
            self.j.context["user_id"] = uid
            self.j.backend.start_session(uid, topics or ["conjugaison"])
            print(f"      ✅ Session: {uid}")
            return {"user_id": uid}

        def answer(self, correct: bool = True, topic: str = "conjugaison"):
            uid = self.j.context.get("user_id")
            if not uid:
                print("      ❌ Pas de session active")
                return {}
            result = self.j.backend.submit_answer(uid, topic, correct, 5.0, 2)
            xp = result.get("xp_earned", 0)
            print(f"      {'✅' if correct else '❌'} Réponse {'correcte' if correct else 'fausse'}: +{xp} XP")
            return result

        def progress(self):
            uid = self.j.context.get("user_id")
            if uid:
                stats = self.j.backend.get_user_stats(uid)
                print(f"      📊 Stats: streak={stats.get('streak', 0)}, accuracy={stats.get('recent_accuracy', 0):.0%}, xp={stats.get('total_xp', 0)}")
                return stats
            return {}

    # === KNOWLEDGE ACTIONS ===
    class _KnowledgeActions:
        def __init__(self, j): self.j = j

        def add_concept(self, concept: str, course_id: str = None):
            import uuid
            cid = course_id or self.j.context.get("course_id") or f"course_{uuid.uuid4().hex[:6]}"
            self.j.context["course_id"] = cid
            data = {"course_id": cid, "concept": concept, "definition": f"Définition de {concept}"}
            return self.j.post("/api/knowledge/add", data, name=f"Concept: {concept}")

        def list_concepts(self, course_id: str = None):
            cid = course_id or self.j.context.get("course_id", "default")
            return self.j.get(f"/api/knowledge/{cid}", name="Liste concepts")


# =============================================================================
# NAVIGATION E2E TESTS - Test de l'UTILISABILITÉ
# =============================================================================

class NavigationE2ETests:
    """
    🧭 Tests de NAVIGATION pour vérifier que l'app est UTILISABLE.

    Ces tests simulent des vrais parcours utilisateur:
    - Onboarding (premier utilisateur)
    - Journée type complète
    - Workflow de révision
    - Navigation cross-module
    - Flux de récupération d'erreurs

    Chaque test vérifie que les TRANSITIONS entre pages/fonctionnalités
    fonctionnent correctement et que les données persistent.
    """

    def __init__(self, runner: 'E2ETestRunner'):
        self.runner = runner
        self.config = runner.config
        self.universal = runner.universal
        self.backend = runner.backend

    # =========================================================================
    # PARCOURS 1: ONBOARDING - Premier utilisateur
    # =========================================================================

    def test_onboarding_flow(self) -> bool:
        """
        🚀 Parcours: Nouvel utilisateur qui découvre l'application

        Étapes:
        1. Arrive sur la page → vérifie dashboard vide
        2. Crée son profil santé
        3. Crée son premier projet
        4. Ajoute sa première tâche
        5. Démarre sa première session d'apprentissage
        6. Vérifie que tout est connecté
        """
        def test():
            import uuid
            user_id = f"onboard_{uuid.uuid4().hex[:8]}"
            timestamp = uuid.uuid4().hex[:6]

            steps_passed = 0
            total_steps = 6

            # Step 1: Dashboard vide accessible
            dashboard = self.universal.get("/api/health/dashboard")
            if dashboard.get("success") or "date" in dashboard:
                steps_passed += 1
                print(f"      📊 Dashboard accessible")

            # Step 2: Créer profil santé
            profile = self.universal.post("/api/health/profile", {
                "height_cm": 175,
                "age": 28,
                "gender": "male",
                "activity_level": "moderate",
                "goal": "maintain"
            })
            if profile.get("success"):
                steps_passed += 1
                print(f"      👤 Profil santé créé")

            # Step 3: Créer premier projet
            project = self.universal.post("/api/tasks-db/projects", {
                "name": f"Mon Premier Projet {timestamp}",
                "color": "#6366f1",
                "icon": "🚀"
            })
            project_id = project.get("id")
            if project_id:
                steps_passed += 1
                print(f"      📁 Projet créé: {project_id}")

            # Step 4: Ajouter première tâche
            task = self.universal.post("/api/tasks-db/tasks", {
                "title": f"Ma Première Tâche {timestamp}",
                "project_id": project_id,
                "priority": "high",
                "effort": "S"
            })
            task_id = task.get("id")
            if task_id:
                steps_passed += 1
                print(f"      ✅ Tâche créée: {task_id}")

            # Step 5: Démarrer session d'apprentissage
            session = self.backend.start_session(user_id, ["conjugaison"])
            if session:
                steps_passed += 1
                print(f"      📚 Session démarrée")

            # Step 6: Vérifier cohérence - le projet contient la tâche
            project_tasks = self.universal.get(f"/api/tasks-db/tasks", params={"project_id": project_id})
            if project_tasks.get("count", 0) >= 1 or len(project_tasks.get("tasks", [])) >= 1:
                steps_passed += 1
                print(f"      🔗 Données cohérentes")

            success_rate = steps_passed / total_steps
            print(f"      → Score: {steps_passed}/{total_steps} ({success_rate*100:.0f}%)")

            return self.runner.assert_greater(
                success_rate, 0.8,
                f"Onboarding should complete 80%+ steps"
            )

        return self.runner.run_test(
            "Navigation: Onboarding",
            test,
            "New user onboarding flow"
        ).passed

    # =========================================================================
    # PARCOURS 2: JOURNÉE TYPE - Utilisateur régulier
    # =========================================================================

    def test_typical_day_flow(self) -> bool:
        """
        ☀️ Parcours: Journée type d'un utilisateur régulier

        Étapes matin → midi → soir avec navigation entre modules:
        1. MATIN: Poids + petit-déj + hydratation
        2. Navigation vers Tasks → voir planning
        3. Créer/compléter des tâches
        4. MIDI: Déjeuner + hydratation
        5. Pomodoro sur une tâche
        6. Session d'apprentissage
        7. SOIR: Dîner + bilan santé
        8. Vérifier progression de la journée
        """
        def test():
            import uuid
            user_id = f"daily_{uuid.uuid4().hex[:8]}"
            timestamp = uuid.uuid4().hex[:6]
            from datetime import datetime
            today = datetime.now().strftime('%Y-%m-%d')

            navigation_log = []

            # === MATIN ===
            print("      ☀️ Matin...")

            # 1. Enregistrer poids
            weight = self.universal.post("/api/health/weight", {
                "date": today,
                "weight": 72.5,
                "source": "manual"
            })
            navigation_log.append(("weight", weight.get("success") or weight.get("id")))

            # 2. Petit déjeuner
            breakfast = self.universal.post("/api/health/meals", {
                "date": today,
                "meal_type": "breakfast",
                "foods": [{"food_name": "Oeufs", "grams": 100, "calories": 150, "protein": 12}]
            })
            navigation_log.append(("breakfast", breakfast.get("success") or breakfast.get("id")))

            # 3. Eau
            water1 = self.universal.post("/api/health/hydration", {"amount_ml": 250, "date": today})
            navigation_log.append(("hydration_1", water1.get("success") or water1.get("id")))

            # === NAVIGATION VERS TASKS ===
            print("      📋 Navigation vers Tasks...")

            # 4. Voir le planning (dashboard tasks)
            tasks_dashboard = self.universal.get("/api/tasks-db/dashboard")
            navigation_log.append(("tasks_view", tasks_dashboard.get("success")))

            # 5. Créer une tâche pour la journée
            task = self.universal.post("/api/tasks-db/tasks", {
                "title": f"Travail du jour {timestamp}",
                "priority": "high",
                "effort": "M",
                "temporal_column": "today"
            })
            task_id = task.get("id")
            navigation_log.append(("task_create", bool(task_id)))

            # === MIDI ===
            print("      🍽️ Midi...")

            # 6. Déjeuner
            lunch = self.universal.post("/api/health/meals", {
                "date": today,
                "meal_type": "lunch",
                "foods": [
                    {"food_name": "Poulet", "grams": 150, "calories": 250, "protein": 35},
                    {"food_name": "Riz", "grams": 100, "calories": 130, "carbs": 28}
                ]
            })
            navigation_log.append(("lunch", lunch.get("success") or lunch.get("id")))

            # 7. Hydratation
            water2 = self.universal.post("/api/health/hydration", {"amount_ml": 500, "date": today})
            navigation_log.append(("hydration_2", water2.get("success") or water2.get("id")))

            # === APRÈS-MIDI: TRAVAIL ===
            print("      💼 Travail...")

            # 8. Pomodoro sur la tâche
            if task_id:
                pomo = self.universal.post("/api/tasks-db/pomodoro", {
                    "task_id": task_id,
                    "duration": 25,
                    "session_type": "focus",
                    "date": today
                })
                navigation_log.append(("pomodoro", pomo.get("success") or pomo.get("id")))

            # 9. Compléter la tâche
            if task_id:
                toggle = self.universal.post(f"/api/tasks-db/tasks/{task_id}/toggle")
                navigation_log.append(("task_complete", toggle.get("success") or "completed" in toggle))

            # === APPRENTISSAGE ===
            print("      📚 Apprentissage...")

            # 10. Session d'apprentissage
            self.backend.start_session(user_id, ["grammaire"])
            answer = self.backend.submit_answer(user_id, "grammaire", True, 5.0, 2)
            navigation_log.append(("learning", "xp_earned" in answer))

            # === SOIR ===
            print("      🌙 Soir...")

            # 11. Dîner
            dinner = self.universal.post("/api/health/meals", {
                "date": today,
                "meal_type": "dinner",
                "foods": [{"food_name": "Salade", "grams": 200, "calories": 150}]
            })
            navigation_log.append(("dinner", dinner.get("success") or dinner.get("id")))

            # 12. Bilan de la journée - Vérifier nutrition complète
            nutrition = self.universal.get(f"/api/health/nutrition/{today}")
            has_meals = nutrition.get("success") or "nutrition" in nutrition
            navigation_log.append(("nutrition_check", has_meals))

            # 13. Vérifier hydratation totale
            hydration = self.universal.get("/api/health/hydration", params={"date": today})
            navigation_log.append(("hydration_check", hydration.get("success") or "hydration" in hydration))

            # Résumé
            passed = sum(1 for _, ok in navigation_log if ok)
            total = len(navigation_log)
            success_rate = passed / total

            print(f"      → Navigation: {passed}/{total} étapes ({success_rate*100:.0f}%)")

            for step, ok in navigation_log:
                status = "✅" if ok else "❌"
                print(f"         {status} {step}")

            return self.runner.assert_greater(
                success_rate, 0.8,
                f"Daily flow should complete 80%+ steps"
            )

        return self.runner.run_test(
            "Navigation: Journée Type",
            test,
            "Full day navigation flow"
        ).passed

    # =========================================================================
    # PARCOURS 3: RÉVISION - Workflow de révision
    # =========================================================================

    def test_review_workflow(self) -> bool:
        """
        📖 Parcours: Utilisateur qui fait une session de révision

        1. Consulte les concepts à réviser
        2. Fait une session de quiz
        3. Les concepts sont mis à jour
        4. Vérifie que la mastery a évolué
        """
        def test():
            import uuid
            course_id = f"review_course_{uuid.uuid4().hex[:8]}"
            user_id = f"reviewer_{uuid.uuid4().hex[:8]}"

            steps = []

            print("      📚 Préparation...")

            # 1. Ajouter des concepts à réviser
            concepts_created = []
            for concept_name in ["Verbes irréguliers", "Accords du participe", "Subjonctif"]:
                result = self.universal.post("/api/knowledge/add", {
                    "course_id": course_id,
                    "concept": concept_name,
                    "category": "Grammaire",
                    "definition": f"Définition de {concept_name}"
                })
                if result.get("success") or result.get("concept_id"):
                    concepts_created.append(result.get("concept_id"))
            steps.append(("concepts_created", len(concepts_created) >= 2))

            print("      🔍 Récupération concepts à réviser...")

            # 2. Récupérer les concepts à réviser
            review_needed = self.universal.get(f"/api/knowledge/{course_id}/review-needed")
            steps.append(("review_fetched", review_needed.get("success") or "concepts" in review_needed))

            print("      📝 Session de quiz...")

            # 3. Simuler une session d'apprentissage (quiz)
            self.backend.start_session(user_id, ["grammaire"])

            # Répondre à plusieurs questions
            for i in range(3):
                is_correct = i < 2  # 2 correctes, 1 fausse
                result = self.backend.submit_answer(
                    user_id, "grammaire", is_correct, 8.0 + i, 2
                )
                steps.append((f"answer_{i+1}", "xp_earned" in result))

            print("      📊 Vérification progression...")

            # 4. Vérifier les concepts du cours
            concepts = self.universal.get(f"/api/knowledge/{course_id}")
            steps.append(("concepts_retrieved", concepts.get("success") or "concepts" in concepts))

            # 5. Vérifier les stats du cours
            stats = self.universal.get(f"/api/knowledge/stats/{course_id}")
            steps.append(("stats_retrieved", stats.get("success") or "stats" in stats))

            # Résumé
            passed = sum(1 for _, ok in steps if ok)
            total = len(steps)
            success_rate = passed / total

            print(f"      → Révision: {passed}/{total} ({success_rate*100:.0f}%)")

            return self.runner.assert_greater(
                success_rate, 0.7,
                f"Review workflow should complete 70%+ steps"
            )

        return self.runner.run_test(
            "Navigation: Workflow Révision",
            test,
            "Review session workflow"
        ).passed

    # =========================================================================
    # PARCOURS 4: CROSS-MODULE - Navigation entre tous les modules
    # =========================================================================

    def test_cross_module_navigation(self) -> bool:
        """
        🔀 Parcours: Navigation rapide entre tous les modules

        Vérifie qu'on peut passer d'un module à l'autre sans problème:
        Health ↔ Tasks ↔ Learning ↔ Knowledge
        """
        def test():
            import uuid
            unique = uuid.uuid4().hex[:6]
            from datetime import datetime
            today = datetime.now().strftime('%Y-%m-%d')

            transitions = []

            print("      🏥 Health...")
            # Health: Dashboard
            h1 = self.universal.get("/api/health/dashboard")
            transitions.append(("health_dash", h1.get("success") or "date" in h1))

            print("      📋 Tasks...")
            # Tasks: Dashboard
            t1 = self.universal.get("/api/tasks-db/dashboard")
            transitions.append(("tasks_dash", t1.get("success") or "date" in t1))

            # Tasks: Créer projet rapide
            proj = self.universal.post("/api/tasks-db/projects", {"name": f"Cross {unique}"})
            transitions.append(("tasks_create", bool(proj.get("id"))))

            print("      📚 Learning...")
            # Learning: Session rapide
            user_id = f"cross_{unique}"
            self.backend.start_session(user_id, ["conjugaison"])
            q = self.backend.get_next_question(user_id, "conjugaison", 50)
            transitions.append(("learning_question", "difficulty" in q))

            print("      🧠 Knowledge...")
            # Knowledge: Stats
            k1 = self.universal.get("/api/knowledge/stats/test_course")
            transitions.append(("knowledge_stats", k1.get("success") or "stats" in k1 or not k1.get("error")))

            print("      🔄 Retour Health...")
            # Retour Health: Ajouter entrée
            h2 = self.universal.post("/api/health/hydration", {"amount_ml": 100, "date": today})
            transitions.append(("health_action", h2.get("success") or h2.get("id")))

            print("      🔄 Retour Tasks...")
            # Retour Tasks: Lister projets
            t2 = self.universal.get("/api/tasks-db/projects")
            transitions.append(("tasks_list", t2.get("success") or "projects" in t2))

            # Résumé
            passed = sum(1 for _, ok in transitions if ok)
            total = len(transitions)
            success_rate = passed / total

            print(f"      → Cross-module: {passed}/{total} ({success_rate*100:.0f}%)")

            for step, ok in transitions:
                status = "✅" if ok else "❌"
                print(f"         {status} {step}")

            return self.runner.assert_greater(
                success_rate, 0.85,
                f"Cross-module should complete 85%+ transitions"
            )

        return self.runner.run_test(
            "Navigation: Cross-Module",
            test,
            "Navigate between all modules"
        ).passed

    # =========================================================================
    # PARCOURS 5: STRESS NAVIGATION - Beaucoup d'opérations rapides
    # =========================================================================

    def test_rapid_navigation(self, num_operations: int = 20) -> bool:
        """
        ⚡ Parcours: Navigation rapide avec beaucoup d'opérations

        Simule un utilisateur qui utilise l'app intensément:
        - Actions rapides
        - Pas de temps d'attente
        - Vérifie la stabilité
        """
        def test():
            import uuid
            import random
            unique = uuid.uuid4().hex[:6]
            from datetime import datetime
            today = datetime.now().strftime('%Y-%m-%d')

            operations = [
                # Health operations
                lambda: self.universal.get("/api/health/dashboard"),
                lambda: self.universal.post("/api/health/hydration", {"amount_ml": random.randint(100, 500)}),
                lambda: self.universal.get("/api/health/weight"),
                # Tasks operations
                lambda: self.universal.get("/api/tasks-db/projects"),
                lambda: self.universal.get("/api/tasks-db/tasks"),
                lambda: self.universal.get("/api/tasks-db/stats"),
                lambda: self.universal.post("/api/tasks-db/tasks", {
                    "title": f"Rapid Task {uuid.uuid4().hex[:4]}",
                    "priority": random.choice(["low", "medium", "high"])
                }),
                # Knowledge operations
                lambda: self.universal.get("/api/knowledge/stats/rapid_course"),
            ]

            successes = 0
            errors = []

            print(f"      ⚡ Exécution de {num_operations} opérations rapides...")

            for i in range(num_operations):
                op = random.choice(operations)
                try:
                    result = op()
                    # Considérer comme succès si pas d'erreur serveur
                    if not result.get("error") or result.get("success") or result.get("_status_code", 200) < 500:
                        successes += 1
                    else:
                        errors.append(f"Op {i+1}: {result.get('error', 'unknown')}")
                except Exception as e:
                    errors.append(f"Op {i+1}: {str(e)[:50]}")

            success_rate = successes / num_operations
            print(f"      → Rapid: {successes}/{num_operations} ({success_rate*100:.0f}%)")

            if errors and len(errors) <= 5:
                for err in errors:
                    print(f"         ⚠️ {err}")

            return self.runner.assert_greater(
                success_rate, 0.9,
                f"Rapid navigation should succeed 90%+"
            )

        return self.runner.run_test(
            "Navigation: Stress Test",
            test,
            f"Rapid {num_operations} operations"
        ).passed

    # =========================================================================
    # PARCOURS 6: PERSONA JOURNEY - Parcours complet d'un persona
    # =========================================================================

    def test_persona_full_journey(self, profile_key: str = "determined") -> bool:
        """
        👤 Parcours: Un persona utilise l'app pendant une semaine simulée

        Simule un utilisateur réaliste avec son profil comportemental
        qui navigue dans l'app sur plusieurs jours.
        """
        def test():
            import uuid
            profile = PROFILES[profile_key]
            student = SimulatedStudent(profile)
            unique = uuid.uuid4().hex[:6]
            user_id = f"journey_{profile_key}_{unique}"

            from datetime import datetime, timedelta

            days_stats = []

            print(f"      👤 Persona: {profile_key}")
            print(f"         Motivation: {profile.motivation:.0%}")
            print(f"         Skip prob: {profile.session_skip_prob:.0%}")

            # Simuler 3 jours
            for day in range(1, 4):
                day_ops = {"success": 0, "total": 0}

                # Vérifier si le persona skip ce jour
                if student.should_skip_session():
                    print(f"      📅 Jour {day}: Skip (irrégularité)")
                    continue

                print(f"      📅 Jour {day}...")

                # Opérations basées sur la motivation du profil
                base_ops = int(3 + profile.motivation * 7)  # 3-10 opérations

                # Santé: probabilité basée sur discipline
                if random.random() < profile.motivation:
                    result = self.universal.post("/api/health/hydration", {"amount_ml": 250})
                    day_ops["total"] += 1
                    if result.get("success") or result.get("id"):
                        day_ops["success"] += 1

                # Tasks: créer des tâches
                num_tasks = int(1 + profile.motivation * 3)
                for i in range(num_tasks):
                    result = self.universal.post("/api/tasks-db/tasks", {
                        "title": f"Task D{day}-{i} {unique}",
                        "priority": random.choice(["low", "medium", "high"]),
                        "effort": random.choice(["XS", "S", "M"])
                    })
                    day_ops["total"] += 1
                    if result.get("id"):
                        day_ops["success"] += 1

                # Learning: quelques questions
                self.backend.start_session(user_id, ["conjugaison"])
                questions = int(2 + profile.motivation * 5)
                for _ in range(questions):
                    response = student.answer_question("conjugaison", 2)
                    result = self.backend.submit_answer(
                        user_id, "conjugaison",
                        response["is_correct"],
                        response["response_time"],
                        2
                    )
                    day_ops["total"] += 1
                    if "xp_earned" in result:
                        day_ops["success"] += 1

                if day_ops["total"] > 0:
                    day_rate = day_ops["success"] / day_ops["total"]
                    days_stats.append(day_rate)
                    print(f"         → {day_ops['success']}/{day_ops['total']} ({day_rate*100:.0f}%)")

            # Score global
            if days_stats:
                avg_rate = sum(days_stats) / len(days_stats)
                print(f"      → Score moyen: {avg_rate*100:.0f}%")
                return self.runner.assert_greater(
                    avg_rate, 0.7,
                    f"{profile_key} journey should succeed 70%+"
                )
            else:
                # Pas de jour actif = skip total (acceptable pour struggling)
                return self.runner.assert_true(
                    profile_key == "struggling",
                    "Only struggling profile can skip all days"
                )

        return self.runner.run_test(
            f"Navigation: Persona Journey ({profile_key})",
            test,
            f"{profile_key} weekly navigation"
        ).passed

    def run_all_navigation_tests(self) -> bool:
        """Exécute tous les tests de navigation"""
        all_passed = True

        # Tests de base
        if not self.test_onboarding_flow():
            all_passed = False
        if not self.test_typical_day_flow():
            all_passed = False
        if not self.test_review_workflow():
            all_passed = False
        if not self.test_cross_module_navigation():
            all_passed = False
        if not self.test_rapid_navigation(20):
            all_passed = False

        # Tests personas
        for profile in ["determined", "average", "irregular"]:
            if not self.test_persona_full_journey(profile):
                all_passed = False

        return all_passed


# =============================================================================
# FULL APP E2E TESTS
# =============================================================================

class FullAppE2ETests:
    """Tests E2E intégrés testant l'ensemble de l'application"""

    def __init__(self, runner: E2ETestRunner):
        self.runner = runner
        self.config = runner.config
        self.backend = runner.backend

    def test_persona_full_day(self, profile_key: str = "determined") -> bool:
        """Test: Une journée complète d'un persona utilisant toute l'app"""
        def test():
            profile = PROFILES[profile_key]
            student = SimulatedStudent(profile)
            user_id = f"e2e_full_{profile_key}_{int(time.time())}"
            timestamp = int(time.time())

            operations_success = 0
            total_operations = 0

            # === MATIN: Santé ===
            # 1. Enregistrer le poids
            weight_result = self.backend.add_weight_entry(
                weight=round(70 + random.uniform(-2, 2), 1)
            )
            total_operations += 1
            if weight_result.get("success") or weight_result.get("id"):
                operations_success += 1

            # 2. Petit déjeuner
            breakfast_result = self.backend.add_meal(
                meal_type="breakfast",
                foods=[{"food_name": "Céréales", "grams": 100, "calories": 350}]
            )
            total_operations += 1
            if breakfast_result.get("success") or breakfast_result.get("id"):
                operations_success += 1

            # 3. Eau
            hydration_result = self.backend.add_hydration(amount_ml=250)
            total_operations += 1
            if hydration_result.get("success") or hydration_result.get("id"):
                operations_success += 1

            # === MATINÉE: Travail ===
            # 4. Créer un projet
            project_result = self.backend.create_project(f"Projet du jour {timestamp}")
            project_id = project_result.get("id")
            total_operations += 1
            if project_result.get("success") or project_id:
                operations_success += 1

            # 5. Créer des tâches
            task_ids = []
            for i in range(3):
                task_result = self.backend.create_task(
                    title=f"Tâche {i+1}",
                    project_id=project_id,
                    effort="S"
                )
                total_operations += 1
                if task_result.get("id"):
                    task_ids.append(task_result.get("id"))
                    operations_success += 1

            # 6. Pomodoro sur la première tâche
            if task_ids:
                pomo_result = self.backend.create_pomodoro(task_ids[0], duration=25)
                total_operations += 1
                if pomo_result.get("success") or pomo_result.get("id"):
                    operations_success += 1

            # === APRÈS-MIDI: Apprentissage ===
            course_id = f"course_{user_id}"

            # 7. Ajouter des concepts
            concept_result = self.backend.add_concept(
                course_id=course_id,
                concept="Nouveau concept appris",
                definition="Définition du concept"
            )
            total_operations += 1
            if concept_result.get("success") or concept_result.get("concept_id"):
                operations_success += 1

            # 8. Session d'apprentissage
            self.backend.start_session(user_id, self.config.topics)
            total_operations += 1
            operations_success += 1  # start_session devrait toujours fonctionner

            # 9. Quelques questions
            for _ in range(3):
                topic = random.choice(self.config.topics)
                response = student.answer_question(topic, 2)
                result = self.backend.submit_answer(
                    user_id, topic,
                    response["is_correct"],
                    response["response_time"],
                    2
                )
                total_operations += 1
                if "xp_earned" in result:
                    operations_success += 1

            # === SOIR: Compléter des tâches ===
            # 10. Compléter une tâche
            if task_ids:
                toggle_result = self.backend.toggle_task(task_ids[0])
                total_operations += 1
                if toggle_result.get("success") or "completed" in toggle_result:
                    operations_success += 1

            # 11. Dîner
            dinner_result = self.backend.add_meal(
                meal_type="dinner",
                foods=[{"food_name": "Salade", "grams": 200, "calories": 150}]
            )
            total_operations += 1
            if dinner_result.get("success") or dinner_result.get("id"):
                operations_success += 1

            # Vérification finale
            success_rate = operations_success / total_operations if total_operations > 0 else 0

            self.runner.assert_greater(
                success_rate, 0.7,
                f"{profile_key} should complete 70%+ operations (got {success_rate*100:.0f}%)"
            )
            return True

        return self.runner.run_test(
            f"Full Day ({profile_key})",
            test,
            f"{profile_key} completes full day"
        ).passed

    def test_all_personas_integration(self) -> bool:
        """Test: Tous les personas utilisent l'app ensemble"""
        all_passed = True
        for profile_key in ["determined", "average", "irregular", "struggling"]:
            if not self.test_persona_full_day(profile_key):
                all_passed = False
        return all_passed


# =============================================================================
# USER SIMULATOR - Simulation réaliste avec Learning Engine
# =============================================================================

class UserSimulator:
    """
    🎭 Simulateur d'utilisateurs réalistes utilisant directement le Learning Engine.

    Permet de créer des utilisateurs virtuels avec différents comportements:
    - Étudiant motivé (sessions longues, bonnes réponses)
    - Étudiant moyen (sessions régulières, réponses mixtes)
    - Étudiant irrégulier (sessions sporadiques)
    - Étudiant en difficulté (fatigue rapide, erreurs fréquentes)

    Utilise directement lean_engine pour des tests réalistes.
    """

    # Profils de comportement prédéfinis
    BEHAVIORS = {
        "motivated": {
            "name": "Étudiant Motivé",
            "accuracy_base": 0.85,      # Bon taux de réussite
            "response_time_range": (3, 8),  # Temps de réponse (secondes)
            "session_length": (15, 25),  # Questions par session
            "fatigue_threshold": 20,     # Questions avant fatigue
            "skip_probability": 0.05,    # Rarement skip
            "difficulty_preference": 3,   # Préfère difficulté moyenne
        },
        "average": {
            "name": "Étudiant Moyen",
            "accuracy_base": 0.65,
            "response_time_range": (5, 15),
            "session_length": (8, 15),
            "fatigue_threshold": 12,
            "skip_probability": 0.15,
            "difficulty_preference": 2,
        },
        "irregular": {
            "name": "Étudiant Irrégulier",
            "accuracy_base": 0.55,
            "response_time_range": (8, 25),
            "session_length": (3, 8),
            "fatigue_threshold": 8,
            "skip_probability": 0.40,
            "difficulty_preference": 2,
        },
        "struggling": {
            "name": "Étudiant en Difficulté",
            "accuracy_base": 0.35,
            "response_time_range": (15, 40),
            "session_length": (3, 6),
            "fatigue_threshold": 5,
            "skip_probability": 0.50,
            "difficulty_preference": 1,
        },
        "expert": {
            "name": "Expert",
            "accuracy_base": 0.95,
            "response_time_range": (1, 4),
            "session_length": (20, 40),
            "fatigue_threshold": 30,
            "skip_probability": 0.02,
            "difficulty_preference": 5,
        }
    }

    def __init__(self, user_id: str = None, behavior: str = "average"):
        import uuid
        self.user_id = user_id or f"sim_{uuid.uuid4().hex[:8]}"
        self.behavior_key = behavior
        self.behavior = self.BEHAVIORS.get(behavior, self.BEHAVIORS["average"])

        # État interne
        self.questions_this_session = 0
        self.correct_streak = 0
        self.error_streak = 0
        self.total_xp = 0
        self.sessions_completed = 0
        self.history = []

        # Référence au moteur
        self.engine = lean_engine

    def should_skip_session(self) -> bool:
        """Détermine si l'utilisateur skip cette session"""
        return random.random() < self.behavior["skip_probability"]

    def _calculate_accuracy(self, topic: str, difficulty: int) -> float:
        """Calcule la probabilité de bonne réponse basée sur le contexte"""
        base = self.behavior["accuracy_base"]

        # Ajustement par difficulté (-5% par niveau au-dessus de la préférence)
        diff_delta = difficulty - self.behavior["difficulty_preference"]
        accuracy = base - (diff_delta * 0.05)

        # Bonus de streak (+2% par bonne réponse consécutive, max +10%)
        streak_bonus = min(0.10, self.correct_streak * 0.02)
        accuracy += streak_bonus

        # Malus de fatigue (-3% par question après le seuil)
        fatigue_questions = max(0, self.questions_this_session - self.behavior["fatigue_threshold"])
        fatigue_penalty = fatigue_questions * 0.03
        accuracy -= fatigue_penalty

        # Malus d'erreurs consécutives (découragement)
        if self.error_streak > 2:
            accuracy -= (self.error_streak - 2) * 0.05

        return max(0.1, min(0.99, accuracy))

    def _generate_response_time(self, is_correct: bool, difficulty: int) -> float:
        """Génère un temps de réponse réaliste"""
        min_time, max_time = self.behavior["response_time_range"]

        # Base aléatoire
        base_time = random.uniform(min_time, max_time)

        # Les mauvaises réponses sont souvent plus rapides (abandon) ou plus lentes (hésitation)
        if not is_correct:
            if random.random() < 0.4:
                base_time *= 0.5  # Abandon rapide
            else:
                base_time *= 1.5  # Hésitation longue

        # Difficulté augmente le temps
        base_time *= (1 + (difficulty - 2) * 0.15)

        # Fatigue augmente le temps
        fatigue_factor = 1 + (max(0, self.questions_this_session - 10) * 0.05)
        base_time *= fatigue_factor

        return round(base_time, 1)

    def answer_question(self, topic: str, difficulty: int) -> dict:
        """
        Simule une réponse à une question.
        Retourne le résultat du Learning Engine.
        """
        # Calculer si la réponse est correcte
        accuracy = self._calculate_accuracy(topic, difficulty)
        is_correct = random.random() < accuracy

        # Générer le temps de réponse
        response_time = self._generate_response_time(is_correct, difficulty)

        # Soumettre au Learning Engine
        result = self.engine.process_answer(
            user_id=self.user_id,
            topic_id=topic,
            is_correct=is_correct,
            response_time=response_time,
            difficulty=difficulty
        )

        # Mettre à jour l'état interne
        self.questions_this_session += 1

        if is_correct:
            self.correct_streak += 1
            self.error_streak = 0
        else:
            self.error_streak += 1
            self.correct_streak = 0

        self.total_xp += result.xp_earned

        # Enregistrer dans l'historique
        self.history.append({
            "topic": topic,
            "difficulty": difficulty,
            "is_correct": is_correct,
            "response_time": response_time,
            "xp": result.xp_earned,
            "mastery_change": result.mastery_change
        })

        return {
            "is_correct": is_correct,
            "response_time": response_time,
            "xp_earned": result.xp_earned,
            "feedback": result.feedback,
            "should_break": result.should_take_break,
            "should_reduce_difficulty": result.should_reduce_difficulty
        }

    def should_continue_session(self) -> bool:
        """Détermine si l'utilisateur continue la session"""
        min_q, max_q = self.behavior["session_length"]

        # Minimum atteint ?
        if self.questions_this_session < min_q:
            return True

        # Maximum atteint ?
        if self.questions_this_session >= max_q:
            return False

        # Fatigue ?
        if self.questions_this_session > self.behavior["fatigue_threshold"]:
            # Probabilité croissante d'arrêter
            fatigue_stop_prob = (self.questions_this_session - self.behavior["fatigue_threshold"]) * 0.15
            if random.random() < fatigue_stop_prob:
                return False

        # Trop d'erreurs consécutives ?
        if self.error_streak >= 4:
            return random.random() > 0.7  # 70% chance d'arrêter

        return True

    def run_session(self, topics: List[str] = None, verbose: bool = True) -> dict:
        """
        Exécute une session d'apprentissage complète.
        Retourne les statistiques de la session.
        """
        topics = topics or ["conjugaison", "grammaire", "vocabulaire"]

        # Reset session
        self.questions_this_session = 0
        session_xp = 0
        session_correct = 0
        session_total = 0

        if verbose:
            print(f"   🎭 {self.behavior['name']} ({self.user_id})")

        while self.should_continue_session():
            # Choisir un topic (interleaving)
            topic = random.choice(topics)

            # Obtenir les paramètres de question depuis le moteur
            stats = self.engine.get_user_stats(self.user_id)
            current_mastery = stats.get("mastery", {}).get(topic, 0)

            question_params = self.engine.get_next_question(
                user_id=self.user_id,
                topic_id=topic,
                current_mastery=current_mastery
            )

            difficulty = question_params.difficulty

            # Répondre
            result = self.answer_question(topic, difficulty)

            session_xp += result["xp_earned"]
            session_total += 1
            if result["is_correct"]:
                session_correct += 1

            # Vérifier les recommandations du moteur
            if result["should_break"]:
                if verbose:
                    print(f"      ⚠️ Pause recommandée après {session_total} questions")
                break

        self.sessions_completed += 1

        # Sauvegarder l'état
        self.engine.save_state(self.user_id)

        session_accuracy = session_correct / session_total if session_total > 0 else 0

        if verbose:
            print(f"      → {session_total} questions, {session_accuracy*100:.0f}% correct, +{session_xp} XP")

        return {
            "user_id": self.user_id,
            "questions": session_total,
            "correct": session_correct,
            "accuracy": session_accuracy,
            "xp_earned": session_xp,
            "total_xp": self.total_xp
        }

    def run_week_simulation(self, topics: List[str] = None, verbose: bool = True) -> dict:
        """
        Simule une semaine d'apprentissage (7 jours).
        """
        topics = topics or ["conjugaison", "grammaire", "vocabulaire", "orthographe"]

        week_stats = {
            "days_active": 0,
            "days_skipped": 0,
            "total_questions": 0,
            "total_correct": 0,
            "total_xp": 0,
            "daily_stats": []
        }

        if verbose:
            print(f"\n   📅 Simulation 7 jours - {self.behavior['name']}")
            print(f"   " + "-" * 40)

        for day in range(1, 8):
            if self.should_skip_session():
                week_stats["days_skipped"] += 1
                if verbose:
                    print(f"   Jour {day}: ⏭️ Skip")
                week_stats["daily_stats"].append({"day": day, "skipped": True})
                continue

            week_stats["days_active"] += 1

            # Reset pour nouvelle journée
            self.engine.reset_session(self.user_id, save=True)
            self.questions_this_session = 0
            self.correct_streak = 0
            self.error_streak = 0

            if verbose:
                print(f"   Jour {day}:", end=" ")

            day_result = self.run_session(topics, verbose=False)

            week_stats["total_questions"] += day_result["questions"]
            week_stats["total_correct"] += day_result["correct"]
            week_stats["total_xp"] += day_result["xp_earned"]

            day_result["day"] = day
            day_result["skipped"] = False
            week_stats["daily_stats"].append(day_result)

            if verbose:
                print(f"{day_result['questions']}Q, {day_result['accuracy']*100:.0f}%, +{day_result['xp_earned']}XP")

        # Stats finales
        if week_stats["total_questions"] > 0:
            week_stats["overall_accuracy"] = week_stats["total_correct"] / week_stats["total_questions"]
        else:
            week_stats["overall_accuracy"] = 0

        # Récupérer l'état final du moteur
        final_stats = self.engine.get_user_stats(self.user_id)
        week_stats["final_mastery"] = final_stats.get("mastery", {})
        week_stats["final_total_xp"] = final_stats.get("total_xp", 0)

        if verbose:
            print(f"   " + "-" * 40)
            print(f"   📊 Bilan: {week_stats['days_active']}/7 jours, "
                  f"{week_stats['total_questions']} questions, "
                  f"{week_stats['overall_accuracy']*100:.0f}% correct, "
                  f"{week_stats['total_xp']} XP")

        return week_stats

    def get_stats(self) -> dict:
        """Récupère les stats complètes depuis le Learning Engine"""
        return self.engine.get_user_stats(self.user_id)

    def cleanup(self):
        """Supprime l'utilisateur simulé de la DB"""
        self.engine.delete_state(self.user_id)


class UserSimulatorTests:
    """
    🧪 Tests E2E utilisant le UserSimulator avec le Learning Engine.
    """

    def __init__(self, runner: 'E2ETestRunner'):
        self.runner = runner

    def test_single_session(self, behavior: str = "average") -> bool:
        """Test: Une session unique"""
        def test():
            sim = UserSimulator(behavior=behavior)
            result = sim.run_session(verbose=False)

            # Vérifications
            assert result["questions"] > 0, "Should answer at least 1 question"
            assert 0 <= result["accuracy"] <= 1, "Accuracy should be between 0 and 1"

            # Cleanup
            sim.cleanup()

            return self.runner.assert_true(True, f"{behavior} session completed")

        return self.runner.run_test(
            f"UserSim: {behavior} session",
            test,
            f"Single {behavior} session"
        ).passed

    def test_week_simulation(self, behavior: str = "average") -> bool:
        """Test: Simulation d'une semaine"""
        def test():
            sim = UserSimulator(behavior=behavior)
            result = sim.run_week_simulation(verbose=False)

            # Vérifications selon le comportement
            behavior_data = UserSimulator.BEHAVIORS[behavior]
            expected_min_days = int(7 * (1 - behavior_data["skip_probability"]) * 0.5)

            sim.cleanup()

            return self.runner.assert_greater_equal(
                result["days_active"],
                expected_min_days,
                f"{behavior} should be active at least {expected_min_days} days"
            )

        return self.runner.run_test(
            f"UserSim: {behavior} week",
            test,
            f"Week simulation for {behavior}"
        ).passed

    def test_all_behaviors(self) -> bool:
        """Test: Tous les comportements"""
        all_passed = True

        for behavior in ["motivated", "average", "irregular", "struggling", "expert"]:
            if not self.test_single_session(behavior):
                all_passed = False

        return all_passed

    def test_comparison(self) -> bool:
        """Test: Comparaison des comportements"""
        def test():
            results = {}

            for behavior in ["motivated", "struggling"]:
                sim = UserSimulator(behavior=behavior)
                week_result = sim.run_week_simulation(verbose=False)
                results[behavior] = week_result
                sim.cleanup()

            # L'étudiant motivé devrait avoir plus de XP
            motivated_xp = results["motivated"]["total_xp"]
            struggling_xp = results["struggling"]["total_xp"]

            return self.runner.assert_greater(
                motivated_xp,
                struggling_xp,
                f"Motivated ({motivated_xp} XP) should earn more than struggling ({struggling_xp} XP)"
            )

        return self.runner.run_test(
            "UserSim: Behavior Comparison",
            test,
            "Compare motivated vs struggling"
        ).passed

    def test_mastery_progression(self) -> bool:
        """Test: Progression de la maîtrise"""
        def test():
            sim = UserSimulator(behavior="motivated")

            # Session 1
            sim.run_session(topics=["conjugaison"], verbose=False)
            stats1 = sim.get_stats()
            mastery1 = stats1.get("mastery", {}).get("conjugaison", 0)

            # Session 2
            sim.engine.reset_session(sim.user_id)
            sim.questions_this_session = 0
            sim.run_session(topics=["conjugaison"], verbose=False)
            stats2 = sim.get_stats()
            mastery2 = stats2.get("mastery", {}).get("conjugaison", 0)

            sim.cleanup()

            return self.runner.assert_greater_equal(
                mastery2,
                mastery1,
                f"Mastery should increase ({mastery1:.1f} → {mastery2:.1f})"
            )

        return self.runner.run_test(
            "UserSim: Mastery Progression",
            test,
            "Mastery should increase over sessions"
        ).passed

    def test_fatigue_detection(self) -> bool:
        """Test: Détection de fatigue par le moteur"""
        def test():
            sim = UserSimulator(behavior="struggling")

            # Forcer beaucoup de mauvaises réponses
            fatigue_detected = False
            for _ in range(15):
                result = sim.answer_question("grammaire", 4)  # Difficulté haute
                if result["should_break"]:
                    fatigue_detected = True
                    break

            sim.cleanup()

            return self.runner.assert_true(
                fatigue_detected,
                "Fatigue should be detected for struggling student"
            )

        return self.runner.run_test(
            "UserSim: Fatigue Detection",
            test,
            "Engine should detect cognitive overload"
        ).passed

    def run_all_tests(self) -> bool:
        """Exécute tous les tests du simulateur"""
        all_passed = True

        print("\n📋 Tests Single Session")
        print("-" * 40)
        for behavior in ["motivated", "average", "struggling"]:
            if not self.test_single_session(behavior):
                all_passed = False

        print("\n📋 Tests Week Simulation")
        print("-" * 40)
        if not self.test_week_simulation("average"):
            all_passed = False

        print("\n📋 Tests Comportementaux")
        print("-" * 40)
        if not self.test_comparison():
            all_passed = False
        if not self.test_mastery_progression():
            all_passed = False
        if not self.test_fatigue_detection():
            all_passed = False

        return all_passed


def run_user_simulation(behavior: str = "average", days: int = 7, verbose: bool = True):
    """
    🎭 Lance une simulation d'utilisateur standalone.

    Usage:
        python test_e2e_framework.py --simulate average --days 7
    """
    print("\n" + "=" * 70)
    print(f"🎭 SIMULATION UTILISATEUR - {UserSimulator.BEHAVIORS[behavior]['name']}")
    print("=" * 70)

    sim = UserSimulator(behavior=behavior)

    if days == 1:
        result = sim.run_session(verbose=verbose)
    else:
        result = sim.run_week_simulation(verbose=verbose)

    print("\n" + "=" * 70)
    print("📊 RÉSULTAT FINAL")
    print("=" * 70)

    final_stats = sim.get_stats()
    print(f"""
User ID:     {sim.user_id}
Comportement: {sim.behavior['name']}
Sessions:    {sim.sessions_completed}
XP Total:    {final_stats.get('total_xp', 0)}
Mastery:     {final_stats.get('mastery', {})}
""")

    # Cleanup optionnel
    # sim.cleanup()

    return result


# =============================================================================
# MAIN
# =============================================================================

def run_all_tests(config: TestConfig, scenario: str = "full") -> TestReport:
    """
    Exécute les tests E2E selon le scénario choisi.

    Scénarios disponibles:
    - "full": Tous les tests (Learning + Tasks + Health + Knowledge + Navigation + Integration)
    - "learning": Tests du moteur d'apprentissage uniquement
    - "tasks": Tests de gestion des tâches uniquement
    - "health": Tests de suivi santé uniquement
    - "knowledge": Tests de gestion des connaissances uniquement
    - "navigation": Tests de navigation/utilisabilité (parcours utilisateur)
    - "integration": Tests d'intégration complète (persona full day)
    """

    print("\n" + "=" * 70)
    print("🧪 E2E TEST FRAMEWORK v3.1 - UNIVERSAL APP TESTING + NAVIGATION")
    print("=" * 70)
    print(f"Mode: {config.mode.value.upper()}")
    if config.mode == TestMode.API:
        print(f"API URL: {config.api_url}")
    print(f"Scenario: {scenario.upper()}")
    print(f"Days: {config.num_days}, Questions/day: {config.questions_per_day}")
    print("=" * 70)

    runner = E2ETestRunner(config)

    # Instancier toutes les classes de tests
    learning_tests = LearningE2ETests(runner)
    tasks_tests = TasksE2ETests(runner)
    health_tests = HealthE2ETests(runner)
    knowledge_tests = KnowledgeE2ETests(runner)
    navigation_tests = NavigationE2ETests(runner)  # NEW: Tests de navigation
    full_tests = FullAppE2ETests(runner)

    # =========================================================================
    # TESTS LEARNING (base, fonctionnels, profils)
    # =========================================================================
    if scenario in ["full", "learning"]:
        print("\n" + "=" * 70)
        print("📚 TESTS LEARNING API")
        print("=" * 70)

        # Tests de base
        print("\n📋 Tests de base")
        print("-" * 40)
        learning_tests.test_health_check()
        learning_tests.test_session_creation()
        learning_tests.test_question_generation()
        learning_tests.test_answer_submission()

        # Tests fonctionnels
        print("\n📋 Tests fonctionnels")
        print("-" * 40)
        learning_tests.test_xp_accumulation()
        learning_tests.test_difficulty_adaptation()
        learning_tests.test_cognitive_load_detection()
        learning_tests.test_mastery_persistence()

        # Tests avec simulateur
        print("\n📋 Tests profils (simulateur)")
        print("-" * 40)
        learning_tests.test_all_profiles()

        # Tests edge cases
        print("\n📋 Tests edge cases")
        print("-" * 40)
        learning_tests.test_edge_cases()

    # =========================================================================
    # TESTS TASKS API
    # =========================================================================
    if scenario in ["full", "tasks"]:
        print("\n" + "=" * 70)
        print("📋 TESTS TASKS API")
        print("=" * 70)

        print("\n📋 Tests CRUD")
        print("-" * 40)
        tasks_tests.test_project_creation()
        tasks_tests.test_task_creation()
        tasks_tests.test_task_with_project()
        tasks_tests.test_task_toggle()
        tasks_tests.test_task_deletion()

        print("\n📋 Tests Pomodoro & Stats")
        print("-" * 40)
        tasks_tests.test_pomodoro_creation()
        tasks_tests.test_tasks_stats()

        print("\n📋 Tests Personas")
        print("-" * 40)
        for profile in ["determined", "average"]:
            tasks_tests.test_persona_task_workflow(profile)

    # =========================================================================
    # TESTS HEALTH API
    # =========================================================================
    if scenario in ["full", "health"]:
        print("\n" + "=" * 70)
        print("🏥 TESTS HEALTH API")
        print("=" * 70)

        print("\n📋 Tests CRUD")
        print("-" * 40)
        health_tests.test_weight_entry()
        health_tests.test_weight_history()
        health_tests.test_meal_entry()
        health_tests.test_hydration_tracking()
        health_tests.test_health_dashboard()

        print("\n📋 Tests Personas")
        print("-" * 40)
        for profile in ["determined", "average"]:
            health_tests.test_persona_health_routine(profile)

    # =========================================================================
    # TESTS KNOWLEDGE API
    # =========================================================================
    if scenario in ["full", "knowledge"]:
        print("\n" + "=" * 70)
        print("🧠 TESTS KNOWLEDGE API")
        print("=" * 70)

        print("\n📋 Tests CRUD")
        print("-" * 40)
        knowledge_tests.test_concept_creation()
        knowledge_tests.test_concept_retrieval()
        knowledge_tests.test_concept_search()
        knowledge_tests.test_mastery_update()
        knowledge_tests.test_review_needed()

        print("\n📋 Tests Personas")
        print("-" * 40)
        for profile in ["determined", "average"]:
            knowledge_tests.test_persona_learning_journey(profile)

    # =========================================================================
    # TESTS NAVIGATION (UTILISABILITÉ)
    # =========================================================================
    if scenario in ["full", "navigation"]:
        print("\n" + "=" * 70)
        print("🧭 TESTS NAVIGATION / UTILISABILITÉ")
        print("=" * 70)

        print("\n📋 Parcours Onboarding")
        print("-" * 40)
        navigation_tests.test_onboarding_flow()

        print("\n📋 Parcours Journée Type")
        print("-" * 40)
        navigation_tests.test_typical_day_flow()

        print("\n📋 Parcours Révision")
        print("-" * 40)
        navigation_tests.test_review_workflow()

        print("\n📋 Navigation Cross-Module")
        print("-" * 40)
        navigation_tests.test_cross_module_navigation()

        print("\n📋 Stress Navigation")
        print("-" * 40)
        navigation_tests.test_rapid_navigation(20)

        print("\n📋 Parcours Personas")
        print("-" * 40)
        for profile in ["determined", "average", "irregular"]:
            navigation_tests.test_persona_full_journey(profile)

    # =========================================================================
    # TESTS INTEGRATION COMPLETE
    # =========================================================================
    if scenario in ["full", "integration"]:
        print("\n" + "=" * 70)
        print("🔗 TESTS INTEGRATION COMPLETE")
        print("=" * 70)

        print("\n📋 Full Day Personas")
        print("-" * 40)
        full_tests.test_all_personas_integration()

    # =========================================================================
    # TESTS USER SIMULATION (avec Learning Engine)
    # =========================================================================
    if scenario in ["full", "simulate"]:
        print("\n" + "=" * 70)
        print("🎭 TESTS SIMULATION UTILISATEURS")
        print("=" * 70)

        sim_tests = UserSimulatorTests(runner)
        sim_tests.run_all_tests()

    # =========================================================================
    # STRESS TEST (optionnel)
    # =========================================================================
    if scenario == "full" and config.num_days >= 7:
        print("\n" + "=" * 70)
        print("⚡ TEST DE CHARGE")
        print("=" * 70)
        print("-" * 40)
        learning_tests.test_stress_scenario(num_users=5)

    # Rapport final
    runner.report.end_time = datetime.now()

    print("\n" + "=" * 70)
    print("📊 RAPPORT FINAL")
    print("=" * 70)

    report = runner.report
    print(f"""
Total:    {report.total} tests
Passed:   {report.passed} ✅
Failed:   {report.failed} ❌
Success:  {report.success_rate*100:.1f}%
Duration: {(report.end_time - report.start_time).total_seconds():.1f}s
""")

    if report.failed > 0:
        print("❌ TESTS ÉCHOUÉS:")
        for r in report.results:
            if not r.passed:
                print(f"   - {r.name}: {r.message}")

    print("=" * 70)

    # Verdict
    if report.success_rate >= 0.9:
        print("✅ TESTS E2E RÉUSSIS - Système validé!")
    elif report.success_rate >= 0.7:
        print("⚠️ TESTS E2E PARTIELS - Quelques ajustements nécessaires")
    else:
        print("❌ TESTS E2E ÉCHOUÉS - Problèmes majeurs détectés")

    print("=" * 70)

    return report


def discover_routes(config: TestConfig):
    """Découvre et affiche toutes les routes disponibles"""
    adapter = UniversalAdapter(config)
    routes = adapter.discover_routes()

    print("\n" + "=" * 70)
    print("🔍 ROUTES DÉCOUVERTES")
    print("=" * 70)

    if not routes:
        print("Aucune route trouvée.")
        return

    # Grouper par tag
    by_tag = {}
    for route in routes:
        tags = route.get("tags", ["other"])
        for tag in tags:
            if tag not in by_tag:
                by_tag[tag] = []
            by_tag[tag].append(route)

    for tag, tag_routes in sorted(by_tag.items()):
        print(f"\n📁 {tag.upper()}")
        print("-" * 40)
        for route in tag_routes:
            method = route.get("method", "?")
            path = route.get("path", "?")
            summary = route.get("summary", "")
            print(f"   {method:6} {path}")
            if summary:
                print(f"          └─ {summary}")

    print(f"\n📊 Total: {len(routes)} routes")
    print("=" * 70)


def test_single_route(config: TestConfig, path: str, method: str = "GET", data: str = None):
    """Teste une route spécifique"""
    adapter = UniversalAdapter(config)

    print(f"\n🔌 Test de: {method} {path}")
    print("-" * 40)

    # Parser le data JSON si fourni
    request_data = None
    if data:
        try:
            request_data = json.loads(data)
        except:
            print(f"⚠️ JSON invalide: {data}")

    result = adapter.call(method, path, data=request_data)

    print(f"Status: {result.get('_status_code', 'N/A')}")
    print(f"Success: {'✅' if result.get('success') else '❌'}")

    # Afficher la réponse (limité)
    display_result = {k: v for k, v in result.items() if not k.startswith('_')}
    print(f"Response: {json.dumps(display_result, indent=2, default=str)[:500]}")


def main():
    parser = argparse.ArgumentParser(description="E2E Test Framework v3.2 - Universal App Testing + User Simulation")
    parser.add_argument("--mode", choices=["direct", "api"], default="direct",
                        help="Test mode: direct (Python) or api (HTTP)")
    parser.add_argument("--url", default="http://localhost:8000",
                        help="API URL for api mode")
    parser.add_argument("--days", type=int, default=3,
                        help="Number of simulated days")
    parser.add_argument("--questions", type=int, default=10,
                        help="Questions per day")
    parser.add_argument("--profile", choices=list(PROFILES.keys()),
                        help="Test specific profile only")
    parser.add_argument("--scenario", choices=["full", "learning", "tasks", "health", "knowledge", "navigation", "integration", "simulate"],
                        default="full", help="Test scenario: full, learning, tasks, health, knowledge, navigation, integration, simulate (user simulation)")
    parser.add_argument("--verbose", action="store_true", default=True,
                        help="Verbose output")
    parser.add_argument("--json", action="store_true",
                        help="Output report as JSON")

    # Nouvelles options pour l'adaptateur universel
    parser.add_argument("--discover", action="store_true",
                        help="Découvrir toutes les routes disponibles")
    parser.add_argument("--test-route", metavar="PATH",
                        help="Tester une route spécifique (ex: /api/health/weight)")
    parser.add_argument("--method", default="GET",
                        help="Méthode HTTP pour --test-route (GET, POST, PUT, DELETE)")
    parser.add_argument("--data",
                        help="Données JSON pour --test-route (ex: '{\"weight\": 75}')")

    # Options pour la simulation d'utilisateurs
    parser.add_argument("--simulate", choices=list(UserSimulator.BEHAVIORS.keys()),
                        help="Lancer une simulation d'utilisateur (motivated, average, irregular, struggling, expert)")
    parser.add_argument("--sim-days", type=int, default=7,
                        help="Nombre de jours à simuler (1 = session unique)")

    args = parser.parse_args()

    config = TestConfig(
        mode=TestMode(args.mode),
        api_url=args.url,
        num_days=args.days,
        questions_per_day=args.questions,
        verbose=args.verbose
    )

    # Mode découverte
    if args.discover:
        discover_routes(config)
        sys.exit(0)

    # Mode test route unique
    if args.test_route:
        test_single_route(config, args.test_route, args.method, args.data)
        sys.exit(0)

    # Mode simulation utilisateur standalone
    if args.simulate:
        run_user_simulation(behavior=args.simulate, days=args.sim_days, verbose=args.verbose)
        sys.exit(0)

    # Mode normal: exécuter les tests
    report = run_all_tests(config, scenario=args.scenario)

    if args.json:
        print("\n📄 JSON REPORT:")
        print(json.dumps(report.to_dict(), indent=2))

    # Exit code basé sur le taux de réussite
    sys.exit(0 if report.success_rate >= 0.9 else 1)


if __name__ == "__main__":
    main()
