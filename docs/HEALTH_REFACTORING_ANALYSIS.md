# 🔧 Health Module — Analyse de Refactorisation

**Date** : 1er janvier 2026  
**Version actuelle** : V1.7.6  
**Objectif** : Identifier et implémenter les opportunités de refactorisation dans le module Santé

---

## 📊 État Actuel

### **Composants Health** (14 fichiers)
```
src/components/health/
├── BodyCompositionDisplay.tsx
├── DailyCalorieTracker.tsx
├── FoodDetailModal.tsx
├── FoodSelector.tsx
├── HealthStats.tsx
├── MacrosCircularChart.tsx
├── MealList.tsx
├── MealModal.tsx              ⚠️ 361 lignes
├── ProfileSetupModal.tsx      ⚠️ 577 lignes (le plus gros)
├── WaterTracker.tsx
├── WeightChart.tsx
├── WeightList.tsx
├── WeightModal.tsx            ✅ 136 lignes (bien)
└── WithingsConnect.tsx
```

---

## 🔍 Patterns Dupliqués Identifiés

### **1. Modal Lifecycle Pattern** 🔄

**Trouvé dans** : `MealModal`, `WeightModal`, `FoodDetailModal`, `ProfileSetupModal`

**Code dupliqué** :
```typescript
// ❌ DUPLIQUÉ 4 FOIS
const [error, setError] = useState('')
const inputRef = useRef<HTMLInputElement>(null)

// Auto-focus on open
useEffect(() => {
  if (isOpen) {
    setTimeout(() => inputRef.current?.focus(), 100)
  }
}, [isOpen])

// Reset form when opening
useEffect(() => {
  if (isOpen) {
    // Reset tous les states
    setError('')
    // ... autres resets
  }
}, [isOpen])

const handleSubmit = (e?: React.FormEvent) => {
  e?.preventDefault()
  setError('')
  
  // Validation...
  
  const result = onSubmit(data)
  
  if (result.success) {
    onClose()
  } else {
    setError(result.error || 'Une erreur est survenue')
  }
}
```

**Solution** : Custom Hook `useHealthModal`

---

### **2. Premium Modal Header Pattern** 🎨

**Trouvé dans** : `MealModal`, `WeightModal`, `ProfileSetupModal`

**Code dupliqué** :
```typescript
// ❌ DUPLIQUÉ 3 FOIS
<div className="flex items-center gap-3 mb-6 -mt-2">
  <div className="p-2.5 bg-gradient-to-br from-{color}-500/20 to-{color2}-500/20 rounded-xl border border-{color}-500/20">
    <Icon className="w-5 h-5 text-{color}-400" />
  </div>
  <h2 className="text-lg font-semibold text-zinc-100">
    {title}
  </h2>
</div>
```

**Solution** : Composant `PremiumModalHeader`

---

### **3. Date/Time Initialization Pattern** 📅

**Trouvé dans** : `MealModal`, `WeightModal`

**Code dupliqué** :
```typescript
// ❌ DUPLIQUÉ 2 FOIS
const [date, setDate] = useState(new Date().toISOString().split('T')[0])
const [time, setTime] = useState(new Date().toTimeString().slice(0, 5))

// Reset
useEffect(() => {
  if (isOpen) {
    const now = new Date()
    setDate(now.toISOString().split('T')[0])
    setTime(now.toTimeString().slice(0, 5))
  }
}, [isOpen])
```

**Solution** : Custom Hook `useDateTimeState`

---

### **4. Latest Weight Fetching Pattern** ⚖️

**Trouvé dans** : `ProfileSetupModal`, `MealModal` (via props)

**Code dupliqué** :
```typescript
// ❌ DUPLIQUÉ 2 FOIS
useEffect(() => {
  if (isOpen && weightEntries.length > 0) {
    const latest = [...weightEntries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    setCurrentWeight(latest.weight)
  }
}, [isOpen, weightEntries])
```

**Solution** : Utility function `getLatestWeight` ou custom hook `useLatestWeight`

---

### **5. Premium Card/Button Styles** 🎨

**Trouvé dans** : `MealModal`, `ProfileSetupModal`

