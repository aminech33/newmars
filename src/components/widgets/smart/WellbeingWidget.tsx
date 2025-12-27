/**
 * 🧠 WellbeingWidget — Score de bien-être
 * 
 * Affiche le score concret + tendance
 */

import { memo } from 'react'
import { SmartWidget } from '../SmartWidget'
import { useBrain } from '../../../insights'
import { useStore } from '../../../store/useStore'

export const WellbeingWidget = memo(function WellbeingWidget() {
  const { wellbeing } = useBrain()
  const { setView } = useStore()
  
  // Couleur basée sur le score
  const getAccent = (score: number): 'emerald' | 'amber' | 'violet' | 'zinc' => {
    if (score >= 70) return 'emerald'
    if (score >= 50) return 'zinc'
    if (score >= 30) return 'amber'
    return 'violet'
  }
  
  // Tendance en texte court
  const getTrend = (): string | undefined => {
    if (wellbeing.trend === 'improving' && wellbeing.trendPercent > 5) {
      return `↑ +${Math.round(wellbeing.trendPercent)}%`
    }
    if (wellbeing.trend === 'declining' && wellbeing.trendPercent > 5) {
      return `↓ -${Math.round(wellbeing.trendPercent)}%`
    }
    return 'stable'
  }
  
  return (
    <SmartWidget
      title="Bien-être"
      main={<span className="text-2xl font-light">{Math.round(wellbeing.overall)}</span>}
      context={getTrend()}
      accent={getAccent(wellbeing.overall)}
      onTap={() => setView('dashboard')}
    />
  )
})

