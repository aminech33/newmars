# 🧠 Brain - Connexions établies

Ce fichier documente toutes les connexions établies entre le Brain et les actions utilisateur dans l'application.

## ✅ Connexions réalisées

### 1. **Tâches** (4 événements connectés)

| Action | Événement Brain | Localisation |
|--------|----------------|--------------|
| `addTask()` | `observeTaskCreated()` | `useStore.ts:478` |
| `toggleTask()` | `observeTaskCompleted()` | `useStore.ts:493` |
| `deleteTask()` | `observeTaskDeleted()` | `useStore.ts:516` |
| `moveTask()` | `observeTaskMoved()` + `observeTaskCompleted()` | `useStore.ts:534` |

**Détails :**
- Création de tâche envoie : `{id, title, category, priority}`
- Complétion de tâche envoie : `{id, title, duration}`
- Déplacement vers "done" compte aussi comme complétion

---

### 2. **Pomodoro** (2 événements connectés)

| Action | Événement Brain | Localisation |
|--------|----------------|--------------|
| `addPomodoroSession()` | `observePomodoroCompleted()` ou `observePomodoroInterrupted()` | `useStore.ts:753` |

**Détails :**
- Détecte automatiquement si la session est interrompue (`session.interrupted`)
- Envoie la durée réelle vs durée prévue
- Ne s'applique que pour les sessions de type 'focus' (pas 'break')

---

### 3. **~~Santé~~** ❌ DÉCONNECTÉ (V2.7)

| Action | Événement Brain | Statut |
|--------|----------------|--------|
| `addWeightEntry()` | ~~`observeWeightAdded()`~~ | ❌ Retiré |
| `addMealEntry()` | ~~`observeMealAdded()`~~ | ❌ Retiré |
| `addHydrationEntry()` | ~~`observeWaterAdded()`~~ | ❌ Retiré |

**Raison :**
- Santé retirée du score Wellbeing (V2.1)
- Pas affichée dans Hub (V2.6)
- Doublon avec useGlobalStats (MyDay)
- **→ Déconnexion complète le 25/12/2024**

**Où voir les stats santé :**
- ✅ MyDay (useGlobalStats)
- ✅ Stats détaillées dans Settings

---

### 4. **Journal & Mood** (2 événements connectés)

| Action | Événement Brain | Localisation |
|--------|----------------|--------------|
| `addJournalEntry()` | `observeJournalWritten()` + `observeMoodSet()` | `useStore.ts:1188` |
| `updateJournalEntry()` | `observeMoodSet()` (si mood modifié) | `useStore.ts:1194` |

**Détails :**
- `observeJournalWritten()` envoie : `{mood?, hasContent}`
- Si un mood est présent, déclenche aussi `observeMoodSet(mood)`
- Fonctionne pour création et mise à jour

---

### 5. **Habitudes** (2 événements connectés)

| Action | Événement Brain | Localisation |
|--------|----------------|--------------|
| `toggleHabitToday()` | `observeHabitChecked()` ou `observeHabitUnchecked()` | `useStore.ts:1020` |

**Détails :**
- Détecte si l'habitude était déjà cochée aujourd'hui
- Check : envoie `{habitId, habitName}`
- Uncheck : envoie juste `{habitId}`

---

### 6. **Lecture** (3 événements connectés)

| Action | Événement Brain | Localisation |
|--------|----------------|--------------|
| `updateBook()` | `observeBookStarted()` ou `observeBookFinished()` | `useStore.ts:1350` |
| `endReadingSession()` | `observeReadingSession()` | `useStore.ts:1421` |

**Détails :**
- Détecte automatiquement les changements de statut :
  - `to-read` → `reading` = livre démarré
  - Tout → `finished` = livre terminé
- Session de lecture envoie : `{bookId, minutes}`

---

### 7. **Apprentissage** (2 événements connectés)

| Action | Événement Brain | Localisation |
|--------|----------------|--------------|
| `addLearningCourse()` | `observeCourseStarted()` | `useStore.ts:1260` |
| `addLearningMessage()` | `observeCourseMessage()` | `useStore.ts:1273` |

**Détails :**
- Cours : envoie `{courseId, courseName}`
- Message : envoie `{courseId, isUser}` (détecte si c'est l'utilisateur ou l'IA)

---

## 📊 Résumé

**Total : 15 connexions actives** (3 santé retirées)

| Module | Événements connectés | Statut |
|--------|---------------------|---------|
| Tâches | 4 | ✅ Actif |
| Pomodoro | 2 | ✅ Actif |
| ~~Santé~~ | ~~3~~ → 0 | ❌ Déconnecté |
| Journal/Mood | 2 | ✅ Actif |
| Habitudes | 2 | ✅ Actif |
| Lecture | 3 | ✅ Actif |
| Apprentissage | 2 | ✅ Actif |

## 🔍 Événements Brain disponibles mais non connectés

Ces événements existent dans le Brain mais ne sont pas encore déclenchés par l'application :

- `pomodoro:started` - Pourrait être ajouté dans PomodoroPage
- `habit:created` - Existe mais `addHabit()` ne le déclenche pas encore
- `flashcard:reviewed` - Doit être ajouté dans FlashcardModal lors de la révision
- `view:changed` - Pourrait être observé dans la navigation
- `app:opened` / `app:closed` - Déjà gérés automatiquement par le Brain

## 🎯 Impact

Avec ces connexions, le Brain peut maintenant :

1. **Calculer des patterns réels** basés sur l'utilisation
   - Moyenne de tâches par jour
   - Temps de focus moyen
   - Fréquence du journal
   - Taux de complétion des habitudes

2. **Générer un Wellbeing Score précis**
   - Productivité (tâches + pomodoro)
   - Mental (mood + journal)
   - Constance (habitudes)
   - ~~Santé (poids + repas + hydratation)~~ ❌ Retiré

3. **Détecter des corrélations**
   - Mood vs productivité
   - Habitudes vs mood
   - Patterns temporels (heures, jours)

## 🧪 Test

Pour tester les connexions :

1. Ouvre l'app et complète une tâche
2. Ajoute un repas
3. Écris une entrée journal avec mood
4. Coche une habitude
5. Ouvre la console DevTools
6. Va dans Application → Local Storage → `iku-brain-memory`
7. Tu devrais voir les événements dans `recentEvents`

Le Brain analyse automatiquement toutes les 5 minutes et met à jour le Wellbeing Score.

---

**Date de connexion :** 24 décembre 2024  
**Dernière mise à jour :** 25 décembre 2024 (V2.7 - Santé déconnectée)  
**Version :** newmars V2.7  
**Fichier modifié :** `src/store/useStore.ts`



