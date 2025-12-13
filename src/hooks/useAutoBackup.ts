import { useEffect, useRef, useCallback } from 'react'

const STORAGE_KEY = 'newmars-storage'
const BACKUP_KEY = 'newmars-backup'
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000 // 24 heures
const LAST_BACKUP_KEY = 'newmars-last-backup'
const MAX_BACKUPS = 3

interface BackupMetadata {
  timestamp: number
  date: string
  size: number
}

/**
 * Hook pour gérer les backups automatiques du localStorage
 */
export function useAutoBackup() {
  const indicatorRef = useRef<HTMLDivElement | null>(null)
  
  // Créer l'indicateur de backup
  useEffect(() => {
    const indicator = document.createElement('div')
    indicator.className = 'backup-indicator'
    indicator.innerHTML = '💾 Sauvegarde automatique...'
    document.body.appendChild(indicator)
    indicatorRef.current = indicator
    
    return () => {
      if (indicatorRef.current) {
        document.body.removeChild(indicatorRef.current)
      }
    }
  }, [])
  
  // Afficher l'indicateur
  const showIndicator = useCallback((message: string) => {
    if (indicatorRef.current) {
      indicatorRef.current.innerHTML = message
      indicatorRef.current.classList.add('visible')
      setTimeout(() => {
        indicatorRef.current?.classList.remove('visible')
      }, 3000)
    }
  }, [])
  
  // Créer un backup
  const createBackup = useCallback(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return false
      
      const timestamp = Date.now()
      const backupData = {
        data,
        timestamp,
        version: '1.0.0'
      }
      
      // Récupérer les backups existants
      const existingBackups = getBackupsList()
      
      // Ajouter le nouveau backup
      const backupKey = `${BACKUP_KEY}-${timestamp}`
      localStorage.setItem(backupKey, JSON.stringify(backupData))
      
      // Mettre à jour la liste des backups
      const newBackupMeta: BackupMetadata = {
        timestamp,
        date: new Date(timestamp).toISOString(),
        size: data.length
      }
      
      const updatedBackups = [newBackupMeta, ...existingBackups].slice(0, MAX_BACKUPS)
      localStorage.setItem(`${BACKUP_KEY}-list`, JSON.stringify(updatedBackups))
      
      // Supprimer les vieux backups
      existingBackups.slice(MAX_BACKUPS - 1).forEach(backup => {
        localStorage.removeItem(`${BACKUP_KEY}-${backup.timestamp}`)
      })
      
      // Mettre à jour le timestamp du dernier backup
      localStorage.setItem(LAST_BACKUP_KEY, timestamp.toString())
      
      showIndicator('💾 Backup créé !')
      return true
    } catch (error) {
      showIndicator('❌ Erreur backup')
      return false
    }
  }, [showIndicator])
  
  // Récupérer la liste des backups
  const getBackupsList = useCallback((): BackupMetadata[] => {
    try {
      const list = localStorage.getItem(`${BACKUP_KEY}-list`)
      return list ? JSON.parse(list) : []
    } catch {
      return []
    }
  }, [])
  
  // Restaurer un backup
  const restoreBackup = useCallback((timestamp: number): boolean => {
    try {
      const backupKey = `${BACKUP_KEY}-${timestamp}`
      const backupData = localStorage.getItem(backupKey)
      
      if (!backupData) return false
      
      const parsed = JSON.parse(backupData)
      
      // Créer un backup de l'état actuel avant restauration
      createBackup()
      
      // Restaurer les données
      localStorage.setItem(STORAGE_KEY, parsed.data)
      
      return true
    } catch {
      return false
    }
  }, [createBackup])
  
  // Vérifier si un backup est nécessaire
  const checkAndBackup = useCallback(() => {
    try {
      const lastBackup = localStorage.getItem(LAST_BACKUP_KEY)
      const lastBackupTime = lastBackup ? parseInt(lastBackup, 10) : 0
      const now = Date.now()
      
      if (now - lastBackupTime > BACKUP_INTERVAL) {
        createBackup()
      }
    } catch {
      // Ignore errors
    }
  }, [createBackup])
  
  // Vérifier au montage et périodiquement
  useEffect(() => {
    // Vérifier immédiatement
    checkAndBackup()
    
    // Vérifier toutes les heures
    const interval = setInterval(checkAndBackup, 60 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [checkAndBackup])
  
  // Backup avant fermeture de la page
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Créer un backup rapide si pas fait récemment
      const lastBackup = localStorage.getItem(LAST_BACKUP_KEY)
      const lastBackupTime = lastBackup ? parseInt(lastBackup, 10) : 0
      const now = Date.now()
      
      // Si le dernier backup date de plus d'une heure
      if (now - lastBackupTime > 60 * 60 * 1000) {
        createBackup()
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [createBackup])
  
  return {
    createBackup,
    restoreBackup,
    getBackupsList
  }
}

/**
 * Utilitaire pour vérifier l'espace localStorage disponible
 */
export function getLocalStorageUsage(): { used: number; total: number; percent: number } {
  let total = 0
  let used = 0
  
  try {
    // Estimer la taille totale (environ 5MB pour la plupart des navigateurs)
    total = 5 * 1024 * 1024
    
    // Calculer l'espace utilisé
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        used += localStorage.getItem(key)?.length || 0
      }
    }
    
    // Multiplier par 2 pour UTF-16
    used *= 2
  } catch {
    // Ignore errors
  }
  
  return {
    used,
    total,
    percent: Math.round((used / total) * 100)
  }
}





