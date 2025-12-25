rau# 🧠 Ce que le Brain prend en compte

## 🎯 VISION GLOBALE

Le Brain calcule un **Wellbeing Score de 0 à 100** basé sur **4 piliers égaux** :

```
┌────────────────────────────────────────┐
│     WELLBEING SCORE = 100 points      │
├────────────────────────────────────────┤
│                                        │
│  🎯 Productivité    25 points max     │
│  🍽️ Santé           25 points max     │
│  🧘 Mental          25 points max     │
│  🔄 Constance       25 points max     │
│                                        │
└────────────────────────────────────────┘
```

---

## 1️⃣ **PRODUCTIVITÉ (0-25 points)**

### Ce qui est analysé :

#### **A. Tâches complétées aujourd'hui vs moyenne (0-10 pts)**

```
Si tu as une moyenne de 5 tâches/jour :
- 5 tâches aujourd'hui   → 10 pts (100%)
- 3 tâches aujourd'hui   → 6 pts  (60%)
- 0 tâches aujourd'hui   → 0 pt   (0%)
```

**Événements observés :**
- `task:completed` - Chaque tâche terminée

**Calcul :**
- Compare tes tâches du jour avec `patterns.avgTasksPerDay`
- Si pas de moyenne → 5 pts si au moins 1 tâche

---

#### **B. Temps de focus (Pomodoro) (0-10 pts)**

```
Objectif : 2h de focus par jour (120 minutes)

- 120+ min focus   → 10 pts (objectif atteint!)
- 60 min focus     → 5 pts  (50%)
- 0 min focus      → 0 pt   (0%)
```

**Événements observés :**
- `pomodoro:completed` - Chaque session terminée

**Calcul :**
- Additionne les minutes de toutes les sessions du jour
- Compare à l'objectif de 120 min

---

#### **C. Taux de complétion global (0-5 pts)**

```
Sur 7 derniers jours :
- 80% de complétion   → 4 pts
- 50% de complétion   → 2.5 pts
- 0% de complétion    → 0 pt
```

**Pattern utilisé :**
- `patterns.taskCompletionRate` (tâches complétées / tâches créées)

---

## 2️⃣ **SANTÉ (0-25 points)**

### Ce qui est analysé :

#### **A. Repas enregistrés (0-10 pts)**

```
Aujourd'hui :
- 3+ repas     → 10 pts  ✅
- 2 repas      → 7 pts   👍
- 1 repas      → 4 pts   ⚠️
- 0 repas      → 0 pt    ❌
```

**Événements observés :**
- `meal:added` - Chaque repas enregistré

---

#### **B. Tendance poids (0-5 pts)**

```
Selon la tendance sur 7 jours :
- Stable       → 5 pts  ✅
- Losing       → 5 pts  ✅ (si objectif perte)
- Gaining      → 2 pts  ⚠️
```

**Événements observés :**
- `weight:added` - Chaque pesée

**Pattern utilisé :**
- `patterns.weightTrend` ('stable' | 'losing' | 'gaining')

---

#### **C. Hydratation (0-5 pts)**

```
Aujourd'hui :
- 4+ verres    → 5 pts  ✅
- 2-3 verres   → 3 pts  👍
- 1 verre      → 1 pt   ⚠️
- 0 verre      → 0 pt   ❌
```

**Événements observés :**
- `water:added` - Chaque verre d'eau

---

#### **D. Calories dans la cible (0-5 pts)**

```
Si tu enregistres des calories :
- 2+ repas     → 5 pts  (approximation)
- Moins        → 0 pt
```

**Pattern utilisé :**
- `patterns.avgCaloriesPerDay`

---

## 3️⃣ **MENTAL (0-25 points)**

### Ce qui est analysé :

#### **A. Mood actuel (0-10 pts)**

```
Ton mood du jour (1-10) :
- Mood = 10    → 10 pts  😊
- Mood = 7     → 7 pts   🙂
- Mood = 5     → 5 pts   😐
- Mood = 2     → 2 pts   😔
- Pas de mood  → Moyenne récente (défaut 5)
```

**Événements observés :**
- `mood:set` - Mood défini directement
- `journal:written` (avec mood) - Mood dans le journal

---

#### **B. Journal écrit aujourd'hui (0-5 pts)**

```
- Journal écrit    → 5 pts  ✅
- Pas de journal   → 0 pt   ❌
```

**Événements observés :**
- `journal:written` - Entrée journal créée

---

#### **C. Mood moyen récent (0-5 pts)**

```
Moyenne des 7 derniers jours :
- Mood ≥ 7     → 5 pts  😊
- Mood 5-7     → 3 pts  🙂
- Mood < 5     → 1 pt   😔
```

**Pattern utilisé :**
- `patterns.avgMood`

---

#### **D. Corrélation mood ↔ productivité (0-5 pts)**

```
Le Brain détecte si un bon mood = plus productif :
- Corrélation > 0.3    → 5 pts  (forte relation positive)
- Corrélation > 0      → 2 pts  (faible relation)
- Corrélation ≤ 0      → 0 pt   (pas de relation)
```

**Pattern utilisé :**
- `patterns.correlations.moodProductivity` (Pearson -1 à 1)

---

## 4️⃣ **CONSTANCE (0-25 points)**

### Ce qui est analysé :

#### **A. Habitudes du jour (0-10 pts)**

