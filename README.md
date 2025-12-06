# 🚀 IKU - Personal Productivity Hub

> **Votre "Second Cerveau" numérique.** Une application de productivité tout-en-un conçue pour gérer votre vie, votre santé et vos connaissances avec une esthétique Premium Dark Mode.

![Version](https://img.shields.io/badge/version-1.0.0-blueviolet) ![Status](https://img.shields.io/badge/status-Production%20Ready-success) ![Tech](https://img.shields.io/badge/tech-React%20%7C%20Tauri%20%7C%20TypeScript-blue)

---

## 📊 État du Projet : v1.0 (Production Ready)

L'application est désormais stable, complète et optimisée pour une utilisation quotidienne sur Desktop et Mobile.

| Module | Version | Note | État |
|:---|:---:|:---:|:---|
| **Dashboard** | v1.0 | 9.5/10 | **Parfait.** Widgets interactifs, Drag & Drop, Layout persistant. |
| **Santé & Nutrition** | v1.0 | 9.5/10 | **Avancé.** Tracker calories temps réel, Base d'aliments, Macros. |
| **Tâches (Kanban)** | v1.0 | 9.0/10 | **Complet.** Vue Kanban, Sous-tâches, Projets, Filtres. |
| **Calendrier** | v1.0 | 9.0/10 | **Solide.** Récurrence complexe, Vues Mois/Semaine. |
| **Bibliothèque** | v1.0 | 9.0/10 | **Nouveau !** Gestion livres, Sessions lecture, Citations. |
| **Habitudes** | v1.0 | 8.5/10 | **Efficace.** Heatmap, Streaks, Stats détaillées. |
| **Journal** | v1.0 | 8.0/10 | **Fonctionnel.** Entrées rapides, Humeur, Gratitude. |
| **Mobile / PWA** | v1.0 | 9.0/10 | **Optimisé.** Support iOS/Android, Mode Offline. |

---

## 🌟 Fonctionnalités Détaillées

### 1. 🏥 Santé & Nutrition (v1.0)
*Le module le plus avancé techniquement.*
- **Tracker Nutritionnel :** Calcul automatique des calories et macros (Protéines/Glucides/Lipides) en temps réel.
- **Base de Données :** +100 aliments intégrés (USDA/CIQUAL) avec recherche instantanée.
- **Repas Complexes :** Créez des repas multi-aliments.
- **Suivi Poids :** Graphiques d'évolution et calcul automatique du TDEE/BMI.
- **Objectifs Visuels :** Barres de progression dynamiques qui changent de couleur selon l'atteinte des objectifs.

### 2. 📚 Bibliothèque & Savoir (v1.0)
*Votre gestionnaire de connaissances personnel.*
- **Suivi de Lecture :** Timer de session, calcul de la vitesse de lecture.
- **Base de Livres :** Gestion de votre collection (Lus, En cours, À lire).
- **Citations & Notes :** Capturez les passages importants.
- **Stats de Lecture :** Pages lues par jour, temps total, livres terminés.

### 3. ✅ Tâches & Projets (v1.0)
*Plus qu'une simple To-Do list.*
- **Vue Kanban :** Glisser-déposer fluide entre "À faire", "En cours", "Terminé".
- **Projets :** Organisation par projet avec couleurs et icônes personnalisées.
- **Gamification :** Système de "Quota" pour se concentrer sur l'essentiel (débloquez des tâches en travaillant).
- **Sous-tâches :** Découpez les tâches complexes.

### 4. 📅 Calendrier Intelligent (v1.0)
- **Récurrence Complète :** Événements quotidiens, hebdos, mensuels.
- **Vues Multiples :** Basculez entre vue Mois et Semaine.
- **Intégration :** Les tâches avec date limite apparaissent sur le calendrier.

### 5. 🧩 Dashboard Modulaire (v1.0)
- **Widgets :** Une douzaine de widgets (Pomodoro, Météo, IA, Tâches...).
- **Personnalisation :** Drag & drop complet pour organiser votre espace.
- **Registry :** Système robuste pour charger uniquement les widgets nécessaires.

### 6. 🔥 Habitudes & Journal
- **Habit Tracker :** Visualisez votre constance avec des "Streaks" (séries) et une Heatmap.
- **Journal Rapide :** Capturez votre humeur, vos gratitudes et vos réflexions du jour sans friction.

---

## 🛠 Stack Technique

Une architecture moderne, performante et maintenable.

*   **Frontend :** React 18, TypeScript, Vite
*   **Desktop :** Tauri v2 (Rust) pour une app native ultra-légère
*   **State Management :** Zustand (avec persistance locale)
*   **Styling :** Tailwind CSS (Design System "Mars" personnalisé)
*   **Performance :** Lazy Loading, Memoization, Virtualisation
*   **Offline First :** Toutes les données sont stockées localement (LocalStorage/IndexedDB).

---

## 🚀 Installation & Démarrage

### Prérequis
*   Node.js (v18+)
*   Rust (uniquement pour compiler la version Desktop)

### 1. Version Web (Développement)
```bash
# Installer les dépendances
npm install

# Lancer le serveur de dev
npm run dev
# -> Accessible sur http://localhost:5173
```

### 2. Version Desktop (Tauri)
```bash
# Lancer en mode dev (fenêtre native)
npm run tauri:dev

# Construire l'exécutable final (.exe / .dmg)
npm run tauri:build
```

---

## 📝 Changelog Récent

### v1.0.0 - The "Golden" Release (06 Déc 2024)
- 🧹 **Grand Nettoyage :** Suppression des fichiers de dev et documentation obsolète.
- 📱 **Mobile Polish :** Optimisations finales pour iOS Safari (PWA).
- 🎨 **Design Harmonization :** Unification des styles sur tous les modules.

### v0.9.0 - Library Update (01 Déc 2024)
- ✨ **Nouveau Module :** Ajout complet de la Bibliothèque (Library).
- 🔄 **Refactor :** Suppression du widget "QuickActions" obsolète.

### v0.8.0 - Nutrition Revolution (30 Nov 2024)
- 🍎 **Nutrition v2 :** Ajout de la base d'aliments et du tracker macros.
- ⚡ **Performance :** Optimisation du chargement des widgets.

---

## 🔮 Roadmap v1.X

Maintenant que la base est solide, les prochaines étapes sont :
- [ ] **Sync Cloud :** Sauvegarde optionnelle sur le cloud (Supabase ?).
- [ ] **Tests :** Ajout de tests unitaires (Vitest) pour sécuriser le core.
- [ ] **Export PDF :** Rapports mensuels de productivité et santé.

---

*Développé avec ❤️ par Amine.*
