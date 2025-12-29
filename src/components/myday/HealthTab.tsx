/**
 * 🏥 HealthTab - Onglet Santé de Ma Journée
 */

import { Plus, Heart, Apple, Scale, Utensils, Activity } from 'lucide-react'
import { WeightChart } from '../health/WeightChart'
import { WeightList } from '../health/WeightList'
import { MealList } from '../health/MealList'
import { BodyCompositionDisplay } from '../health/BodyCompositionDisplay'
import { WeightEntry, MealEntry } from '../../types/health'

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
  handleDeleteMeal,
  handleDeleteWeight,
  handleDuplicateMeal
}: HealthTabProps) {
  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      
      {/* Actions principales */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <button
          onClick={() => setShowMealModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 rounded-xl transition-all font-medium shadow-md shadow-emerald-500/10"
          aria-label="Ajouter un repas"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Ajouter un repas
        </button>
        <button
          onClick={() => setShowWeightModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 hover:border-rose-500/50 text-rose-300 rounded-xl transition-all font-medium shadow-md shadow-rose-500/10"
          aria-label="Ajouter une pesée"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Ajouter une pesée
        </button>
        <button
          onClick={() => setShowProfileModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-300 rounded-xl transition-all font-medium shadow-md shadow-indigo-500/10"
          aria-label="Configurer le profil de santé"
        >
          <Heart className="w-4 h-4" aria-hidden="true" />
          Configurer profil
        </button>
      </div>

      {/* Layout 2 colonnes : Nutrition (gauche) + Poids (droite) */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        
        {/* ===== NUTRITION (3/5) ===== */}
        <section className="xl:col-span-3 space-y-4" aria-label="Nutrition aujourd'hui">
          <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <Apple className="w-4 h-4" aria-hidden="true" />
            Nutrition
          </h3>

          {mealEntries.length === 0 ? (
            <div className="flex items-center justify-center py-12" role="status" aria-label="Aucun repas enregistré">
              <div className="text-center text-zinc-600 max-w-md">
                <Utensils className="w-12 h-12 mx-auto mb-3 text-zinc-700" aria-hidden="true" />
                <p className="text-sm mb-1 text-zinc-400">Aucun repas enregistré</p>
                <p className="text-xs">Ajoutez votre premier repas</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Calories & Macros combinés */}
              <div 
                className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800"
                role="region"
                aria-label={`Calories consommées: ${todayCalories} sur ${targetCalories} kilocalories`}
              >
                <p className="text-xs text-zinc-500 mb-2">Aujourd'hui</p>
                <div className="text-2xl font-bold text-zinc-200">
                  {todayCalories}
                  <span className="text-sm text-zinc-600 ml-1 font-normal">/ {targetCalories} kcal</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mt-3" role="progressbar" aria-valuenow={todayCalories} aria-valuemin={0} aria-valuemax={targetCalories}>
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" 
                    style={{ width: `${Math.min(100, (todayCalories / targetCalories) * 100)}%` }} 
                  />
                </div>
                
                {/* Macros en 1 ligne */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-zinc-800/50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-400" aria-hidden="true" />
                    <span className="text-xs text-zinc-400">
                      <span className="text-rose-400 font-medium">{Math.round(todayMacros.protein * 10) / 10}g</span> protéines
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-400" aria-hidden="true" />
                    <span className="text-xs text-zinc-400">
                      <span className="text-amber-400 font-medium">{Math.round(todayMacros.carbs * 10) / 10}g</span> glucides
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-yellow-400" aria-hidden="true" />
                    <span className="text-xs text-zinc-400">
                      <span className="text-yellow-400 font-medium">{Math.round(todayMacros.fat * 10) / 10}g</span> lipides
                    </span>
                  </div>
                </div>
              </div>

              {/* Liste des repas */}
              <div 
                className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800"
                role="region"
                aria-label="Historique des repas"
              >
                <p className="text-xs text-zinc-500 mb-3">Historique</p>
                <MealList 
                  entries={filteredMealEntries} 
                  onDelete={handleDeleteMeal} 
                  onDuplicate={handleDuplicateMeal} 
                  compact 
                />
              </div>
            </div>
          )}
        </section>

        {/* ===== POIDS (2/5) ===== */}
        <section className="xl:col-span-2 space-y-4" aria-label="Suivi du poids">
          <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <Scale className="w-4 h-4" aria-hidden="true" />
            Poids
          </h3>

          {weightEntries.length === 0 ? (
            <div className="flex items-center justify-center py-12" role="status" aria-label="Aucune pesée enregistrée">
              <div className="text-center text-zinc-600 max-w-md">
                <Scale className="w-12 h-12 mx-auto mb-3 text-zinc-700" aria-hidden="true" />
                <p className="text-sm mb-1 text-zinc-400">Aucune pesée enregistrée</p>
                <p className="text-xs">Ajoutez votre première pesée</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Composition corporelle (si données Withings) - Collapsible */}
              {weightEntries[weightEntries.length - 1]?.fatMassPercent && (
                <details className="group" open>
                  <summary className="cursor-pointer list-none" aria-label="Composition corporelle Withings">
                    <div className="flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
                          <Plus className="w-5 h-5 text-indigo-400" aria-hidden="true" />
                        </div>
                        <div>
                          <span className="font-medium text-zinc-300">Composition corporelle</span>
                          <p className="text-xs text-zinc-500">Données Withings</p>
                        </div>
                      </div>
                      <span className="text-zinc-500 group-open:rotate-180 transition-transform" aria-hidden="true">▼</span>
                    </div>
                  </summary>
                  
                  <div className="mt-3">
                    <BodyCompositionDisplay latestEntry={weightEntries[weightEntries.length - 1]} />
                  </div>
                </details>
              )}
              
              {/* Graphique */}
              <div 
                className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800"
                role="img"
                aria-label="Graphique d'évolution du poids"
              >
                <p className="text-xs text-zinc-500 mb-3">Évolution</p>
                <div className="h-[200px]">
                  <WeightChart entries={weightEntries} trend={trend} />
                </div>
              </div>

              {/* Liste */}
              <div 
                className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800"
                role="region"
                aria-label="Historique des pesées"
              >
                <p className="text-xs text-zinc-500 mb-3">Historique</p>
                <WeightList entries={filteredWeightEntries} onDelete={handleDeleteWeight} compact />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

