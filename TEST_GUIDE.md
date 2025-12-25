# 🧪 Guide de Test - Connexions Brain

## ✅ Serveur démarré avec succès

Le serveur Vite tourne sur : **http://localhost:5173/**

---

## 🎯 Tests à effectuer

### **Option 1 : Test automatique (Recommandé)**

1. Ouvre l'application dans ton navigateur : http://localhost:5173/
2. Ouvre la console DevTools (F12 ou Cmd+Option+I)
3. Copie-colle le contenu du fichier `test-brain-script.js`
4. Appuie sur Entrée

Le script va automatiquement :
- ✅ Créer et compléter une tâche
- ✅ Toggle une habitude
- ✅ Ajouter une entrée journal avec mood
- ✅ Enregistrer un repas et de l'eau
- ✅ Simuler une session Pomodoro
- ✅ Vérifier que tous les événements sont enregistrés
- ✅ Nettoyer les données de test

**Résultat attendu :** Au moins 5-6 nouveaux événements dans le Brain.

---

### **Option 2 : Test manuel**

#### 1. Vérifier l'état initial
```javascript
// Dans la console DevTools
const memory = JSON.parse(localStorage.getItem('iku-brain-memory'))
console.log('Événements:', memory.recentEvents)
console.log('Total:', memory.recentEvents?.length || 0)
```

#### 2. Tester chaque module

**Tâches :**
- [ ] Crée une nouvelle tâche
- [ ] Complète une tâche existante
- [ ] Supprime une tâche
- [ ] Déplace une tâche dans le Kanban

**Habitudes :**
- [ ] Coche une habitude
- [ ] Décoche une habitude

**Journal :**
- [ ] Écris une entrée avec un mood
- [ ] Modifie le mood d'une entrée

**Santé :**
- [ ] Ajoute ton poids
- [ ] Enregistre un repas
- [ ] Ajoute de l'eau

**Pomodoro :**
- [ ] Lance un timer Pomodoro
- [ ] Laisse-le se terminer
- [ ] (Optionnel) Interromps un Pomodoro

**Lecture :**
- [ ] Change le statut d'un livre (to-read → reading)
- [ ] Marque un livre comme terminé
- [ ] Fais une session de lecture

**Apprentissage :**
- [ ] Crée un nouveau cours
- [ ] Envoie un message dans un cours

#### 3. Vérifier les événements après chaque action
```javascript
const memory = JSON.parse(localStorage.getItem('iku-brain-memory'))
console.log('Derniers événements:')
memory.recentEvents.slice(-5).forEach(e => {
  console.log(`${e.type} - ${new Date(e.timestamp).toLocaleString('fr-FR')}`)
})
```

---

## 📊 Vérifications à faire

### 1. Événements enregistrés
```javascript
const memory = JSON.parse(localStorage.getItem('iku-brain-memory'))

// Compter les types d'événements
const types = {}
memory.recentEvents.forEach(e => {
  types[e.type] = (types[e.type] || 0) + 1
})
console.table(types)
```

### 2. Patterns calculés
```javascript
const memory = JSON.parse(localStorage.getItem('iku-brain-memory'))
console.log('Patterns:', memory.patterns)

// Devrait afficher des valeurs > 0 après utilisation
// - avgTasksPerDay
// - avgMood
// - habitCompletionRate
// etc.
```

### 3. Wellbeing Score
```javascript
// Dans l'app, va sur le Hub
// Le score devrait être affiché avec la tendance
// Exemple: "72 ↑ +12%"
```

### 4. Analyse automatique
```javascript
const memory = JSON.parse(localStorage.getItem('iku-brain-memory'))
console.log('Dernière analyse:', new Date(memory.lastFullAnalysis).toLocaleString('fr-FR'))

// Le Brain analyse automatiquement toutes les 5 minutes
// Après 5 min d'utilisation, cette date devrait être récente
```

---

## ✅ Checklist finale

- [ ] Le serveur Vite tourne sans erreur
- [ ] L'app se charge correctement dans le navigateur
- [ ] Aucune erreur dans la console au démarrage
- [ ] Les actions créent des événements dans `iku-brain-memory`
- [ ] Les patterns se mettent à jour après quelques actions
- [ ] Le Wellbeing Score s'affiche sur le Hub
- [ ] Le score change après plusieurs actions
- [ ] Aucune erreur dans la console lors des actions

---

## 🐛 En cas de problème

### Événements non enregistrés
```javascript
// Vérifier que les imports sont corrects
import { observeTaskCompleted } from '../brain'

// Vérifier dans le store
console.log(useStore.getState())
```

### Score toujours à 0
- Attends 5 minutes (temps de la première analyse)
- Ou force une analyse :
```javascript
// Ça déclenchera une analyse immédiate
window.dispatchEvent(new Event('focus'))
```

### Erreurs dans la console
- Note l'erreur exacte
- Vérifie le fichier `src/store/useStore.ts` ligne correspondante
- Vérifie que tous les imports Brain sont présents

---

## 📝 Résultats attendus

Après **10-15 actions** dans l'app :

**Événements :**
```
recentEvents: [
  { type: 'task:completed', timestamp: 1734... },
  { type: 'habit:checked', timestamp: 1734... },
  { type: 'journal:written', timestamp: 1734... },
  { type: 'meal:added', timestamp: 1734... },
  ...
]
Total: 10-15 événements
```

**Patterns :**
```javascript
{
  avgTasksPerDay: 2.5,
  avgFocusDuration: 25,
  taskCompletionRate: 0.8,
  avgMood: 7.5,
  habitCompletionRate: 0.9,
  // ...
}
```

**Wellbeing Score :**
```
overall: 65-75
breakdown: {
  productivity: 18/25,
  health: 15/25,
  mental: 20/25,
  consistency: 17/25
}
```

---

## 🎉 Si tout fonctionne

Tu devrais voir :
1. ✅ Les événements s'accumulent dans localStorage
2. ✅ Les patterns se calculent automatiquement
3. ✅ Le Wellbeing Score s'affiche sur le Hub
4. ✅ Le score évolue en fonction de tes actions
5. ✅ Aucune erreur dans la console

**Le Brain est opérationnel ! 🚀**

Maintenant tu peux utiliser l'app normalement, et le Brain va apprendre de ton comportement pour te donner des insights pertinents.

---

**Date du test :** 24 décembre 2024  
**Version :** newmars V1.2.1  
**Statut serveur :** ✅ http://localhost:5173/

