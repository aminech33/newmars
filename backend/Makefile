# Makefile for Mars Backend

.PHONY: help install test test-unit test-integration test-simulation test-all test-fast coverage lint format clean

help:
	@echo "Mars Backend - Available commands:"
	@echo ""
	@echo "  === INSTALLATION ==="
	@echo "  make install        Install dependencies"
	@echo ""
	@echo "  === PYTEST TESTS ==="
	@echo "  make test           Run all tests (excluding slow)"
	@echo "  make test-unit      Run unit tests only"
	@echo "  make test-integration  Run integration tests only"
	@echo "  make test-simulation   Run simulation tests only"
	@echo "  make test-all       Run ALL tests including slow"
	@echo "  make test-fast      Run tests in parallel (faster)"
	@echo "  make coverage       Run tests with coverage report"
	@echo ""
	@echo "  === E2E FRAMEWORK v4.0 ==="
	@echo "  make e2e            Run all E2E tests"
	@echo "  make e2e-learning   Run learning E2E tests"
	@echo "  make e2e-tasks      Run tasks E2E tests"
	@echo "  make e2e-health     Run health E2E tests"
	@echo "  make e2e-navigation Run navigation E2E tests"
	@echo "  make e2e-discover   Discover all API routes"
	@echo ""
	@echo "  === USER SIMULATION ==="
	@echo "  make sim-motivated  Simulate motivated user (7 days)"
	@echo "  make sim-average    Simulate average user (7 days)"
	@echo "  make sim-struggling Simulate struggling user (7 days)"
	@echo "  make sim-all        Simulate all profiles"
	@echo ""
	@echo "  === CODE QUALITY ==="
	@echo "  make lint           Run linting checks"
	@echo "  make format         Format code with black"
	@echo "  make clean          Clean up cache files"
	@echo ""

install:
	pip install -r requirements.txt
	pip install -r requirements-dev.txt

# =============================================================================
# PYTEST TESTS
# =============================================================================

test:
	pytest -v -m "not slow"

test-unit:
	pytest tests/test_unit_*.py -v

test-integration:
	pytest tests/test_integration*.py -v -m "not slow"

test-simulation:
	pytest tests/test_simulation*.py -v -m "not slow"

test-api:
	pytest tests/test_api_*.py -v

test-all:
	pytest -v

test-fast:
	pytest -v -m "not slow" -n auto 2>/dev/null || pytest -v -m "not slow"

coverage:
	pytest --cov=. --cov-report=html --cov-report=term-missing -m "not slow"
	@echo ""
	@echo "Coverage report generated in htmlcov/"
	@echo "Open htmlcov/index.html in browser"

# =============================================================================
# E2E FRAMEWORK v4.0 (Modular)
# =============================================================================

e2e:
	python -m e2e --scenario all

e2e-learning:
	python -m e2e --scenario learning

e2e-tasks:
	python -m e2e --scenario tasks

e2e-health:
	python -m e2e --scenario health

e2e-navigation:
	python -m e2e --scenario navigation

e2e-simulation:
	python -m e2e --scenario simulation

e2e-discover:
	python -m e2e --discover

e2e-json:
	python -m e2e --json

# =============================================================================
# USER SIMULATION
# =============================================================================

sim-motivated:
	python -m e2e --simulate motivated --days 7

sim-average:
	python -m e2e --simulate average --days 7

sim-struggling:
	python -m e2e --simulate struggling --days 7

sim-expert:
	python -m e2e --simulate expert --days 7

sim-all:
	@echo "=== MOTIVATED ===" && python -m e2e --simulate motivated --days 7
	@echo ""
	@echo "=== AVERAGE ===" && python -m e2e --simulate average --days 7
	@echo ""
	@echo "=== STRUGGLING ===" && python -m e2e --simulate struggling --days 7

# =============================================================================
# CODE QUALITY
# =============================================================================

lint:
	flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
	flake8 . --count --exit-zero --max-complexity=10 --max-line-length=120 --statistics

format:
	black . --line-length 120
	isort . --profile black

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name htmlcov -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name ".coverage" -delete 2>/dev/null || true
	find . -type f -name "coverage.xml" -delete 2>/dev/null || true
	@echo "Cleaned up cache files"

# =============================================================================
# LEGACY (v3.x) - For backwards compatibility
# =============================================================================

legacy-e2e:
	python test_e2e_framework.py --scenario full

legacy-simulate:
	python test_e2e_framework.py --simulate motivated --sim-days 7
