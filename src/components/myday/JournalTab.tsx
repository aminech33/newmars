/**
 * 📝 JournalTab - Onglet Journal de Ma Journée
 */

import { useMemo } from 'react'
import { 
  Feather, 
  Check, 
  Sparkles,
  BookOpen,
  Heart,
  Plus,
  CheckCircle2,
  ExternalLink
} from 'lucide-react'
import { MoodEmoji } from '../../types/journal'
import { Habit, Task, JournalEntry } from '../../store/useStore'
import { TasksMetricsCard } from './TasksMetricsCard'
import { PomodoroMetricsCard } from './PomodoroMetricsCard'

interface JournalTabProps {
  // Journal states
  intention: string
  setIntention: (value: string) => void
  action: string
  setAction: (value: string) => void
  mood: MoodEmoji
  setMood: (mood: MoodEmoji) => void
  freeNotes: string
  setFreeNotes: (value: string) => void
  
  // Handlers
  handleSave: () => void
  canSave: boolean
  isSaving: boolean
  hasChanges: boolean
  setShowHistoryModal: (show: boolean) => void
  
  // Data
  habits: Habit[]
  tasks: Task[]
  today: string
  firstTask: Task | undefined
  priorityTask: Task | null
  todayCompleted: number
  pomodoroSessions: any[]
  
  // Habit handlers
  handleToggleHabit: (habitId: string) => void
  setShowAddHabitModal: (show: boolean) => void
  
  // Navigation
  setView: (view: string) => void
}

