# 🧠 Backend Adaptatif - Apprentissage pour Procrastinateurs

Backend Python avec FastAPI et Gemini AI pour un système d'apprentissage adaptatif intelligent.

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

Ajouter votre clé Gemini API dans `.env` :
```
GEMINI_API_KEY=votre_clé_ici
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

## 🧠 Algorithme SM-2++

Spaced Repetition optimisé pour procrastinateurs :
- ✅ Pénalité douce pour les skips
- ✅ Difficulty decay automatique
- ✅ Forgiveness system
- ✅ Zone de Développement Proximal dynamique

## 🤖 Gemini AI

Génération de questions adaptatives :
- Questions personnalisées selon le niveau
- Feedback encourageant pour procrastinateurs
- Ajustement dynamique de la difficulté

## 📦 Structure

```
backend/
├── main.py              # Point d'entrée FastAPI
├── config.py            # Configuration
├── models/              # Modèles Pydantic
│   ├── user.py
│   ├── course.py
│   └── learning.py
├── services/            # Services (Gemini)
│   └── gemini_service.py
├── routes/              # Routes API
│   └── learning.py
└── utils/               # Utilitaires
    └── sm2_algorithm.py # Algorithme SM-2++
```

## 🔧 Technologies

- **FastAPI** : Framework web moderne
- **Pydantic** : Validation de données
- **Gemini AI** : Génération de contenu
- **Uvicorn** : Serveur ASGI

## 📝 Licence

MIT
