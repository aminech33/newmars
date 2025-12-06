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
    <div className="h-screen w-full flex flex-col overflow-hidden">
      {/* Header - Compact */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-zinc-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('hub')}
              className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-400" />
            </button>
            <h1 className="text-lg font-semibold text-white">📅 Ma Journée</h1>
            <span className="text-xs text-zinc-500 capitalize">{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2">
            {globalStreak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full text-xs">
                <Flame className="w-3 h-3 text-white" />
                <span className="font-bold text-white">{globalStreak}j</span>
              </div>
            )}

            <div className="flex gap-0.5 bg-white/5 rounded-lg p-0.5">
              <button
                onClick={() => setActiveTab('today')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'today'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Historique
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-3">

        {activeTab === 'today' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-3">
              {/* Section Habitudes - Compact */}
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-3 border border-amber-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <h2 className="text-sm font-semibold text-white">Habitudes</h2>
                    <span className="text-xs text-zinc-500">
                      {todayCompleted}/{habits.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowAddHabitModal(true)}
                    className="p-1 text-amber-400 hover:bg-amber-500/20 rounded-md transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {habits.length === 0 ? (
                  <button
                    onClick={() => setShowAddHabitModal(true)}
                    className="w-full py-2 text-amber-400 text-xs hover:bg-amber-500/10 rounded-lg transition-colors"
                  >
                    + Créer une habitude
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    {habits.map((habit) => {
                      const isCompleted = habit.completedDates.includes(today)
                      return (
                        <div
                          key={habit.id}
                          className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                            isCompleted 
                              ? 'bg-amber-500/20 border border-amber-500/30' 
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                          onClick={() => handleToggleHabit(habit.id)}
                        >
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted ? 'bg-amber-500 text-white' : 'border border-zinc-600'
                          }`}>
                            {isCompleted && <Check className="w-2.5 h-2.5" />}
                          </div>
                          <span className={`text-xs truncate ${isCompleted ? 'text-amber-200' : 'text-white'}`}>
                            {habit.name}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Prompt + Mood + Goal - Combined Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Prompt */}
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-3 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <button onClick={() => setCurrentPrompt(getRandomPrompt())} className="p-1 hover:bg-purple-500/10 rounded">
                      <RefreshCw className="w-3 h-3 text-purple-400" />
                    </button>
                  </div>
                  <p className="text-purple-200 text-xs italic line-clamp-2">{currentPrompt.icon} {currentPrompt.question}</p>
                </div>

                {/* Mood */}
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Smile className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-zinc-400">Humeur</span>
                  </div>
                  <div className="flex gap-2 justify-between">
                    {moods.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMood(m)}
                        className={`text-2xl transition-transform hover:scale-110 ${
                          mood === m ? 'scale-125' : 'opacity-40 hover:opacity-100'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goal */}
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Target className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-zinc-400">Objectif</span>
                  </div>
                  <input
                    type="text"
                    value={mainGoal}
                    onChange={(e) => setMainGoal(e.target.value)}
                    placeholder="Objectif du jour..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              {/* Gratitudes - Compact */}
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-3 h-3 text-pink-400" />
                  <h2 className="text-xs font-semibold text-white">3 gratitudes</h2>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: gratitude1, setter: setGratitude1 },
                    { value: gratitude2, setter: setGratitude2 },
                    { value: gratitude3, setter: setGratitude3 }
                  ].map((g, i) => (
                    <input
                      key={i}
                      type="text"
                      value={g.value}
                      onChange={(e) => g.setter(e.target.value)}
                      placeholder={`${i + 1}. ...`}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                    />
                  ))}
                </div>
              </div>

              {/* Réflexion - Compact */}
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-3 h-3 text-purple-400" />
                  <h2 className="text-xs font-semibold text-white">Réflexion</h2>
                </div>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Pensées, émotions, expériences..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 resize-none"
                />
              </div>

              {/* Appris & Victoire - Compact */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-3 h-3 text-yellow-400" />
                    <h2 className="text-xs font-semibold text-white">Appris</h2>
                  </div>
                  <textarea
                    value={learned}
                    onChange={(e) => setLearned(e.target.value)}
                    placeholder="Leçon du jour..."
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 resize-none"
                  />
                </div>

                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-3 h-3 text-green-400" />
                    <h2 className="text-xs font-semibold text-white">Victoire</h2>
                  </div>
                  <textarea
                    value={victory}
                    onChange={(e) => setVictory(e.target.value)}
                    placeholder="Ta victoire..."
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-green-500/50 resize-none"
                  />
                </div>
              </div>

              {/* Tags + Save - Compact */}
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">🏷️</span>
                  <h2 className="text-xs font-semibold text-white">Tags</h2>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 rounded-full text-[10px] text-purple-300">
                      #{tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Tag..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                  <button onClick={handleAddTag} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-xs hover:bg-purple-500/30">+</button>
                </div>
              </div>

              {/* Bouton Sauvegarder - Compact */}
              <button
                onClick={handleSave}
                disabled={!canSave || isSaving}
                className={`w-full font-medium py-2 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm ${
                  canSave && !isSaving
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {isSaving ? 'Sauvegarde...' : hasChanges ? <><Save className="w-4 h-4" /> Sauvegarder</> : '✓ Sauvegardé'}
              </button>
              {hasChanges && canSave && <p className="text-[10px] text-zinc-500 text-center">Auto-save 3s...</p>}
            </div>

            {/* Sidebar Stats - Compact */}
            <div className="space-y-3">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-3 border border-orange-500/30 text-center">
                  <div className="text-2xl mb-1">🔥</div>
                  <div className="text-xl font-bold text-white">{stats.currentStreak}</div>
                  <div className="text-[10px] text-zinc-400">jours streak</div>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/10 text-center">
                  <div className="text-2xl mb-1">{moodLevelToEmoji(Math.round(stats.averageMood) as any)}</div>
                  <div className="text-xl font-bold text-white">{stats.averageMood.toFixed(1)}</div>
                  <div className="text-[10px] text-zinc-400">humeur moy.</div>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/10 text-center">
                  <div className="text-xl font-bold text-white">{stats.totalEntries}</div>
                  <div className="text-[10px] text-zinc-400">entrées</div>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/10 text-center">
                  <div className="text-xl font-bold text-white">{habits.length}</div>
                  <div className="text-[10px] text-zinc-400">habitudes</div>
                </div>
              </div>

              {/* Corrélation */}
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">{mood}</span>
                  <span className="text-xs text-zinc-400">
                    {completionRate >= 80 ? '🎉 Super !' : completionRate >= 50 ? '💪 Bien !' : '🌱 Continue'}
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${completionRate}%` }} />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">{completionRate}% habitudes</p>
              </div>

              {/* Évolution humeur - Mini */}
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/10">
                <h3 className="text-xs font-semibold text-white mb-2">Évolution</h3>
                <div className="h-12 flex items-end justify-between gap-0.5">
                  {entriesByMonth.slice(-14).map((entry, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t"
                      style={{ height: `${((entry.mood || 5) / 10) * 100}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Historique - Compact */
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/10">
            {/* Header + Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-purple-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Rechercher..."
                className="flex-1 min-w-[120px] bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
              <div className="flex gap-1">
                {moods.map((m) => (
                  <button
                    key={m}
                    onClick={() => setFilterMood(filterMood === m ? null : m)}
                    className={`text-lg transition-transform ${filterMood === m ? 'scale-110' : 'opacity-40 hover:opacity-100'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`p-1 rounded-lg ${showFavoritesOnly ? 'bg-yellow-500/20' : 'bg-white/5'}`}
              >
                <Star className={`w-3 h-3 ${showFavoritesOnly ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-400'}`} />
              </button>
              {(searchQuery || filterMood || showFavoritesOnly) && (
                <button
                  onClick={() => { setSearchQuery(''); setFilterMood(null); setShowFavoritesOnly(false) }}
                  className="text-xs text-red-400 hover:underline"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Memory */}
            {memory && (
              <div className="mb-3 bg-purple-500/10 border border-purple-500/20 rounded-lg p-2 flex items-center gap-2">
                <Star className="w-3 h-3 text-purple-400 flex-shrink-0" />
                <p className="text-xs text-purple-200 line-clamp-1">{memory.reflection}</p>
              </div>
            )}

            {/* Entries - Compact Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
              {filteredEntries.length === 0 ? (
                <div className="col-span-2 text-center py-8">
                  <BookOpen className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">Aucune entrée</p>
                </div>
              ) : (
                filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-2 hover:border-purple-500/30 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{entry.moodEmoji}</span>
                        <span className="text-xs text-white">{formatRelativeDate(entry.date)}</span>
                      </div>
                      <button onClick={() => toggleJournalFavorite(entry.id)} className="opacity-0 group-hover:opacity-100">
                        <Star className={`w-3 h-3 ${entry.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-500'}`} />
                      </button>
                    </div>
                    <p className="text-zinc-300 text-xs line-clamp-2">{entry.reflection}</p>
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {entry.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-1 text-[9px] bg-purple-500/10 text-purple-400 rounded">#{tag}</span>
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

