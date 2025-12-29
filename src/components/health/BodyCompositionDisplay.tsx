import { TrendingUp, TrendingDown, Activity, Droplets, Bone, Heart } from 'lucide-react'
import { WeightEntry } from '../../types/health'

interface BodyCompositionDisplayProps {
  latestEntry: WeightEntry | null
}

export function BodyCompositionDisplay({ latestEntry }: BodyCompositionDisplayProps) {
  if (!latestEntry || !latestEntry.fatMassPercent) {
    return null // Pas de données de composition corporelle
  }

  const { weight, fatMassPercent, muscleMass, boneMass, waterPercent, heartRate } = latestEntry

  // Calculer les masses
  const fatMass = weight * (fatMassPercent / 100)
  const leanMass = weight - fatMass

  // Catégoriser le niveau de masse grasse
  const getFatCategory = (percent: number, gender: 'male' | 'female' = 'male') => {
    if (gender === 'male') {
      if (percent < 6) return { label: 'Athlète (très faible)', color: 'text-amber-400', bg: 'bg-amber-500/10' }
      if (percent < 14) return { label: 'Athlète / Fitness', color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
      if (percent < 18) return { label: 'Normal', color: 'text-sky-400', bg: 'bg-sky-500/10' }
      if (percent < 25) return { label: 'Modéré', color: 'text-orange-400', bg: 'bg-orange-500/10' }
      return { label: 'Élevé', color: 'text-rose-400', bg: 'bg-rose-500/10' }
    } else {
      if (percent < 14) return { label: 'Athlète (très faible)', color: 'text-amber-400', bg: 'bg-amber-500/10' }
      if (percent < 21) return { label: 'Athlète / Fitness', color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
      if (percent < 25) return { label: 'Normal', color: 'text-sky-400', bg: 'bg-sky-500/10' }
      if (percent < 32) return { label: 'Modéré', color: 'text-orange-400', bg: 'bg-orange-500/10' }
      return { label: 'Élevé', color: 'text-rose-400', bg: 'bg-rose-500/10' }
    }
  }

  const fatCategory = getFatCategory(fatMassPercent)

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center">
          <Activity className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-zinc-300">
            Composition corporelle
          </h3>
          <p className="text-xs text-zinc-500">
            Données Withings
          </p>
        </div>
      </div>

      {/* Répartition masse maigre / masse grasse */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-800/50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <p className="text-xs text-zinc-500">Masse maigre</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {leanMass.toFixed(1)}
            <span className="text-sm text-zinc-500 ml-1">kg</span>
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            {((leanMass / weight) * 100).toFixed(0)}% du poids total
          </p>
        </div>

        <div className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-800/50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-amber-400" />
            <p className="text-xs text-zinc-500">Masse grasse</p>
          </div>
          <p className="text-2xl font-bold text-amber-400">
            {fatMass.toFixed(1)}
            <span className="text-sm text-zinc-500 ml-1">kg</span>
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            {fatMassPercent.toFixed(1)}% du poids total
          </p>
        </div>
      </div>

      {/* Catégorie de masse grasse */}
      <div className={`p-3 ${fatCategory.bg} rounded-lg border border-${fatCategory.color.replace('text-', '')}/20`}>
        <p className="text-xs text-zinc-500 mb-1">Niveau de masse grasse</p>
        <p className={`text-sm font-medium ${fatCategory.color}`}>
          {fatCategory.label}
        </p>
      </div>

      {/* Métriques additionnelles */}
      <div className="grid grid-cols-2 gap-3">
        {muscleMass && (
          <div className="p-3 bg-zinc-900/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3.5 h-3.5 text-violet-400" />
              <p className="text-xs text-zinc-500">Muscles</p>
            </div>
            <p className="text-lg font-bold text-violet-400">
              {muscleMass.toFixed(1)}
              <span className="text-xs text-zinc-500 ml-1">kg</span>
            </p>
          </div>
        )}

        {waterPercent && (
          <div className="p-3 bg-zinc-900/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <p className="text-xs text-zinc-500">Hydratation</p>
            </div>
            <p className="text-lg font-bold text-cyan-400">
              {waterPercent.toFixed(1)}
              <span className="text-xs text-zinc-500 ml-1">%</span>
            </p>
          </div>
        )}

        {boneMass && (
          <div className="p-3 bg-zinc-900/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Bone className="w-3.5 h-3.5 text-zinc-400" />
              <p className="text-xs text-zinc-500">Masse osseuse</p>
            </div>
            <p className="text-lg font-bold text-zinc-400">
              {boneMass.toFixed(1)}
              <span className="text-xs text-zinc-500 ml-1">kg</span>
            </p>
          </div>
        )}

        {heartRate && (
          <div className="p-3 bg-zinc-900/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <p className="text-xs text-zinc-500">Fréquence</p>
            </div>
            <p className="text-lg font-bold text-rose-400">
              {heartRate}
              <span className="text-xs text-zinc-500 ml-1">bpm</span>
            </p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-zinc-900/30 rounded-lg">
        <p className="text-xs text-zinc-500">
          💡 <span className="text-zinc-400">La masse musculaire brûle 6x plus de calories que la masse grasse.</span> Augmente tes protéines (30-35%) pour préserver ou développer ta masse maigre.
        </p>
      </div>
    </div>
  )
}



