import { useMemo } from 'react'

interface MacrosCircularChartProps {
  protein: number
  carbs: number
  fat: number
  size?: number
}

export function MacrosCircularChart({ 
  protein, 
  carbs, 
  fat, 
  size = 200 
}: MacrosCircularChartProps) {
  
  // Calculer les calories par macro
  const caloriesFromProtein = protein * 4
  const caloriesFromCarbs = carbs * 4
  const caloriesFromFat = fat * 9
  const totalCalories = caloriesFromProtein + caloriesFromCarbs + caloriesFromFat

  // Calculer les pourcentages
  const percentages = useMemo(() => {
    if (totalCalories === 0) return { protein: 0, carbs: 0, fat: 0 }
    
    return {
      protein: Math.round((caloriesFromProtein / totalCalories) * 100),
      carbs: Math.round((caloriesFromCarbs / totalCalories) * 100),
      fat: Math.round((caloriesFromFat / totalCalories) * 100)
    }
  }, [caloriesFromProtein, caloriesFromCarbs, caloriesFromFat, totalCalories])

  // Calculer les angles pour le SVG
  const radius = (size / 2) - 10
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  // Positions des segments (en pourcentage du cercle)
  const proteinOffset = 0
  const carbsOffset = percentages.protein
  const fatOffset = percentages.protein + percentages.carbs

  // Fonction pour créer un arc SVG
  const createArc = (startPercent: number, endPercent: number) => {
    const start = (startPercent / 100) * circumference
    const length = ((endPercent - startPercent) / 100) * circumference
    return { strokeDasharray: `${length} ${circumference}`, strokeDashoffset: -start }
  }

  const proteinArc = createArc(proteinOffset, proteinOffset + percentages.protein)
  const carbsArc = createArc(carbsOffset, carbsOffset + percentages.carbs)
  const fatArc = createArc(fatOffset, fatOffset + percentages.fat)

  if (totalCalories === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="text-center">
          <p className="text-zinc-600 text-sm">Aucune donnée</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* SVG Circle */}
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="20"
        />
        
        {/* Protein arc */}
        {percentages.protein > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#fb7185" // rose-400
            strokeWidth="20"
            strokeLinecap="round"
            style={{
              ...proteinArc,
              transition: 'stroke-dashoffset 0.5s ease'
            }}
          />
        )}
        
        {/* Carbs arc */}
        {percentages.carbs > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#fbbf24" // amber-400
            strokeWidth="20"
            strokeLinecap="round"
            style={{
              ...carbsArc,
              transition: 'stroke-dashoffset 0.5s ease'
            }}
          />
        )}
        
        {/* Fat arc */}
        {percentages.fat > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#facc15" // yellow-400
            strokeWidth="20"
            strokeLinecap="round"
            style={{
              ...fatArc,
              transition: 'stroke-dashoffset 0.5s ease'
            }}
          />
        )}
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <p className="text-3xl font-bold text-white">{totalCalories}</p>
        <p className="text-xs text-zinc-500">kcal</p>
      </div>

      {/* Legend */}
      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-full">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-400" />
            <span className="text-xs text-zinc-400">P {percentages.protein}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-xs text-zinc-400">G {percentages.carbs}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="text-xs text-zinc-400">L {percentages.fat}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}




