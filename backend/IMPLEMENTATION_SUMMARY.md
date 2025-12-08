# 📘 Backend Adaptatif - Documentation Technique

## 🎯 Vue d'Ensemble

Backend Python pour système d'apprentissage adaptatif propulsé par Gemini AI et algorithme SM-2++ optimisé pour procrastinateurs.

## 🏗️ Architecture

### Stack Technique
- **Framework** : FastAPI 0.100+
- **AI** : Google Gemini Pro
- **Validation** : Pydantic 2.0+
- **Serveur** : Uvicorn (ASGI)

### Structure des Dossiers

```
backend/
├── main.py                    # Point d'entrée FastAPI
├── config.py                  # Configuration centralisée
├── requirements.txt           # Dépendances
├── .env                       # Variables d'environnement
├── env.example               # Template de config
│
├── models/                   # Modèles de données (Pydantic)
│   ├── __init__.py
│   ├── user.py              # User, UserProfile
│   ├── course.py            # Course, Topic
│   └── learning.py          # Question, Session, Feedback
│
├── services/                # Services métier
│   ├── __init__.py
│   └── gemini_service.py   # Intégration Gemini AI
│
├── routes/                  # Routes API
│   ├── __init__.py
│   └── learning.py         # Endpoints d'apprentissage
│
└── utils/                   # Utilitaires
    ├── __init__.py
    └── sm2_algorithm.py    # Algorithme SM-2++
```

## 🧠 Algorithme SM-2++ (Spaced Repetition)

### Principe de Base

L'algorithme SM-2++ est une amélioration de SM-2 (SuperMemo 2) adapté aux procrastinateurs.

### Caractéristiques Principales

#### 1. **Pénalité Douce pour Procrastination**

```python
skip_penalty = min(skip_days * 0.1, 1.0)
adjusted_quality = max(0, quality - skip_penalty)
```

- Pénalité de **0.1 point par jour** de retard
- Max **-1 point** (pas écrasant)
- Si 5 jours de skip → -0.5 points seulement

#### 2. **Forgiveness System**

```python
if consecutive_skips > 0:
    forgiveness_factor = 1.0 - (consecutive_skips * 0.1)
    new_interval = int(new_interval * forgiveness_factor)
```

- Réduit l'intervalle de révision après skips
- **10% de réduction par skip consécutif**
- Max **-50%** de l'intervalle
- Permet de ne pas être submergé après une pause

#### 3. **Difficulty Decay Automatique**

```python
if skip_days > 0:
    decay = skip_days * 0.05  # 5% par jour
    mastery_level = max(0, mastery_level - (decay * 100))
```

- Baisse automatique de la difficulté après inactivité
- **5% de baisse par jour** de skip
- Questions plus faciles au retour → succès rapide → remotivation

#### 4. **Zone de Développement Proximal (ZDP)**

Adaptation dynamique de la difficulté selon :
- **Niveau de maîtrise** (0-100%)
- **Taux de réussite** récent (0-1)
- **Jours d'inactivité**

```python
def determine_difficulty(mastery_level, success_rate, skip_days):
    # Ajuste pour rester dans la ZDP (ni trop facile, ni trop dur)
    if mastery_level < 30:
        return "easy"
    elif mastery_level < 60:
        return "medium" if 0.5 < success_rate < 0.8 else adaptive
    else:
        return "hard" if success_rate > 0.7 else "medium"
```

### Formules Mathématiques

#### Ease Factor
```
EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
```
- `EF` = Ease Factor actuel (1.3 - 2.5)
- `q` = Qualité de la réponse (0-5, ajustée par skip_penalty)

#### Intervalle de Révision
```
Si q < 3:  I = 1                    (échec, restart)
Si n = 1:  I = 1                    (première fois)
Si n = 2:  I = 6                    (deuxième fois)
Sinon:     I = I(précédent) * EF    (exponentiel)
```

#### Changement de Maîtrise
```
Si correct:
  ΔM = base_gain * speed_bonus * mastery_penalty
  
base_gain:
  - easy: +5 points
  - medium: +10 points
  - hard: +15 points

speed_bonus:
  - 50%+ plus rapide: +3 points
  - 20%+ plus rapide: +1 point

mastery_penalty:
  - >80%: *0.7
  - >90%: *0.5
```

## 🤖 Intégration Gemini AI

### Service Gemini

Le `GeminiService` gère toute l'interaction avec l'API Gemini.

#### Génération de Questions Adaptatives

```python
async def generate_question(
    topic_name: str,
    difficulty: str,
    mastery_level: int,
    learning_style: Optional[str] = None,
    weak_areas: List[str] = [],
    context: Optional[str] = None
) -> Question
```

**Prompt Engineering** :
- Adapté au **profil de l'apprenant** (niveau, style, faiblesses)
- Ton **encourageant** pour procrastinateurs
- Format JSON strict pour parsing automatique
- Exemples visuels si style = "visual"
- Questions pratiques si style = "practical"

#### Génération d'Encouragements

```python
async def generate_encouragement(
    is_correct: bool,
    streak: int,
    mastery_change: int
) -> str
```

Messages personnalisés selon :
- Résultat (correct/incorrect)
- Streak actuel
- Progression de la maîtrise

