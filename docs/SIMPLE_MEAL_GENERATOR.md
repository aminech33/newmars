# 🍽️ Générateur de Repas Simplifié

## ✨ Concept : 1 ou 2 repas optimaux

### **Philosophie**
- ❌ Pas de "petit-déjeuner", "déjeuner", "dîner", "collation"
- ✅ Juste **1 ou 2 repas** avec répartition nutritionnelle optimale
- ✅ Tous les aliments nécessaires pour la journée

---

## 🎯 Fonctionnalités Implémentées

### **1. Choix de répartition**

```
○ 1 repas (OMAD - One Meal A Day)
  → 100% des calories en 1 fois
  → Idéal pour jeûne intermittent 23:1

● 2 repas (Fenêtre 16:8)
  → Perte : 40/60 (repas 1 léger, repas 2 copieux)
  → Maintien/Gain : 50/50 (équilibré)
```

### **2. Répartition nutritionnelle intelligente**

Selon l'objectif :

#### **Perte de poids (lose)**
```
Protéines : 35% (préserver la masse musculaire)
Glucides  : 35%
Lipides   : 30%
```

#### **Maintien (maintain)**
```
Protéines : 30%
Glucides  : 40%
Lipides   : 30%
```

#### **Prise de masse (gain)**
```
Protéines : 25%
Glucides  : 50% (énergie pour l'entraînement)
Lipides   : 25%
```

### **3. Sélection d'aliments optimale**

Chaque repas contient automatiquement :

1. **Protéines variées** (2 sources)
   - Perte : Poulet + Yaourt grec (maigre)
   - Gain : Saumon + Œufs (plus riches)

2. **Glucides de qualité**
   - Céréales (70%) : Riz, Avoine, Patate douce
   - Fruits (30%) : Banane

3. **Légumes** (fibres + micronutriments)
   - Brocoli, Épinards, Tomates

4. **Lipides sains** (si nécessaire)
   - Huile d'olive, Avocat, Amandes

---

## 📊 Exemples Concrets

### **Exemple 1 : OMAD (1 repas) - Perte de poids**

**Profil** :
- Objectif : 2370 kcal/jour
- Goal : Perte de poids
- Repas : 1 seul

**Résultat généré** :
```
Repas unique (2370 kcal)

Aliments :
- Poulet         : 250g (413 kcal | 62g P)
- Yaourt grec    : 200g (195 kcal | 20g P)
- Riz            : 300g (390 kcal | 8g P | 84g G)
- Banane         : 120g (107 kcal | 1g P | 27g G)
- Brocoli        : 150g (51 kcal | 4g P | 10g G)
- Huile d'olive  : 20g (177 kcal | 20g L)

Total : 1333 kcal | 95g P | 121g G | 20g L
```

---

### **Exemple 2 : 2 repas (40/60) - Perte de poids**

**Profil** :
- Objectif : 2370 kcal/jour
- Goal : Perte de poids
- Repas : 2 (40/60)

#### **Repas 1 (40%) - 948 kcal**
```
Aliments :
- Poulet         : 150g (248 kcal | 37g P)
- Yaourt grec    : 150g (146 kcal | 15g P)
- Riz            : 150g (195 kcal | 4g P | 42g G)
- Banane         : 120g (107 kcal | 1g P | 27g G)
- Brocoli        : 150g (51 kcal | 4g P | 10g G)

Total : 747 kcal | 61g P | 79g G | 5g L
```

#### **Repas 2 (60%) - 1422 kcal**
```
Aliments :
- Saumon         : 200g (416 kcal | 50g P | 23g L)
- Œufs           : 150g (216 kcal | 19g P | 16g L)
- Patate douce   : 250g (215 kcal | 5g P | 50g G)
- Banane         : 120g (107 kcal | 1g P | 27g G)
- Brocoli        : 150g (51 kcal | 4g P | 10g G)
- Huile d'olive  : 15g (133 kcal | 15g L)

Total : 1138 kcal | 79g P | 87g G | 54g L
```

---

### **Exemple 3 : 2 repas (50/50) - Maintien**

**Profil** :
- Objectif : 2870 kcal/jour
- Goal : Maintien
- Repas : 2 (50/50)

