import { Suspense, lazy, useState, useEffect } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingFallback } from './components/LoadingFallback'
import { useStore } from './store/useStore'

// Lazy load des composants lourds pour éviter les erreurs au chargement initial
const HubV2 = lazy(() => import('./components/HubV2').then(m => ({ default: m.HubV2 })))
const TasksPage = lazy(() => import('./components/tasks/TasksPage').then(m => ({ default: m.TasksPage })))
const CalendarPage = lazy(() => import('./components/calendar/CalendarPage').then(m => ({ default: m.CalendarPage })))
const HealthPage = lazy(() => import('./components/health/HealthPage').then(m => ({ default: m.HealthPage })))
const JournalPage = lazy(() => import('./components/journal/JournalPage').then(m => ({ default: m.JournalPage })))
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })))
const AIAssistant = lazy(() => import('./components/AIAssistant').then(m => ({ default: m.AIAssistant })))
const FocusMode = lazy(() => import('./components/FocusMode').then(m => ({ default: m.FocusMode })))
const LearningPage = lazy(() => import('./components/learning/LearningPage').then(m => ({ default: m.LearningPage })))

// Composants légers chargés directement
import { KeyboardShortcuts } from './components/KeyboardShortcuts'
import { CommandPalette } from './components/CommandPalette'
import { ToastContainer } from './components/ToastContainer'
import { QuickAdd } from './components/QuickAdd'
import { Confetti } from './components/Confetti'

function AppContent() {
  const currentView = useStore((state) => state.currentView)
  const isFocusMode = useStore((state) => state.isFocusMode)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isReady, setIsReady] = useState(false)

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
        console.log('✅ App health check passed')
      } catch (error) {
        console.error('❌ App health check failed:', error)
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
            {currentView === 'calendar' && <CalendarPage />}
            {currentView === 'health' && <HealthPage />}
            {currentView === 'journal' && <JournalPage />}
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'ai' && <AIAssistant />}
            {currentView === 'learning' && <LearningPage />}
          </>
        )}
      </Suspense>

      {/* Composants globaux - toujours chargés */}
      <KeyboardShortcuts />
      <CommandPalette />
      <ToastContainer />
      <QuickAdd />
      <Confetti trigger={showConfetti} />
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
