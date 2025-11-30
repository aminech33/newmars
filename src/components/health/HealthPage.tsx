import { useState } from 'react'
import { ArrowLeft, TrendingUp, TrendingDown, Heart, Flame, Apple, Scale, Target, Calendar, Lightbulb } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { 
  calculateBMI, 
  getBMICategory, 
  getBMICategoryLabel, 
  getBMICategoryColor,
  analyzeWeightTrend,
  calculateStreak,
  generateHealthSuggestions,
  detectFoodCalories,
  detectMealType
} from '../../utils/healthIntelligence'

export function HealthPage() {
  const { 
    setView, 
    weightEntries, 
    mealEntries, 
    healthGoals,
    userProfile,
    addWeightEntry,
    addMealEntry,
    deleteWeightEntry,
    deleteMealEntry
  } = useStore()

  const [activeTab, setActiveTab] = useState<'overview' | 'weight' | 'nutrition'>('overview')
  const [showAddWeight, setShowAddWeight] = useState(false)
  const [showAddMeal, setShowAddMeal] = useState(false)
  
  // Form states
  const [newWeight, setNewWeight] = useState('')
  const [weightDate, setWeightDate] = useState(new Date().toISOString().split('T')[0])
  const [weightNote, setWeightNote] = useState('')
  
  const [mealName, setMealName] = useState('')
  const [mealCalories, setMealCalories] = useState('')
  const [mealDate, setMealDate] = useState(new Date().toISOString().split('T')[0])
  const [mealTime, setMealTime] = useState(new Date().toTimeString().slice(0, 5))
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch')

  // Stats
  const latestWeight = weightEntries.length > 0 
    ? weightEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].weight
    : 0

  const weightGoal = healthGoals.find(g => g.type === 'weight' && g.active)
  const targetWeight = weightGoal?.target || 0

  const bmi = latestWeight > 0 ? calculateBMI(latestWeight, userProfile.height) : 0
  const bmiCategory = getBMICategory(bmi)
  const bmiLabel = getBMICategoryLabel(bmiCategory)
  const bmiColor = getBMICategoryColor(bmiCategory)

  const trend = analyzeWeightTrend(weightEntries)

  // Calories
  const today = new Date().toISOString().split('T')[0]
  const todayMeals = mealEntries.filter(m => m.date === today)
  const todayCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0)
  
  const caloriesGoal = healthGoals.find(g => g.type === 'calories' && g.active)
  const targetCalories = caloriesGoal?.target || 2000

  // Streak
  const allEntries = [...weightEntries, ...mealEntries]
  const streak = calculateStreak(allEntries)

  // Suggestions
  const healthStats = {
    currentWeight: latestWeight,
    targetWeight,
    weightChange: trend.weeklyChange,
    bmi,
    bmiCategory,
    todayCalories,
    targetCalories,
    weekAvgCalories: 0,
    streak
  }
  const suggestions = generateHealthSuggestions(healthStats, weightEntries, mealEntries)

  // Handlers
  const handleAddWeight = () => {
    if (!newWeight) return
    addWeightEntry({
      date: weightDate,
      weight: parseFloat(newWeight),
      note: weightNote
    })
    setNewWeight('')
    setWeightNote('')
    setShowAddWeight(false)
  }

  const handleAddMeal = () => {
    if (!mealName) return
    const calories = mealCalories ? parseInt(mealCalories) : detectFoodCalories(mealName)
    addMealEntry({
      date: mealDate,
      time: mealTime,
      type: mealType,
      name: mealName,
      calories
    })
    setMealName('')
    setMealCalories('')
    setShowAddMeal(false)
  }

  // Auto-detect meal type when time changes
  const handleTimeChange = (time: string) => {
    setMealTime(time)
    setMealType(detectMealType(time))
  }

  return (
    <div className="min-h-screen w-full bg-mars-bg overflow-y-auto">
      <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('hub')}
              className="p-2 hover:bg-zinc-900/50 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">Santé & Nutrition</h1>
              <p className="text-sm text-zinc-600">Suivez votre poids, nutrition et objectifs</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddWeight(true)}
              className="px-4 py-2 bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/30 transition-all duration-300 flex items-center gap-2"
            >
              <Scale className="w-4 h-4" />
              <span className="text-sm">Poids</span>
            </button>
            <button
              onClick={() => setShowAddMeal(true)}
              className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all duration-300 flex items-center gap-2"
            >
              <Apple className="w-4 h-4" />
              <span className="text-sm">Repas</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: Heart },
            { id: 'weight', label: 'Poids', icon: Scale },
            { id: 'nutrition', label: 'Nutrition', icon: Apple }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-zinc-900/50 text-zinc-200'
                    : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Poids actuel */}
              <div className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Scale className="w-5 h-5 text-rose-400" />
                  <p className="text-xs text-zinc-600">Poids actuel</p>
                </div>
                {latestWeight > 0 ? (
                  <>
                    <p className="text-4xl font-bold text-zinc-200">{latestWeight}kg</p>
                    <p className="text-xs text-zinc-600 mt-1">Objectif: {targetWeight}kg</p>
                  </>
                ) : (
                  <p className="text-sm text-zinc-600">Aucune donnée</p>
                )}
              </div>

              {/* IMC */}
              <div className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-indigo-400" />
                  <p className="text-xs text-zinc-600">IMC</p>
                </div>
                {bmi > 0 ? (
                  <>
                    <p className="text-4xl font-bold text-zinc-200">{bmi}</p>
                    <p className={`text-xs ${bmiColor} mt-1`}>{bmiLabel}</p>
                  </>
                ) : (
                  <p className="text-sm text-zinc-600">--</p>
                )}
              </div>

              {/* Calories */}
              <div className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <p className="text-xs text-zinc-600">Calories</p>
                </div>
                <p className="text-4xl font-bold text-zinc-200">{todayCalories}</p>
                <p className="text-xs text-zinc-600 mt-1">/ {targetCalories} kcal</p>
              </div>

              {/* Streak */}
              <div className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  <p className="text-xs text-zinc-600">Streak</p>
                </div>
                <p className="text-4xl font-bold text-zinc-200">{streak}</p>
                <p className="text-xs text-zinc-600 mt-1">jours consécutifs</p>
              </div>
            </div>

            {/* Suggestions IA */}
            {suggestions.length > 0 && (
              <div className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-medium text-zinc-200">Suggestions intelligentes</h2>
                </div>
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="p-4 bg-zinc-900/50 rounded-2xl">
                      <p className="text-sm text-zinc-300 mb-1">{suggestion.message}</p>
                      {suggestion.action && (
                        <p className="text-xs text-zinc-600">💡 {suggestion.action}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Graphique poids (simplifié) */}
            {weightEntries.length > 0 && (
              <div className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-zinc-200">Évolution du poids</h2>
                  <div className="flex items-center gap-2 text-sm">
                    {trend.trend === 'increasing' && (
                      <div className="flex items-center gap-1 text-rose-400">
                        <TrendingUp className="w-4 h-4" />
                        <span>+{Math.abs(trend.weeklyChange)}kg/sem</span>
                      </div>
                    )}
                    {trend.trend === 'decreasing' && (
                      <div className="flex items-center gap-1 text-emerald-400">
                        <TrendingDown className="w-4 h-4" />
                        <span>{trend.weeklyChange}kg/sem</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-48 flex items-end gap-2">
                  {weightEntries.slice(-10).map((entry) => {
                    const maxWeight = Math.max(...weightEntries.map(e => e.weight))
                    const height = (entry.weight / maxWeight) * 100
                    return (
                      <div key={entry.id} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full bg-gradient-to-t from-rose-500/60 to-rose-400/40 rounded-t-lg transition-all duration-500 hover:from-rose-500/80 hover:to-rose-400/60"
                          style={{ height: `${height}%` }}
                          title={`${entry.weight}kg - ${entry.date}`}
                        />
                        <p className="text-xs text-zinc-600">{new Date(entry.date).getDate()}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'weight' && (
          <div className="space-y-6">
            {/* Liste des entrées de poids */}
            <div className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h2 className="text-lg font-medium text-zinc-200 mb-4">Historique du poids</h2>
              {weightEntries.length > 0 ? (
                <div className="space-y-2">
                  {weightEntries
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl hover:bg-zinc-900/70 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-zinc-600" />
                            <span className="text-sm text-zinc-400">{new Date(entry.date).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Scale className="w-4 h-4 text-rose-400" />
                            <span className="text-lg font-bold text-zinc-200">{entry.weight}kg</span>
                          </div>
                          {entry.note && (
                            <span className="text-sm text-zinc-600">{entry.note}</span>
                          )}
                        </div>
                        <button
                          onClick={() => deleteWeightEntry(entry.id)}
                          className="text-xs text-zinc-600 hover:text-rose-400 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Scale className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-600 mb-2">Aucune entrée de poids</p>
                  <button
                    onClick={() => setShowAddWeight(true)}
                    className="text-sm text-rose-400 hover:text-rose-300"
                  >
                    Ajouter votre premier poids
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'nutrition' && (
          <div className="space-y-6">
            {/* Liste des repas */}
            <div className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h2 className="text-lg font-medium text-zinc-200 mb-4">Journal alimentaire</h2>
              {mealEntries.length > 0 ? (
                <div className="space-y-2">
                  {mealEntries
                    .sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime())
                    .slice(0, 20)
                    .map((meal) => (
                      <div key={meal.id} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl hover:bg-zinc-900/70 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-zinc-600" />
                            <span className="text-sm text-zinc-400">{new Date(meal.date).toLocaleDateString('fr-FR')}</span>
                            <span className="text-sm text-zinc-600">{meal.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-zinc-800 rounded-lg text-zinc-500">{meal.type}</span>
                            <span className="text-sm font-medium text-zinc-200">{meal.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Flame className="w-4 h-4 text-orange-400" />
                            <span className="text-sm font-bold text-orange-400">{meal.calories} kcal</span>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteMealEntry(meal.id)}
                          className="text-xs text-zinc-600 hover:text-rose-400 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Apple className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-600 mb-2">Aucun repas enregistré</p>
                  <button
                    onClick={() => setShowAddMeal(true)}
                    className="text-sm text-emerald-400 hover:text-emerald-300"
                  >
                    Ajouter votre premier repas
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Add Weight */}
        {showAddWeight && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-mars-surface rounded-3xl shadow-[0_16px_64px_rgba(0,0,0,0.5)] p-6 animate-scale-in"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h2 className="text-lg font-medium text-zinc-200 mb-4">Ajouter un poids</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-600 mb-2 block">Poids (kg)</label>
                  <input
                    type="number"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="75.5"
                    step="0.1"
                    className="w-full bg-zinc-900/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-600 mb-2 block">Date</label>
                  <input
                    type="date"
                    value={weightDate}
                    onChange={(e) => setWeightDate(e.target.value)}
                    className="w-full bg-zinc-900/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-600 mb-2 block">Note (optionnel)</label>
                  <input
                    type="text"
                    value={weightNote}
                    onChange={(e) => setWeightNote(e.target.value)}
                    placeholder="Après le sport..."
                    className="w-full bg-zinc-900/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowAddWeight(false)}
                    className="flex-1 px-4 py-3 bg-zinc-900/50 text-zinc-400 rounded-xl hover:bg-zinc-900/70 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddWeight}
                    className="flex-1 px-4 py-3 bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/30 transition-all"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Add Meal */}
        {showAddMeal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-mars-surface rounded-3xl shadow-[0_16px_64px_rgba(0,0,0,0.5)] p-6 animate-scale-in"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h2 className="text-lg font-medium text-zinc-200 mb-4">Ajouter un repas</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-600 mb-2 block">Nom du repas</label>
                  <input
                    type="text"
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    placeholder="Poulet grillé avec riz"
                    className="w-full bg-zinc-900/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-zinc-600 mb-2 block">Date</label>
                    <input
                      type="date"
                      value={mealDate}
                      onChange={(e) => setMealDate(e.target.value)}
                      className="w-full bg-zinc-900/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-600 mb-2 block">Heure</label>
                    <input
                      type="time"
                      value={mealTime}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      className="w-full bg-zinc-900/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-zinc-600 mb-2 block">Type de repas</label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as any)}
                    className="w-full bg-zinc-900/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="breakfast">Petit-déjeuner</option>
                    <option value="lunch">Déjeuner</option>
                    <option value="dinner">Dîner</option>
                    <option value="snack">Collation</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-zinc-600 mb-2 block">Calories (optionnel, détection auto)</label>
                  <input
                    type="number"
                    value={mealCalories}
                    onChange={(e) => setMealCalories(e.target.value)}
                    placeholder="Auto-détection..."
                    className="w-full bg-zinc-900/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowAddMeal(false)}
                    className="flex-1 px-4 py-3 bg-zinc-900/50 text-zinc-400 rounded-xl hover:bg-zinc-900/70 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddMeal}
                    className="flex-1 px-4 py-3 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


import { useStore } from '../../store/useStore'
import { 
  calculateBMI, 
  getBMICategory, 
  getBMICategoryLabel, 
  getBMICategoryColor,
  analyzeWeightTrend,
  calculateStreak,
  generateHealthSuggestions,
  detectFoodCalories,
  detectMealType
} from '../../utils/healthIntelligence'

export function HealthPage() {
  const { 
    setView, 
    weightEntries, 
    mealEntries, 
    healthGoals,
    userProfile,
    addWeightEntry,
    addMealEntry,
    deleteWeightEntry,
    deleteMealEntry
  } = useStore()

  const [activeTab, setActiveTab] = useState<'overview' | 'weight' | 'nutrition'>('overview')
  const [showAddWeight, setShowAddWeight] = useState(false)
  const [showAddMeal, setShowAddMeal] = useState(false)
  
  // Form states
  const [newWeight, setNewWeight] = useState('')
  const [weightDate, setWeightDate] = useState(new Date().toISOString().split('T')[0])
  const [weightNote, setWeightNote] = useState('')
  
  const [mealName, setMealName] = useState('')
  const [mealCalories, setMealCalories] = useState('')
  const [mealDate, setMealDate] = useState(new Date().toISOString().split('T')[0])
  const [mealTime, setMealTime] = useState(new Date().toTimeString().slice(0, 5))
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch')

  // Stats
  const latestWeight = weightEntries.length > 0 
    ? weightEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].weight
    : 0

  const weightGoal = healthGoals.find(g => g.type === 'weight' && g.active)
  const targetWeight = weightGoal?.target || 0

  const bmi = latestWeight > 0 ? calculateBMI(latestWeight, userProfile.height) : 0
  const bmiCategory = getBMICategory(bmi)
  const bmiLabel = getBMICategoryLabel(bmiCategory)
  const bmiColor = getBMICategoryColor(bmiCategory)

  const trend = analyzeWeightTrend(weightEntries)

  // Calories
  const today = new Date().toISOString().split('T')[0]
  const todayMeals = mealEntries.filter(m => m.date === today)
  const todayCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0)
  
  const caloriesGoal = healthGoals.find(g => g.type === 'calories' && g.active)
  const targetCalories = caloriesGoal?.target || 2000

  // Streak
  const allEntries = [...weightEntries, ...mealEntries]
  const streak = calculateStreak(allEntries)

  // Suggestions
  const healthStats = {
    currentWeight: latestWeight,
    targetWeight,
    weightChange: trend.weeklyChange,
    bmi,
    bmiCategory,
    todayCalories,
    targetCalories,
    weekAvgCalories: 0,
    streak
  }
  const suggestions = generateHealthSuggestions(healthStats, weightEntries, mealEntries)

  // Handlers
  const handleAddWeight = () => {
    if (!newWeight) return
    addWeightEntry({
      date: weightDate,
      weight: parseFloat(newWeight),
      note: weightNote
    })
    setNewWeight('')
    setWeightNote('')
    setShowAddWeight(false)
  }

  const handleAddMeal = () => {
    if (!mealName) return
    const calories = mealCalories ? parseInt(mealCalories) : detectFoodCalories(mealName)
    addMealEntry({
      date: mealDate,
      time: mealTime,
      type: mealType,
      name: mealName,
      calories
    })
    setMealName('')
    setMealCalories('')
    setShowAddMeal(false)
  }

  // Auto-detect meal type when time changes
  const handleTimeChange = (time: string) => {
    setMealTime(time)
    setMealType(detectMealType(time))
  }

  return (
    <div className="min-h-screen w-full bg-mars-bg overflow-y-auto">
      <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('hub')}
              className="p-2 hover:bg-zinc-900/50 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">Santé & Nutrition</h1>
              <p className="text-sm text-zinc-600">Suivez votre poids, nutrition et objectifs</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddWeight(true)}
              className="px-4 py-2 bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/30 transition-all duration-300 flex items-center gap-2"
            >
              <Scale className="w-4 h-4" />
              <span className="text-sm">Poids</span>
            </button>
            <button
              onClick={() => setShowAddMeal(true)}
              className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all duration-300 flex items-center gap-2"
            >
              <Apple className="w-4 h-4" />
              <span className="text-sm">Repas</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: Heart },
            { id: 'weight', label: 'Poids', icon: Scale },
            { id: 'nutrition', label: 'Nutrition', icon: Apple }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-zinc-900/50 text-zinc-200'
                    : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Poids actuel */}
              <div className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Scale className="w-5 h-5 text-rose-400" />
                  <p className="text-xs text-zinc-600">Poids actuel</p>
                </div>
                {latestWeight > 0 ? (
                  <>
                    <p className="text-4xl font-bold text-zinc-200">{latestWeight}kg</p>
                    <p className="text-xs text-zinc-600 mt-1">Objectif: {targetWeight}kg</p>
                  </>
                ) : (
                  <p className="text-sm text-zinc-600">Aucune donnée</p>
                )}
              </div>

              {/* IMC */}
              <div className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-indigo-400" />
                  <p className="text-xs text-zinc-600">IMC</p>
                </div>
                {bmi > 0 ? (
                  <>
                    <p className="text-4xl font-bold text-zinc-200">{bmi}</p>
                    <p className={`text-xs ${bmiColor} mt-1`}>{bmiLabel}</p>
                  </>
                ) : (
                  <p className="text-sm text-zinc-600">--</p>
                )}
              </div>

              {/* Calories */}
              <div className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <p className="text-xs text-zinc-600">Calories</p>
                </div>
                <p className="text-4xl font-bold text-zinc-200">{todayCalories}</p>
                <p className="text-xs text-zinc-600 mt-1">/ {targetCalories} kcal</p>
              </div>

              {/* Streak */}
              <div className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  <p className="text-xs text-zinc-600">Streak</p>
                </div>
                <p className="text-4xl font-bold text-zinc-200">{streak}</p>
                <p className="text-xs text-zinc-600 mt-1">jours consécutifs</p>
              </div>
            </div>

            {/* Suggestions IA */}
            {suggestions.length > 0 && (
              <div className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-medium text-zinc-200">Suggestions intelligentes</h2>
                </div>
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="p-4 bg-zinc-900/50 rounded-2xl">
                      <p className="text-sm text-zinc-300 mb-1">{suggestion.message}</p>
                      {suggestion.action && (
                        <p className="text-xs text-zinc-600">💡 {suggestion.action}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Graphique poids (simplifié) */}
            {weightEntries.length > 0 && (
              <div className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-zinc-200">Évolution du poids</h2>
                  <div className="flex items-center gap-2 text-sm">
                    {trend.trend === 'increasing' && (
                      <div className="flex items-center gap-1 text-rose-400">
                        <TrendingUp className="w-4 h-4" />
                        <span>+{Math.abs(trend.weeklyChange)}kg/sem</span>
                      </div>
                    )}
                    {trend.trend === 'decreasing' && (
                      <div className="flex items-center gap-1 text-emerald-400">
                        <TrendingDown className="w-4 h-4" />
                        <span>{trend.weeklyChange}kg/sem</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-48 flex items-end gap-2">
                  {weightEntries.slice(-10).map((entry) => {
                    const maxWeight = Math.max(...weightEntries.map(e => e.weight))
                    const height = (entry.weight / maxWeight) * 100
                    return (
                      <div key={entry.id} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full bg-gradient-to-t from-rose-500/60 to-rose-400/40 rounded-t-lg transition-all duration-500 hover:from-rose-500/80 hover:to-rose-400/60"
                          style={{ height: `${height}%` }}
                          title={`${entry.weight}kg - ${entry.date}`}
                        />
                        <p className="text-xs text-zinc-600">{new Date(entry.date).getDate()}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'weight' && (
          <div className="space-y-6">
            {/* Liste des entrées de poids */}
            <div className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h2 className="text-lg font-medium text-zinc-200 mb-4">Historique du poids</h2>
              {weightEntries.length > 0 ? (
                <div className="space-y-2">
                  {weightEntries
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl hover:bg-zinc-900/70 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-zinc-600" />
                            <span className="text-sm text-zinc-400">{new Date(entry.date).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Scale className="w-4 h-4 text-rose-400" />
                            <span className="text-lg font-bold text-zinc-200">{entry.weight}kg</span>
                          </div>
                          {entry.note && (
                            <span className="text-sm text-zinc-600">{entry.note}</span>
                          )}
                        </div>
                        <button
                          onClick={() => deleteWeightEntry(entry.id)}
                          className="text-xs text-zinc-600 hover:text-rose-400 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Scale className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-600 mb-2">Aucune entrée de poids</p>
                  <button
                    onClick={() => setShowAddWeight(true)}
                    className="text-sm text-rose-400 hover:text-rose-300"
                  >
                    Ajouter votre premier poids
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'nutrition' && (
          <div className="space-y-6">
            {/* Liste des repas */}
            <div className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h2 className="text-lg font-medium text-zinc-200 mb-4">Journal alimentaire</h2>
              {mealEntries.length > 0 ? (
                <div className="space-y-2">
                  {mealEntries
                    .sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime())
                    .slice(0, 20)
                    .map((meal) => (
                      <div key={meal.id} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl hover:bg-zinc-900/70 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-zinc-600" />
                            <span className="text-sm text-zinc-400">{new Date(meal.date).toLocaleDateString('fr-FR')}</span>
                            <span className="text-sm text-zinc-600">{meal.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-zinc-800 rounded-lg text-zinc-500">{meal.type}</span>
                            <span className="text-sm font-medium text-zinc-200">{meal.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Flame className="w-4 h-4 text-orange-400" />
                            <span className="text-sm font-bold text-orange-400">{meal.calories} kcal</span>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteMealEntry(meal.id)}
                          className="text-xs text-zinc-600 hover:text-rose-400 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Apple className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-600 mb-2">Aucun repas enregistré</p>
                  <button
                    onClick={() => setShowAddMeal(true)}
                    className="text-sm text-emerald-400 hover:text-emerald-300"
                  >
                    Ajouter votre premier repas
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Add Weight */}
        {showAddWeight && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-mars-surface rounded-3xl shadow-[0_16px_64px_rgba(0,0,0,0.5)] p-6 animate-scale-in"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h2 className="text-lg font-medium text-zinc-200 mb-4">Ajouter un poids</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-600 mb-2 block">Poids (kg)</label>
                  <input
                    type="number"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="75.5"
                    step="0.1"
                    className="w-full bg-zinc-900/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-600 mb-2 block">Date</label>
                  <input
                    type="date"
                    value={weightDate}
                    onChange={(e) => setWeightDate(e.target.value)}
                    className="w-full bg-zinc-900/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-600 mb-2 block">Note (optionnel)</label>
                  <input
                    type="text"
                    value={weightNote}
                    onChange={(e) => setWeightNote(e.target.value)}
                    placeholder="Après le sport..."
                    className="w-full bg-zinc-900/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowAddWeight(false)}
                    className="flex-1 px-4 py-3 bg-zinc-900/50 text-zinc-400 rounded-xl hover:bg-zinc-900/70 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddWeight}
                    className="flex-1 px-4 py-3 bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/30 transition-all"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Add Meal */}
        {showAddMeal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-mars-surface rounded-3xl shadow-[0_16px_64px_rgba(0,0,0,0.5)] p-6 animate-scale-in"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h2 className="text-lg font-medium text-zinc-200 mb-4">Ajouter un repas</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-600 mb-2 block">Nom du repas</label>
                  <input
                    type="text"
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    placeholder="Poulet grillé avec riz"
                    className="w-full bg-zinc-900/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-zinc-600 mb-2 block">Date</label>
                    <input
                      type="date"
                      value={mealDate}
                      onChange={(e) => setMealDate(e.target.value)}
                      className="w-full bg-zinc-900/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-600 mb-2 block">Heure</label>
                    <input
                      type="time"
                      value={mealTime}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      className="w-full bg-zinc-900/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-zinc-600 mb-2 block">Type de repas</label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as any)}
                    className="w-full bg-zinc-900/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="breakfast">Petit-déjeuner</option>
                    <option value="lunch">Déjeuner</option>
                    <option value="dinner">Dîner</option>
                    <option value="snack">Collation</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-zinc-600 mb-2 block">Calories (optionnel, détection auto)</label>
                  <input
                    type="number"
                    value={mealCalories}
                    onChange={(e) => setMealCalories(e.target.value)}
                    placeholder="Auto-détection..."
                    className="w-full bg-zinc-900/50 text-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowAddMeal(false)}
                    className="flex-1 px-4 py-3 bg-zinc-900/50 text-zinc-400 rounded-xl hover:bg-zinc-900/70 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddMeal}
                    className="flex-1 px-4 py-3 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

