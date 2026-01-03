import { describe, it, expect } from 'vitest'
import {
  calculateBMI,
  getBMICategory,
  calculateBMR,
  calculateTDEE,
  calculateRecommendedCalories,
  calculateMacros,
  analyzeWeightTrend,
  calculateStreak,
  detectFoodCalories,
  detectMealType,
  calculateBMRWithBodyComposition
} from '../healthIntelligence'
import { WeightEntry, MealEntry, UserProfile } from '../../types/health'

// ═══════════════════════════════════════════════════════════════
// TESTS BMI (Indice de Masse Corporelle)
// ═══════════════════════════════════════════════════════════════

describe('calculateBMI', () => {
  it('calcule le BMI correctement', () => {
    // BMI = 70 / (1.75)² = 70 / 3.0625 = 22.9
    expect(calculateBMI(70, 175)).toBe(22.9)
  })

  it('calcule le BMI pour différentes morphologies', () => {
    expect(calculateBMI(50, 160)).toBe(19.5)  // Mince
    expect(calculateBMI(90, 180)).toBe(27.8)  // Surpoids
    expect(calculateBMI(100, 170)).toBe(34.6) // Obésité
  })
})

describe('getBMICategory', () => {
  it('classifie underweight (< 18.5)', () => {
    expect(getBMICategory(17)).toBe('underweight')
    expect(getBMICategory(18.4)).toBe('underweight')
  })

  it('classifie normal (18.5-24.9)', () => {
    expect(getBMICategory(18.5)).toBe('normal')
    expect(getBMICategory(22)).toBe('normal')
    expect(getBMICategory(24.9)).toBe('normal')
  })

  it('classifie overweight (25-29.9)', () => {
    expect(getBMICategory(25)).toBe('overweight')
    expect(getBMICategory(27)).toBe('overweight')
    expect(getBMICategory(29.9)).toBe('overweight')
  })

  it('classifie obese (≥ 30)', () => {
    expect(getBMICategory(30)).toBe('obese')
    expect(getBMICategory(35)).toBe('obese')
  })
})

// ═══════════════════════════════════════════════════════════════
// TESTS BMR (Métabolisme de Base) - Formule Mifflin-St Jeor
// ═══════════════════════════════════════════════════════════════

describe('calculateBMR', () => {
  it('calcule le BMR pour un homme', () => {
    // BMR homme = 10 × poids + 6.25 × taille - 5 × âge + 5
    // = 10 × 70 + 6.25 × 175 - 5 × 30 + 5
    // = 700 + 1093.75 - 150 + 5 = 1648.75
    const bmr = calculateBMR(70, 175, 30, 'male')
    expect(bmr).toBeCloseTo(1648.75, 0)
  })

  it('calcule le BMR pour une femme', () => {
    // BMR femme = 10 × poids + 6.25 × taille - 5 × âge - 161
    // = 10 × 60 + 6.25 × 165 - 5 × 25 - 161
    // = 600 + 1031.25 - 125 - 161 = 1345.25
    const bmr = calculateBMR(60, 165, 25, 'female')
    expect(bmr).toBeCloseTo(1345.25, 0)
  })

  it('le BMR augmente avec le poids', () => {
    const bmr60 = calculateBMR(60, 175, 30, 'male')
    const bmr80 = calculateBMR(80, 175, 30, 'male')
    expect(bmr80).toBeGreaterThan(bmr60)
  })

  it('le BMR diminue avec l\'âge', () => {
    const bmr25 = calculateBMR(70, 175, 25, 'male')
    const bmr50 = calculateBMR(70, 175, 50, 'male')
    expect(bmr25).toBeGreaterThan(bmr50)
  })
})

// ═══════════════════════════════════════════════════════════════
// TESTS TDEE (Dépense Énergétique Totale)
// ═══════════════════════════════════════════════════════════════

