interface SparklineProps {
  data: number[]
  color?: string
  height?: number
  className?: string
}

export function Sparkline({ data, color = 'rgb(99, 102, 241)', height = 32, className = '' }: SparklineProps) {
  if (data.length === 0) return null

  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1

  // Créer les points du path SVG
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((value - min) / range) * 100
    return `${x},${y}`
  }).join(' ')

  return (
    <svg 
      viewBox="0 0 100 100" 
      preserveAspectRatio="none"
      style={{ height: `${height}px` }}
      className={`w-full ${className}`}
      role="img"
      aria-label="Graphique de tendance"
    >
      {/* Ligne de tendance */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* Zone sous la courbe */}
      <polyline
        points={`0,100 ${points} 100,100`}
        fill={color}
        fillOpacity="0.1"
      />
    </svg>
  )
}

