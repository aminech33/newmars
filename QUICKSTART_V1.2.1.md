# 🚀 Guide de Démarrage Rapide - Améliorations V1.2.1

## ✅ Installation Complète

### 1. Backend (Python)

```bash
cd /Users/aminecb/Desktop/newmars/backend

# Activer l'environnement virtuel
source venv/bin/activate

# Installer/vérifier les dépendances (déjà fait normalement)
pip install fastapi uvicorn pydantic python-dotenv openai websockets

# Initialiser la base de données
python3 init_db.py

# Tester la base de données
python3 test_database.py

# Démarrer le serveur
./start.sh
# OU
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend (React)

```bash
cd /Users/aminecb/Desktop/newmars

# Installer/vérifier les dépendances
npm install

# Démarrer l'app
npm run dev
```

## 🧪 Tests Rapides

### Backend

```bash
cd backend

# Test 1: Base de données
python3 test_database.py
# ✅ Devrait afficher "4/4 tests réussis"

# Test 2: API Learning
python3 test_api.py

# Test 3: Interleaving
python3 test_interleaving.py
```

### Frontend

1. **Ouvrir** http://localhost:5173
2. **Naviguer** vers Apprentissage
3. **Créer un cours** (ex: "Python Basics")
4. **Tester les nouvelles features** :

#### ✅ Stats avec Sparkline
- Aller dans un cours
- Cliquer sur l'icône **📊 Stats** (en haut à droite)
- Vérifier l'affichage des 4 cards :
  - Maîtrise avec sparkline
  - Streak 🔥
  - Révisions
  - Temps

#### ✅ Streak de Révisions
- Réviser des flashcards
- Vérifier que le streak s'incrémente
- Badge 🔥 orange si ≥ 7 jours
- Barre de progression vers palier

#### ✅ Toast Interleaving
- Activer interleaving dans Settings
- Créer une session avec plusieurs topics
- Observer les toasts 🔄 lors des switchs

#### ✅ Export Flashcards
- Ouvrir FlashcardModal (icône 🧠 Brain)
- Cliquer sur **Download** (en haut à droite)
- Choisir format : Markdown / JSON / CSV / Anki
- Vérifier le fichier téléchargé

## 📊 Vérifier la Persistence

```bash
cd backend

# Voir la base de données
ls -lh learning.db

# Explorer les tables
sqlite3 learning.db
```

Dans sqlite3 :
```sql
-- Voir les tables
.tables

-- Sessions
SELECT id, course_id, questions_answered, xp_earned FROM sessions LIMIT 5;

-- Mastery
SELECT user_id, topic_id, mastery_level, success_rate FROM topic_mastery LIMIT 5;

-- Streaks
SELECT user_id, current_streak, longest_streak, total_reviews FROM review_streaks;

-- Quitter
.quit
```

## 🔧 Debugging

### Backend ne démarre pas ?

```bash
cd backend

# Vérifier l'environnement
which python3
python3 --version

# Réinstaller les dépendances
pip install -r requirements.txt

# Vérifier les ports
lsof -i :8000
```

### Frontend ne compile pas ?

```bash
cd newmars

# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install

# Vérifier TypeScript
npx tsc --noEmit
```

### Base de données corrompue ?

```bash
cd backend

# Supprimer et recréer
rm learning.db
python3 init_db.py
python3 test_database.py
```

## 📝 Checklist Post-Installation

- [ ] Backend démarre sans erreur (`python3 -m uvicorn main:app --reload`)
- [ ] Frontend démarre (`npm run dev`)
- [ ] `learning.db` existe dans `backend/`
- [ ] Tests database passent (4/4)
- [ ] Stats cards s'affichent avec sparkline
- [ ] Streak s'incrémente après révision
- [ ] Export flashcards fonctionne (4 formats)
- [ ] Toasts interleaving s'affichent

## 🎯 Commandes Utiles

```bash
# Backend
cd backend
python3 init_db.py          # Init DB
python3 test_database.py    # Test DB
./start.sh                  # Start server

# Frontend
cd newmars
npm run dev                 # Dev mode
npm run build               # Production build
npm run preview             # Preview build

# Database
cd backend
sqlite3 learning.db ".backup backup.db"    # Backup
sqlite3 learning.db ".tables"              # List tables
sqlite3 learning.db "SELECT COUNT(*) FROM sessions;"  # Count sessions
```

## 📚 Documentation

- **V1_FREEZE.md** - Features V1.2.0 complètes
- **LEARNING_IMPROVEMENTS_V1.2.1.md** - Détails améliorations
- **backend/INTERLEAVING_README.md** - Guide interleaving
- **backend/README.md** - Quick start backend

## 🆘 Support

Si problème :
1. Vérifier les logs backend (terminal)
2. Vérifier la console browser (F12)
3. Tester avec `test_database.py`
4. Vérifier que `learning.db` existe
5. Redémarrer backend ET frontend

## 🎉 C'est Prêt !

Toutes les améliorations V1.2.1 sont installées et fonctionnelles.

**Enjoy ! 🚀**

