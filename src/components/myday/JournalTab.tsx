/**
 * 📝 JournalTab - Onglet Journal de Ma Journée
 *
 * Version améliorée avec :
 * - Sections structurées (Gratitude, Apprentissage, Victoire)
 * - Dashboard avec mini-stats
 * - Indicateur auto-save visible
 */

import {
  Feather,
  Check,
  BookOpen,
  Heart,
  Plus,
  Sparkles,
  Tag,
  ChevronDown,
  Lightbulb,
  Trophy,
  Flame,
  Calendar,
  TrendingUp,
  Clock,
  FileText,
  Briefcase,
  Sun,
  Plane
} from 'lucide-react'
import { useMemo, useState, useEffect } from 'react'
import { MoodEmoji } from '../../types/journal'
import { PomodoroSession } from '../../types/pomodoro'
import { Habit, Task } from '../../store/useStore'
import { useStore } from '../../store/useStore'
import { getMemoryFromYearsAgo } from '../../utils/journalUtils'
import { useRotatingPrompt } from '../../hooks/useRotatingPrompt'
import { TagsInput } from '../ui/TagsInput'

// Tags suggérés par défaut
const SUGGESTED_TAGS = [
  'gratitude', 'apprentissage', 'objectif', 'reflexion',
  'victoire', 'defi', 'travail', 'famille', 'sante', 'sport'
]

// Templates de journée
const JOURNAL_TEMPLATES = [
  {
    id: 'work',
    name: 'Journée de travail',
    icon: Briefcase,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    prompts: {
      intention: "Aujourd'hui au travail, j'ai...",
      gratitude: "Je suis reconnaissant pour cette opportunité de...",
      learning: "J'ai appris que...",
      victory: "Ma plus grande réussite professionnelle aujourd'hui..."
    },
    tags: ['travail', 'productivité']
  },
  {
    id: 'weekend',
    name: 'Weekend / Repos',
    icon: Sun,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    prompts: {
      intention: "Ce moment de repos m'a permis de...",
      gratitude: "Je suis reconnaissant pour ce temps avec...",
      learning: "J'ai découvert que...",
      victory: "J'ai réussi à me reposer en..."
    },
    tags: ['repos', 'weekend']
  },
  {
    id: 'travel',
    name: 'Voyage / Sortie',
    icon: Plane,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    prompts: {
      intention: "Cette aventure m'a montré que...",
      gratitude: "Je suis reconnaissant d'avoir pu découvrir...",
      learning: "J'ai appris sur cette culture/cet endroit...",
      victory: "Le meilleur moment de cette journée..."
    },
    tags: ['voyage', 'découverte']
  },
  {
    id: 'reflection',
    name: 'Introspection',
    icon: BookOpen,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    prompts: {
      intention: "En ce moment, je ressens...",
      gratitude: "Malgré les défis, je suis reconnaissant pour...",
      learning: "J'ai compris quelque chose d'important sur moi...",
      victory: "J'ai fait un pas en avant en..."
    },
    tags: ['reflexion', 'introspection']
  }
]

interface JournalTabProps {
  // Journal states
  intention: string
  setIntention: (value: string) => void
  mood: MoodEmoji
  setMood: (mood: MoodEmoji) => void
  tags: string[]
  setTags: (tags: string[]) => void

  // Sections structurées
  gratitudeText?: string
  setGratitudeText?: (value: string) => void
  learningText?: string
  setLearningText?: (value: string) => void
  victoryText?: string
  setVictoryText?: (value: string) => void

  // Handlers
  handleSave: () => void
  canSave: boolean
  isSaving: boolean
  hasChanges: boolean
  setShowHistoryModal: (show: boolean) => void
  lastSavedAt?: number

  // Data
  habits: Habit[]
  tasks: Task[]
  today: string
  todayCompleted: number
  pomodoroSessions: PomodoroSession[]

  // Habit handlers
  handleToggleHabit: (habitId: string) => void
  setShowAddHabitModal: (show: boolean) => void
}

// Composant Section repliable
function CollapsibleSection({
  icon: Icon,
  iconColor,
  title,
  placeholder,
  value,
  onChange,
  isOpen,
  onToggle
}: {
  icon: React.ElementType
  iconColor: string
  title: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden transition-all">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${iconColor} flex items-center justify-center`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="font-medium text-zinc-300">{title}</span>
          {value && !isOpen && (
            <span className="text-xs text-zinc-500 ml-2">({value.length} car.)</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full bg-zinc-900/50 border border-zinc-700 focus:border-zinc-600 rounded-lg px-4 py-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none transition-all resize-none text-sm leading-relaxed"
            maxLength={2000}
          />
        </div>
      )}
    </div>
  )
}

