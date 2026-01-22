# 🧠 Learning Engine - Moteur d'apprentissage adaptatif

> **Moteur LEAN v4.3 : Maximum d'efficacité, minimum de complexité**

## 🎯 Mission

Optimiser l'apprentissage en adaptant dynamiquement :
- La difficulté des questions (Zone Proximale de Développement)
- L'espacement des révisions (Spaced Repetition)
- La détection de fatigue (Cognitive Load)
- Le mélange des sujets (Interleaving)
- L'intervention de l'IA (AI Tutor v2.0)

## 📁 Structure

```
backend/learning-engine/
├── __init__.py                  ← API publique du module
├── learning_engine_lean.py      ← Moteur unique (source of truth)
└── README.md                    ← Ce fichier
```

**Principe clé** : Un seul fichier, une seule source de vérité.

## 🚀 Usage

### Import du module

```python
# Import standard (recommandé)
from learning_engine import LeanLearningEngine

# Initialisation
engine = LeanLearningEngine(db_path="data/learning.db")
```

### Obtenir les paramètres pour une question

```python
params = engine.get_next_question(
    user_id="user_123",
    topic_id="variables",
    current_mastery=45
)

# Résultat: QuestionParams
# - difficulty: 1-5
# - difficulty_name: "EASY", "MEDIUM", etc.
# - fsrs_interval: float (jours)
# - retrievability: float (0-1)
# - cognitive_load: "normal", "elevated", "overload"
# - should_take_break: bool
# - interleave_suggested: bool
```

### Traiter une réponse

```python
result = engine.process_answer(
    user_id="user_123",
    topic_id="variables",
    is_correct=True,
    response_time=15.5,  # secondes
    difficulty=3
)

# Résultat: AnswerResult
# - mastery_change: +3, -2, etc.
# - xp_earned: int
# - next_review_days: float
# - accuracy_recent: float (0-1)
# - should_reduce_difficulty: bool
# - should_take_break: bool
# - feedback: str
```

## 🔬 5 Modules scientifiques essentiels

### 1. FSRS - Spaced Repetition
**Source** : Pimsleur, état de l'art
**Rôle** : Calculer l'intervalle optimal entre révisions
**Implémentation** : `backend/utils/fsrs_algorithm.py`

### 2. Testing Effect - Quiz Actif
**Source** : Dunlosky 2013, technique #1 d'apprentissage
**Rôle** : Renforcer la mémoire par rappel actif
**Implémentation** : Le moteur force l'utilisateur à répondre

### 3. Adaptive Difficulty - Zone Proximale
**Source** : Vygotsky (Zone de Développement Proximal)
**Rôle** : Ajuster difficulté selon maîtrise + performance récente
**Implémentation** : `_calculate_optimal_difficulty()`

### 4. Cognitive Load Detection - Détection Fatigue
**Source** : Sweller 1988 (Théorie de la Charge Cognitive)
**Rôle** : Détecter la surcharge cognitive et suggérer des pauses
**Implémentation** : `backend/utils/cognitive_load.py`

### 5. Interleaving - Mélange des Sujets
**Source** : Rohrer 2007 (apprentissage entrelacé)
**Rôle** : Éviter la sur-spécialisation, mélanger les topics
**Implémentation** : `backend/utils/interleaving.py`

## 🚫 Règles NON-NÉGOCIABLES

### ❌ Ne JAMAIS

1. **Créer un fichier learning_engine_v2.py**
   - Améliorer `learning_engine_lean.py` directement
   - Pas de duplication de moteur

2. **Dupliquer la logique métier dans les simulators**
   - Les simulators utilisent le moteur, ne le réimplémentent pas

3. **Ajouter un module sans preuve scientifique ET validation**
   - Référence scientifique requise
   - Test dans simulators obligatoire
   - Mesure d'impact (succès, dropout, rétention)

4. **Réintroduire les modules supprimés**
   - 9 modules ont été supprimés pour de bonnes raisons
   - Voir .claude/learning-engine.md pour la liste et justifications

### ✅ À FAIRE

