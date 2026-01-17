# Makefile for Mars Backend

.PHONY: help install test test-unit test-integration test-simulation test-all test-fast coverage lint format clean

help:
	@echo "Mars Backend - Available commands:"
	@echo ""
	@echo "  make install        Install dependencies"
	@echo "  make test           Run all tests (excluding slow)"
	@echo "  make test-unit      Run unit tests only"
	@echo "  make test-integration  Run integration tests only"
	@echo "  make test-simulation   Run simulation tests only"
	@echo "  make test-all       Run ALL tests including slow"
	@echo "  make test-fast      Run tests in parallel (faster)"
	@echo "  make coverage       Run tests with coverage report"
	@echo "  make lint           Run linting checks"
	@echo "  make format         Format code with black"
	@echo "  make clean          Clean up cache files"
	@echo ""

install:
	pip install -r requirements.txt
	pip install -r requirements-dev.txt

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

# Simulation commands
simulate-motivated:
	python test_e2e_framework.py --simulate motivated --sim-days 7

simulate-struggling:
	python test_e2e_framework.py --simulate struggling --sim-days 7

simulate-all:
	@echo "=== Motivated ===" && python test_e2e_framework.py --simulate motivated --sim-days 7
	@echo "=== Average ===" && python test_e2e_framework.py --simulate average --sim-days 7
	@echo "=== Struggling ===" && python test_e2e_framework.py --simulate struggling --sim-days 7

# Legacy E2E framework commands
e2e:
	python test_e2e_framework.py --scenario full

e2e-learning:
	python test_e2e_framework.py --scenario learning

e2e-navigation:
	python test_e2e_framework.py --scenario navigation

discover-routes:
	python test_e2e_framework.py --discover
