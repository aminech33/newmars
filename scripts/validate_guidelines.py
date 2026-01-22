#!/usr/bin/env python3
"""
Validation script for NewMars Guidelines
========================================

Validates that the codebase follows the architectural rules.

Usage:
    python scripts/validate_guidelines.py
    python scripts/validate_guidelines.py --module engine

Exit codes:
    0: All checks passed
    1: Violations found
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Tuple

# Colors for terminal output
RED = '\033[91m'
YELLOW = '\033[93m'
GREEN = '\033[92m'
BLUE = '\033[94m'
RESET = '\033[0m'


class ValidationError:
    """Represents a validation error with severity."""

    def __init__(self, severity: str, message: str, file_path: str = None):
        self.severity = severity  # ERROR or WARNING
        self.message = message
        self.file_path = file_path

    def __str__(self):
        color = RED if self.severity == "ERROR" else YELLOW
        prefix = f"{color}[{self.severity}]{RESET}"
        if self.file_path:
            return f"{prefix} {self.file_path}: {self.message}"
        return f"{prefix} {self.message}"


class GuidelinesValidator:
    """Validates codebase against guidelines."""

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.backend = project_root / "backend"
        self.errors: List[ValidationError] = []
        self.warnings: List[ValidationError] = []

    def add_error(self, message: str, file_path: str = None):
        """Add an error violation."""
        self.errors.append(ValidationError("ERROR", message, file_path))

    def add_warning(self, message: str, file_path: str = None):
        """Add a warning violation."""
        self.warnings.append(ValidationError("WARNING", message, file_path))

    # =========================================================================
    # LEARNING ENGINE VALIDATION
    # =========================================================================

    def validate_learning_engine(self):
        """Validate learning engine against guidelines."""
        print(f"{BLUE}=== Validating Learning Engine ==={RESET}\n")

        self._check_single_learning_engine()
        self._check_suppressed_modules()
        self._check_fsrs_reimplementation()
        self._check_lean_engine_structure()
        self._check_legacy_engine_imports()

    def _check_single_learning_engine(self):
        """Rule: Only ONE learning engine should exist (Lean in learning_engine/)"""
        print("✓ Checking single learning engine...")

        services_dir = self.backend / "services"

        # These legacy engine files should NOT exist in services/
        legacy_engine_files = [
            "advanced_learning_engine.py",
            "learning_engine_lean.py",  # Should be in learning_engine/ now
            "learning_engine_v1.py",
            "learning_engine_v2.py",
            "learning_engine_old.py"
        ]

        for engine_file in legacy_engine_files:
            path = services_dir / engine_file
            if path.exists():
                self.add_error(
                    f"Legacy learning engine found (should be in learning_engine/ module)",
                    str(path.relative_to(self.project_root))
                )

    def _check_suppressed_modules(self):
        """Rule: Suppressed modules should not exist or be imported"""
        print("✓ Checking suppressed modules...")

        suppressed_modules = [
            "forgetting_curve",
            "dual_coding",
            "chunking",
            "elaborative_interrogation",
            "emotional_encoding",
            "presleep_scheduling",
            "transfer_learning",
            "variation_practice",
            "confidence_tracking"
        ]

        utils_dir = self.backend / "utils"

        # Check if suppressed modules exist
        for module in suppressed_modules:
            path = utils_dir / f"{module}.py"
            if path.exists():
                self.add_error(
                    f"Suppressed module exists (should be deleted per Lean philosophy)",
                    str(path.relative_to(self.project_root))
                )

        # Check if suppressed modules are imported
        for py_file in self.backend.rglob("*.py"):
            content = py_file.read_text()

            for module in suppressed_modules:
                patterns = [
                    rf'from\s+utils\.{module}\s+import',
                    rf'import\s+utils\.{module}'
                ]

                for pattern in patterns:
                    if re.search(pattern, content):
                        self.add_error(
                            f"Import of suppressed module '{module}' found",
                            str(py_file.relative_to(self.project_root))
                        )
                        break

    def _check_fsrs_reimplementation(self):
        """Rule: Never reimplement FSRS algorithm outside learning_engine"""
        print("✓ Checking FSRS reimplementation...")

        # Skip learning_engine module itself
        learning_engine_dir = self.backend / "learning_engine"

        for py_file in self.backend.rglob("*.py"):
            # Skip files inside learning_engine module
            if learning_engine_dir in py_file.parents or py_file.parent == learning_engine_dir:
                continue

            content = py_file.read_text()

            # Look for FSRS-like patterns
            fsrs_patterns = [
                r'def\s+calculate_interval',
                r'def\s+fsrs_scheduler',
                r'stability\s*=.*difficulty',
                r'w[0-9]+\s*=\s*[0-9.]+.*w[0-9]+\s*=\s*[0-9.]+'  # Multiple w weights
            ]

            for pattern in fsrs_patterns:
                if re.search(pattern, content, re.MULTILINE):
                    self.add_warning(
                        f"Possible FSRS reimplementation detected (should use learning_engine module)",
                        str(py_file.relative_to(self.project_root))
                    )
                    break

    def _check_lean_engine_structure(self):
        """Rule: Verify Lean engine exists in learning_engine/ module"""
        print("✓ Checking Lean engine structure...")

        learning_engine_dir = self.backend / "learning_engine"
        lean_engine = learning_engine_dir / "learning_engine_lean.py"

        if not learning_engine_dir.exists():
            self.add_error(
                "learning_engine/ module not found",
                "backend/learning_engine/"
            )
            return

        if not lean_engine.exists():
            self.add_error(
                "learning_engine_lean.py not found in learning_engine module",
                "backend/learning_engine/learning_engine_lean.py"
            )
            return

        content = lean_engine.read_text()

        required_methods = [
            "get_next_question",
            "process_answer",
        ]

        for method in required_methods:
            pattern = rf'def\s+{method}\s*\('
            if not re.search(pattern, content):
                self.add_warning(
                    f"Required method '{method}' not found in Lean engine",
                    "backend/learning_engine/learning_engine_lean.py"
                )

    def _check_legacy_engine_imports(self):
        """Rule: No routes should use advanced_learning_engine"""
        print("✓ Checking routes for legacy engine usage...")

        routes_dir = self.backend / "routes"

        # Check for advanced_learning.py route file
        advanced_route = routes_dir / "advanced_learning.py"
        if advanced_route.exists():
            self.add_warning(
                "Legacy route file found (should use learning.py with Lean engine)",
                str(advanced_route.relative_to(self.project_root))
            )

        # Check all route files for advanced engine imports
        for py_file in routes_dir.glob("*.py"):
            content = py_file.read_text()

            if re.search(r'from\s+services\.advanced_learning_engine\s+import', content):
                self.add_error(
                    "Import of advanced_learning_engine found in routes (should use learning_engine module)",
                    str(py_file.relative_to(self.project_root))
                )

    # =========================================================================
    # CODE QUALITY VALIDATION
    # =========================================================================

    def validate_code_quality(self):
        """Validate general code quality rules."""
        print(f"\n{BLUE}=== Validating Code Quality ==={RESET}\n")

        self._check_temporary_test_files()
        self._check_pycache_files()

    def _check_temporary_test_files(self):
        """Rule: No test_simulation_*.py files at backend root"""
        print("✓ Checking temporary test files...")

        backend_root = self.backend

        for file in backend_root.glob("test_*.py"):
            # Allow test files in tests/ directory
            if "tests" not in file.parts:
                self.add_warning(
                    f"Test file at backend root (should be in tests/)",
                    str(file.relative_to(self.project_root))
                )

    def _check_pycache_files(self):
        """Rule: No __pycache__ should be committed"""
        print("✓ Checking for __pycache__ directories...")

        for pycache in self.backend.rglob("__pycache__"):
            if pycache.is_dir():
                self.add_warning(
                    "__pycache__ directory found (should be in .gitignore)",
                    str(pycache.relative_to(self.project_root))
                )

    # =========================================================================
    # REPORTING
    # =========================================================================

    def report(self):
        """Print validation report."""
        print(f"\n{BLUE}{'='*60}{RESET}")
        print(f"{BLUE}Validation Report{RESET}")
        print(f"{BLUE}{'='*60}{RESET}\n")

        if self.errors:
            print(f"{RED}❌ ERRORS: {len(self.errors)}{RESET}\n")
            for error in self.errors:
                print(f"  {error}")
            print()

        if self.warnings:
            print(f"{YELLOW}⚠️  WARNINGS: {len(self.warnings)}{RESET}\n")
            for warning in self.warnings:
                print(f"  {warning}")
            print()

        if not self.errors and not self.warnings:
            print(f"{GREEN}✅ All checks passed!{RESET}\n")
            print(f"{GREEN}Codebase follows guidelines perfectly.{RESET}\n")
        else:
            print(f"{BLUE}{'='*60}{RESET}")
            print(f"Total issues: {RED}{len(self.errors)} errors{RESET}, {YELLOW}{len(self.warnings)} warnings{RESET}\n")

        return len(self.errors) == 0


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description='Validate NewMars codebase against guidelines'
    )
    parser.add_argument(
        '--module',
        choices=['engine', 'quality', 'all'],
        default='all',
        help='Which module to validate (default: all)'
    )

    args = parser.parse_args()

    # Detect project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    print(f"{BLUE}NewMars Guidelines Validator{RESET}")
    print(f"Project: {project_root}\n")

    validator = GuidelinesValidator(project_root)

    # Run validations
    if args.module in ['engine', 'all']:
        validator.validate_learning_engine()

    if args.module in ['quality', 'all']:
        validator.validate_code_quality()

    # Report results
    success = validator.report()

    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
