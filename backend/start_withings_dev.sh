#!/bin/bash

# 🚀 Script de lancement rapide pour développement avec Withings
# Ce script lance backend + ngrok et affiche les instructions

echo "🚀 Lancement de l'environnement de développement Withings..."
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier si ngrok est installé
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}❌ ngrok n'est pas installé !${NC}"
    echo ""
    echo "Installation rapide :"
    echo "1. Télécharge : https://ngrok.com/download"
    echo "2. Déplace dans /usr/local/bin : sudo mv ~/Downloads/ngrok /usr/local/bin/"
    echo "3. Rends exécutable : sudo chmod +x /usr/local/bin/ngrok"
    echo ""
    echo "Puis relance ce script."
    exit 1
fi

echo -e "${GREEN}✅ ngrok est installé${NC}"

# Vérifier si le backend est déjà lancé
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  Le port 8000 est déjà utilisé${NC}"
    echo "Le backend semble déjà lancé."
else
    echo -e "${BLUE}🔵 Lancement du backend...${NC}"
    cd "$(dirname "$0")"
    python -m uvicorn main:app --reload --port 8000 &
    BACKEND_PID=$!
    echo -e "${GREEN}✅ Backend lancé (PID: $BACKEND_PID)${NC}"
    sleep 3
fi

# Lancer ngrok
echo ""
echo -e "${BLUE}🔵 Lancement de ngrok...${NC}"
ngrok http 8000 > /dev/null &
NGROK_PID=$!
sleep 2

# Récupérer l'URL ngrok
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -n 1)

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}❌ Impossible de récupérer l'URL ngrok${NC}"
    echo "Vérifie que ngrok est bien lancé sur http://localhost:4040"
    exit 1
fi

echo -e "${GREEN}✅ ngrok lancé : $NGROK_URL${NC}"
echo ""

# Afficher les instructions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}📋 CONFIGURATION WITHINGS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  Va sur : https://developer.withings.com/dashboard"
echo ""
echo "2️⃣  Configure la Callback URI :"
echo -e "    ${GREEN}$NGROK_URL/api/withings/callback${NC}"
echo ""
echo "3️⃣  Mets à jour ton fichier .env :"
echo -e "    ${GREEN}WITHINGS_REDIRECT_URI=$NGROK_URL/api/withings/callback${NC}"
echo ""
echo "4️⃣  Redémarre le backend (Ctrl+C puis relance)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}🔗 LIENS UTILES${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "📡 Swagger UI :     ${BLUE}$NGROK_URL/docs${NC}"
echo -e "🌐 ngrok Dashboard: ${BLUE}http://localhost:4040${NC}"
echo -e "🔧 Backend local:   ${BLUE}http://localhost:8000${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✨ Tout est prêt !${NC}"
echo ""
echo "Appuie sur Ctrl+C pour tout arrêter."
echo ""

# Garder le script actif
trap "echo ''; echo 'Arrêt des services...'; kill $NGROK_PID $BACKEND_PID 2>/dev/null; exit" INT TERM

# Attendre
wait