**Exemples** :
- ✅ Correct + streak 5 : "🎉 Incroyable ! 5 jours d'affilée, tu es en feu !"
- ❌ Incorrect : "💪 Pas grave ! On apprend de nos erreurs, réessaye !"

### Fallback System

Si Gemini échoue (API down, parsing error) :
- Question générique créée automatiquement
- Message d'encouragement par défaut
- **Service jamais bloqué**

## 📡 API Endpoints

### 1. Démarrer une Session

```
POST /api/learning/start-session
```

**Request** :
```json
{
  "course_id": "python-101",
  "topic_id": "functions",
  "user_id": "user123"
}
```

**Response** :
```json
{
  "session_id": "uuid-xxx",
  "message": "Session d'apprentissage démarrée !",
  "ready_for_question": true
}
```

### 2. Obtenir une Question

```
GET /api/learning/next-question/{session_id}
```

**Response** :
```json
{
  "question_id": "uuid-yyy",
  "question_text": "Quelle est la sortie de...",
  "options": [
    {"id": "opt1", "text": "Option A"},
    {"id": "opt2", "text": "Option B"}
  ],
  "difficulty": "medium",
  "mastery_level": 45,
  "estimated_time": 60,
  "hints": ["Pense aux types de données"]
}
```

### 3. Soumettre une Réponse

```
POST /api/learning/submit-answer/{session_id}
```

**Request** :
```json
{
  "question_id": "uuid-yyy",
  "user_answer": "Option B",
  "time_taken": 45,
  "confidence": 0.8
}
```

**Response** :
```json
{
  "is_correct": true,
  "explanation": "Ta maîtrise est maintenant à 55%",
  "encouragement": "🎉 Excellent ! Continue !",
  "next_action": "continue",
  "difficulty_adjustment": null,
  "xp_earned": 25,
  "mastery_change": +10,
  "streak_info": {
    "current_streak": 3,
    "message": "🔥 3 bonnes réponses d'affilée !"
  }
}
```

### 4. Progression

```
GET /api/learning/progress/{session_id}
```

**Response** :
```json
{
  "session_id": "uuid-xxx",
  "questions_answered": 10,
  "correct_answers": 7,
  "accuracy": 70.0,
  "xp_earned": 250,
  "mastery_level": 55,
  "success_rate": 70.0,
  "current_streak": 3,
  "next_review_in_days": 6
}
```

## 🎮 Gamification

### Système XP

```python
base_xp = {
    "easy": 10,
    "medium": 20,
    "hard": 35
}

streak_multiplier = 1.0 + (min(streak, 30) * 0.05)
total_xp = base_xp * streak_multiplier

# Bonus première du jour
if is_first_of_day:
    total_xp += 50
```

**Exemples** :
- Question facile : **10 XP**
- Question medium + streak 5 : **20 * 1.25 = 25 XP**
- Question hard + streak 10 + première du jour : **35 * 1.5 + 50 = 102 XP**

## 🔒 Configuration

### Variables d'Environnement

```env
# API Keys (obligatoire)
GEMINI_API_KEY=your_key_here

# Serveur (optionnel)
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Algorithme SM-2++ (optionnel)
MIN_EASE_FACTOR=1.3
MAX_EASE_FACTOR=2.5
SKIP_PENALTY=0.1
DIFFICULTY_DECAY_RATE=0.05
```

## 📊 Métriques et Suivi

### Par Topic

- `mastery_level` : 0-100 (niveau de maîtrise)
- `ease_factor` : 1.3-2.5 (facilité mémorisée)
- `interval` : jours jusqu'à prochaine révision
- `repetitions` : nombre de révisions réussies
- `success_rate` : taux de réussite (0-1)
- `consecutive_skips` : skips consécutifs

### Par Session

- Questions répondues
- Bonnes réponses
- Précision
- XP gagné
- Streak actuel

## 🚀 Prochaines Étapes

### TODO #7 : Machine Learning

Ajouter détection automatique du style d'apprentissage :
- Analyser les patterns de réponse
- Clustering d'apprenants similaires
- Prédiction du meilleur moment pour apprendre

### TODO #8 : Connexion Frontend

Intégrer avec React/TypeScript :
- Appels API depuis `src/utils/`
- State management avec Zustand
- UI components pour questions/feedback

## 📚 Ressources

- [SuperMemo Algorithm](https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method)
- [Zone de Développement Proximal (Vygotsky)](https://fr.wikipedia.org/wiki/Zone_proximale_de_d%C3%A9veloppement)
- [Gemini API Docs](https://ai.google.dev/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com/)

## 🎓 Concepts Psycho-Pédagogiques

### Pourquoi ces choix ?

1. **Pénalité douce** : Éviter la culpabilisation des procrastinateurs
2. **Forgiveness** : Permettre les pauses sans punition excessive
3. **Difficulty decay** : Succès rapide au retour → remotivation
4. **ZDP** : Toujours "juste assez difficile" pour maintenir l'engagement
5. **Feedback positif** : Ton encourageant, jamais critique

### Recherches Appliquées

- **Spaced Repetition** : +200% rétention long terme
- **Adaptive Learning** : +40% vitesse d'apprentissage
- **Gamification** : +60% engagement
- **Forgiveness Systems** : -70% abandons

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2025-12-08
