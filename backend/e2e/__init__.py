"""
E2E Test Framework v4.1 - Modular Architecture

Structure:
    e2e/
    ├── __init__.py          # This file - exports main components
    ├── base.py              # Base classes, fixtures, utilities
    ├── adapter.py           # UniversalAdapter (HTTP/Direct routing)
    ├── simulator.py         # UserSimulator for behavior testing
    ├── learning.py          # Learning Engine tests
    ├── tasks.py             # Tasks system tests
    ├── health.py            # Health tracking tests
    ├── knowledge.py         # Knowledge base tests
    └── navigation.py        # User journey tests

Usage:
    from e2e import E2ERunner, UniversalAdapter, UserSimulator

    runner = E2ERunner()
    runner.run_scenario("learning")
    runner.run_all()
"""

from .base import (
    E2ERunner,
    TestConfig,
    TestResult,
    TestReport,
    TestMode,
    e2e_test,
    with_cleanup,
)
from .adapter import UniversalAdapter
from .simulator import UserSimulator, BehaviorProfile

__version__ = "4.1"
__all__ = [
    "E2ERunner",
    "TestConfig",
    "TestResult",
    "TestReport",
    "TestMode",
    "UniversalAdapter",
    "UserSimulator",
    "BehaviorProfile",
    "e2e_test",
    "with_cleanup",
]
