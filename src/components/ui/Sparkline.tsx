interface SparklineProps {
  data: number[]
  color?: string
  className?: string
  height?: number
}

export function Sparkline({ data, color = '#10b981', className = '' }: SparklineProps) {
  if (data.length === 0) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className}`}>
        <span className="text-xs text-zinc-600">Aucune donnée</span>
      </div>
    )
  }

  const max = Math.max(...data, 1) // Avoid division by zero
  const min = Math.min(...data, 0)
  const range = max - min || 1

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - ((value - min) / range) * 100
    return `${x},${y}`
  }).join(' ')

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`w-full h-full ${className}`}
    >
      {/* Grid lines */}
      <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
      <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
      <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

      {/* Area fill */}
      <polygon
        points={`0,100 ${points} 100,100`}
        fill={color}
        fillOpacity="0.1"
      />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Points */}
      {data.map((value, i) => {
        const x = (i / (data.length - 1)) * 100
        const y = 100 - ((value - min) / range) * 100
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="2"
            fill={color}
            opacity="0.8"
          />
        )
      })}
    </svg>
  )
}
