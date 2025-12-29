/**
 * 📝 JournalTab - Onglet Journal de Ma Journée
 */

import { 
  Feather, 
  Check, 
  Sparkles,
  BookOpen,
  Heart,
  Plus
} from 'lucide-react'
import { MoodEmoji } from '../../types/journal'
import { Habit, Task } from '../../store/useStore'
import { TasksMetricsCard } from './TasksMetricsCard'
import { PomodoroMetricsCard } from './PomodoroMetricsCard'

interface JournalTabProps {
  // Journal states
  intention: string
  setIntention: (value: string) => void
  mood: MoodEmoji
  setMood: (mood: MoodEmoji) => void
  
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
  todayCompleted: number
  pomodoroSessions: any[]
  
  // Habit handlers
  handleToggleHabit: (habitId: string) => void
  setShowAddHabitModal: (show: boolean) => void
}

export function JournalTab({
  intention,
  setIntention,
  mood,
  setMood,
  handleSave,
  canSave,
  isSaving,
  hasChanges,
  setShowHistoryModal,
  habits,
  tasks,
  today,
  todayCompleted,
  pomodoroSessions,
  handleToggleHabit,
  setShowAddHabitModal
}: JournalTabProps) {
  
  const moods: MoodEmoji[] = ['😢', '😐', '🙂', '😊', '🤩']
  
  return (
    <div className="px-6 py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* ===== 1. MÉTRIQUES EN HAUT ===== */}
        <section className="space-y-4" aria-label="Métriques de productivité">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center border border-violet-500/20" aria-hidden="true">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-medium text-zinc-200">
                Mes efforts aujourd'hui
              </h2>
              <p className="text-sm text-zinc-500">
                💡 Médite sur ces données avant d'écrire
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            <TasksMetricsCard tasks={tasks} />
            <PomodoroMetricsCard pomodoroSessions={pomodoroSessions} tasks={tasks} />
          </div>
        </section>

        <div className="h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />

        {/* ===== 2. JOURNALING LIBRE ===== */}
        <section className="space-y-4" aria-label="Zone d'écriture libre">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center border border-amber-500/20" aria-hidden="true">
              <Feather className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-medium text-zinc-200">
                Comment s'est passée ta journée ?
              </h2>
              <p className="text-sm text-zinc-500">
                Réflexions, apprentissages, gratitudes...
              </p>
            </div>
          </div>
          
          <textarea
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="Écris librement ce qui te vient à l'esprit..."
            rows={8}
            className="w-full bg-zinc-900/50 border-2 border-zinc-800 focus:border-amber-500/40 rounded-xl px-5 py-4 text-zinc-200 placeholder:text-zinc-600 focus:outline-none transition-all resize-none font-serif leading-relaxed text-base"
            autoFocus
            aria-label="Écriture libre de journal"
          />
        </section>

        {/* ===== 3. HUMEUR ===== */}
        <section className="text-center py-4" aria-label="Sélection d'humeur">
          <p className="text-sm text-zinc-500 mb-4">Comment te sens-tu ?</p>
          <div className="flex items-center justify-center gap-4" role="group" aria-label="Choix d'humeur">
            {moods.map((m, index) => {
              const moodLabels = ['Très triste', 'Triste', 'Neutre', 'Heureux', 'Très heureux']
              return (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`text-3xl transition-all duration-200 ${
                    mood === m 
                      ? 'scale-125 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' 
                      : 'opacity-40 hover:opacity-80 hover:scale-110 grayscale hover:grayscale-0'
                  }`}
                  aria-label={moodLabels[index]}
                  aria-pressed={mood === m}
                >
                  {m}
                </button>
              )
            })}
          </div>
        </section>

        {/* ===== 4. RITUELS (COLLAPSIBLE) ===== */}
        {habits.length > 0 ? (
          <details 
            className="group" 
            aria-label="Rituels quotidiens"
            onKeyDown={(e) => {
              if (e.key === 'Escape' && e.currentTarget.open) {
                e.currentTarget.open = false
              }
            }}
          >
            <summary className="cursor-pointer list-none" aria-label={`Rituels: ${todayCompleted} sur ${habits.length} accomplis`}>
              <div className="flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all">
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-rose-400" aria-hidden="true" />
                  <span className="font-medium text-zinc-300">
                    Rituels ({todayCompleted}/{habits.length})
                  </span>
                </div>
                <span className="text-zinc-500 group-open:rotate-180 transition-transform" aria-hidden="true">▼</span>
              </div>
            </summary>
            
            <div className="mt-3 space-y-3">
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
              <button
                onClick={() => setShowAddHabitModal(true)}
                className="w-full py-2.5 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 rounded-xl text-sm text-zinc-400 hover:text-amber-400 transition-all flex items-center justify-center gap-2"
                aria-label="Ajouter un nouveau rituel"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                Ajouter un rituel
              </button>
            </div>
          </details>
        ) : (
          <button
            onClick={() => setShowAddHabitModal(true)}
            className="w-full p-5 bg-zinc-900/30 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:text-amber-400 hover:border-amber-500/30 transition-all flex items-center justify-center gap-2"
            aria-label="Créer un premier rituel quotidien"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium">Créer un premier rituel</span>
          </button>
        )}

        {/* ===== 5. BOUTON SAUVEGARDER ===== */}
        <button
          onClick={handleSave}
          disabled={!canSave || isSaving}
          className={`w-full py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-base font-medium ${
            canSave && !isSaving
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-900 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
          aria-label={isSaving ? 'Sauvegarde en cours' : hasChanges ? 'Sauvegarder le journal' : 'Journal sauvegardé'}
        >
          {isSaving ? 'Sauvegarde...' : hasChanges ? <><Feather className="w-4 h-4" aria-hidden="true" />Sauvegarder</> : <><Check className="w-4 h-4" aria-hidden="true" />Sauvegardé</>}
        </button>

        {/* Historique complet */}
        <button
          onClick={() => setShowHistoryModal(true)}
          className="w-full py-3 bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 transition-all flex items-center justify-center gap-2"
          aria-label="Voir l'historique complet du journal"
        >
          <BookOpen className="w-4 h-4" aria-hidden="true" />
          Voir l'historique complet
        </button>
        
      </div>
    </div>
  )
}

