/**
 * 🏥 HealthTab - Onglet Santé de Ma Journée (Version optimisée)
 */

import { useState } from 'react'
import { Plus, Apple, Scale, Utensils, Activity, Settings } from 'lucide-react'
import { WeightChart } from '../health/WeightChart'
import { WeightList } from '../health/WeightList'
import { MealList } from '../health/MealList'
import { BodyCompositionDisplay } from '../health/BodyCompositionDisplay'
import { WeightEntry, MealEntry } from '../../types/health'

type HealthSection = 'nutrition' | 'weight'
type PeriodFilter = '7d' | '30d' | '90d' | 'all'

interface HealthTabProps {
  // Modals
  setShowMealModal: (show: boolean) => void
  setShowWeightModal: (show: boolean) => void
  setShowProfileModal: (show: boolean) => void
  
  // Data
  mealEntries: MealEntry[]
  weightEntries: WeightEntry[]
  filteredMealEntries: MealEntry[]
  filteredWeightEntries: WeightEntry[]
  todayCalories: number
  targetCalories: number
  todayMacros: { protein: number; carbs: number; fat: number }
  trend: {
    trend: 'increasing' | 'decreasing' | 'stable'
    avgChange: number
    weeklyChange: number
  }
  targetWeight?: number
  predictedWeeks?: number
  
  // Handlers
  handleDeleteMeal: (id: string) => void
  handleDeleteWeight: (id: string) => void
  handleDuplicateMeal: (meal: MealEntry) => void
}