export function JournalTab({
  intention,
  setIntention,
  action,
  setAction,
  mood,
  setMood,
  freeNotes,
  setFreeNotes,
  handleSave,
  canSave,
  isSaving,
  hasChanges,
  setShowHistoryModal,
  habits,
  tasks,
  today,
  firstTask,
  priorityTask,
  todayCompleted,
  pomodoroSessions,
  handleToggleHabit,
  setShowAddHabitModal,
  setView
}: JournalTabProps) {
  
  const moods: MoodEmoji[] = ['😢', '😐', '🙂', '😊', '🤩']
  
  // Tâches accomplies aujourd'hui
  const tasksCompletedToday = useMemo(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    return tasks.filter(t => 
      t.completed && 
      t.createdAt >= todayStart.getTime()
    )
  }, [tasks])
  
  return (
    <div className="px-6 py-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* ===== COLONNE GAUCHE : JOURNAL (2/3) ===== */}
        <div className="xl:col-span-2 space-y-8">
      
      {/* INTENTION DU JOUR */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center border border-amber-500/20">
            <Feather className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-medium text-zinc-200">
              Intention du jour
            </h2>
            <p className="text-sm text-zinc-500">
              Qu'est-ce qui compte vraiment aujourd'hui ?
            </p>
          </div>
        </div>
        
        <input
          type="text"
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          placeholder="Écrire mon intention..."
          className="w-full bg-zinc-900/50 border-2 border-zinc-800 focus:border-amber-500/40 rounded-xl px-5 py-4 text-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-all font-serif italic"
          autoFocus
        />
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />

      {/* ACTION CONCRÈTE */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center border border-emerald-500/20">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="font-serif text-lg font-medium text-zinc-200">
            Première action
          </h2>
        </div>
        
        {firstTask && !action && (
          <button
            onClick={() => setAction(firstTask.title)}
            className="w-full text-left p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/10 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors">
                {firstTask.title}
              </span>
              {priorityTask && (
                <span className="ml-auto text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Prioritaire
                </span>
              )}
            </div>
          </button>
        )}

        <input
          type="text"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="Quelle est la première chose à faire ?"
          className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-emerald-500/40 rounded-xl px-5 py-3.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none transition-all"
        />
      </section>

      {/* HABITUDES */}
      {habits.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/10 flex items-center justify-center border border-rose-500/20">
                <Heart className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-medium text-zinc-200">
                  Rituels
                </h2>
                <p className="text-sm text-zinc-500">
                  {todayCompleted}/{habits.length} accomplis
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddHabitModal(true)}
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {habits.map((habit) => {
              const isCompleted = habit.completedDates.includes(today)
              return (
                <button
                  key={habit.id}
                  onClick={() => handleToggleHabit(habit.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                    isCompleted 
                      ? 'bg-emerald-500/10 border-2 border-emerald-500/30' 
                      : 'bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    isCompleted ? 'bg-emerald-500 text-white' : 'border-2 border-zinc-600'
                  }`}>
                    {isCompleted && <Check className="w-3 h-3" strokeWidth={3} />}
                  </div>
                  <span className={`text-sm font-medium truncate ${
                    isCompleted ? 'text-emerald-300' : 'text-zinc-400'
                  }`}>
                    {habit.name}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {habits.length === 0 && (
        <button
          onClick={() => setShowAddHabitModal(true)}
          className="w-full p-5 bg-zinc-900/30 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:text-amber-400 hover:border-amber-500/30 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Créer un premier rituel</span>
        </button>
      )}

      {/* NOTES LIBRES */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/10 flex items-center justify-center border border-sky-500/20">
            <BookOpen className="w-5 h-5 text-sky-400" />
          </div>
          <h2 className="font-serif text-lg font-medium text-zinc-200">
            Notes & réflexions
          </h2>
        </div>
        
        <textarea
          value={freeNotes}
          onChange={(e) => setFreeNotes(e.target.value)}
          placeholder="Pensées, gratitudes, apprentissages du jour..."
          rows={4}
          className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-sky-500/40 rounded-xl px-5 py-4 text-zinc-300 placeholder:text-zinc-600 focus:outline-none transition-all resize-none font-serif leading-relaxed"
        />
      </section>

      {/* TÂCHES ACCOMPLIES AUJOURD'HUI */}
      {tasksCompletedToday.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-medium text-zinc-200">
                  Tâches accomplies
                </h2>
                <p className="text-sm text-zinc-500">
                  {tasksCompletedToday.length} tâche{tasksCompletedToday.length > 1 ? 's' : ''} aujourd'hui
                </p>
              </div>
            </div>
            <button
              onClick={() => setView('tasks')}
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-emerald-400 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Voir tout
            </button>
          </div>
          
          <div className="space-y-2">
            {tasksCompletedToday.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
                <span className="text-sm text-emerald-300 line-through opacity-80">
                  {task.title}
                </span>
              </div>
            ))}
            {tasksCompletedToday.length > 5 && (
              <p className="text-xs text-zinc-500 text-center">
                +{tasksCompletedToday.length - 5} autres tâches
              </p>
            )}
          </div>
        </section>
      )}

      <div className="h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />

      {/* HUMEUR */}
      <section className="text-center py-4">
        <p className="text-sm text-zinc-500 mb-4">Comment te sens-tu ?</p>
        <div className="flex items-center justify-center gap-4">
          {moods.map((m) => (
            <button
              key={m}
              onClick={() => setMood(m)}
              className={`text-3xl transition-all duration-200 ${
                mood === m 
                  ? 'scale-125 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' 
                  : 'opacity-40 hover:opacity-80 hover:scale-110 grayscale hover:grayscale-0'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      {/* Bouton Sauvegarder */}
      <button
        onClick={handleSave}
        disabled={!canSave || isSaving}
        className={`w-full py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-base font-medium ${
          canSave && !isSaving
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-900 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5'
            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
        }`}
      >
        {isSaving ? 'Sauvegarde...' : hasChanges ? <><Feather className="w-4 h-4" />Sauvegarder</> : <><Check className="w-4 h-4" />Sauvegardé</>}
      </button>

      {/* Historique complet */}
      <button
        onClick={() => setShowHistoryModal(true)}
        className="w-full py-3 mt-4 bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 transition-all flex items-center justify-center gap-2"
      >
        <BookOpen className="w-4 h-4" />
        Voir l'historique complet
      </button>
    </div>

    {/* ===== COLONNE DROITE : MÉTRIQUES (1/3) ===== */}
    <div className="space-y-3">
      <TasksMetricsCard tasks={tasks} />
      <PomodoroMetricsCard pomodoroSessions={pomodoroSessions} tasks={tasks} />
    </div>

  </div>
</div>
  )
}

