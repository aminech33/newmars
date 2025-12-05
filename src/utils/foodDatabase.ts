// Base de données d'aliments avec valeurs nutritionnelles fiables
// Sources : USDA FoodData Central + CIQUAL (ANSES France)
// Toutes les valeurs sont pour 100g

export interface FoodItem {
  id: string
  name: string
  category: 'protein' | 'carb' | 'vegetable' | 'fruit' | 'dairy' | 'fat' | 'snack' | 'beverage'
  
  // Valeurs nutritionnelles pour 100g
  caloriesPer100g: number
  proteinPer100g: number  // grammes
  carbsPer100g: number    // grammes
  fatPer100g: number      // grammes
  fiberPer100g?: number   // grammes (optionnel)
  
  // Unités courantes pour faciliter la saisie
  commonUnit?: 'piece' | 'cup' | 'tbsp' | 'slice' | 'glass'
  gramsPerUnit?: number
  
  // Recherche
  searchTerms?: string[]  // Synonymes, noms alternatifs
}

export const FOOD_DATABASE: FoodItem[] = [
  // ============================================
  // PROTÉINES (Viandes, Poissons, Œufs)
  // ============================================
  {
    id: 'chicken-breast',
    name: 'Blanc de poulet',
    category: 'protein',
    caloriesPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    fatPer100g: 3.6,
    commonUnit: 'piece',
    gramsPerUnit: 150,
    searchTerms: ['poulet', 'chicken', 'dinde']
  },
  {
    id: 'chicken-thigh',
    name: 'Cuisse de poulet',
    category: 'protein',
    caloriesPer100g: 209,
    proteinPer100g: 26,
    carbsPer100g: 0,
    fatPer100g: 11,
    commonUnit: 'piece',
    gramsPerUnit: 120
  },
  {
    id: 'beef-steak',
    name: 'Steak de bœuf',
    category: 'protein',
    caloriesPer100g: 250,
    proteinPer100g: 26,
    carbsPer100g: 0,
    fatPer100g: 17,
    commonUnit: 'piece',
    gramsPerUnit: 200,
    searchTerms: ['boeuf', 'viande rouge', 'beef']
  },
  {
    id: 'ground-beef',
    name: 'Bœuf haché (15% gras)',
    category: 'protein',
    caloriesPer100g: 250,
    proteinPer100g: 26,
    carbsPer100g: 0,
    fatPer100g: 15
  },
  {
    id: 'salmon',
    name: 'Saumon',
    category: 'protein',
    caloriesPer100g: 208,
    proteinPer100g: 20,
    carbsPer100g: 0,
    fatPer100g: 13,
    commonUnit: 'piece',
    gramsPerUnit: 150,
    searchTerms: ['poisson', 'fish']
  },
  {
    id: 'tuna-canned',
    name: 'Thon en conserve',
    category: 'protein',
    caloriesPer100g: 116,
    proteinPer100g: 26,
    carbsPer100g: 0,
    fatPer100g: 1
  },
  {
    id: 'egg-whole',
    name: 'Œuf entier',
    category: 'protein',
    caloriesPer100g: 155,
    proteinPer100g: 13,
    carbsPer100g: 1.1,
    fatPer100g: 11,
    commonUnit: 'piece',
    gramsPerUnit: 50,
    searchTerms: ['oeuf', 'egg']
  },
  {
    id: 'egg-white',
    name: 'Blanc d\'œuf',
    category: 'protein',
    caloriesPer100g: 52,
    proteinPer100g: 11,
    carbsPer100g: 0.7,
    fatPer100g: 0.2,
    commonUnit: 'piece',
    gramsPerUnit: 33
  },
  {
    id: 'turkey-breast',
    name: 'Blanc de dinde',
    category: 'protein',
    caloriesPer100g: 135,
    proteinPer100g: 30,
    carbsPer100g: 0,
    fatPer100g: 1,
    searchTerms: ['dinde', 'turkey']
  },
  {
    id: 'shrimp',
    name: 'Crevettes',
    category: 'protein',
    caloriesPer100g: 99,
    proteinPer100g: 24,
    carbsPer100g: 0.2,
    fatPer100g: 0.3
  },

  // ============================================
  // GLUCIDES (Féculents, Céréales, Pain)
  // ============================================
  {
    id: 'rice-white-cooked',
    name: 'Riz blanc cuit',
    category: 'carb',
    caloriesPer100g: 130,
    proteinPer100g: 2.7,
    carbsPer100g: 28,
    fatPer100g: 0.3,
    fiberPer100g: 0.4,
    commonUnit: 'cup',
    gramsPerUnit: 158,
    searchTerms: ['riz', 'rice']
  },
  {
    id: 'rice-brown-cooked',
    name: 'Riz complet cuit',
    category: 'carb',
    caloriesPer100g: 112,
    proteinPer100g: 2.6,
    carbsPer100g: 24,
    fatPer100g: 0.9,
    fiberPer100g: 1.8,
    commonUnit: 'cup',
    gramsPerUnit: 195
  },
  {
    id: 'pasta-cooked',
    name: 'Pâtes cuites',
    category: 'carb',
    caloriesPer100g: 131,
    proteinPer100g: 5,
    carbsPer100g: 25,
    fatPer100g: 1.1,
    fiberPer100g: 1.8,
    commonUnit: 'cup',
    gramsPerUnit: 140,
    searchTerms: ['pates', 'pasta', 'spaghetti']
  },
  {
    id: 'bread-white',
    name: 'Pain blanc',
    category: 'carb',
    caloriesPer100g: 265,
    proteinPer100g: 9,
    carbsPer100g: 49,
    fatPer100g: 3.2,
    fiberPer100g: 2.7,
    commonUnit: 'slice',
    gramsPerUnit: 30,
    searchTerms: ['pain', 'bread']
  },
  {
    id: 'bread-whole-wheat',
    name: 'Pain complet',
    category: 'carb',
    caloriesPer100g: 247,
    proteinPer100g: 13,
    carbsPer100g: 41,
    fatPer100g: 3.4,
    fiberPer100g: 7,
    commonUnit: 'slice',
    gramsPerUnit: 35
  },
  {
    id: 'oats',
    name: 'Flocons d\'avoine',
    category: 'carb',
    caloriesPer100g: 389,
    proteinPer100g: 17,
    carbsPer100g: 66,
    fatPer100g: 7,
    fiberPer100g: 10.6,
    commonUnit: 'cup',
    gramsPerUnit: 80,
    searchTerms: ['avoine', 'oats', 'porridge']
  },
  {
    id: 'potato',
    name: 'Pomme de terre cuite',
    category: 'carb',
    caloriesPer100g: 93,
    proteinPer100g: 2,
    carbsPer100g: 21,
    fatPer100g: 0.1,
    fiberPer100g: 2.1,
    searchTerms: ['pomme de terre', 'potato', 'patate']
  },
  {
    id: 'sweet-potato',
    name: 'Patate douce',
    category: 'carb',
    caloriesPer100g: 86,
    proteinPer100g: 1.6,
    carbsPer100g: 20,
    fatPer100g: 0.1,
    fiberPer100g: 3
  },
  {
    id: 'quinoa-cooked',
    name: 'Quinoa cuit',
    category: 'carb',
    caloriesPer100g: 120,
    proteinPer100g: 4.4,
    carbsPer100g: 21,
    fatPer100g: 1.9,
    fiberPer100g: 2.8,
    commonUnit: 'cup',
    gramsPerUnit: 185
  },
  {
    id: 'couscous-cooked',
    name: 'Couscous cuit',
    category: 'carb',
    caloriesPer100g: 112,
    proteinPer100g: 3.8,
    carbsPer100g: 23,
    fatPer100g: 0.2,
    fiberPer100g: 1.4,
    searchTerms: ['couscous', 'semoule']
  },

  // ============================================
  // LÉGUMES
  // ============================================
  {
    id: 'broccoli',
    name: 'Brocoli',
    category: 'vegetable',
    caloriesPer100g: 34,
    proteinPer100g: 2.8,
    carbsPer100g: 7,
    fatPer100g: 0.4,
    fiberPer100g: 2.6,
    commonUnit: 'cup',
    gramsPerUnit: 91,
    searchTerms: ['brocoli', 'broccoli']
  },
  {
    id: 'spinach',
    name: 'Épinards',
    category: 'vegetable',
    caloriesPer100g: 23,
    proteinPer100g: 2.9,
    carbsPer100g: 3.6,
    fatPer100g: 0.4,
    fiberPer100g: 2.2,
    commonUnit: 'cup',
    gramsPerUnit: 30,
    searchTerms: ['epinard', 'spinach']
  },
  {
    id: 'tomato',
    name: 'Tomate',
    category: 'vegetable',
    caloriesPer100g: 18,
    proteinPer100g: 0.9,
    carbsPer100g: 3.9,
    fatPer100g: 0.2,
    fiberPer100g: 1.2,
    commonUnit: 'piece',
    gramsPerUnit: 120,
    searchTerms: ['tomate', 'tomato']
  },
  {
    id: 'cucumber',
    name: 'Concombre',
    category: 'vegetable',
    caloriesPer100g: 15,
    proteinPer100g: 0.7,
    carbsPer100g: 3.6,
    fatPer100g: 0.1,
    fiberPer100g: 0.5,
    searchTerms: ['concombre', 'cucumber']
  },
  {
    id: 'carrot',
    name: 'Carotte',
    category: 'vegetable',
    caloriesPer100g: 41,
    proteinPer100g: 0.9,
    carbsPer100g: 10,
    fatPer100g: 0.2,
    fiberPer100g: 2.8,
    commonUnit: 'piece',
    gramsPerUnit: 60,
    searchTerms: ['carotte', 'carrot']
  },
  {
    id: 'bell-pepper',
    name: 'Poivron',
    category: 'vegetable',
    caloriesPer100g: 31,
    proteinPer100g: 1,
    carbsPer100g: 6,
    fatPer100g: 0.3,
    fiberPer100g: 2.1,
    searchTerms: ['poivron', 'pepper']
  },
  {
    id: 'lettuce',
    name: 'Salade verte',
    category: 'vegetable',
    caloriesPer100g: 15,
    proteinPer100g: 1.4,
    carbsPer100g: 2.9,
    fatPer100g: 0.2,
    fiberPer100g: 1.3,
    searchTerms: ['salade', 'lettuce', 'laitue']
  },
  {
    id: 'zucchini',
    name: 'Courgette',
    category: 'vegetable',
    caloriesPer100g: 17,
    proteinPer100g: 1.2,
    carbsPer100g: 3.1,
    fatPer100g: 0.3,
    fiberPer100g: 1,
    searchTerms: ['courgette', 'zucchini']
  },
  {
    id: 'green-beans',
    name: 'Haricots verts',
    category: 'vegetable',
    caloriesPer100g: 31,
    proteinPer100g: 1.8,
    carbsPer100g: 7,
    fatPer100g: 0.2,
    fiberPer100g: 2.7,
    searchTerms: ['haricot vert', 'green bean']
  },
  {
    id: 'cauliflower',
    name: 'Chou-fleur',
    category: 'vegetable',
    caloriesPer100g: 25,
    proteinPer100g: 1.9,
    carbsPer100g: 5,
    fatPer100g: 0.3,
    fiberPer100g: 2,
    searchTerms: ['chou fleur', 'cauliflower']
  },

  // ============================================
  // FRUITS
  // ============================================
  {
    id: 'banana',
    name: 'Banane',
    category: 'fruit',
    caloriesPer100g: 89,
    proteinPer100g: 1.1,
    carbsPer100g: 23,
    fatPer100g: 0.3,
    fiberPer100g: 2.6,
    commonUnit: 'piece',
    gramsPerUnit: 120,
    searchTerms: ['banane', 'banana']
  },
  {
    id: 'apple',
    name: 'Pomme',
    category: 'fruit',
    caloriesPer100g: 52,
    proteinPer100g: 0.3,
    carbsPer100g: 14,
    fatPer100g: 0.2,
    fiberPer100g: 2.4,
    commonUnit: 'piece',
    gramsPerUnit: 180,
    searchTerms: ['pomme', 'apple']
  },
  {
    id: 'orange',
    name: 'Orange',
    category: 'fruit',
    caloriesPer100g: 47,
    proteinPer100g: 0.9,
    carbsPer100g: 12,
    fatPer100g: 0.1,
    fiberPer100g: 2.4,
    commonUnit: 'piece',
    gramsPerUnit: 130,
    searchTerms: ['orange']
  },
  {
    id: 'strawberry',
    name: 'Fraise',
    category: 'fruit',
    caloriesPer100g: 32,
    proteinPer100g: 0.7,
    carbsPer100g: 7.7,
    fatPer100g: 0.3,
    fiberPer100g: 2,
    commonUnit: 'cup',
    gramsPerUnit: 150,
    searchTerms: ['fraise', 'strawberry']
  },
  {
    id: 'blueberry',
    name: 'Myrtille',
    category: 'fruit',
    caloriesPer100g: 57,
    proteinPer100g: 0.7,
    carbsPer100g: 14,
    fatPer100g: 0.3,
    fiberPer100g: 2.4,
    commonUnit: 'cup',
    gramsPerUnit: 148,
    searchTerms: ['myrtille', 'blueberry']
  },
  {
    id: 'grape',
    name: 'Raisin',
    category: 'fruit',
    caloriesPer100g: 69,
    proteinPer100g: 0.7,
    carbsPer100g: 18,
    fatPer100g: 0.2,
    fiberPer100g: 0.9,
    searchTerms: ['raisin', 'grape']
  },
  {
    id: 'watermelon',
    name: 'Pastèque',
    category: 'fruit',
    caloriesPer100g: 30,
    proteinPer100g: 0.6,
    carbsPer100g: 8,
    fatPer100g: 0.2,
    fiberPer100g: 0.4,
    searchTerms: ['pasteque', 'watermelon']
  },
  {
    id: 'avocado',
    name: 'Avocat',
    category: 'fruit',
    caloriesPer100g: 160,
    proteinPer100g: 2,
    carbsPer100g: 9,
    fatPer100g: 15,
    fiberPer100g: 7,
    commonUnit: 'piece',
    gramsPerUnit: 150,
    searchTerms: ['avocat', 'avocado']
  },
  {
    id: 'pear',
    name: 'Poire',
    category: 'fruit',
    caloriesPer100g: 57,
    proteinPer100g: 0.4,
    carbsPer100g: 15,
    fatPer100g: 0.1,
    fiberPer100g: 3.1,
    commonUnit: 'piece',
    gramsPerUnit: 180,
    searchTerms: ['poire', 'pear']
  },
  {
    id: 'peach',
    name: 'Pêche',
    category: 'fruit',
    caloriesPer100g: 39,
    proteinPer100g: 0.9,
    carbsPer100g: 10,
    fatPer100g: 0.3,
    fiberPer100g: 1.5,
    commonUnit: 'piece',
    gramsPerUnit: 150,
    searchTerms: ['peche', 'peach']
  },

  // ============================================
  // PRODUITS LAITIERS
  // ============================================
  {
    id: 'milk-whole',
    name: 'Lait entier',
    category: 'dairy',
    caloriesPer100g: 61,
    proteinPer100g: 3.2,
    carbsPer100g: 4.8,
    fatPer100g: 3.3,
    commonUnit: 'cup',
    gramsPerUnit: 244,
    searchTerms: ['lait', 'milk']
  },
  {
    id: 'milk-skim',
    name: 'Lait écrémé',
    category: 'dairy',
    caloriesPer100g: 34,
    proteinPer100g: 3.4,
    carbsPer100g: 5,
    fatPer100g: 0.1,
    commonUnit: 'cup',
    gramsPerUnit: 244
  },
  {
    id: 'yogurt-plain',
    name: 'Yaourt nature',
    category: 'dairy',
    caloriesPer100g: 59,
    proteinPer100g: 3.5,
    carbsPer100g: 4.7,
    fatPer100g: 3.3,
    commonUnit: 'cup',
    gramsPerUnit: 245,
    searchTerms: ['yaourt', 'yogurt']
  },
  {
    id: 'yogurt-greek',
    name: 'Yaourt grec',
    category: 'dairy',
    caloriesPer100g: 97,
    proteinPer100g: 10,
    carbsPer100g: 3.6,
    fatPer100g: 5,
    commonUnit: 'cup',
    gramsPerUnit: 170
  },
  {
    id: 'cheese-mozzarella',
    name: 'Mozzarella',
    category: 'dairy',
    caloriesPer100g: 280,
    proteinPer100g: 28,
    carbsPer100g: 2.2,
    fatPer100g: 17,
    searchTerms: ['fromage', 'cheese', 'mozzarella']
  },
  {
    id: 'cheese-cheddar',
    name: 'Cheddar',
    category: 'dairy',
    caloriesPer100g: 403,
    proteinPer100g: 25,
    carbsPer100g: 1.3,
    fatPer100g: 33,
    searchTerms: ['fromage', 'cheese', 'cheddar']
  },
  {
    id: 'cottage-cheese',
    name: 'Fromage blanc',
    category: 'dairy',
    caloriesPer100g: 98,
    proteinPer100g: 11,
    carbsPer100g: 3.4,
    fatPer100g: 4.3,
    commonUnit: 'cup',
    gramsPerUnit: 226,
    searchTerms: ['fromage blanc', 'cottage cheese']
  },
  {
    id: 'butter',
    name: 'Beurre',
    category: 'fat',
    caloriesPer100g: 717,
    proteinPer100g: 0.9,
    carbsPer100g: 0.1,
    fatPer100g: 81,
    commonUnit: 'tbsp',
    gramsPerUnit: 14,
    searchTerms: ['beurre', 'butter']
  },

  // ============================================
  // MATIÈRES GRASSES & HUILES
  // ============================================
  {
    id: 'olive-oil',
    name: 'Huile d\'olive',
    category: 'fat',
    caloriesPer100g: 884,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 100,
    commonUnit: 'tbsp',
    gramsPerUnit: 14,
    searchTerms: ['huile', 'olive', 'oil']
  },
  {
    id: 'vegetable-oil',
    name: 'Huile végétale',
    category: 'fat',
    caloriesPer100g: 884,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 100,
    commonUnit: 'tbsp',
    gramsPerUnit: 14
  },
  {
    id: 'peanut-butter',
    name: 'Beurre de cacahuète',
    category: 'fat',
    caloriesPer100g: 588,
    proteinPer100g: 25,
    carbsPer100g: 20,
    fatPer100g: 50,
    commonUnit: 'tbsp',
    gramsPerUnit: 16,
    searchTerms: ['beurre de cacahuete', 'peanut butter']
  },
  {
    id: 'almond',
    name: 'Amandes',
    category: 'fat',
    caloriesPer100g: 579,
    proteinPer100g: 21,
    carbsPer100g: 22,
    fatPer100g: 50,
    fiberPer100g: 12.5,
    searchTerms: ['amande', 'almond', 'noix']
  },
  {
    id: 'walnut',
    name: 'Noix',
    category: 'fat',
    caloriesPer100g: 654,
    proteinPer100g: 15,
    carbsPer100g: 14,
    fatPer100g: 65,
    fiberPer100g: 6.7,
    searchTerms: ['noix', 'walnut']
  },
  {
    id: 'cashew',
    name: 'Noix de cajou',
    category: 'fat',
    caloriesPer100g: 553,
    proteinPer100g: 18,
    carbsPer100g: 30,
    fatPer100g: 44,
    fiberPer100g: 3.3,
    searchTerms: ['cajou', 'cashew']
  },

  // ============================================
  // SNACKS & DIVERS
  // ============================================
  {
    id: 'protein-powder',
    name: 'Whey protéine',
    category: 'protein',
    caloriesPer100g: 370,
    proteinPer100g: 80,
    carbsPer100g: 6,
    fatPer100g: 3,
    searchTerms: ['whey', 'proteine', 'protein powder']
  },
  {
    id: 'honey',
    name: 'Miel',
    category: 'snack',
    caloriesPer100g: 304,
    proteinPer100g: 0.3,
    carbsPer100g: 82,
    fatPer100g: 0,
    commonUnit: 'tbsp',
    gramsPerUnit: 21,
    searchTerms: ['miel', 'honey']
  },
  {
    id: 'dark-chocolate',
    name: 'Chocolat noir 70%',
    category: 'snack',
    caloriesPer100g: 598,
    proteinPer100g: 7.8,
    carbsPer100g: 46,
    fatPer100g: 43,
    fiberPer100g: 11,
    searchTerms: ['chocolat', 'chocolate']
  },
  {
    id: 'granola',
    name: 'Granola',
    category: 'snack',
    caloriesPer100g: 471,
    proteinPer100g: 13,
    carbsPer100g: 55,
    fatPer100g: 21,
    fiberPer100g: 7,
    commonUnit: 'cup',
    gramsPerUnit: 60
  },

  // ============================================
  // BOISSONS
  // ============================================
  {
    id: 'coffee-black',
    name: 'Café noir',
    category: 'beverage',
    caloriesPer100g: 2,
    proteinPer100g: 0.3,
    carbsPer100g: 0,
    fatPer100g: 0,
    commonUnit: 'cup',
    gramsPerUnit: 240,
    searchTerms: ['cafe', 'coffee']
  },
  {
    id: 'orange-juice',
    name: 'Jus d\'orange',
    category: 'beverage',
    caloriesPer100g: 45,
    proteinPer100g: 0.7,
    carbsPer100g: 10,
    fatPer100g: 0.2,
    commonUnit: 'glass',
    gramsPerUnit: 248,
    searchTerms: ['jus orange', 'orange juice']
  },
  {
    id: 'protein-shake',
    name: 'Shake protéiné',
    category: 'beverage',
    caloriesPer100g: 70,
    proteinPer100g: 12,
    carbsPer100g: 3,
    fatPer100g: 1,
    commonUnit: 'glass',
    gramsPerUnit: 250,
    searchTerms: ['shake', 'protein shake']
  }
]

