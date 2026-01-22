"""
E2E Framework Base - Core classes, fixtures, and utilities.
"""

import time
import functools
import traceback
from datetime import datetime
from typing import Dict, List, Optional, Any, Callable, Set
from dataclasses import dataclass, field
from enum import Enum
from contextlib import contextmanager


class TestMode(Enum):
    """Test execution mode"""
    DIRECT = "direct"  # Direct Python calls (no server needed)
    API = "api"        # HTTP API calls (requires running server)


@dataclass
class TestConfig:
    """E2E test configuration"""
    mode: TestMode = TestMode.DIRECT
    api_url: str = "http://localhost:8000"
    num_days: int = 14
    questions_per_day: int = 15
    topics: List[str] = field(default_factory=lambda: [
        "conjugaison", "grammaire", "vocabulaire", "orthographe"
    ])
    verbose: bool = True
    fail_fast: bool = False
    timeout_seconds: int = 30
    max_retries: int = 3
    retry_delay: float = 0.5


@dataclass
class TestResult:
    """Result of a single test"""
    name: str
    passed: bool
    duration_ms: float
    message: str = ""
    details: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None
    retries: int = 0

    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "passed": self.passed,
            "duration_ms": round(self.duration_ms, 2),
            "message": self.message,
            "error": self.error,
            "retries": self.retries,
        }


@dataclass
class TestReport:
    """Complete test report"""
    start_time: datetime
    end_time: Optional[datetime] = None
    config: Optional[TestConfig] = None
    results: List[TestResult] = field(default_factory=list)
    scenario: str = "all"

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

    @property
    def total_duration_ms(self) -> float:
        return sum(r.duration_ms for r in self.results)

    def add_result(self, result: TestResult):
        self.results.append(result)

    def to_dict(self) -> Dict:
        return {
            "scenario": self.scenario,
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
                "success_rate": f"{self.success_rate * 100:.1f}%",
                "duration_ms": round(self.total_duration_ms, 2),
            },
            "results": [r.to_dict() for r in self.results],
        }

    def print_summary(self):
        """Print formatted summary to console"""
        print("\n" + "=" * 60)
        print(f"E2E TEST REPORT - {self.scenario.upper()}")
        print("=" * 60)
        print(f"Total: {self.total} | Passed: {self.passed} | Failed: {self.failed}")
        print(f"Success Rate: {self.success_rate * 100:.1f}%")
        print(f"Duration: {self.total_duration_ms / 1000:.2f}s")
        print("-" * 60)

        for r in self.results:
            status = "✓" if r.passed else "✗"
            print(f"  {status} {r.name} ({r.duration_ms:.0f}ms)")
            if r.error and not r.passed:
                print(f"      Error: {r.error[:80]}")

        print("=" * 60 + "\n")


class CleanupRegistry:
    """Tracks resources for cleanup after tests"""

    def __init__(self):
        self._user_ids: Set[str] = set()
        self._project_ids: Set[str] = set()
        self._task_ids: Set[str] = set()
        self._cleanup_funcs: List[Callable] = []

    def register_user(self, user_id: str):
        self._user_ids.add(user_id)

    def register_project(self, project_id: str):
        if project_id:
            self._project_ids.add(project_id)

    def register_task(self, task_id: str):
        if task_id:
            self._task_ids.add(task_id)

    def register_cleanup(self, func: Callable):
        self._cleanup_funcs.append(func)

    def cleanup_all(self, adapter: 'UniversalAdapter'):
        """Execute all cleanup operations"""
        errors = []

        # Cleanup users (Learning Engine)
        for user_id in self._user_ids:
            try:
                from services.learning_engine_lean import lean_engine
                lean_engine.delete_state(user_id)
            except Exception as e:
                errors.append(f"User {user_id}: {e}")

        # Cleanup tasks
        for task_id in self._task_ids:
            try:
                adapter.delete(f"/api/tasks-db/tasks/{task_id}")
            except Exception as e:
                errors.append(f"Task {task_id}: {e}")

        # Cleanup projects
        for project_id in self._project_ids:
            try:
                adapter.delete(f"/api/tasks-db/projects/{project_id}")
            except Exception as e:
                errors.append(f"Project {project_id}: {e}")

        # Run custom cleanup functions
        for func in self._cleanup_funcs:
            try:
                func()
            except Exception as e:
                errors.append(f"Custom cleanup: {e}")

        # Clear registries
        self._user_ids.clear()
        self._project_ids.clear()
        self._task_ids.clear()
        self._cleanup_funcs.clear()

        return errors


def with_cleanup(func: Callable) -> Callable:
    """Decorator that ensures cleanup runs after test"""
    @functools.wraps(func)
    def wrapper(self, *args, **kwargs):
        try:
            return func(self, *args, **kwargs)
        finally:
            if hasattr(self, 'cleanup'):
                self.cleanup.cleanup_all(self.adapter)
    return wrapper


def e2e_test(name: str = None, retries: int = None):
    """Decorator to mark and configure E2E tests"""
    def decorator(func: Callable) -> Callable:
        func._e2e_test = True
        func._e2e_name = name or func.__name__.replace("test_", "").replace("_", " ").title()
        func._e2e_retries = retries
        return func
    return decorator


