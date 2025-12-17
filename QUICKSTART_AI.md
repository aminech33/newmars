# 🚀 Guide de Démarrage - newmars avec Génération IA

**Date** : 14 décembre 2025  
**Statut** : ✅ Backend configuré et opérationnel

---

## ✅ Configuration Terminée

Le backend FastAPI est maintenant **opérationnel** avec Gemini AI !

### Backend démarré sur : `http://localhost:8000`

---

## 🎯 Comment utiliser la génération de projets par IA

### Étape 1 : Le backend est déjà lancé ✅

Le backend tourne en arrière-plan dans un terminal.

**URL** : http://localhost:8000  
**API Docs** : http://localhost:8000/docs

---

### Étape 2 : Lancer le frontend

Ouvre un **nouveau terminal** et exécute :

```bash
cd /Users/aminecb/Desktop/newmars
npm run dev
```

Le frontend démarrera sur `http://localhost:5173`

---

### Étape 3 : Utiliser la feature ✨

1. **Ouvre** `http://localhost:5173` dans ton navigateur
2. **Va** sur la page **Tâches**
3. **Clique** sur le bouton **✨** (Sparkles) dans le header
4. **Saisis** une idée, par exemple :
   - "Créer un podcast sur la tech"
   - "Apprendre le piano"
   - "Lancer une startup"
5. **Clique** sur **"Générer le plan"**
6. L'IA génère :
   - Un nom de projet
   - Une deadline suggérée
   - Une liste de tâches actionnables
7. **Valide** pour créer le projet et toutes les tâches !

---

## 🔧 Commandes Utiles

### Pour relancer le backend plus tard

```bash
cd /Users/aminecb/Desktop/newmars/backend
GEMINI_API_KEY=AIzaSyBFlZdThjH9z3ciJVSIJwfPDfmTpZeN85w python3 main.py
```

### Pour tester l'API directement

```bash
curl -X POST http://localhost:8000/api/tasks/generate-project-plan \
  -H "Content-Type: application/json" \
  -d '{"idea": "Créer un blog de recettes végétariennes"}'
```

### Pour voir la documentation interactive

Ouvre http://localhost:8000/docs dans ton navigateur

---

## 📊 Endpoints disponibles

### 🧠 Génération de Projet
- **POST** `/api/tasks/generate-project-plan`
- Input: `{"idea": "ton idée"}`
- Output: Projet avec nom, deadline et tâches

### 📚 Apprentissage Adaptatif
- **POST** `/api/learning/start-session` - Démarrer une session
- **GET** `/api/learning/next-question/{session_id}` - Question suivante
- **POST** `/api/learning/submit-answer/{session_id}` - Soumettre réponse
- **GET** `/api/learning/progress/{session_id}` - Voir progression

---

## 🎨 Interface de Génération IA

### Dans la page Tâches :

```
Header : [←] [🔍 Recherche] [Stats] [Toutes|Aujourd'hui|En retard] [✨] [+]
                                                                       ↑
                                                        Bouton de génération IA
```

### Modal en 2 étapes :

**Étape 1** : Saisie de l'idée
- Champ texte libre
- Bouton "Générer le plan"
- Raccourci : Ctrl+Entrée

**Étape 2** : Aperçu du plan
- Nom du projet (✨)
- Deadline suggérée (📅)
- Liste des tâches (numérotées)
- Bouton "Créer ce projet"

---

## ⚠️ Notes Importantes

### Clé API Gemini
- **Clé actuelle** : `AIzaSyBFlZdThjH9z3ciJVSIJwfPDfmTpZeN85w`
- **Stockée** : En variable d'environnement (pas de fichier .env)
- **Sécurité** : Ne pas commiter cette clé sur Git

### Version Python
- Tu utilises Python 3.9.6
- Warnings affichés : normal, tout fonctionne
- Pour supprimer les warnings : upgrade vers Python 3.10+

### Si le backend s'arrête
Relance avec la commande :
```bash
cd /Users/aminecb/Desktop/newmars/backend
GEMINI_API_KEY=AIzaSyBFlZdThjH9z3ciJVSIJwfPDfmTpZeN85w python3 main.py
```

---

## 🧪 Test Rapide

Pour vérifier que tout fonctionne :

```bash
# Test 1 : Backend est up
curl http://localhost:8000/

# Test 2 : Génération IA
curl -X POST http://localhost:8000/api/tasks/generate-project-plan \
  -H "Content-Type: application/json" \
  -d '{"idea": "Apprendre la guitare"}'
```

---

## 📂 Architecture

```
newmars/
├── backend/                    ← Serveur FastAPI
│   ├── main.py                ← Point d'entrée
│   ├── config.py              ← Configuration (modifié)
│   ├── routes/
│   │   ├── learning.py        ← Routes apprentissage
│   │   └── tasks.py           ← Routes génération IA (nouveau)
│   └── services/
│       └── gemini_service.py  ← Service Gemini
│
├── src/                       ← Frontend React
│   └── components/tasks/
│       ├── TasksPage.tsx             ← Page Tâches (modifié)
│       └── GenerateProjectFromIdea.tsx  ← Modal IA (nouveau)
│
└── docs/
    ├── AI_PROJECT_GENERATION.md      ← Doc complète
    └── QUICKSTART_AI.md              ← Ce fichier
```

---

## 🎯 Prochaines Étapes

1. ✅ Backend démarré
2. 🔄 Lancer le frontend : `npm run dev`
3. 🧪 Tester la génération IA
4. 🎨 Personnaliser les prompts Gemini (optionnel)

---

## 💡 Astuces

### Pour garder le backend actif
Laisse le terminal du backend ouvert en arrière-plan

### Pour développer
Ouvre 2 terminaux :
- **Terminal 1** : Backend (reste actif)
- **Terminal 2** : Frontend (reste actif)

### Pour déboguer
- **Backend logs** : Dans le terminal du backend
- **Frontend logs** : Console navigateur (F12)
- **API docs** : http://localhost:8000/docs

---

**Tout est prêt ! 🚀**

Ouvre maintenant un nouveau terminal et lance `npm run dev` pour démarrer le frontend !




