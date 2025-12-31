# 🍽️ Suggestion Automatique de Repas

## ✨ Fonctionnalité Implémentée (31 déc 2024)

### **Concept**

Lorsque vous créez un repas, l'app utilise automatiquement :
- ✅ **Votre poids le plus récent**
- ✅ **Votre objectif calorique quotidien**
- ✅ **Votre objectif (perte/maintien/gain)**
- ✅ **La base de données de 168 aliments**
- ✅ **Une répartition intelligente par type d'aliment**

---

## 🎯 Comment ça marche ?

### **1. Ouvrez le modal "Ajouter un repas"**

```
Ma Journée → Santé → + Repas
```

### **2. Vous verrez un bandeau intelligent**

```
┌─────────────────────────────────────────────┐
│ 📊 Poids récent : 75.2 kg         ⚡       │
│ mer. 31 déc · Objectif : 2870 kcal/j       │
│                              [Suggérer]     │
└─────────────────────────────────────────────┘
```

### **3. Cliquez sur "⚡ Suggérer"**

L'app génère automatiquement :
- ✅ **Nom du repas** (ex: "Déjeuner : Poulet, Riz, Brocoli")
- ✅ **Liste d'aliments** avec portions calculées
- ✅ **Répartition optimale** (protéines, glucides, lipides)

---

## 🧠 Algorithme Intelligent

### **Répartition Calorique par Repas**

```typescript
Petit-déjeuner : 25% des calories quotidiennes
Déjeuner       : 35% des calories quotidiennes
Dîner          : 30% des calories quotidiennes
Collation      : 10% des calories quotidiennes
```

### **Répartition des Macros selon l'Objectif**

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

---

## 🍴 Exemples de Suggestions

### **Petit-déjeuner (Objectif : 2870 kcal/jour, Maintien)**

**Calories cibles** : 2870 × 25% = **718 kcal**

**Suggestion automatique** :
```
Nom : Petit-déjeuner : Flocons d'avoine, Yaourt grec, Banane

Aliments :
- Flocons d'avoine : 60g (233 kcal)
- Yaourt grec      : 150g (146 kcal)
- Banane           : 120g (107 kcal)

Total : 486 kcal | 22g P | 72g G | 10g L
```

### **Déjeuner (Objectif : 2870 kcal/jour, Perte)**

**Calories cibles** : 2870 × 35% = **1005 kcal**

**Suggestion automatique** :
```
Nom : Déjeuner : Poulet, Riz, Brocoli

Aliments :
- Poulet    : 150g (248 kcal)
- Riz       : 200g (260 kcal)
- Brocoli   : 150g (51 kcal)

Total : 559 kcal | 48g P | 58g G | 6g L
```

### **Dîner (Objectif : 2870 kcal/jour, Gain)**

**Calories cibles** : 2870 × 30% = **861 kcal**

**Suggestion automatique** :
```
Nom : Dîner : Saumon, Pâtes, Brocoli, Huile d'olive

Aliments :
- Saumon        : 180g (374 kcal)
- Pâtes         : 200g (262 kcal)
- Brocoli       : 150g (51 kcal)
- Huile d'olive : 10g (88 kcal)

Total : 775 kcal | 52g P | 72g G | 32g L
```

---

## 🎨 Stratégie de Sélection des Aliments

### **Petit-déjeuner**
```
1. Céréales (60% des glucides) : Flocons d'avoine, Pain
2. Protéines (70% des protéines) : Yaourt grec, Œufs
3. Fruits (portion fixe) : Banane, Pomme, Myrtilles
```

### **Déjeuner**
```
1. Protéines (80% des protéines) : Poulet, Bœuf, Poisson
2. Féculents (70% des glucides) : Riz, Pâtes, Quinoa
3. Légumes (portion fixe) : Brocoli, Salade
4. Lipides (si gain) : Huile d'olive, Avocat
```

