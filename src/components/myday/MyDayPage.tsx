import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { 
  ArrowLeft, 
  Flame, 
  Check, 
  Plus,
  Smile,
  Target,
  Heart,
  BookOpen,
  Lightbulb,
  Trophy,
  Save,
  Sparkles,
  RefreshCw,
  Calendar,
  TrendingUp,
  Star
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { MoodEmoji } from '../../types/journal'
import { 
  moodLevelToEmoji, 
  moodEmojiToLevel,
  getTodayEntry,
  getEntriesByMonth,
  getMemoryFromYearsAgo,
  formatRelativeDate
} from '../../utils/journalUtils'
import { getDailyPrompt, getRandomPrompt } from '../../data/journalPrompts'
import { AddHabitModal } from '../habits/AddHabitModal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useHabitsStats, useJournalStats } from '../../hooks/useGlobalStats'

type TabView = 'today' | 'history'

export function MyDayPage() {
  const { 
    setView, 
    habits, 
    addHabit, 
    toggleHabitToday, 
    deleteHabit,
    journalEntries, 
    addJournalEntry, 
    updateJournalEntry, 
    toggleJournalFavorite,
    addToast 
  } = useStore()

  const [activeTab, setActiveTab] = useState<TabView>('today')
  const [showAddHabitModal, setShowAddHabitModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState(getDailyPrompt())

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const todayEntry = getTodayEntry(journalEntries)

  // 🎯 UTILISATION DU HOOK CENTRALISÉ - Plus de calculs locaux !
  const habitsStats = useHabitsStats()
  const journalStats = useJournalStats()

  // États pour le journal
  const [mood, setMood] = useState<MoodEmoji>('🙂')
  const [mainGoal, setMainGoal] = useState('')
  const [gratitude1, setGratitude1] = useState('')
  const [gratitude2, setGratitude2] = useState('')
  const [gratitude3, setGratitude3] = useState('')
  const [reflection, setReflection] = useState('')
  const [learned, setLearned] = useState('')
  const [victory, setVictory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // Filter states for history
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMood, setFilterMood] = useState<MoodEmoji | null>(null)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // Stats viennent maintenant du hook centralisé
  const { todayCompleted, todayRate: completionRate, globalStreak } = habitsStats
  const stats = journalStats

  // Ces calculs restent locaux car ils dépendent de selectedMonth (filtre UI)
  const entriesByMonth = useMemo(() => getEntriesByMonth(journalEntries, selectedMonth), [journalEntries, selectedMonth])
  const memory = useMemo(() => getMemoryFromYearsAgo(journalEntries), [journalEntries])

  // Sync state with todayEntry when it changes
  useEffect(() => {
    if (todayEntry) {
      setMood(todayEntry.moodEmoji || '🙂')
      setMainGoal(todayEntry.mainGoal || '')
      setGratitude1(todayEntry.gratitude?.[0] || '')
      setGratitude2(todayEntry.gratitude?.[1] || '')
      setGratitude3(todayEntry.gratitude?.[2] || '')
      setReflection(todayEntry.reflection || '')
      setLearned(todayEntry.learned || '')
      setVictory(todayEntry.victory || '')
      setTags(todayEntry.tags || [])
      setLastSaved(new Date(todayEntry.updatedAt))
    }
  }, [todayEntry?.id])

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    journalEntries.forEach(entry => {
      entry.tags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [journalEntries])

  // Filter entries in history
  const filteredEntries = useMemo(() => {
    return entriesByMonth.filter(entry => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const searchFields = [
          entry.reflection,
          entry.mainGoal,
          entry.learned,
          entry.victory
        ].filter(Boolean).join(' ').toLowerCase()
        
        if (!searchFields.includes(query)) return false
      }
      if (filterMood && entry.moodEmoji !== filterMood) return false
      if (showFavoritesOnly && !entry.isFavorite) return false
      return true
    })
  }, [entriesByMonth, searchQuery, filterMood, showFavoritesOnly])

  // Tag handlers
  const handleAddTag = () => {
    const newTag = tagInput.trim().toLowerCase()
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  // Validation
  const canSave = reflection.trim().length > 0
  const hasChanges = useMemo(() => {
    if (!todayEntry) return reflection.trim().length > 0
    const todayTags = todayEntry.tags || []
    return (
      mood !== todayEntry.moodEmoji ||
      mainGoal !== (todayEntry.mainGoal || '') ||
      gratitude1 !== (todayEntry.gratitude?.[0] || '') ||
      gratitude2 !== (todayEntry.gratitude?.[1] || '') ||
      gratitude3 !== (todayEntry.gratitude?.[2] || '') ||
      reflection !== (todayEntry.reflection || '') ||
      learned !== (todayEntry.learned || '') ||
      victory !== (todayEntry.victory || '') ||
      JSON.stringify(tags.sort()) !== JSON.stringify(todayTags.sort())
    )
  }, [mood, mainGoal, gratitude1, gratitude2, gratitude3, reflection, learned, victory, tags, todayEntry])

  const handleSave = useCallback(() => {
    if (!canSave) return

    setIsSaving(true)
    const gratitude = [gratitude1, gratitude2, gratitude3].filter(g => g.trim())
    
    const entryData = {
      date: today,
      mood: moodEmojiToLevel(mood),
      moodEmoji: mood,
      mainGoal: mainGoal.trim() || undefined,
      gratitude: gratitude.length > 0 ? gratitude : undefined,
      reflection: reflection.trim(),
      learned: learned.trim() || undefined,
      victory: victory.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    }

    if (todayEntry) {
      updateJournalEntry(todayEntry.id, entryData)
      addToast('Entrée mise à jour 💾', 'success')
    } else {
      addJournalEntry(entryData)
      addToast('Entrée créée ✨', 'success')
    }

    setIsSaving(false)
    setLastSaved(new Date())
  }, [mood, mainGoal, gratitude1, gratitude2, gratitude3, reflection, learned, victory, tags, today, todayEntry, canSave, addJournalEntry, updateJournalEntry, addToast])

  // Auto-save after 3 seconds of inactivity
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    if (!hasChanges || !canSave) return

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      handleSave()
    }, 3000)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [mood, mainGoal, gratitude1, gratitude2, gratitude3, reflection, learned, victory, tags, hasChanges, canSave, handleSave])

  const handleToggleHabit = (habitId: string) => {
    toggleHabitToday(habitId)
    const habit = habits.find(h => h.id === habitId)
    const isCompleting = !habit?.completedDates.includes(today)
    if (isCompleting) {
      addToast(`${habit?.name} complété ! 🔥`, 'success')
    }
  }

  const handleDeleteHabit = () => {
    if (confirmDelete) {
      deleteHabit(confirmDelete)
      addToast('Habitude supprimée', 'info')
      setConfirmDelete(null)
    }
  }

  const handleAddHabit = (name: string) => {
    if (name.trim()) {
      addHabit(name.trim())
      addToast('Habitude créée 🔥', 'success')
      setShowAddHabitModal(false)
    }
  }

  const moods: MoodEmoji[] = ['😢', '😐', '🙂', '😊', '🤩']

  // Date formatée
  const formattedDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })

  return (
    <div className="min-h-screen w-full bg-mars-bg noise-bg overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('hub')}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              title="Retour"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-4xl">📅</span>
                Ma Journée
              </h1>
              <p className="text-zinc-500 mt-1 capitalize">{formattedDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Streak Badge */}
            {globalStreak > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full shadow-lg shadow-amber-500/30">
                <Flame className="w-5 h-5 text-white" />
                <div className="text-center">
                  <div className="text-lg font-bold text-white leading-none">{globalStreak}</div>
                  <div className="text-[10px] text-white/80 uppercase tracking-wide">jours</div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-white/5 backdrop-blur-sm rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setActiveTab('today')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'today'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'history'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Historique
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'today' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-6">
              {/* Section Habitudes */}
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm rounded-3xl p-6 border border-amber-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Flame className="w-6 h-6 text-amber-400" />
                    <h2 className="text-xl font-semibold text-white">Mes Habitudes</h2>
                    <span className="text-sm text-zinc-500">
                      {todayCompleted}/{habits.length} · {completionRate}%
                    </span>
                  </div>
                  <button
                    onClick={() => setShowAddHabitModal(true)}
                    className="p-2 text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors"
                    title="Ajouter une habitude"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {habits.length === 0 ? (
                  <div className="text-center py-8">
                    <Flame className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm">Aucune habitude</p>
                    <button
                      onClick={() => setShowAddHabitModal(true)}
                      className="mt-3 text-amber-400 text-sm hover:underline"
                    >
                      + Créer ma première habitude
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {habits.map((habit) => {
                      const isCompleted = habit.completedDates.includes(today)
                      return (
                        <div
                          key={habit.id}
                          className={`
                            group flex items-center gap-3 p-3 rounded-xl
                            transition-colors cursor-pointer
                            ${isCompleted 
                              ? 'bg-amber-500/20 border border-amber-500/30' 
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                            }
                          `}
                          onClick={() => handleToggleHabit(habit.id)}
                        >
                          <button
                            className={`
                              w-6 h-6 rounded-full flex items-center justify-center
                              transition-colors
                              ${isCompleted 
                                ? 'bg-amber-500 text-white' 
                                : 'border-2 border-zinc-600 hover:border-amber-400'
                              }
                            `}
                          >
                            {isCompleted && <Check className="w-4 h-4" />}
                          </button>
                          <span className={`flex-1 ${isCompleted ? 'text-amber-200' : 'text-white'}`}>
                            {habit.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setConfirmDelete(habit.id)
                            }}
                            className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Prompt du jour */}
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-3xl p-6 border border-purple-500/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-semibold text-white">Prompt du jour</h2>
                  </div>
                  <button
                    onClick={() => setCurrentPrompt(getRandomPrompt())}
                    className="p-2 hover:bg-purple-500/10 rounded-lg transition-colors group"
                    title="Changer de prompt"
                  >
                    <RefreshCw className="w-4 h-4 text-purple-400 group-hover:rotate-180 transition-transform duration-300" />
                  </button>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{currentPrompt.icon}</span>
                  <p className="text-purple-200 text-base italic leading-relaxed">
                    {currentPrompt.question}
                  </p>
                </div>
              </div>

              {/* Comment tu te sens ? */}
              <div className="bg-white/[0.03] backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Smile className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-semibold text-white">Comment te sens-tu ?</h2>
                </div>
                <div className="flex gap-4 justify-between">
                  {moods.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMood(m)}
                      className={`text-5xl transition-transform hover:scale-110 ${
                        mood === m ? 'scale-125 drop-shadow-2xl' : 'opacity-50 hover:opacity-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Objectif du jour */}
              <div className="bg-white/[0.03] backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-semibold text-white">Objectif principal</h2>
                </div>
                <input
                  type="text"
                  value={mainGoal}
                  onChange={(e) => setMainGoal(e.target.value)}
                  placeholder="Quel est ton objectif principal aujourd'hui ?"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-[border-color,box-shadow]"
                />
              </div>

              {/* Gratitudes */}
              <div className="bg-white/[0.03] backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="w-5 h-5 text-pink-400" />
                  <h2 className="text-xl font-semibold text-white">3 gratitudes</h2>
                </div>
                <div className="space-y-3">
                  {[
                    { value: gratitude1, setter: setGratitude1, placeholder: '1. Je suis reconnaissant pour...' },
                    { value: gratitude2, setter: setGratitude2, placeholder: '2. Je suis reconnaissant pour...' },
                    { value: gratitude3, setter: setGratitude3, placeholder: '3. Je suis reconnaissant pour...' }
                  ].map((g, i) => (
                    <input
                      key={i}
                      type="text"
                      value={g.value}
                      onChange={(e) => g.setter(e.target.value)}
                      placeholder={g.placeholder}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-[border-color,box-shadow]"
                    />
                  ))}
                </div>
              </div>

              {/* Réflexion */}
              <div className="bg-white/[0.03] backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-semibold text-white">Réflexion libre</h2>
                </div>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Écris librement tes pensées, tes émotions, tes expériences du jour..."
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-[border-color,box-shadow] resize-none"
                />
              </div>

              {/* Appris & Victoire */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/[0.03] backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    <h2 className="text-lg font-semibold text-white">J'ai appris</h2>
                  </div>
                  <textarea
                    value={learned}
                    onChange={(e) => setLearned(e.target.value)}
                    placeholder="Quelle leçon as-tu apprise ?"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-[border-color,box-shadow] resize-none"
                  />
                </div>

                <div className="bg-white/[0.03] backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <Trophy className="w-5 h-5 text-green-400" />
                    <h2 className="text-lg font-semibold text-white">Victoire du jour</h2>
                  </div>
                  <textarea
                    value={victory}
                    onChange={(e) => setVictory(e.target.value)}
                    placeholder="Quelle est ta victoire ?"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-[border-color,box-shadow] resize-none"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="bg-white/[0.03] backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xl">🏷️</span>
                  <h2 className="text-xl font-semibold text-white">Tags</h2>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm text-purple-300"
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Ajouter un tag"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-xl hover:bg-purple-500/30 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
                {allTags.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-zinc-500 mb-2">Tags populaires :</p>
                    <div className="flex flex-wrap gap-2">
                      {allTags.slice(0, 8).map((tag) => (
                        <button
                          key={tag}
                          onClick={() => !tags.includes(tag) && setTags([...tags, tag])}
                          disabled={tags.includes(tag)}
                          className={`px-2 py-1 text-xs rounded-full transition-colors ${
                            tags.includes(tag)
                              ? 'bg-purple-500/10 text-purple-500/50 cursor-not-allowed'
                              : 'bg-white/5 text-zinc-400 hover:bg-purple-500/10 hover:text-purple-300'
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton Sauvegarder */}
              <div className="space-y-3">
                <button
                  onClick={handleSave}
                  disabled={!canSave || isSaving}
                  className={`w-full font-semibold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 ${
                    canSave && !isSaving
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:scale-[1.02]'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sauvegarde...
                    </>
                  ) : hasChanges ? (
                    <>
                      <Save className="w-5 h-5" />
                      Sauvegarder
                    </>
                  ) : (
                    <>✓ Sauvegardé</>
                  )}
                </button>
                
                {lastSaved && !hasChanges && (
                  <div className="text-center">
                    <span className="text-xs text-zinc-500">
                      Dernière sauvegarde : {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                {hasChanges && canSave && (
                  <div className="text-center">
                    <span className="text-xs text-zinc-500">
                      ✨ Sauvegarde automatique dans 3s...
                    </span>
                  </div>
                )}

                {!canSave && reflection.trim().length === 0 && (
                  <div className="text-center">
                    <span className="text-xs text-red-400">
                      ⚠️ La réflexion est requise pour sauvegarder
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              {/* Streak Journal */}
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-3xl p-6 border border-orange-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">🔥</div>
                  <div>
                    <p className="text-zinc-400 text-sm">Série journal</p>
                    <p className="text-3xl font-bold text-white">{stats.currentStreak} jours</p>
                  </div>
                </div>
                <div className="text-sm text-zinc-300">
                  Record: {stats.longestStreak} jours
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white/[0.03] backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Statistiques</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Entrées journal</span>
                    <span className="text-white font-semibold">{stats.totalEntries}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Humeur moyenne</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{stats.averageMood.toFixed(1)}/10</span>
                      <span className="text-xl">{moodLevelToEmoji(Math.round(stats.averageMood) as any)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Habitudes actives</span>
                    <span className="text-white font-semibold">{habits.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Favoris</span>
                    <span className="text-white font-semibold">{stats.favoriteCount}</span>
                  </div>
                </div>
              </div>

              {/* Corrélation Mood / Habits */}
              <div className="bg-white/[0.03] backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Corrélation</h3>
                <div className="text-center py-4">
                  <div className="text-5xl mb-2">{mood}</div>
                  <p className="text-sm text-zinc-400">
                    {completionRate >= 80 
                      ? '🎉 Excellente journée !' 
                      : completionRate >= 50 
                        ? '💪 Continue comme ça !' 
                        : '🌱 Chaque petit pas compte'}
                  </p>
                  <div className="mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    {completionRate}% des habitudes complétées
                  </p>
                </div>
              </div>

              {/* Évolution humeur */}
              <div className="bg-white/[0.03] backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Évolution humeur</h3>
                <div className="h-24 flex items-end justify-between gap-1">
                  {entriesByMonth.slice(-14).map((entry, i) => {
                    const height = ((entry.mood || 5) / 10) * 100
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-lg transition-opacity hover:opacity-80"
                        style={{ height: `${height}%` }}
                        title={`${entry.date}: ${entry.mood}/10`}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Historique */
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-3xl p-6 border border-white/10">
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-semibold text-white">Historique</h2>
                </div>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              {/* Search */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Rechercher dans vos entrées..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                {moods.map((m) => (
                  <button
                    key={m}
                    onClick={() => setFilterMood(filterMood === m ? null : m)}
                    className={`text-2xl transition-transform hover:scale-110 ${
                      filterMood === m ? 'scale-125 drop-shadow-2xl' : 'opacity-40 hover:opacity-100'
                    }`}
                    title={`Filtrer par humeur ${m}`}
                  >
                    {m}
                  </button>
                ))}

                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    showFavoritesOnly
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Star className={`w-4 h-4 inline ${showFavoritesOnly ? 'fill-yellow-400' : ''}`} /> Favoris
                </button>

                {(searchQuery || filterMood || showFavoritesOnly) && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setFilterMood(null)
                      setShowFavoritesOnly(false)
                    }}
                    className="px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                  >
                    ✕ Réinitialiser
                  </button>
                )}
              </div>

              {(searchQuery || filterMood || showFavoritesOnly) && (
                <p className="text-xs text-zinc-500">
                  {filteredEntries.length} résultat{filteredEntries.length > 1 ? 's' : ''} trouvé{filteredEntries.length > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Memory from years ago */}
            {memory && (
              <div className="mb-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-purple-300 font-medium">
                    Souvenir d'il y a {new Date().getFullYear() - new Date(memory.date).getFullYear()} an(s)
                  </span>
                </div>
                <p className="text-white text-sm">{memory.reflection}</p>
                <p className="text-zinc-400 text-xs mt-2">{formatRelativeDate(memory.date)}</p>
              </div>
            )}

            {/* Entries */}
            <div className="space-y-4">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400">
                    {searchQuery || filterMood || showFavoritesOnly
                      ? 'Aucun résultat trouvé'
                      : 'Aucune entrée pour ce mois'}
                  </p>
                </div>
              ) : (
                filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-purple-500/30 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{entry.moodEmoji}</span>
                        <div>
                          <p className="text-white font-medium">{formatRelativeDate(entry.date)}</p>
                          <p className="text-zinc-400 text-sm">{entry.date}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleJournalFavorite(entry.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            entry.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-500'
                          }`}
                        />
                      </button>
                    </div>

                    {entry.mainGoal && (
                      <div className="mb-2">
                        <span className="text-blue-400 text-sm font-medium">🎯 Objectif: </span>
                        <span className="text-white text-sm">{entry.mainGoal}</span>
                      </div>
                    )}

                    <p className="text-zinc-300 text-sm line-clamp-3">{entry.reflection}</p>

                    {entry.victory && (
                      <div className="mt-2 text-green-400 text-sm">
                        🏆 {entry.victory}
                      </div>
                    )}

                    {entry.tags && entry.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {entry.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddHabitModal
        isOpen={showAddHabitModal}
        onClose={() => setShowAddHabitModal(false)}
        onAdd={handleAddHabit}
      />

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDeleteHabit}
        title="Supprimer l'habitude ?"
        message="Cette action est irréversible. Toutes les données de progression seront perdues."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="warning"
      />
    </div>
  )
}

