/**
 * Système de backup automatique
 * Sauvegarde quotidienne des données + gestion des backups
 */

import { useStore } from '../store/useStore'

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const BACKUP_PREFIX = 'newmars_backup_'
const MAX_BACKUPS = 7 // Garder 7 derniers backups
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000 // 24 heures
const LAST_BACKUP_KEY = 'newmars_last_backup_date'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface Backup {
  version: string
  date: string
  timestamp: number
  data: any
  size: number // en bytes
}

export interface BackupInfo {
  id: string
  date: string
  size: string // formaté (ex: "2.5 MB")
  timestamp: number
}

// ═══════════════════════════════════════════════════════════════
// CRÉATION DE BACKUP
// ═══════════════════════════════════════════════════════════════

/**
 * Crée un backup complet des données
 */
export function createBackup(): Backup {
  const state = useStore.getState()
  
  const backup: Backup = {
    version: '1.3.0',
    date: new Date().toISOString(),
    timestamp: Date.now(),
    data: {
      // Tasks
      tasks: state.tasks,
      projects: state.projects,
      customCategories: state.customCategories,
      taskQuota: state.taskQuota,
      
      // Health
      userProfile: state.userProfile,
      weightEntries: state.weightEntries,
      mealEntries: state.mealEntries,
      exerciseEntries: state.exerciseEntries,
      hydrationEntries: state.hydrationEntries,
      healthGoals: state.healthGoals,
      
      // Journal
      journalEntries: state.journalEntries,
      habits: state.habits,
      
      // Learning
      learningCourses: state.learningCourses,
      
      // Languages
      languageCourses: state.languageCourses,
      
      // Library
      books: state.books,
      readingSessions: state.readingSessions,
      readingGoal: state.readingGoal,
      
      // UI State (optionnel)
      currentView: state.currentView,
      focusMode: state.focusMode,
      widgets: state.widgets,
    },
    size: 0 // Calculé après
  }
  
  // Calculer la taille
  const jsonString = JSON.stringify(backup)
  backup.size = new Blob([jsonString]).size
  
  return backup
}

/**
 * Sauvegarde un backup dans localStorage
 */
export function saveBackup(backup: Backup): boolean {
  try {
    const key = `${BACKUP_PREFIX}${backup.timestamp}`
    localStorage.setItem(key, JSON.stringify(backup))
    localStorage.setItem(LAST_BACKUP_KEY, backup.date)
    
    console.log(`✅ Backup créé : ${formatDate(backup.date)} (${formatSize(backup.size)})`)
    return true
  } catch (error) {
    console.error('❌ Erreur sauvegarde backup:', error)
    
    // Si quota dépassé, supprimer les vieux backups
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      cleanOldBackups(MAX_BACKUPS - 1)
      
      // Réessayer
      try {
        const key = `${BACKUP_PREFIX}${backup.timestamp}`
        localStorage.setItem(key, JSON.stringify(backup))
        localStorage.setItem(LAST_BACKUP_KEY, backup.date)
        return true
      } catch (retryError) {
        console.error('❌ Échec après nettoyage:', retryError)
        return false
      }
    }
    
    return false
  }
}

/**
 * Crée et sauvegarde un backup automatiquement
 */
export function performAutoBackup(): boolean {
  console.log('🔄 Création backup automatique...')
  const backup = createBackup()
  const success = saveBackup(backup)
  
  if (success) {
    cleanOldBackups()
  }
  
  return success
}

// ═══════════════════════════════════════════════════════════════
// RESTAURATION
// ═══════════════════════════════════════════════════════════════

/**
 * Restaure un backup
 */
export function restoreBackup(backupId: string): boolean {
  try {
    const key = `${BACKUP_PREFIX}${backupId}`
    const backupJson = localStorage.getItem(key)
    
    if (!backupJson) {
      console.error('❌ Backup non trouvé:', backupId)
      return false
    }
    
    const backup: Backup = JSON.parse(backupJson)
    
    // Restaurer les données
    useStore.setState(backup.data)
    
    console.log(`✅ Backup restauré : ${formatDate(backup.date)}`)
    return true
  } catch (error) {
    console.error('❌ Erreur restauration backup:', error)
    return false
  }
}

/**
 * Restaure le backup le plus récent
 */
export function restoreLatestBackup(): boolean {
  const backups = listBackups()
  
  if (backups.length === 0) {
    console.warn('⚠️ Aucun backup disponible')
    return false
  }
  
  // Le premier est le plus récent (tri décroissant)
  return restoreBackup(backups[0].id)
}

// ═══════════════════════════════════════════════════════════════
// GESTION DES BACKUPS
// ═══════════════════════════════════════════════════════════════

/**
 * Liste tous les backups disponibles
 */
export function listBackups(): BackupInfo[] {
  const backups: BackupInfo[] = []
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    
    if (key && key.startsWith(BACKUP_PREFIX)) {
      try {
        const backupJson = localStorage.getItem(key)
        if (!backupJson) continue
        
        const backup: Backup = JSON.parse(backupJson)
        
        backups.push({
          id: backup.timestamp.toString(),
          date: backup.date,
          size: formatSize(backup.size),
          timestamp: backup.timestamp,
        })
      } catch (error) {
        console.error('Erreur lecture backup:', key, error)
      }
    }
  }
  
  // Trier par date décroissante (plus récent en premier)
  return backups.sort((a, b) => b.timestamp - a.timestamp)
}

/**
 * Supprime les vieux backups (garde seulement les N plus récents)
 */
