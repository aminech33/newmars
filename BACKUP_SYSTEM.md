# 💾 SYSTÈME DE SAUVEGARDE NEWMARS

## ✅ STATUT : COMPLET ET FONCTIONNEL

---

## 🏗️ ARCHITECTURE

### 1. **ZUSTAND PERSIST** (Sauvegarde automatique en temps réel)

**Fichier** : `src/store/useStore.ts`

**Ce qui est sauvegardé** :
```typescript
{
  // User & Theme
  userName,
  accentTheme,
  
  // Tasks & Projects
  tasks,
  projects,
  customCategories,
  taskRelations,
  taskQuota,
  
  // Notes & Widgets
  notes,
  widgets,
  layouts,
  quickNotes,
  quickLinks,
  
  // Stats
  focusMinutes,
  dailyGoal,
  pomodoroSessions,
  dailyStats,
  
  // Health
  userProfile,
  weightEntries,
  mealEntries,
  exerciseEntries,
  hydrationEntries,
  healthGoals,
  
  // Journal & Habits
  journalEntries,
  habits,
  
  // Learning (Programmation)
  learningCourses,
  
  // Languages (Nouveau ✅)
  languageCourses,
  
  // Library
  books,
  readingSessions,
  readingGoal,
}
```

**Localisation** : `localStorage` sous la clé `newmars-storage`

**Fréquence** : **Instantanée** (à chaque modification)

**Version** : `STORE_VERSION = 2`

---

### 2. **AUTO BACKUP** (Backup quotidien complet)

**Fichier** : `src/utils/autoBackup.ts`

**Hook** : `useAutoBackup()` appelé dans `App.tsx`

**Ce qui est sauvegardé** :
```typescript
{
  version: '1.3.0',
  date: ISO timestamp,
  timestamp: Unix timestamp,
  data: {
    // Tasks
    tasks,
    projects,
    customCategories,
    taskQuota,
    
    // Health
    userProfile,
    weightEntries,
    mealEntries,
    exerciseEntries,
    hydrationEntries,
    healthGoals,
    
    // Journal
    journalEntries,
    habits,
    
    // Learning
    learningCourses,
    
    // Languages (Nouveau ✅)
    languageCourses,
    
    // Library
    books,
    readingSessions,
    readingGoal,
    
    // UI State (optionnel)
    currentView,
    focusMode,
    widgets,
  },
  size: bytes
}
```

**Localisation** : `localStorage` sous les clés `newmars_backup_<timestamp>`

**Fréquence** : **Toutes les 24h** (vérifié au démarrage + au focus)

**Rétention** : **7 derniers backups** (les plus anciens sont supprimés)

---

## 🔄 FLUX DE SAUVEGARDE

### Sauvegarde automatique (Zustand Persist) :
```
Action utilisateur
    ↓
Store mis à jour
    ↓
Middleware Persist détecte le changement
    ↓
Sauvegarde INSTANTANÉE dans localStorage
```

### Backup quotidien (Auto Backup) :
```
App démarre OU regagne le focus
    ↓
Vérifie dernière date de backup
    ↓
Si > 24h → Crée un nouveau backup
    ↓
Nettoie les vieux backups (garde les 7 derniers)
    ↓
Sauvegarde dans localStorage
```

---

## 📊 GESTION DES BACKUPS

### Fonctions disponibles :

```typescript
// Créer un backup manuellement
createBackup(): Backup

// Sauvegarder un backup
saveBackup(backup: Backup): boolean

// Lister tous les backups
listBackups(): BackupInfo[]

// Restaurer un backup
restoreBackup(timestamp: number): boolean

// Supprimer un backup
deleteBackup(timestamp: number): boolean

// Nettoyer les vieux backups
cleanOldBackups(maxToKeep: number): void

// Exporter en JSON
exportBackupAsJSON(backup: Backup): string

// Importer depuis JSON
importBackupFromJSON(jsonString: string): Backup | null
```

---

