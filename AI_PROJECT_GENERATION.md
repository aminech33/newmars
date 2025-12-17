# Génération de Projets depuis une Idée - Guide d'Utilisation

**Date** : 14 décembre 2025  
**Feature** : ✨ Générer un plan de projet actionnable depuis une idée simple

---

## 🎯 Objectif

Permettre à l'utilisateur de **transformer rapidement une idée vague en plan actionnable** directement depuis la page Tâches, avec l'aide de l'IA Gemini.

---

## 🚀 Comment ça marche ?

### 1. **L'utilisateur a une idée**
Exemple : "Créer un podcast sur la tech"

### 2. **L'IA génère un plan complet**
- Nom du projet : "Podcast Tech"
- Deadline suggérée : 2024-01-15
- Tâches actionnables :
  1. Définir la ligne éditoriale
  2. Acheter le matériel audio
  3. Créer les comptes réseaux sociaux
  4. Enregistrer le premier épisode
  5. etc.

### 3. **L'utilisateur valide et crée**
En un clic, le projet et toutes les tâches sont créés dans l'application.

---

## 📱 Interface Utilisateur

### Accès à la fonctionnalité
Dans la **page Tâches**, un nouveau bouton ✨ (Sparkles) apparaît dans le header :

```
[←] [🔍 Recherche] [📊 Stats] [Toutes|Aujourd'hui|En retard] [✨] [+]
```

### Étape 1 : Saisie de l'idée
![Modal avec textarea]
- Champ texte libre pour décrire l'idée
- Placeholder avec exemples
- Bouton "Générer le plan" (Ctrl+Entrée)
- Validation : minimum 5 caractères

### Étape 2 : Aperçu du plan
![Plan généré avec preview]
- **Projet** : Nom du projet généré (avec ✨)
- **Deadline** : Date suggérée (si pertinente)
- **Tâches** : Liste numérotée des tâches
  - Première tâche marquée "Prioritaire"
  - Tâches ordonnées logiquement

### Étape 3 : Validation
- Bouton "Créer ce projet" (vert)
- Bouton "Recommencer" (gris)
- Info-box explicative

---

## 🛠️ Architecture Technique

### Backend (`/backend/routes/tasks.py`)

**Endpoint** : `POST /api/tasks/generate-project-plan`

**Input** :
```json
{
  "idea": "Créer un podcast sur la tech"
}
```

**Output** :
```json
{
  "projectName": "Podcast Tech",
  "suggestedDeadline": "2024-01-15",
  "tasks": [
    { "title": "Définir la ligne éditoriale" },
    { "title": "Acheter le matériel audio" },
    ...
  ]
}
```

**Logique** :
1. Validation de l'idée (min 5 caractères)
2. Construction d'un prompt adaptatif pour Gemini
3. Appel à Gemini avec le prompt
4. Parsing de la réponse JSON
5. Validation du plan (min 3 tâches)
6. Fallback en cas d'erreur

### Frontend (`/src/components/tasks/GenerateProjectFromIdea.tsx`)

**Composant** : Modal en 2 étapes

**États** :
- `idea` : Idée saisie par l'utilisateur
- `isGenerating` : Loading pendant la génération
- `generatedPlan` : Plan généré par l'IA
- `error` : Message d'erreur éventuel

**Flow** :
1. Utilisateur saisit son idée
2. Clic sur "Générer" → Appel API
3. Affichage du plan généré
4. Validation → Création du projet + tâches dans le store
5. Fermeture de la modal

---

## 🧠 Le Prompt IA

### Contraintes du prompt

Le prompt est conçu pour être **pragmatique et orienté action** :

✅ **Ce que l'IA doit faire** :
- Nom de projet court (max 4 mots)
- Deadline réaliste (ou null si non pertinent)
- 3 à 15 tâches actionnables
- Tâches avec verbes d'action
- Ordre logique dans le temps
- Tâches concrètes (pas de "réfléchir à", "penser à")

❌ **Ce que l'IA ne doit PAS faire** :
- Tâches vagues ou abstraites
- Redondances
- Tâches trop longues (max 60 caractères)
- Deadline irréaliste
- Trop peu ou trop de tâches

### Exemples de bonnes tâches

✅ "Créer un compte GitHub"  
✅ "Installer Node.js et npm"  
✅ "Rédiger le cahier des charges"  
✅ "Acheter le matériel nécessaire"  
✅ "Tester la version beta"  

### Exemples de mauvaises tâches

❌ "Réfléchir au projet" (trop vague)  
❌ "Faire des recherches" (pas actionnable)  
❌ "Travailler sur le design" (trop général)  
❌ "Continuer le développement" (redondant)  

---

## 🎨 Design System

### Couleurs
- **Bouton ✨** : Indigo (`bg-indigo-500/10`, `text-indigo-400`)
- **Projet** : Indigo (`bg-indigo-500/10`)
- **Deadline** : Cyan (`bg-cyan-500/10`)
- **Tâches** : Zinc (`bg-zinc-800/50`)
- **Badge "Prioritaire"** : Amber (`bg-amber-500/10`)
- **Bouton Créer** : Emerald (`bg-emerald-500`)

