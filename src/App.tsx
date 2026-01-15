import { Suspense, lazy, useState, useEffect } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingFallback } from './components/LoadingFallback'
import { useStore } from './store/useStore'

// Lazy load des composants lourds pour éviter les erreurs au chargement initial
const HubV2 = lazy(() => import('./components/HubV2').then(m => ({ default: m.HubV2 })))
const TasksPage = lazy(() => import('./components/tasks/TasksPage').then(m => ({ default: m.TasksPage })))
const MyDayPage = lazy(() => import('./components/myday/MyDayPage').then(m => ({ default: m.MyDayPage })))
const HealthPage = lazy(() => import('./components/health/HealthPage').then(m => ({ default: m.HealthPage })))
const LearningPage = lazy(() => import('./components/learning/LearningPage').then(m => ({ default: m.LearningPage })))
const LibraryPage = lazy(() => import('./components/LibraryPage').then(m => ({ default: m.LibraryPage })))
const SettingsPage = lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })))
const ConnectionsPage = lazy(() => import('./components/ConnectionsPage').then(m => ({ default: m.ConnectionsPage })))

// Composants légers chargés directement
import { KeyboardShortcuts } from './components/KeyboardShortcuts'
import { SearchWidget } from './components/SearchWidget'
import { ToastContainer } from './components/ToastContainer'
import { Confetti } from './components/Confetti'
import { OfflineIndicator } from './components/OfflineIndicator'
import { SyncIndicator } from './components/SyncIndicator'
import { useAutoBackup } from './hooks/useAutoBackup'

function AppContent() {
  const currentView = useStore((state) => state.currentView)
  
  const [showConfetti, setShowConfetti] = useState(false)
  const [isReady, setIsReady] = useState(false)

  // Backup automatique
  useAutoBackup()


  // Vérification de santé au démarrage
  useEffect(() => {
    const checkHealth = () => {
      try {
        // Vérifier que le store fonctionne
        const state = useStore.getState()
        if (!state || typeof state.setView !== 'function') {
          throw new Error('Store not initialized properly')
        }
        setIsReady(true)
      } catch {
        setIsReady(false)
      }
    }
    
    checkHealth()
  }, [])

  useEffect(() => {
    const handleTaskCompleted = () => {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 100)
    }

    window.addEventListener('task-completed', handleTaskCompleted)
    return () => window.removeEventListener('task-completed', handleTaskCompleted)
  }, [])


  // Afficher un loader si pas prêt
  if (!isReady) {
    return <LoadingFallback />
  }


  return (
    <div className="h-full w-full bg-mars-bg noise-bg overflow-hidden">
      <Suspense fallback={<LoadingFallback />}>
        <>
          {currentView === 'hub' && <HubV2 />}
          {currentView === 'tasks' && <TasksPage />}
          {currentView === 'myday' && <MyDayPage />}
          {currentView === 'health' && <HealthPage />}
          {currentView === 'learning' && <LearningPage />}
          {currentView === 'library' && <LibraryPage />}
          {currentView === 'settings' && <SettingsPage />}
          {currentView === 'connections' && <ConnectionsPage />}
        </>
      </Suspense>

      {/* Composants globaux - toujours chargés */}
      <KeyboardShortcuts />
      <SearchWidget />
      <ToastContainer />
      <Confetti trigger={showConfetti} />
      <OfflineIndicator />

      {/* Indicateur de sync backend (position fixe en bas à droite) */}
      <div className="fixed bottom-4 right-4 z-50">
        <SyncIndicator />
      </div>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}

export default App
