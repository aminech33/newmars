/**
 * 🏥 HealthTab - Onglet Santé de Ma Journée
 */

import { Plus, Heart, Apple, Scale, Utensils } from 'lucide-react'
import { WeightChart } from '../health/WeightChart'
import { WeightList } from '../health/WeightList'
import { MealList } from '../health/MealList'
import { MacrosCircularChart } from '../health/MacrosCircularChart'
import { BodyCompositionDisplay } from '../health/BodyCompositionDisplay'

interface HealthTabProps {
  // Modals
  setShowMealModal: (show: boolean) => void
  setShowWeightModal: (show: boolean) => void
  setShowProfileModal: (show: boolean) => void
  
  // Data
  mealEntries: any[]
  weightEntries: any[]
  filteredMealEntries: any[]
  filteredWeightEntries: any[]
  todayCalories: number
  targetCalories: number
  todayMacros: { protein: number; carbs: number; fat: number }
  trend: any
  
  // Handlers
  handleDeleteMeal: (id: string) => void
  handleDeleteWeight: (id: string) => void
  handleDuplicateMeal: (meal: any) => void
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
      <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
        <button
          onClick={() => setShowMealModal(true)}
          className="flex items-center gap-3 px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 rounded-xl transition-all font-medium shadow-lg shadow-emerald-500/10"
        >
          <Plus className="w-5 h-5" />
          Ajouter un repas
        </button>
        <button
          onClick={() => setShowWeightModal(true)}
          className="flex items-center gap-3 px-6 py-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 hover:border-rose-500/50 text-rose-300 rounded-xl transition-all font-medium shadow-lg shadow-rose-500/10"
        >
          <Plus className="w-5 h-5" />
          Ajouter une pesée
        </button>
        <button
          onClick={() => setShowProfileModal(true)}
          className="flex items-center gap-3 px-6 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-300 rounded-xl transition-all font-medium shadow-lg shadow-indigo-500/10"
        >
          <Heart className="w-5 h-5" />
          Configurer profil
        </button>
      </div>

      {/* Layout 2 colonnes : Nutrition (gauche) + Poids (droite) */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        
        {/* ===== NUTRITION (3/5) ===== */}
        <div className="xl:col-span-3 space-y-4">
          <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <Apple className="w-4 h-4" />
            Nutrition
          </h3>

          {mealEntries.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center text-zinc-600 max-w-md">
                <Utensils className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                <p className="text-sm mb-1 text-zinc-400">Aucun repas enregistré</p>
                <p className="text-xs">Ajoutez votre premier repas</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Calories & Macros */}
              <div className="space-y-4">
                <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-2">Aujourd'hui</p>
                  <div className="text-2xl font-bold text-zinc-200">
                    {todayCalories}
                    <span className="text-sm text-zinc-600 ml-1 font-normal">/ {targetCalories} kcal</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mt-3">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" 
                      style={{ width: `${Math.min(100, (todayCalories / targetCalories) * 100)}%` }} 
                    />
                  </div>
                </div>

                <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-3">Macros</p>
                  <MacrosCircularChart 
                    protein={todayMacros.protein} 
                    carbs={todayMacros.carbs} 
                    fat={todayMacros.fat} 
                  />
                </div>
              </div>

              {/* Liste des repas */}
              <div className="lg:col-span-2 bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 max-h-[500px] overflow-hidden flex flex-col">
                <p className="text-xs text-zinc-500 mb-3">Historique</p>
                <div className="flex-1 overflow-y-auto">
                  <MealList 
                    entries={filteredMealEntries} 
                    onDelete={handleDeleteMeal} 
                    onDuplicate={handleDuplicateMeal} 
                    compact 
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== POIDS (2/5) ===== */}
        <div className="xl:col-span-2 space-y-4">
          <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <Scale className="w-4 h-4" />
            Poids
          </h3>

          {weightEntries.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center text-zinc-600 max-w-md">
                <Scale className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                <p className="text-sm mb-1 text-zinc-400">Aucune pesée enregistrée</p>
                <p className="text-xs">Ajoutez votre première pesée</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Composition corporelle (si données Withings) */}
              <BodyCompositionDisplay latestEntry={weightEntries[weightEntries.length - 1]} />
              
              {/* Graphique */}
              <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-3">Évolution</p>
                <div className="h-[200px]">
                  <WeightChart entries={weightEntries} trend={trend} />
                </div>
              </div>

              {/* Liste */}
              <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 max-h-[260px] overflow-hidden flex flex-col">
                <p className="text-xs text-zinc-500 mb-3">Historique</p>
                <div className="flex-1 overflow-y-auto">
                  <WeightList entries={filteredWeightEntries} onDelete={handleDeleteWeight} compact />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