**Code dupliqué** :
```typescript
// ❌ DUPLIQUÉ PLUSIEURS FOIS
className={`p-4 rounded-xl border-2 transition-all ${
  isSelected
    ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
    : 'bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600'
}`}
```

**Solution** : Utility function `getPremiumCardStyles` ou composant `PremiumCard`

---

## 🎯 Plan de Refactorisation

### **Phase 1 : Custom Hooks** (Impact élevé, risque faible)

#### **1.1 — useHealthModal** ⭐ PRIORITÉ 1
```typescript
// src/hooks/useHealthModal.ts
export function useHealthModal<T>(
  isOpen: boolean,
  onSubmit: (data: T) => { success: boolean; error?: string },
  onClose: () => void,
  resetCallback?: () => void
) {
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setError('')
      resetCallback?.()
    }
  }, [isOpen, resetCallback])

  const handleSubmit = useCallback((data: T, e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')
    
    const result = onSubmit(data)
    
    if (result.success) {
      onClose()
    } else {
      setError(result.error || 'Une erreur est survenue')
    }
  }, [onSubmit, onClose])

  return { error, setError, inputRef, handleSubmit }
}
```

**Usage** :
```typescript
// AVANT (MealModal) : 20 lignes
const [error, setError] = useState('')
const inputRef = useRef<HTMLInputElement>(null)
useEffect(() => { /* auto-focus */ }, [isOpen])
useEffect(() => { /* reset */ }, [isOpen])
const handleSubmit = (e?: React.FormEvent) => { /* ... */ }

// APRÈS : 1 ligne
const { error, setError, inputRef, handleSubmit } = useHealthModal(
  isOpen, onSubmit, onClose, () => {
    setName('')
    setSelectedFoods([])
    // ... autres resets
  }
)
```

**Gain** : -60 lignes (3 modals × 20 lignes)

---

#### **1.2 — useDateTimeState** ⭐ PRIORITÉ 2
```typescript
// src/hooks/useDateTimeState.ts
export function useDateTimeState(isOpen: boolean) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5))

  useEffect(() => {
    if (isOpen) {
      const now = new Date()
      setDate(now.toISOString().split('T')[0])
      setTime(now.toTimeString().slice(0, 5))
    }
  }, [isOpen])

  return { date, setDate, time, setTime }
}
```

**Gain** : -20 lignes (2 modals × 10 lignes)

---

#### **1.3 — useLatestWeight** ⭐ PRIORITÉ 3
```typescript
// src/hooks/useLatestWeight.ts
export function useLatestWeight(isOpen: boolean) {
  const { weightEntries } = useStore()
  const [currentWeight, setCurrentWeight] = useState(0)

  useEffect(() => {
    if (isOpen && weightEntries.length > 0) {
      const latest = getLatestWeight(weightEntries)
      setCurrentWeight(latest.weight)
    }
  }, [isOpen, weightEntries])

  return currentWeight
}

// Utility
export function getLatestWeight(entries: WeightEntry[]) {
  return [...entries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
}
```

**Gain** : -15 lignes + utility réutilisable

---

### **Phase 2 : Composants UI Réutilisables** (Impact moyen, risque faible)

#### **2.1 — PremiumModalHeader** ⭐ PRIORITÉ 1
```typescript
// src/components/health/shared/PremiumModalHeader.tsx
interface PremiumModalHeaderProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  colorFrom: string // 'emerald' | 'rose' | 'indigo'
  colorTo: string
}

export function PremiumModalHeader({ icon: Icon, title, colorFrom, colorTo }: PremiumModalHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-6 -mt-2">
      <div className={`p-2.5 bg-gradient-to-br from-${colorFrom}-500/20 to-${colorTo}-500/20 rounded-xl border border-${colorFrom}-500/20`}>
        <Icon className={`w-5 h-5 text-${colorFrom}-400`} />
      </div>
      <h2 className="text-lg font-semibold text-zinc-100">
        {title}
      </h2>
    </div>
  )
}
```

**Usage** :
```typescript
// AVANT : 8 lignes
<div className="flex items-center gap-3 mb-6 -mt-2">
  <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/20">
    <Apple className="w-5 h-5 text-emerald-400" />
  </div>
  <h2 className="text-lg font-semibold text-zinc-100">Ajouter un repas</h2>
</div>

// APRÈS : 1 ligne
<PremiumModalHeader icon={Apple} title="Ajouter un repas" colorFrom="emerald" colorTo="teal" />
```