1. **Modifier learning_engine_lean.py directement**
2. **Documenter le "pourquoi" dans le code**
3. **Tester via backend/simulators/**
4. **Valider l'impact dans les métriques**

## 📊 Validation

Toute modification du moteur doit être validée par les simulators :

```bash
# Lancer les simulations
cd backend
python3 -m simulators --runs 30 --days 180

# Vérifier les métriques
# - Taux de succès ≥ 85%
# - Taux de dropout ≤ 10%
# - Mastery moyenne ≥ 75%
```

## 🔗 Dépendances

### Modules utils utilisés
```
backend/utils/
├── fsrs_algorithm.py      ← FSRS (spaced repetition)
├── cognitive_load.py      ← Détection charge cognitive
├── interleaving.py        ← Mélange des sujets
├── optimal_difficulty.py  ← Calcul difficulté adaptative
└── mastery_decay.py       ← Oubli naturel
```

### Base de données
- SQLite (`data/learning.db` par défaut)
- Sauvegarde automatique après chaque réponse
- Isolation complète par user_id

## 📚 Documentation complète

- **[.claude/learning-engine.md](../../.claude/learning-engine.md)** - Guidelines complètes
- **[.claude/guidelines.md](../../.claude/guidelines.md)** - Philosophie générale
- **[backend/simulators/](../simulators/)** - Tests et validation

## 🎓 Exemples

### Exemple 1 : Session d'apprentissage simple

```python
from learning_engine import LeanLearningEngine

engine = LeanLearningEngine()

# Démarrer une session
user_id = "user_123"
topic_id = "variables"
mastery = 0  # Débutant

for question_num in range(10):
    # Obtenir les paramètres
    params = engine.get_next_question(user_id, topic_id, mastery)

    print(f"Question {question_num + 1} - Difficulté: {params.difficulty_name}")

    # Simuler une réponse (remplacer par vraie réponse utilisateur)
    is_correct = True  # ou False
    response_time = 10.5

    # Traiter la réponse
    result = engine.process_answer(
        user_id, topic_id, is_correct, response_time, params.difficulty
    )

    # Mettre à jour la maîtrise
    mastery += result.mastery_change

    print(f"  → {'✓' if is_correct else '✗'} | Mastery: {mastery} | XP: +{result.xp_earned}")
    print(f"  → {result.feedback}")

    if result.should_take_break:
        print("  ⚠️  Pause recommandée")
        break
```

### Exemple 2 : Intégration avec une API

```python
from flask import Flask, request, jsonify
from learning_engine import LeanLearningEngine

app = Flask(__name__)
engine = LeanLearningEngine()

@app.route('/api/question/next', methods=['POST'])
def next_question():
    data = request.json
    params = engine.get_next_question(
        user_id=data['user_id'],
        topic_id=data['topic_id'],
        current_mastery=data.get('mastery', 0)
    )
    return jsonify(params.__dict__)

@app.route('/api/question/answer', methods=['POST'])
def submit_answer():
    data = request.json
    result = engine.process_answer(
        user_id=data['user_id'],
        topic_id=data['topic_id'],
        is_correct=data['is_correct'],
        response_time=data['response_time'],
        difficulty=data['difficulty']
    )
    return jsonify(result.__dict__)
```

## 🔧 Développement

### Ajouter une fonctionnalité

1. Modifier `learning_engine_lean.py` directement
2. Documenter avec commentaires "pourquoi" (pas "quoi")
3. Tester :
   ```bash
   python3 -m simulators --runs 30
   ```
4. Comparer les métriques avant/après
5. Si amélioration → Garder
6. Si dégradation → Revert

### Déboguer

```python
# Activer les logs détaillés
import logging
logging.basicConfig(level=logging.DEBUG)

engine = LeanLearningEngine(db_path=":memory:")  # DB en mémoire pour tests
```

## 🐛 Problèmes courants

### "ModuleNotFoundError: No module named 'learning_engine'"

Solution:
```bash
# Assurez-vous d'être dans backend/
cd backend
python3 -c "from learning_engine import LeanLearningEngine"
```

### "Database is locked"

Solution:
```python
# Utiliser une DB temporaire pour les tests
import tempfile
with tempfile.NamedTemporaryFile(suffix='.db') as tmp:
    engine = LeanLearningEngine(db_path=tmp.name)
```

---

**Version** : 4.3.0
**Dernière mise à jour** : 2026-01-20
**Philosophie** : LEAN - Maximum d'efficacité, minimum de complexité
