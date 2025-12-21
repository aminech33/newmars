# 🔗 Guide : Gérer les Connexions (Fils/Links) dans le Flow

> **Fichier à modifier** : `/src/data/docs/productReferenceData.ts`  
> **Section** : `flowEdges: [...]`

---

## 🎯 Structure d'une Connexion (Edge)

Chaque connexion est définie comme ça :

```typescript
{ 
  id: 'e-hub-1-2',              // ID unique de la connexion
  source: 'hub-1',              // Nœud de départ
  target: 'hub-2',              // Nœud d'arrivée
  animated: true,               // Animation (optionnel)
  label: 'Mon texte',           // Texte sur le fil (optionnel)
  style: {                      // Style du fil
    stroke: '#4a9eff',          // Couleur
    strokeWidth: 2,             // Épaisseur
    strokeDasharray: '5,5'      // Pointillés (optionnel)
  }
}
```

---

## ❌ **1. SUPPRIMER une Connexion**

### Méthode Simple : Commenter la ligne

```typescript
flowEdges: [
  { id: 'e-hub-1-2', source: 'hub-1', target: 'hub-2', ... },
  
  // ❌ Je ne veux plus cette connexion
  // { id: 'e-hub-2-3', source: 'hub-2', target: 'hub-3', ... },
  
  { id: 'e-hub-3-4', source: 'hub-3', target: 'hub-4', ... },
]
```

### Méthode Définitive : Supprimer la ligne complète

```typescript
flowEdges: [
  { id: 'e-hub-1-2', source: 'hub-1', target: 'hub-2', ... },
  // ✅ Ligne supprimée complètement
  { id: 'e-hub-3-4', source: 'hub-3', target: 'hub-4', ... },
]
```

---

## ✏️ **2. MODIFIER une Connexion**

### Changer la couleur

```typescript
// AVANT
{ id: 'e-tasks-1', source: 'hub-tasks', target: 'tasks-sub1', 
  style: { stroke: '#6ccb5f' } 
}

// APRÈS (en rouge)
{ id: 'e-tasks-1', source: 'hub-tasks', target: 'tasks-sub1', 
  style: { stroke: '#ff0000', strokeWidth: 3 } 
}
```

### Changer le point de départ ou d'arrivée

```typescript
// AVANT (va de hub-tasks vers tasks-sub1)
{ id: 'e-example', source: 'hub-tasks', target: 'tasks-sub1', ... }

// APRÈS (va maintenant de hub-myday vers tasks-sub1)
{ id: 'e-example', source: 'hub-myday', target: 'tasks-sub1', ... }
```

### Ajouter une animation

```typescript
// AVANT (statique)
{ id: 'e-myday-1', source: 'hub-myday', target: 'myday-sub1', 
  style: { stroke: '#6ccb5f' } 
}

// APRÈS (animé)
{ id: 'e-myday-1', source: 'hub-myday', target: 'myday-sub1', 
  animated: true,                    // ✅ Ajouté
  style: { stroke: '#6ccb5f' } 
}
```

### Transformer en pointillé

```typescript
// AVANT (trait plein)
{ id: 'e-dash-1', source: 'dashboard', target: 'tasks', 
  style: { stroke: '#b392f0', strokeWidth: 1 } 
}

// APRÈS (pointillé)
{ id: 'e-dash-1', source: 'dashboard', target: 'tasks', 
  style: { 
    stroke: '#b392f0', 
    strokeWidth: 1, 
    strokeDasharray: '5,5'           // ✅ Ajouté
  } 
}
```

### Ajouter un label (texte sur le fil)

```typescript
// AVANT (pas de texte)
{ id: 'e-learn-tasks', source: 'hub-learning', target: 'hub-tasks', 
  style: { stroke: '#ff9500' } 
}

// APRÈS (avec texte)
{ id: 'e-learn-tasks', source: 'hub-learning', target: 'hub-tasks', 
  label: '🔗 Créer tâche',           // ✅ Ajouté
  style: { stroke: '#ff9500' } 
}
```

