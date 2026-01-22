"""
UniversalAdapter - Direct Python calls to backend modules.

Simplified adapter for local testing without HTTP overhead.
"""

import json
import random
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any


# AI Question Logger for quality analysis
class AIQuestionLogger:
    """
    Logs a sample of AI-generated questions for quality analysis.

    Saves questions to a JSONL file for later review.
    Uses sampling to avoid logging every question (performance).
    """

    def __init__(self, log_dir: str = None, sample_rate: float = 0.1):
        """
        Args:
            log_dir: Directory for log files (default: e2e/logs/)
            sample_rate: Fraction of questions to log (0.1 = 10%)
        """
        self.sample_rate = sample_rate
        if log_dir is None:
            log_dir = Path(__file__).parent / "logs"
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)

        # Create dated log file
        date_str = datetime.now().strftime("%Y%m%d")
        self.log_file = self.log_dir / f"ai_questions_{date_str}.jsonl"
        self._count = 0
        self._logged = 0

    def log(self, question_data: Dict, user_answer: Dict = None):
        """
        Log a question (with sampling).

        Args:
            question_data: The generated question
            user_answer: Optional answer data (is_correct, response_time, etc.)
        """
        self._count += 1

        # Sample: only log some questions
        if random.random() > self.sample_rate:
            return

        self._logged += 1

        entry = {
            "timestamp": datetime.now().isoformat(),
            "question_id": self._count,
            "topic": question_data.get("topic_id"),
            "difficulty": question_data.get("difficulty"),
            "question_text": question_data.get("question_text"),
            "options": question_data.get("options"),
            "correct_answer": question_data.get("correct_answer"),
            "explanation": question_data.get("explanation"),
            "success": question_data.get("success", True),
        }

        if user_answer:
            entry["user_answer"] = {
                "is_correct": user_answer.get("is_correct"),
                "chosen": user_answer.get("chosen_answer"),
                "response_time": user_answer.get("response_time"),
            }

        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except Exception:
            pass  # Don't fail on logging errors

    @property
    def stats(self) -> Dict:
        """Get logging statistics"""
        return {
            "total_questions": self._count,
            "logged_questions": self._logged,
            "sample_rate": self.sample_rate,
            "log_file": str(self.log_file) if self._logged > 0 else None,
        }


# Global logger instance
_ai_logger = None

def get_ai_logger() -> AIQuestionLogger:
    """Get or create the global AI question logger"""
    global _ai_logger
    if _ai_logger is None:
        _ai_logger = AIQuestionLogger(sample_rate=0.2)  # Log 20% of questions
    return _ai_logger