// Composant Mini-stat card
function MiniStat({
  icon: Icon,
  label,
  value,
  subtext,
  color
}: {
  icon: React.ElementType
  label: string
  value: string | number
  subtext?: string
  color: string
}) {
  return (
    <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-semibold text-zinc-100">{value}</p>
          <p className="text-xs text-zinc-500">{label}</p>
          {subtext && <p className="text-xs text-zinc-600 mt-0.5">{subtext}</p>}
        </div>
      </div>
    </div>
  )
}

export function JournalTab({
  intention,
  setIntention,
  mood,
  setMood,
  tags,
  setTags,
  gratitudeText = '',
  setGratitudeText,
  learningText = '',
  setLearningText,
  victoryText = '',
  setVictoryText,
  handleSave,
  canSave,
  isSaving,
  hasChanges,
  setShowHistoryModal,
  lastSavedAt,
  habits,
  tasks: _tasks,
  today,
  todayCompleted,
  pomodoroSessions: _pomodoroSessions,
  handleToggleHabit,
  setShowAddHabitModal
}: JournalTabProps) {

  const moods: MoodEmoji[] = ['😢', '🙃', '🙂', '😊', '😍']
  const journalEntries = useStore(state => state.journalEntries)

  // Sections repliables state
  const [openSections, setOpenSections] = useState<{ gratitude: boolean; learning: boolean; victory: boolean }>({
    gratitude: false,
    learning: false,
    victory: false
  })

  // Auto-save indicator
  const [autoSaveText, setAutoSaveText] = useState<string | null>(null)
  // Template selector
  const [showTemplates, setShowTemplates] = useState(false)

  useEffect(() => {
    if (lastSavedAt) {
      setAutoSaveText('Sauvegardé')
      const timer = setTimeout(() => setAutoSaveText(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [lastSavedAt])

  // Appliquer un template
  const applyTemplate = (templateId: string) => {
    const template = JOURNAL_TEMPLATES.find(t => t.id === templateId)
    if (!template) return

    // Pré-remplir les champs avec les prompts du template
    if (!intention) setIntention(template.prompts.intention)
    if (!gratitudeText && setGratitudeText) {
      setGratitudeText(template.prompts.gratitude)
      setOpenSections(prev => ({ ...prev, gratitude: true }))
    }
    if (!learningText && setLearningText) {
      setLearningText(template.prompts.learning)
      setOpenSections(prev => ({ ...prev, learning: true }))
    }
    if (!victoryText && setVictoryText) {
      setVictoryText(template.prompts.victory)
      setOpenSections(prev => ({ ...prev, victory: true }))
    }
    // Ajouter les tags du template
    if (template.tags.length > 0) {
      const newTags = [...new Set([...tags, ...template.tags])]
      setTags(newTags)
    }
    setShowTemplates(false)
  }

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

  const currentPrompt = useRotatingPrompt(journalPrompts, intention.length === 0, 8000)

  // Souvenir "Il y a X ans"
  const memory = useMemo(() => getMemoryFromYearsAgo(journalEntries), [journalEntries])

  // Calcul des mini-stats
  const stats = useMemo(() => {
    const thisMonth = journalEntries.filter(e => {
      const entryDate = new Date(e.date)
      const now = new Date()
      return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear()
    }).length

    // Streak calculation
    let streak = 0
    const sortedDates = [...new Set(journalEntries.map(e => e.date))].sort().reverse()
    const todayStr = new Date().toISOString().split('T')[0]
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    if (sortedDates.includes(todayStr) || sortedDates.includes(yesterdayStr)) {
      let checkDate = new Date(sortedDates.includes(todayStr) ? todayStr : yesterdayStr)
      for (let i = 0; i < 365; i++) {
        const dateStr = checkDate.toISOString().split('T')[0]
        if (sortedDates.includes(dateStr)) {
          streak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }
    }

    // Mood moyen ce mois
    const thisMonthEntries = journalEntries.filter(e => {
      const entryDate = new Date(e.date)
      const now = new Date()
      return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear()
    })
    const moodValues: Record<MoodEmoji, number> = { '😢': 1, '🙃': 2, '🙂': 3, '😊': 4, '😍': 5 }
    const avgMood = thisMonthEntries.length > 0
      ? thisMonthEntries.reduce((acc, e) => acc + (moodValues[e.moodEmoji as MoodEmoji] || 3), 0) / thisMonthEntries.length
      : 0

    // Graphique humeur des 7 derniers jours
    const last7Days: { date: string; mood: number; emoji: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const entry = journalEntries.find(e => e.date === dateStr)
      last7Days.push({
        date: dateStr,
        mood: entry ? moodValues[entry.moodEmoji as MoodEmoji] || 3 : 0,
        emoji: entry?.moodEmoji || ''
      })
    }

    // Nuage de tags (top 8)
    const tagCounts: Record<string, number> = {}
    journalEntries.forEach(e => {
      e.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)

    return {
      totalEntries: journalEntries.length,
      thisMonth,
      streak,
      avgMood: avgMood.toFixed(1),
      last7Days,
      topTags
    }
  }, [journalEntries])

  const toggleSection = (section: 'gratitude' | 'learning' | 'victory') => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="max-w-7xl mx-auto">

        {/* Layout 2 colonnes : Journal à gauche, Dashboard à droite */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-8">

          {/* ===== COLONNE GAUCHE : JOURNALING ===== */}
          <div className="space-y-6">

            {/* ===== TEMPLATES DE JOURNÉE ===== */}
            {!intention && (
              <section className="space-y-3">
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Utiliser un template</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
                </button>

                {showTemplates && (
                  <div className="grid grid-cols-2 gap-2 animate-fade-in">
                    {JOURNAL_TEMPLATES.map((template) => {
                      const Icon = template.icon
                      return (
                        <button
                          key={template.id}
                          onClick={() => applyTemplate(template.id)}
                          className={`flex items-center gap-3 p-3 ${template.bgColor} border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all text-left group`}
                        >
                          <Icon className={`w-5 h-5 ${template.color}`} />
                          <div>
                            <p className="text-sm font-medium text-zinc-200 group-hover:text-white">{template.name}</p>
                            <p className="text-xs text-zinc-500">{template.tags.map(t => `#${t}`).join(' ')}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center border border-amber-500/20" aria-hidden="true">
                    <Feather className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-medium text-zinc-200">
                      Comment s'est passée ta journée ?
                    </h2>
                    <p className="text-sm text-zinc-500">
                      Réflexions, pensées, moments importants...
                    </p>
                  </div>
                </div>

                {/* Indicateur auto-save */}
                {autoSaveText && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full animate-fade-in">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-emerald-400">{autoSaveText}</span>
                  </div>
                )}
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
                  rows={8}
                  className="w-full bg-zinc-900/50 border-2 border-zinc-800 focus:border-amber-500/40 rounded-xl px-5 py-4 pb-10 text-zinc-200 placeholder:text-zinc-600 focus:outline-none transition-all resize-none leading-relaxed text-base"
                  autoFocus
                  aria-label="Écriture libre de journal"
                  maxLength={10000}
                />
                <div className="absolute bottom-3 right-4 flex items-center gap-2 text-sm">
                  <span className={`${intention.length === 0 ? 'text-zinc-700' :
                    intention.length < 10 ? 'text-rose-500/60' :
                      intention.length < 100 ? 'text-amber-500/60' :
                        intention.length > 9000 ? 'text-rose-500/60' :
                          'text-zinc-600'
                    }`}>
                    {intention.length.toLocaleString()} / 10 000
                  </span>
                </div>
              </div>
            </section>

            {/* ===== 2. SECTIONS STRUCTURÉES ===== */}
            {(setGratitudeText || setLearningText || setVictoryText) && (
              <section className="space-y-3" aria-label="Sections de réflexion">
                <p className="text-sm text-zinc-500 px-1">Sections optionnelles</p>

                {setGratitudeText && (
                  <CollapsibleSection
                    icon={Heart}
                    iconColor="bg-rose-500/20 text-rose-400"
                    title="Gratitude"
                    placeholder="Je suis reconnaissant pour..."
                    value={gratitudeText}
                    onChange={setGratitudeText}
                    isOpen={openSections.gratitude}
                    onToggle={() => toggleSection('gratitude')}
                  />
                )}

                {setLearningText && (
                  <CollapsibleSection
                    icon={Lightbulb}
                    iconColor="bg-amber-500/20 text-amber-400"
                    title="Apprentissage"
                    placeholder="Aujourd'hui j'ai appris..."
                    value={learningText}
                    onChange={setLearningText}
                    isOpen={openSections.learning}
                    onToggle={() => toggleSection('learning')}
                  />
                )}

                {setVictoryText && (
                  <CollapsibleSection
                    icon={Trophy}
                    iconColor="bg-emerald-500/20 text-emerald-400"
                    title="Victoire du jour"
                    placeholder="Ma victoire aujourd'hui..."
                    value={victoryText}
                    onChange={setVictoryText}
                    isOpen={openSections.victory}
                    onToggle={() => toggleSection('victory')}
                  />
                )}
              </section>
            )}

            {/* ===== 3. HUMEUR ===== */}
            <section className="text-center py-4 bg-zinc-900/30 rounded-xl border border-zinc-800" aria-label="Sélection d'humeur">
              <p className="text-sm text-zinc-500 mb-4">Comment te sens-tu ?</p>
              <div className="flex items-center justify-center gap-4" role="group" aria-label="Choix d'humeur">
                {moods.map((m, index) => {
                  const moodLabels = ['Très triste', 'Mitigé', 'Content', 'Heureux', 'Amoureux']
                  return (
                    <button
                      key={m}
                      onClick={() => setMood(m)}
                      title={moodLabels[index]}
                      className={`text-3xl transition-all duration-200 p-2 rounded-xl ${mood === m
                        ? 'scale-125 bg-amber-500/10 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
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

            {/* ===== 4. TAGS ===== */}
            <section className="space-y-3" aria-label="Tags de l'entrée">
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span className="text-sm text-zinc-400">Tags</span>
              </div>
              <TagsInput
                tags={tags}
                onChange={setTags}
                placeholder="Ajouter un tag..."
                maxTags={5}
                suggestedTags={SUGGESTED_TAGS}
              />
            </section>

            {/* ===== 5. RITUELS ===== */}
            {habits.length > 0 ? (
              <section className="space-y-3" aria-label="Rituels quotidiens">
                <div className="flex items-center gap-3 p-3 bg-zinc-900/30 border border-zinc-800 rounded-xl">
                  <Heart className="w-4 h-4 text-rose-400" aria-hidden="true" />
                  <span className="text-sm font-medium text-zinc-300">
                    Rituels ({todayCompleted}/{habits.length})
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {habits.map((habit) => {
                    const isCompleted = habit.completedDates.includes(today)
                    return (
                      <button
                        key={habit.id}
                        onClick={() => handleToggleHabit(habit.id)}
                        className={`flex items-center gap-2 p-3 rounded-xl transition-all text-sm ${isCompleted
                          ? 'bg-emerald-500/10 border border-emerald-500/30'
                          : 'bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700'
                          }`}
                      >
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-emerald-500 text-white' : 'border-2 border-zinc-600'
                          }`}>
                          {isCompleted && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                        </div>
                        <span className={`truncate ${isCompleted ? 'text-emerald-300' : 'text-zinc-400'}`}>
                          {habit.name}
                        </span>
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setShowAddHabitModal(true)}
                    className="flex items-center justify-center gap-1.5 p-3 bg-zinc-900/50 border border-dashed border-zinc-700 hover:border-amber-500/30 rounded-xl text-sm text-zinc-500 hover:text-amber-400 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter
                  </button>
                </div>
              </section>
            ) : (
              <button
                onClick={() => setShowAddHabitModal(true)}
                className="w-full p-4 bg-zinc-900/30 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:text-amber-400 hover:border-amber-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Créer un premier rituel</span>
              </button>
            )}

            {/* ===== 6. BOUTON SAUVEGARDER ===== */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleSave}
                disabled={!canSave || isSaving}
                className={`w-full py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-base font-medium ${canSave && !isSaving
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-900 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
              >
                {isSaving ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : hasChanges ? (
                  <>
                    <Feather className="w-4 h-4" />
                    Sauvegarder
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Sauvegardé
                  </>
                )}
              </button>

              <button
                onClick={() => setShowHistoryModal(true)}
                className="w-full py-3 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-500/30 rounded-xl text-sm text-zinc-400 hover:text-amber-400 transition-all flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Voir l'historique
              </button>
            </div>

          </div>

          {/* ===== COLONNE DROITE : DASHBOARD ===== */}
          <div className="space-y-4 lg:sticky lg:top-8 lg:self-start">

            {/* Header Dashboard */}
            <div className="flex items-center gap-2 px-1">
              <TrendingUp className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-400">Ton journal</span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <MiniStat
                icon={Flame}
                label="Série actuelle"
                value={stats.streak}
                subtext={stats.streak > 0 ? "jours consécutifs" : "Commence aujourd'hui !"}
                color="bg-orange-500/20 text-orange-400"
              />
              <MiniStat
                icon={Calendar}
                label="Ce mois"
                value={stats.thisMonth}
                subtext="entrées"
                color="bg-indigo-500/20 text-indigo-400"
              />
            </div>

            {/* Mood moyen */}
            {Number(stats.avgMood) > 0 && (
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                <p className="text-xs text-zinc-500 mb-2">Humeur moyenne ce mois</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {Number(stats.avgMood) <= 1.5 ? '😢' :
                      Number(stats.avgMood) <= 2.5 ? '🙃' :
                        Number(stats.avgMood) <= 3.5 ? '🙂' :
                          Number(stats.avgMood) <= 4.5 ? '😊' : '😍'}
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-zinc-200">{stats.avgMood}/5</p>
                    <p className="text-xs text-zinc-500">
                      {Number(stats.avgMood) >= 4 ? 'Excellent !' :
                        Number(stats.avgMood) >= 3 ? 'Ça va bien' :
                          Number(stats.avgMood) >= 2 ? 'En demi-teinte' : 'Période difficile'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Total entrées */}
            <div className="p-4 bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-400/60 mb-1">Total des entrées</p>
                  <p className="text-2xl font-bold text-amber-400">{stats.totalEntries}</p>
                </div>
                <BookOpen className="w-8 h-8 text-amber-500/30" />
              </div>
            </div>

            {/* Encouragement */}
            <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl">
              <p className="text-sm text-zinc-400 leading-relaxed">
                {stats.streak === 0 && "Écris quelques lignes aujourd'hui pour commencer ta série !"}
                {stats.streak === 1 && "Super début ! Continue demain pour maintenir ta série."}
                {stats.streak >= 2 && stats.streak < 7 && `${stats.streak} jours de suite ! Tu construis une belle habitude.`}
                {stats.streak >= 7 && stats.streak < 30 && `${stats.streak} jours ! Tu es sur une lancée incroyable !`}
                {stats.streak >= 30 && `${stats.streak} jours ! Tu es un vrai journaliste de ta vie !`}
              </p>
            </div>

            {/* Graphique humeur 7 jours */}
            {stats.last7Days.some(d => d.mood > 0) && (
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                <p className="text-xs text-zinc-500 mb-3">Humeur des 7 derniers jours</p>
                <div className="flex items-end justify-between gap-1 h-16">
                  {stats.last7Days.map((day, i) => {
                    const dayName = new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 2)
                    const isToday = day.date === new Date().toISOString().split('T')[0]
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        {day.mood > 0 ? (
                          <>
                            <span className="text-sm">{day.emoji}</span>
                            <div
                              className={`w-full rounded-t transition-all ${isToday ? 'bg-amber-500' : 'bg-zinc-700'}`}
                              style={{ height: `${(day.mood / 5) * 100}%` }}
                            />
                          </>
                        ) : (
                          <div className="w-full h-1 bg-zinc-800 rounded" />
                        )}
                        <span className={`text-[10px] ${isToday ? 'text-amber-400 font-medium' : 'text-zinc-600'}`}>
                          {dayName}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Nuage de tags */}
            {stats.topTags.length > 0 && (
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                <p className="text-xs text-zinc-500 mb-3">Tes thèmes favoris</p>
                <div className="flex flex-wrap gap-2">
                  {stats.topTags.map(([tag, count], i) => {
                    // Taille proportionnelle au count
                    const maxCount = stats.topTags[0][1]
                    const size = 0.75 + (count / maxCount) * 0.5
                    const colors = [
                      'text-amber-400 bg-amber-500/10',
                      'text-rose-400 bg-rose-500/10',
                      'text-emerald-400 bg-emerald-500/10',
                      'text-indigo-400 bg-indigo-500/10',
                      'text-violet-400 bg-violet-500/10',
                      'text-cyan-400 bg-cyan-500/10',
                      'text-orange-400 bg-orange-500/10',
                      'text-pink-400 bg-pink-500/10',
                    ]
                    return (
                      <span
                        key={tag}
                        className={`px-2 py-1 rounded-full ${colors[i % colors.length]} transition-all hover:scale-105`}
                        style={{ fontSize: `${size}rem` }}
                        title={`${count} entrée${count > 1 ? 's' : ''}`}
                      >
                        #{tag}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  )
}
