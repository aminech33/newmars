import { Suspense, lazy, useState, useEffect } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingFallback } from './components/LoadingFallback'
import { useStore } from './store/useStore'

// Lazy load des composants lourds
const HubV2 = lazy(() => import('./components/HubV2').then(m => ({ default: m.HubV2 })))
const TasksPage = lazy(() => import('./components/tasks/TasksPage').then(m => ({ default: m.TasksPage })))
const HealthPage = lazy(() => import('./components/health/HealthPage').then(m => ({ default: m.HealthPage })))
const MyDayPage = lazy(() => import('./components/myday/MyDayPage').then(m => ({ default: m.MyDayPage })))
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })))
const FocusMode = lazy(() => import('./components/FocusMode').then(m => ({ default: m.FocusMode })))
const LearningPage = lazy(() => import('./components/learning/LearningPage').then(m => ({ default: m.LearningPage })))
const LibraryPage = lazy(() => import('./components/library/LibraryPage').then(m => ({ default: m.LibraryPage })))
const PomodoroPage = lazy(() => import('./components/pomodoro/PomodoroPage').then(m => ({ default: m.PomodoroPage })))
const SettingsPage = lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })))

// Composants légers chargés directement
import { KeyboardShortcuts } from './components/KeyboardShortcuts'
import { SearchWidget } from './components/SearchWidget'
import { ToastContainer } from './components/ToastContainer'
import { Confetti } from './components/Confetti'
import { OfflineIndicator } from './components/OfflineIndicator'
import { useAutoBackup } from './hooks/useAutoBackup'

function AppContent() {
  const currentView = useStore((state) => state.currentView)
  const isFocusMode = useStore((state) => state.isFocusMode)
  
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
        {isFocusMode ? (
          <FocusMode />
        ) : (
          <>
            {currentView === 'hub' && <HubV2 />}
            {currentView === 'tasks' && <TasksPage />}
            {currentView === 'health' && <HealthPage />}
            {currentView === 'myday' && <MyDayPage />}
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'learning' && <LearningPage />}
            {currentView === 'library' && <LibraryPage />}
            {currentView === 'pomodoro' && <PomodoroPage />}
            {currentView === 'settings' && <SettingsPage />}
          </>
        )}
      </Suspense>

      {/* Composants globaux - toujours chargés */}
      <KeyboardShortcuts />
      <SearchWidget />
      <ToastContainer />
      <Confetti trigger={showConfetti} />
      <OfflineIndicator />

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
