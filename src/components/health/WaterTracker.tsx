import { memo, useMemo } from 'react'
import { Droplets, Plus, Minus } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Tooltip } from '../ui/Tooltip'

const GLASS_SIZE_ML = 250 // Taille standard d'un verre
const DAILY_GOAL_ML = 2000 // Objectif 2L par jour

export const WaterTracker = memo(function WaterTracker() {
  const { hydrationEntries, addHydrationEntry } = useStore()
  
  const today = new Date().toISOString().split('T')[0]
  
  // Calculer le total d'eau bu aujourd'hui
  const todayWater = useMemo(() => {
    return hydrationEntries
      .filter(entry => entry.date === today)
      .reduce((sum, entry) => sum + entry.amount, 0)
  }, [hydrationEntries, today])
  
  const glassesCount = Math.floor(todayWater / GLASS_SIZE_ML)
  const totalGlassesNeeded = Math.ceil(DAILY_GOAL_ML / GLASS_SIZE_ML)
  const progressPercent = Math.min((todayWater / DAILY_GOAL_ML) * 100, 100)
  
  // Ajouter un verre d'eau rapidement
  const handleAddGlass = () => {
    const now = new Date()
    addHydrationEntry({
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      amount: GLASS_SIZE_ML
    })
  }
  
  // Ajouter une quantité personnalisée
  const handleAddCustom = (amount: number) => {
    const now = new Date()
    addHydrationEntry({
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      amount
    })
  }
  
  // Retirer un verre (si erreur)
  const handleRemoveGlass = () => {
    if (glassesCount === 0) return
    const now = new Date()
    addHydrationEntry({
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      amount: -GLASS_SIZE_ML
    })
  }
  
  const getStatusMessage = () => {
    if (todayWater >= DAILY_GOAL_ML) return '🎉 Objectif atteint !'
    if (todayWater >= DAILY_GOAL_ML * 0.75) return '💪 Presque !'
    if (todayWater >= DAILY_GOAL_ML * 0.5) return '👍 Bon début'
    if (todayWater > 0) return '💧 Continue !'
    return '🚰 Commence à boire'
  }
  
  return (
    <div 
      className="bg-zinc-900/30 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      role="region"
      aria-label="Suivi hydratation"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-xl">
            <Droplets className="w-5 h-5 text-cyan-400" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-zinc-200">Hydratation</h3>
            <p className="text-xs text-zinc-500">{getStatusMessage()}</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-2xl font-bold text-cyan-400">{todayWater}ml</p>
          <p className="text-xs text-zinc-600">/ {DAILY_GOAL_ML}ml</p>
        </div>
      </div>
      
      {/* Barre de progression */}
      <div 
        className="mb-4 h-3 bg-zinc-800 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={todayWater}
        aria-valuemin={0}
        aria-valuemax={DAILY_GOAL_ML}
        aria-label="Hydratation du jour"
      >
        <div 
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-[width] duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      {/* Verres visuels */}
      <div className="flex items-center gap-1 mb-4 flex-wrap">
        {Array.from({ length: totalGlassesNeeded }, (_, i) => (
          <Tooltip key={i} content={`Verre ${i + 1}`}>
            <div
              className={`w-8 h-10 rounded-lg border-2 transition-all duration-300 ${
                i < glassesCount
                  ? 'bg-cyan-500/30 border-cyan-500'
                  : 'bg-zinc-800/30 border-zinc-700'
              }`}
              aria-label={`Verre ${i + 1} ${i < glassesCount ? 'bu' : 'non bu'}`}
            />
          </Tooltip>
        ))}
      </div>
      
      {/* Compteur verres */}
      <div className="text-center mb-4">
        <span className="text-sm text-zinc-400">
          <span className="text-cyan-400 font-bold text-lg">{glassesCount}</span> / {totalGlassesNeeded} verres
        </span>
      </div>
      
      {/* Boutons d'action */}
      <div className="space-y-2">
        {/* Bouton principal : Ajouter un verre */}
        <button
          onClick={handleAddGlass}
          className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan-500/25"
          aria-label="Ajouter un verre d'eau"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          <span>Ajouter un verre ({GLASS_SIZE_ML}ml)</span>
        </button>
        
        {/* Boutons quantités rapides */}
        <div className="grid grid-cols-3 gap-2">
          <Tooltip content="Petite gorgée">
            <button
              onClick={() => handleAddCustom(100)}
              className="py-2 px-3 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 text-sm rounded-xl transition-colors"
              aria-label="Ajouter 100ml"
            >
              +100ml
            </button>
          </Tooltip>
          
          <Tooltip content="Demi verre">
            <button
              onClick={() => handleAddCustom(125)}
              className="py-2 px-3 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 text-sm rounded-xl transition-colors"
              aria-label="Ajouter 125ml"
            >
              +125ml
            </button>
          </Tooltip>
          
          <Tooltip content="Bouteille">
            <button
              onClick={() => handleAddCustom(500)}
              className="py-2 px-3 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 text-sm rounded-xl transition-colors"
              aria-label="Ajouter 500ml"
            >
              +500ml
            </button>
          </Tooltip>
        </div>
        
        {/* Bouton retirer (si erreur) */}
        {glassesCount > 0 && (
          <button
            onClick={handleRemoveGlass}
            className="w-full py-2 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
            aria-label="Retirer un verre"
          >
            <Minus className="w-4 h-4" aria-hidden="true" />
            <span>Retirer un verre (erreur)</span>
          </button>
        )}
      </div>
      
      {/* Statistiques rapides */}
      <div className="mt-4 pt-4 border-t border-zinc-800/50 grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-xs text-zinc-600">Reste</p>
          <p className="text-sm font-medium text-zinc-300">
            {Math.max(0, DAILY_GOAL_ML - todayWater)}ml
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-600">Progrès</p>
          <p className="text-sm font-medium text-cyan-400">
            {Math.round(progressPercent)}%
          </p>
        </div>
      </div>
    </div>
  )
})