---

## ➕ **3. AJOUTER une Nouvelle Connexion**

### Template de base

```typescript
flowEdges: [
  // ... connexions existantes ...
  
  // ✅ NOUVELLE CONNEXION
  { 
    id: 'e-ma-nouvelle-connexion',   // ID unique (commence par 'e-')
    source: 'hub-tasks',              // D'où ça part
    target: 'hub-dashboard',          // Où ça va
    animated: true,                   // Animation (optionnel)
    label: '📊 Vers stats',           // Texte (optionnel)
    style: {
      stroke: '#64d2ff',              // Couleur
      strokeWidth: 2                  // Épaisseur
    }
  },
]
```

### Exemples de connexions utiles

#### Connexion bidirectionnelle

```typescript
// Connexion ALLER
{ 
  id: 'e-lib-to-learn', 
  source: 'hub-library', 
  target: 'hub-learning',
  animated: true,
  label: '🎓 Créer cours',
  style: { stroke: '#ff9500', strokeWidth: 2 }
},

// Connexion RETOUR
{ 
  id: 'e-learn-to-lib', 
  source: 'hub-learning', 
  target: 'hub-library',
  label: '📚 Ressources',
  style: { 
    stroke: '#ff9500', 
    strokeWidth: 2, 
    strokeDasharray: '5,5'           // Pointillé pour différencier
  }
},
```

#### Connexion subtile (observateur)

```typescript
{ 
  id: 'e-dash-observe-tasks', 
  source: 'dash-observer', 
  target: 'hub-tasks',
  style: { 
    stroke: '#b392f0', 
    strokeWidth: 0.5,                // Très fin
    strokeDasharray: '10,10',        // Très espacé
    opacity: 0.3                     // Transparent
  }
},
```

#### Connexion importante (highlight)

```typescript
{ 
  id: 'e-main-flow', 
  source: 'hub-start', 
  target: 'hub-nav',
  animated: true,
  type: 'smoothstep',                // Ligne courbée
  style: { 
    stroke: '#4a9eff', 
    strokeWidth: 4                   // Très épais
  }
},
```

---

## 🎨 **4. Types de Lignes Disponibles**

### Ligne par défaut (Bézier)
```typescript
{ id: 'e-1', source: 'A', target: 'B',
  // Pas de type = bézier automatique
  style: { stroke: '#fff' }
}
```

### Ligne droite stricte
```typescript
{ id: 'e-2', source: 'A', target: 'B',
  type: 'straight',
  style: { stroke: '#fff' }
}
```

### Ligne en escalier
```typescript
{ id: 'e-3', source: 'A', target: 'B',
  type: 'step',
  style: { stroke: '#fff' }
}
```

### Ligne en escalier arrondie
```typescript
{ id: 'e-4', source: 'A', target: 'B',
  type: 'smoothstep',
  style: { stroke: '#fff' }
}
```

---

## 🔍 **5. Trouver les Connexions dans le Code**

### Structure du fichier

```typescript
// Dans productReferenceData.ts, ligne ~119
flowEdges: [
  // ========== Flux principal d'entrée ==========
  { id: 'e-start-date', source: 'hub-start', target: 'hub-date', ... },
  { id: 'e-start-greet', source: 'hub-start', target: 'hub-greeting', ... },
  
  // ========== Navigation vers modules ==========
  { id: 'e-nav-tasks', source: 'hub-nav', target: 'hub-tasks', ... },
  { id: 'e-nav-myday', source: 'hub-nav', target: 'hub-myday', ... },
  
  // ========== Sous-fonctionnalités Tâches ==========
  { id: 'e-tasks-1', source: 'hub-tasks', target: 'tasks-sub1', ... },
  { id: 'e-tasks-2', source: 'hub-tasks', target: 'tasks-sub2', ... },
  
  // ========== Interconnexions spéciales ==========
  { id: 'e-interco-pomo', source: 'tasks-sub3', target: 'interco-1', ... },
  
  // ========== Nouvelles interconnexions ==========
  { id: 'e-new-myday-tasks-1', source: 'myday-sub1', target: 'interco-myday-tasks', ... },
]
```

