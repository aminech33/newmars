"""
E2E User Simulator - Simple autonomous user simulation.

Usage:
    from e2e import AutonomousUser, UniversalAdapter

    # Create and run a simulation
    user = AutonomousUser("human")  # or "motivated", "average", etc.
    adapter = UniversalAdapter()
    user.live_week(adapter, days=7)
    print(user.get_stats())

CLI:
    python -m e2e --user human --days 7
"""

from .adapter import UniversalAdapter
from .autonomous_user import AutonomousUser, UserProfile, PROFILES

__version__ = "5.0"

# Constants
DEFAULT_TOPICS = ["conjugaison", "grammaire", "vocabulaire", "orthographe"]
DIFFICULTY_RANGE = (1, 5)

__all__ = [
    "UniversalAdapter",
    "AutonomousUser",
    "UserProfile",
    "PROFILES",
    "DEFAULT_TOPICS",
    "DIFFICULTY_RANGE",
]
