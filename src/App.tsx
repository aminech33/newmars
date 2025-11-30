import { useState, useEffect } from 'react'
import { useStore } from './store/useStore'
import { HubV2 } from './components/HubV2'
import { TasksPage } from './components/tasks/TasksPage'
import { CalendarPage } from './components/calendar/CalendarPage'
import { HealthPage } from './components/health/HealthPage'
import { JournalPage } from './components/journal/JournalPage'
import { ProjectsPage } from './components/projects/ProjectsPage'
import { Dashboard } from './components/Dashboard'
import { AIAssistant } from './components/AIAssistant'
import { KeyboardShortcuts } from './components/KeyboardShortcuts'
import { CommandPalette } from './components/CommandPalette'
import { ToastContainer } from './components/ToastContainer'
import { QuickAdd } from './components/QuickAdd'
import { FocusMode } from './components/FocusMode'
import { Confetti } from './components/Confetti'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  const currentView = useStore((state) => state.currentView)
  const isFocusMode = useStore((state) => state.isFocusMode)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    const handleTaskCompleted = () => {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 100)
    }

    window.addEventListener('task-completed', handleTaskCompleted)
    return () => window.removeEventListener('task-completed', handleTaskCompleted)
  }, [])

  return (
    <ErrorBoundary>
      <div className="h-full w-full bg-mars-bg noise-bg overflow-hidden">
        {isFocusMode ? (
          <FocusMode />
        ) : (
          <>
            {currentView === 'hub' && <HubV2 />}
            {currentView === 'tasks' && <TasksPage />}
            {currentView === 'calendar' && <CalendarPage />}
            {currentView === 'health' && <HealthPage />}
            {currentView === 'journal' && <JournalPage />}
            {currentView === 'projects' && <ProjectsPage />}
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'ai' && <AIAssistant />}

            <KeyboardShortcuts />
            <CommandPalette />
            <ToastContainer />
            <QuickAdd />
            <Confetti trigger={showConfetti} />
          </>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default App
