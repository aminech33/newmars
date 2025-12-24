/**
 * 🏠 HubV2 — Launcher minimaliste + Wellbeing Score
 * 
 * Design : Navigation pure, pas de distraction
 */

import { useStore } from '../store/useStore'
import { useBrain } from '../brain'
import { Brain } from 'lucide-react'

const pages = [
  { id: 'tasks', label: 'Tâches' },
  { id: 'myday', label: 'Ma journée' },
  { id: 'learning', label: 'Apprentissage' },
  { id: 'library', label: 'Bibliothèque' },
  { id: 'settings', label: 'Paramètres' },
]

export function HubV2() {
  const setView = useStore((state) => state.setView)
  const userName = useStore((state) => state.userName)
  const { wellbeing } = useBrain()
  
  const today = new Date()
  const dateStr = today.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  })
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
  
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      
      {/* Date & Greeting */}
      <div className="text-center mb-8">
        <p className="text-zinc-600 text-sm mb-1">{formattedDate}</p>
        <h1 className="text-3xl text-zinc-300 font-light">
          {greeting}{userName ? `, ${userName}` : ''}
        </h1>
      </div>
      
      {/* Wellbeing Score */}
      <div className="mb-12 w-full max-w-xs">
        <div className="px-4 py-3 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-500">Bien-être</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-zinc-200">{wellbeing.overall}</span>
              <span className={`text-xs ${
                wellbeing.trend === 'improving' ? 'text-emerald-400' : 
                wellbeing.trend === 'declining' ? 'text-rose-400' : 
                'text-zinc-500'
              }`}>
                {wellbeing.trend === 'improving' && `+${wellbeing.trendPercent}%`}
                {wellbeing.trend === 'declining' && `-${wellbeing.trendPercent}%`}
                {wellbeing.trend === 'stable' && '→'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation - Titres principaux */}
      <nav className="flex flex-col items-center gap-4">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => setView(page.id as any)}
            className="text-zinc-400 hover:text-zinc-200 transition-colors text-lg font-light"
          >
            {page.label}
          </button>
        ))}
      </nav>
      
    </div>
  )
}
