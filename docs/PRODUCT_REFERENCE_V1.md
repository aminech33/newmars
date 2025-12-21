# 📋 Document de Référence Produit — NewMars v1

> **Version** : 1.0.1  
> **Date de création** : 20 décembre 2024  
> **Dernière mise à jour** : 21 décembre 2024  
> **Auteur** : Product Team  
> **Statut** : Document officiel de référence — **Audit complet effectué**

---

## 📌 Objectif du document

Ce document définit le **périmètre fonctionnel officiel** de NewMars v1.  
Il sert de **contrat produit** : une fonctionnalité non listée ici n'existe pas dans le périmètre v1.

### Légende des statuts

| Statut | Signification |
|:-------|:--------------|
| ✅ **Implémenté** | Fonctionnalité opérationnelle en production |
| 🔄 **En cours** | Développement actif, non finalisé |
| 📋 **À faire** | Prévu pour v1, non commencé |
| ⛔ **Hors scope v1** | Explicitement exclu de la v1 |

---

## 1. Module : Hub / Accueil

### Rôle
Point d'entrée central de l'application, permettant la navigation vers tous les modules avec des interconnexions intelligentes.

### Écrans principaux
- **Hub** (`HubV2.tsx`) — Écran d'accueil minimaliste

### Fonctionnalités

| Fonctionnalité | Statut | Description |
|:---------------|:-------|:------------|
| Affichage date et salutation personnalisée | ✅ Implémenté | Salutation contextuelle (Bonjour/Bon après-midi/Bonsoir) + nom utilisateur |
| Navigation vers modules | ✅ Implémenté | Liens vers 8 modules : Tâches, Ma journée, Apprentissage, Bibliothèque, Dashboard, Documentation, Paramètres |
| Affichage nom utilisateur | ✅ Implémenté | Nom configurable dans les paramètres |
| Design minimaliste épuré | ✅ Implémenté | Interface centrée sur fond noir avec liens simples |
| **Interconnexions intelligentes** | 📋 À faire | 7 liaisons logiques entre modules pour fluidifier l'UX |
| Ma Journée ↔ Tâches | 📋 À faire | Voir tâches accomplies dans le journal, corrélation mood/productivité |
| Bibliothèque ↔ Apprentissage | 📋 À faire | Créer cours depuis livres techniques, ressources bibliographiques |
| Apprentissage → Habitudes | 📋 À faire | Auto-toggle habitude "Apprentissage" après 30min de cours |
| Dashboard cliquable | 📋 À faire | Cliquer métriques → Navigation contextuelle vers modules |

### Architecture de navigation

Le Hub propose une navigation vers 8 modules principaux avec **7 interconnexions logiques** :

#### 🎯 **Modules de Productivité**
- **✅ Tâches** : 4 colonnes temporelles, projets IA, Pomodoro intégré
- **📝 Ma Journée** : Journal (mood + entrées), Nutrition (repas + macros), Poids (chart + liste), Habitudes
- **🎓 Apprentissage** : Chat IA GPT-4, Code Editor multi-langages, Terminal émulé, Tâches liées
- **📚 Bibliothèque** : Livres (statut + notes), Sessions lecture, Citations & Notes, Objectif annuel

#### 📊 **Modules de Suivi & Méta**
- **📈 Dashboard** : Streaks & Continuité, Corrélations (Mood/Habits), Métriques cliquables
- **📚 Documentation** : Référence produit avec flows React interactifs
- **⚙️ Paramètres** : Nom utilisateur, Export/Import data, Préférences

#### 🔗 **Interconnexions Existantes** (Implémentées)
1. **Pomodoro ↔ Tâches** : Intégration native (onglet Focus dans module Tâches)
2. **Apprentissage ↔ Tâches** : Liaison bidirectionnelle (créer tâches depuis cours)
3. **Dashboard → Tous** : Observer pattern (collecte passive pour analytics)

#### 🚀 **Nouvelles Interconnexions** (Planifiées v1.1)
4. **📝 Ma Journée ↔ ✅ Tâches** : 
   - Voir les tâches accomplies dans le journal du jour
   - Corrélation mood/productivité
   - *Impact UX* : ⭐⭐⭐⭐⭐

5. **📚 Bibliothèque ↔ 🎓 Apprentissage** :
   - Bouton "Créer cours" sur chaque livre
   - Chat IA avec contexte du livre
   - *Impact UX* : ⭐⭐⭐⭐⭐

6. **🎓 Apprentissage → 📝 Habitudes** :
   - Auto-toggle après 30min de cours
   - Streak d'apprentissage automatique 🔥
   - *Impact UX* : ⭐⭐⭐⭐

