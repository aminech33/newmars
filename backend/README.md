# 🧠 Backend Adaptatif - Apprentissage pour Procrastinateurs

Backend Python avec FastAPI et ChatGPT (OpenAI) pour un système d'apprentissage adaptatif intelligent.

## 🚀 Démarrage Rapide

### 1. Installation

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configuration

Créer un fichier `.env` :
```bash
cp env.example .env
```

Ajouter votre clé OpenAI API dans `.env` :
```
OPENAI_API_KEY=votre_clé_ici
```

### 3. Lancer le serveur

```bash
python main.py
```

Le serveur démarre sur : **http://localhost:8000**

## 📚 Documentation API

Une fois le serveur lancé :
- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc

## 🎯 Endpoints Principaux

### Démarrer une session
```bash
POST /api/learning/start-session
```

### Obtenir une question adaptée
```bash
GET /api/learning/next-question/{session_id}
```

### Soumettre une réponse
```bash
POST /api/learning/submit-answer/{session_id}
```

### Voir la progression
```bash
GET /api/learning/progress/{session_id}
```

## 🧠 Algorithmes Intelligents

### 1. SM-2++ (Spaced Repetition)

Répétition espacée optimisée pour procrastinateurs :
- ✅ Pénalité douce pour les skips (max -1 point)
- ✅ Difficulty decay automatique (-5% par jour)
- ✅ Forgiveness system (-10% intervalle par skip)
- ✅ Zone de Développement Proximal dynamique

### 2. Interleaving (Mode Révision Avancé) 🆕

Pratique entrelacée pour améliorer la rétention :
- 🔀 **+10-15% de rétention** à long terme
- 🧠 Mélange 2-3 topics pendant les révisions
- 🎯 S'active automatiquement si conditions remplies
- ⚠️ **Désactivé par défaut** (opt-in, révisions uniquement)

**Voir :** [INTERLEAVING_README.md](./INTERLEAVING_README.md) pour détails

### 3. Concept Mastery

Suivi granulaire de la maîtrise :
- 📊 Score 0-100% par topic
- 🎯 Sub-concepts tracking (détection des faiblesses)
- 📈 Adaptation dynamique de difficulté
- ⚡ Speed bonus (+1 à +3 points)

## 🤖 ChatGPT AI

Génération de questions adaptatives :
- Questions personnalisées selon le niveau
- Feedback encourageant pour procrastinateurs
- Ajustement dynamique de la difficulté
- Ton adaptatif selon le contexte

## 📦 Structure

```
backend/
├── main.py              # Point d'entrée FastAPI
├── config.py            # Configuration
├── models/              # Modèles Pydantic
│   ├── user.py
│   ├── course.py
│   └── learning.py      # + Interleaving models
├── services/            # Services (ChatGPT)
│   └── openai_service.py
├── routes/              # Routes API
│   └── learning.py      # + Interleaving logic
└── utils/               # Utilitaires
    ├── sm2_algorithm.py # Algorithme SM-2++
    └── interleaving.py  # 🆕 Interleaving algorithm
```

## 🔧 Technologies

- **FastAPI** : Framework web moderne
- **Pydantic** : Validation de données
- **ChatGPT AI** : Génération de contenu
- **Uvicorn** : Serveur ASGI
- **Python 3.9+** : Langage

## 📖 Documentation Complète

- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Architecture détaillée
- **[INTERLEAVING_README.md](./INTERLEAVING_README.md)** - Mode révision avancé 🆕
- **[QUICKSTART.md](./QUICKSTART.md)** - Guide rapide avec exemples

## 🧪 Tests

```bash
# Tester l'API complète
python test_api.py

# Tester l'interleaving
python test_interleaving.py
```

## 📝 Licence

MIT
