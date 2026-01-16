/**
 * 🔄 useBackendSync - Hook de synchronisation Frontend ↔ Backend
 *
 * Synchronise les données Zustand (localStorage) avec le backend SQLite.
 * Stratégie : Backend comme source de vérité, avec fallback localStorage.
 *
 * Modes de synchronisation :
 * - LOAD : Au démarrage, charge depuis le backend
 * - PUSH : Envoie les changements locaux vers le backend
 * - PULL : Récupère les données du backend (refresh)
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { useStore } from '../store/useStore'
import { tasksApi, healthApi, checkBackendConnection } from '../services/api'

interface SyncStatus {
  isConnected: boolean
  lastSync: number | null
  syncInProgress: boolean
  error: string | null
  tasksSync: 'idle' | 'syncing' | 'synced' | 'error'
  healthSync: 'idle' | 'syncing' | 'synced' | 'error'
}

// Convertit les noms de champs camelCase ↔ snake_case
function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase)
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
      acc[snakeKey] = toSnakeCase(obj[key])
      return acc
    }, {} as any)
  }
  return obj
}

function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase)
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      acc[camelKey] = toCamelCase(obj[key])
      return acc
    }, {} as any)
  }
  return obj
}

export function useBackendSync() {
  const [status, setStatus] = useState<SyncStatus>({
    isConnected: false,
    lastSync: null,
    syncInProgress: false,
    error: null,
    tasksSync: 'idle',
    healthSync: 'idle',
  })

  const initialSyncDone = useRef(false)

  const {
    tasks,
    projects,
    customCategories,
    pomodoroSessions,
    weightEntries,
    mealEntries,
    hydrationEntries,
    userProfile,
    addToast,
  } = useStore()

  // Accès direct aux setters du store
  const store = useStore.getState

  // ═══════════════════════════════════════════════════════════════
  // CHECK CONNECTION
  // ═══════════════════════════════════════════════════════════════

  const checkConnection = useCallback(async () => {
    const connected = await checkBackendConnection()
    setStatus(s => ({ ...s, isConnected: connected }))
    return connected
  }, [])

  // ═══════════════════════════════════════════════════════════════
  // SYNC TASKS TO BACKEND
  // ═══════════════════════════════════════════════════════════════

  const syncTasksToBackend = useCallback(async () => {
    if (!status.isConnected) return

    setStatus(s => ({ ...s, tasksSync: 'syncing' }))

    try {
      // 1. Sync projects first
      const existingProjectsRes = await tasksApi.getProjects(true)
      const existingProjectIds = existingProjectsRes.data?.projects?.map(p => p.id) || []

      const newProjects = projects.filter(p => !existingProjectIds.includes(p.id))
      if (newProjects.length > 0) {
        await tasksApi.bulkCreateProjects(newProjects.map(toSnakeCase))
      }

      // 2. Sync tasks
      const existingTasksRes = await tasksApi.getTasks()
      const existingTaskIds = existingTasksRes.data?.tasks?.map(t => t.id) || []

      const newTasks = tasks.filter(t => !existingTaskIds.includes(t.id))
      if (newTasks.length > 0) {
        await tasksApi.bulkCreateTasks(newTasks.map(toSnakeCase))
      }

      // 3. Sync categories
      const existingCatsRes = await tasksApi.getCategories()
      const existingCatIds = existingCatsRes.data?.categories?.map(c => c.id) || []

      for (const cat of customCategories) {
        if (!existingCatIds.includes(cat.id)) {
          await tasksApi.createCategory(toSnakeCase(cat))
        }
      }

      // 4. Sync pomodoro sessions
      for (const session of pomodoroSessions || []) {
        await tasksApi.createPomodoro(toSnakeCase(session))
      }

      setStatus(s => ({
        ...s,
        tasksSync: 'synced',
        lastSync: Date.now(),
      }))

      return true
    } catch (error) {
      console.error('[Sync] Erreur sync tasks:', error)
      setStatus(s => ({ ...s, tasksSync: 'error', error: 'Erreur sync tâches' }))
      return false
    }
  }, [status.isConnected, tasks, projects, customCategories, pomodoroSessions])

  // ═══════════════════════════════════════════════════════════════
  // SYNC HEALTH TO BACKEND
  // ═══════════════════════════════════════════════════════════════

  const syncHealthToBackend = useCallback(async () => {
    if (!status.isConnected) return

    setStatus(s => ({ ...s, healthSync: 'syncing' }))

    try {
      // 1. Sync weight entries
      const existingWeightRes = await healthApi.getWeightEntries(500)
      const existingWeightDates = existingWeightRes.data?.entries?.map(e => e.date) || []

      for (const entry of weightEntries || []) {
        if (!existingWeightDates.includes(entry.date)) {
          await healthApi.addWeightEntry(toSnakeCase(entry))
        }
      }

      // 2. Sync meals
      const existingMealsRes = await healthApi.getMeals(undefined, 500)
      const existingMealIds = existingMealsRes.data?.meals?.map(m => m.id) || []

      for (const meal of mealEntries || []) {
        if (!existingMealIds.includes(meal.id)) {
          await healthApi.addMeal(toSnakeCase(meal))
        }
      }

      // 3. Sync user profile
      if (userProfile) {
        await healthApi.updateHealthProfile(toSnakeCase(userProfile))
      }

      setStatus(s => ({
        ...s,
        healthSync: 'synced',
        lastSync: Date.now(),
      }))

      return true
    } catch (error) {
      console.error('[Sync] Erreur sync health:', error)
      setStatus(s => ({ ...s, healthSync: 'error', error: 'Erreur sync santé' }))
      return false
    }
  }, [status.isConnected, weightEntries, mealEntries, userProfile])

  // ═══════════════════════════════════════════════════════════════
  // LOAD FROM BACKEND
  // ═══════════════════════════════════════════════════════════════

  const loadFromBackend = useCallback(async () => {
    if (!status.isConnected) return false

    setStatus(s => ({ ...s, syncInProgress: true }))

    try {
      // 1. Load tasks
      const tasksRes = await tasksApi.getTasks()
      if (tasksRes.success && tasksRes.data?.tasks) {
        const backendTasks = tasksRes.data.tasks.map(toCamelCase)
        if (backendTasks.length > 0) {
          useStore.setState({ tasks: backendTasks })
        }
      }

      // 2. Load projects
      const projectsRes = await tasksApi.getProjects(true)
      if (projectsRes.success && projectsRes.data?.projects) {
        const backendProjects = projectsRes.data.projects.map(toCamelCase)
        if (backendProjects.length > 0) {
          useStore.setState({ projects: backendProjects })
        }
      }

      // 3. Load categories
      const catsRes = await tasksApi.getCategories()
      if (catsRes.success && catsRes.data?.categories) {
        const backendCats = catsRes.data.categories.map(toCamelCase)
        useStore.setState({ customCategories: backendCats })
      }

      // 4. Load weight entries
      const weightRes = await healthApi.getWeightEntries(500)
      if (weightRes.success && weightRes.data?.entries) {
        const backendWeight = weightRes.data.entries.map(toCamelCase)
        if (backendWeight.length > 0) {
          useStore.setState({ weightEntries: backendWeight })
        }
      }

      // 5. Load meals
      const mealsRes = await healthApi.getMeals(undefined, 500)
      if (mealsRes.success && mealsRes.data?.meals) {
        const backendMeals = mealsRes.data.meals.map(toCamelCase)
        if (backendMeals.length > 0) {
          useStore.setState({ mealEntries: backendMeals })
        }
      }

      // 6. Load health profile
      const profileRes = await healthApi.getHealthProfile()
      if (profileRes.success && profileRes.data?.profile) {
        const backendProfile = toCamelCase(profileRes.data.profile)
        if (backendProfile && Object.keys(backendProfile).length > 0) {
          useStore.setState({ userProfile: backendProfile })
        }
      }

      setStatus(s => ({
        ...s,
        syncInProgress: false,
        tasksSync: 'synced',
        healthSync: 'synced',
        lastSync: Date.now(),
      }))

      return true
    } catch (error) {
      console.error('[Sync] Erreur load from backend:', error)
      setStatus(s => ({
        ...s,
        syncInProgress: false,
        error: 'Erreur chargement données',
      }))
      return false
    }
  }, [status.isConnected])

  // ═══════════════════════════════════════════════════════════════
  // FULL SYNC (bidirectional)
  // ═══════════════════════════════════════════════════════════════

  const fullSync = useCallback(async () => {
    const connected = await checkConnection()

    if (!connected) {
      setStatus(s => ({
        ...s,
        error: 'Backend non connecté - mode hors-ligne',
      }))
      return false
    }

    setStatus(s => ({ ...s, syncInProgress: true, error: null }))

    // D'abord envoyer les données locales, puis charger depuis le backend
    await syncTasksToBackend()
    await syncHealthToBackend()

    // Optionnel: recharger depuis le backend pour avoir les données fusionnées
    // await loadFromBackend()

    setStatus(s => ({
      ...s,
      syncInProgress: false,
      lastSync: Date.now(),
    }))

    addToast('Synchronisation terminée', 'success')
    return true
  }, [checkConnection, syncTasksToBackend, syncHealthToBackend, addToast])

  // ═══════════════════════════════════════════════════════════════
  // INITIAL SYNC ON MOUNT
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    if (initialSyncDone.current) return

    const initSync = async () => {
      const connected = await checkConnection()

      if (connected) {
        initialSyncDone.current = true
        // Au premier lancement, on push les données locales vers le backend
        await syncTasksToBackend()
        await syncHealthToBackend()
        console.log('[Sync] Synchronisation initiale terminée')
      }
    }

    // Délai pour laisser le store se réhydrater depuis localStorage
    const timeout = setTimeout(initSync, 1000)
    return () => clearTimeout(timeout)
  }, [checkConnection, syncTasksToBackend, syncHealthToBackend])

  // ═══════════════════════════════════════════════════════════════
  // PERIODIC SYNC (every 30 seconds)
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    const SYNC_INTERVAL = 30000 // 30 secondes

    const periodicSync = async () => {
      if (!status.isConnected || status.syncInProgress) return

      console.log('[Sync] Sync périodique...')
      await syncTasksToBackend()
      await syncHealthToBackend()
    }

    const interval = setInterval(periodicSync, SYNC_INTERVAL)
    return () => clearInterval(interval)
  }, [status.isConnected, status.syncInProgress, syncTasksToBackend, syncHealthToBackend])

  // ═══════════════════════════════════════════════════════════════
  // SYNC ON PAGE CLOSE / VISIBILITY CHANGE
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    const syncBeforeUnload = () => {
      if (!status.isConnected) return

      // Utiliser sendBeacon pour une sync fiable avant fermeture
      const data = JSON.stringify({
        tasks: toSnakeCase(tasks),
        projects: toSnakeCase(projects),
      })

      navigator.sendBeacon?.('/api/tasks-db/sync-beacon', data)
      console.log('[Sync] Sync avant fermeture')
    }

    const handleVisibilityChange = async () => {
      // Sync quand l'utilisateur quitte l'onglet
      if (document.visibilityState === 'hidden' && status.isConnected) {
        await syncTasksToBackend()
        await syncHealthToBackend()
        console.log('[Sync] Sync sur changement de visibilité')
      }
    }

    window.addEventListener('beforeunload', syncBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', syncBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [status.isConnected, tasks, projects, syncTasksToBackend, syncHealthToBackend])

  return {
    status,
    checkConnection,
    syncTasksToBackend,
    syncHealthToBackend,
    loadFromBackend,
    fullSync,
  }
}
