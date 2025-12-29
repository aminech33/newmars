/**
 * 📋 TasksHeader - Header de la page Tasks avec navigation et actions
 */

import { ArrowLeft, Plus, Sparkles, Timer, ListTodo, FolderKanban } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Tooltip } from '../ui/Tooltip'
import { fontStack } from './taskUtils'

type TasksTab = 'tasks' | 'focus'

interface ProgressionStats {
  currentPhase: number
  totalPhases: number
  completedInCurrentPhase: number
  totalInCurrentPhase: number
  progressPercent: number
}

interface TasksHeaderProps {
  activeTab: TasksTab
  setActiveTab: (tab: TasksTab) => void
  progressionStats: ProgressionStats | null
  planningStep: 'none' | 'define' | 'plan'
  setPlanningStep: (step: 'none' | 'define' | 'plan') => void
  setShowQuickAdd: (show: boolean) => void
}

export function TasksHeader({
  activeTab,
  setActiveTab,
  progressionStats,
  planningStep,
  setPlanningStep,
  setShowQuickAdd
}: TasksHeaderProps) {
  const { setView } = useStore()
  
  return (
    <header className="flex items-center gap-4 h-14 px-5 border-b border-zinc-800/40 bg-zinc-900/25 backdrop-blur-sm">
      <button
        onClick={() => setView('hub')}
        className="p-2 -ml-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-xl transition-all duration-150"
      >
        <ArrowLeft className="w-[18px] h-[18px]" />
      </button>
      
      {/* Onglets Tâches / Focus */}
      <div className="flex items-center gap-1 bg-zinc-800/40 rounded-lg p-0.5">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 flex items-center gap-1.5 ${
            activeTab === 'tasks'
              ? 'bg-zinc-700 text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span className="hidden sm:inline">Tâches</span>
        </button>
        <button
          onClick={() => setActiveTab('focus')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 flex items-center gap-1.5 ${
            activeTab === 'focus'
              ? 'bg-red-500/20 text-red-400'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Timer className="w-4 h-4" />
          <span className="hidden sm:inline">Focus</span>
        </button>
      </div>
      
      <div className="flex-1" />
      
      {/* Bouton Gestion des projets */}
      <button
        onClick={() => setView('projects')}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 rounded-lg text-blue-400 hover:text-blue-300 text-sm font-medium transition-all duration-150"
        title="Gérer mes projets"
      >
        <FolderKanban className="w-4 h-4" />
        <span className="hidden md:inline">Projets</span>
      </button>
      
      {/* Timeline de progression (si projet avec phases) */}
      {activeTab === 'tasks' && progressionStats && (
        <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-zinc-800/40 rounded-lg border border-zinc-700/50">
          <div className="flex items-center gap-2">
            <span className={`text-[12px] font-medium text-zinc-400 ${fontStack}`}>
              Phase {progressionStats.currentPhase}/{progressionStats.totalPhases}
            </span>
            <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                style={{ width: `${progressionStats.progressPercent}%` }}
              />
            </div>
            <span className={`text-[11px] text-zinc-500 tabular-nums ${fontStack}`}>
              {progressionStats.progressPercent}%
            </span>
          </div>
          <div className={`text-[11px] text-zinc-600 ${fontStack}`}>
            {progressionStats.completedInCurrentPhase}/{progressionStats.totalInCurrentPhase}
          </div>
        </div>
      )}
      
      {activeTab === 'tasks' && (
        <>
          <Tooltip content="Créer un projet d'apprentissage" side="bottom">
            <button
              onClick={() => setPlanningStep('define')}
              disabled={planningStep !== 'none'}
              className={`h-10 px-4 ${planningStep !== 'none' ? 'text-indigo-400 bg-indigo-500/20 border-indigo-500/50' : 'text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30'} border rounded-xl transition-all duration-150 text-[15px] font-medium flex items-center gap-2 active:scale-[0.98] ${fontStack}`}
            >
              <Sparkles className="w-[16px] h-[16px]" />
              <span className="hidden sm:inline">Nouveau projet</span>
            </button>
          </Tooltip>
          
          <Tooltip content="⌘N" side="bottom">
            <button
              onClick={() => setShowQuickAdd(true)}
              className={`h-10 px-4 text-zinc-100 bg-zinc-800/80 hover:bg-zinc-700/90 rounded-xl transition-all duration-150 text-[15px] font-medium flex items-center gap-2.5 active:scale-[0.98] hover:shadow-lg hover:shadow-black/20 ${fontStack}`}
            >
              <Plus className="w-[18px] h-[18px]" />
              <span className="hidden sm:inline">Nouvelle tâche</span>
            </button>
          </Tooltip>
        </>
      )}
    </header>
  )
}


