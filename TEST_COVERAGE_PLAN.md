# 🧪 Plan Complet de Tests - IKU V1

## 📊 Vue d'ensemble par module

| Module | Fonctionnalités | Tests Prévus | Statut |
|--------|----------------|--------------|---------|
| **Tasks** | Création, édition, Kanban, projets, filtres, stats, quota, sous-tâches, import/export | **25 tests** | ⏳ En cours |
| **Calendar** | Événements, vues (mois/semaine/jour), filtres, récurrence, smart suggestions, rappels | **20 tests** | ⏳ En cours |
| **Health** | Poids, nutrition, calories, macros, BMI, trends, base aliments, graphiques | **18 tests** | ⏳ En cours |
| **My Day (Habits + Journal)** | Habitudes, tracking, streak, journal, mood, gratitude, tags, historique | **22 tests** | ⏳ En cours |
| **Dashboard** | Widgets, drag & drop, personnalisation, stats, métriques, graphiques | **15 tests** | ⏳ En cours |
| **Pomodoro** | Timer, breaks, sessions, stats, intégration tâches/livres/cours, historique | **20 tests** | ⏳ En cours |
| **Library** | Livres, lectures, citations, notes, objectifs, stats, sessions, import/export | **20 tests** | ⏳ En cours |
| **Learning** | Cours, IA tuteur, flashcards, progression, projets, chat streaming | **18 tests** | ⏳ En cours |
| **Settings** | Thème, notifications, raccourcis, backup, langue, préférences | **12 tests** | ⏳ En cours |
| **Global** | Navigation, recherche, deep linking, raccourcis clavier, accessibilité | **15 tests** | ⏳ En cours |

**TOTAL : 185 TESTS MANUELS**

---

## 📋 TASKS MODULE (25 tests)

### 1. Gestion de base (5 tests)
- ✅ Créer une tâche simple
- ✅ Éditer une tâche
- ✅ Marquer comme complétée
- ✅ Supprimer une tâche
- ⬜ Quick Add avec Cmd+N

### 2. Projets (5 tests)
- ✅ Créer un projet
- ✅ Assigner tâche à projet
- ⬜ Créer projet avec tâches multiples
- ⬜ Éditer couleur/icône projet
- ⬜ Supprimer projet

### 3. Vue Kanban (3 tests)
- ✅ Déplacer tâche entre colonnes
- ⬜ Drag & drop multiple
- ⬜ Vue compacte

### 4. Filtres & Recherche (4 tests)
- ✅ Recherche par titre
- ⬜ Filtrer par priorité
- ⬜ Filtrer par catégorie
- ⬜ Quick filters (Today/Week/Urgent)

### 5. Sous-tâches (2 tests)
- ✅ Ajouter sous-tâche
- ⬜ Cocher sous-tâche

### 6. Fonctions avancées (6 tests)
- ⬜ Task Quota (limite quotidienne)
- ⬜ Bloquer temps dans calendrier
- ⬜ Stats détaillées (productivité)
- ⬜ Command Center
- ⬜ Intelligence AI (catégorisation auto)
- ⬜ Undo/Redo

---

## 📅 CALENDAR MODULE (20 tests)

### 1. Gestion événements (5 tests)
- ✅ Créer événement
- ✅ Éditer événement
- ✅ Supprimer événement
- ⬜ Quick Add sur date
- ⬜ Événement multi-jours

### 2. Vues (3 tests)
- ⬜ Vue Mois
- ⬜ Vue Semaine (avec heures)
- ⬜ Vue Jour (timeline)

### 3. Récurrence (3 tests)
- ⬜ Événement quotidien
- ⬜ Événement hebdomadaire
- ⬜ Événement mensuel

### 4. Filtres (3 tests)
- ⬜ Filtrer par type
- ⬜ Filtrer par catégorie
- ⬜ Filtrer par priorité

