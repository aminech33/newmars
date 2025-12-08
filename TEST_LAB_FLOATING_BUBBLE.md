# 🎈 Test Lab - Bulle Flottante Draggable

## 📋 Description

Une bulle flottante interactive style Messenger qui permet d'accéder au Test Lab depuis n'importe où dans l'application, sans avoir à naviguer dans les menus.

## ✨ Fonctionnalités

### 🎯 Bulle Flottante
- **Déplaçable** : Cliquez et glissez la bulle n'importe où sur l'écran
- **Position sauvegardée** : La position est mémorisée dans le Local Storage
- **Responsive** : S'adapte aux limites de l'écran
- **Touch-friendly** : Fonctionne sur mobile et tablette

### 📱 Menu Contextuel
Au clic sur la bulle, un menu apparaît avec 3 options :
1. **Vue rapide** : Ouvre le Test Lab en modal rapide
2. **Test Lab complet** : Navigue vers la page complète
3. **Fermer** : Ferme le menu

### 🎨 Design
- Gradient indigo → purple
- Badge de notification animé
- Effet de glow au survol
- Animation smooth lors du drag
- Menu contextuel adaptatif (s'affiche à gauche ou à droite selon la position)

## 🚀 Utilisation

### Déplacer la Bulle
1. **Desktop** : Cliquez et maintenez, puis glissez
2. **Mobile/Tablet** : Touchez et glissez avec votre doigt

### Ouvrir le Menu
- Cliquez rapidement sur la bulle (sans glisser)

### Vue Rapide
1. Cliquez sur la bulle
2. Sélectionnez "Vue rapide"
3. Une modal s'ouvre avec :
   - Statistiques des tests
   - Liste des modules
   - Tests individuels
   - Bouton pour ouvrir le Test Lab complet

### Test Lab Complet
1. Cliquez sur la bulle
2. Sélectionnez "Test Lab complet"
3. Navigation vers la page dédiée

## 🔧 Fonctionnalités Techniques

### Persistance de Position
```typescript
// Sauvegarde automatique dans le Local Storage
localStorage.setItem('testlab-bubble-position', JSON.stringify({ x, y }))

// Chargement au démarrage
const savedPosition = localStorage.getItem('testlab-bubble-position')
```

### Gestion du Drag
- Détection Mouse & Touch
- Calcul de l'offset pour un drag fluide
- Limites de l'écran pour éviter que la bulle sorte
- État `isDragging` pour désactiver le clic pendant le drag

### Auto-fermeture du Menu
- Le menu se ferme automatiquement après 5 secondes
- Se ferme aussi lors d'une action (clic sur une option)

### Positionnement Intelligent
- Le menu s'affiche à droite de la bulle si elle est à gauche de l'écran
- Le menu s'affiche à gauche de la bulle si elle est à droite de l'écran

## 📍 Visibilité

La bulle est visible partout **SAUF** :
- En mode Focus
- Sur la page Test Lab elle-même (pour éviter la redondance)

## 🎨 Personnalisation

### Couleurs
```typescript
// Gradient de la bulle
bg-gradient-to-br from-indigo-500 to-purple-600

// Badge de notification
bg-emerald-500

// Menu contextuel
bg-zinc-900 border-zinc-800
```

### Taille
```typescript
// Bulle principale
w-14 h-14 (56px × 56px)

// Badge
w-4 h-4 (16px × 16px)

// Icône
w-6 h-6 (24px × 24px)
```

## 📊 Composants Créés

### 1. `TestLabFloatingBubble.tsx`
Bulle draggable avec menu contextuel

**Props** :
- `onOpenQuickView: () => void` - Callback pour ouvrir la vue rapide
- `onOpenFullLab: () => void` - Callback pour ouvrir le Test Lab complet

### 2. `TestLabQuickView.tsx`
Modal rapide pour les tests

**Props** :
- `isOpen: boolean` - État d'ouverture
- `onClose: () => void` - Fermer la modal
- `onOpenFullLab: () => void` - Ouvrir le Test Lab complet
- `testResults: Record<string, TestResult>` - Résultats des tests
- `onRunTest: (testId: string) => void` - Lancer un test
- `onRunModule: (moduleId: string) => void` - Lancer un module

### 3. `TestLabFAB.tsx`
FAB alternatif (non utilisé actuellement, gardé pour référence)

## 🔄 Intégration dans App.tsx

```tsx
{!isFocusMode && currentView !== 'test-lab' && (
  <>
    <TestLabFloatingBubble
      onOpenQuickView={() => setShowTestLabQuick(true)}
      onOpenFullLab={() => setView('test-lab')}
    />
    <TestLabQuickView
      isOpen={showTestLabQuick}
      onClose={() => setShowTestLabQuick(false)}
      onOpenFullLab={() => {
        setShowTestLabQuick(false)
        setView('test-lab')
      }}
      testResults={testResults}
      onRunTest={handleRunTest}
      onRunModule={handleRunModule}
    />
  </>
)}
```

## 💡 Avantages

✅ **Accessibilité instantanée** : Plus besoin de naviguer dans les menus  
✅ **Ergonomie** : Placez la bulle où vous voulez  
✅ **Performance** : Légère et rapide  
✅ **UX moderne** : Inspiration Messenger/Facebook  
✅ **Persistance** : Se souvient de votre position préférée  
✅ **Non-intrusif** : Disparaît quand pas nécessaire  

## 🎯 Cas d'Usage

1. **Développement** : Tests rapides pendant le dev
2. **QA** : Vérifications fréquentes sans quitter la page
3. **Debug** : Accès rapide aux résultats de tests
4. **Demo** : Montrer facilement les tests aux autres

## 🔜 Améliorations Futures (Optionnel)

- [ ] Raccourci clavier pour ouvrir/fermer le menu
- [ ] Modes de position prédéfinis (coins, centres)
- [ ] Personnalisation de la couleur
- [ ] Notifications de résultats dans la bulle
- [ ] Mini-graphique des résultats dans la bulle
- [ ] Double-clic pour ouvrir directement le Test Lab
- [ ] Gesture swipe pour fermer

---

**Créé le** : 7 décembre 2024  
**Version** : 1.0.0  
**Status** : ✅ Production Ready

