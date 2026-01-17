"""
UniversalAdapter - Routes requests to API or Direct Python calls.
"""

import time
import requests
from typing import Dict, List, Optional, Any
from .base import TestConfig, TestMode


class UniversalAdapter:
    """
    Universal adapter that routes to either HTTP API or direct Python calls.

    Usage:
        adapter = UniversalAdapter(config)

        # Generic calls
        result = adapter.call("GET", "/api/health/weight")
        result = adapter.call("POST", "/api/tasks-db/tasks", {"title": "Task"})

        # Shortcuts
        result = adapter.get("/api/health/weight")
        result = adapter.post("/api/tasks-db/tasks", {"title": "Task"})

        # Auto-discovery
        routes = adapter.discover_routes()
    """

    def __init__(self, config: TestConfig):
        self.config = config
        self.session = requests.Session() if config.mode == TestMode.API else None
        self._routes_cache: Optional[List[Dict]] = None
        self._modules_cache: Dict[str, Any] = {}

    # =========================================================================
    # GENERIC HTTP METHODS
    # =========================================================================

    def call(self, method: str, path: str, data: Dict = None, params: Dict = None) -> Dict:
        """
        Call any route in the application.

        Args:
            method: GET, POST, PUT, DELETE, PATCH
            path: Route path (e.g., "/api/health/weight")
            data: Request body (for POST/PUT/PATCH)
            params: Query string parameters

        Returns:
            JSON response or {"error": message}
        """
        if self.config.mode == TestMode.DIRECT:
            return self._call_direct(method, path, data, params)
        else:
            return self._call_api(method, path, data, params)

    def get(self, path: str, params: Dict = None) -> Dict:
        return self.call("GET", path, params=params)

    def post(self, path: str, data: Dict = None, params: Dict = None) -> Dict:
        return self.call("POST", path, data=data, params=params)

    def put(self, path: str, data: Dict = None, params: Dict = None) -> Dict:
        return self.call("PUT", path, data=data, params=params)

    def delete(self, path: str, params: Dict = None) -> Dict:
        return self.call("DELETE", path, params=params)

    def patch(self, path: str, data: Dict = None, params: Dict = None) -> Dict:
        return self.call("PATCH", path, data=data, params=params)

    # =========================================================================
    # API MODE (HTTP)
    # =========================================================================

    def _call_api(self, method: str, path: str, data: Dict = None, params: Dict = None) -> Dict:
        """HTTP call to API"""
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
                return {"error": f"Unsupported HTTP method: {method}"}

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
            return {"error": "Connection refused", "_status_code": 503}
        except Exception as e:
            return {"error": str(e), "_status_code": 500}

    # =========================================================================
    # DIRECT MODE (Python calls)
    # =========================================================================

    def _call_direct(self, method: str, path: str, data: Dict = None, params: Dict = None) -> Dict:
        """Direct Python call to application modules"""
        path = path.rstrip("/")

        try:
            if "/tasks-db" in path or "/tasks" in path:
                return self._route_tasks(method, path, data, params)
            elif "/health" in path and path != "/health":
                return self._route_health(method, path, data, params)
            elif "/knowledge" in path:
                return self._route_knowledge(method, path, data, params)
            elif "/learning" in path:
                return self._route_learning(method, path, data, params)
            elif path == "/health":
                return {"status": "ok", "success": True}
            else:
                return {"error": f"Route not mapped in direct mode: {path}", "success": False}

        except Exception as e:
            return {"error": str(e), "success": False}

    def _route_tasks(self, method: str, path: str, data: Dict = None, params: Dict = None) -> Dict:
        """Route to tasks_db"""
        from databases import tasks_db
        from datetime import datetime

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
            return {"success": True, "projects": tasks_db.get_projects()}

        # DELETE /api/tasks-db/projects/{id}
        elif method == "DELETE" and "/projects/" in path:
            project_id = path.split("/projects/")[-1]
            result = tasks_db.delete_project(project_id)
            return {"success": result}

        # POST /api/tasks-db/tasks
        elif method == "POST" and path.endswith("/tasks"):
            task_id = tasks_db.add_task(data or {})
            return {"success": True, "id": task_id}

        # GET /api/tasks-db/tasks
        elif method == "GET" and path.endswith("/tasks"):
            project_id = params.get("project_id") if params else None
            return {"success": True, "tasks": tasks_db.get_tasks(project_id=project_id)}

        # POST /api/tasks-db/tasks/{id}/toggle
        elif method == "POST" and "/toggle" in path:
            task_id = path.split("/tasks/")[-1].replace("/toggle", "")
            new_status = tasks_db.toggle_task(task_id)
            return {"success": True, "completed": new_status}

        # DELETE /api/tasks-db/tasks/{id}
        elif method == "DELETE" and "/tasks/" in path:
            task_id = path.split("/tasks/")[-1]
            result = tasks_db.delete_task(task_id)
            return {"success": result}

        # GET /api/tasks-db/stats
        elif method == "GET" and path.endswith("/stats"):
            return {"success": True, "stats": tasks_db.get_stats()}

        # POST /api/tasks-db/pomodoro
        elif method == "POST" and path.endswith("/pomodoro"):
            session_id = tasks_db.add_pomodoro_session(data or {})
            return {"success": True, "id": session_id}

        return {"error": f"Tasks route not found: {method} {path}"}

    def _route_health(self, method: str, path: str, data: Dict = None, params: Dict = None) -> Dict:
        """Route to health_db"""
        from databases import health_db
        from datetime import datetime

        path = path.rstrip('/')

        # POST /api/health/weight
        if method == "POST" and path.endswith("/weight"):
            entry_id = health_db.add_weight_entry(data or {})
            return {"success": True, "id": entry_id}

        # GET /api/health/weight
        elif method == "GET" and path.endswith("/weight"):
            limit = params.get("limit", 10) if params else 10
            return {"success": True, "entries": health_db.get_weight_entries(limit=limit)}

        # POST /api/health/meals
        elif method == "POST" and path.endswith("/meals"):
            meal_id = health_db.add_meal(data or {})
            return {"success": True, "id": meal_id}

        # GET /api/health/meals
        elif method == "GET" and path.endswith("/meals"):
            date = params.get("date") if params else None
            return {"success": True, "meals": health_db.get_meals(date=date)}

        # POST /api/health/hydration
        elif method == "POST" and path.endswith("/hydration"):
            amount = data.get("amount_ml", 250) if data else 250
            entry_id = health_db.add_hydration(amount_ml=amount)
            return {"success": True, "id": entry_id}

        # GET /api/health/hydration
        elif method == "GET" and path.endswith("/hydration"):
            date = params.get("date") if params else None
            return {"success": True, "hydration": health_db.get_daily_hydration(date=date)}

        # GET /api/health/dashboard
        elif method == "GET" and path.endswith("/dashboard"):
            today = datetime.now().strftime('%Y-%m-%d')
            return {
                "success": True,
                "weight": health_db.get_weight_stats(),
                "nutrition": health_db.get_daily_nutrition(date=today),
                "hydration": health_db.get_daily_hydration(date=today),
                "profile": health_db.get_health_profile()
            }

        return {"error": f"Health route not found: {method} {path}"}

    def _route_knowledge(self, method: str, path: str, data: Dict = None, params: Dict = None) -> Dict:
        """Route to knowledge_db"""
        from databases import knowledge_db

        path = path.rstrip('/')

        # POST /api/knowledge/concepts
        if method == "POST" and path.endswith("/concepts"):
            concept_id = knowledge_db.add_concept(data or {})
            return {"success": True, "id": concept_id}

        # GET /api/knowledge/concepts
        elif method == "GET" and path.endswith("/concepts"):
            return {"success": True, "concepts": knowledge_db.get_concepts()}

        # GET /api/knowledge/review
        elif method == "GET" and path.endswith("/review"):
            return {"success": True, "due": knowledge_db.get_due_concepts()}

        return {"error": f"Knowledge route not found: {method} {path}"}

    def _route_learning(self, method: str, path: str, data: Dict = None, params: Dict = None) -> Dict:
        """Route to learning engine"""
        from services.learning_engine_lean import lean_engine

        path = path.rstrip('/')

        # GET /api/learning/engine-info
        if method == "GET" and path.endswith("/engine-info"):
            return lean_engine.get_engine_info()

        # POST /api/learning/session/{user_id}
        elif method == "POST" and "/session/" in path:
            user_id = path.split("/session/")[-1]
            topics = data.get("topics", ["conjugaison"]) if data else ["conjugaison"]
            lean_engine._get_user_state(user_id)
            return {"success": True, "user_id": user_id}

        # GET /api/learning/progress/{user_id}
        elif method == "GET" and "/progress/" in path:
            user_id = path.split("/progress/")[-1]
            return lean_engine.get_user_stats(user_id)

        return {"error": f"Learning route not found: {method} {path}"}

    # =========================================================================
    # LEARNING ENGINE SPECIFIC METHODS
    # =========================================================================

    def start_session(self, user_id: str, topics: List[str]) -> Dict:
        """Start a learning session"""
        if self.config.mode == TestMode.DIRECT:
            from services.learning_engine_lean import lean_engine
            lean_engine._get_user_state(user_id)
            return {"success": True, "user_id": user_id}
        else:
            return self.post(f"/api/learning/session/{user_id}", {"topics": topics})

    def get_next_question(self, user_id: str, topic_id: str, mastery: int) -> Dict:
        """Get next question parameters"""
        if self.config.mode == TestMode.DIRECT:
            from services.learning_engine_lean import lean_engine
            params = lean_engine.get_next_question(user_id, topic_id, mastery)
            return {
                "difficulty": params.difficulty,
                "topic_id": params.topic_id,
                "question_type": getattr(params, 'question_type', 'multiple_choice')
            }
        else:
            response = self.session.get(
                f"{self.config.api_url}/api/learning/next-question/{user_id}",
                params={"topic_id": topic_id, "current_mastery": mastery},
                timeout=self.config.timeout_seconds
            )
            return response.json() if response.status_code == 200 else {"difficulty": 2}

    def submit_answer(
        self,
        user_id: str,
        topic_id: str,
        is_correct: bool,
        response_time: float,
        difficulty: int
    ) -> Dict:
        """Submit an answer"""
        if self.config.mode == TestMode.DIRECT:
            from services.learning_engine_lean import lean_engine
            result = lean_engine.process_answer(user_id, topic_id, is_correct, response_time, difficulty)
            return {
                "is_correct": is_correct,
                "xp_earned": result.xp_earned,
                "next_review_days": result.next_review_days,
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
            return response.json() if response.status_code == 200 else {"is_correct": is_correct, "xp_earned": 0}

    def get_user_stats(self, user_id: str) -> Dict:
        """Get user statistics"""
        if self.config.mode == TestMode.DIRECT:
            from services.learning_engine_lean import lean_engine
            return lean_engine.get_user_stats(user_id)
        else:
            response = self.session.get(
                f"{self.config.api_url}/api/learning/progress/{user_id}",
                timeout=self.config.timeout_seconds
            )
            return response.json() if response.status_code == 200 else {}

    def health_check(self) -> bool:
        """Check if backend is accessible"""
        if self.config.mode == TestMode.DIRECT:
            return True
        try:
            response = self.session.get(f"{self.config.api_url}/health", timeout=5)
            return response.status_code == 200
        except:
            return False

    # =========================================================================
    # ROUTE DISCOVERY
    # =========================================================================

    def discover_routes(self) -> List[Dict]:
        """Discover all available FastAPI routes"""
        if self._routes_cache:
            return self._routes_cache

        try:
            if self.config.mode == TestMode.API:
                response = self.session.get(f"{self.config.api_url}/openapi.json", timeout=10)
                if response.status_code == 200:
                    openapi = response.json()
                    routes = []
                    for path, methods in openapi.get("paths", {}).items():
                        for method, details in methods.items():
                            if method.upper() in ["GET", "POST", "PUT", "DELETE", "PATCH"]:
                                routes.append({
                                    "path": path,
                                    "method": method.upper(),
                                    "summary": details.get("summary", ""),
                                    "tags": details.get("tags", [])
                                })
                    self._routes_cache = routes
                    return routes
            else:
                # In direct mode, return known routes
                return [
                    {"path": "/api/learning/session/{user_id}", "method": "POST", "tags": ["learning"]},
                    {"path": "/api/learning/next-question/{user_id}", "method": "GET", "tags": ["learning"]},
                    {"path": "/api/learning/submit-answer/{user_id}", "method": "POST", "tags": ["learning"]},
                    {"path": "/api/learning/progress/{user_id}", "method": "GET", "tags": ["learning"]},
                    {"path": "/api/tasks-db/projects", "method": "GET", "tags": ["tasks"]},
                    {"path": "/api/tasks-db/projects", "method": "POST", "tags": ["tasks"]},
                    {"path": "/api/tasks-db/tasks", "method": "GET", "tags": ["tasks"]},
                    {"path": "/api/tasks-db/tasks", "method": "POST", "tags": ["tasks"]},
                    {"path": "/api/health/weight", "method": "GET", "tags": ["health"]},
                    {"path": "/api/health/weight", "method": "POST", "tags": ["health"]},
                    {"path": "/api/health/meals", "method": "GET", "tags": ["health"]},
                    {"path": "/api/health/hydration", "method": "GET", "tags": ["health"]},
                    {"path": "/api/knowledge/concepts", "method": "GET", "tags": ["knowledge"]},
                ]
        except Exception as e:
            return [{"error": str(e)}]

        return []
