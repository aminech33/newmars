# 📖 Système de Journal - Documentation Complète

## 🎯 Vue d'ensemble

Le **système de Journal** est une fonctionnalité de réflexion quotidienne et de bien-être mental intégrée à newmars. Il permet aux utilisateurs de tenir un journal personnel avec suivi de l'humeur, gratitude, objectifs et réflexions.

---

## ✨ Fonctionnalités

### 1. **Entrée Quotidienne**
- ✅ **Date automatique** : Chaque entrée est datée automatiquement
- ✅ **Mood Tracker** : Sélection d'humeur avec emojis (😢 😐 🙂 😊 🤩)
- ✅ **Objectif principal** : Définir l'objectif du jour
- ✅ **Gratitude** : 3 choses pour lesquelles vous êtes reconnaissant
- ✅ **Réflexion libre** : Texte libre avec support Markdown
- ✅ **Apprentissage** : Ce que vous avez appris aujourd'hui
- ✅ **Victoire du jour** : Quelque chose dont vous êtes fier

### 2. **Suivi de l'Humeur**
- 📊 **Échelle 1-10** : Mood level précis
- 😊 **Emojis visuels** : Représentation visuelle de l'humeur
- 📈 **Graphique 7 jours** : Visualisation de l'évolution de l'humeur
- 📊 **Humeur moyenne** : Calcul automatique sur toutes les entrées

### 3. **Streaks & Motivation**
- 🔥 **Streak actuel** : Nombre de jours consécutifs d'écriture
- 🏆 **Record personnel** : Plus long streak atteint
- 📊 **Statistiques** : Total entrées, entrées ce mois, cette année

### 4. **Historique**
- 📅 **Navigation par mois/année** : Filtrage facile
- ⭐ **Favoris** : Marquer les entrées importantes
- 🔍 **Affichage complet** : Toutes les sections d'une entrée
- 🗑️ **Suppression** : Gérer vos entrées

### 5. **Widget Hub**
- 📱 **3 tailles** : Small, Medium, Large
- 🔥 **Streak visible** : Motivation constante
- 📊 **Stats rapides** : Aperçu de votre activité
- 📈 **Graphique humeur** : Tendance des 7 derniers jours

---

## 🏗️ Architecture Technique

### Types (`src/types/journal.ts`)

```typescript
export type MoodLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
export type MoodEmoji = '😢' | '😐' | '🙂' | '😊' | '🤩'

export interface JournalEntry {
  id: string
  date: string // YYYY-MM-DD
  mood?: MoodLevel
  moodEmoji?: MoodEmoji
  mainGoal?: string
  gratitude?: string[]
  reflection: string
  learned?: string
  victory?: string
  photos?: string[]
  tags?: string[]
  isFavorite?: boolean
  createdAt: number
  updatedAt: number
}

export interface JournalStats {
  totalEntries: number
  currentStreak: number
  longestStreak: number
  averageMood: number
  entriesThisMonth: number
  entriesThisYear: number
}
```

### Store Zustand

**État :**
```typescript
journalEntries: JournalEntry[]
```

**Actions :**
```typescript
addJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): void
updateJournalEntry(id: string, updates: Partial<JournalEntry>): void
deleteJournalEntry(id: string): void
toggleJournalFavorite(id: string): void
```

### Utilitaires (`src/utils/journalUtils.ts`)

- `moodLevelToEmoji(level: number): MoodEmoji` - Convertir niveau en emoji
- `moodEmojiToLevel(emoji: MoodEmoji): number` - Convertir emoji en niveau
- `calculateJournalStreak(entries: JournalEntry[]): number` - Calculer streak actuel
- `calculateLongestStreak(entries: JournalEntry[]): number` - Plus long streak
- `calculateAverageMood(entries: JournalEntry[]): number` - Humeur moyenne
- `calculateJournalStats(entries: JournalEntry[]): JournalStats` - Stats complètes
- `getTodayEntry(entries: JournalEntry[]): JournalEntry | undefined` - Entrée du jour
- `getEntriesByMonth(entries: JournalEntry[], year: number, month: number): JournalEntry[]` - Filtrer par mois
- `getMemoryFromYearsAgo(entries: JournalEntry[], yearsAgo: number): JournalEntry | undefined` - Souvenirs
- `formatRelativeDate(dateStr: string): string` - Format "Il y a X jours"

