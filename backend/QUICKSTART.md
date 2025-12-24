# ⚡ Quickstart - Backend Adaptatif

Guide de démarrage rapide en 5 minutes.

## 🎯 Prérequis

- Python 3.10+ installé
- Clé API OpenAI ([obtenir ici](https://platform.openai.com/api-keys))

## 📦 Installation Express

```bash
# 1. Aller dans le dossier backend
cd backend

# 2. Installer les dépendances
pip install -r requirements.txt

# 3. Configurer la clé API
echo "OPENAI_API_KEY=votre_clé_ici" > .env

# 4. Lancer le serveur
python main.py
```

✅ **Le serveur est prêt sur http://localhost:8000** !

## 🧪 Test Rapide

### 1. Ouvrir Swagger
Aller sur : http://localhost:8000/docs

### 2. Démarrer une session
Cliquer sur `POST /api/learning/start-session` → Try it out → Execute

```json
{
  "course_id": "test-course",
  "topic_id": "test-topic"
}
```

Copier le `session_id` retourné.

### 3. Obtenir une question
`GET /api/learning/next-question/{session_id}`

Remplacer `{session_id}` par l'ID copié → Execute

### 4. Soumettre une réponse
`POST /api/learning/submit-answer/{session_id}`

```json
{
  "question_id": "xxx",
  "user_answer": "correct",
  "time_taken": 30
}
```

## 🎉 Félicitations !

Ton backend adaptatif fonctionne ! 

**Prochaine étape** : Connecter le frontend → voir `IMPLEMENTATION_SUMMARY.md`

## 🐛 Problèmes ?

### Erreur "ModuleNotFoundError"
```bash
pip install -r requirements.txt
```

### Erreur "OpenAI API Key"
Vérifier que `.env` contient bien :
```
OPENAI_API_KEY=ta_vraie_clé
```

### Port 8000 déjà utilisé
Changer dans `.env` :
```
PORT=8001
```

## 📚 Documentation Complète

- README.md - Documentation générale
- IMPLEMENTATION_SUMMARY.md - Détails techniques