describe('calculateTDEE', () => {
  const baseBMR = 1500

  it('sédentaire = BMR × 1.2', () => {
    expect(calculateTDEE(baseBMR, 'sedentary')).toBe(1800)
  })

  it('léger = BMR × 1.375', () => {
    expect(calculateTDEE(baseBMR, 'light')).toBe(2063) // arrondi
  })

  it('modéré = BMR × 1.55', () => {
    expect(calculateTDEE(baseBMR, 'moderate')).toBe(2325)
  })

  it('actif = BMR × 1.725', () => {
    expect(calculateTDEE(baseBMR, 'active')).toBe(2588) // arrondi
  })

  it('très actif = BMR × 1.9', () => {
    expect(calculateTDEE(baseBMR, 'very_active')).toBe(2850)
  })

  it('niveau inconnu = BMR × 1.2 (sédentaire par défaut)', () => {
    expect(calculateTDEE(baseBMR, 'unknown')).toBe(1800)
  })
})

// ═══════════════════════════════════════════════════════════════
// TESTS CALORIES RECOMMANDÉES
// ═══════════════════════════════════════════════════════════════

describe('calculateRecommendedCalories', () => {
  const profile: UserProfile = {
    height: 175,
    age: 30,
    gender: 'male',
    activityLevel: 'moderate',
    goal: 'maintain'
  }

  it('maintien = TDEE', () => {
    const calories = calculateRecommendedCalories(profile, 70, 'maintain')
    // BMR ≈ 1649, TDEE ≈ 2556
    expect(calories).toBeGreaterThan(2400)
    expect(calories).toBeLessThan(2700)
  })

  it('perte = TDEE - 500', () => {
    const maintain = calculateRecommendedCalories(profile, 70, 'maintain')
    const lose = calculateRecommendedCalories(profile, 70, 'lose')
    expect(lose).toBe(maintain - 500)
  })

  it('gain = TDEE + 500', () => {
    const maintain = calculateRecommendedCalories(profile, 70, 'maintain')
    const gain = calculateRecommendedCalories(profile, 70, 'gain')
    expect(gain).toBe(maintain + 500)
  })
})

// ═══════════════════════════════════════════════════════════════
// TESTS MACROS
// ═══════════════════════════════════════════════════════════════

describe('calculateMacros', () => {
  it('maintien = 30/40/30 (P/C/F)', () => {
    const macros = calculateMacros(2000, 'maintain')
    // Protéines: 2000 × 0.30 / 4 = 150g
    // Glucides: 2000 × 0.40 / 4 = 200g
    // Lipides: 2000 × 0.30 / 9 = 67g
    expect(macros.protein).toBe(150)
    expect(macros.carbs).toBe(200)
    expect(macros.fat).toBe(67)
  })

  it('perte = plus de protéines (35%)', () => {
    const macros = calculateMacros(2000, 'lose')
    // Protéines: 2000 × 0.35 / 4 = 175g
    expect(macros.protein).toBe(175)
  })

  it('gain = plus de glucides (50%)', () => {
    const macros = calculateMacros(2000, 'gain')
    // Glucides: 2000 × 0.50 / 4 = 250g
    expect(macros.carbs).toBe(250)
  })
})

// ═══════════════════════════════════════════════════════════════
// TESTS TENDANCE POIDS
// ═══════════════════════════════════════════════════════════════

describe('analyzeWeightTrend', () => {
  it('retourne stable si moins de 2 entrées', () => {
    const result = analyzeWeightTrend([{ date: '2024-01-01', weight: 70 }])
    expect(result.trend).toBe('stable')
    expect(result.avgChange).toBe(0)
  })

  it('détecte une tendance à la hausse', () => {
    const entries: WeightEntry[] = [
      { date: '2024-01-01', weight: 70 },
      { date: '2024-01-08', weight: 71 },
      { date: '2024-01-15', weight: 72 },
    ]
    const result = analyzeWeightTrend(entries)
    expect(result.trend).toBe('increasing')
    expect(result.weeklyChange).toBeGreaterThan(0)
  })

  it('détecte une tendance à la baisse', () => {
    const entries: WeightEntry[] = [
      { date: '2024-01-01', weight: 75 },
      { date: '2024-01-08', weight: 74 },
      { date: '2024-01-15', weight: 73 },
    ]
    const result = analyzeWeightTrend(entries)
    expect(result.trend).toBe('decreasing')
    expect(result.weeklyChange).toBeLessThan(0)
  })

  it('détecte une tendance stable (< 0.1 kg/semaine)', () => {
    const entries: WeightEntry[] = [
      { date: '2024-01-01', weight: 70.0 },
      { date: '2024-01-08', weight: 70.05 },
      { date: '2024-01-15', weight: 70.08 },
    ]
    const result = analyzeWeightTrend(entries)
    expect(result.trend).toBe('stable')
  })
})

