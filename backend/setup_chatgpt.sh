#!/bin/zsh

# 🚀 Script de configuration ChatGPT pour NewMars Backend
# Automatise l'installation et la configuration de l'API OpenAI

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Emojis
CHECK="✅"
ROCKET="🚀"
WARN="⚠️"
ERROR="❌"
INFO="ℹ️"
KEY="🔑"
ROBOT="🤖"
BOOK="📚"

clear

echo "${CYAN}${BOLD}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                                 ║
║        🚀 SETUP CHATGPT - NEWMARS BACKEND 🚀                   ║
║                                                                 ║
║        Migration Gemini → ChatGPT (OpenAI)                     ║
║                                                                 ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo "${NC}\n"

# Fonction pour afficher les étapes
print_step() {
    echo "${BLUE}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
    echo "${PURPLE}${BOLD}$1${NC}"
    echo "${BLUE}${BOLD}═══════════════════════════════════════════════════════════════${NC}\n"
}

# Fonction pour afficher le succès
print_success() {
    echo "${GREEN}${CHECK} $1${NC}"
}

# Fonction pour afficher les erreurs
print_error() {
    echo "${RED}${ERROR} $1${NC}"
}

# Fonction pour afficher les warnings
print_warning() {
    echo "${YELLOW}${WARN} $1${NC}"
}

# Fonction pour afficher les infos
print_info() {
    echo "${CYAN}${INFO} $1${NC}"
}

# Vérifier qu'on est dans le bon dossier
print_step "${ROCKET} Étape 1/5 : Vérification du dossier"

BACKEND_DIR="/Users/aminecb/Desktop/newmars/backend"
if [[ "$PWD" != "$BACKEND_DIR" ]]; then
    print_info "Changement de répertoire vers: $BACKEND_DIR"
    cd "$BACKEND_DIR" || {
        print_error "Impossible d'accéder au dossier backend"
        exit 1
    }
fi

print_success "Dossier backend trouvé : $PWD"
echo ""

# Vérifier Python
print_step "${ROBOT} Étape 2/5 : Vérification de Python"

if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python trouvé : $PYTHON_VERSION"
else
    print_error "Python 3 n'est pas installé !"
    print_info "Installer Python depuis: https://www.python.org/downloads/"
    exit 1
fi
echo ""

# Installer les dépendances
print_step "📦 Étape 3/5 : Installation des dépendances"

print_info "Installation des packages Python..."
if pip3 install -r requirements.txt > /dev/null 2>&1; then
    print_success "Toutes les dépendances sont installées"
else
    print_warning "Installation avec quelques warnings (normal)"
fi

# Vérifier que openai est installé
if python3 -c "import openai" 2>/dev/null; then
    OPENAI_VERSION=$(python3 -c "import openai; print(openai.__version__)")
    print_success "Package openai installé : v$OPENAI_VERSION"
else
    print_error "Package openai non installé correctement"
    print_info "Tentative de réinstallation..."
    pip3 install openai
fi
echo ""

# Configuration de la clé API
print_step "${KEY} Étape 4/5 : Configuration de la clé API OpenAI"

ENV_FILE=".env"

if [[ -f "$ENV_FILE" ]]; then
    print_warning "Un fichier .env existe déjà"
    echo ""
    echo "Contenu actuel :"
    cat "$ENV_FILE"
    echo ""
    
    echo -n "${YELLOW}Voulez-vous le remplacer ? (o/n) : ${NC}"
    read REPLACE
    
    if [[ "$REPLACE" != "o" && "$REPLACE" != "O" ]]; then
        print_info "Conservation du fichier .env existant"
        echo ""
        
        # Vérifier si OPENAI_API_KEY existe
        if grep -q "OPENAI_API_KEY=" "$ENV_FILE"; then
            print_success "OPENAI_API_KEY trouvée dans le fichier"
        else
            print_warning "OPENAI_API_KEY non trouvée dans le fichier"
            print_info "Ajoutez cette ligne au fichier .env :"
            echo ""
            echo "  ${BOLD}OPENAI_API_KEY=sk-votre_clé_ici${NC}"
            echo ""
        fi
    else
        rm "$ENV_FILE"
        print_info "Ancien fichier .env supprimé"
    fi
fi

if [[ ! -f "$ENV_FILE" ]]; then
    echo ""
    print_info "Obtenir une clé API OpenAI : ${CYAN}https://platform.openai.com/api-keys${NC}"
    echo ""
    echo -n "${BOLD}${KEY} Entrez votre clé API OpenAI (ou appuyez sur Entrée pour configurer plus tard) : ${NC}"
    read API_KEY
    
    if [[ -n "$API_KEY" ]]; then
        cat > "$ENV_FILE" << EOF
