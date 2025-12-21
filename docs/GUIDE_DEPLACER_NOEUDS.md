# 🎯 Guide : Déplacer les Nœuds dans le Flow Diagram

> **Fichier à modifier** : `/src/data/docs/productReferenceData.ts`

---

## 📍 **Comment Déplacer un Nœud**

Chaque nœud a une **position** définie par des coordonnées `x` et `y` :

```typescript
{ 
  id: 'hub-tasks', 
  data: { label: '✅ Tâches' }, 
  position: { x: 0, y: 380 },  // ← Position du nœud
  style: { ... }
}
```

### Système de coordonnées :
```
(0,0) ────────► x (horizontal)
  │
  │
  │
  ▼
  y (vertical)
```

- **x** : Position horizontale (gauche → droite)
- **y** : Position verticale (haut → bas)

---

## 🎨 **Méthode 1 : Modifier Manuellement les Positions**

### Exemple : Déplacer "Tâches" plus à droite

**AVANT** :
```typescript
{ id: 'hub-tasks', data: { label: '✅ Tâches' }, 
  position: { x: 0, y: 380 },  // À gauche
  style: { ... }
}
```

**APRÈS** :
```typescript
{ id: 'hub-tasks', data: { label: '✅ Tâches' }, 
  position: { x: 200, y: 380 },  // ✅ Déplacé de 200px à droite
  style: { ... }
}
```

### Exemple : Déplacer "Ma Journée" plus bas

**AVANT** :
```typescript
{ id: 'hub-myday', data: { label: '📝 Ma Journée' }, 
  position: { x: 150, y: 380 },
  style: { ... }
}
```

**APRÈS** :
```typescript
{ id: 'hub-myday', data: { label: '📝 Ma Journée' }, 
  position: { x: 150, y: 500 },  // ✅ Descendu de 120px
  style: { ... }
}
```

---

## 🔧 **Méthode 2 : React Flow Interactif (Recommandé !)**

React Flow permet de **déplacer les nœuds à la souris** directement dans le navigateur !

### Activer le mode déplacement

**Dans `ModuleFlowDiagram.tsx`**, ligne ~18 :

```typescript
<ReactFlow
  nodes={nodesState}
  edges={edgesState}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  fitView
  nodesDraggable={true}           // ✅ Permet de drag les nœuds
  nodesConnectable={false}        // ❌ Pas de nouvelles connexions
  elementsSelectable={true}       // ✅ Sélectionner des éléments
  // ... autres props
>
```

**C'est déjà activé par défaut !** Tu peux déjà drag & drop les nœuds dans le navigateur.

### Comment obtenir les nouvelles positions :

1. **Ouvre la documentation** dans le navigateur
2. **Déplace les nœuds** à la souris comme tu veux
3. **Ouvre la console** (F12)
4. **Ajoute ce code** dans la console :

```javascript
// Copie ce code dans la console du navigateur
const flow = document.querySelector('.react-flow');
if (flow) {
  // Récupère l'instance React Flow
  console.log('Positions actuelles des nœuds:');
  console.log(JSON.stringify(nodes.map(n => ({
    id: n.id,
    position: n.position
  })), null, 2));
}
```

5. **Copie les nouvelles positions** et mets-les dans `productReferenceData.ts`

---

## 📐 **Layout Recommandé : Grille**

Pour un flow bien organisé, utilise une grille :

### Grille Horizontale (espacement 180px)
```typescript
// Rangée 1
{ id: 'node1', position: { x: 0, y: 380 } },
{ id: 'node2', position: { x: 180, y: 380 } },
{ id: 'node3', position: { x: 360, y: 380 } },
{ id: 'node4', position: { x: 540, y: 380 } },
```

### Grille Verticale (espacement 80-100px)
```typescript
// Colonne 1
{ id: 'node1', position: { x: 100, y: 100 } },
{ id: 'node2', position: { x: 100, y: 180 } },
{ id: 'node3', position: { x: 100, y: 260 } },
{ id: 'node4', position: { x: 100, y: 340 } },
```

---

## 🎯 **Exemples de Réorganisation**

### Exemple 1 : Mettre tous les modules sur une seule ligne horizontale

```typescript
// AVANT (en colonnes)
{ id: 'hub-tasks', position: { x: 0, y: 380 } },
{ id: 'hub-myday', position: { x: 150, y: 380 } },
{ id: 'hub-learning', position: { x: 310, y: 380 } },
{ id: 'hub-library', position: { x: 490, y: 380 } },
{ id: 'hub-dashboard', position: { x: 650, y: 380 } },

// APRÈS (tous alignés sur y=400 avec espacement régulier)
{ id: 'hub-tasks', position: { x: 50, y: 400 } },
{ id: 'hub-myday', position: { x: 250, y: 400 } },
{ id: 'hub-learning', position: { x: 450, y: 400 } },
{ id: 'hub-library', position: { x: 650, y: 400 } },
{ id: 'hub-dashboard', position: { x: 850, y: 400 } },
```

