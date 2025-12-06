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
  { id: 'chicken', name: 'Poulet', category: 'protein', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, searchTerms: ['poulet', 'chicken'] },
  { id: 'beef', name: 'Bœuf', category: 'protein', caloriesPer100g: 250, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 17, searchTerms: ['boeuf', 'viande'] },
  { id: 'lamb', name: 'Agneau', category: 'protein', caloriesPer100g: 294, proteinPer100g: 25, carbsPer100g: 0, fatPer100g: 21, searchTerms: ['agneau', 'mouton'] },
  { id: 'turkey', name: 'Dinde', category: 'protein', caloriesPer100g: 135, proteinPer100g: 30, carbsPer100g: 0, fatPer100g: 1, searchTerms: ['dinde', 'turkey'] },
  { id: 'egg', name: 'Œuf', category: 'protein', caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1, fatPer100g: 11, commonUnit: 'piece', gramsPerUnit: 50, searchTerms: ['oeuf', 'egg'] },
  { id: 'salmon', name: 'Saumon', category: 'protein', caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13, searchTerms: ['saumon', 'poisson'] },
  { id: 'tuna', name: 'Thon', category: 'protein', caloriesPer100g: 130, proteinPer100g: 29, carbsPer100g: 0, fatPer100g: 1, searchTerms: ['thon', 'poisson'] },
  { id: 'cod', name: 'Cabillaud', category: 'protein', caloriesPer100g: 82, proteinPer100g: 18, carbsPer100g: 0, fatPer100g: 0.7, searchTerms: ['cabillaud', 'morue', 'poisson blanc'] },
  { id: 'sardine', name: 'Sardine', category: 'protein', caloriesPer100g: 208, proteinPer100g: 25, carbsPer100g: 0, fatPer100g: 11, searchTerms: ['sardine', 'poisson'] },
  { id: 'shrimp', name: 'Crevettes', category: 'protein', caloriesPer100g: 99, proteinPer100g: 24, carbsPer100g: 0, fatPer100g: 0.3, searchTerms: ['crevette', 'fruits de mer'] },
  { id: 'tofu', name: 'Tofu', category: 'protein', caloriesPer100g: 76, proteinPer100g: 8, carbsPer100g: 2, fatPer100g: 4.8, searchTerms: ['tofu', 'soja'] },
  { id: 'whey', name: 'Whey protéine', category: 'protein', caloriesPer100g: 370, proteinPer100g: 80, carbsPer100g: 6, fatPer100g: 3, searchTerms: ['whey', 'proteine', 'poudre'] },

  // ============================================
  // FÉCULENTS & CÉRÉALES
  // ============================================
  { id: 'rice', name: 'Riz', category: 'carb', caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, fiberPer100g: 0.4, searchTerms: ['riz', 'rice'] },
  { id: 'pasta', name: 'Pâtes', category: 'carb', caloriesPer100g: 131, proteinPer100g: 5, carbsPer100g: 25, fatPer100g: 1.1, fiberPer100g: 1.8, searchTerms: ['pates', 'spaghetti', 'pasta'] },
  { id: 'bread', name: 'Pain', category: 'carb', caloriesPer100g: 265, proteinPer100g: 9, carbsPer100g: 49, fatPer100g: 3.2, fiberPer100g: 2.7, commonUnit: 'slice', gramsPerUnit: 30, searchTerms: ['pain', 'bread'] },
  { id: 'oats', name: 'Flocons d\'avoine', category: 'carb', caloriesPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatPer100g: 7, fiberPer100g: 10.6, searchTerms: ['avoine', 'oats', 'porridge'] },
  { id: 'potato', name: 'Pomme de terre', category: 'carb', caloriesPer100g: 93, proteinPer100g: 2, carbsPer100g: 21, fatPer100g: 0.1, fiberPer100g: 2.1, searchTerms: ['pomme de terre', 'patate'] },
  { id: 'sweet-potato', name: 'Patate douce', category: 'carb', caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1, fiberPer100g: 3, searchTerms: ['patate douce'] },
  { id: 'quinoa', name: 'Quinoa', category: 'carb', caloriesPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21, fatPer100g: 1.9, fiberPer100g: 2.8, searchTerms: ['quinoa'] },
  { id: 'couscous', name: 'Couscous', category: 'carb', caloriesPer100g: 112, proteinPer100g: 3.8, carbsPer100g: 23, fatPer100g: 0.2, fiberPer100g: 1.4, searchTerms: ['couscous', 'semoule'] },
  { id: 'bulgur', name: 'Boulgour', category: 'carb', caloriesPer100g: 83, proteinPer100g: 3, carbsPer100g: 19, fatPer100g: 0.2, fiberPer100g: 4.5, searchTerms: ['boulgour', 'bulgur'] },
  { id: 'lentils', name: 'Lentilles', category: 'carb', caloriesPer100g: 116, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4, fiberPer100g: 8, searchTerms: ['lentilles', 'legumineuses'] },
  { id: 'chickpeas', name: 'Pois chiches', category: 'carb', caloriesPer100g: 164, proteinPer100g: 9, carbsPer100g: 27, fatPer100g: 2.6, fiberPer100g: 8, searchTerms: ['pois chiche', 'houmous'] },
  { id: 'beans', name: 'Haricots rouges', category: 'carb', caloriesPer100g: 127, proteinPer100g: 9, carbsPer100g: 22, fatPer100g: 0.5, fiberPer100g: 7, searchTerms: ['haricots', 'beans'] },
  { id: 'corn', name: 'Maïs', category: 'carb', caloriesPer100g: 86, proteinPer100g: 3.3, carbsPer100g: 19, fatPer100g: 1.4, fiberPer100g: 2.7, searchTerms: ['mais', 'corn'] },

  // ============================================
  // LÉGUMES
  // ============================================
  { id: 'broccoli', name: 'Brocoli', category: 'vegetable', caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4, fiberPer100g: 2.6, searchTerms: ['brocoli'] },
  { id: 'spinach', name: 'Épinards', category: 'vegetable', caloriesPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4, fiberPer100g: 2.2, searchTerms: ['epinard', 'spinach'] },
  { id: 'tomato', name: 'Tomate', category: 'vegetable', caloriesPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2, fiberPer100g: 1.2, searchTerms: ['tomate'] },
  { id: 'cucumber', name: 'Concombre', category: 'vegetable', caloriesPer100g: 15, proteinPer100g: 0.7, carbsPer100g: 3.6, fatPer100g: 0.1, fiberPer100g: 0.5, searchTerms: ['concombre'] },
  { id: 'carrot', name: 'Carotte', category: 'vegetable', caloriesPer100g: 41, proteinPer100g: 0.9, carbsPer100g: 10, fatPer100g: 0.2, fiberPer100g: 2.8, searchTerms: ['carotte'] },
  { id: 'pepper', name: 'Poivron', category: 'vegetable', caloriesPer100g: 31, proteinPer100g: 1, carbsPer100g: 6, fatPer100g: 0.3, fiberPer100g: 2.1, searchTerms: ['poivron'] },
  { id: 'onion', name: 'Oignon', category: 'vegetable', caloriesPer100g: 40, proteinPer100g: 1.1, carbsPer100g: 9, fatPer100g: 0.1, fiberPer100g: 1.7, searchTerms: ['oignon'] },
  { id: 'garlic', name: 'Ail', category: 'vegetable', caloriesPer100g: 149, proteinPer100g: 6.4, carbsPer100g: 33, fatPer100g: 0.5, fiberPer100g: 2.1, searchTerms: ['ail'] },
  { id: 'zucchini', name: 'Courgette', category: 'vegetable', caloriesPer100g: 17, proteinPer100g: 1.2, carbsPer100g: 3.1, fatPer100g: 0.3, fiberPer100g: 1, searchTerms: ['courgette'] },
  { id: 'eggplant', name: 'Aubergine', category: 'vegetable', caloriesPer100g: 25, proteinPer100g: 1, carbsPer100g: 6, fatPer100g: 0.2, fiberPer100g: 3, searchTerms: ['aubergine'] },
  { id: 'lettuce', name: 'Salade', category: 'vegetable', caloriesPer100g: 15, proteinPer100g: 1.4, carbsPer100g: 2.9, fatPer100g: 0.2, fiberPer100g: 1.3, searchTerms: ['salade', 'laitue'] },
  { id: 'cabbage', name: 'Chou', category: 'vegetable', caloriesPer100g: 25, proteinPer100g: 1.3, carbsPer100g: 6, fatPer100g: 0.1, fiberPer100g: 2.5, searchTerms: ['chou'] },
  { id: 'cauliflower', name: 'Chou-fleur', category: 'vegetable', caloriesPer100g: 25, proteinPer100g: 1.9, carbsPer100g: 5, fatPer100g: 0.3, fiberPer100g: 2, searchTerms: ['chou-fleur'] },
  { id: 'green-beans', name: 'Haricots verts', category: 'vegetable', caloriesPer100g: 31, proteinPer100g: 1.8, carbsPer100g: 7, fatPer100g: 0.2, fiberPer100g: 2.7, searchTerms: ['haricots verts'] },
  { id: 'peas', name: 'Petits pois', category: 'vegetable', caloriesPer100g: 81, proteinPer100g: 5.4, carbsPer100g: 14, fatPer100g: 0.4, fiberPer100g: 5.7, searchTerms: ['petits pois', 'pois'] },
  { id: 'mushroom', name: 'Champignons', category: 'vegetable', caloriesPer100g: 22, proteinPer100g: 3.1, carbsPer100g: 3.3, fatPer100g: 0.3, fiberPer100g: 1, searchTerms: ['champignon', 'mushroom'] },
  { id: 'leek', name: 'Poireau', category: 'vegetable', caloriesPer100g: 61, proteinPer100g: 1.5, carbsPer100g: 14, fatPer100g: 0.3, fiberPer100g: 1.8, searchTerms: ['poireau'] },
  { id: 'celery', name: 'Céleri', category: 'vegetable', caloriesPer100g: 16, proteinPer100g: 0.7, carbsPer100g: 3, fatPer100g: 0.2, fiberPer100g: 1.6, searchTerms: ['celeri'] },
  { id: 'beetroot', name: 'Betterave', category: 'vegetable', caloriesPer100g: 43, proteinPer100g: 1.6, carbsPer100g: 10, fatPer100g: 0.2, fiberPer100g: 2.8, searchTerms: ['betterave'] },
  { id: 'asparagus', name: 'Asperges', category: 'vegetable', caloriesPer100g: 20, proteinPer100g: 2.2, carbsPer100g: 3.9, fatPer100g: 0.1, fiberPer100g: 2.1, searchTerms: ['asperge'] },
  { id: 'artichoke', name: 'Artichaut', category: 'vegetable', caloriesPer100g: 47, proteinPer100g: 3.3, carbsPer100g: 11, fatPer100g: 0.2, fiberPer100g: 5.4, searchTerms: ['artichaut'] },
  { id: 'radish', name: 'Radis', category: 'vegetable', caloriesPer100g: 16, proteinPer100g: 0.7, carbsPer100g: 3.4, fatPer100g: 0.1, fiberPer100g: 1.6, searchTerms: ['radis'] },
  { id: 'fennel', name: 'Fenouil', category: 'vegetable', caloriesPer100g: 31, proteinPer100g: 1.2, carbsPer100g: 7, fatPer100g: 0.2, fiberPer100g: 3.1, searchTerms: ['fenouil'] },
  { id: 'turnip', name: 'Navet', category: 'vegetable', caloriesPer100g: 28, proteinPer100g: 0.9, carbsPer100g: 6, fatPer100g: 0.1, fiberPer100g: 1.8, searchTerms: ['navet'] },
  { id: 'pumpkin', name: 'Potiron', category: 'vegetable', caloriesPer100g: 26, proteinPer100g: 1, carbsPer100g: 6.5, fatPer100g: 0.1, fiberPer100g: 0.5, searchTerms: ['potiron', 'courge', 'citrouille'] },

  // ============================================
  // FRUITS
  // ============================================
  { id: 'banana', name: 'Banane', category: 'fruit', caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3, fiberPer100g: 2.6, commonUnit: 'piece', gramsPerUnit: 120, searchTerms: ['banane'] },
  { id: 'apple', name: 'Pomme', category: 'fruit', caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2, fiberPer100g: 2.4, commonUnit: 'piece', gramsPerUnit: 180, searchTerms: ['pomme'] },
  { id: 'orange', name: 'Orange', category: 'fruit', caloriesPer100g: 47, proteinPer100g: 0.9, carbsPer100g: 12, fatPer100g: 0.1, fiberPer100g: 2.4, commonUnit: 'piece', gramsPerUnit: 130, searchTerms: ['orange'] },
  { id: 'strawberry', name: 'Fraises', category: 'fruit', caloriesPer100g: 32, proteinPer100g: 0.7, carbsPer100g: 7.7, fatPer100g: 0.3, fiberPer100g: 2, searchTerms: ['fraise'] },
  { id: 'blueberry', name: 'Myrtilles', category: 'fruit', caloriesPer100g: 57, proteinPer100g: 0.7, carbsPer100g: 14, fatPer100g: 0.3, fiberPer100g: 2.4, searchTerms: ['myrtille'] },
  { id: 'raspberry', name: 'Framboises', category: 'fruit', caloriesPer100g: 52, proteinPer100g: 1.2, carbsPer100g: 12, fatPer100g: 0.7, fiberPer100g: 6.5, searchTerms: ['framboise'] },
  { id: 'grape', name: 'Raisin', category: 'fruit', caloriesPer100g: 69, proteinPer100g: 0.7, carbsPer100g: 18, fatPer100g: 0.2, fiberPer100g: 0.9, searchTerms: ['raisin'] },
  { id: 'watermelon', name: 'Pastèque', category: 'fruit', caloriesPer100g: 30, proteinPer100g: 0.6, carbsPer100g: 8, fatPer100g: 0.2, fiberPer100g: 0.4, searchTerms: ['pasteque', 'melon d\'eau'] },
  { id: 'melon', name: 'Melon', category: 'fruit', caloriesPer100g: 34, proteinPer100g: 0.8, carbsPer100g: 8, fatPer100g: 0.2, fiberPer100g: 0.9, searchTerms: ['melon'] },
  { id: 'pear', name: 'Poire', category: 'fruit', caloriesPer100g: 57, proteinPer100g: 0.4, carbsPer100g: 15, fatPer100g: 0.1, fiberPer100g: 3.1, commonUnit: 'piece', gramsPerUnit: 180, searchTerms: ['poire'] },
  { id: 'peach', name: 'Pêche', category: 'fruit', caloriesPer100g: 39, proteinPer100g: 0.9, carbsPer100g: 10, fatPer100g: 0.3, fiberPer100g: 1.5, searchTerms: ['peche'] },
  { id: 'apricot', name: 'Abricot', category: 'fruit', caloriesPer100g: 48, proteinPer100g: 1.4, carbsPer100g: 11, fatPer100g: 0.4, fiberPer100g: 2, searchTerms: ['abricot'] },
  { id: 'plum', name: 'Prune', category: 'fruit', caloriesPer100g: 46, proteinPer100g: 0.7, carbsPer100g: 11, fatPer100g: 0.3, fiberPer100g: 1.4, searchTerms: ['prune'] },
  { id: 'cherry', name: 'Cerises', category: 'fruit', caloriesPer100g: 63, proteinPer100g: 1.1, carbsPer100g: 16, fatPer100g: 0.2, fiberPer100g: 2.1, searchTerms: ['cerise'] },
  { id: 'kiwi', name: 'Kiwi', category: 'fruit', caloriesPer100g: 61, proteinPer100g: 1.1, carbsPer100g: 15, fatPer100g: 0.5, fiberPer100g: 3, searchTerms: ['kiwi'] },
  { id: 'mango', name: 'Mangue', category: 'fruit', caloriesPer100g: 60, proteinPer100g: 0.8, carbsPer100g: 15, fatPer100g: 0.4, fiberPer100g: 1.6, searchTerms: ['mangue'] },
  { id: 'pineapple', name: 'Ananas', category: 'fruit', caloriesPer100g: 50, proteinPer100g: 0.5, carbsPer100g: 13, fatPer100g: 0.1, fiberPer100g: 1.4, searchTerms: ['ananas'] },
  { id: 'avocado', name: 'Avocat', category: 'fruit', caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 15, fiberPer100g: 7, commonUnit: 'piece', gramsPerUnit: 150, searchTerms: ['avocat'] },
  { id: 'lemon', name: 'Citron', category: 'fruit', caloriesPer100g: 29, proteinPer100g: 1.1, carbsPer100g: 9, fatPer100g: 0.3, fiberPer100g: 2.8, searchTerms: ['citron'] },
  { id: 'grapefruit', name: 'Pamplemousse', category: 'fruit', caloriesPer100g: 42, proteinPer100g: 0.8, carbsPer100g: 11, fatPer100g: 0.1, fiberPer100g: 1.6, searchTerms: ['pamplemousse'] },
  { id: 'fig', name: 'Figue', category: 'fruit', caloriesPer100g: 74, proteinPer100g: 0.8, carbsPer100g: 19, fatPer100g: 0.3, fiberPer100g: 2.9, searchTerms: ['figue'] },
  { id: 'dates', name: 'Dattes', category: 'fruit', caloriesPer100g: 282, proteinPer100g: 2.5, carbsPer100g: 75, fatPer100g: 0.4, fiberPer100g: 8, searchTerms: ['datte'] },
  { id: 'pomegranate', name: 'Grenade', category: 'fruit', caloriesPer100g: 83, proteinPer100g: 1.7, carbsPer100g: 19, fatPer100g: 1.2, fiberPer100g: 4, searchTerms: ['grenade'] },
  { id: 'coconut', name: 'Noix de coco', category: 'fruit', caloriesPer100g: 354, proteinPer100g: 3.3, carbsPer100g: 15, fatPer100g: 33, fiberPer100g: 9, searchTerms: ['coco', 'noix de coco'] },
  { id: 'papaya', name: 'Papaye', category: 'fruit', caloriesPer100g: 43, proteinPer100g: 0.5, carbsPer100g: 11, fatPer100g: 0.3, fiberPer100g: 1.7, searchTerms: ['papaye'] },
  { id: 'litchi', name: 'Litchi', category: 'fruit', caloriesPer100g: 66, proteinPer100g: 0.8, carbsPer100g: 17, fatPer100g: 0.4, fiberPer100g: 1.3, searchTerms: ['litchi'] },
  { id: 'passion-fruit', name: 'Fruit de la passion', category: 'fruit', caloriesPer100g: 97, proteinPer100g: 2.2, carbsPer100g: 23, fatPer100g: 0.7, fiberPer100g: 10, searchTerms: ['passion', 'maracuja'] },

  // ============================================
  // PRODUITS LAITIERS
  // ============================================
  { id: 'milk', name: 'Lait', category: 'dairy', caloriesPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.8, fatPer100g: 3.3, searchTerms: ['lait', 'milk'] },
  { id: 'yogurt', name: 'Yaourt', category: 'dairy', caloriesPer100g: 59, proteinPer100g: 3.5, carbsPer100g: 4.7, fatPer100g: 3.3, searchTerms: ['yaourt', 'yogurt'] },
  { id: 'greek-yogurt', name: 'Yaourt grec', category: 'dairy', caloriesPer100g: 97, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 5, searchTerms: ['yaourt grec', 'skyr'] },
  { id: 'cheese', name: 'Fromage', category: 'dairy', caloriesPer100g: 350, proteinPer100g: 25, carbsPer100g: 2, fatPer100g: 27, searchTerms: ['fromage', 'cheese'] },
  { id: 'cottage-cheese', name: 'Fromage blanc', category: 'dairy', caloriesPer100g: 98, proteinPer100g: 11, carbsPer100g: 3.4, fatPer100g: 4.3, searchTerms: ['fromage blanc', 'cottage'] },
  { id: 'cream', name: 'Crème fraîche', category: 'dairy', caloriesPer100g: 292, proteinPer100g: 2.1, carbsPer100g: 2.8, fatPer100g: 30, searchTerms: ['creme', 'cream'] },
  { id: 'butter', name: 'Beurre', category: 'fat', caloriesPer100g: 717, proteinPer100g: 0.9, carbsPer100g: 0.1, fatPer100g: 81, commonUnit: 'tbsp', gramsPerUnit: 14, searchTerms: ['beurre'] },

  // ============================================
  // MATIÈRES GRASSES & OLÉAGINEUX
  // ============================================
  { id: 'olive-oil', name: 'Huile d\'olive', category: 'fat', caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, commonUnit: 'tbsp', gramsPerUnit: 14, searchTerms: ['huile olive'] },
  { id: 'vegetable-oil', name: 'Huile végétale', category: 'fat', caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, commonUnit: 'tbsp', gramsPerUnit: 14, searchTerms: ['huile'] },
  { id: 'almonds', name: 'Amandes', category: 'fat', caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50, fiberPer100g: 12.5, searchTerms: ['amande'] },
  { id: 'walnuts', name: 'Noix', category: 'fat', caloriesPer100g: 654, proteinPer100g: 15, carbsPer100g: 14, fatPer100g: 65, fiberPer100g: 6.7, searchTerms: ['noix'] },
  { id: 'cashews', name: 'Noix de cajou', category: 'fat', caloriesPer100g: 553, proteinPer100g: 18, carbsPer100g: 30, fatPer100g: 44, fiberPer100g: 3.3, searchTerms: ['cajou'] },
  { id: 'hazelnuts', name: 'Noisettes', category: 'fat', caloriesPer100g: 628, proteinPer100g: 15, carbsPer100g: 17, fatPer100g: 61, fiberPer100g: 10, searchTerms: ['noisette'] },
  { id: 'pistachios', name: 'Pistaches', category: 'fat', caloriesPer100g: 560, proteinPer100g: 20, carbsPer100g: 28, fatPer100g: 45, fiberPer100g: 10, searchTerms: ['pistache'] },
  { id: 'peanuts', name: 'Cacahuètes', category: 'fat', caloriesPer100g: 567, proteinPer100g: 26, carbsPer100g: 16, fatPer100g: 49, fiberPer100g: 8.5, searchTerms: ['cacahuete', 'arachide'] },
  { id: 'peanut-butter', name: 'Beurre de cacahuète', category: 'fat', caloriesPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50, commonUnit: 'tbsp', gramsPerUnit: 16, searchTerms: ['beurre cacahuete'] },
  { id: 'seeds-sunflower', name: 'Graines de tournesol', category: 'fat', caloriesPer100g: 584, proteinPer100g: 21, carbsPer100g: 20, fatPer100g: 51, fiberPer100g: 8.6, searchTerms: ['tournesol', 'graines'] },
  { id: 'seeds-chia', name: 'Graines de chia', category: 'fat', caloriesPer100g: 486, proteinPer100g: 17, carbsPer100g: 42, fatPer100g: 31, fiberPer100g: 34, searchTerms: ['chia'] },
  { id: 'seeds-flax', name: 'Graines de lin', category: 'fat', caloriesPer100g: 534, proteinPer100g: 18, carbsPer100g: 29, fatPer100g: 42, fiberPer100g: 27, searchTerms: ['lin'] },
  { id: 'seeds-pumpkin', name: 'Graines de courge', category: 'fat', caloriesPer100g: 559, proteinPer100g: 30, carbsPer100g: 11, fatPer100g: 49, fiberPer100g: 6, searchTerms: ['courge', 'graines'] },
  { id: 'seeds-sesame', name: 'Graines de sésame', category: 'fat', caloriesPer100g: 573, proteinPer100g: 18, carbsPer100g: 23, fatPer100g: 50, fiberPer100g: 12, searchTerms: ['sesame'] },

  // ============================================
  // SNACKS & DIVERS
  // ============================================
  { id: 'honey', name: 'Miel', category: 'snack', caloriesPer100g: 304, proteinPer100g: 0.3, carbsPer100g: 82, fatPer100g: 0, commonUnit: 'tbsp', gramsPerUnit: 21, searchTerms: ['miel'] },
  { id: 'chocolate', name: 'Chocolat noir', category: 'snack', caloriesPer100g: 598, proteinPer100g: 7.8, carbsPer100g: 46, fatPer100g: 43, fiberPer100g: 11, searchTerms: ['chocolat'] },
  { id: 'sugar', name: 'Sucre', category: 'snack', caloriesPer100g: 387, proteinPer100g: 0, carbsPer100g: 100, fatPer100g: 0, searchTerms: ['sucre'] },
  { id: 'jam', name: 'Confiture', category: 'snack', caloriesPer100g: 278, proteinPer100g: 0.4, carbsPer100g: 69, fatPer100g: 0.1, searchTerms: ['confiture'] },
  { id: 'hummus', name: 'Houmous', category: 'snack', caloriesPer100g: 166, proteinPer100g: 8, carbsPer100g: 14, fatPer100g: 10, fiberPer100g: 6, searchTerms: ['houmous', 'hummus'] },

  // ============================================
  // BOISSONS
  // ============================================
  { id: 'coffee', name: 'Café', category: 'beverage', caloriesPer100g: 2, proteinPer100g: 0.3, carbsPer100g: 0, fatPer100g: 0, searchTerms: ['cafe', 'coffee'] },
  { id: 'tea', name: 'Thé', category: 'beverage', caloriesPer100g: 1, proteinPer100g: 0, carbsPer100g: 0.3, fatPer100g: 0, searchTerms: ['the', 'tea'] },
  { id: 'orange-juice', name: 'Jus d\'orange', category: 'beverage', caloriesPer100g: 45, proteinPer100g: 0.7, carbsPer100g: 10, fatPer100g: 0.2, searchTerms: ['jus orange'] },
  { id: 'apple-juice', name: 'Jus de pomme', category: 'beverage', caloriesPer100g: 46, proteinPer100g: 0.1, carbsPer100g: 11, fatPer100g: 0.1, searchTerms: ['jus pomme'] },
  { id: 'coconut-water', name: 'Eau de coco', category: 'beverage', caloriesPer100g: 19, proteinPer100g: 0.7, carbsPer100g: 3.7, fatPer100g: 0.2, searchTerms: ['eau coco'] },
  { id: 'almond-milk', name: 'Lait d\'amande', category: 'beverage', caloriesPer100g: 15, proteinPer100g: 0.6, carbsPer100g: 0.3, fatPer100g: 1.1, searchTerms: ['lait amande'] },
  { id: 'oat-milk', name: 'Lait d\'avoine', category: 'beverage', caloriesPer100g: 43, proteinPer100g: 0.4, carbsPer100g: 7, fatPer100g: 1.5, searchTerms: ['lait avoine'] },
  { id: 'soy-milk', name: 'Lait de soja', category: 'beverage', caloriesPer100g: 33, proteinPer100g: 2.8, carbsPer100g: 1.8, fatPer100g: 1.6, searchTerms: ['lait soja'] }
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




