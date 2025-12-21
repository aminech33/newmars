#!/bin/bash

# 🚀 Script de visualisation du document produit NewMars
# Usage: ./view-docs.sh [port]

set -e

PORT=${1:-8888}
DOCS_DIR="$(cd "$(dirname "$0")" && pwd)"
HTML_FILE="product-reference-v1.html"

echo "📚 NewMars Documentation Viewer"
echo "================================"
echo ""
echo "📂 Dossier: $DOCS_DIR"
echo "🌐 Port: $PORT"
echo ""

# Vérifier que le fichier existe
if [ ! -f "$DOCS_DIR/$HTML_FILE" ]; then
    echo "❌ Erreur: $HTML_FILE introuvable dans $DOCS_DIR"
    exit 1
fi

echo "✅ Fichier trouvé: $HTML_FILE"
echo ""

# Vérifier que le port est disponible
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Le port $PORT est déjà utilisé."
    echo "   Essayez: ./view-docs.sh $(($PORT + 1))"
    exit 1
fi

echo "🚀 Démarrage du serveur HTTP..."
echo ""
echo "📖 Document disponible à:"
echo "   → http://localhost:$PORT/$HTML_FILE"
echo ""
echo "💡 Fonctionnalités disponibles:"
echo "   • Recherche: Ctrl/Cmd + K"
echo "   • Dark mode: Cliquez sur 🌙/☀️"
echo "   • Export PDF: Cliquez sur 🖨️"
echo "   • Menu mobile: Cliquez sur ☰ (<1024px)"
echo ""
echo "⏹️  Pour arrêter: Ctrl + C"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Démarrer le serveur
cd "$DOCS_DIR"
python3 -m http.server $PORT

