# 📊 Où sont affichées les métriques du Brain ?

## 🎯 RÉSUMÉ RAPIDE

Les données du Brain sont affichées dans **2 endroits principaux** de l'application :

1. **🏠 Page Hub (HubV2)** - Score principal bien visible
2. **📱 Widgets Smart** - Pour des vues détaillées (si utilisés)

---

## 1️⃣ **PAGE HUB (Principal) 🏠**

**Fichier :** `src/components/HubV2.tsx`  
**Quand tu le vois :** Dès que tu ouvres l'app (page d'accueil)

### Ce qui est affiché :

```
┌─────────────────────────────────────┐
│     Mercredi 24 décembre 2024      │
│                                     │
│      Bonjour, [Ton nom]            │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🧠 Bien-être         72  ↑+12%│ │ ← BRAIN ICI !
│  └───────────────────────────────┘ │
│                                     │
│         • Tâches                   │
│         • Ma journée               │
│         • Apprentissage            │
│         • Bibliothèque             │
│         • Paramètres               │
└─────────────────────────────────────┘
```

### Métriques affichées :

| Métrique | Description | Exemple |
|----------|-------------|---------|
| **Score global** | Nombre de 0 à 100 | `72` |
| **Tendance** | Flèche + pourcentage | `↑ +12%` (amélioration) |
| | | `↓ -8%` (déclin) |
| | | `→` (stable) |

### Code concerné :

```typescript
// Ligne 22
const { wellbeing } = useBrain()

// Lignes 55-63 - Affichage
<span className="text-2xl font-bold">{wellbeing.overall}</span>
{wellbeing.trend === 'improving' && `+${wellbeing.trendPercent}%`}
```

### Couleurs selon tendance :

- **Vert** (`text-emerald-400`) = En amélioration ↗️
- **Rouge** (`text-rose-400`) = En déclin ↘️  
- **Gris** (`text-zinc-500`) = Stable →

---

## 2️⃣ **WIDGETS SMART (Si activés) 📱**

### A. **WellbeingWidget**

**Fichier :** `src/components/widgets/smart/WellbeingWidget.tsx`

```
┌───────────────┐
│  Bien-être    │
│               │
│     72        │ ← Score
│               │
│  ↑ +12%       │ ← Tendance
└───────────────┘
```

**Métriques :**
- Score global (0-100)
- Tendance en % vs semaine dernière
- Couleur adaptative selon le score :
  - **≥ 70** : Vert (emerald) 🟢
  - **50-69** : Gris (zinc) ⚪
  - **30-49** : Ambre (amber) 🟠
  - **< 30** : Violet 🟣

### B. **ProductivityWidget**

**Fichier :** `src/components/widgets/smart/ProductivityWidget.tsx`

```
┌───────────────────┐
│  Aujourd'hui      │
│                   │
│   3 tâches        │ ← Tâches du jour
│                   │
│  +0.5 vs moyenne  │ ← Comparaison avec patterns
└───────────────────┘
```

**Métriques :**
- Nombre de tâches complétées aujourd'hui
- Comparaison avec `patterns.avgTasksPerDay` du Brain
- Couleur selon performance :
  - **≥ 120%** de la moyenne : Vert 🟢
  - **80-119%** : Gris ⚪
  - **< 80%** : Ambre 🟠

---

## 📊 **DÉTAIL DES MÉTRIQUES BRAIN UTILISÉES**

### Dans HubV2 :

| Source Brain | Propriété | Utilisation |
|--------------|-----------|-------------|
| `wellbeing.overall` | Score 0-100 | Nombre affiché en gros |
| `wellbeing.trend` | 'improving' / 'declining' / 'stable' | Couleur de la tendance |
| `wellbeing.trendPercent` | Nombre (%) | Pourcentage d'évolution |

### Dans ProductivityWidget :

| Source Brain | Propriété | Utilisation |
|--------------|-----------|-------------|
| `patterns.avgTasksPerDay` | Nombre (ex: 3.5) | Comparaison avec aujourd'hui |

