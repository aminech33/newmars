# 🏠 Flow Complet du Hub — NewMars

> **Document créé** : 21 décembre 2024  
> **Type** : Documentation technique — Cheminement utilisateur complet

---

## 📊 Vue d'ensemble

Le Hub est le **point central de navigation** de l'application NewMars. Il offre un accès direct à tous les modules principaux avec une architecture claire et hiérarchisée.

---

## 🎯 Architecture de Navigation

### Flux Initial d'Arrivée

```
🏠 Arrivée Hub
    ↓
    ├─→ 📅 Date du jour (en haut, style discret)
    ├─→ 👋 Salutation personnalisée (Bonjour/Après-midi/Bonsoir + Nom)
    └─→ 📝 Nom utilisateur (depuis Settings)
    ↓
🧭 Choisir destination
```

---

## 🗂️ Modules Principaux

### 1️⃣ **Rangée 1 : Modules de Productivité**

#### ✅ **Tâches** → `/tasks`
- **4 colonnes temporelles**
  - Aujourd'hui
  - En cours
  - À venir
  - Lointain
- **Projets + IA générative**
  - Analyse domaine → compétences → plan
  - Génération de tâches structurées
- **🍅 Pomodoro intégré**
  - Timer 25/5 min
  - Onglet Focus
  - Lié aux tâches

#### 📝 **Ma Journée** → `/myday`
Un module **3-en-1** fusionnant Journal + Nutrition + Santé :

- **📓 Journal (Mood + Entrées)**
  - Mood tracker avec emojis
  - Prompts quotidiens
  - Entrées favorites
  - Historique complet

- **🍽️ Nutrition (Repas + Macros)**
  - Ajout rapide de repas
  - Tracking macros (Protéines, Glucides, Lipides)
  - Objectifs caloriques
  - Chart circulaire en temps réel

- **⚖️ Poids (Chart + Liste)**
  - Chart d'évolution avec tendance
  - Liste historique
  - Objectif de poids

- **✅ Habitudes**
  - Toggle quotidien
  - Streaks visuels
  - Gestion des habitudes

#### 🎓 **Apprentissage** → `/learning`
Module de formation avec IA intégrée :

- **💬 Chat IA (GPT-4)**
  - Conversation contextuelle
  - Suggestions de cours
  - Aide en temps réel

- **💻 Code Editor (Multi-langages)**
  - Python, JavaScript, TypeScript, Java, C++, Rust, Go, PHP, Ruby
  - Split view avec chat
  - Syntax highlighting
  - Code starter automatique

- **⌨️ Terminal émulé**
  - Exécution de commandes (simulée)
  - Interface réaliste

- **🔗 Tâches liées**
  - Lien vers module Tâches
  - Création de tâches depuis cours
  - Interconnexion bidirectionnelle

#### 📚 **Bibliothèque** → `/library`
Gestion complète de la lecture :

- **📖 Livres (Statut + Notes)**
  - À lire / En cours / Terminé
  - Couvertures Google Books API
  - Notes et rating (0-5 ⭐)

- **⏱️ Sessions lecture**
  - Timer de session
  - Progression en temps réel
  - Historique des sessions

- **💬 Citations & Notes**
  - Extraction de quotes
  - Page de référence
  - Favoris
  - Notes personnelles

- **🎯 Objectif annuel**
  - Nombre de livres / an
  - Progression visuelle
  - Statistiques détaillées

---

### 2️⃣ **Rangée 2 : Modules Méta & Utilitaires**

#### 📈 **Dashboard** → `/dashboard`
Vue d'ensemble non-prescriptive :

- **🔥 Streaks & Continuité**
  - Tâches, Journal, Habitudes, Apprentissage
  - Flame visual pour motivation

- **📊 Corrélations (Mood/Habits)**
  - Mood ↔ Habitudes
  - Patterns comportementaux
  - Insights automatiques

- **📈 Métriques cliquables**
  - Modales de détail pour chaque métrique
  - Sparklines 7 jours
  - Heures productives

- **👁️ Observe tous les modules**
  - Collecte passive de données
  - Analyse cross-module
  - Connexions invisibles (pointillés)

#### 📚 **Documentation** → `/docs`
Référence produit interactive :

- **📋 Référence produit**
  - Features par module
  - Accordéons détaillés
  - Statuts (✅ Implémenté / 🚧 Prévu / ❌ Exclu)

- **🔄 Flows React interactifs**
  - React Flow (zoom, pan, drag)
  - Diagrammes 800px immersifs
  - Visualisation des cheminements

#### ⚙️ **Paramètres** → `/settings`
Configuration globale :

- **👤 Nom utilisateur**
  - Personnalisation salutation Hub
  - Nom utilisé partout dans l'app

- **💾 Export/Import data**
  - Backup complet JSON
  - Import de sauvegarde
  - Migration de données

- **🎛️ Préférences**
  - Options diverses
  - Configuration avancée

