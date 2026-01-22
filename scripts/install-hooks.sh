#!/bin/bash
#
# Installation des git hooks pour NewMars
#
# Ce script installe les hooks git qui valident automatiquement
# que le code respecte les guidelines avant chaque commit.
#
# Usage:
#   ./scripts/install-hooks.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

echo "🔧 Installation des git hooks pour NewMars..."
echo ""

# Vérifier qu'on est dans un repo git
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo "❌ Erreur: Ce n'est pas un dépôt git"
    echo "   Lancez 'git init' d'abord"
    exit 1
fi

# Créer le répertoire hooks s'il n'existe pas
mkdir -p "$HOOKS_DIR"

# ============================================================
# PRE-COMMIT HOOK
# ============================================================

PRE_COMMIT_FILE="$HOOKS_DIR/pre-commit"

cat > "$PRE_COMMIT_FILE" << 'EOF'
#!/bin/bash
#
# Pre-commit hook NewMars
# Valide que le code respecte les guidelines avant chaque commit
#

set -e

echo "🔍 Validation des guidelines NewMars..."

# Trouver la racine du projet
PROJECT_ROOT="$(git rev-parse --show-toplevel)"

# Lancer la validation
python3 -m scripts.validation

if [ $? -ne 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ Validation échouée"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Le code viole les guidelines du projet."
    echo "Corrigez les erreurs ci-dessus avant de commiter."
    echo ""
    echo "Pour contourner temporairement (déconseillé):"
    echo "  git commit --no-verify"
    echo ""
    exit 1
fi

echo ""
echo "✅ Validation réussie"
echo ""

exit 0
EOF

# Rendre exécutable
chmod +x "$PRE_COMMIT_FILE"

echo "✅ Pre-commit hook installé: $PRE_COMMIT_FILE"
echo ""

# ============================================================
# PRE-PUSH HOOK (optionnel, commenté par défaut)
# ============================================================

PRE_PUSH_FILE="$HOOKS_DIR/pre-push"

cat > "$PRE_PUSH_FILE" << 'EOF'
#!/bin/bash
#
# Pre-push hook NewMars (désactivé par défaut)
# Décommentez pour valider avant chaque push
#

# set -e
#
# echo "🔍 Validation avant push..."
#
# PROJECT_ROOT="$(git rev-parse --show-toplevel)"
#
# # Lancer la validation en mode strict
# python3 -m scripts.validation --strict
#
# if [ $? -ne 0 ]; then
#     echo ""
#     echo "❌ Validation stricte échouée. Corrigez avant de pusher."
#     echo ""
#     exit 1
# fi
#
# echo "✅ Validation stricte réussie"

exit 0
EOF

chmod +x "$PRE_PUSH_FILE"

echo "ℹ️  Pre-push hook créé (désactivé): $PRE_PUSH_FILE"
echo "   Pour l'activer, décommentez le contenu du fichier"
echo ""

# ============================================================
# RÉSUMÉ
# ============================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Installation terminée"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Hooks installés:"
echo "  ✅ pre-commit  - Validation automatique avant chaque commit"
echo "  ℹ️  pre-push   - Validation stricte (désactivée)"
echo ""
echo "Test du hook:"
echo "  python3 scripts/validate-guidelines.py"
echo ""
echo "Pour désactiver temporairement:"
echo "  git commit --no-verify"
echo ""
