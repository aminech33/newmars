import { Suspense, lazy, useState, useEffect } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingFallback } from './components/LoadingFallback'
import { useStore } from './store/useStore'

// Lazy load des composants lourds pour éviter les erreurs au chargement initial
const HubV2 = lazy(() => import('./components/HubV2').then(m => ({ default: m.HubV2 })))
const TasksPage = lazy(() => import('./components/tasks/TasksPage').then(m => ({ default: m.TasksPage })))
const CalendarPage = lazy(() => import('./components/calendar/CalendarPage').then(m => ({ default: m.CalendarPage })))
const HealthPage = lazy(() => import('./components/health/HealthPage').then(m => ({ default: m.HealthPage })))
const MyDayPage = lazy(() => import('./components/myday/MyDayPage').then(m => ({ default: m.MyDayPage })))
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })))
const AIAssistant = lazy(() => import('./components/AIAssistant').then(m => ({ default: m.AIAssistant })))
const FocusMode = lazy(() => import('./components/FocusMode').then(m => ({ default: m.FocusMode })))
const LearningPage = lazy(() => import('./components/learning/LearningPage').then(m => ({ default: m.LearningPage })))
const LibraryPage = lazy(() => import('./components/library/LibraryPage').then(m => ({ default: m.LibraryPage })))
const PomodoroPage = lazy(() => import('./components/pomodoro/PomodoroPage').then(m => ({ default: m.PomodoroPage })))
const SettingsPage = lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })))
const TestLabPage = lazy(() => import('./components/testing/TestLabPage').then(m => ({ default: m.TestLabPage })))
const WidgetShowcase = lazy(() => import('./components/WidgetShowcase').then(m => ({ default: m.WidgetShowcase })))

// Composants légers chargés directement
import { KeyboardShortcuts } from './components/KeyboardShortcuts'
import { SearchWidget } from './components/SearchWidget'
import { ToastContainer } from './components/ToastContainer'
import { Confetti } from './components/Confetti'
import { OfflineIndicator } from './components/OfflineIndicator'
import { TestLabFloatingBubble } from './components/testing/TestLabFloatingBubble'
import { TestLabTinyWindow } from './components/testing/TestLabTinyWindow'
import { useAutoBackup } from './hooks/useAutoBackup'

// Debug book cover (dev only)
if (import.meta.env.DEV) {
  import('./utils/debugBookCover')
}

function AppContent() {
  const currentView = useStore((state) => state.currentView)
  const setView = useStore((state) => state.setView)
  const isFocusMode = useStore((state) => state.isFocusMode)
  const testResults = useStore((state) => state.testResults)
  const setTestResults = useStore((state) => state.setTestResults)
  
  const [showConfetti, setShowConfetti] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [showTestLabQuick, setShowTestLabQuick] = useState(false)

  // Backup automatique
  useAutoBackup()

  // Debug pour la bulle
  useEffect(() => {
    console.log('🔍 État bulle - isFocusMode:', isFocusMode, 'currentView:', currentView, 'doit afficher:', !isFocusMode && currentView !== 'test-lab')
  }, [isFocusMode, currentView])

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

  // Fonctions pour les tests
  const handleRunTest = (testId: string) => {
    setTestResults({ ...testResults, [testId]: { status: 'running' } as any })
    // Simuler un test (à remplacer par la vraie logique)
    setTimeout(() => {
      setTestResults({ 
        ...testResults, 
        [testId]: { status: Math.random() > 0.5 ? 'pass' : 'fail', duration: Math.random() * 1000 } as any
      })
    }, 1000)
  }

  const handleRunModule = (moduleId: string) => {
    // Lancer tous les tests d'un module
    console.log('Running module:', moduleId)
  }

  // Wrapper pour setTestResults qui accepte des fonctions
  const setTestResultsWrapper = (resultsOrUpdater: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => {
    if (typeof resultsOrUpdater === 'function') {
      setTestResults(resultsOrUpdater(testResults))
    } else {
      setTestResults(resultsOrUpdater)
    }
  }

  // Afficher un loader si pas prêt
  if (!isReady) {
    return <LoadingFallback />
  }

  // Debug: vérifier si la bulle devrait être visible
  console.log('🔍 Debug bulle:', {
    isFocusMode,
    currentView,
    shouldShowBubble: !isFocusMode && currentView !== 'test-lab'
  })

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
            {currentView === 'myday' && <MyDayPage />}
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'ai' && <AIAssistant />}
            {currentView === 'learning' && <LearningPage />}
            {currentView === 'library' && <LibraryPage />}
            {currentView === 'pomodoro' && <PomodoroPage />}
            {currentView === 'settings' && <SettingsPage />}
            {currentView === 'test-lab' && <TestLabPage />}
            {currentView === 'widget-showcase' && <WidgetShowcase />}
          </>
        )}
      </Suspense>

      {/* Composants globaux - toujours chargés */}
      <KeyboardShortcuts />
      <SearchWidget />
      <ToastContainer />
      <Confetti trigger={showConfetti} />
      <OfflineIndicator />

      {/* Test Lab Floating Bubble - Visible partout sauf en mode focus et sur la page Test Lab */}
      {!isFocusMode && currentView !== 'test-lab' && (
        <>
          <TestLabFloatingBubble
            onOpenQuickView={() => {
              console.log('📱 Ouverture tiny window')
              setShowTestLabQuick(true)
            }}
          />
          <TestLabTinyWindow
            isOpen={showTestLabQuick}
            onClose={() => {
              console.log('❌ Fermeture tiny window')
              setShowTestLabQuick(false)
            }}
            onOpenFullLab={() => {
              console.log('🔬 Ouverture Test Lab complet')
              setShowTestLabQuick(false)
              setView('test-lab')
            }}
            testResults={testResults}
            onRunTest={handleRunTest}
            onRunModule={handleRunModule}
            setTestResults={setTestResultsWrapper}
          />
        </>
      )}
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
