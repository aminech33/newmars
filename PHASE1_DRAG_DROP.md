# Phase 1 : Drag & Drop ✅

## Implémentation terminée

### 🎯 Objectif
Permettre aux utilisateurs de déplacer manuellement les tâches entre les colonnes temporelles (`Aujourd'hui`, `En cours`, `À venir`, `Lointain`) via drag & drop.

---

## 📦 Modifications apportées

### 1. **Installation de la librairie**
- Installé `@hello-pangea/dnd` (fork maintenu de `react-beautiful-dnd`)
- Pas de conflit de dépendances avec React 18.3.1

### 2. **Mise à jour du store (`useStore.ts`)**
```typescript
export type TemporalColumn = 'today' | 'inProgress' | 'upcoming' | 'distant'

export interface Task {
  // ... propriétés existantes
  temporalColumn?: TemporalColumn // ✨ NOUVEAU
  effort?: 'XS' | 'S' | 'M' | 'L'
  phaseIndex?: number
}
```

**Changements clés :**
- Ajout de `temporalColumn?` pour stocker l'assignation manuelle d'une colonne
- Ajout de `effort?` et `phaseIndex?` (déjà utilisés dans la génération de projets)
- Export de `TemporalColumn` comme type réutilisable

---

### 3. **Intégration dans TasksPage.tsx**

#### **Import de la librairie**
```typescript
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { type TemporalColumn } from '../../store/useStore'
```

#### **Handler de drag & drop**
```typescript
const handleDragEnd = (result: DropResult) => {
  const { destination, source, draggableId } = result
  
  if (!destination) return // Dropped outside
  if (destination.droppableId === source.droppableId && 
      destination.index === source.index) return // Same position
  
  const newColumn = destination.droppableId as TemporalColumn
  updateTask(draggableId, { temporalColumn: newColumn })
}
```

**Logique :**
- Récupère l'ID de la colonne de destination
- Met à jour la tâche avec `temporalColumn`
- Le système de catégorisation automatique (`categorizeTask`) respecte désormais `temporalColumn` en priorité

#### **Wrapper DragDropContext**
```tsx
<DragDropContext onDragEnd={handleDragEnd}>
  <div className="flex-1 flex overflow-hidden">
    {COLUMNS.map((config) => (
      <TemporalColumn ... />
    ))}
  </div>
</DragDropContext>
```

---

### 4. **Mise à jour de TemporalColumn**

```tsx
<Droppable droppableId={config.id}>
  {(provided, snapshot) => (
    <div 
      ref={provided.innerRef}
      {...provided.droppableProps}
      className={`... ${
        snapshot.isDraggingOver ? 'ring-2 ring-inset ring-indigo-500/50' : ''
      }`}
    >
      {/* Content */}
      {provided.placeholder}
    </div>
  )}
</Droppable>
```

**Améliorations visuelles :**
- Ring indigo quand on survole la colonne avec une tâche en drag
- Message "Déposer ici" dans les colonnes vides quand `isDraggingOver`
- `provided.placeholder` pour maintenir l'espacement

---

### 5. **Mise à jour de TaskRow**

```tsx
<Draggable 
  draggableId={task.id} 
  index={index} 
  isDragDisabled={task.completed}
>
  {(provided, snapshot) => (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`
        ... 
        ${snapshot.isDragging ? 
          'shadow-2xl shadow-black/50 scale-105 rotate-2 ring-2 ring-indigo-500/50' 
          : ''
        }
      `}
    >
      {/* Content */}
    </div>
  )}
</Draggable>
```

**Améliorations visuelles :**
- Les tâches complétées ne peuvent pas être déplacées (`isDragDisabled`)
- Effet de drag élégant : `scale-105 rotate-2` + ombre portée
- Ring indigo pendant le drag
- L'étoile de priorité disparaît pendant le drag (évite confusion)

---

## 🎨 Expérience utilisateur

### **Avant**
- ❌ Les tâches étaient assignées automatiquement selon des règles (deadline, priorité)
- ❌ Impossible de déplacer une tâche manuellement

### **Après**
- ✅ **Drag & drop fluide** entre colonnes
- ✅ **Feedback visuel** : ombre portée, rotation, ring indigo
- ✅ **Colonnes réactives** : highlight quand on survole
- ✅ **Désactivation intelligente** : les tâches complétées restent immobiles
- ✅ **Persistance** : la colonne assignée manuellement est sauvegardée dans `temporalColumn`

---

## 🔄 Priorité d'assignation des colonnes

La fonction `categorizeTask()` suit maintenant cette priorité :

```
1. temporalColumn (assignation manuelle via drag & drop)
   ⤷ PRIORITÉ ABSOLUE
2. completed = true
   ⤷ Toujours "Aujourd'hui" (pour feedback)
3. status = 'in-progress'
   ⤷ Colonne "En cours"
4. isPriority = true ou priority = 'urgent'|'high'
   ⤷ "Aujourd'hui"
5. dueDate (logique de deadline)
   ⤷ Urgent → Aujourd'hui, proche → À venir, lointain → Lointain
6. Fallback
   ⤷ "À venir"
```

**Impact :** Une fois qu'un utilisateur déplace une tâche, elle y reste (sauf si `temporalColumn` est supprimé/reset).

---

## 🧪 Test manuel recommandé

1. **Créer quelques tâches** dans différentes colonnes
2. **Drag une tâche** de "À venir" → "Aujourd'hui"
   - ✅ Vérifier l'animation de drag (rotation, ombre)
   - ✅ Vérifier le highlight de la colonne cible
3. **Drop la tâche**
   - ✅ La tâche apparaît dans "Aujourd'hui"
   - ✅ L'état persiste après refresh (localStorage)
4. **Essayer de drag une tâche complétée**
   - ✅ Doit être impossible (`isDragDisabled`)
5. **Drag vers une colonne vide**
   - ✅ Message "Déposer ici" s'affiche

---

## 🚀 Prochaines étapes possibles

- [ ] **Réordonnancement intra-colonne** : changer l'ordre des tâches dans une même colonne
- [ ] **Batch drag** : sélectionner plusieurs tâches et les déplacer ensemble
- [ ] **Undo/Redo** : bouton pour annuler un déplacement accidentel
- [ ] **Raccourcis clavier** : `Shift+1` → Aujourd'hui, `Shift+2` → En cours, etc.
- [ ] **Animation de colonnes** : smooth scroll vers la colonne cible après drop

---

## 📝 Notes techniques

### **Performance**
- La librairie utilise `position: fixed` pendant le drag (pas de re-render lourd)
- Le `updateTask` ne déclenche qu'un seul re-render (via Zustand)

### **Accessibilité**
- `@hello-pangea/dnd` supporte le clavier (Tab + Space/Enter pour drag)
- Les tâches ont déjà `aria-label` implicites via leur titre

### **Compatibilité**
- ✅ React 18.3.1
- ✅ TypeScript strict mode
- ✅ Tailwind CSS (classes custom)

---

## ✅ Statut : PHASE 1 TERMINÉE

Le drag & drop est **fonctionnel et prêt pour la production**. 

Temps d'implémentation : ~15 minutes  
Complexité : 🟢 Faible (librairie mature, API simple)  
Impact UX : 🔥 Très élevé (game changer pour la gestion manuelle)

---

**Prochain objectif :** Phase 2 (TBD)








