"""
pytest configuration and fixtures for E2E testing.
Provides isolated test database, cleanup, and user simulation.
"""
import pytest
import sqlite3
import tempfile
import shutil
import os
import sys
from pathlib import Path
from typing import Generator, Dict, Any
from unittest.mock import MagicMock, patch
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))


# =============================================================================
# DATABASE FIXTURES
# =============================================================================

@pytest.fixture(scope="session")
def test_db_dir() -> Generator[Path, None, None]:
    """Create a temporary directory for test databases."""
    temp_dir = Path(tempfile.mkdtemp(prefix="test_mars_"))
    yield temp_dir
    # Cleanup after all tests
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture(scope="function")
def test_db_path(test_db_dir: Path) -> Generator[str, None, None]:
    """Create a fresh test database for each test."""
    db_path = test_db_dir / f"test_{datetime.now().strftime('%H%M%S%f')}.db"
    yield str(db_path)
    # Cleanup after each test
    if db_path.exists():
        db_path.unlink()


@pytest.fixture(scope="function")
def learning_db(test_db_path: str):
    """Isolated Learning Engine with test database."""
    from services.learning_engine_lean import LeanLearningEngine
    engine = LeanLearningEngine(db_path=test_db_path)
    yield engine
    # Cleanup: close any connections
    del engine


@pytest.fixture(scope="function")
def tasks_db(test_db_path: str):
    """Isolated Tasks database."""
    from databases.tasks_database import TasksDatabase
    db = TasksDatabase(db_path=test_db_path)
    yield db


@pytest.fixture(scope="function")
def health_db(test_db_path: str):
    """Isolated Health database."""
    from databases.health_database import HealthDatabase
    db = HealthDatabase(db_path=test_db_path)
    yield db


# =============================================================================
# USER SIMULATION FIXTURES
# =============================================================================

@pytest.fixture
def user_simulator():
    """Factory fixture for creating user simulators."""
    from test_e2e_framework import UserSimulator

    simulators = []

    def _create_simulator(behavior: str = "average", user_id: str = None):
        sim = UserSimulator(user_id=user_id, behavior=behavior)
        simulators.append(sim)
        return sim

    yield _create_simulator

    # Cleanup all created simulators
    for sim in simulators:
        try:
            sim.cleanup()
        except:
            pass


@pytest.fixture
def motivated_user(user_simulator):
    """Pre-configured motivated user simulator."""
    return user_simulator("motivated")


@pytest.fixture
def struggling_user(user_simulator):
    """Pre-configured struggling user simulator."""
    return user_simulator("struggling")


@pytest.fixture
def average_user(user_simulator):
    """Pre-configured average user simulator."""
    return user_simulator("average")


# =============================================================================
# API MOCK FIXTURES
# =============================================================================

@pytest.fixture
def mock_openai():
    """Mock OpenAI API calls."""
    with patch("services.openai_service.OpenAI") as mock:
        mock_instance = MagicMock()
        mock_instance.chat.completions.create.return_value = MagicMock(
            choices=[MagicMock(message=MagicMock(content="Mocked AI response"))]
        )
        mock.return_value = mock_instance
        yield mock_instance


@pytest.fixture
def mock_requests():
    """Mock HTTP requests for API testing."""
    with patch("requests.Session") as mock:
        mock_session = MagicMock()
        mock_session.get.return_value = MagicMock(
            status_code=200,
            json=lambda: {"success": True}
        )
        mock_session.post.return_value = MagicMock(
            status_code=200,
            json=lambda: {"success": True, "id": "test_id"}
        )
        mock.return_value = mock_session
        yield mock_session


# =============================================================================
# TEST DATA FIXTURES
# =============================================================================

@pytest.fixture
def sample_project() -> Dict[str, Any]:
    """Sample project data."""
    return {
        "name": "Test Project",
        "color": "#6366f1",
        "icon": "🧪",
        "status": "todo"
    }


@pytest.fixture
def sample_task() -> Dict[str, Any]:
    """Sample task data."""
    return {
        "title": "Test Task",
        "priority": "high",
        "effort": "M",
        "status": "todo"
    }


