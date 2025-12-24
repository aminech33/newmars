#!/bin/zsh

# 🚀 Script de lancement rapide du backend NewMars
# Lance le serveur avec ChatGPT

set -e

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

clear

echo "${CYAN}${BOLD}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                                 ║
║           🚀 NEWMARS BACKEND - CHATGPT SERVER 🚀               ║
║                                                                 ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo "${NC}\n"

# Aller dans le dossier backend
BACKEND_DIR="/Users/aminecb/Desktop/newmars/backend"
cd "$BACKEND_DIR" || {
    echo "${RED}❌ Impossible d'accéder au dossier backend${NC}"
    exit 1
}

echo "${CYAN}📁 Dossier : $PWD${NC}\n"

# Vérifier que .env existe
if [[ ! -f ".env" ]]; then
    echo "${RED}❌ Fichier .env manquant !${NC}"
    echo "${YELLOW}⚠️  Lancez d'abord le script de configuration :${NC}"
    echo "   ${GREEN}./setup_chatgpt.sh${NC}\n"
    exit 1
fi

# Vérifier que la clé API est configurée
if ! grep -q "^OPENAI_API_KEY=sk-" .env; then
    echo "${YELLOW}⚠️  Clé API OpenAI non configurée ou invalide${NC}"
    echo "${YELLOW}⚠️  Éditez le fichier .env et ajoutez votre clé :${NC}"
    echo "   ${GREEN}nano .env${NC}"
    echo ""
    echo "   Ajoutez : ${BOLD}OPENAI_API_KEY=sk-votre_clé_ici${NC}\n"
    exit 1
fi

# Afficher les infos
API_KEY=$(grep "^OPENAI_API_KEY=" .env | cut -d'=' -f2)
echo "${GREEN}✅ Clé API configurée : ${API_KEY:0:10}...${API_KEY: -4}${NC}"
echo "${GREEN}✅ Modèle IA : GPT-4o-mini${NC}"
echo "${GREEN}✅ Python : $(python3 --version | cut -d' ' -f2)${NC}\n"

echo "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${CYAN}${BOLD}   Démarrage du serveur...${NC}"
echo "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "${YELLOW}📡 Serveur accessible sur :${NC}"
echo "   • API        : ${CYAN}http://localhost:8000${NC}"
echo "   • Docs       : ${CYAN}http://localhost:8000/docs${NC}"
echo "   • Health     : ${CYAN}http://localhost:8000/health${NC}\n"

echo "${YELLOW}Pour arrêter le serveur : ${BOLD}Ctrl+C${NC}\n"

sleep 1

# Lancer le serveur
python3 main.py



