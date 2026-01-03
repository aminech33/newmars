# 🍅 Métriques Pomodoro dans MyDay

## 📊 Nouvelle section ajoutée

Une nouvelle card **Pomodoro** a été ajoutée dans la colonne de droite de MyDay (onglet Journal), juste sous la card "Tâches".

### Position
```
MyDay → Onglet Journal → Colonne droite
├── Card Tâches
├── Card Pomodoro ✨ NOUVEAU
├── Card Habitudes
└── Card Journal
```

---

## 📈 Trois métriques affichées

### 1️⃣ **Volume**
→ **Nombre de tâches terminées aujourd'hui**

Affiche simplement le nombre de tâches clôturées dans la journée.

**Exemple** : `Volume : 3 tâches terminées`

---

### 2️⃣ **Qualité du focus**
→ **Au moins une tâche a été menée avec ≥ 30 min de focus continu ET clôturée**

**Critères** :
- ✅ **Focus de qualité** (vert) : Au moins une tâche terminée aujourd'hui a une session Pomodoro ≥ 30 minutes (non interrompue)
- ⚠️ **Focus fragmenté** (ambre) : Aucune tâche avec session longue

**Logique** :
- Parcourt toutes les tâches terminées aujourd'hui
- Pour chaque tâche, vérifie s'il existe une session Pomodoro :
  - De type `focus`
  - Non interrompue (`interrupted: false`)
  - D'une durée ≥ 30 minutes
  - Datée d'aujourd'hui

**Exemple** : `Focus : Focus de qualité`

---

### 3️⃣ **Tendance (temps long)**
→ **Évolution du rythme de clôture sur 14 jours**

**Calcul** :
- Compare le nombre de tâches terminées cette semaine (7 derniers jours) vs la semaine précédente (jours 8 à 14)
- Si cette semaine < 90% de la semaine dernière → **en baisse** (ambre)
- Sinon → **stable** (blanc)

**Exemple** : `Tendance : stable`

---

## 🧩 Architecture technique

### Fichiers créés/modifiés

**Nouveau fichier** :
- `src/utils/pomodoroMetrics.ts` : fonction `calculatePomodoroMetrics()`

**Fichiers modifiés** :
- `src/components/myday/MyDayPage.tsx` :
  - Import de `calculatePomodoroMetrics`
  - Accès au store `pomodoroSessions`
  - Calcul des métriques
  - Ajout de la card Pomodoro dans la colonne de droite
  - Import de l'icône `Timer`

### Interface retournée

```typescript
export interface PomodoroMetrics {
  todayVolume: number // Nombre de tâches terminées aujourd'hui
  hasQualityFocus: boolean // Au moins une tâche avec ≥30min de focus continu ET clôturée
  trend14d: 'stable' | 'en baisse' // Tendance sur 14 jours
}
```

### Fonction principale

```typescript
export function calculatePomodoroMetrics(
  pomodoroSessions: PomodoroSession[],
  tasks: Task[]
): PomodoroMetrics
```

**Paramètres** :
- `pomodoroSessions` : toutes les sessions Pomodoro enregistrées
- `tasks` : toutes les tâches

**Logique** :
1. Filtre les tâches terminées aujourd'hui
2. Pour chaque tâche, cherche les sessions Pomodoro associées
3. Vérifie si au moins une session ≥ 30 min existe
4. Compare le volume de tâches sur 14 jours

---

## 🎨 Design

La card Pomodoro suit le même design que les autres cards de la colonne droite :
- Fond : `bg-zinc-900/50`
- Bordure : `border-zinc-800/50`
- Icône : Timer (orange)
- 3 lignes de métriques compactes

**Couleurs** :
- Volume : texte blanc
- Focus de qualité : vert (`text-emerald-400`)
- Focus fragmenté : ambre (`text-amber-400`)
- Tendance stable : blanc
- Tendance en baisse : ambre

---

## 🚀 Utilisation

Les métriques se mettent à jour automatiquement :
- Chaque fois qu'une tâche est terminée
- Chaque fois qu'une session Pomodoro est complétée
- Au changement de jour

**Aucune action utilisateur requise** : les calculs sont automatiques et en temps réel.

---

## 📍 Accès

**Chemin** : MyDay → Onglet Journal → Colonne de droite (sous "Tâches")

---

✅ **Intégration complète et fonctionnelle !**






