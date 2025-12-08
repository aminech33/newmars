import { useState, useRef, useEffect, memo } from 'react'
import { FlaskConical } from 'lucide-react'

interface TestLabFloatingBubbleProps {
  onOpenQuickView: () => void
}

export const TestLabFloatingBubble = memo(function TestLabFloatingBubble({
  onOpenQuickView
}: TestLabFloatingBubbleProps) {
  console.log('🎈 [MOUNT] TestLabFloatingBubble monté !')
  
  // Position par défaut : en haut à droite avec un peu de marge
  const getInitialPosition = () => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1920
    const pos = { x: width - 80, y: 80 }
    console.log('🎈 [INIT] Position initiale calculée:', pos, 'window.innerWidth:', width)
    return pos
  }

  const [position, setPosition] = useState(getInitialPosition())
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const bubbleRef = useRef<HTMLDivElement>(null)

  // Charger la position sauvegardée
  useEffect(() => {
    console.log('🎈 [LOAD] Chargement position localStorage...')
    const savedPosition = localStorage.getItem('testlab-bubble-position')
    if (savedPosition) {
      const pos = JSON.parse(savedPosition)
      console.log('🎈 [LOAD] Position trouvée:', pos)
      setPosition(pos)
    } else {
      console.log('🎈 [LOAD] Aucune position sauvegardée, utilisation position par défaut')
    }
  }, [])

  // Sauvegarder la position
  useEffect(() => {
    if (!isDragging) {
      localStorage.setItem('testlab-bubble-position', JSON.stringify(position))
    }
  }, [position, isDragging])

  // Gérer le début du drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragOffset({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    })
  }

  // Gérer le déplacement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y

      // Limites de l'écran
      const maxX = window.innerWidth - 60
      const maxY = window.innerHeight - 60

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      })
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return

      const touch = e.touches[0]
      const newX = touch.clientX - dragOffset.x
      const newY = touch.clientY - dragOffset.y

      const maxX = window.innerWidth - 60
      const maxY = window.innerHeight - 60

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  // Gérer le clic sur la bulle
  const handleClick = (e: React.MouseEvent) => {
    // Empêcher le clic si on vient de faire un drag
    if (!isDragging) {
      console.log('🎈 Clic sur la bulle - Ouverture vue rapide')
      onOpenQuickView()
    }
  }

  console.log('🎈 [RENDER] TestLabFloatingBubble rendu à:', position, 'isDragging:', isDragging)

  return (
    <>
      {/* Bulle principale */}
      <div
        ref={bubbleRef}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '56px',
          height: '56px',
          zIndex: 99999,
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: 'box-shadow 0.3s'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
      >
        <div
          style={{
            position: 'relative',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
            boxShadow: '0 10px 25px rgba(99, 102, 241, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: isDragging ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.3s, box-shadow 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(99, 102, 241, 0.6)'
          }}
          onMouseLeave={(e) => {
            if (!isDragging) {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(99, 102, 241, 0.5)'
            }
          }}
        >
          <FlaskConical style={{ width: '24px', height: '24px', color: 'white' }} />
          
          {/* Badge de notification */}
          <div 
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '16px',
              height: '16px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              border: '2px solid #18181b',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
          />
        </div>
      </div>

      {/* Aide visuelle pendant le drag */}
      {isDragging && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40,
            pointerEvents: 'none',
            background: 'radial-gradient(circle at center, transparent 50%, rgba(0,0,0,0.5) 100%)'
          }}
        />
      )}
    </>
  )
})