### Composants

**`JournalPage.tsx`** - Page principale
- Onglets "Aujourd'hui" et "Historique"
- Formulaire d'entrée quotidienne
- Sidebar avec statistiques
- Graphique humeur 7 jours

**`JournalWidget.tsx`** - Widget pour le Hub
- 3 tailles (small, medium, large)
- Affichage entrée du jour
- Streak et statistiques
- Navigation vers JournalPage

---

## 🎨 Design

### Palette de Couleurs
- **Emerald** (`emerald-400/500`) : Réflexion, bien-être
- **Rose** (`rose-400/500`) : Gratitude
- **Indigo** (`indigo-400/500`) : Objectifs
- **Amber** (`amber-400/500`) : Apprentissage
- **Yellow** (`yellow-400/500`) : Victoires
- **Orange** (`orange-400/500`) : Streak

### Iconographie
- 📖 `BookOpen` : Journal général
- 😊 `Smile` : Humeur
- 🎯 `Target` : Objectifs
- ❤️ `Heart` : Gratitude
- 💡 `Lightbulb` : Apprentissage
- 🏆 `Trophy` : Victoires
- 📈 `TrendingUp` : Graphiques
- ⭐ `Star` : Favoris
- 🔥 Emoji : Streak

---

## 📊 Algorithmes Clés

### Calcul du Streak

```typescript
export const calculateJournalStreak = (entries: JournalEntry[]): number => {
  if (entries.length === 0) return 0

  const sortedDates = [...new Set(entries.map(e => e.date))].sort().reverse()
  const today = new Date().toISOString().split('T')[0]

  let streak = 0
  let currentDate = new Date(today)

  for (const date of sortedDates) {
    const entryDate = new Date(date)
    const diffDays = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === streak) {
      streak++
    } else if (diffDays > streak) {
      break
    }
  }

  return streak
}
```

**Logique :**
1. Trier les dates uniques par ordre décroissant
2. Partir d'aujourd'hui
3. Vérifier si chaque jour consécutif a une entrée
4. S'arrêter dès qu'un jour manque

### Conversion Mood

```typescript
export const moodLevelToEmoji = (level: number): MoodEmoji => {
  if (level <= 2) return '😢'
  if (level <= 4) return '😐'
  if (level <= 6) return '🙂'
  if (level <= 8) return '😊'
  return '🤩'
}
```

**Échelle :**
- 1-2 : 😢 (Très bas)
- 3-4 : 😐 (Bas)
- 5-6 : 🙂 (Neutre)
- 7-8 : 😊 (Bien)
- 9-10 : 🤩 (Excellent)

---

## 🚀 Utilisation

### Créer une Entrée

```typescript
const { addJournalEntry } = useStore()

addJournalEntry({
  date: '2024-11-30',
  mood: 8,
  moodEmoji: '😊',
  mainGoal: 'Finir le système de journal',
  gratitude: ['Ma santé', 'Mon équipe', 'Ce projet'],
  reflection: 'Aujourd\'hui j\'ai beaucoup avancé sur newmars...',
  learned: 'Comment implémenter un système de journal',
  victory: 'Terminé le système de journal !'
})
```

### Obtenir les Stats

```typescript
import { calculateJournalStats } from '../utils/journalUtils'

const { journalEntries } = useStore()
const stats = calculateJournalStats(journalEntries)

console.log(`Streak actuel: ${stats.currentStreak} jours`)
console.log(`Humeur moyenne: ${stats.averageMood}/10`)
```

### Filtrer par Mois

```typescript
import { getEntriesByMonth } from '../utils/journalUtils'

const novemberEntries = getEntriesByMonth(journalEntries, 2024, 10) // month is 0-indexed
```

---

## 🎯 Cas d'Usage