---

## 🔗 Interconnexions Spéciales

### 1. **Pomodoro ↔ Tâches**
- **Type** : Intégration native
- **Flow** : Pomodoro est un onglet dans le module Tâches
- **Avantage** : Lancer un timer directement depuis une tâche

### 2. **Learning ↔ Tâches liées**
- **Type** : Liaison bidirectionnelle
- **Flow** : Créer des tâches depuis un cours, voir cours depuis une tâche
- **Avantage** : Lier apprentissage et mise en pratique

### 3. **Dashboard observe tout**
- **Type** : Observer pattern
- **Flow** : Dashboard collecte passivement les données de tous les modules
- **Visualisation** : Lignes pointillées vers Tasks, MyDay, Learning, Library
- **Avantage** : Métriques globales et corrélations cross-module

---

## 🎨 Code Couleur du Flow

| Couleur | Signification | Éléments |
|---------|---------------|----------|
| 🔵 **Bleu** (`#4a9eff`) | Flux principal, entrée | Hub start, navigation animée |
| 🟢 **Vert** (`#6ccb5f`) | Modules principaux | Tâches, MyDay, Learning, Library, Dashboard, Docs, Settings |
| 🟡 **Jaune** (`#ffc83d`) | Points de décision | "Choisir destination" |
| 🟣 **Violet** (`#b392f0`) | IA & Intelligence | Auto-détection, Chat GPT, Interconnexions |
| 🔴 **Rouge** (`#f85149`) | Temps & Focus | Pomodoro |
| 🟠 **Orange** (`#ff9500`) | Santé & Nutrition | Repas, Macros, Sessions lecture, Streaks |
| 🔵 **Cyan** (`#5ac8fa`, `#64d2ff`) | Données & Insights | Poids, Objectifs, Métriques, Corrélations |
| ⚫ **Gris foncé** (`#2d2d2d`) | Sous-fonctionnalités | Toutes les features secondaires |
| **Pointillés** | Observer/Optionnel | Dashboard observe modules, liens optionnels |

---

## 📊 Statistiques du Flow

- **Total nœuds** : 60+ nœuds
- **Total connexions** : 70+ edges
- **Modules principaux** : 8 (dont 1 documentation)
- **Sous-fonctionnalités** : 25+
- **Interconnexions** : 3 majeures
- **Profondeur maximale** : 5 niveaux (Hub → Module → Sub → Sub-sub → Interco)

---

## 🚀 Navigation Utilisateur Type

### Scénario 1 : Productivité du matin
```
Hub → Tâches → Voir colonne "Aujourd'hui" → Créer tâche (⌘N) → 
Auto-détection catégorie → Ajouter au projet → Lancer Pomodoro
```

### Scénario 2 : Apprentissage avec pratique
```
Hub → Apprentissage → Créer cours Python → Chat avec IA → 
Écrire code dans l'éditeur → Créer tâche liée → Retour Hub → Tâches
```

### Scénario 3 : Suivi santé complet
```
Hub → Ma Journée → Mood du jour → Ajouter repas déjeuner → 
Voir macros → Ajouter poids → Toggle habitude "Sport" → Voir streak
```

### Scénario 4 : Lecture & réflexion
```
Hub → Bibliothèque → Sélectionner livre → Démarrer session lecture → 
Timer en cours → Ajouter citation → Terminer session → Progression mise à jour
```

### Scénario 5 : Vue d'ensemble
```
Hub → Dashboard → Voir streak tâches (7 jours) → Cliquer métrique → 
Modal détail → Voir corrélation Mood/Habits → Identifier pattern
```

---

## 🎯 Points Clés de Design

1. **Simplicité d'entrée** : Le Hub est volontairement minimaliste (liste de liens centrée sur fond noir)
2. **Profondeur progressive** : Chaque module révèle sa complexité uniquement quand nécessaire
3. **Interconnexions intelligentes** : Les modules ne sont pas isolés, ils communiquent
4. **Observer passif** : Le Dashboard ne demande rien, il observe et analyse
5. **Flow visuel complet** : La documentation elle-même utilise React Flow pour visualiser les chemins

---

## 📱 Accès à la Documentation Interactive

1. **Depuis l'app** : Hub → Documentation
2. **Flow complet** : Visualisation React Flow avec zoom/pan/drag
3. **Diagramme immersif** : 800px de hauteur, pleine largeur
4. **Accordéons par défaut ouverts** : Toutes les features visibles directement

---

## 🏁 Conclusion

Le Hub de NewMars n'est pas juste un menu : c'est un **orchestrateur de flux utilisateur**. Chaque chemin a été pensé pour fluidifier l'expérience et maximiser les interconnexions naturelles entre les domaines de vie (productivité, santé, apprentissage, culture).

**Version interactive disponible** : `http://localhost:5174` → Hub → Documentation

---

*Document généré automatiquement le 21 décembre 2024*