export function cleanOldBackups(keepCount: number = MAX_BACKUPS): number {
  const backups = listBackups()
  
  if (backups.length <= keepCount) {
    return 0
  }
  
  // Supprimer les backups les plus anciens
  const toDelete = backups.slice(keepCount)
  let deletedCount = 0
  
  for (const backup of toDelete) {
    const key = `${BACKUP_PREFIX}${backup.id}`
    localStorage.removeItem(key)
    deletedCount++
  }
  
  console.log(`🗑️ ${deletedCount} vieux backups supprimés`)
  return deletedCount
}

/**
 * Supprime un backup spécifique
 */
export function deleteBackup(backupId: string): boolean {
  try {
    const key = `${BACKUP_PREFIX}${backupId}`
    localStorage.removeItem(key)
    console.log(`🗑️ Backup supprimé : ${backupId}`)
    return true
  } catch (error) {
    console.error('❌ Erreur suppression backup:', error)
    return false
  }
}

/**
 * Supprime tous les backups
 */
export function deleteAllBackups(): number {
  const backups = listBackups()
  let deletedCount = 0
  
  for (const backup of backups) {
    if (deleteBackup(backup.id)) {
      deletedCount++
    }
  }
  
  localStorage.removeItem(LAST_BACKUP_KEY)
  console.log(`🗑️ Tous les backups supprimés (${deletedCount})`)
  return deletedCount
}

// ═══════════════════════════════════════════════════════════════
// BACKUP AUTOMATIQUE
// ═══════════════════════════════════════════════════════════════

let autoBackupInterval: NodeJS.Timeout | null = null

/**
 * Démarre le backup automatique quotidien
 */
export function startAutoBackup(): void {
  // Arrêter l'ancien interval si existe
  if (autoBackupInterval) {
    clearInterval(autoBackupInterval)
  }
  
  // Vérifier si un backup est nécessaire maintenant
  checkAndPerformBackup()
  
  // Configurer le backup automatique quotidien
  autoBackupInterval = setInterval(() => {
    checkAndPerformBackup()
  }, BACKUP_INTERVAL)
  
  console.log('✅ Backup automatique activé (quotidien)')
}

/**
 * Arrête le backup automatique
 */
export function stopAutoBackup(): void {
  if (autoBackupInterval) {
    clearInterval(autoBackupInterval)
    autoBackupInterval = null
    console.log('⏹️ Backup automatique désactivé')
  }
}

/**
 * Vérifie si un backup est nécessaire et le crée
 */
function checkAndPerformBackup(): void {
  const lastBackupDate = localStorage.getItem(LAST_BACKUP_KEY)
  
  if (!lastBackupDate) {
    // Aucun backup, en créer un
    performAutoBackup()
    return
  }
  
  const lastBackup = new Date(lastBackupDate)
  const now = new Date()
  const hoursSinceLastBackup = (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60)
  
  // Si plus de 24h depuis le dernier backup
  if (hoursSinceLastBackup >= 24) {
    performAutoBackup()
  } else {
    console.log(`⏳ Prochain backup dans ${Math.round(24 - hoursSinceLastBackup)}h`)
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT/IMPORT MANUEL
// ═══════════════════════════════════════════════════════════════

/**
 * Exporte un backup vers un fichier JSON
 */
export function exportBackupToFile(backupId?: string): void {
  let backup: Backup
  
  if (backupId) {
    // Exporter un backup spécifique
    const key = `${BACKUP_PREFIX}${backupId}`
    const backupJson = localStorage.getItem(key)
    
    if (!backupJson) {
      console.error('❌ Backup non trouvé:', backupId)
      return
    }
    
    backup = JSON.parse(backupJson)
  } else {
    // Créer un nouveau backup
    backup = createBackup()
  }
  
  // Créer le fichier
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `newmars-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  console.log('📥 Backup exporté vers fichier')
}

/**
 * Importe un backup depuis un fichier JSON
 */
export function importBackupFromFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const backup: Backup = JSON.parse(e.target?.result as string)
        
        // Valider la structure
        if (!backup.version || !backup.data) {
          console.error('❌ Fichier backup invalide')
          resolve(false)
          return
        }
        
        // Restaurer les données
        useStore.setState(backup.data)
        
        // Sauvegarder comme backup local aussi
        saveBackup(backup)
        
        console.log('✅ Backup importé avec succès')
        resolve(true)
      } catch (error) {
        console.error('❌ Erreur import backup:', error)
        resolve(false)
      }
    }
    
    reader.onerror = () => {
      console.error('❌ Erreur lecture fichier')
      resolve(false)
    }
    
    reader.readAsText(file)
  })
}

// ═══════════════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════════════

/**
 * Formate une taille en bytes vers une chaîne lisible
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Formate une date ISO vers une chaîne lisible
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Obtient des statistiques sur les backups
 */
export function getBackupStats() {
  const backups = listBackups()
  const lastBackupDate = localStorage.getItem(LAST_BACKUP_KEY)
  
  let totalSize = 0
  for (const backup of backups) {
    const key = `${BACKUP_PREFIX}${backup.id}`
    const backupJson = localStorage.getItem(key)
    if (backupJson) {
      totalSize += new Blob([backupJson]).size
    }
  }
  
  return {
    count: backups.length,
    totalSize: formatSize(totalSize),
    lastBackup: lastBackupDate ? formatDate(lastBackupDate) : 'Jamais',
    oldestBackup: backups.length > 0 ? formatDate(backups[backups.length - 1].date) : 'N/A',
    newestBackup: backups.length > 0 ? formatDate(backups[0].date) : 'N/A',
  }
}