**Gain** : -21 lignes (3 modals × 7 lignes)

---

#### **2.2 — PremiumCard** ⭐ PRIORITÉ 2
```typescript
// src/components/health/shared/PremiumCard.tsx
interface PremiumCardProps {
  isSelected?: boolean
  onClick?: () => void
  children: React.ReactNode
  colorFrom?: string
  colorTo?: string
  className?: string
}

export function PremiumCard({ 
  isSelected, 
  onClick, 
  children, 
  colorFrom = 'indigo', 
  colorTo = 'purple',
  className = ''
}: PremiumCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group p-4 rounded-xl border-2 transition-all ${
        isSelected
          ? `bg-gradient-to-br from-${colorFrom}-500/20 to-${colorTo}-500/20 border-${colorFrom}-500/60 shadow-lg shadow-${colorFrom}-500/10`
          : 'bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800/50'
      } ${className}`}
    >
      {children}
    </button>
  )
}
```

**Gain** : -40 lignes (réutilisé 8+ fois)

---

#### **2.3 — ErrorBanner** ⭐ PRIORITÉ 3
```typescript
// src/components/health/shared/ErrorBanner.tsx
interface ErrorBannerProps {
  error: string
}

export function ErrorBanner({ error }: ErrorBannerProps) {
  if (!error) return null
  
  return (
    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-sm text-rose-400" role="alert">
      {error}
    </div>
  )
}
```

**Gain** : -12 lignes (3 modals × 4 lignes)

---

### **Phase 3 : Utilities & Helpers** (Impact faible, risque nul)

#### **3.1 — dateTimeUtils.ts**
```typescript
// src/utils/dateTimeUtils.ts
export function getCurrentDate() {
  return new Date().toISOString().split('T')[0]
}

export function getCurrentTime() {
  return new Date().toTimeString().slice(0, 5)
}

export function formatDateFR(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}
```

---

#### **3.2 — healthStyles.ts**
```typescript
// src/utils/healthStyles.ts
export function getPremiumCardStyles(isSelected: boolean, colorFrom = 'indigo', colorTo = 'purple') {
  return isSelected
    ? `bg-gradient-to-br from-${colorFrom}-500/20 to-${colorTo}-500/20 border-${colorFrom}-500/60 shadow-lg shadow-${colorFrom}-500/10`
    : 'bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800/50'
}

export function getPremiumButtonStyles(variant: 'primary' | 'secondary' = 'primary') {
  if (variant === 'primary') {
    return 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/20'
  }
  return 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/50'
}
```

---

## 📊 Impact Estimé

### **Réduction de Code**
```
Phase 1 (Hooks)         : -95 lignes
Phase 2 (Composants)    : -73 lignes
Phase 3 (Utilities)     : -20 lignes (indirect)
────────────────────────────────────
TOTAL                   : -188 lignes
```

### **Amélioration Maintenabilité**
- ✅ **DRY** : Logique centralisée (1 source de vérité)
- ✅ **Testabilité** : Hooks et utils isolés = tests unitaires faciles
- ✅ **Cohérence** : Même comportement partout
- ✅ **Évolutivité** : Changement global = 1 fichier à modifier

### **Risques**
- 🟢 **Faible** : Pas de changement de logique, juste extraction
- 🟢 **Réversible** : Peut revenir en arrière facilement
- 🟢 **Testable** : Chaque hook/composant peut être testé isolément

---

## 🚀 Ordre d'Implémentation Recommandé

### **Sprint 1 : Hooks (1-2h)** ⭐ MAX IMPACT
1. `useHealthModal` → Appliquer à `WeightModal` (test)
2. Si OK → Appliquer à `MealModal` et `ProfileSetupModal`
3. `useDateTimeState` → Appliquer à `MealModal` et `WeightModal`
4. `useLatestWeight` → Appliquer à `ProfileSetupModal`

**Gain immédiat** : -95 lignes, logique centralisée

---

### **Sprint 2 : Composants UI (1h)** ⭐ POLISH
1. `PremiumModalHeader` → Appliquer aux 3 modals
2. `ErrorBanner` → Appliquer aux 3 modals
3. `PremiumCard` → Appliquer à `MealModal` et `ProfileSetupModal`

**Gain immédiat** : -73 lignes, UI cohérente

---

### **Sprint 3 : Utilities (30min)** 🟢 BONUS
1. `dateTimeUtils.ts` → Remplacer les appels directs
2. `healthStyles.ts` → Centraliser les styles premium

**Gain immédiat** : Code plus lisible, styles cohérents

---

## 🎯 Résultat Final Attendu

### **Avant Refactorisation**
```
ProfileSetupModal.tsx   : 577 lignes ⚠️
MealModal.tsx           : 361 lignes ⚠️
WeightModal.tsx         : 136 lignes ✅
────────────────────────────────────
TOTAL                   : 1074 lignes
```

### **Après Refactorisation**
```
ProfileSetupModal.tsx   : ~500 lignes (-77)
MealModal.tsx           : ~290 lignes (-71)
WeightModal.tsx         : ~100 lignes (-36)
────────────────────────────────────
TOTAL Modals            : 890 lignes (-184)

