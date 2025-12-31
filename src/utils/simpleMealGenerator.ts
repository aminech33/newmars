/**
 * 🍽️ Simple Meal Generator
 * Génère 1 ou 2 repas optimaux avec répartition nutritionnelle intelligente
 */

import { FoodPortion } from '../types/health'
import { calculateNutrition, getFoodById, FOOD_DATABASE } from './foodDatabase'

export type UserGoal = 'lose' | 'maintain' | 'gain'
export type MealCount = 1 | 2

export interface GeneratedMeal {
  name: string
  foods: FoodPortion[]
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

/**
 * Répartition des macros selon l'objectif
 */
const MACRO_RATIOS = {
  lose: {
    protein: 0.35,  // 35% protéines (préserver muscle)
    carbs: 0.35,    // 35% glucides
    fat: 0.30       // 30% lipides
  },
  maintain: {
    protein: 0.30,  // 30% protéines
    carbs: 0.40,    // 40% glucides
    fat: 0.30       // 30% lipides
  },
  gain: {
    protein: 0.25,  // 25% protéines
    carbs: 0.50,    // 50% glucides (énergie)
    fat: 0.25       // 25% lipides
  }
}

/**
 * Sélectionner les meilleurs aliments par catégorie
 */
function selectBestFoods() {
  return {
    // Protéines variées
    proteins: [
      getFoodById('chicken')!,
      getFoodById('salmon')!,
      getFoodById('eggs')!,
      getFoodById('greek-yogurt')!,
    ].filter(Boolean),
    
    // Glucides de qualité
    carbs: [
      getFoodById('rice')!,
      getFoodById('oats')!,
      getFoodById('sweet-potato')!,
      getFoodById('banana')!,
    ].filter(Boolean),
    
    // Légumes
    vegetables: [
      getFoodById('broccoli')!,
      getFoodById('spinach')!,
      getFoodById('tomato')!,
    ].filter(Boolean),
    
    // Lipides sains
    fats: [
      getFoodById('olive-oil')!,
      getFoodById('avocado')!,
      getFoodById('almonds')!,
    ].filter(Boolean),
  }
}

/**
 * Calculer les portions pour atteindre les objectifs nutritionnels
 */
function calculateOptimalPortions(
  targetCalories: number,
  goal: UserGoal
): FoodPortion[] {
  const macroRatio = MACRO_RATIOS[goal]
  const foods = selectBestFoods()
  const portions: FoodPortion[] = []
  
  // Objectifs en grammes
  const targetProtein = (targetCalories * macroRatio.protein) / 4  // 4 kcal/g
  const targetCarbs = (targetCalories * macroRatio.carbs) / 4      // 4 kcal/g
  const targetFat = (targetCalories * macroRatio.fat) / 9          // 9 kcal/g
  
  let currentProtein = 0
  let currentCarbs = 0
  let currentFat = 0
  let currentCalories = 0
  
  // 1. PROTÉINES (priorité 1)
  // Répartir entre 2-3 sources de protéines
  const proteinSources = goal === 'lose' 
    ? [foods.proteins[0], foods.proteins[3]] // Poulet + Yaourt grec (maigre)
    : [foods.proteins[1], foods.proteins[2]] // Saumon + Œufs (plus riches)
  
  proteinSources.forEach((food, index) => {
    const targetForThisSource = targetProtein / proteinSources.length
    const gramsNeeded = Math.round((targetForThisSource / (food.proteinPer100g / 100)))
    const finalGrams = Math.min(gramsNeeded, index === 0 ? 250 : 200) // Limiter les portions
    
    portions.push({ foodId: food.id, grams: finalGrams })
    
    const nutrition = calculateNutrition(food, finalGrams)
    currentProtein += nutrition.protein
    currentCarbs += nutrition.carbs
    currentFat += nutrition.fat
    currentCalories += nutrition.calories
  })
  
  // 2. GLUCIDES (priorité 2)
  // Répartir entre céréales et fruits
  const remainingCarbs = targetCarbs - currentCarbs
  
  // Céréales (70% des glucides restants)
  const cerealFood = goal === 'gain' ? foods.carbs[0] : foods.carbs[2] // Riz ou Patate douce
  const cerealCarbs = remainingCarbs * 0.7
  const cerealGrams = Math.round((cerealCarbs / (cerealFood.carbsPer100g / 100)))
  portions.push({ foodId: cerealFood.id, grams: Math.min(cerealGrams, 300) })
  
  const cerealNutrition = calculateNutrition(cerealFood, Math.min(cerealGrams, 300))
  currentProtein += cerealNutrition.protein
  currentCarbs += cerealNutrition.carbs
  currentFat += cerealNutrition.fat
  currentCalories += cerealNutrition.calories
  
  // Fruits (30% des glucides restants)
  const fruitFood = foods.carbs[3] // Banane
  const fruitGrams = 120 // Portion standard
  portions.push({ foodId: fruitFood.id, grams: fruitGrams })
  
  const fruitNutrition = calculateNutrition(fruitFood, fruitGrams)
  currentProtein += fruitNutrition.protein
  currentCarbs += fruitNutrition.carbs
  currentFat += fruitNutrition.fat
  currentCalories += fruitNutrition.calories
  
  // 3. LÉGUMES (fibres et micronutriments)
  const vegetableFood = foods.vegetables[0] // Brocoli
  const vegetableGrams = 150
  portions.push({ foodId: vegetableFood.id, grams: vegetableGrams })
  
  const vegNutrition = calculateNutrition(vegetableFood, vegetableGrams)
  currentProtein += vegNutrition.protein
  currentCarbs += vegNutrition.carbs
  currentFat += vegNutrition.fat
  currentCalories += vegNutrition.calories
  
  // 4. LIPIDES (ajuster pour atteindre l'objectif)
  const remainingFat = targetFat - currentFat
  
  if (remainingFat > 5) { // Si on a besoin de plus de lipides
    const fatFood = foods.fats[0] // Huile d'olive
    const fatGrams = Math.round((remainingFat / (fatFood.fatPer100g / 100)))
    portions.push({ foodId: fatFood.id, grams: Math.min(fatGrams, 20) })
  }
  
  return portions
}

/**
 * Générer 1 ou 2 repas optimaux
 */
export function generateOptimalMeals(
  targetCalories: number,
  goal: UserGoal,
  mealCount: MealCount,
  currentWeight?: number
): GeneratedMeal[] {
  const meals: GeneratedMeal[] = []
  
  if (mealCount === 1) {
    // 1 SEUL REPAS (OMAD - One Meal A Day)
    const portions = calculateOptimalPortions(targetCalories, goal)
    
    const nutrition = portions.reduce((acc, portion) => {
      const food = getFoodById(portion.foodId)
      if (food) {
        const n = calculateNutrition(food, portion.grams)
        return {
          calories: acc.calories + n.calories,
          protein: acc.protein + n.protein,
          carbs: acc.carbs + n.carbs,
          fat: acc.fat + n.fat,
          fiber: acc.fiber + n.fiber
        }
      }
      return acc
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
    
    meals.push({
      name: `Repas unique (${Math.round(nutrition.calories)} kcal)`,
      foods: portions,
      ...nutrition
    })
    
  } else {
    // 2 REPAS (Répartition 40/60 ou 50/50)
    const split = goal === 'lose' ? 0.4 : 0.5 // 40/60 en perte, 50/50 sinon
    
    // REPAS 1
    const meal1Portions = calculateOptimalPortions(targetCalories * split, goal)
    const meal1Nutrition = meal1Portions.reduce((acc, portion) => {
      const food = getFoodById(portion.foodId)
      if (food) {
        const n = calculateNutrition(food, portion.grams)
        return {
          calories: acc.calories + n.calories,
          protein: acc.protein + n.protein,
          carbs: acc.carbs + n.carbs,
          fat: acc.fat + n.fat,
          fiber: acc.fiber + n.fiber
        }
      }
      return acc
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
    
    meals.push({
      name: `Repas 1 (${Math.round(meal1Nutrition.calories)} kcal)`,
      foods: meal1Portions,
      ...meal1Nutrition
    })
    
    // REPAS 2
    const meal2Portions = calculateOptimalPortions(targetCalories * (1 - split), goal)
    const meal2Nutrition = meal2Portions.reduce((acc, portion) => {
      const food = getFoodById(portion.foodId)
      if (food) {
        const n = calculateNutrition(food, portion.grams)
        return {
          calories: acc.calories + n.calories,
          protein: acc.protein + n.protein,
          carbs: acc.carbs + n.carbs,
          fat: acc.fat + n.fat,
          fiber: acc.fiber + n.fiber
        }
      }
      return acc
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
    
    meals.push({
      name: `Repas 2 (${Math.round(meal2Nutrition.calories)} kcal)`,
      foods: meal2Portions,
      ...meal2Nutrition
    })
  }
  
  return meals
}

/**
 * Obtenir un résumé nutritionnel
 */
export function getMealSummary(meal: GeneratedMeal): string {
  return `${Math.round(meal.calories)} kcal · ${Math.round(meal.protein)}g P · ${Math.round(meal.carbs)}g G · ${Math.round(meal.fat)}g L`
}

