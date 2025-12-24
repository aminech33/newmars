# 🚀 Scripts ZSH - Configuration ChatGPT

Scripts automatisés pour configurer et lancer le backend NewMars avec ChatGPT (OpenAI).

## 📦 Scripts disponibles

### 1️⃣ `setup_chatgpt.sh` - Configuration complète
Script interactif pour la première installation :
- ✅ Vérifie Python 3.10+
- ✅ Installe les dépendances (openai, fastapi, etc.)
- ✅ Configure le fichier `.env`
- ✅ Demande votre clé API OpenAI
- ✅ Propose de démarrer le serveur

### 2️⃣ `start.sh` - Lancement rapide
Script pour démarrer le serveur rapidement :
- ✅ Vérifie que `.env` est configuré
- ✅ Valide la clé API
- ✅ Lance le serveur sur http://localhost:8000

---

## 🎯 Utilisation rapide

### Première fois (configuration)
```bash
cd /Users/aminecb/Desktop/newmars/backend
./setup_chatgpt.sh
```

Le script vous guidera à travers toute la configuration.

### Utilisation quotidienne (démarrage)
```bash
cd /Users/aminecb/Desktop/newmars/backend
./start.sh
```

### Tests
```bash
cd /Users/aminecb/Desktop/newmars/backend
python3 test_api.py
```

---

## 🔑 Clé API OpenAI

### Obtenir une clé
1. Aller sur : https://platform.openai.com/api-keys
2. Créer un compte (gratuit)
3. Créer une nouvelle clé API
4. Copier la clé (format : `sk-...`)

### Configurer la clé

**Option 1 : Via le script (recommandé)**
```bash
./setup_chatgpt.sh
```

**Option 2 : Manuellement**
```bash
nano .env
```
Ajouter :
```
OPENAI_API_KEY=sk-votre_clé_ici
```

---

## 🤖 Modèle utilisé

Par défaut : **GPT-4o-mini**
- Rapide et économique (~0.15$ / 1M tokens)
- Excellent pour génération de questions
- Parfait pour le backend NewMars

Pour changer : Éditer `services/openai_service.py` ligne 20

---

## 📊 Vérification

### Le serveur fonctionne ?
```bash
curl http://localhost:8000
# Réponse attendue : {"message":"Backend Adaptatif - Newmars"}
```

### ChatGPT est connecté ?
```bash
curl http://localhost:8000/health
# Réponse attendue : {"status":"healthy","chatgpt":"connected"}
```

### Tests complets
```bash
python3 test_api.py
# Doit afficher : ✅ TOUS LES TESTS RÉUSSIS !
```

---

## 🐛 Dépannage

### Erreur : Permission denied
```bash
chmod +x setup_chatgpt.sh start.sh
```

### Erreur : openai module not found
```bash
pip3 install openai
```

### Erreur : Invalid API key
1. Vérifier dans `.env` que la clé commence par `sk-`
2. Pas d'espaces avant/après la clé
3. Relancer : `./setup_chatgpt.sh`

### Port 8000 déjà utilisé
```bash
# Tuer le processus
lsof -ti:8000 | xargs kill -9

# Ou changer le port dans .env
PORT=8001
```

---

## 📚 Documentation

- `GUIDE_SCRIPTS_ZSH.txt` - Guide détaillé des scripts
- `SETUP_CHATGPT.md` - Documentation complète de configuration
- `MIGRATION_CHATGPT.md` - Détails de la migration Gemini→ChatGPT
- `README.md` - Documentation générale du backend

---

## ✨ Fonctionnalités ChatGPT

Le backend utilise ChatGPT pour :
- 🎯 **Questions adaptatives** : Générées selon le niveau de l'utilisateur
- 💬 **Encouragements personnalisés** : Messages motivants après chaque réponse
- 📊 **Feedback intelligent** : Explications détaillées et indices

---

## 🎉 C'est prêt !

```bash
# Configuration (première fois)
./setup_chatgpt.sh

# Lancement (quotidien)
./start.sh

# Tests
python3 test_api.py
```

Le serveur sera disponible sur :
- **API** : http://localhost:8000
- **Docs** : http://localhost:8000/docs
- **Health** : http://localhost:8000/health

Bon développement ! 🚀