// ═══════════════════════════════════════════════════════════════
// TESTS STREAK
// ═══════════════════════════════════════════════════════════════

describe('calculateStreak', () => {
  it('retourne 0 si aucune entrée', () => {
    expect(calculateStreak([])).toBe(0)
  })

  it('compte les jours consécutifs', () => {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const entries: WeightEntry[] = [
      { date: today, weight: 70 },
      { date: yesterday, weight: 70 },
      { date: twoDaysAgo, weight: 70 },
    ]
    
    expect(calculateStreak(entries)).toBe(3)
  })

  it('reset si jour manquant', () => {
    const today = new Date().toISOString().split('T')[0]
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const entries: WeightEntry[] = [
      { date: today, weight: 70 },
      { date: threeDaysAgo, weight: 70 }, // Trou de 2 jours
    ]
    
    expect(calculateStreak(entries)).toBe(1) // Seulement aujourd'hui
  })
})

// ═══════════════════════════════════════════════════════════════
// TESTS DÉTECTION ALIMENTS
// ═══════════════════════════════════════════════════════════════

describe('detectFoodCalories', () => {
  it('détecte les fruits', () => {
    expect(detectFoodCalories('Pomme')).toBe(52)
    expect(detectFoodCalories('Banane')).toBe(89)
  })

  it('détecte les protéines', () => {
    expect(detectFoodCalories('Poulet grillé')).toBe(165)
    expect(detectFoodCalories('Oeuf brouillé')).toBe(155)
  })

  it('détecte les féculents', () => {
    expect(detectFoodCalories('Riz blanc')).toBe(130)
    expect(detectFoodCalories('Pâtes bolognaise')).toBe(131)
  })

  it('retourne 200 par défaut', () => {
    expect(detectFoodCalories('Plat inconnu')).toBe(200)
  })
})

// ═══════════════════════════════════════════════════════════════
// TESTS DÉTECTION TYPE DE REPAS
// ═══════════════════════════════════════════════════════════════

describe('detectMealType', () => {
  it('détecte le petit-déjeuner (6h-11h)', () => {
    expect(detectMealType('07:30')).toBe('breakfast')
    expect(detectMealType('10:00')).toBe('breakfast')
  })

  it('détecte le déjeuner (11h-15h)', () => {
    expect(detectMealType('12:00')).toBe('lunch')
    expect(detectMealType('14:30')).toBe('lunch')
  })

  it('détecte le dîner (18h-22h)', () => {
    expect(detectMealType('19:00')).toBe('dinner')
    expect(detectMealType('21:00')).toBe('dinner')
  })

  it('détecte les snacks (autres heures)', () => {
    expect(detectMealType('16:00')).toBe('snack')
    expect(detectMealType('23:00')).toBe('snack')
    expect(detectMealType('05:00')).toBe('snack')
  })
})

// ═══════════════════════════════════════════════════════════════
// TESTS BMR AVEC COMPOSITION CORPORELLE (Katch-McArdle)
// ═══════════════════════════════════════════════════════════════

describe('calculateBMRWithBodyComposition', () => {
  it('calcule le BMR avec masse grasse', () => {
    // Poids: 70kg, masse grasse: 20%
    // Masse maigre = 70 × 0.80 = 56kg
    // BMR = 370 + (21.6 × 56) = 370 + 1209.6 = 1579.6
    const bmr = calculateBMRWithBodyComposition(70, 20)
    expect(bmr).toBeCloseTo(1580, 0)
  })

  it('plus de masse musculaire = BMR plus élevé', () => {
    // Même poids, moins de masse grasse = plus de muscle
    const bmrFat30 = calculateBMRWithBodyComposition(70, 30) // 30% fat
    const bmrFat15 = calculateBMRWithBodyComposition(70, 15) // 15% fat
    expect(bmrFat15).toBeGreaterThan(bmrFat30)
  })
})





