import { useEffect, useRef } from 'react'
import { TestResult } from '../types/testing'
import { useStore } from '../store/useStore'

const DB_NAME = 'iku-test-backup'
const DB_VERSION = 1
const STORE_NAME = 'testResults'
const BACKUP_INTERVAL = 30000 // 30 secondes

// IndexedDB pour backup robuste (survit au clear localStorage)
class TestBackupDB {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  async saveBackup(results: Record<string, TestResult>): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      const backup = {
        id: 'current',
        timestamp: Date.now(),
        results: results
      }

      const request = store.put(backup)
      
      request.onsuccess = () => {
        console.log('✅ Test backup saved to IndexedDB', new Date().toLocaleTimeString())
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async loadBackup(): Promise<Record<string, TestResult> | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get('current')

      request.onsuccess = () => {
        const backup = request.result
        if (backup && backup.results) {
          console.log('✅ Test backup loaded from IndexedDB', new Date(backup.timestamp).toLocaleString())
          resolve(backup.results)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getAllBackups(): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async exportToFile(results: Record<string, TestResult>): Promise<void> {
    const backup = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      results: results
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { 
      type: 'application/json' 
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `iku-test-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    console.log('📥 Test backup exported to file')
  }
}

const backupDB = new TestBackupDB()

// Hook pour gérer les backups automatiques
export function useTestBackup(
  testResults: Record<string, TestResult>,
  setTestResults: (results: Record<string, TestResult>) => void
) {
  const lastBackupRef = useRef<number>(0)
  const isInitializedRef = useRef(false)
  const zustandStore = useStore()

  // Initialisation : charger le backup si disponible
  useEffect(() => {
    const loadBackup = async () => {
      try {
        // 🛡️ 1. PRIORITÉ MAX: Zustand store (le plus fiable)
        const zustandBackup = zustandStore.testResults
        
        // 🛡️ 2. IndexedDB (backup robuste)
        const idbBackup = await backupDB.loadBackup()
        
        // 🛡️ 3. localStorage (backup rapide)
        let localBackup: Record<string, TestResult> | null = null
        const localData = localStorage.getItem('iku-test-results')
        if (localData) {
          try {
            localBackup = JSON.parse(localData)
          } catch (e) {
            console.error('Erreur parsing localStorage backup', e)
          }
        }

        // Utiliser le backup avec le plus de données
        let resultsToRestore: Record<string, TestResult> | null = null
        const zustandCount = Object.keys(zustandBackup || {}).length
        const idbCount = Object.keys(idbBackup || {}).length
        const localCount = Object.keys(localBackup || {}).length

        console.log('🛡️ Backups disponibles:', { zustandCount, idbCount, localCount })

        if (zustandCount > 0) {
          resultsToRestore = zustandBackup
          console.log('✅ Restauration depuis Zustand Store')
        } else if (idbCount > 0) {
          resultsToRestore = idbBackup
          console.log('✅ Restauration depuis IndexedDB')
        } else if (localCount > 0) {
          resultsToRestore = localBackup
          console.log('✅ Restauration depuis localStorage')
        }

        if (resultsToRestore && Object.keys(resultsToRestore).length > 0) {
          setTestResults(resultsToRestore)
          // Synchroniser avec le store Zustand si ce n'était pas la source
          if (resultsToRestore !== zustandBackup) {
            zustandStore.setTestResults(resultsToRestore)
          }
          console.log(`✅ ${Object.keys(resultsToRestore).length} résultats de tests restaurés!`)
        }

        isInitializedRef.current = true
      } catch (error) {
        console.error('❌ Erreur chargement backup:', error)
        isInitializedRef.current = true
      }
    }

    if (!isInitializedRef.current) {
      loadBackup()
    }
  }, [setTestResults, zustandStore])

  // Backup automatique périodique
  useEffect(() => {
    if (!isInitializedRef.current) return
    if (Object.keys(testResults).length === 0) return

    const now = Date.now()
    const timeSinceLastBackup = now - lastBackupRef.current

    // Sauvegarder toutes les 30 secondes si changements
    if (timeSinceLastBackup > BACKUP_INTERVAL) {
      const saveBackups = async () => {
        try {
          // 🛡️ 1. Zustand Store (PRIORITÉ - persiste automatiquement)
          zustandStore.setTestResults(testResults)
          
          // 🛡️ 2. localStorage (backup rapide)
          localStorage.setItem('iku-test-results', JSON.stringify(testResults))
          
          // 🛡️ 3. IndexedDB (backup robuste)
          await backupDB.saveBackup(testResults)
          
          lastBackupRef.current = now
        } catch (error) {
          console.error('❌ Erreur sauvegarde backup:', error)
        }
      }

      saveBackups()
    }
  }, [testResults, zustandStore])

  // Sauvegarder immédiatement à chaque changement (debounced)
  useEffect(() => {
    if (!isInitializedRef.current) return
    if (Object.keys(testResults).length === 0) return

    const timer = setTimeout(async () => {
      try {
        // 🛡️ Triple sauvegarde immédiate
        zustandStore.setTestResults(testResults)
        localStorage.setItem('iku-test-results', JSON.stringify(testResults))
        await backupDB.saveBackup(testResults)
      } catch (error) {
        console.error('❌ Erreur sauvegarde immédiate:', error)
      }
    }, 500) // Debounce de 500ms

    return () => clearTimeout(timer)
  }, [testResults, zustandStore])

  // Export automatique avant window.unload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      try {
        await backupDB.saveBackup(testResults)
      } catch (error) {
        console.error('Erreur backup avant fermeture:', error)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [testResults])

  return {
    exportBackup: () => backupDB.exportToFile(testResults),
    loadBackup: () => backupDB.loadBackup(),
    saveBackup: () => backupDB.saveBackup(testResults)
  }
}

