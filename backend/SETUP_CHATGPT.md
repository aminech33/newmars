# ⚡ QUICKSTART - Connexion ChatGPT

## 🎯 Ce qui a été fait

✅ Toutes les références à Gemini ont été remplacées par ChatGPT/OpenAI  
✅ Le code utilise maintenant `openai_service.py` exclusivement  
✅ Configuration mise à jour pour utiliser `OPENAI_API_KEY`  
✅ Documentation mise à jour  

## 🚀 Pour démarrer en 3 étapes

### Étape 1 : Installer les dépendances
```bash
cd /Users/aminecb/Desktop/newmars/backend
pip install -r requirements.txt
```

Cela installera notamment le package `openai` qui remplace `google-generativeai`.

### Étape 2 : Configurer votre clé API OpenAI

Créer le fichier `.env` dans `/Users/aminecb/Desktop/newmars/backend/` :

```bash
OPENAI_API_KEY=sk-votre_clé_openai_ici
```

🔑 **Obtenir une clé API :** https://platform.openai.com/api-keys

### Étape 3 : Lancer le serveur
```bash
python main.py
```

Le serveur démarre sur : http://localhost:8000

## ✅ Vérification

1. **Test simple** : Ouvrir http://localhost:8000 dans votre navigateur
   - Vous devriez voir : `{"message": "Backend Adaptatif - Newmars"}`

2. **Documentation API** : http://localhost:8000/docs
   - Interface Swagger pour tester les endpoints

3. **Test complet** :
   ```bash
   python test_api.py
   ```

## 🤖 Modèle utilisé

Par défaut : **GPT-4o-mini** (rapide, économique, performant)

Le modèle est configuré dans `services/openai_service.py` ligne 20 :
```python
self.model = "gpt-4o-mini"
```

### Autres modèles disponibles :
- `gpt-4o-mini` : Le plus rapide et économique ✅ (recommandé)
- `gpt-4o` : Plus puissant, plus lent, plus cher
- `gpt-4-turbo` : Équilibré
- `gpt-3.5-turbo` : Moins cher mais moins performant

## 📊 Ce qui utilise ChatGPT

Le backend utilise ChatGPT pour :

1. **Génération de questions adaptatives** (`routes/learning.py`)
   - Questions personnalisées selon le niveau
   - Adaptées au style d'apprentissage
   - Avec explications et indices

2. **Messages d'encouragement** (`routes/learning.py`)
   - Feedback personnalisé après chaque réponse
   - Messages motivants adaptés au streak

3. **Planification de projets** (`routes/tasks.py` si utilisé)
   - Génération de plans de tâches structurés

## 🛠️ Fichiers modifiés

```
backend/
├── config.py                    ✅ OPENAI_API_KEY au lieu de GEMINI_API_KEY
├── env.example                  ✅ Modèle mis à jour
├── main.py                      ✅ Références ChatGPT
├── requirements.txt             ✅ openai au lieu de google-generativeai
├── models/learning.py           ✅ Documentation mise à jour
├── routes/learning.py           ✅ Import openai_service
├── services/
│   ├── __init__.py             ✅ Export openai_service
│   ├── openai_service.py       ✅ Service actif
│   └── gemini_service.py       ❌ SUPPRIMÉ
├── README.md                    ✅ Documentation ChatGPT
├── QUICKSTART.md               ✅ Instructions OpenAI
└── test_api.py                 ✅ Tests mis à jour
```

## 💡 Conseils

### Optimiser les coûts
- `gpt-4o-mini` est très économique (~0.15$ / 1M tokens input)
- Ajuster `temperature` dans `openai_service.py` si besoin (ligne 33)
- Limiter `max_tokens` si les réponses sont trop longues

### Améliorer la qualité
- Augmenter `temperature` pour plus de créativité (0.3 → 0.7)
- Utiliser `gpt-4o` pour des questions plus complexes
- Personnaliser les prompts dans `_build_adaptive_prompt()`

### Debug
- Activer le mode DEBUG dans `.env` : `DEBUG=True`
- Vérifier les logs dans le terminal
- Utiliser Swagger docs pour tester : http://localhost:8000/docs

## 🎉 C'est prêt !

Votre backend utilise maintenant ChatGPT pour toutes les fonctionnalités d'IA.

**Prochaines étapes :**
1. Tester avec `python test_api.py`
2. Connecter votre frontend
3. Personnaliser les prompts si besoin