export function HealthTab({
  setShowMealModal,
  setShowWeightModal,
  setShowProfileModal,
  mealEntries,
  weightEntries,
  filteredMealEntries,
  filteredWeightEntries,
  todayCalories,
  targetCalories,
  todayMacros,
  trend,
  targetWeight,
  predictedWeeks,
  handleDeleteMeal,
  handleDeleteWeight,
  handleDuplicateMeal
}: HealthTabProps) {
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [activeSection, setActiveSection] = useState<HealthSection>('nutrition')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('30d')
  
  // Filtrer les entrées de poids selon la période
  const filteredWeightByPeriod = weightEntries.filter(entry => {
    const entryDate = new Date(entry.date)
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))
    
    switch (periodFilter) {
      case '7d': return daysDiff <= 7
      case '30d': return daysDiff <= 30
      case '90d': return daysDiff <= 90
      case 'all': return true
      default: return true
    }
  })
  
  return (
    <div className="h-full overflow-y-auto p-6">
      
      {/* Tabs mobile */}
      <div className="flex lg:hidden gap-2 mb-6">
        <button
          onClick={() => setActiveSection('nutrition')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSection === 'nutrition'
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Nutrition
        </button>
        <button
          onClick={() => setActiveSection('weight')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSection === 'weight'
              ? 'bg-rose-500/20 text-rose-300'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Poids
        </button>
      </div>

      {/* Conteneur centré avec largeur max */}
      <div className="max-w-6xl mx-auto">
        {/* Layout 2 colonnes : Nutrition (60%) + Poids (40%) */}
        <div className={`grid gap-4 ${activeSection === 'nutrition' ? 'grid-cols-1' : 'grid-cols-1'} lg:grid-cols-5`}>
        
        {/* ===== NUTRITION (3/5) ===== */}
        <section 
          className={`lg:col-span-3 space-y-3 ${activeSection === 'weight' ? 'hidden lg:block' : ''}`} 
          aria-label="Nutrition aujourd'hui"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-300 flex items-center gap-2">
              <Apple className="w-5 h-5 text-emerald-400" aria-hidden="true" />
              Nutrition
            </h3>
            
            {/* Bouton Ajouter repas */}
            <button
              onClick={() => setShowMealModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg transition-all text-sm font-medium"
              aria-label="Ajouter un repas"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Repas</span>
            </button>
          </div>

          {mealEntries.length === 0 ? (
            <div className="flex items-center justify-center py-20" role="status" aria-label="Aucun repas enregistré">
              <div className="text-center">
                <div className="text-6xl mb-4">🍽️</div>
                <p className="text-xl font-semibold text-zinc-300 mb-2">Aucun repas</p>
                <p className="text-sm text-zinc-600 mb-6">Commencez à tracker</p>
                <button
                  onClick={() => setShowMealModal(true)}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all"
                >
                  Ajouter un repas
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Calories & Macros combinés (minimaliste) */}
              <div 
                className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800"
                role="region"
                aria-label={`Calories consommées: ${todayCalories} sur ${targetCalories} kilocalories`}
              >
                {/* Calories (gros chiffre) */}
                <div className="mb-3">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-4xl font-bold tabular-nums ${
                      todayCalories > targetCalories ? 'text-rose-400' :
                      todayCalories > targetCalories * 0.8 ? 'text-emerald-400' :
                      'text-zinc-300'
                    }`}>
                      {todayCalories}
                    </span>
                    <span className="text-base text-zinc-600">/ {targetCalories} kcal</span>
                  </div>
                  
                  {/* Barre de progression (colorée dynamiquement) */}
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={todayCalories} aria-valuemin={0} aria-valuemax={targetCalories}>
                    <div 
                      className={`h-full transition-all duration-500 ${
                        todayCalories > targetCalories ? 'bg-rose-500' :
                        todayCalories > targetCalories * 0.8 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                        'bg-zinc-600'
                      }`}
                      style={{ width: `${Math.min(100, (todayCalories / targetCalories) * 100)}%` }} 
                    />
                  </div>
                  
                  {/* Message contextuel */}
                  {todayCalories > 0 && (
                    <p className="text-xs text-zinc-500 mt-2">
                      {todayCalories > targetCalories 
                        ? `+${todayCalories - targetCalories} kcal au-dessus de l'objectif`
                        : todayCalories > targetCalories * 0.8
                          ? `Reste ${targetCalories - todayCalories} kcal`
                          : `${Math.round((todayCalories / targetCalories) * 100)}% de l'objectif`
                      }
                    </p>
                  )}
                </div>
                
                {/* Macros (grid 3 colonnes, plus compact) */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-zinc-800/50">
                  <div className="text-center">
                    <div className="text-xl font-bold text-rose-400 tabular-nums">
                      {Math.round(todayMacros.protein)}g
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-0.5">Protéines</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-amber-400 tabular-nums">
                      {Math.round(todayMacros.carbs)}g
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-0.5">Glucides</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-yellow-400 tabular-nums">
                      {Math.round(todayMacros.fat)}g
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-0.5">Lipides</div>
                  </div>
                </div>
              </div>

              {/* Liste des repas avec objectifs macros */}
              <div 
                className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800"
                role="region"
                aria-label="Historique des repas"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-zinc-500">Historique</p>
                  <p className="text-xs text-zinc-500">{filteredMealEntries.length} repas</p>
                </div>
                <MealList 
                  entries={filteredMealEntries} 
                  onDelete={handleDeleteMeal} 
                  onDuplicate={handleDuplicateMeal}
                  targetCalories={targetCalories}
                  compact 
                />
              </div>
            </div>
          )}
        </section>

        {/* ===== POIDS (2/5) ===== */}
        <section 
          className={`lg:col-span-2 space-y-3 ${activeSection === 'nutrition' ? 'hidden lg:block' : ''}`} 
          aria-label="Suivi du poids"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-base font-semibold text-zinc-300 flex items-center gap-2">
              <Scale className="w-5 h-5 text-rose-400" aria-hidden="true" />
              Poids
            </h3>
            
            <div className="flex items-center gap-2">
              {/* Sélecteur de période */}
              {weightEntries.length > 0 && (
                <div className="flex gap-1 bg-zinc-900/50 rounded-lg p-1">
                  {(['7d', '30d', '90d', 'all'] as PeriodFilter[]).map((period) => (
                    <button
                      key={period}
                      onClick={() => setPeriodFilter(period)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        periodFilter === period
                          ? 'bg-zinc-700 text-zinc-200'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {period === 'all' ? 'Tout' : period}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Boutons d'action */}
              <button
                onClick={() => setShowWeightModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg transition-all text-sm font-medium"
                aria-label="Ajouter une pesée"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Pesée</span>
              </button>
              
              <button
                onClick={() => setShowProfileModal(true)}
                className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 rounded-lg transition-all"
                aria-label="Configurer le profil"
                title="Configurer le profil"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {weightEntries.length === 0 ? (
            <div className="flex items-center justify-center py-20" role="status" aria-label="Aucune pesée enregistrée">
              <div className="text-center">
                <div className="text-6xl mb-4">⚖️</div>
                <p className="text-xl font-semibold text-zinc-300 mb-2">Aucune pesée</p>
                <p className="text-sm text-zinc-600 mb-6">Commencez à tracker</p>
                <button
                  onClick={() => setShowWeightModal(true)}
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-all"
                >
                  Ajouter une pesée
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Composition corporelle (si données Withings) - Toujours visible */}
              {weightEntries[weightEntries.length - 1]?.fatMassPercent && (
                <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <p className="text-sm font-medium text-zinc-300">Composition corporelle</p>
                  </div>
                  <BodyCompositionDisplay latestEntry={weightEntries[weightEntries.length - 1]} />
                </div>
              )}
              
              {/* Poids actuel + Graphique combinés */}
              <div 
                className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800"
                role="region"
                aria-label="Suivi du poids"
              >
                {/* Poids actuel compact */}
                {filteredWeightEntries.length > 0 && (
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/50">
                    <div>
                      <div className="text-3xl font-bold text-zinc-200">
                        {filteredWeightEntries[filteredWeightEntries.length - 1].weight} kg
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {new Date(filteredWeightEntries[filteredWeightEntries.length - 1].date).toLocaleDateString('fr-FR', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        trend.trend === 'decreasing' ? 'text-emerald-400' :
                        trend.trend === 'increasing' ? 'text-rose-400' :
                        'text-zinc-400'
                      }`}>
                        {trend.trend === 'decreasing' ? '↓ Baisse' :
                         trend.trend === 'increasing' ? '↑ Hausse' :
                         '↔ Stable'}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {trend.weeklyChange > 0 ? '+' : ''}{trend.weeklyChange.toFixed(1)} kg/sem
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Graphique agrandi */}
                <p className="text-xs text-zinc-500 mb-2.5">Évolution ({periodFilter === 'all' ? 'Tout' : periodFilter})</p>
                <div className="h-[280px] lg:h-[320px]">
                  <WeightChart 
                    entries={filteredWeightByPeriod} 
                    trend={trend} 
                    compact={true}
                    targetWeight={targetWeight}
                    predictedWeeks={predictedWeeks}
                  />
                </div>
              </div>

              {/* Liste */}
              <div 
                className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800"
                role="region"
                aria-label="Historique des pesées"
              >
                <p className="text-xs text-zinc-500 mb-2.5">Historique</p>
                <WeightList entries={filteredWeightEntries} onDelete={handleDeleteWeight} compact />
              </div>
            </div>
          )}
        </section>
        </div>
      </div>
    </div>
  )
}

