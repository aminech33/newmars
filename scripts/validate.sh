#!/bin/bash
#
# Script wrapper pour lancer la validation des guidelines
#
# Usage:
#   ./scripts/validate.sh
#   ./scripts/validate.sh --strict

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"
python3 -m scripts.validation "$@"
