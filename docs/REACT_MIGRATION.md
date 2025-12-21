# Document de Référence Produit - React Version

## ✅ Migration Terminée !

Le document de référence produit a été migré de HTML pur vers React avec **React Flow** pour les diagrammes interactifs.

## 🚀 Accéder à la documentation

### Option 1 : Via le code
```typescript
import { useStore } from './store/useStore';

// Dans n'importe quel composant
const setView = useStore((state) => state.setView);
setView('docs');
```

### Option 2 : Via la console (dev)
```javascript
// Ouvrez la console (F12) et tapez :
useStore.getState().setView('docs')
```

### Option 3 : Ajoutez un bouton dans le Hub
```tsx
<button onClick={() => setView('docs')}>
  📚 Documentation
</button>
```

## 📁 Structure des fichiers

```
src/
  ├── components/docs/
  │   ├── ProductReference.tsx      ← Page principale
  │   ├── ModuleFlowDiagram.tsx     ← Diagrammes React Flow
  │   └── FeatureAccordion.tsx      ← Accordéons de features
  └── data/docs/
      └── productReferenceData.ts   ← Données structurées
```

## 🎨 Fonctionnalités

### ✨ Diagrammes React Flow
- ✅ Zoom/Pan natif (molette + drag)
- ✅ MiniMap pour navigation
- ✅ Controls (zoom +/-, fit view)
- ✅ Background avec grille
- ✅ Dark mode natif
- ✅ Animations fluides

### 📋 Accordéons de Features
- ✅ Collapse/Expand
- ✅ Badges de statut colorés
- ✅ Tableau responsive
- ✅ Animations smooth

## 🔮 Prêt pour l'IA !

La structure est maintenant parfaite pour ajouter des **prédictions IA** :

```typescript
// Exemple : Ajouter des prédictions dynamiques
const addAIPrediction = (moduleId: string, prediction: Feature) => {
  // Ajouter au graph
  const newNode = {
    id: `ai-${Date.now()}`,
    data: { 
      label: prediction.name,
      probability: prediction.score 
    },
    style: {
      border: '2px dashed #b392f0',
      background: 'rgba(179, 146, 240, 0.1)'
    }
  };
  
  // React Flow va automatiquement re-render
};
```

## 🎯 Prochaines étapes

1. Ajouter un bouton d'accès dans le Hub
2. Ajouter plus de modules (les 7 restants)
3. Intégrer l'API de prédictions IA
4. Ajouter des filtres/recherche

## 💡 Avantages vs HTML

| Feature | HTML + Mermaid | React + React Flow |
|---------|----------------|-------------------|
| Zoom/Pan | 🔧 À coder | ✅ Natif |
| Interactivité | ⚠️ Limitée | ✅ Totale |
| IA Dynamique | ❌ Impossible | ✅ Facile |
| Maintenance | ⚠️ Difficile | ✅ Simple |
| Hot Reload | ❌ Non | ✅ Oui |
| Intégration App | ❌ Séparé | ✅ Intégré |

## 🚀 Démarrage

```bash
npm run dev
```

Puis dans la console :
```javascript
useStore.getState().setView('docs')
```

Enjoy ! 🎉