### Icônes
- `<Sparkles />` : Génération IA
- `<Calendar />` : Deadline
- `<CheckCircle2 />` : Validation
- `<Loader2 />` : Loading

---

## 📝 Exemples d'Utilisation

### Exemple 1 : Projet Court
**Idée** : "Refaire mon CV"

**Plan généré** :
```
Projet : Refaire CV
Deadline : 2024-12-20

Tâches :
1. Lister mes expériences récentes
2. Choisir un template moderne
3. Rédiger les sections clés
4. Ajouter mes compétences techniques
5. Faire relire par 2 personnes
6. Exporter en PDF
```

### Exemple 2 : Projet Moyen
**Idée** : "Apprendre la guitare"

**Plan généré** :
```
Projet : Apprendre la Guitare
Deadline : 2025-03-01

Tâches :
1. Acheter une guitare acoustique
2. Trouver un prof ou cours en ligne
3. Apprendre les accords de base
4. Pratiquer 15min par jour
5. Apprendre une chanson simple
6. Enregistrer ma première cover
```

### Exemple 3 : Projet Long
**Idée** : "Lancer une startup de livraison de repas sains"

**Plan généré** :
```
Projet : Startup Repas Sains
Deadline : null (projet long)

Tâches :
1. Étudier le marché local
2. Définir la proposition de valeur
3. Créer un business plan
4. Trouver des partenaires restaurateurs
5. Développer le MVP du site
6. Tester avec 10 clients pilotes
7. Lever des fonds
... (jusqu'à 15 tâches)
```

---

## 🔧 Configuration Backend

### Prérequis
- Python 3.9+
- FastAPI
- Google Gemini API Key

### Installation
```bash
cd backend

# Installer les dépendances
pip install -r requirements.txt

# Configurer la clé API
# Ajouter dans .env ou config.py :
GEMINI_API_KEY=your_api_key_here

# Lancer le serveur
python main.py
```

### Test de l'endpoint
```bash
curl -X POST http://localhost:8000/api/tasks/generate-project-plan \
  -H "Content-Type: application/json" \
  -d '{"idea": "Créer un blog technique"}'
```

---

## 🎯 Résultat Final

### Avant cette feature
1. Utilisateur a une idée
2. Doit créer manuellement le projet
3. Doit réfléchir aux tâches
4. Doit les saisir une par une
5. Doit les organiser
→ **Friction importante, procrastination**

### Après cette feature
1. Utilisateur a une idée
2. Clic sur ✨
3. Saisit l'idée en 1 phrase
4. L'IA génère tout
5. Validation en 1 clic
→ **Zéro friction, passage à l'action immédiat**

---

## 🚨 Gestion des Erreurs

### Cas d'erreur 1 : Backend non démarré
```
Erreur : "Impossible de générer le plan. Vérifie que le backend est démarré."
```
**Solution** : Lancer `python main.py` dans `/backend`

### Cas d'erreur 2 : Idée trop courte
```
Erreur : "Décris ton idée en au moins 5 caractères"
```
**Solution** : Saisir une idée plus détaillée

### Cas d'erreur 3 : Gemini API erreur
```
Fallback : Plan générique créé automatiquement
```
**Contenu** :
- Nom : "Projet: [idée tronquée]"
- Deadline : Dans 14 jours
- 5 tâches génériques de planification

---

## 📊 Métriques de Succès

Pour évaluer le succès de cette feature :

1. **Taux d'utilisation** : % d'utilisateurs qui utilisent ✨ vs création manuelle
2. **Taux de validation** : % de plans générés qui sont créés
3. **Temps moyen** : Temps entre idée et création du projet
4. **Qualité perçue** : Feedback utilisateur sur la pertinence des tâches

---

## 🔮 Améliorations Futures

### Court terme
- [ ] Édition du plan avant validation
- [ ] Personnalisation des priorités
- [ ] Choix de l'icône et couleur du projet

### Moyen terme
- [ ] Apprentissage du style de l'utilisateur
- [ ] Suggestions basées sur l'historique
- [ ] Templates de projets récurrents

### Long terme
- [ ] Génération de sous-tâches
- [ ] Estimation automatique des durées
- [ ] Dépendances entre tâches

---

## ✅ Checklist de Déploiement

Avant de déployer en production :

- [x] Endpoint backend créé (`/api/tasks/generate-project-plan`)
- [x] Route ajoutée dans `main.py`
- [x] Composant React créé (`GenerateProjectFromIdea.tsx`)
- [x] Intégration dans `TasksPage.tsx`
- [x] Gestion des erreurs
- [x] Fallback en cas d'échec
- [ ] Tests unitaires backend
- [ ] Tests E2E frontend
- [ ] Variables d'environnement configurées
- [ ] Documentation utilisateur
- [ ] Rate limiting sur l'API Gemini

---

**Conclusion** : Cette feature transforme la friction de la création de projet en une expérience fluide et motivante, alignée avec l'objectif de lutte contre la procrastination. 🚀