## 🛡️ SÉCURITÉ & ROBUSTESSE

### 1. **Migrations automatiques**
- Version tracking (`STORE_VERSION`)
- Migration function pour compatibilité backwards
- Nettoyage des données corrompues

### 2. **Gestion des erreurs**
- Try/catch sur toutes les opérations
- Fallback en cas de quota dépassé
- Logs console pour debug

### 3. **Nettoyage automatique**
- Max 7 backups gardés
- Suppression automatique des plus anciens
- Libération d'espace si quota dépassé

### 4. **Validation**
- Check de l'intégrité des données
- Vérification du format JSON
- Validation de la version

---

## 📱 STOCKAGE LOCAL

### Clés utilisées :
```
newmars-storage                    → Store principal (Zustand)
newmars_backup_<timestamp>         → Backups quotidiens (x7)
newmars_last_backup_date           → Date du dernier backup
```

### Taille approximative :
```
Store principal :     ~2-5 MB
Backup quotidien :    ~2-5 MB
Total (avec 7 backups) : ~15-40 MB
```

### Limite localStorage :
```
Chrome/Firefox : ~10 MB (peut varier)
Safari : ~5 MB
→ Système de nettoyage automatique si dépassement
```

---

## 🔧 UTILISATION

### 1. Sauvegarde automatique
**Rien à faire !** Tout est sauvegardé automatiquement.

### 2. Backup manuel (si nécessaire)
```typescript
import { createBackup, saveBackup } from './utils/autoBackup'

const backup = createBackup()
saveBackup(backup)
```

### 3. Restaurer un backup
```typescript
import { listBackups, restoreBackup } from './utils/autoBackup'

const backups = listBackups()
const success = restoreBackup(backups[0].timestamp)

if (success) {
  window.location.reload() // Recharger pour appliquer
}
```

### 4. Exporter/Importer
```typescript
import { createBackup, exportBackupAsJSON, importBackupFromJSON } from './utils/autoBackup'

// Export
const backup = createBackup()
const json = exportBackupAsJSON(backup)
// Télécharger ou envoyer le JSON

// Import
const backup = importBackupFromJSON(json)
if (backup) {
  saveBackup(backup)
}
```

---

## ✅ CE QUI EST BIEN SAUVEGARDÉ

| Donnée | Zustand Persist | Auto Backup |
|--------|----------------|-------------|
| **Tâches** | ✅ | ✅ |
| **Projets** | ✅ | ✅ |
| **Santé** | ✅ | ✅ |
| **Journal** | ✅ | ✅ |
| **Cours (Programmation)** | ✅ | ✅ |
| **Cours (Langues)** | ✅ | ✅ |
| **Bibliothèque** | ✅ | ✅ |
| **Widgets** | ✅ | ✅ |
| **Notes** | ✅ | ❌ |
| **Stats** | ✅ | ❌ |
| **UI State** | ❌ | ✅ |

---

## 🚀 AMÉLIORATIONS FUTURES (Optionnel)

### P1 - Cloud Sync
- Synchronisation avec Firebase/Supabase
- Backup cross-device
- Historique illimité

### P2 - Compression
- Compression des backups (gzip)
- Réduction de la taille de 50-70%
- Stockage de plus de backups

### P3 - Backup sélectif
- Choisir quelles données sauvegarder
- Export partiel (ex: seulement les tâches)
- Import sélectif

### P4 - UI de gestion
- Page Settings avec liste des backups
- Boutons pour restaurer/supprimer
- Indicateur de taille utilisée

---

## 🎉 CONCLUSION

**Le système de sauvegarde est COMPLET et AUTOMATIQUE !**

✅ Toutes les données sont sauvegardées en temps réel  
✅ Backup quotidien automatique  
✅ Gestion intelligente des erreurs  
✅ Nettoyage automatique  
✅ Migration de versions  
✅ **Langues incluses !**

**Tu n'as RIEN à faire, tout est géré automatiquement ! 💾✨**


