/**
 * Formulaire inline pour ajouter un poids
 * Remplace le modal pour une meilleure UX
 */
import { useState, useRef, useEffect } from 'react'
import { Scale, X, ChevronDown, ChevronUp, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface InlineWeightFormProps {
  onSubmit: (data: { weight: number; date: string; note?: string }) => { success: boolean; error?: string }
  onCancel: () => void
  lastWeight?: number
  targetWeight?: number
}

export function InlineWeightForm({
  onSubmit,
  onCancel,
  lastWeight,
  targetWeight
}: InlineWeightFormProps) {
  const [weight, setWeight] = useState(lastWeight?.toString() || '')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  const weightNum = parseFloat(weight)
  const isValidWeight = !isNaN(weightNum) && weightNum > 0 && weightNum < 500

  // Calcul de la différence avec le dernier poids
  const weightDiff = lastWeight && isValidWeight ? weightNum - lastWeight : null

  // Calcul de la distance à l'objectif
  const distanceToTarget = targetWeight && isValidWeight ? weightNum - targetWeight : null

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')

    if (!isValidWeight) {
      setError('Veuillez entrer un poids valide (0-500 kg)')
      return
    }

    const result = onSubmit({ weight: weightNum, date, note: note || undefined })

    if (result.success) {
      setWeight('')
      setNote('')
      onCancel()
    } else if (result.error) {
      setError(result.error)
    }
  }

  return (
    <div className="bg-zinc-900/80 rounded-xl border border-rose-500/30 overflow-hidden">
      {/* Header cliquable */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-zinc-200">Nouvelle pesée</h3>
            {isValidWeight && (
              <p className="text-xs text-rose-400">{weightNum.toFixed(1)} kg</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCancel() }}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-zinc-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-500" />
          )}
        </div>
      </button>

      {/* Contenu */}
      {isExpanded && (
        <div className="p-4 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Erreur */}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <p className="text-xs text-rose-400">{error}</p>
              </div>
            )}

            {/* Input poids avec feedback visuel */}
            <div className="space-y-2">
              <Input
                ref={inputRef}
                label="Poids (kg)"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="75.5"
                step="0.1"
                min="0"
                max="500"
              />

              {/* Feedback de progression */}
              {isValidWeight && (
                <div className="flex items-center gap-3 text-xs">
                  {/* Différence avec dernier poids */}
                  {weightDiff !== null && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                      weightDiff < 0
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : weightDiff > 0
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-zinc-500/10 text-zinc-400'
                    }`}>
                      {weightDiff < 0 ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : weightDiff > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                      <span>
                        {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} kg
                      </span>
                    </div>
                  )}

                  {/* Distance à l'objectif */}
                  {distanceToTarget !== null && (
                    <div className="text-zinc-500">
                      {distanceToTarget > 0 ? (
                        <span>Encore {distanceToTarget.toFixed(1)} kg à perdre</span>
                      ) : distanceToTarget < 0 ? (
                        <span>Encore {Math.abs(distanceToTarget).toFixed(1)} kg à prendre</span>
                      ) : (
                        <span className="text-emerald-400">Objectif atteint !</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Date */}
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />

            {/* Note optionnelle */}
            <Input
              label="Note (optionnel)"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Après le sport, à jeun..."
              maxLength={100}
            />

            {/* Raccourcis rapides */}
            {lastWeight && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-zinc-500">Raccourcis:</span>
                {[-0.5, -0.2, 0, +0.2, +0.5].map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setWeight((lastWeight + diff).toFixed(1))}
                    className={`px-2 py-1 text-xs rounded-lg transition-all ${
                      parseFloat(weight) === lastWeight + diff
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 border border-zinc-700/50'
                    }`}
                  >
                    {diff > 0 ? '+' : ''}{diff === 0 ? '=' : diff} kg
                  </button>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={onCancel}
                type="button"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                type="submit"
                disabled={!isValidWeight}
                className="flex-1"
              >
                Ajouter
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