// Fonction de recherche d'aliments
export function searchFoods(query: string): FoodItem[] {
  if (!query || query.length < 2) return []
  
  const lowerQuery = query.toLowerCase().trim()
  
  return FOOD_DATABASE.filter(food => {
    // Recherche dans le nom
    if (food.name.toLowerCase().includes(lowerQuery)) return true
    
    // Recherche dans les termes alternatifs
    if (food.searchTerms?.some(term => term.toLowerCase().includes(lowerQuery))) return true
    
    return false
  }).slice(0, 20) // Limiter à 20 résultats
}

// Calculer les valeurs nutritionnelles pour une quantité donnée
export function calculateNutrition(food: FoodItem, grams: number) {
  const factor = grams / 100
  return {
    calories: Math.round(food.caloriesPer100g * factor),
    protein: Math.round(food.proteinPer100g * factor * 10) / 10,
    carbs: Math.round(food.carbsPer100g * factor * 10) / 10,
    fat: Math.round(food.fatPer100g * factor * 10) / 10,
    fiber: food.fiberPer100g ? Math.round(food.fiberPer100g * factor * 10) / 10 : 0
  }
}

// Obtenir un aliment par ID
export function getFoodById(id: string): FoodItem | undefined {
  return FOOD_DATABASE.find(food => food.id === id)
}

// Catégories pour les filtres
export const FOOD_CATEGORIES = [
  { value: 'protein', label: 'Protéines', emoji: '🥩' },
  { value: 'carb', label: 'Glucides', emoji: '🍚' },
  { value: 'vegetable', label: 'Légumes', emoji: '🥦' },
  { value: 'fruit', label: 'Fruits', emoji: '🍎' },
  { value: 'dairy', label: 'Produits laitiers', emoji: '🥛' },
  { value: 'fat', label: 'Matières grasses', emoji: '🥜' },
  { value: 'snack', label: 'Snacks', emoji: '🍫' },
  { value: 'beverage', label: 'Boissons', emoji: '☕' }
] as const