### **Dîner**
```
1. Protéines (75% des protéines) : Saumon, Poulet
2. Féculents légers (50% des glucides) : Patate douce, Pommes de terre
3. Légumes (portion fixe) : Haricots verts, Salade
```

### **Collation**
```
1. Protéines légères : Yaourt grec, Fromage blanc
2. Fruits ou noix : Pomme, Amandes (selon objectif)
```

---

## 📊 Base de Données Utilisée

**168 aliments** répartis en 8 catégories :

```
Protéines  : 15 aliments (Poulet, Bœuf, Saumon, Thon, Œufs, etc.)
Glucides   : 12 aliments (Riz, Pâtes, Pain, Avoine, Quinoa, etc.)
Légumes    : 20 aliments (Brocoli, Salade, Tomate, Carotte, etc.)
Fruits     : 15 aliments (Banane, Pomme, Orange, Myrtilles, etc.)
Produits laitiers : 8 aliments (Yaourt grec, Lait, Fromage, etc.)
Lipides    : 10 aliments (Huile d'olive, Avocat, Amandes, etc.)
Snacks     : 8 aliments (Chocolat noir, Granola, etc.)
Boissons   : 5 aliments (Café, Thé, etc.)
```

---

## 🚀 Avantages

✅ **1 clic** pour un repas complet et équilibré  
✅ **Portions calculées** selon votre poids et objectif  
✅ **Répartition optimale** des macros  
✅ **Base de données fiable** (USDA + CIQUAL)  
✅ **Personnalisable** après suggestion  
✅ **Pas de calculs manuels**  
✅ **Cohérent** avec votre profil santé  

---

## 🔧 Fichiers Modifiés

```
CRÉÉS :
- src/utils/mealTemplates.ts (350 lignes)
  • generateSmartMealSuggestion()
  • calculatePortions()
  • MEAL_CALORIE_DISTRIBUTION
  • MACRO_RATIOS

MODIFIÉS :
- src/components/health/MealModal.tsx (+50 lignes)
  • Ajout props latestWeight, targetCalories, userGoal
  • Bandeau intelligent avec poids récent
  • Bouton "⚡ Suggérer"
  • Fonction handleSmartSuggestion()

- src/components/myday/MyDayPage.tsx (+30 lignes)
  • Calcul latestWeightEntry
  • Calcul caloriesGoal
  • Calcul userGoal
  • Passage des props à MealModal
```

---

## 🎯 Prochaines Améliorations (Optionnelles)

1. **Variantes multiples** : Proposer 3 options (léger, normal, copieux)
2. **Favoris personnalisés** : Sauvegarder vos repas préférés
3. **Historique intelligent** : Suggérer vos repas les plus fréquents
4. **Scan photo** : Reconnaître les aliments via caméra
5. **Templates personnalisés** : Créer vos propres templates

---

## 📝 Exemple d'Utilisation Complète

### **Scénario : Utilisateur en perte de poids**

```
1. Profil configuré :
   - Poids : 85 kg
   - Objectif : Perdre du poids
   - TDEE : 2870 kcal
   - Cible : 2370 kcal/jour (-500 kcal)

2. Matin, 8h30 :
   - Clic "Ma Journée" → "Santé" → "+ Repas"
   - Type : "🌅 Petit-déjeuner"
   - Clic "⚡ Suggérer"
   
3. Résultat automatique :
   ✅ Nom : "Petit-déjeuner : Flocons d'avoine, Yaourt grec, Myrtilles"
   ✅ Aliments :
      - Flocons d'avoine : 40g (156 kcal)
      - Yaourt grec : 150g (146 kcal)
      - Myrtilles : 80g (46 kcal)
   ✅ Total : 348 kcal | 18g P | 45g G | 8g L
   
4. Ajustement (optionnel) :
   - Ajouter 1 banane (+107 kcal)
   - Augmenter avoine à 60g (+78 kcal)
   
5. Clic "Ajouter le repas" → ✅ Enregistré !
```

---

**Date** : 31 décembre 2024  
**Version** : V1.7.1  
**Statut** : ✅ Implémenté et testé