@pytest.fixture
def sample_weight_entry() -> Dict[str, Any]:
    """Sample weight entry data."""
    return {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "weight": 75.5,
        "source": "test"
    }


@pytest.fixture
def sample_meal() -> Dict[str, Any]:
    """Sample meal data."""
    return {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "meal_type": "breakfast",
        "foods": [
            {"food_name": "Test Food", "grams": 100, "calories": 200}
        ]
    }


@pytest.fixture
def sample_concept() -> Dict[str, Any]:
    """Sample concept data."""
    return {
        "course_id": "test_course",
        "concept": "Test Concept",
        "definition": "A test concept for testing",
        "keywords": ["test", "concept"]
    }


# =============================================================================
# LEARNING ENGINE FIXTURES
# =============================================================================

@pytest.fixture
def topics() -> list:
    """Default topics for testing."""
    return ["conjugaison", "grammaire", "vocabulaire", "orthographe"]


@pytest.fixture
def user_with_session(learning_db, topics):
    """User with an active learning session."""
    user_id = f"test_user_{datetime.now().strftime('%H%M%S%f')}"

    # Start session
    learning_db._get_user_state(user_id)

    yield user_id, learning_db

    # Cleanup
    learning_db.delete_state(user_id)


@pytest.fixture
def user_with_history(learning_db, topics):
    """User with learning history (answers submitted)."""
    user_id = f"test_user_{datetime.now().strftime('%H%M%S%f')}"

    # Create session with history
    for topic in topics[:2]:
        for _ in range(5):
            learning_db.process_answer(
                user_id=user_id,
                topic_id=topic,
                is_correct=True,
                response_time=5.0,
                difficulty=2
            )

    yield user_id, learning_db

    # Cleanup
    learning_db.delete_state(user_id)


# =============================================================================
# UTILITY FIXTURES
# =============================================================================

@pytest.fixture
def unique_id():
    """Generate unique IDs for tests."""
    def _generate(prefix: str = "test") -> str:
        return f"{prefix}_{datetime.now().strftime('%H%M%S%f')}"
    return _generate


@pytest.fixture
def assert_eventually():
    """Assert a condition eventually becomes true (for async operations)."""
    import time

    def _assert(condition_fn, timeout: float = 5.0, interval: float = 0.1, message: str = ""):
        start = time.time()
        while time.time() - start < timeout:
            if condition_fn():
                return True
            time.sleep(interval)
        raise AssertionError(message or "Condition not met within timeout")

    return _assert


# =============================================================================
# PYTEST CONFIGURATION
# =============================================================================

def pytest_configure(config):
    """Configure pytest markers."""
    config.addinivalue_line("markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')")
    config.addinivalue_line("markers", "integration: marks tests as integration tests")
    config.addinivalue_line("markers", "unit: marks tests as unit tests")
    config.addinivalue_line("markers", "api: marks tests that require API")
    config.addinivalue_line("markers", "simulation: marks user simulation tests")


def pytest_collection_modifyitems(config, items):
    """Auto-mark tests based on their location."""
    for item in items:
        # Auto-mark based on file path
        if "test_unit" in str(item.fspath):
            item.add_marker(pytest.mark.unit)
        elif "test_integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
        elif "test_api" in str(item.fspath):
            item.add_marker(pytest.mark.api)
        elif "test_simulation" in str(item.fspath):
            item.add_marker(pytest.mark.simulation)


# =============================================================================
# CLEANUP HOOKS
# =============================================================================

@pytest.fixture(autouse=True)
def cleanup_test_data():
    """Auto-cleanup after each test."""
    yield
    # Any global cleanup can go here


@pytest.fixture(scope="session", autouse=True)
def cleanup_session():
    """Cleanup after entire test session."""
    yield
    # Session-level cleanup
    # Remove any test_ prefixed users from production DB
    try:
        from services.learning_engine_lean import lean_engine
        users = lean_engine.get_all_users()
        for user in users:
            if user.startswith("test_") or user.startswith("sim_") or user.startswith("e2e_"):
                lean_engine.delete_state(user)
    except:
        pass