---

## 🔍 **OÙ SONT STOCKÉES LES DONNÉES ?**

### LocalStorage
```
Clé: 'iku-brain-memory'

Contenu:
{
  "recentEvents": [...],        ← Tous les événements (7 jours)
  "patterns": {                 ← Patterns calculés
    "avgTasksPerDay": 3.5,
    "avgFocusDuration": 25,
    "taskCompletionRate": 0.8,
    "avgMood": 7.2,
    ...
  },
  "scoreHistory": [             ← Historique 30 jours
    {"date": "2024-12-24", "score": 72}
  ],
  "lastFullAnalysis": 1703445123456,
  "version": 2
}
```

### Comment voir les données ?

**Dans le navigateur :**

1. Ouvre l'app : http://localhost:5173/
2. Ouvre DevTools (F12)
3. Va dans **Application** → **Local Storage**
4. Clique sur `http://localhost:5173`
5. Cherche `iku-brain-memory`
6. Clique dessus pour voir le JSON

**Ou dans la console :**

```javascript
// Voir toutes les données
JSON.parse(localStorage.getItem('iku-brain-memory'))

// Voir juste le score
JSON.parse(localStorage.getItem('iku-brain-memory')).wellbeing

// Voir les patterns
JSON.parse(localStorage.getItem('iku-brain-memory')).patterns

// Voir les derniers événements
JSON.parse(localStorage.getItem('iku-brain-memory')).recentEvents.slice(-5)
```

---

## 🎨 **COMMENT LE SCORE ÉVOLUE ?**

### Score de base (0-100)

Le score est composé de **4 piliers** égaux :

```
┌─────────────────────────────────────┐
│  WELLBEING SCORE = 100 points      │
├─────────────────────────────────────┤
│                                     │
│  Productivité    ████████    18/25 │
│  Santé          ████████    15/25 │
│  Mental         ██████████   22/25 │
│  Constance      ████████    17/25 │
│                                     │
│  TOTAL:                      72/100│
└─────────────────────────────────────┘
```

### Tendance (vs 7 jours avant)

- **Amélioration** si score actuel > +5 points vs avant
- **Déclin** si score actuel < -5 points vs avant  
- **Stable** sinon

---

## 🎯 **POUR TESTER L'AFFICHAGE**

1. **Lance l'app** : http://localhost:5173/
2. **Va sur le Hub** (page d'accueil)
3. **Tu devrais voir** :
   - Le score de bien-être (ex: `72`)
   - La tendance (ex: `↑ +12%` ou `→`)
   
4. **Si le score est à 0 ou faible** :
   - Utilise l'app (crée tâches, habitudes, etc.)
   - Attends 5 minutes pour la première analyse
   - Ou force un rafraîchissement en changeant de page

---

## 📈 **ÉVOLUTION EN TEMPS RÉEL**

Le Brain met à jour automatiquement :

- ✅ **Événements** : Instantanément après chaque action
- ✅ **Patterns** : Recalculés si cache expiré (1 minute)
- ✅ **Score** : Recalculé avec les patterns actuels
- ✅ **Analyse complète** : Toutes les 5 minutes en arrière-plan

---

## 🎉 **EN RÉSUMÉ**

### Où voir les métriques Brain :

1. **🏠 Page Hub** → Score principal + tendance (toujours visible)
2. **📱 ProductivityWidget** → Comparaison tâches vs moyenne
3. **💾 localStorage** → Toutes les données brutes

### Métriques affichées :

- ✅ **Score global** (0-100)
- ✅ **Tendance** (↑ / ↓ / →)
- ✅ **Pourcentage** d'évolution
- ✅ **Comparaison** avec moyennes

### Mise à jour :

- ⚡ **Instantané** : Événements
- 🕐 **1 minute** : Patterns (cache)
- 🕐 **5 minutes** : Analyse complète + score

---

**Le Brain est actif et visible sur le Hub ! 🚀**








