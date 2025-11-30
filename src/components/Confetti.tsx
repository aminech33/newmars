import { useEffect, useState } from 'react'

interface ConfettiProps {
  trigger: boolean
}

interface Particle {
  id: number
  x: number
  y: number
  color: string
  rotation: number
  velocity: { x: number; y: number }
}

export function Confetti({ trigger }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!trigger) return

    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e']
    const newParticles: Particle[] = Array.from({ length: 20 }, (_, i) => ({
      id: Date.now() + i,
      x: 50,
      y: 50,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      velocity: {
        x: (Math.random() - 0.5) * 8,
        y: (Math.random() - 0.5) * 8 - 2,
      },
    }))

    setParticles(newParticles)

    setTimeout(() => setParticles([]), 1000)
  }, [trigger])

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-sm animate-confetti"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            animation: `confettiFall 1s ease-out forwards`,
            '--velocity-x': `${particle.velocity.x}vw`,
            '--velocity-y': `${particle.velocity.y}vh`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

