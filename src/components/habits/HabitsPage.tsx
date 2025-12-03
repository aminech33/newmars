import { useState, useMemo, useEffect } from 'react'
import { ArrowLeft, Plus, Flame, Check, X, TrendingUp, Calendar, Target, BarChart3 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { HabitCard } from './HabitCard'
import { HabitStats } from './HabitStats'
import { HabitCalendar } from './HabitCalendar'
import { AddHabitModal } from './AddHabitModal'
import { ConfirmDialog } from '../ui/ConfirmDialog'

type TabView = 'today' | 'calendar' | 'stats'

export function HabitsPage() {
  const { setView, habits, addHabit, toggleHabitToday, deleteHabit, addToast } = useStore()
  
  const [activeTab, setActiveTab] = useState<TabView>('today')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  // Stats globales
  const todayCompleted = useMemo(() => 
    habits.filter(h => h.completedDates.includes(today)).length
  , [habits, today])

  const completionRate = useMemo(() => 
    habits.length > 0 ? Math.round((todayCompleted / habits.length) * 100) : 0
  , [todayCompleted, habits.length])

  const globalStreak = useMemo(() => {
    if (habits.length === 0) return 0
    let streak = 0
    let checkDate = new Date()
    
    // Vérifier combien de jours consécutifs on a complété AU MOINS une habitude
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      const hasActivity = habits.some(h => h.completedDates.includes(dateStr))
      
      if (hasActivity) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else if (streak === 0 && dateStr === today) {
        // Si c'est aujourd'hui et pas d'activité, on continue à hier
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }, [habits, today])

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setShowAddModal(true)
      }
      if (e.key === '1') setActiveTab('today')
      if (e.key === '2') setActiveTab('calendar')
      if (e.key === '3') setActiveTab('stats')
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  const handleToggleHabit = (habitId: string) => {
    toggleHabitToday(habitId)
    const habit = habits.find(h => h.id === habitId)
    const isCompleting = !habit?.completedDates.includes(today)
    if (isCompleting) {
      addToast(`${habit?.name} complété !`, 'success')
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
      addToast('Habitude créée', 'success')
      setShowAddModal(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-mars-bg noise-bg overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('hub')}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              title="Retour"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Flame className="w-7 h-7 text-amber-400" />
                Habitudes
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                {todayCompleted}/{habits.length} complétées aujourd'hui · {completionRate}%
              </p>
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

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-xl hover:bg-amber-500/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Nouvelle habitude</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          {[
            { id: 'today' as const, label: "Aujourd'hui", icon: Check },
            { id: 'calendar' as const, label: 'Calendrier', icon: Calendar },
            { id: 'stats' as const, label: 'Statistiques', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'text-amber-400 border-b-2 border-amber-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Flame className="w-16 h-16 text-zinc-700 mb-4" />
            <h3 className="text-xl font-semibold text-zinc-400 mb-2">Aucune habitude</h3>
            <p className="text-zinc-600 mb-6">Créez votre première habitude pour commencer</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500/20 text-amber-400 rounded-xl hover:bg-amber-500/30 transition-all"
            >
              <Plus className="w-5 h-5" />
              Créer une habitude
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'today' && (
              <div className="grid gap-4">
                {habits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    today={today}
                    onToggle={handleToggleHabit}
                    onDelete={() => setConfirmDelete(habit.id)}
                    isSelected={selectedHabitId === habit.id}
                    onSelect={() => setSelectedHabitId(habit.id === selectedHabitId ? null : habit.id)}
                  />
                ))}
              </div>
            )}

            {activeTab === 'calendar' && (
              <HabitCalendar habits={habits} />
            )}

            {activeTab === 'stats' && (
              <HabitStats habits={habits} />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AddHabitModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
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