### 1. **Réflexion Quotidienne**
- Prendre 5-10 minutes chaque soir
- Noter les événements importants
- Identifier les patterns d'humeur

### 2. **Gratitude Practice**
- Cultiver la reconnaissance
- Améliorer le bien-être mental
- Perspective positive

### 3. **Suivi d'Objectifs**
- Définir un objectif par jour
- Mesurer la progression
- Célébrer les victoires

### 4. **Apprentissage Continu**
- Documenter ce que vous apprenez
- Créer une base de connaissances personnelle
- Réviser régulièrement

### 5. **Analyse de Patterns**
- Identifier les jours productifs
- Comprendre les cycles d'humeur
- Ajuster les habitudes

---

## 📈 Métriques & Analytics

### Statistiques Disponibles

1. **Total Entrées** : Nombre total d'entrées créées
2. **Streak Actuel** : Jours consécutifs d'écriture
3. **Plus Long Streak** : Record personnel
4. **Humeur Moyenne** : Moyenne de tous les moods
5. **Entrées ce Mois** : Activité mensuelle
6. **Entrées cette Année** : Activité annuelle

### Graphique Humeur

- **Type** : Bar chart
- **Période** : 7 derniers jours
- **Données** : Mood level (1-10)
- **Couleur** : Gradient emerald

---

## 🔮 Améliorations Futures

### Court Terme
- [ ] **Export PDF** : Exporter le journal en PDF
- [ ] **Recherche** : Rechercher dans les entrées
- [ ] **Tags** : Catégoriser les entrées
- [ ] **Photos** : Ajouter des photos du jour

### Moyen Terme
- [ ] **Templates** : Templates de prompts personnalisés
- [ ] **Rappels** : Notification pour écrire
- [ ] **Insights IA** : Analyse des patterns par IA
- [ ] **Vue Calendrier** : Visualiser les entrées sur un calendrier

### Long Terme
- [ ] **Partage** : Partager certaines entrées
- [ ] **Communauté** : Prompts communautaires
- [ ] **Intégration** : Sync avec autres apps de bien-être
- [ ] **Voice Input** : Dicter ses entrées

---

## 🎓 Bonnes Pratiques

### Pour les Utilisateurs

1. **Régularité** : Écrire à la même heure chaque jour
2. **Honnêteté** : Être authentique dans ses réflexions
3. **Brevité** : Pas besoin d'écrire un roman
4. **Gratitude** : Se concentrer sur le positif
5. **Révision** : Relire régulièrement les anciennes entrées

### Pour les Développeurs

1. **Persistence** : Toutes les entrées sont sauvegardées dans localStorage
2. **Performance** : Utiliser `useMemo` pour les calculs de stats
3. **UX** : Auto-save au lieu de bouton "Sauvegarder"
4. **Privacy** : Données 100% locales, jamais envoyées au serveur
5. **Accessibilité** : Support clavier complet

---

## 🐛 Troubleshooting

### Problème : Streak ne s'incrémente pas
**Solution** : Vérifier que la date de l'entrée est bien aujourd'hui

### Problème : Graphique humeur vide
**Solution** : Ajouter au moins une entrée avec un mood

### Problème : Entrées disparues
**Solution** : Vérifier localStorage, possiblement vidé par le navigateur

---

## 📝 Changelog

### v1.0.0 (30 Nov 2024)
- ✅ Système de journal complet
- ✅ Mood tracker avec emojis
- ✅ Streak calculation
- ✅ Historique avec filtres
- ✅ Widget Hub (3 tailles)
- ✅ Statistiques complètes
- ✅ Graphique humeur 7 jours
- ✅ Favoris
- ✅ Persistence localStorage

---

## 🎉 Conclusion

Le système de Journal de newmars offre une expérience complète de réflexion quotidienne et de suivi de bien-être mental. Avec son design minimaliste, ses fonctionnalités intelligentes et son intégration parfaite dans l'écosystème newmars, c'est l'outil idéal pour cultiver la gratitude, suivre son humeur et documenter son parcours personnel.

**Commencez dès aujourd'hui votre pratique de journaling ! 📖✨**