7. **📈 Dashboard → ✅ Tâches/📝 MyDay/🎓 Learning/📚 Library** :
   - Cliquer "5 tâches urgentes" → Ouvre Tâches filtrées
   - Navigation contextuelle directe depuis métriques
   - *Impact UX* : ⭐⭐⭐⭐⭐

### Fonctionnalités exclues v1
- Widgets personnalisables sur le Hub
- Résumé des statistiques du jour
- Suggestions contextuelles du Brain
- Mode sombre/clair dynamique sur le Hub
- Raccourcis clavier numériques vers les modules

---

## 2. Module : Tâches

### Rôle
Gestion des tâches avec organisation temporelle en colonnes (Aujourd'hui, En cours, À venir, Lointain).

### Écrans principaux
- **TasksPage** (`tasks/TasksPage.tsx`) — Vue principale des tâches en colonnes
- **TaskDetails** (`tasks/TaskDetails.tsx`) — Panneau de détail d'une tâche
- **PomodoroPage** (intégré) — Onglet Focus avec timer Pomodoro

### Fonctionnalités

| Fonctionnalité | Statut | Description |
|:---------------|:-------|:------------|
| Vue en 4 colonnes temporelles | ✅ Implémenté | Aujourd'hui, En cours, À venir, Lointain |
| Création rapide de tâche | ✅ Implémenté | Raccourci ⌘N, saisie rapide |
| Complétion de tâche | ✅ Implémenté | Toggle avec animation, confetti optionnel |
| Tâche prioritaire unique | ✅ Implémenté | Une seule tâche marquée prioritaire à la fois |
| Catégorisation automatique | ✅ Implémenté | Détection catégorie/priorité depuis le titre |
| Estimation durée | ✅ Implémenté | Estimation automatique du temps |
| Sous-tâches | ✅ Implémenté | Ajout/toggle/suppression de sous-tâches |
| Dates d'échéance | ✅ Implémenté | Date limite avec indicateur visuel retard |
| Projets | ✅ Implémenté | Regroupement par projet avec couleur/icône |
| Catégories personnalisées | ✅ Implémenté | Création de catégories avec emoji |
| Système de quota | ✅ Implémenté | Limite de tâches visibles, déblocage automatique |
| Génération projet IA | ✅ Implémenté | Analyse domaine → compétences → plan de tâches |
| Onglet Focus/Pomodoro intégré | ✅ Implémenté | Timer Pomodoro accessible depuis les tâches |
| Historique (undo/redo) | ✅ Implémenté | Annulation des actions sur les tâches |
| Relations entre tâches | ✅ Implémenté | Dépendances, blocages entre tâches |

### Fonctionnalités exclues v1
- Vue Kanban classique (todo/doing/done)
- Vue calendrier
- Récurrence de tâches
- Assignation multi-utilisateurs
- Tags personnalisés (hors catégories)
- Export des tâches

---

## 3. Module : Journal / Ma Journée

### Rôle
Espace de réflexion quotidienne combinant intention du jour, habitudes et notes libres.

### Écrans principaux
- **MyDayPage** (`myday/MyDayPage.tsx`) — Page unifiée Journal/Nutrition/Poids

### Fonctionnalités — Onglet Journal

| Fonctionnalité | Statut | Description |
|:---------------|:-------|:------------|
| Intention du jour | ✅ Implémenté | Champ texte pour l'objectif principal |
| Première action | ✅ Implémenté | Suggestion depuis tâche prioritaire, éditable |
| Sélection humeur | ✅ Implémenté | 5 niveaux d'emoji (😢 😐 🙂 😊 🤩) |
| Notes libres | ✅ Implémenté | Zone de texte pour réflexions |
| Sauvegarde automatique | ✅ Implémenté | Auto-save après 3 secondes d'inactivité |
| Habitudes/Rituels | ✅ Implémenté | Liste de rituels quotidiens cochables |
| Ajout d'habitude | ✅ Implémenté | Création de nouvelles habitudes |
| Suppression d'habitude | ✅ Implémenté | Avec confirmation |
| Streak habitudes | ✅ Implémenté | Compteur de jours consécutifs |
| Historique des entrées | ✅ Implémenté | Liste des 5 dernières entrées |
| Statistiques journal | ✅ Implémenté | Streak, humeur moyenne, total entrées |
| Favoris journal | ✅ Implémenté | Marquer une entrée comme favorite |

### Fonctionnalités exclues v1
- Prompts de réflexion guidée
- Export du journal
- Recherche dans le journal
- Rappels de journaling
- Analyse de sentiment automatique

---

## 4. Module : Santé

### Rôle
Suivi du poids, de la nutrition et de l'hydratation.

### Écrans principaux
- **MyDayPage** — Onglets Nutrition et Poids intégrés

### Fonctionnalités — Onglet Nutrition

| Fonctionnalité | Statut | Description |
|:---------------|:-------|:------------|
| Ajout de repas | ✅ Implémenté | Modal avec détails nutritionnels |
| Suivi calories | ✅ Implémenté | Total journalier vs objectif |
| Suivi macros | ✅ Implémenté | Protéines, glucides, lipides avec graphique circulaire |
| Historique repas | ✅ Implémenté | Liste des repas récents |
| Duplication repas | ✅ Implémenté | Répéter un repas existant |
| Suppression repas | ✅ Implémenté | Avec confirmation et undo |

### Fonctionnalités — Onglet Poids

| Fonctionnalité | Statut | Description |
|:---------------|:-------|:------------|
| Ajout pesée | ✅ Implémenté | Poids avec date et note optionnelle |
| Graphique évolution | ✅ Implémenté | Courbe de tendance du poids |
| Historique pesées | ✅ Implémenté | Liste des entrées récentes |
| Tendance poids | ✅ Implémenté | Indicateur gaining/losing/stable |
| Suppression entrée | ✅ Implémenté | Avec undo |

### Fonctionnalités — Profil santé

| Fonctionnalité | Statut | Description |
|:---------------|:-------|:------------|
| Profil utilisateur | ✅ Implémenté | Taille, âge, genre, niveau d'activité |
| Objectifs santé | ✅ Implémenté | Objectif poids, calories |

### Fonctionnalités exclues v1
- Suivi du sommeil
- Suivi exercice physique (structure présente mais non exposée)
- Intégration Apple Health / Google Fit
- Scan code-barres aliments
- Base de données aliments complète
- Rappels hydratation

---

## 5. Module : Apprentissage

### Rôle
Plateforme d'apprentissage assistée par IA avec tuteur conversationnel.

### Écrans principaux
- **LearningPage** (`learning/LearningPage.tsx`) — Vue principale avec liste cours et chat
- **CourseChat** (`learning/CourseChat.tsx`) — Interface de conversation avec l'IA

### Fonctionnalités

| Fonctionnalité | Statut | Description |
|:---------------|:-------|:------------|
| Création de cours | ✅ Implémenté | Nom, description, niveau, sujets |
| Liste des cours | ✅ Implémenté | Avec recherche, filtres, tri |
| Chat IA tuteur | ✅ Implémenté | Conversation avec Gemini AI |
| Streaming réponses | ✅ Implémenté | Affichage progressif des réponses |
| Contexte de code | ✅ Implémenté | Envoi de code pour analyse |
| Épinglage cours | ✅ Implémenté | Cours favoris en haut de liste |
| Archivage cours | ✅ Implémenté | Masquer les cours terminés |
| Suppression cours | ✅ Implémenté | Avec confirmation |
| System prompt personnalisé | ✅ Implémenté | Personnalisation du comportement IA |
| Suivi temps d'étude | ✅ Implémenté | Via sessions Pomodoro liées |
| Lien cours ↔ projet | ✅ Implémenté | Association avec un projet de tâches |

### Fonctionnalités exclues v1
- Flashcards (structure présente, UI non exposée)
- Notes de cours (structure présente, UI non exposée)
- Quiz automatiques
- Progression par chapitres
- Certificats de complétion
- Mode hors-ligne

---

## 6. Module : Pomodoro

### Rôle
Timer de focus basé sur la technique Pomodoro, intégré aux tâches et à l'apprentissage.

### Écrans principaux
- **PomodoroPage** (`pomodoro/PomodoroPage.tsx`) — Timer et historique
- Intégré dans TasksPage (onglet Focus)

### Fonctionnalités

| Fonctionnalité | Statut | Description |
|:---------------|:-------|:------------|
| Timer circulaire | ✅ Implémenté | Affichage visuel du temps restant |
| Durées préréglées | ✅ Implémenté | 15, 25, 30, 45, 60 minutes |
| Pause courte/longue | ✅ Implémenté | Configurable (défaut 5/15 min) |
| Liaison tâche | ✅ Implémenté | Associer session à une tâche |
| Liaison projet | ✅ Implémenté | Associer session à un projet |
| Liaison livre | ✅ Implémenté | Associer session à un livre (temps de lecture) |
| Liaison cours | ✅ Implémenté | Associer session à un cours (temps d'étude) |
| Auto-démarrage pauses | ✅ Implémenté | Option configurable |
| Sons de fin | ✅ Implémenté | Notification sonore, volume réglable |
| Notifications système | ✅ Implémenté | Notification navigateur |
| Historique du jour | ✅ Implémenté | Liste des sessions complétées |
| Statistiques sessions | ✅ Implémenté | Nombre de sessions, temps total |
| Titre dynamique | ✅ Implémenté | Temps restant dans l'onglet navigateur |
| Raccourcis clavier | ✅ Implémenté | Espace = play/pause, R = reset |

### Fonctionnalités exclues v1
- Son de tic-tac pendant le timer
- Statistiques hebdomadaires/mensuelles (dans Dashboard)
- Objectif quotidien de sessions
- Mode strict (blocage interruptions)

---

## 7. Module : Bibliothèque

### Rôle
Gestion de la bibliothèque personnelle avec suivi de lecture.

### Écrans principaux
- **LearningPage** — Onglet Livres intégré
- **BookDetailModal** — Détails d'un livre
- **QuotesLibraryPage** — Bibliothèque de citations

### Fonctionnalités

| Fonctionnalité | Statut | Description |
|:---------------|:-------|:------------|
| Ajout de livre | ✅ Implémenté | Titre, auteur, pages, genre, couverture |
| Statuts de lecture | ✅ Implémenté | À lire, En cours, Terminé |
| Progression pages | ✅ Implémenté | Page actuelle / total |
| Sessions de lecture | ✅ Implémenté | Timer avec durée enregistrée |
| Notation | ✅ Implémenté | Note sur 5 étoiles |
| Citations | ✅ Implémenté | Ajout, édition, suppression de citations |
| Notes de lecture | ✅ Implémenté | Notes personnelles par livre |
| Bibliothèque citations | ✅ Implémenté | Vue globale de toutes les citations |
| Filtres | ✅ Implémenté | Par statut, genre |
| Tri | ✅ Implémenté | Récent, titre, auteur, note, progression, pages |
| Recherche | ✅ Implémenté | Par titre, auteur, genre |
| Objectif annuel | ✅ Implémenté | Nombre de livres à lire par an |
| Export JSON | ✅ Implémenté | Export de la bibliothèque |
| Export citations Markdown | ✅ Implémenté | Export des citations en .md |
| Import JSON | ✅ Implémenté | Import depuis fichier |
| Favoris | ✅ Implémenté | Marquer un livre comme favori |
| Genres prédéfinis | ✅ Implémenté | Liste de genres avec emoji |

### Fonctionnalités exclues v1
- Recherche couverture automatique (API)
- Scan ISBN
- Recommandations de lecture
- Partage social
- Intégration Goodreads

---

## 8. Module : Dashboard / Statistiques

### Rôle
Vue d'ensemble des indicateurs de continuité et tendances globales.

### Écrans principaux
- **Dashboard** (`Dashboard.tsx`) — Tableau de bord statistiques

### Fonctionnalités

| Fonctionnalité | Statut | Description |
|:---------------|:-------|:------------|
| États du jour | ✅ Implémenté | Actif/Inactif pour Tâches, Habitudes, Journal, Focus |
| Séries de consistance | ✅ Implémenté | Streaks : Tâches, Habitudes, Journal, Pomodoro, Santé, Lecture |
| Indicateur continuité globale | ✅ Implémenté | Forte/Partielle/Faible selon streaks actifs |
| Graphique tâches 7 jours | ✅ Implémenté | Barres des tâches complétées |
| Graphique focus 7 jours | ✅ Implémenté | Barres des minutes de focus |
| Corrélation Humeur ↔ Habitudes | ✅ Implémenté | Coefficient de corrélation |
| Corrélation Productivité ↔ Pomodoro | ✅ Implémenté | Coefficient de corrélation |

### Fonctionnalités exclues v1
- Graphiques interactifs détaillés
- Export des statistiques
- Comparaison semaine/mois précédent
- Objectifs personnalisés par métrique
- Insights automatiques

---

## 9. Module : Paramètres

### Rôle
Configuration de l'application et gestion des données.

### Écrans principaux
- **SettingsPage** (`SettingsPage.tsx`) — Page paramètres avec sections

### Fonctionnalités — Section Apparence

| Fonctionnalité | Statut | Description |
|:---------------|:-------|:------------|
| Mode sombre | ✅ Implémenté | Toggle (actuellement fixe sur sombre) |
| Couleur d'accent | ✅ Implémenté | 4 choix : Indigo, Violet, Cyan, Émeraude |
| Toggle animations | ✅ Implémenté | Activer/désactiver les animations |

### Fonctionnalités — Section Données

| Fonctionnalité | Statut | Description |
|:---------------|:-------|:------------|
| Export JSON | ✅ Implémenté | Téléchargement de toutes les données |
| Import JSON | ✅ Implémenté | Restauration depuis fichier |
| Réinitialisation complète | ✅ Implémenté | Suppression de toutes les données (avec confirmation) |

### Fonctionnalités — Section Avancé

| Fonctionnalité | Statut | Description |
|:---------------|:-------|:------------|
| Toggle confettis | ✅ Implémenté | Animations de célébration (désactivé par défaut) |
| Affichage version | ✅ Implémenté | Numéro de version de l'application |

### Fonctionnalités exclues v1
- Thème clair
- Personnalisation des raccourcis clavier
- Synchronisation cloud
- Gestion de compte utilisateur
- Notifications push configurables
- Langue / internationalisation

---

## 10. Fonctionnalités Transversales

### Système global

| Fonctionnalité | Statut | Description |
|:---------------|:-------|:------------|
| Persistance localStorage | ✅ Implémenté | Sauvegarde automatique des données |
| Recherche globale | ✅ Implémenté | Command palette (⌘K) |
| Raccourcis clavier | ✅ Implémenté | Navigation et actions rapides |
| Toasts de notification | ✅ Implémenté | Feedback utilisateur non-bloquant |
| Indicateur hors-ligne | ✅ Implémenté | Détection perte de connexion |
| Backup automatique | ✅ Implémenté | Sauvegarde périodique |
| Error Boundary | ✅ Implémenté | Gestion des erreurs React |
| Lazy loading | ✅ Implémenté | Chargement différé des pages |
| PWA | ✅ Implémenté | Installation comme app native |

### Cerveau algorithmique (Brain)

| Fonctionnalité | Statut | Description |
|:---------------|:-------|:------------|
| Observation des événements | ✅ Implémenté | Collecte silencieuse des actions utilisateur |
| Mémoire persistante | ✅ Implémenté | Stockage des 7 derniers jours d'événements |
| Analyse des patterns | ✅ Implémenté | Détection heures productives, habitudes, corrélations |
| Prédictions | ✅ Implémenté | Bon moment pour travailler, risque procrastination, énergie |
| Suggestions bienveillantes | ✅ Implémenté | Messages contextuels non-intrusifs |
| Score de bien-être | ✅ Implémenté | Score 0-100 (productivité + santé + mental + constance) |
| Intégration UI | 📋 À faire | Widget Brain sur le Hub |

---

## 11. Architecture technique

### Stack technologique

| Composant | Technologie |
|:----------|:------------|
| Framework | React 18 + TypeScript |
| State Management | Zustand avec persist |
| Styling | Tailwind CSS |
| Build | Vite |
| Desktop | Tauri (optionnel) |
| IA | Gemini API (Google) |
| Backend | FastAPI (Python) — pour génération de plans |

### Structure des données

| Entité | Stockage |
|:-------|:---------|
| Tâches | localStorage via Zustand |
| Projets | localStorage via Zustand |
| Habitudes | localStorage via Zustand |
| Journal | localStorage via Zustand |
| Santé | localStorage via Zustand |
| Cours | localStorage via Zustand |
| Livres | localStorage via Zustand |
| Brain | localStorage séparé |

---

## 12. Résumé des modules v1

| Module | Statut global | Fonctionnalités clés |
|:-------|:--------------|:---------------------|
| Hub | ✅ Complet | Navigation, salutation |
| Tâches | ✅ Complet | Colonnes temporelles, projets, génération IA |
| Journal | ✅ Complet | Intention, habitudes, humeur |
| Santé | ✅ Complet | Poids, nutrition, macros |
| Apprentissage | ✅ Complet | Chat IA tuteur, cours |
| Pomodoro | ✅ Complet | Timer, liaisons, historique |
| Bibliothèque | ✅ Complet | Livres, citations, sessions |
| Dashboard | ✅ Complet | Streaks, corrélations |
| Paramètres | ✅ Complet | Thème, export/import |
| Brain | 🔄 Partiel | Backend OK, UI à intégrer |

---

## 📝 Notes de version

### v1.0.0 (Décembre 2024)
- Release initiale
- 9 modules fonctionnels
- Cerveau algorithmique en backend
- PWA opérationnelle

---

*Ce document est la source de vérité pour le périmètre fonctionnel de NewMars v1.*