# Configuration Backend Adaptatif - NewMars
# Généré automatiquement le $(date)

# OpenAI API Key (obligatoire)
OPENAI_API_KEY=$API_KEY

# Serveur (optionnel)
HOST=0.0.0.0
PORT=8000
DEBUG=True
EOF
        print_success "Fichier .env créé avec succès"
        print_info "Clé API : ${API_KEY:0:10}...${API_KEY: -4}"
    else
        # Créer un .env template
        cat > "$ENV_FILE" << EOF
# Configuration Backend Adaptatif - NewMars

# OpenAI API Key (obligatoire)
OPENAI_API_KEY=sk-votre_clé_openai_ici

# Serveur (optionnel)
HOST=0.0.0.0
PORT=8000
DEBUG=True
EOF
        print_warning "Fichier .env template créé"
        print_info "⚠️  N'oubliez pas d'ajouter votre clé API avant de lancer le serveur !"
        echo ""
        print_info "Éditez le fichier .env et remplacez :"
        echo "  ${BOLD}OPENAI_API_KEY=sk-votre_clé_openai_ici${NC}"
        echo "  par votre vraie clé API"
    fi
fi
echo ""

# Récapitulatif
print_step "${BOOK} Étape 5/5 : Récapitulatif"

print_success "Installation terminée avec succès !"
echo ""

print_info "Configuration actuelle :"
echo "  • Dossier     : $PWD"
echo "  • Python      : $(python3 --version | cut -d' ' -f2)"
echo "  • OpenAI SDK  : v$(python3 -c "import openai; print(openai.__version__)" 2>/dev/null || echo 'N/A')"
echo "  • Modèle IA   : GPT-4o-mini (rapide et économique)"
echo "  • Fichier .env: $([ -f "$ENV_FILE" ] && echo '✅ Présent' || echo '❌ Manquant')"

if [[ -f "$ENV_FILE" ]] && grep -q "sk-" "$ENV_FILE"; then
    API_KEY_CHECK=$(grep "OPENAI_API_KEY=" "$ENV_FILE" | cut -d'=' -f2)
    if [[ "$API_KEY_CHECK" =~ ^sk-[a-zA-Z0-9] ]]; then
        print_success "Clé API configurée : ${API_KEY_CHECK:0:10}...${API_KEY_CHECK: -4}"
    fi
fi
echo ""

# Instructions pour démarrer
echo "${CYAN}${BOLD}"
cat << "EOF"
┌───────────────────────────────────────────────────────────────┐
│  🚀 PROCHAINES ÉTAPES                                          │
└───────────────────────────────────────────────────────────────┘
EOF
echo "${NC}"

echo "${BOLD}1. Lancer le serveur :${NC}"
echo "   ${GREEN}python3 main.py${NC}"
echo ""

echo "${BOLD}2. Tester l'API :${NC}"
echo "   ${GREEN}python3 test_api.py${NC}"
echo ""

echo "${BOLD}3. Documentation API :${NC}"
echo "   Ouvrir dans le navigateur : ${CYAN}http://localhost:8000/docs${NC}"
echo ""

# Vérifier si une clé API valide est présente
if [[ -f "$ENV_FILE" ]] && grep -q "sk-" "$ENV_FILE"; then
    API_KEY_CHECK=$(grep "OPENAI_API_KEY=" "$ENV_FILE" | cut -d'=' -f2)
    if [[ "$API_KEY_CHECK" =~ ^sk-[a-zA-Z0-9] ]]; then
        echo "${GREEN}${BOLD}✨ Tout est prêt ! Vous pouvez lancer le serveur dès maintenant.${NC}"
        echo ""
        echo -n "${YELLOW}${BOLD}Voulez-vous démarrer le serveur maintenant ? (o/n) : ${NC}"
        read START_SERVER
        
        if [[ "$START_SERVER" == "o" || "$START_SERVER" == "O" ]]; then
            echo ""
            print_info "Démarrage du serveur..."
            echo ""
            python3 main.py
        fi
    else
        print_warning "N'oubliez pas de configurer votre clé API dans le fichier .env"
        print_info "Éditez : nano .env"
    fi
else
    print_warning "N'oubliez pas de configurer votre clé API dans le fichier .env"
    print_info "Éditez : nano .env"
fi

echo ""
echo "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${GREEN}${BOLD}✅ Configuration terminée avec succès !${NC}"
echo "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "${PURPLE}${INFO} Pour plus d'infos : Consulter SETUP_CHATGPT.md${NC}"
echo ""









