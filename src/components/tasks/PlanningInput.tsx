/**
 * 🎯 PlanningInput - Input simple pour démarrer la planification IA
 * S'affiche dans le header de la colonne "Plus tard"
 */

import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { fontStack } from './taskUtils'

interface PlanningInputProps {
  onAnalyze: (domain: string) => Promise<void>
  onClose: () => void
}

export function PlanningInput({ onAnalyze, onClose }: PlanningInputProps) {
  const [domain, setDomain] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!domain.trim() || domain.trim().length < 2) {
      setError('Entre au moins 2 caractères')
      return
    }
    
    setIsAnalyzing(true)
    setError(null)
    
    try {
      await onAnalyze(domain.trim())
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Erreur inconnue')
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="Définir le projet... (ex: Python, React)"
            className={`w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[13px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 ${fontStack}`}
            disabled={isAnalyzing}
            autoFocus
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={!domain.trim() || isAnalyzing}
          className={`px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1.5 ${fontStack}`}
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Analyser'
          )}
        </button>
        <button
          onClick={onClose}
          className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {error && (
        <p className={`mt-2 text-[11px] text-rose-400 ${fontStack}`}>{error}</p>
      )}
      {isAnalyzing && (
        <p className={`mt-2 text-[11px] text-zinc-500 ${fontStack}`}>
          Analyse en cours...
        </p>
      )}
    </div>
  )
}