```
Aujourd'hui :
- 3+ habitudes     → 10 pts  ✅✅✅
- 2 habitudes      → 7 pts   ✅✅
- 1 habitude       → 4 pts   ✅
- 0 habitude       → 0 pt    ❌
```

**Événements observés :**
- `habit:checked` - Chaque habitude cochée

---

#### **B. Taux de complétion habitudes global (0-10 pts)**

```
Sur 7 derniers jours :
- 90% complétées   → 9 pts   ✅
- 50% complétées   → 5 pts   ⚠️
- 0% complétées    → 0 pt    ❌
```

**Pattern utilisé :**
- `patterns.habitCompletionRate`

---

#### **C. Fréquence journal (0-5 pts)**

```
Jours avec journal / semaine :
- 5+ jours     → 5 pts  ✅ (presque quotidien)
- 3-4 jours    → 3 pts  👍
- 1-2 jours    → 1 pt   ⚠️
- 0 jour       → 0 pt   ❌
```

**Pattern utilisé :**
- `patterns.journalFrequency` (jours/semaine)

---

## 📈 **TENDANCE (↑ ↓ →)**

### Comment c'est calculé ?

Le Brain compare ton score actuel avec **il y a 7 jours** :

```
Moyenne 7 derniers jours : 72
Moyenne 7 jours avant    : 64
Différence               : +8

Résultat : ↑ +12% (amélioration)
```

### Seuils :

| Différence | Tendance | Affichage |
|------------|----------|-----------|
| **> +5 pts** | 📈 Improving | ↑ +X% (vert) |
| **-5 à +5** | ➡️ Stable | → (gris) |
| **< -5 pts** | 📉 Declining | ↓ -X% (rouge) |

---

## 🎯 **RÉSUMÉ : TOUT CE QUI COMPTE**

### **Événements observés (18 types)**

| Catégorie | Événements | Impact sur score |
|-----------|------------|------------------|
| **Tâches** | created, completed, deleted, moved | Productivité |
| **Pomodoro** | completed, interrupted | Productivité |
| **Santé** | weight, meal, water | Santé |
| **Mental** | journal, mood | Mental |
| **Habitudes** | checked, unchecked | Constance |
| **Lecture** | book started/finished, session | (stats uniquement) |
| **Apprentissage** | course, message | (stats uniquement) |

### **Patterns calculés (8 métriques)**

| Pattern | Période | Impact |
|---------|---------|--------|
| `avgTasksPerDay` | 7 jours | Productivité |
| `avgFocusDuration` | 7 jours | Productivité |
| `taskCompletionRate` | 7 jours | Productivité |
| `avgCaloriesPerDay` | 7 jours | Santé |
| `weightTrend` | 7 jours | Santé |
| `avgMood` | 7 jours | Mental |
| `journalFrequency` | 7 jours | Mental + Constance |
| `habitCompletionRate` | 7 jours | Constance |
| `moodProductivity` (corrélation) | 7 jours | Mental |

---

## 💡 **EXEMPLES CONCRETS**

### **Score élevé (75+)**

```
Journée type :
✅ 4 tâches complétées
✅ 90 min de focus (Pomodoro)
✅ 3 repas + 4 verres d'eau
✅ Journal écrit avec mood = 8
✅ 3 habitudes cochées

Résultat :
- Productivité : 20/25
- Santé        : 20/25
- Mental       : 18/25
- Constance    : 17/25
TOTAL          : 75/100 ✨
```

---

### **Score moyen (40-60)**

```
Journée type :
⚠️ 2 tâches complétées
⚠️ 25 min de focus
⚠️ 2 repas, pas d'eau
⚠️ Pas de journal, mood 6
⚠️ 1 habitude cochée

Résultat :
- Productivité : 10/25
- Santé        : 12/25
- Mental       : 11/25
- Constance    : 9/25
TOTAL          : 42/100 ⚠️
```

---

### **Score faible (0-20)**

```
Journée type :
❌ 0 tâches
❌ 0 focus
❌ 0 repas enregistrés
❌ Pas de journal
❌ 0 habitudes

Résultat :
- Productivité : 0/25
- Santé        : 2/25 (tendance poids stable)
- Mental       : 5/25 (moyenne récente)
- Constance    : 0/25
TOTAL          : 7/100 ❌
```

---

## 🔄 **MISE À JOUR AUTOMATIQUE**

Le Brain recalcule tout **automatiquement** :

| Quoi | Quand | Fréquence |
|------|-------|-----------|
| **Événements** | Immédiatement après action | Temps réel |
| **Patterns** | Si cache expiré | 1 minute |
| **Score** | Avec nouveaux patterns | 1 minute |
| **Analyse complète** | En arrière-plan | 5 minutes |
| **Historique** | Sauvegarde du score du jour | 5 minutes |

---

## 🎯 **EN RÉSUMÉ**

Le Brain prend en compte **TOUTE ta journée** :

1. ✅ **Ce que tu fais** (tâches, focus)
2. ✅ **Comment tu te nourris** (repas, eau, poids)
3. ✅ **Comment tu te sens** (mood, journal)
4. ✅ **Tes bonnes habitudes** (régularité)

Et compare avec **tes propres moyennes** pour détecter :
- Si tu es au-dessus ou en-dessous de tes performances habituelles
- Si tu t'améliores ou déclines sur 7 jours
- Quels sont tes patterns de comportement

**C'est un miroir intelligent de ton bien-être global ! 🪞✨**