### Exemple 2 : Layout en cercle autour du Hub

```typescript
// Centre
{ id: 'hub-start', position: { x: 400, y: 300 } },

// Disposition circulaire autour (rayon ~200px)
{ id: 'hub-tasks', position: { x: 400, y: 100 } },      // Haut
{ id: 'hub-myday', position: { x: 600, y: 200 } },      // Haut-droite
{ id: 'hub-learning', position: { x: 600, y: 400 } },   // Bas-droite
{ id: 'hub-library', position: { x: 400, y: 500 } },    // Bas
{ id: 'hub-dashboard', position: { x: 200, y: 400 } },  // Bas-gauche
```

### Exemple 3 : Layout hiérarchique (organigramme)

```typescript
// Niveau 1 (top)
{ id: 'hub-start', position: { x: 400, y: 0 } },

// Niveau 2
{ id: 'hub-greeting', position: { x: 400, y: 100 } },

// Niveau 3 (décision)
{ id: 'hub-nav', position: { x: 400, y: 200 } },

// Niveau 4 (modules - répartis horizontalement)
{ id: 'hub-tasks', position: { x: 100, y: 350 } },
{ id: 'hub-myday', position: { x: 300, y: 350 } },
{ id: 'hub-learning', position: { x: 500, y: 350 } },
{ id: 'hub-library', position: { x: 700, y: 350 } },
```

---

## 🔥 **Astuces Avancées**

### 1. Décalage fin (micro-ajustement)
```typescript
// Décalage de 5px pour aligner parfaitement
position: { x: 205, y: 383 }  // Au lieu de { x: 200, y: 380 }
```

### 2. Groupement visuel
```typescript
// Groupe "Productivité" à gauche
{ id: 'tasks', position: { x: 50, y: 400 } },
{ id: 'myday', position: { x: 50, y: 500 } },

// Groupe "Culture" à droite
{ id: 'learning', position: { x: 600, y: 400 } },
{ id: 'library', position: { x: 600, y: 500 } },
```

### 3. Espacement proportionnel
```typescript
// Calculer les positions automatiquement
const startX = 100;
const spacing = 200;
const modules = ['tasks', 'myday', 'learning', 'library'];

modules.forEach((mod, index) => {
  position: { x: startX + (index * spacing), y: 400 }
});
```

---

## 🎨 **Template : Nouveau Layout Propre**

Voici un layout propre et bien organisé que tu peux copier :

```typescript
flowNodes: [
  // ========== NIVEAU 1 : ENTRÉE ==========
  { id: 'hub-start', data: { label: '🏠 Arrivée Hub' }, 
    position: { x: 500, y: 0 }, 
    style: { ... }
  },
  
  // ========== NIVEAU 2 : AFFICHAGE ==========
  { id: 'hub-date', position: { x: 300, y: 120 }, ... },
  { id: 'hub-greeting', position: { x: 500, y: 120 }, ... },
  { id: 'hub-name', position: { x: 700, y: 120 }, ... },
  
  // ========== NIVEAU 3 : NAVIGATION ==========
  { id: 'hub-nav', position: { x: 500, y: 240 }, ... },
  
  // ========== NIVEAU 4 : MODULES (ligne horizontale) ==========
  { id: 'hub-tasks', position: { x: 50, y: 400 }, ... },
  { id: 'hub-myday', position: { x: 250, y: 400 }, ... },
  { id: 'hub-learning', position: { x: 450, y: 400 }, ... },
  { id: 'hub-library', position: { x: 650, y: 400 }, ... },
  { id: 'hub-dashboard', position: { x: 850, y: 400 }, ... },
  { id: 'hub-docs', position: { x: 1050, y: 400 }, ... },
  
  // ========== NIVEAU 5 : SOUS-FEATURES (en dessous de chaque module) ==========
  // Sous Tâches
  { id: 'tasks-sub1', position: { x: 20, y: 520 }, ... },
  { id: 'tasks-sub2', position: { x: 20, y: 600 }, ... },
  { id: 'tasks-sub3', position: { x: 20, y: 680 }, ... },
  
  // Sous Ma Journée
  { id: 'myday-sub1', position: { x: 220, y: 520 }, ... },
  { id: 'myday-sub2', position: { x: 220, y: 600 }, ... },
  { id: 'myday-sub3', position: { x: 220, y: 680 }, ... },
  
  // ... etc
]
```

---

## 🚀 **Action Immédiate**

**Option A** : Je réorganise le flow actuel dans un layout plus propre ?

**Option B** : Tu veux un layout spécifique (ex: circulaire, hiérarchique, grille) ?

**Option C** : Tu veux que je t'explique comment activer le drag & drop interactif dans le navigateur ?

**Dis-moi ce que tu préfères !** 🎯