class UniversalAdapter:
    """
    Adapter for direct Python calls to backend modules.

    Usage:
        adapter = UniversalAdapter()
        result = adapter.post("/api/tasks-db/tasks", {"title": "Task"})
        stats = adapter.get_user_stats(user_id)
    """

    def __init__(self, config=None):
        self.config = config

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        return False

    # =========================================================================
    # GENERIC HTTP-LIKE METHODS (all route to direct calls)
    # =========================================================================

    def call(self, method: str, path: str, data: Dict = None, params: Dict = None) -> Dict:
        """Call any route via direct Python calls"""
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
                return {"error": f"Route not found: {path}", "success": False}

        except Exception as e:
            return {"error": str(e), "success": False}

    def get(self, path: str, params: Dict = None) -> Dict:
        return self.call("GET", path, params=params)

    def post(self, path: str, data: Dict = None, params: Dict = None) -> Dict:
        return self.call("POST", path, data=data, params=params)

    def put(self, path: str, data: Dict = None, params: Dict = None) -> Dict:
        return self.call("PUT", path, data=data, params=params)

    def delete(self, path: str, params: Dict = None) -> Dict:
        return self.call("DELETE", path, params=params)

    # =========================================================================
    # ROUTE HANDLERS
    # =========================================================================

    def _route_tasks(self, method: str, path: str, data: Dict = None, params: Dict = None) -> Dict:
        """Route to tasks_db"""
        from databases import tasks_db
        from datetime import datetime

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

        # GET /api/learning/engine-info
        if method == "GET" and path.endswith("/engine-info"):
            return lean_engine.get_engine_info()

        # POST /api/learning/session/{user_id}
        elif method == "POST" and "/session/" in path:
            user_id = path.split("/session/")[-1]
            lean_engine._get_user_state(user_id)
            return {"success": True, "user_id": user_id}

        # GET /api/learning/progress/{user_id}
        elif method == "GET" and "/progress/" in path:
            user_id = path.split("/progress/")[-1]
            return lean_engine.get_user_stats(user_id)

        return {"error": f"Learning route not found: {method} {path}"}

    # =========================================================================
    # LEARNING ENGINE METHODS
    # =========================================================================

    def start_session(self, user_id: str, topics: List[str]) -> Dict:
        """Start a learning session"""
        from services.learning_engine_lean import lean_engine
        lean_engine._get_user_state(user_id)
        return {"success": True, "user_id": user_id}

    def get_next_question(self, user_id: str, topic_id: str, mastery: int) -> Dict:
        """Get next question parameters with ALL learning engine features"""
        from services.learning_engine_lean import lean_engine
        params = lean_engine.get_next_question(user_id, topic_id, mastery)
        return {
            "difficulty": params.difficulty,
            "difficulty_name": params.difficulty_name,
            "topic_id": params.topic_id,
            "fsrs_interval": params.fsrs_interval,
            "retrievability": params.retrievability,
            "cognitive_load": params.cognitive_load,
            "should_take_break": params.should_take_break,
            "interleave_suggested": params.interleave_suggested,
        }

    def generate_ai_question(self, topic_id: str, difficulty: str, mastery: int) -> Dict:
        """
        Generate a REAL AI question using the AIDispatcher.

        Returns:
            Dict with question_text, options, correct_answer, explanation
        """
        import asyncio
        from services.ai_dispatcher import ai_dispatcher

        # Map difficulty int to string
        diff_map = {1: "easy", 2: "easy", 3: "medium", 4: "hard", 5: "hard"}
        diff_str = diff_map.get(difficulty, "medium") if isinstance(difficulty, int) else difficulty

        try:
            # Run async function synchronously
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                question = loop.run_until_complete(
                    ai_dispatcher.generate_question(
                        topic_name=topic_id,
                        difficulty=diff_str,
                        mastery_level=mastery,
                        learning_style=None,
                        weak_areas=[],
                        context=None
                    )
                )
            finally:
                loop.close()

            # Extract options
            options = []
            correct_idx = 0
            for i, opt in enumerate(question.options):
                options.append(opt.text)
                if opt.is_correct:
                    correct_idx = i

            result = {
                "success": True,
                "question_text": question.question_text,
                "options": options,
                "correct_answer": question.correct_answer,
                "correct_index": correct_idx,
                "explanation": question.explanation,
                "difficulty": diff_str,
                "topic_id": topic_id,
            }

            # Log question sample for quality analysis
            get_ai_logger().log(result)
            return result

        except Exception as e:
            # Fallback question if AI fails
            result = {
                "success": False,
                "error": str(e),
                "question_text": f"Question sur {topic_id}",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": "Option B",
                "correct_index": 1,
                "explanation": "Fallback question",
                "difficulty": diff_str,
                "topic_id": topic_id,
            }

            # Log failed generation too
            get_ai_logger().log(result)
            return result

    def submit_answer(
        self,
        user_id: str,
        topic_id: str,
        is_correct: bool,
        response_time: float,
        difficulty: int
    ) -> Dict:
        """Submit an answer"""
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

    def get_user_stats(self, user_id: str) -> Dict:
        """Get user statistics"""
        from services.learning_engine_lean import lean_engine
        return lean_engine.get_user_stats(user_id)

    def health_check(self) -> bool:
        """Always returns True for direct mode"""
        return True

    # =========================================================================
    # TUTORING METHODS (Socratic Tutor)
    # =========================================================================

    def get_tutor(self):
        """Get or create the Socratic Tutor instance with Learning Engine connection."""
        if not hasattr(self, '_tutor'):
            from services.socratic_tutor import create_socratic_tutor
            from services.learning_engine_lean import lean_engine

            try:
                from services.openai_service import openai_service
                self._tutor = create_socratic_tutor(openai_service, lean_engine)
            except Exception:
                self._tutor = create_socratic_tutor(None, lean_engine)
        return self._tutor

    def tutor_wrong_answer(
        self,
        user_id: str,
        question_data: Dict,
        user_answer: str,
        response_time: float = None
    ) -> Dict:
        """
        Process a wrong answer through the Socratic Tutor.

        The tutor decides what to do:
        - 1st attempt: Socratic question
        - 2nd-4th attempt: Progressive hints
        - 5th+ attempt: Reveal answer

        Now includes response_time for adaptive profiling.

        Args:
            user_id: User ID
            question_data: Dict with id, question_text, options, correct_answer, topic
            user_answer: The wrong answer given
            response_time: Time taken to answer (for adaptation)

        Returns:
            Dict with type, content, level, requires_response, encouragement, etc.
        """
        tutor = self.get_tutor()
        response = tutor.process_wrong_answer(
            question_data, user_answer, user_id,
            response_time=response_time
        )
        return {
            "type": response.type,
            "content": response.content,
            "level": response.level,
            "requires_response": response.requires_response,
            "encouragement": response.encouragement,
            "next_action": response.next_action,
            "cognitive_load": response.cognitive_load,
        }

    def tutor_get_hint(
        self,
        user_id: str,
        question_data: Dict,
        user_answer: str,
        force_level: int = None
    ) -> Dict:
        """Get a progressive hint from the tutor."""
        tutor = self.get_tutor()
        topic = question_data.get("topic", "général")
        question_id = question_data.get("id", "default")
        context = tutor.get_context(user_id, topic, question_id)

        response = tutor.get_hint(question_data, user_answer, context, force_level)
        return {
            "type": response.type,
            "content": response.content,
            "level": response.level,
            "requires_response": response.requires_response,
            "encouragement": response.encouragement,
            "next_action": response.next_action,
            "cognitive_load": response.cognitive_load,
        }

    def tutor_get_guidance(
        self,
        user_id: str,
        question_data: Dict,
        user_answer: str
    ) -> Dict:
        """Get a Socratic guidance question."""
        tutor = self.get_tutor()
        topic = question_data.get("topic", "général")
        question_id = question_data.get("id", "default")
        context = tutor.get_context(user_id, topic, question_id)

        response = tutor.get_socratic_guidance(question_data, user_answer, context)
        return {
            "type": response.type,
            "content": response.content,
            "requires_response": response.requires_response,
            "encouragement": response.encouragement,
            "next_action": response.next_action,
            "cognitive_load": response.cognitive_load,
        }

    def tutor_correct_answer(
        self,
        user_id: str,
        question_data: Dict,
        attempts: int,
        response_time: float = None,
        hint_level_used: int = 0
    ) -> Dict:
        """
        Process a correct answer.

        Now includes response_time and hint_level_used for adaptive profiling.

        Args:
            user_id: User ID
            question_data: The question
            attempts: Number of attempts
            response_time: Time taken (for adaptation)
            hint_level_used: Max hint level used before success

        Returns:
            Tutoring response dict
        """
        tutor = self.get_tutor()
        response = tutor.process_correct_answer(
            question_data, user_id, attempts,
            response_time=response_time,
            hint_level_used=hint_level_used
        )
        return {
            "type": response.type,
            "content": response.content,
            "requires_response": response.requires_response,
            "encouragement": response.encouragement,
            "next_action": response.next_action,
            "cognitive_load": response.cognitive_load,
        }

    def tutor_reset(self, user_id: str, topic: str = None, question_id: str = None):
        """Reset tutoring context for a user."""
        tutor = self.get_tutor()
        tutor.reset_context(user_id, topic, question_id)

    def tutor_get_profile(self, user_id: str) -> Dict:
        """
        Get the adaptive profile summary for a user.

        Returns insights on:
        - Optimal learning hours
        - Learning style
        - Emotional state
        - Weak topics
        - Active error patterns
        """
        tutor = self.get_tutor()
        return tutor.get_profile_summary(user_id)

    def tutor_should_break(self, user_id: str) -> Dict:
        """Check if user should take a break."""
        tutor = self.get_tutor()
        should_break, message = tutor.should_suggest_break(user_id)
        return {
            "should_break": should_break,
            "message": message
        }

    def tutor_optimal_hint_level(self, user_id: str) -> int:
        """Get the optimal hint level for this user."""
        tutor = self.get_tutor()
        return tutor.get_optimal_hint_level(user_id)

    def discover_routes(self) -> List[Dict]:
        """List available routes"""
        return [
            {"path": "/api/learning/session/{user_id}", "method": "POST", "tags": ["learning"]},
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
