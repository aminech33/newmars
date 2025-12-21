import { useStore } from '../store/useStore'

const pages = [
  { id: 'tasks', label: 'Tâches' },
  { id: 'health', label: 'Santé' },
  { id: 'myday', label: 'Ma journée' },
  { id: 'learning', label: 'Apprentissage' },
  { id: 'library', label: 'Bibliothèque' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'docs', label: 'Diagramme' },
  { id: 'settings', label: 'Paramètres' },
]

export function HubV2() {
  const setView = useStore((state) => state.setView)
  const userName = useStore((state) => state.userName)
  
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
      <div className="text-center mb-12">
        <p className="text-zinc-600 text-sm mb-1">{formattedDate}</p>
        <h1 className="text-3xl text-zinc-300 font-light">
          {greeting}{userName ? `, ${userName}` : ''}
        </h1>
      </div>
      
      {/* Simple links */}
      <nav className="flex flex-col items-center gap-2">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => setView(page.id as any)}
            className="text-zinc-500 hover:text-white transition-colors text-lg"
          >
            {page.label}
          </button>
        ))}
      </nav>
      
    </div>
  )
}
