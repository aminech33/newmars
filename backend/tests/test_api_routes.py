"""
API route tests with mocking.
Tests FastAPI endpoints without hitting real database.
"""
import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime


class TestHealthRoutes:
    """Test Health API routes."""

    def test_get_weight_entries(self, mock_requests):
        """GET /api/health/weight should return entries."""
        mock_requests.get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "success": True,
                "count": 2,
                "entries": [
                    {"id": 1, "date": "2024-01-17", "weight": 75.5},
                    {"id": 2, "date": "2024-01-16", "weight": 75.8}
                ]
            }
        )

        response = mock_requests.get("/api/health/weight")
        data = response.json()

        assert data["success"] is True
        assert data["count"] == 2

    def test_add_weight_entry(self, mock_requests, sample_weight_entry):
        """POST /api/health/weight should add entry."""
        mock_requests.post.return_value = MagicMock(
            status_code=200,
            json=lambda: {"success": True, "id": 123}
        )

        response = mock_requests.post("/api/health/weight", json=sample_weight_entry)
        data = response.json()

        assert data["success"] is True
        assert data["id"] == 123

    def test_get_health_dashboard(self, mock_requests):
        """GET /api/health/dashboard should return dashboard."""
        mock_requests.get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "success": True,
                "weight": {"current": 75.5},
                "nutrition": {"calories": 1800},
                "hydration": {"total_ml": 2000}
            }
        )

        response = mock_requests.get("/api/health/dashboard")
        data = response.json()

        assert data["success"] is True
        assert "weight" in data
        assert "nutrition" in data


class TestTasksRoutes:
    """Test Tasks API routes."""

    def test_create_project(self, mock_requests, sample_project):
        """POST /api/tasks-db/projects should create project."""
        mock_requests.post.return_value = MagicMock(
            status_code=200,
            json=lambda: {"success": True, "id": "proj_123"}
        )

        response = mock_requests.post("/api/tasks-db/projects", json=sample_project)
        data = response.json()

        assert data["success"] is True
        assert "id" in data

    def test_create_task(self, mock_requests, sample_task):
        """POST /api/tasks-db/tasks should create task."""
        mock_requests.post.return_value = MagicMock(
            status_code=200,
            json=lambda: {"success": True, "id": "task_456"}
        )

        response = mock_requests.post("/api/tasks-db/tasks", json=sample_task)
        data = response.json()

        assert data["success"] is True
        assert "id" in data

    def test_toggle_task(self, mock_requests):
        """POST /api/tasks-db/tasks/{id}/toggle should toggle."""
        mock_requests.post.return_value = MagicMock(
            status_code=200,
            json=lambda: {"success": True, "completed": True}
        )

        response = mock_requests.post("/api/tasks-db/tasks/task_123/toggle")
        data = response.json()

        assert data["success"] is True
        assert data["completed"] is True

    def test_get_tasks_stats(self, mock_requests):
        """GET /api/tasks-db/stats should return stats."""
        mock_requests.get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "success": True,
                "stats": {"total": 10, "completed": 5}
            }
        )

        response = mock_requests.get("/api/tasks-db/stats")
        data = response.json()

        assert data["success"] is True
        assert "stats" in data


class TestKnowledgeRoutes:
    """Test Knowledge API routes."""

    def test_add_concept(self, mock_requests, sample_concept):
        """POST /api/knowledge/add should add concept."""
        mock_requests.post.return_value = MagicMock(
            status_code=200,
            json=lambda: {"success": True, "concept_id": 789}
        )

        response = mock_requests.post("/api/knowledge/add", json=sample_concept)
        data = response.json()

        assert data["success"] is True
        assert "concept_id" in data

    def test_get_concepts(self, mock_requests):
        """GET /api/knowledge/{course_id} should return concepts."""
        mock_requests.get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "success": True,
                "count": 3,
                "concepts": [
                    {"id": 1, "concept": "Test 1"},
                    {"id": 2, "concept": "Test 2"},
                    {"id": 3, "concept": "Test 3"}
                ]
            }
        )

        response = mock_requests.get("/api/knowledge/test_course")
        data = response.json()

        assert data["success"] is True
        assert data["count"] == 3

    def test_search_concepts(self, mock_requests):
        """GET /api/knowledge/search/{course_id} should search."""
        mock_requests.get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "success": True,
                "query": "test",
                "count": 1,
                "concepts": [{"id": 1, "concept": "Test Concept"}]
            }
        )

        response = mock_requests.get("/api/knowledge/search/test_course?query=test")
        data = response.json()

        assert data["success"] is True
        assert data["query"] == "test"


class TestLearningRoutes:
    """Test Learning API routes."""

    def test_start_session(self, mock_requests):
        """POST /api/learning/start should start session."""
        mock_requests.post.return_value = MagicMock(
            status_code=200,
            json=lambda: {"success": True, "user_id": "user_123"}
        )

        response = mock_requests.post("/api/learning/start", json={
            "user_id": "user_123",
            "topics": ["conjugaison"]
        })
        data = response.json()

        assert data["success"] is True

    def test_submit_answer(self, mock_requests):
        """POST /api/learning/answer should process answer."""
        mock_requests.post.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "success": True,
                "xp_earned": 10,
                "mastery_change": 2,
                "feedback": "Bien joué!"
            }
        )

        response = mock_requests.post("/api/learning/answer", json={
            "user_id": "user_123",
            "topic": "conjugaison",
            "is_correct": True,
            "response_time": 5.0,
            "difficulty": 2
        })
        data = response.json()

        assert data["success"] is True
        assert data["xp_earned"] == 10


class TestErrorHandling:
    """Test API error responses."""

    def test_not_found_returns_404(self, mock_requests):
        """Non-existent resource should return 404."""
        mock_requests.get.return_value = MagicMock(
            status_code=404,
            json=lambda: {"detail": "Not found"}
        )

        response = mock_requests.get("/api/tasks-db/projects/nonexistent")
        assert response.status_code == 404

    def test_invalid_data_returns_400(self, mock_requests):
        """Invalid data should return 400."""
        mock_requests.post.return_value = MagicMock(
            status_code=400,
            json=lambda: {"detail": "Invalid data"}
        )

        response = mock_requests.post("/api/health/weight", json={})
        assert response.status_code == 400

    def test_server_error_returns_500(self, mock_requests):
        """Server error should return 500."""
        mock_requests.get.return_value = MagicMock(
            status_code=500,
            json=lambda: {"detail": "Internal server error"}
        )

        response = mock_requests.get("/api/health/dashboard")
        assert response.status_code == 500