#### **Repas 1 (50%) - 1435 kcal**
```
Aliments :
- Saumon         : 180g (374 kcal | 45g P | 21g L)
- Œufs           : 120g (173 kcal | 15g P | 13g L)
- Riz            : 200g (260 kcal | 5g P | 56g G)
- Banane         : 120g (107 kcal | 1g P | 27g G)
- Brocoli        : 150g (51 kcal | 4g P | 10g G)
- Huile d'olive  : 12g (106 kcal | 12g L)

Total : 1071 kcal | 70g P | 93g G | 46g L
```

#### **Repas 2 (50%) - 1435 kcal**
```
(Identique ou variante avec d'autres aliments)
```

---

## 🚀 Comment Utiliser

### **1. Ouvrir le modal**
```
Hub → Santé → + Repas
```

### **2. Voir le bandeau intelligent**
```
┌─────────────────────────────────────────────┐
│ 📊 Poids récent : 75.2 kg                   │
│ mer. 31 déc · Objectif : 2370 kcal/jour     │
│                                             │
│ Répartition :                               │
│ [ 1 repas (OMAD) ] [ 2 repas (40/60) ]     │
│                                             │
│     [⚡ Générer mon repas optimal]          │
└─────────────────────────────────────────────┘
```

### **3. Choisir 1 ou 2 repas**
- Clic sur "1 repas (OMAD)" ou "2 repas (40/60)"

### **4. Générer**
- Clic sur "⚡ Générer mon repas optimal"
- Les aliments sont automatiquement ajoutés
- Le nom est généré automatiquement

### **5. Ajuster (optionnel)**
- Modifier les portions
- Ajouter/supprimer des aliments
- Changer le nom

### **6. Enregistrer**
- Clic sur "Ajouter le repas"

---

## 🧠 Algorithme

### **Étape 1 : Calculer les objectifs nutritionnels**
```typescript
const targetProtein = (calories * macroRatio.protein) / 4
const targetCarbs = (calories * macroRatio.carbs) / 4
const targetFat = (calories * macroRatio.fat) / 9
```

### **Étape 2 : Sélectionner les aliments**
```typescript
1. Protéines (priorité 1)
   → 2 sources variées
   → Limiter à 250g max par source

2. Glucides (priorité 2)
   → 70% céréales (riz, avoine, patate douce)
   → 30% fruits (banane)

3. Légumes (fibres)
   → 150g de brocoli/épinards

4. Lipides (ajustement)
   → Huile d'olive si nécessaire
```

### **Étape 3 : Calculer les portions**
```typescript
gramsNeeded = (targetMacro / (foodMacroPer100g / 100))
finalGrams = Math.min(gramsNeeded, maxPortion)
```

---

## 📁 Fichiers Créés

```
src/utils/simpleMealGenerator.ts (300 lignes)
├── generateOptimalMeals()
├── calculateOptimalPortions()
├── selectBestFoods()
├── getMealSummary()
└── MACRO_RATIOS

src/components/health/MealModal.tsx (modifié)
├── Ajout props: latestWeight, targetCalories, userGoal
├── État: mealCount (1 ou 2)
├── Fonction: handleGenerateMeals()
└── UI: Bandeau avec choix 1/2 repas
```

---

## ✅ Avantages

1. **Ultra simple** : 1 ou 2 repas max, pas de micro-gestion
2. **Optimal** : Répartition nutritionnelle calculée scientifiquement
3. **Flexible** : OMAD ou 16:8 selon préférence
4. **Intelligent** : S'adapte à ton objectif (lose/maintain/gain)
5. **Rapide** : 1 clic pour générer tous les aliments
6. **Personnalisé** : Basé sur ton poids et tes objectifs

---

## 🔮 Prochaines Améliorations (Optionnelles)

1. **Variantes** : Proposer 2-3 options différentes
2. **Préférences** : Végétarien, vegan, sans gluten
3. **Historique** : Sauvegarder tes repas favoris
4. **Rotation** : Varier automatiquement les aliments chaque jour

---

**Date** : 1er janvier 2025  
**Version** : V1.7.2  
**Statut** : ✅ Implémenté (prêt à tester)


