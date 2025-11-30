import { ArrowLeft } from 'lucide-react'

interface ViewHeaderProps {
  title: string
  subtitle?: string
  onBack: () => void
}

export function ViewHeader({ title, subtitle, onBack }: ViewHeaderProps) {
  return (
    <header className="flex-shrink-0 px-6 py-6 border-b border-white/5">
      <div className="max-w-2xl mx-auto flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors card-press"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tighter text-zinc-100">{title}</h1>
          {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
        </div>
      </div>
    </header>
  )
}


interface ViewHeaderProps {
  title: string
  subtitle?: string
  onBack: () => void
}

export function ViewHeader({ title, subtitle, onBack }: ViewHeaderProps) {
  return (
    <header className="flex-shrink-0 px-6 py-6 border-b border-white/5">
      <div className="max-w-2xl mx-auto flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors card-press"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tighter text-zinc-100">{title}</h1>
          {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
        </div>
      </div>
    </header>
  )
}