def retry_on_failure(max_retries: int = 3, delay: float = 0.5):
    """Decorator for retrying flaky tests"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_error = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_error = e
                    if attempt < max_retries - 1:
                        time.sleep(delay)
            raise last_error
        return wrapper
    return decorator


class E2ERunner:
    """Main E2E test runner"""

    def __init__(self, config: TestConfig = None):
        self.config = config or TestConfig()
        self.cleanup = CleanupRegistry()
        self._adapter = None
        self._report: Optional[TestReport] = None

    @property
    def adapter(self) -> 'UniversalAdapter':
        if self._adapter is None:
            from .adapter import UniversalAdapter
            self._adapter = UniversalAdapter(self.config)
        return self._adapter

    def generate_id(self, prefix: str = "e2e") -> str:
        """Generate unique test ID"""
        return f"{prefix}_{int(time.time() * 1000)}"

    def run_test(
        self,
        name: str,
        test_func: Callable,
        success_message: str = "Passed",
        max_retries: int = None
    ) -> TestResult:
        """Run a single test with timing and error handling"""
        retries = max_retries or self.config.max_retries
        attempts = 0
        last_error = None

        while attempts < retries:
            start = time.time()
            try:
                result = test_func()
                duration = (time.time() - start) * 1000

                if result is True or result is None:
                    return TestResult(
                        name=name,
                        passed=True,
                        duration_ms=duration,
                        message=success_message,
                        retries=attempts,
                    )
                else:
                    return TestResult(
                        name=name,
                        passed=False,
                        duration_ms=duration,
                        message=str(result) if result else "Test returned falsy value",
                        retries=attempts,
                    )

            except AssertionError as e:
                duration = (time.time() - start) * 1000
                return TestResult(
                    name=name,
                    passed=False,
                    duration_ms=duration,
                    error=str(e),
                    retries=attempts,
                )

            except Exception as e:
                last_error = e
                attempts += 1
                if attempts < retries:
                    time.sleep(self.config.retry_delay)

        duration = (time.time() - start) * 1000
        return TestResult(
            name=name,
            passed=False,
            duration_ms=duration,
            error=f"Failed after {retries} attempts: {last_error}",
            retries=attempts,
        )

    def assert_true(self, condition: bool, message: str = "Assertion failed") -> bool:
        """Assert helper that raises on failure"""
        if not condition:
            raise AssertionError(message)
        return True

    def assert_equal(self, actual, expected, message: str = None) -> bool:
        """Assert equality"""
        if actual != expected:
            msg = message or f"Expected {expected}, got {actual}"
            raise AssertionError(msg)
        return True

    def assert_greater(self, actual, threshold, message: str = None) -> bool:
        """Assert greater than"""
        if actual <= threshold:
            msg = message or f"Expected {actual} > {threshold}"
            raise AssertionError(msg)
        return True

    def assert_in(self, item, container, message: str = None) -> bool:
        """Assert item in container"""
        if item not in container:
            msg = message or f"Expected {item} in {container}"
            raise AssertionError(msg)
        return True

    def run_scenario(self, scenario: str) -> TestReport:
        """Run a specific test scenario"""
        self._report = TestReport(
            start_time=datetime.now(),
            config=self.config,
            scenario=scenario,
        )

        try:
            if scenario == "learning":
                from .learning import LearningTests
                tests = LearningTests(self)
                tests.run_all()

            elif scenario == "tasks":
                from .tasks import TasksTests
                tests = TasksTests(self)
                tests.run_all()

            elif scenario == "health":
                from .health import HealthTests
                tests = HealthTests(self)
                tests.run_all()

            elif scenario == "simulation":
                # Simulation now handled via CLI --user option
                pass

            elif scenario == "navigation":
                from .navigation import NavigationTests
                tests = NavigationTests(self)
                tests.run_all()

            elif scenario == "all":
                self.run_all()

            else:
                raise ValueError(f"Unknown scenario: {scenario}")

        finally:
            self._report.end_time = datetime.now()
            self.cleanup.cleanup_all(self.adapter)

        return self._report

    def run_all(self) -> TestReport:
        """Run all test scenarios"""
        if self._report is None:
            self._report = TestReport(
                start_time=datetime.now(),
                config=self.config,
                scenario="all",
            )

        scenarios = ["learning", "tasks", "health"]

        for scenario in scenarios:
            try:
                if scenario == "learning":
                    from .learning import LearningTests
                    tests = LearningTests(self)
                    tests.run_all()

                elif scenario == "tasks":
                    from .tasks import TasksTests
                    tests = TasksTests(self)
                    tests.run_all()

                elif scenario == "health":
                    from .health import HealthTests
                    tests = HealthTests(self)
                    tests.run_all()

            except ImportError as e:
                if self.config.verbose:
                    print(f"Skipping {scenario}: {e}")

        self._report.end_time = datetime.now()
        return self._report

    def add_result(self, result: TestResult):
        """Add a test result to current report"""
        if self._report:
            self._report.add_result(result)
        if self.config.verbose:
            status = "✓" if result.passed else "✗"
            print(f"  {status} {result.name} ({result.duration_ms:.0f}ms)")

    @contextmanager
    def test_context(self, name: str):
        """Context manager for test with automatic timing"""
        start = time.time()
        error = None
        try:
            yield
        except Exception as e:
            error = e
        finally:
            duration = (time.time() - start) * 1000
            result = TestResult(
                name=name,
                passed=error is None,
                duration_ms=duration,
                error=str(error) if error else None,
            )
            self.add_result(result)
