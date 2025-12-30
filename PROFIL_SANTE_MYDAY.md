# 🏥 Profil Santé intégré à MyDay

## ✅ Modifications effectuées

### 1. **Nouveau bouton "Configurer profil"**
Dans l'onglet Santé de MyDay, tu as maintenant 3 boutons principaux :
- **Ajouter un repas** (vert) 
- **Ajouter une pesée** (rose)
- **Configurer profil** (indigo) ⬅️ NOUVEAU

### 2. **WaterTracker visible**
Le tracker d'hydratation est maintenant affiché juste avant la grille Nutrition/Poids :
- Verres d'eau visuels
- Progression quotidienne
- Ajout/retrait rapide

### 3. **ProfileSetupModal accessible**
Lors du clic sur "Configurer profil", le modal s'ouvre avec :
- **Informations personnelles** : âge, sexe, taille, poids actuel
- **Objectif** : perdre, maintenir ou prendre du poids
- **Niveau d'activité** : sédentaire → très actif
- **Calculs automatiques** :
  - BMR (métabolisme de base)
  - TDEE (dépense énergétique totale)
  - Calories cibles adaptées à l'objectif
  - Macros (protéines, glucides, lipides)

---

## 🎯 Flux utilisateur

1. **Première utilisation** : 
   - L'utilisateur clique sur "Configurer profil"
   - Remplit ses informations
   - Le système calcule automatiquement ses objectifs nutritionnels

2. **Suivi quotidien** :
   - Ajouter des repas → calcul automatique des calories/macros
   - Tracker l'hydratation → progression visuelle
   - Ajouter des pesées → détection automatique de changement

3. **Recalcul automatique** :
   - Lorsque le poids change de ±2kg, le système propose de recalculer les objectifs
   - L'utilisateur peut aussi reconfigurer manuellement à tout moment

---

## 🧩 Architecture

### Composants intégrés
```
MyDayPage (onglet Santé)
├── Boutons d'action
│   ├── Ajouter un repas → MealModal
│   ├── Ajouter une pesée → WeightModal
│   └── Configurer profil → ProfileSetupModal ✨
├── WaterTracker ✨
├── Grid Nutrition (3/5)
│   ├── Calories du jour
│   ├── Macros circulaires
│   └── Liste des repas
└── Grid Poids (2/5)
    ├── Stats actuelles (BMI, poids)
    └── Graphique d'évolution
```

### Nouveaux imports
```typescript
import { WaterTracker } from '../health/WaterTracker'
import { ProfileSetupModal } from '../health/ProfileSetupModal'
```

### État local ajouté
```typescript
const [showProfileModal, setShowProfileModal] = useState(false)
```

---

## 🚀 Prochaines étapes possibles

- [ ] Ajouter un raccourci clavier pour ouvrir le profil (par ex. `P`)
- [ ] Afficher un indicateur si le profil n'est pas configuré
- [ ] Ajouter des suggestions personnalisées basées sur le profil
- [ ] Historique des changements de profil

---

## 📍 Où trouver

**Page** : MyDay → Onglet "Santé" (🏥)  
**Serveur** : http://localhost:5174/

---

✅ **Tout est fonctionnel et intégré dans une seule page cohérente !**




