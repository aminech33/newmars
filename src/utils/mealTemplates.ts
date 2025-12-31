/**
 * 🍽️ Meal Templates - Suggestions intelligentes de repas
 * Basé sur le poids récent, l'objectif, et la base de données de nourriture
 */

import { FoodPortion } from '../types/health'
import { calculateNutrition, getFoodById, FOOD_DATABASE } from './foodDatabase'

export interface MealTemplate {
  name: string
  foods: FoodPortion[]
  description?: string
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type UserGoal = 'lose' | 'maintain' | 'gain'

/**
 * Répartition calorique par type de repas (en % du total quotidien)
 */
const MEAL_CALORIE_DISTRIBUTION = {
  breakfast: 0.25,  // 25% petit-déjeuner
  lunch: 0.35,      // 35% déjeuner
  dinner: 0.30,     // 30% dîner
  snack: 0.10       // 10% collation
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
 * Calculer les valeurs nutritionnelles d'un template
 */
export function calculateTemplateNutrition(template: MealTemplate) {
  return template.foods.reduce((acc, portion) => {
    const food = getFoodById(portion.foodId)
    if (food) {
      const nutrition = calculateNutrition(food, portion.grams)
      return {
        calories: acc.calories + nutrition.calories,
        protein: acc.protein + nutrition.protein,
        carbs: acc.carbs + nutrition.carbs,
        fat: acc.fat + nutrition.fat,
        fiber: acc.fiber + nutrition.fiber
      }
    }
    return acc
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
}

/**
 * Sélectionner des aliments de la base de données par catégorie
 */
function selectFoodsByCategory(
  category: 'protein' | 'carb' | 'vegetable' | 'fruit' | 'dairy' | 'fat',
  count: number = 1
): string[] {
  const foods = FOOD_DATABASE.filter(f => f.category === category)
  
  // Sélectionner aléatoirement (ou les premiers pour la cohérence)
  return foods.slice(0, count).map(f => f.id)
}

/**
 * Calculer les portions pour atteindre un objectif calorique
 */
function calculatePortions(
  targetCalories: number,
  goal: UserGoal,
  mealType: MealType
): FoodPortion[] {
  const macroRatio = MACRO_RATIOS[goal]
  
  // Calories cibles pour ce repas
  const mealCalories = targetCalories * MEAL_CALORIE_DISTRIBUTION[mealType]
  
  // Macros cibles (en grammes)
  const targetProtein = (mealCalories * macroRatio.protein) / 4  // 4 kcal/g
  const targetCarbs = (mealCalories * macroRatio.carbs) / 4      // 4 kcal/g
  const targetFat = (mealCalories * macroRatio.fat) / 9          // 9 kcal/g
  
  const portions: FoodPortion[] = []
  
  // Stratégie selon le type de repas
  if (mealType === 'breakfast') {
    // Petit-déjeuner : Céréales + Protéines + Fruits
    
    // 1. Céréales (flocons d'avoine, pain)
    const carbFood = getFoodById('oats') || FOOD_DATABASE.find(f => f.category === 'carb')!
    const carbGrams = Math.round((targetCarbs * 0.6) / (carbFood.carbsPer100g / 100))
    portions.push({ foodId: carbFood.id, grams: carbGrams })
    
    // 2. Protéines (yaourt grec, œufs)
    const proteinFood = getFoodById('greek-yogurt') || FOOD_DATABASE.find(f => f.category === 'dairy')!
    const proteinGrams = Math.round((targetProtein * 0.7) / (proteinFood.proteinPer100g / 100))
    portions.push({ foodId: proteinFood.id, grams: proteinGrams })
    
    // 3. Fruits (banane, pomme)
    const fruitFood = getFoodById('banana') || FOOD_DATABASE.find(f => f.category === 'fruit')!
    portions.push({ foodId: fruitFood.id, grams: 120 })
    
  } else if (mealType === 'lunch') {
    // Déjeuner : Protéines + Féculents + Légumes
    
    // 1. Protéines (poulet, poisson, bœuf)
    const proteinFood = getFoodById('chicken') || FOOD_DATABASE.find(f => f.category === 'protein')!
    const proteinGrams = Math.round((targetProtein * 0.8) / (proteinFood.proteinPer100g / 100))
    portions.push({ foodId: proteinFood.id, grams: Math.min(proteinGrams, 250) })
    
    // 2. Féculents (riz, pâtes, quinoa)
    const carbFood = getFoodById('rice') || FOOD_DATABASE.find(f => f.category === 'carb')!
    const carbGrams = Math.round((targetCarbs * 0.7) / (carbFood.carbsPer100g / 100))
    portions.push({ foodId: carbFood.id, grams: Math.min(carbGrams, 300) })
    
    // 3. Légumes (brocoli, salade)
    const vegFood = getFoodById('broccoli') || FOOD_DATABASE.find(f => f.category === 'vegetable')!
    portions.push({ foodId: vegFood.id, grams: 150 })
    
    // 4. Lipides (huile d'olive, avocat)
    if (goal !== 'lose') {
      const fatFood = getFoodById('olive-oil') || FOOD_DATABASE.find(f => f.category === 'fat')!
      portions.push({ foodId: fatFood.id, grams: 10 })
    }
    
  } else if (mealType === 'dinner') {
    // Dîner : Protéines + Légumes + Féculents légers
    
    // 1. Protéines (poisson, poulet)
    const proteinFood = getFoodById('salmon') || FOOD_DATABASE.find(f => f.category === 'protein' && f.id.includes('fish'))!
    const proteinGrams = Math.round((targetProtein * 0.75) / (proteinFood.proteinPer100g / 100))
    portions.push({ foodId: proteinFood.id, grams: Math.min(proteinGrams, 200) })
    
    // 2. Féculents légers (patate douce, pommes de terre)
    const carbFood = getFoodById('sweet-potato') || getFoodById('potato') || FOOD_DATABASE.find(f => f.category === 'carb')!
    const carbGrams = Math.round((targetCarbs * 0.5) / (carbFood.carbsPer100g / 100))
    portions.push({ foodId: carbFood.id, grams: Math.min(carbGrams, 200) })
    
    // 3. Légumes
    const vegFood = getFoodById('green-beans') || FOOD_DATABASE.find(f => f.category === 'vegetable')!
    portions.push({ foodId: vegFood.id, grams: 150 })
    
  } else {
    // Collation : Fruits + Protéines légères
    
    // 1. Protéines (yaourt, fromage blanc)
    const proteinFood = getFoodById('greek-yogurt') || FOOD_DATABASE.find(f => f.category === 'dairy')!
    portions.push({ foodId: proteinFood.id, grams: 150 })
    
    // 2. Fruits ou noix
    if (goal === 'gain') {
      const nutFood = getFoodById('almonds') || FOOD_DATABASE.find(f => f.category === 'fat')!
      portions.push({ foodId: nutFood.id, grams: 30 })
    } else {
      const fruitFood = getFoodById('apple') || FOOD_DATABASE.find(f => f.category === 'fruit')!
      portions.push({ foodId: fruitFood.id, grams: 150 })
    }
  }
  
  return portions
}

/**
 * Générer un nom de repas selon les aliments
 */
function generateMealName(foods: FoodPortion[], mealType: MealType): string {
  const foodNames = foods
    .map(p => getFoodById(p.foodId)?.name)
    .filter(Boolean)
    .slice(0, 3)
  
  const mealTypeNames = {
    breakfast: 'Petit-déjeuner',
    lunch: 'Déjeuner',
    dinner: 'Dîner',
    snack: 'Collation'
  }
  
  if (foodNames.length > 0) {
    return `${mealTypeNames[mealType]} : ${foodNames.join(', ')}`
  }
  
  return `${mealTypeNames[mealType]} équilibré`
}

/**
 * Générer une suggestion de repas intelligente
 * 
 * @param targetCalories - Objectif calorique quotidien
 * @param goal - Objectif utilisateur (lose/maintain/gain)
 * @param mealType - Type de repas
 * @param currentWeight - Poids actuel (optionnel, pour ajustements)
 * @returns Template de repas avec portions calculées
 */
export function generateSmartMealSuggestion(
  targetCalories: number,
  goal: UserGoal,
  mealType: MealType,
  currentWeight?: number
): MealTemplate {
  // Calculer les portions optimales
  const foods = calculatePortions(targetCalories, goal, mealType)
  
  // Générer le nom
  const name = generateMealName(foods, mealType)
  
  // Calculer les valeurs nutritionnelles
  const nutrition = foods.reduce((acc, portion) => {
    const food = getFoodById(portion.foodId)
    if (food) {
      const n = calculateNutrition(food, portion.grams)
      return {
        calories: acc.calories + n.calories,
        protein: acc.protein + n.protein,
        carbs: acc.carbs + n.carbs,
        fat: acc.fat + n.fat
      }
    }
    return acc
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 })
  
  const description = `${Math.round(nutrition.calories)} kcal · ${Math.round(nutrition.protein)}g P · ${Math.round(nutrition.carbs)}g G · ${Math.round(nutrition.fat)}g L`
  
  return {
    name,
    foods,
    description
  }
}

/**
 * Générer 3 variantes de repas (léger, normal, riche)
 */
export function generateMealVariants(
  targetCalories: number,
  goal: UserGoal,
  mealType: MealType
): { light: MealTemplate; normal: MealTemplate; rich: MealTemplate } {
  // Variante légère (-20%)
  const light = generateSmartMealSuggestion(targetCalories * 0.8, goal, mealType)
  light.name = light.name.replace(/équilibré|complet/, 'léger')
  
  // Variante normale (100%)
  const normal = generateSmartMealSuggestion(targetCalories, goal, mealType)
  
  // Variante riche (+20%)
  const rich = generateSmartMealSuggestion(targetCalories * 1.2, goal, mealType)
  rich.name = rich.name.replace(/équilibré|complet/, 'copieux')
  
  return { light, normal, rich }
}

