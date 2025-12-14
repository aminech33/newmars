import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Sparkles } from 'lucide-react'
import { useStore, Task, TaskCategory } from '../../store/useStore'
import { TaskList } from './TaskList'
import { TaskDetails } from './TaskDetails'
import { TaskFAB } from './TaskFAB'
import { GenerateProjectFromIdea } from './GenerateProjectFromIdea'
import { Tooltip } from '../ui/Tooltip'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { autoCategorizeTasks, estimateTaskDuration, detectPriority, calculateFocusScore } from '../../utils/taskIntelligence'

export function TasksPage() {
  const { tasks, addTask, deleteTask, setView, selectedTaskId, setSelectedTaskId } = useStore()
  
  // States minimalistes
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<{ task: Task } | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  
  // Deep linking
  useEffect(() => {
    if (selectedTaskId) {
      const task = tasks.find(t => t.id === selectedTaskId)
      if (task) setSelectedTask(task)
      setSelectedTaskId(null)
    }
  }, [selectedTaskId, tasks, setSelectedTaskId])
  
  // Tri automatique : priorité + échéance (pas de filtre, pas de recherche)
  const sortedTasks = [...tasks].sort((a, b) => {
    const scoreA = calculateFocusScore(a)
    const scoreB = calculateFocusScore(b)
    return scoreB - scoreA
  })
  
  // Raccourci clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setShowQuickAdd(true)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])
  
  // Handler ajout rapide avec IA automatique
  const handleQuickAdd = () => {
    if (!newTaskTitle.trim()) return
    
    const category = autoCategorizeTasks(newTaskTitle)
    const estimatedTime = estimateTaskDuration(newTaskTitle)
    const priority = detectPriority(newTaskTitle)
    
    addTask({
      title: newTaskTitle,
      category: category as TaskCategory,
      priority,
      estimatedTime,
      completed: false,
      status: 'todo'
    })
    
    setNewTaskTitle('')
    setShowQuickAdd(false)
  }
  
  const handleDeleteWithUndo = (task: Task) => {
    setConfirmDelete({ task })
  }
  
  const confirmDeleteTask = () => {
    if (!confirmDelete) return
    deleteTask(confirmDelete.task.id)
    setConfirmDelete(null)
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at top right, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse 80% 50% at bottom left, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
          linear-gradient(to bottom, #0a0a1a 0%, #000 100%)
        `
      }}
    >
      {/* Header ultra-simplifié : seulement 3 actions */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/30">
        <button
          onClick={() => setView('hub')}
          className="p-1 text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        
        <h1 className="text-lg font-semibold text-white">Tâches</h1>
        
        <div className="flex-1" />
        
        {/* Bouton IA */}
        <Tooltip content="Planifier un projet" side="bottom">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-3 py-1.5 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Planifier
          </button>
        </Tooltip>
        
        {/* Bouton Ajouter */}
        <Tooltip content="Ctrl+N" side="bottom">
          <button
            onClick={() => setShowQuickAdd(true)}
            className="px-4 py-1.5 text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </Tooltip>
      </div>
      
      {/* Quick Add - Déplie sous le header */}
      {showQuickAdd && (
        <div className="px-4 py-3 bg-zinc-900/50 border-b border-zinc-800/30">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleQuickAdd()
              if (e.key === 'Escape') setShowQuickAdd(false)
            }}
            placeholder="Que veux-tu faire ?"
            className="w-full px-4 py-2 bg-zinc-800 text-zinc-200 placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
          <p className="text-xs text-zinc-600 mt-2">
            ✨ L'IA détectera automatiquement la priorité et catégorie
          </p>
        </div>
      )}
      
      {/* Liste unique priorisée automatiquement */}
      <div className="flex-1 overflow-hidden px-4 py-4">
        <TaskList
          tasks={sortedTasks}
          onTaskClick={setSelectedTask}
          onTaskDelete={handleDeleteWithUndo}
        />
      </div>
      
      {/* Task Details Panel */}
      {selectedTask && (
        <TaskDetails
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
      
      {/* FAB Mobile */}
      <TaskFAB onClick={() => setShowQuickAdd(true)} />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteTask}
        title="Supprimer la tâche ?"
        message={`Êtes-vous sûr de vouloir supprimer "${confirmDelete?.task.title}" ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />
      
      {/* Generate Project Modal */}
      <GenerateProjectFromIdea
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
      />
    </div>
  )
}
