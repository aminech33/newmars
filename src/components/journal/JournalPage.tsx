import { useState, useMemo } from 'react'
import { ArrowLeft, BookOpen, Star, Calendar, TrendingUp, Smile, Target, Lightbulb, Trophy, Heart } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { MoodEmoji } from '../../types/journal'
import { 
  moodLevelToEmoji, 
  moodEmojiToLevel,
  calculateJournalStats,
  getTodayEntry,
  getEntriesByMonth,
  getMemoryFromYearsAgo,
  formatRelativeDate
} from '../../utils/journalUtils'

export const JournalPage = () => {
  const { 
    setView, 
    journalEntries, 
    addJournalEntry, 
    updateJournalEntry, 
    toggleJournalFavorite 
  } = useStore()

  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  // Entrée du jour
  const todayEntry = getTodayEntry(journalEntries)
  
  // États pour l'édition
  const [mood, setMood] = useState<MoodEmoji>(todayEntry?.moodEmoji || '🙂')
  const [mainGoal, setMainGoal] = useState(todayEntry?.mainGoal || '')
  const [gratitude1, setGratitude1] = useState(todayEntry?.gratitude?.[0] || '')
  const [gratitude2, setGratitude2] = useState(todayEntry?.gratitude?.[1] || '')
  const [gratitude3, setGratitude3] = useState(todayEntry?.gratitude?.[2] || '')
  const [reflection, setReflection] = useState(todayEntry?.reflection || '')
  const [learned, setLearned] = useState(todayEntry?.learned || '')
  const [victory, setVictory] = useState(todayEntry?.victory || '')

  // Stats
  const stats = useMemo(() => calculateJournalStats(journalEntries), [journalEntries])
  const entriesByMonth = useMemo(() => getEntriesByMonth(journalEntries, selectedMonth), [journalEntries, selectedMonth])
  const memory = useMemo(() => getMemoryFromYearsAgo(journalEntries), [journalEntries])

  const handleSave = () => {
    const gratitude = [gratitude1, gratitude2, gratitude3].filter(g => g.trim())
    
    const entry = {
      id: todayEntry?.id || `journal-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      mood: moodEmojiToLevel(mood),
      moodEmoji: mood,
      mainGoal: mainGoal.trim() || undefined,
      gratitude: gratitude.length > 0 ? gratitude : undefined,
      reflection: reflection.trim(),
      learned: learned.trim() || undefined,
      victory: victory.trim() || undefined,
      isFavorite: todayEntry?.isFavorite || false,
      createdAt: todayEntry?.createdAt || Date.now(),
      updatedAt: Date.now()
    }

    if (todayEntry) {
      updateJournalEntry(entry.id, entry)
    } else {
      addJournalEntry(entry)
    }
  }

  const moods: MoodEmoji[] = ['😢', '😐', '🙂', '😊', '🤩']

  return (
    <div className="min-h-screen bg-gradient-to-br from-mars-950 via-mars-900 to-mars-950 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={() => setView('hub')}
          className="flex items-center gap-2 text-mars-400 hover:text-mars-300 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Retour au Hub</span>
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Journal</h1>
              <p className="text-mars-400">Réfléchis, grandis, évolue</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-mars-900/50 backdrop-blur-sm rounded-2xl p-1.5 border border-mars-800/50">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'today'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-mars-400 hover:text-white'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-mars-400 hover:text-white'
              }`}
            >
              Historique
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'today' ? (
            <>
              {/* Mood Selector */}
              <div className="bg-mars-900/50 backdrop-blur-sm rounded-3xl p-6 border border-mars-800/50">
                <div className="flex items-center gap-3 mb-4">
                  <Smile className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-semibold text-white">Comment te sens-tu ?</h2>
                </div>
                <div className="flex gap-3 justify-between">
                  {moods.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMood(m)}
                      className={`text-5xl transition-all hover:scale-110 ${
                        mood === m ? 'scale-125 drop-shadow-2xl' : 'opacity-50 hover:opacity-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Goal */}
              <div className="bg-mars-900/50 backdrop-blur-sm rounded-3xl p-6 border border-mars-800/50">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-semibold text-white">Objectif principal du jour</h2>
                </div>
                <input
                  type="text"
                  value={mainGoal}
                  onChange={(e) => setMainGoal(e.target.value)}
                  placeholder="Quel est ton objectif principal aujourd'hui ?"
                  className="w-full bg-mars-800/50 border border-mars-700/50 rounded-2xl px-4 py-3 text-white placeholder-mars-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                />
              </div>

              {/* Gratitude */}
              <div className="bg-mars-900/50 backdrop-blur-sm rounded-3xl p-6 border border-mars-800/50">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="w-5 h-5 text-pink-400" />
                  <h2 className="text-xl font-semibold text-white">3 choses pour lesquelles tu es reconnaissant</h2>
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
                      className="w-full bg-mars-800/50 border border-mars-700/50 rounded-2xl px-4 py-3 text-white placeholder-mars-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* Reflection */}
              <div className="bg-mars-900/50 backdrop-blur-sm rounded-3xl p-6 border border-mars-800/50">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-semibold text-white">Réflexion libre</h2>
                </div>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Écris librement tes pensées, tes émotions, tes expériences du jour..."
                  rows={6}
                  className="w-full bg-mars-800/50 border border-mars-700/50 rounded-2xl px-4 py-3 text-white placeholder-mars-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
                />
              </div>

              {/* Learned & Victory */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-mars-900/50 backdrop-blur-sm rounded-3xl p-6 border border-mars-800/50">
                  <div className="flex items-center gap-3 mb-4">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    <h2 className="text-lg font-semibold text-white">J'ai appris</h2>
                  </div>
                  <textarea
                    value={learned}
                    onChange={(e) => setLearned(e.target.value)}
                    placeholder="Quelle leçon as-tu apprise aujourd'hui ?"
                    rows={3}
                    className="w-full bg-mars-800/50 border border-mars-700/50 rounded-2xl px-4 py-3 text-white placeholder-mars-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all resize-none"
                  />
                </div>

                <div className="bg-mars-900/50 backdrop-blur-sm rounded-3xl p-6 border border-mars-800/50">
                  <div className="flex items-center gap-3 mb-4">
                    <Trophy className="w-5 h-5 text-green-400" />
                    <h2 className="text-lg font-semibold text-white">Victoire du jour</h2>
                  </div>
                  <textarea
                    value={victory}
                    onChange={(e) => setVictory(e.target.value)}
                    placeholder="Quelle est ta victoire aujourd'hui ?"
                    rows={3}
                    className="w-full bg-mars-800/50 border border-mars-700/50 rounded-2xl px-4 py-3 text-white placeholder-mars-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-4 rounded-2xl hover:shadow-lg hover:scale-[1.02] transition-all"
              >
                💾 Sauvegarder l'entrée
              </button>
            </>
          ) : (
            <>
              {/* History */}
              <div className="bg-mars-900/50 backdrop-blur-sm rounded-3xl p-6 border border-mars-800/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <h2 className="text-xl font-semibold text-white">Historique</h2>
                  </div>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-mars-800/50 border border-mars-700/50 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
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
                    <p className="text-mars-400 text-xs mt-2">{formatRelativeDate(memory.date)}</p>
                  </div>
                )}

                {/* Entries */}
                <div className="space-y-4">
                  {entriesByMonth.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 text-mars-600 mx-auto mb-4" />
                      <p className="text-mars-400">Aucune entrée pour ce mois</p>
                    </div>
                  ) : (
                    entriesByMonth.map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-mars-800/50 border border-mars-700/50 rounded-2xl p-4 hover:border-purple-500/30 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{entry.moodEmoji}</span>
                            <div>
                              <p className="text-white font-medium">{formatRelativeDate(entry.date)}</p>
                              <p className="text-mars-400 text-sm">{entry.date}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleJournalFavorite(entry.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                entry.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-mars-500'
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

                        <p className="text-mars-300 text-sm line-clamp-3">{entry.reflection}</p>

                        {entry.victory && (
                          <div className="mt-2 text-green-400 text-sm">
                            🏆 {entry.victory}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          {/* Streak */}
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-3xl p-6 border border-orange-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">🔥</div>
              <div>
                <p className="text-mars-400 text-sm">Série actuelle</p>
                <p className="text-3xl font-bold text-white">{stats.currentStreak} jours</p>
              </div>
            </div>
            <div className="text-sm text-mars-300">
              Record: {stats.longestStreak} jours
            </div>
          </div>

          {/* Stats */}
          <div className="bg-mars-900/50 backdrop-blur-sm rounded-3xl p-6 border border-mars-800/50">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Statistiques</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-mars-400 text-sm">Total d'entrées</span>
                <span className="text-white font-semibold">{stats.totalEntries}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-mars-400 text-sm">Humeur moyenne</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">{stats.averageMood.toFixed(1)}/10</span>
                  <span className="text-xl">{moodLevelToEmoji(Math.round(stats.averageMood) as any)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-mars-400 text-sm">Favoris</span>
                <span className="text-white font-semibold">{stats.favoriteCount}</span>
              </div>
            </div>
          </div>

          {/* Mood Graph */}
          <div className="bg-mars-900/50 backdrop-blur-sm rounded-3xl p-6 border border-mars-800/50">
            <h3 className="text-lg font-semibold text-white mb-4">Évolution de l'humeur</h3>
            <div className="h-32 flex items-end justify-between gap-1">
              {entriesByMonth.slice(-14).map((entry, i) => {
                const height = ((entry.mood || 5) / 10) * 100
                return (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-lg transition-all hover:opacity-80"
                    style={{ height: `${height}%` }}
                    title={`${entry.date}: ${entry.mood}/10`}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