### Rechercher une connexion spécifique

Pour trouver la connexion entre "Ma Journée" et "Tâches" :

1. Cherche `myday` dans les IDs
2. Cherche `tasks` dans les sources/targets

```typescript
// Exemple trouvé :
{ id: 'e-new-myday-tasks-1',         // ← "myday" et "tasks" dans l'ID
  source: 'myday-sub1',               // ← Part de Ma Journée
  target: 'interco-myday-tasks',      // ← Va vers interconnexion
  ...
}
```

---

## 📝 **6. Exemples Pratiques**

### Exemple 1 : Supprimer toutes les connexions du Dashboard observateur

```typescript
// AVANT (4 connexions)
{ id: 'e-dash-watch-1', source: 'dash-observer', target: 'hub-tasks', ... },
{ id: 'e-dash-watch-2', source: 'dash-observer', target: 'hub-myday', ... },
{ id: 'e-dash-watch-3', source: 'dash-observer', target: 'hub-learning', ... },
{ id: 'e-dash-watch-4', source: 'dash-observer', target: 'hub-library', ... },

// APRÈS (supprimées)
// Plus de connexions observateur !
```

### Exemple 2 : Rendre toutes les nouvelles interconnexions animées

```typescript
// Cherche toutes les lignes qui commencent par 'e-new-'
// Et ajoute 'animated: true'

{ id: 'e-new-myday-tasks-1', 
  source: 'myday-sub1', 
  target: 'interco-myday-tasks', 
  animated: true,                    // ✅ Ajouté
  label: 'Voir tâches', 
  style: { stroke: '#ff9500', strokeWidth: 2 } 
},
```

### Exemple 3 : Créer une connexion directe entre deux modules

```typescript
// Connexion directe : Apprentissage → Dashboard (sans passer par Hub)
{ 
  id: 'e-direct-learn-dash', 
  source: 'hub-learning', 
  target: 'hub-dashboard',
  animated: true,
  label: '📊 Stats apprentissage',
  type: 'smoothstep',                // Ligne courbée
  style: { 
    stroke: '#64d2ff', 
    strokeWidth: 2 
  }
},
```

---

## 🚀 **Actions Rapides**

### Supprimer toutes les connexions pointillées
Cherche `strokeDasharray` et commente/supprime les lignes.

### Animer tous les flux principaux
Cherche `source: 'hub-nav'` et ajoute `animated: true`.

### Changer toutes les couleurs orange en bleu
Cherche `'#ff9500'` et remplace par `'#4a9eff'`.

### Rendre tous les liens plus épais
Cherche `strokeWidth: 1` et remplace par `strokeWidth: 2`.

---

## 💡 **Astuces**

1. **Nomme tes IDs clairement** : `e-source-target` (ex: `e-tasks-myday`)
2. **Groupe les connexions** : Ajoute des commentaires pour organiser
3. **Teste incrémentalement** : Modifie une connexion à la fois
4. **Sauvegarde avant** : Garde une copie du fichier original

---

## 🎯 **Tu veux que je fasse quoi maintenant ?**

**Option A** : Supprimer des connexions spécifiques ?
- Ex: "Supprime toutes les connexions du Dashboard observateur"

**Option B** : Modifier le style de connexions ?
- Ex: "Rends toutes les nouvelles interconnexions animées"

**Option C** : Ajouter de nouvelles connexions ?
- Ex: "Ajoute une connexion entre Bibliothèque et Dashboard"

**Option D** : Simplifier le flow en enlevant des connexions inutiles ?

**Dis-moi ce que tu veux et je le fais !** 🔗

