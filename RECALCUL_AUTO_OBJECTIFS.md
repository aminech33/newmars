# 🔄 RECALCUL AUTOMATIQUE DES OBJECTIFS

## ✨ Fonctionnalité ajoutée !

Le système **recalcule automatiquement** tes objectifs nutritionnels quand ton poids change significativement.

---

## 🎯 Comment ça marche ?

### **1. Tu enregistres un nouveau poids**
```
Exemple :
Ancien poids : 80 kg
Nouveau poids : 78 kg (-2kg)
```

### **2. Le système détecte le changement**
```
Seuil de recalcul : ±2 kg
Différence : -2 kg → RECALCUL AUTOMATIQUE
```

### **3. Nouveaux objectifs calculés**
```
AVANT (80 kg) :
- BMR : 1725 kcal
- TDEE : 2674 kcal  
- Objectif perte : 2174 kcal (-500)
- Protéines : 190g

APRÈS (78 kg) :
- BMR : 1705 kcal  ↓ -20 kcal
- TDEE : 2643 kcal  ↓ -31 kcal
- Objectif perte : 2143 kcal (-500)  ↓ -31 kcal
- Protéines : 188g  ↓ -2g
```

### **4. Notification affichée**
```
✨ Objectifs recalculés !
Poids: -2.0kg → Objectif recalculé: -31 kcal
```

---

## 🔧 Configuration du recalcul

### **Seuil par défaut : ±2 kg**

Le système ne recalcule **que si** :
- Tu as perdu **≥2 kg** OU
- Tu as gagné **≥2 kg**

**Pourquoi ?**
- Évite les recalculs à chaque fluctuation normale (±0.5kg/jour)
- Pertinent uniquement pour changements significatifs
- Garde la cohérence de tes objectifs

### **Fréquence recommandée de pesée :**
- ✅ **1 fois par semaine** (idéal)
- ⚠️ Pas tous les jours (trop de variations)
- 📅 Même jour, même heure (pour fiabilité)

---

## 📊 Exemple concret complet

### **Scénario : Perte de poids sur 8 semaines**

```
┌─────────┬─────────┬──────────┬──────────────┬───────────┐
│ Semaine │ Poids   │ BMR      │ TDEE         │ Objectif  │
├─────────┼─────────┼──────────┼──────────────┼───────────┤
│ S0      │ 80.0 kg │ 1725 kcal│ 2674 kcal    │ 2174 kcal │
│ S1      │ 79.5 kg │ 1720 kcal│ 2666 kcal    │ 2174 kcal │ ← Pas de recalcul (-0.5kg)
│ S2      │ 79.0 kg │ 1715 kcal│ 2659 kcal    │ 2174 kcal │ ← Pas de recalcul (-1kg cumulé)
│ S3      │ 78.5 kg │ 1710 kcal│ 2651 kcal    │ 2174 kcal │ ← Pas de recalcul (-1.5kg)
│ S4      │ 78.0 kg │ 1705 kcal│ 2643 kcal    │ 2143 kcal │ ✅ RECALCUL (-2kg)
│ S5      │ 77.5 kg │ 1700 kcal│ 2636 kcal    │ 2143 kcal │ ← Pas de recalcul
│ S6      │ 77.0 kg │ 1695 kcal│ 2628 kcal    │ 2143 kcal │ ← Pas de recalcul
│ S7      │ 76.5 kg │ 1690 kcal│ 2621 kcal    │ 2143 kcal │ ← Pas de recalcul
│ S8      │ 76.0 kg │ 1685 kcal│ 2613 kcal    │ 2113 kcal │ ✅ RECALCUL (-4kg)
└─────────┴─────────┴──────────┴──────────────┴───────────┘

Recalculs : 2 fois en 8 semaines
Ajustement total : -61 kcal (2174 → 2113)
```

---

## 💡 Avantages

### **1. Automatique** ✨
- Pas besoin de reconfigurer manuellement ton profil
- Se met à jour tout seul quand tu enregistres ton poids