### 5. Fonctions avancées (6 tests)
- ⬜ Smart Suggestions (détection automatique)
- ⬜ Rappels événements
- ⬜ Compléter événement
- ⬜ Navigation rapide (Aujourd'hui)
- ⬜ Deep linking depuis recherche
- ⬜ Stats événements

---

## ❤️ HEALTH MODULE (18 tests)

### 1. Poids (5 tests)
- ✅ Ajouter entrée poids
- ⬜ Supprimer entrée poids
- ⬜ Voir graphique poids
- ⬜ Calculer BMI
- ⬜ Tendance (hausse/baisse)

### 2. Nutrition (6 tests)
- ✅ Ajouter repas
- ⬜ Supprimer repas
- ⬜ Calories du jour
- ⬜ Macros (protéines/glucides/lipides)
- ⬜ Graphique circulaire macros
- ⬜ Objectif calorique

### 3. Base aliments (3 tests)
- ⬜ Rechercher aliment
- ⬜ Voir détails aliment
- ⬜ Ajouter depuis base

### 4. Stats (4 tests)
- ⬜ Vue Overview (aujourd'hui)
- ⬜ Filtrer par date
- ⬜ Streak nutrition
- ⬜ Suggestions personnalisées

---

## 📖 MY DAY MODULE (22 tests)

### 1. Habitudes (8 tests)
- ✅ Créer habitude
- ✅ Cocher habitude aujourd'hui
- ⬜ Supprimer habitude
- ⬜ Calculer streak
- ⬜ Voir calendrier habitude
- ⬜ Stats habitudes (taux complétion)
- ⬜ Graphique 7 derniers jours
- ⬜ Habit Card détaillé

### 2. Journal (8 tests)
- ✅ Choisir mood
- ✅ Écrire réflexion
- ⬜ Ajouter gratitude (3)
- ⬜ Objectif principal
- ⬜ Apprentissage du jour
- ⬜ Victoire du jour
- ⬜ Ajouter tags
- ⬜ Auto-save après 3s

### 3. Historique (6 tests)
- ⬜ Voir entrées passées
- ⬜ Rechercher dans journal
- ⬜ Filtrer par mood
- ⬜ Filtrer favoris
- ⬜ Toggle favori
- ⬜ Stats journal (streak, moyenne mood)

---

## 📊 DASHBOARD MODULE (15 tests)

### 1. Widgets (6 tests)
- ⬜ Ajouter widget
- ⬜ Supprimer widget
- ⬜ Drag & drop widget
- ⬜ Redimensionner widget
- ⬜ Widgets compacts/expanded
- ⬜ Sauvegarder layout

### 2. Types de widgets (5 tests)
- ⬜ Tasks Widget
- ⬜ Calendar Widget
- ⬜ Habits Widget
- ⬜ Journal Widget
- ⬜ Pomodoro Widget

### 3. Métriques (4 tests)
- ⬜ Productivity Score
- ⬜ Graphiques 7 jours
- ⬜ Détail métrique (modal)
- ⬜ Heatmap productivité (24h)

---

## ⏱️ POMODORO MODULE (20 tests)

### 1. Timer de base (5 tests)
- ⬜ Démarrer focus
- ⬜ Pause
- ⬜ Reprendre
- ⬜ Reset
- ⬜ Skip break

### 2. Configuration (5 tests)
- ⬜ Durée focus custom
- ⬜ Durée pause courte
- ⬜ Durée pause longue
- ⬜ Interval longue pause
- ⬜ Auto-start breaks

### 3. Intégrations (4 tests)
- ⬜ Lier tâche
- ⬜ Lier projet
- ⬜ Lier livre (lecture)
- ⬜ Lier cours (apprentissage)

### 4. Stats & Historique (6 tests)
- ⬜ Sessions complétées
- ⬜ Temps focus total
- ⬜ Streak jours
- ⬜ Productivité par heure
- ⬜ Stats par projet
- ⬜ Historique par date

---

## 📚 LIBRARY MODULE (20 tests)

### 1. Gestion livres (6 tests)
- ✅ Ajouter livre
- ⬜ Éditer livre (titre, auteur, pages)
- ⬜ Supprimer livre
- ⬜ Changer statut (to-read/reading/completed)
- ⬜ Mettre note/rating
- ⬜ Ajouter couverture (URL)

### 2. Progression (4 tests)
- ⬜ Mettre à jour page actuelle
- ⬜ Calculer % progression
- ⬜ Session de lecture (start/end)
- ⬜ Timer session automatique

### 3. Citations & Notes (4 tests)
- ⬜ Ajouter citation
- ⬜ Éditer citation
- ⬜ Supprimer citation
- ⬜ Ajouter note

### 4. Filtres & Stats (3 tests)
- ⬜ Filtrer par statut
- ⬜ Rechercher livre
- ⬜ Trier (titre/auteur/rating/progression)

### 5. Objectifs & Export (3 tests)
- ⬜ Définir objectif annuel
- ⬜ Export JSON
- ⬜ Export citations Markdown

---

## 🎓 LEARNING MODULE (18 tests)

### 1. Gestion cours (4 tests)
- ⬜ Créer cours
- ⬜ Éditer cours (titre, description, objectifs)
- ⬜ Supprimer cours
- ⬜ Templates cours

### 2. Chat IA (5 tests)
- ⬜ Envoyer message
- ⬜ Streaming réponse Gemini
- ⬜ Historique conversation
- ⬜ Scroll auto nouveau message
- ⬜ Erreur API handling

### 3. Flashcards (3 tests)
- ⬜ Voir flashcards
- ⬜ Réviser flashcard
- ⬜ Score flashcard

### 4. Progression (3 tests)
- ⬜ Topics complétés
- ⬜ Barre de progression
- ⬜ Stats cours

### 5. Projets Learning (3 tests)
- ⬜ Ajouter projet pratique
- ⬜ Marquer projet complété
- ⬜ Voir projets cours

---

## ⚙️ SETTINGS MODULE (12 tests)

### 1. Apparence (3 tests)
- ⬜ Changer mode d'édition
- ⬜ Toggle compact mode
- ⬜ Animations on/off

### 2. Notifications (3 tests)
- ⬜ Activer notifications
- ⬜ Notifications événements
- ⬜ Notifications Pomodoro

### 3. Data (3 tests)
- ⬜ Export backup JSON
- ⬜ Import backup JSON
- ⬜ Clear all data

### 4. Raccourcis (3 tests)
- ⬜ Voir liste raccourcis
- ⬜ Tester Cmd+K (recherche)
- ⬜ Tester navigation rapide

---

## 🌐 GLOBAL MODULE (15 tests)

### 1. Navigation (4 tests)
- ⬜ Hub → Tasks
- ⬜ Hub → Calendar
- ⬜ Hub → My Day
- ⬜ Retour Hub depuis n'importe où

### 2. Recherche globale (4 tests)
- ⬜ Ouvrir recherche (Cmd+K)
- ⬜ Chercher tâche
- ⬜ Chercher événement
- ⬜ Chercher page

### 3. Deep Linking (3 tests)
- ⬜ Ouvrir tâche depuis recherche
- ⬜ Ouvrir événement depuis recherche
- ⬜ Ouvrir livre depuis recherche

### 4. Accessibilité (4 tests)
- ⬜ Navigation clavier (Tab)
- ⬜ ARIA labels
- ⬜ Focus states
- ⬜ Screen reader compatible

---

## 🎯 Progression Globale

**Tests complétés : 15 / 185 (8%)**  
**Tests restants : 170**

### Priorité Haute (V1 Critique)
- Tasks : Création, édition, Kanban ✅
- Calendar : Événements de base ✅
- Health : Poids & nutrition ✅
- My Day : Habitudes & Journal ✅
- Global : Navigation & recherche

### Priorité Moyenne
- Dashboard : Widgets
- Pomodoro : Timer & stats
- Library : Livres & lectures
- Learning : Cours & IA

### Priorité Basse (Post-V1)
- Settings avancés
- Export/Import
- Accessibilité avancée



