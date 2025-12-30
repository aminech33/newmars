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
import { useState, useEffect, useMemo } from 'react'
import { MoodEmoji } from '../../types/journal'
import { Habit, Task } from '../../store/useStore'
import { TasksMetricsCard } from './TasksMetricsCard'
import { PomodoroMetricsCard } from './PomodoroMetricsCard'
import { useStore } from '../../store/useStore'
import { getMemoryFromYearsAgo } from '../../utils/journalUtils'

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
  
  const moods: MoodEmoji[] = ['😢', '🙃', '🙂', '😊', '😍']
  const journalEntries = useStore(state => state.journalEntries)
  
  // Prompts rotatifs inspirants
  const journalPrompts = [
    "Qu'est-ce qui compte vraiment aujourd'hui ?",
    "Aujourd'hui, j'ai appris que...",
    "Je suis reconnaissant pour...",
    "Mon plus grand défi était...",
    "Ce qui m'a surpris aujourd'hui...",
    "Si je devais retenir une chose...",
    "Demain, je veux...",
    "Ce moment où j'ai ressenti...",
  ]
  
  const [currentPrompt, setCurrentPrompt] = useState(journalPrompts[0])
  
  useEffect(() => {
    // Changer le prompt toutes les 8 secondes si le textarea est vide
    if (intention.length === 0) {
      const interval = setInterval(() => {
        setCurrentPrompt(prev => {
          const currentIndex = journalPrompts.indexOf(prev)
          return journalPrompts[(currentIndex + 1) % journalPrompts.length]
        })
      }, 8000)
      return () => clearInterval(interval)
    }
  }, [intention])
  
  // Souvenir "Il y a X ans"
  const memory = useMemo(() => getMemoryFromYearsAgo(journalEntries), [journalEntries, today])
  
  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Layout 2 colonnes : Journaling à gauche, Métriques à droite */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-8">
          
          {/* ===== COLONNE GAUCHE : JOURNALING ===== */}
          <div className="space-y-8">
            
            {/* ===== SOUVENIR "IL Y A X ANS" ===== */}
            {memory && (
              <section className="p-4 bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-violet-300 mb-1">
                      Il y a {Math.floor((new Date().getTime() - new Date(memory.date).getTime()) / (1000 * 60 * 60 * 24 * 365))} an{Math.floor((new Date().getTime() - new Date(memory.date).getTime()) / (1000 * 60 * 60 * 24 * 365)) > 1 ? 's' : ''} aujourd'hui...
                    </p>
                    <p className="text-sm text-zinc-400 line-clamp-2">
                      {memory.intention || memory.mainGoal || memory.reflection}
                    </p>
                    <button
                      onClick={() => setShowHistoryModal(true)}
                      className="text-xs text-violet-400 hover:text-violet-300 mt-1 transition-colors"
                    >
                      Relire cette entrée →
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* ===== 1. JOURNALING LIBRE ===== */}
            <section className="space-y-4" aria-label="Zone d'écriture libre">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center border border-amber-500/20" aria-hidden="true">
                  <Feather className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-zinc-200">
                    Comment s'est passée ta journée ?
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Réflexions, apprentissages, gratitudes...
                  </p>
                </div>
              </div>
              
              <div className="relative">
                <textarea
                  value={intention}
                  onChange={(e) => {
                    if (e.target.value.length <= 10000) {
                      setIntention(e.target.value)
                    }
                  }}
                  placeholder={currentPrompt}
                  rows={12}
                  className="w-full bg-zinc-900/50 border-2 border-zinc-800 focus:border-amber-500/40 rounded-xl px-5 py-4 pb-10 text-zinc-200 placeholder:text-zinc-600 focus:outline-none transition-all resize-none leading-relaxed text-[18px]"
                  autoFocus
                  aria-label="Écriture libre de journal"
                  maxLength={10000}
                />
                <div className="absolute bottom-3 right-4 flex items-center gap-2 text-xs">
                  <span className={`${
                    intention.length === 0 ? 'text-zinc-700' :
                    intention.length < 10 ? 'text-rose-500/60' :
                    intention.length < 100 ? 'text-amber-500/60' :
                    intention.length > 9000 ? 'text-rose-500/60' :
                    'text-zinc-600'
                  }`}>
                    {intention.length} / 10 000
                  </span>
                  {intention.length > 0 && intention.length < 10 && (
                    <span className="text-rose-500/40">
                      (min. 10 requis)
                    </span>
                  )}
                  {intention.length >= 10 && intention.length < 100 && (
                    <span className="text-amber-500/40">
                      (min. 100 recommandé)
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* ===== 2. HUMEUR ===== */}
            <section className="text-center py-4" aria-label="Sélection d'humeur">
              <p className="text-sm text-zinc-500 mb-4">Comment te sens-tu ?</p>
              <div className="flex items-center justify-center gap-4" role="group" aria-label="Choix d'humeur">
                {moods.map((m, index) => {
                  const moodLabels = ['Très triste', 'Mitigé', 'Content', 'Heureux', 'Amoureux']
                  const moodDescriptions = [
                    'Journée très difficile',
                    'Journée en demi-teinte',
                    'Bonne journée',
                    'Très bonne journée',
                    'Journée remplie d\'amour'
                  ]
                  return (
                    <button
                      key={m}
                      onClick={() => setMood(m)}
                      title={`${moodLabels[index]} - ${moodDescriptions[index]}`}
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

            {/* ===== 3. RITUELS (COLLAPSIBLE) ===== */}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            {/* ===== 4. BOUTON SAUVEGARDER ===== */}
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
              className="w-full py-3 bg-zinc-800/80 hover:bg-zinc-800 border-2 border-zinc-700 hover:border-amber-500/30 rounded-xl text-sm text-zinc-300 hover:text-amber-400 transition-all flex items-center justify-center gap-2 group"
              aria-label="Voir l'historique complet du journal"
            >
              <BookOpen className="w-4 h-4 group-hover:text-amber-400 transition-colors" aria-hidden="true" />
              <span>Voir l'historique complet</span>
            </button>
            
          </div>
          
          {/* ===== COLONNE DROITE : MÉTRIQUES ===== */}
          <div className="space-y-6 lg:sticky lg:top-8 lg:self-start">
            <section className="space-y-4" aria-label="Métriques de productivité">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center border border-violet-500/20" aria-hidden="true">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-base font-medium text-zinc-200">
                    Mes efforts aujourd'hui
                  </h2>
                  <p className="text-xs text-zinc-500">
                    💡 Médite sur ces données
                  </p>
                </div>
              </div>
              
              <div className="space-y-4 animate-fade-in">
                <TasksMetricsCard tasks={tasks} />
                <PomodoroMetricsCard pomodoroSessions={pomodoroSessions} tasks={tasks} />
              </div>
            </section>
          </div>
          
        </div>
      </div>
    </div>
  )
}

