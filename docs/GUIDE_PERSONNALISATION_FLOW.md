# 🎨 Guide de Personnalisation des Flow Diagrams

> **Fichier de configuration** : `/src/data/docs/flowStyles.ts`  
> **Fichier des données** : `/src/data/docs/productReferenceData.ts`

---

## 🚀 Quick Start : Modifier les Couleurs

### 1. Changer la couleur d'une connexion

**Dans `flowStyles.ts`** :
```typescript
export const COLORS = {
  interconnect: '#ff9500',      // ← Change cette valeur
  // Exemples :
  // '#00ff00' pour vert fluo
  // '#ff0000' pour rouge
  // '#9d4edd' pour violet
}
```

**Toutes les connexions orange changeront automatiquement !**

---

### 2. Changer l'épaisseur des traits

**Dans `flowStyles.ts`** :
```typescript
export const EDGE_STYLES = {
  newInterconnection: {
    stroke: COLORS.interconnect,
    strokeWidth: 2,             // ← Change cette valeur (1-5)
  },
}
```

---

### 3. Changer le style des pointillés

**Dans `flowStyles.ts`** :
```typescript
export const LINE_CONFIGS = {
  dashed: {
    strokeDasharray: '5,5',     // ← Format: 'longueur,espace'
    // '3,3'  = serré
    // '5,5'  = moyen
    // '10,10' = large
    // '2,8'  = courts et espacés
  },
}
```

---

## 🎯 Scénarios d'Usage

### Scénario 1 : "Je veux que les nouvelles interconnexions soient vertes"

**Étape 1** : Ouvre `flowStyles.ts`

**Étape 2** : Change la couleur :
```typescript
export const COLORS = {
  interconnect: '#00ff88',      // Vert fluo
}
```

**Étape 3** : Rafraîchis la page → **Toutes les connexions orange sont vertes !** ✅

---

### Scénario 2 : "Je veux des traits plus épais pour le flux principal"

**Dans `flowStyles.ts`** :
```typescript
export const EDGE_STYLES = {
  mainFlow: {
    stroke: COLORS.primary,
    strokeWidth: 4,              // Avant : 2, Après : 4
  },
}
```

---

### Scénario 3 : "Je veux que Dashboard observateur soit invisible"

**Dans `flowStyles.ts`** :
```typescript
export const EDGE_STYLES = {
  dashboardObserver: {
    stroke: COLORS.ai,
    strokeWidth: 0.5,
    strokeDasharray: '10,10',
    opacity: 0,                  // 0 = invisible, 1 = opaque
  },
}
```

---

### Scénario 4 : "Je veux tout en bleu/rouge/vert"

**Palette BLEUE** :
```typescript
export const COLORS = {
  primary: '#1e90ff',
  success: '#4a9eff',
  warning: '#00bfff',
  interconnect: '#5ac8fa',
  ai: '#64d2ff',
}
```

**Palette ROUGE** :
```typescript
export const COLORS = {
  primary: '#ff4444',
  success: '#ff6b6b',
  warning: '#ff9500',
  interconnect: '#ff0000',
  ai: '#cc0000',
}
```

**Palette VERTE** :
```typescript
export const COLORS = {
  primary: '#00ff00',
  success: '#6ccb5f',
  warning: '#90ee90',
  interconnect: '#32cd32',
  ai: '#228b22',
}
```

---

## 🔧 Modifications Avancées

### Utiliser les présets

**Dans `productReferenceData.ts`** :
```typescript
import { PRESET_EDGES, createEdgeStyle } from './flowStyles'

// Au lieu de :
{ id: 'e-example', source: 'A', target: 'B', 
  animated: true, 
  style: { stroke: '#ff9500', strokeWidth: 2 } 
}

// Utilise :
{ id: 'e-example', source: 'A', target: 'B', 
  ...PRESET_EDGES.newInterconnectAnimated
}
```

---

### Créer un style personnalisé

```typescript
import { createEdgeStyle } from './flowStyles'

// Style custom
const monStyleCustom = createEdgeStyle({
  color: '#9d4edd',       // Violet
  width: 3,               // Épais
  dashed: true,           // Pointillé
  dashPattern: '8,4',     // Pattern custom
  animated: true,         // Animé
  opacity: 0.8,           // Légèrement transparent
})

// Utilise-le
{ id: 'e-custom', source: 'A', target: 'B', 
  ...monStyleCustom
}
```

---

## 📋 Référence Rapide : Propriétés CSS

### strokeWidth (Épaisseur)
- `0.5` = Ultra fin
- `1` = Fin standard
- `2` = Moyen (par défaut)
- `3` = Épais
- `4-5` = Très épais

### strokeDasharray (Pointillés)
- `'3,3'` = • • • • (serré)
- `'5,5'` = • • • (moyen)
- `'10,10'` = •   •   • (large)
- `'2,8'` = •     •     • (courts et espacés)
- `'15,5,5,5'` = Pattern complexe

### opacity (Transparence)
- `0` = Invisible
- `0.3` = Très transparent
- `0.5` = Semi-transparent
- `0.8` = Légèrement transparent
- `1` = Opaque (par défaut)

---

## 🎨 Palette de Couleurs Prédéfinies

### Bleus
```typescript
'#4a9eff'  // Bleu vif (principal)
'#0078d4'  // Bleu Microsoft
'#5ac8fa'  // Cyan clair
'#64d2ff'  // Bleu clair
```

### Verts
```typescript
'#6ccb5f'  // Vert succès
'#107c10'  // Vert foncé
'#00ff88'  // Vert fluo
'#32cd32'  // Vert citron
```

### Oranges/Rouges
```typescript
'#ff9500'  // Orange vif
'#ff6b00'  // Orange foncé
'#f85149'  // Rouge danger
'#d13438'  // Rouge foncé
```

### Violets
```typescript
'#b392f0'  // Violet IA
'#8764b8'  // Violet foncé
'#9d4edd'  // Violet électrique
```

### Jaunes
```typescript
'#ffc83d'  // Jaune décision
'#ffb900'  // Jaune foncé
'#ffd60a'  // Jaune doré
```

---

## 🚀 Workflow Recommandé

1. **Ouvre `flowStyles.ts`** dans un éditeur
2. **Modifie les valeurs** (couleurs, épaisseurs, etc.)
3. **Sauvegarde le fichier**
4. **Rafraîchis la page** de documentation
5. **Vérifie le résultat** dans le diagramme React Flow
6. **Ajuste** si nécessaire

**Tout est centralisé !** Tu n'as pas besoin de toucher à `productReferenceData.ts` pour les styles.

---

## 💡 Astuces

### Astuce 1 : Tester rapidement une couleur
Utilise un color picker en ligne : https://htmlcolorcodes.com/

### Astuce 2 : Cohérence visuelle
Ne mélange pas trop de couleurs (max 5-6 couleurs principales)

### Astuce 3 : Accessibilité
Assure-toi que les couleurs ont un bon contraste sur fond sombre

### Astuce 4 : Hiérarchie
- Traits épais (3-4) = Flux principaux
- Traits moyens (2) = Flux secondaires
- Traits fins (1) = Détails
- Traits ultra-fins (0.5) = Subtil/background

---

## 🔥 Prochaine Étape

Maintenant que tu as le système de styles, tu veux :
- **A)** Modifier les couleurs actuelles ?
- **B)** Changer les épaisseurs de traits ?
- **C)** Animer certaines connexions ?
- **D)** Tout ça ensemble ?

**Dis-moi ce que tu veux modifier et je l'applique !** 🎨

