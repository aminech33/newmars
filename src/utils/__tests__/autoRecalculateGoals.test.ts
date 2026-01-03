import { describe, it, expect, vi } from 'vitest'
import {
  shouldRecalculateObjectives,
  getRecalculationMessage
} from '../autoRecalculateGoals'
import { WeightEntry } from '../../types/health'

// ═══════════════════════════════════════════════════════════════
// TESTS SHOULD RECALCULATE OBJECTIVES
// ═══════════════════════════════════════════════════════════════

describe('shouldRecalculateObjectives', () => {
  it('retourne true si aucune entrée précédente', () => {
    expect(shouldRecalculateObjectives(70, [])).toBe(true)
  })

  it('retourne true si différence >= seuil (2kg par défaut)', () => {
    const entries: WeightEntry[] = [
      { date: '2024-12-27', weight: 70 }
    ]
    expect(shouldRecalculateObjectives(72.5, entries)).toBe(true) // +2.5kg
    expect(shouldRecalculateObjectives(67.5, entries)).toBe(true) // -2.5kg
  })

  it('retourne false si différence < seuil', () => {
    const entries: WeightEntry[] = [
      { date: '2024-12-27', weight: 70 }
    ]
    expect(shouldRecalculateObjectives(71, entries)).toBe(false) // +1kg < 2kg
    expect(shouldRecalculateObjectives(69, entries)).toBe(false) // -1kg < 2kg
  })

  it('utilise le seuil personnalisé', () => {
    const entries: WeightEntry[] = [
      { date: '2024-12-27', weight: 70 }
    ]
    // Seuil de 1kg
    expect(shouldRecalculateObjectives(71.5, entries, 1)).toBe(true) // +1.5kg >= 1kg
    expect(shouldRecalculateObjectives(70.5, entries, 1)).toBe(false) // +0.5kg < 1kg
  })

  it('compare avec le poids le plus récent', () => {
    const entries: WeightEntry[] = [
      { date: '2024-12-25', weight: 68 }, // Plus ancien
      { date: '2024-12-27', weight: 70 }, // Plus récent
      { date: '2024-12-26', weight: 69 }, // Entre les deux
    ]
    // Doit comparer avec 70kg (le plus récent par date)
    expect(shouldRecalculateObjectives(72.5, entries)).toBe(true) // 72.5 - 70 = 2.5 >= 2
    expect(shouldRecalculateObjectives(71, entries)).toBe(false)  // 71 - 70 = 1 < 2
  })
})

// ═══════════════════════════════════════════════════════════════
// TESTS GET RECALCULATION MESSAGE
// ═══════════════════════════════════════════════════════════════

describe('getRecalculationMessage', () => {
  it('affiche un message de prise de poids', () => {
    const message = getRecalculationMessage(70, 72, 2000, 2100)
    expect(message).toContain('+2.0kg')
    expect(message).toContain('+100 kcal')
  })

  it('affiche un message de perte de poids', () => {
    const message = getRecalculationMessage(72, 70, 2100, 2000)
    expect(message).toContain('-2.0kg')
    expect(message).toContain('-100 kcal')
  })

  it('formate correctement les décimales', () => {
    const message = getRecalculationMessage(70.5, 72.3, 2000, 2150)
    expect(message).toContain('+1.8kg')
    expect(message).toContain('+150 kcal')
  })
})