### **2. Intelligent** 🧠
- Seuil de ±2kg évite les recalculs inutiles
- Garde la cohérence de tes objectifs

### **3. Transparent** 📊
- Notification claire du changement
- Tu sais toujours pourquoi ça a changé

### **4. Scientifique** 🔬
- Basé sur les formules BMR/TDEE
- Ajuste selon ton poids réel

---

## ⚙️ Fonctionnement technique

### **Déclenchement :**
```typescript
// Quand tu ajoutes un nouveau poids :
addWeightEntry(78kg)

// 1. Vérifie le changement
if (|78kg - 80kg| >= 2kg) {
  // 2. Recalcule BMR/TDEE
  bmr = 10×78 + 6.25×175 - 5×30 + 5 = 1705
  tdee = 1705 × 1.55 = 2643
  
  // 3. Applique l'objectif (lose = -500)
  target = 2643 - 500 = 2143
  
  // 4. Recalcule macros
  protein = (2143 × 0.35) / 4 = 188g
  carbs = (2143 × 0.35) / 4 = 188g
  fat = (2143 × 0.30) / 9 = 71g
  
  // 5. Met à jour les objectifs
  updateHealthGoal(caloriesGoalId, { target: 2143 })
  updateHealthGoal(proteinGoalId, { target: 188 })
  
  // 6. Affiche notification
  toast("✨ Objectifs recalculés ! -2.0kg → -31 kcal")
}
```

---

## 🎯 Quand ça ne recalcule PAS

### **Variations normales (< 2kg) :**
- 80kg → 79.5kg ❌ Pas de recalcul
- 80kg → 79kg ❌ Pas de recalcul
- 80kg → 78.5kg ❌ Pas de recalcul

### **Raisons :**
- Fluctuations eau/glycogène : ±0.5-1kg/jour normal
- Horaires de pesée différents
- État d'hydratation variable

---

## 🔄 Modification manuelle possible

Tu peux **toujours** reconfigurer manuellement :
1. Va dans **Profil** (touche `5`)
2. Clique **"Modifier mon profil et mes objectifs"**
3. Change ce que tu veux
4. Le système utilisera tes nouveaux choix

**Le recalcul auto respecte toujours ton objectif** (lose/maintain/gain) !

---

## 📱 Notifications

### **Type 1 : Recalcul déclenché**
```
✨ Objectifs recalculés !
Poids: -2.0kg → Objectif recalculé: -31 kcal
```

### **Type 2 : Pas de recalcul**
```
✅ Poids enregistré
```

---

## ❓ FAQ

### **Q: Pourquoi mon objectif n'a pas changé alors que j'ai perdu 1kg ?**
**R:** Le seuil est ±2kg. Attends d'avoir perdu 2kg au total.

### **Q: Je veux recalculer même avec -1kg, c'est possible ?**
**R:** Oui ! Va dans Profil et clique "Modifier". Ça recalculera immédiatement.

### **Q: Le recalcul garde mon objectif (perte/maintien/gain) ?**
**R:** OUI ! Si tu es en "perte de poids", tu resteras en perte. Le système ajuste juste les calories selon ton nouveau poids.

### **Q: Et si je gagne du poids alors que je veux perdre ?**
**R:** Le système recalcule quand même. Ton objectif reste "perte" mais avec les nouvelles valeurs BMR/TDEE.

### **Q: Puis-je désactiver le recalcul auto ?**
**R:** Pas actuellement, mais tu peux toujours revenir en arrière manuellement via Profil.

---

## 🎉 Résultat

**Tu n'as plus besoin de te rappeler de mettre à jour tes objectifs !**

```
Avant :
1. Perds 5kg ✓
2. Oublies de reconfigurer ton profil ✗
3. Continues avec les anciens objectifs (trop de calories) ✗
4. Plateau de perte de poids ✗

Après :
1. Perds 2kg ✓
2. Le système recalcule automatiquement ✅
3. Tes objectifs s'adaptent à ton nouveau poids ✅
4. Continues à progresser ✅
```

---

**Le système est désormais intelligent et s'adapte à TOI ! 🚀**