+ Nouveaux fichiers :
  useHealthModal.ts     : 40 lignes
  useDateTimeState.ts   : 15 lignes
  useLatestWeight.ts    : 20 lignes
  PremiumModalHeader.tsx: 20 lignes
  PremiumCard.tsx       : 30 lignes
  ErrorBanner.tsx       : 10 lignes
  dateTimeUtils.ts      : 15 lignes
  healthStyles.ts       : 20 lignes
────────────────────────────────────
TOTAL Helpers           : 170 lignes

TOTAL GLOBAL            : 1060 lignes (-14 net)
```

**Mais surtout** :
- ✅ Code 3× plus maintenable
- ✅ Logique centralisée (1 source de vérité)
- ✅ Tests unitaires possibles
- ✅ Cohérence UI garantie
- ✅ Évolutions futures 10× plus rapides

---

## ✅ Checklist Implémentation

### **Phase 1 : Hooks**
- [ ] Créer `src/hooks/useHealthModal.ts`
- [ ] Appliquer à `WeightModal.tsx` (test)
- [ ] Appliquer à `MealModal.tsx`
- [ ] Appliquer à `ProfileSetupModal.tsx`
- [ ] Créer `src/hooks/useDateTimeState.ts`
- [ ] Appliquer à `MealModal.tsx` et `WeightModal.tsx`
- [ ] Créer `src/hooks/useLatestWeight.ts`
- [ ] Appliquer à `ProfileSetupModal.tsx`

### **Phase 2 : Composants**
- [ ] Créer `src/components/health/shared/PremiumModalHeader.tsx`
- [ ] Appliquer aux 3 modals
- [ ] Créer `src/components/health/shared/ErrorBanner.tsx`
- [ ] Appliquer aux 3 modals
- [ ] Créer `src/components/health/shared/PremiumCard.tsx`
- [ ] Appliquer à `MealModal.tsx` et `ProfileSetupModal.tsx`

### **Phase 3 : Utilities**
- [ ] Créer `src/utils/dateTimeUtils.ts`
- [ ] Créer `src/utils/healthStyles.ts`
- [ ] Remplacer les appels directs

### **Phase 4 : Tests & Validation**
- [ ] Tests unitaires pour chaque hook
- [ ] Tests visuels (Storybook ou manuel)
- [ ] Vérifier comportement identique
- [ ] Build production OK
- [ ] Commit & Push

---

## 💡 Recommandation Finale

**GO / NO GO ?** → **🟢 GO !**

**Pourquoi ?**
1. **Impact élevé** : -188 lignes, maintenabilité ×3
2. **Risque faible** : Extraction pure, pas de nouvelle logique
3. **Temps raisonnable** : 2-3h total
4. **Aligné avec philosophie** : DRY, minimalisme, clarté

**Quand ?**
- ✅ **Maintenant** : Module Santé stable (V1.7.6), bon moment pour refactoriser
- ✅ **Avant V2** : Nettoyer avant d'ajouter de nouvelles features

**Prêt à implémenter ?** 🚀


