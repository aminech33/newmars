import { useState } from 'react'
import { X, Edit2, Save } from 'lucide-react'
import { FoodItem, FOOD_CATEGORIES } from '../../utils/foodDatabase'

interface FoodDetailModalProps {
  food: FoodItem | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (food: FoodItem) => void
}

export function FoodDetailModal({ food, isOpen, onClose, onUpdate }: FoodDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedFood, setEditedFood] = useState<FoodItem | null>(null)

  if (!isOpen || !food) return null

  const currentFood = editedFood || food
  const categoryInfo = FOOD_CATEGORIES.find(c => c.value === currentFood.category)

  const handleEdit = () => {
    setEditedFood({ ...currentFood })
    setIsEditing(true)
  }

  const handleSave = () => {
    if (editedFood) {
      onUpdate(editedFood)
      setIsEditing(false)
      setEditedFood(null)
    }
  }

  const handleCancel = () => {
    setEditedFood(null)
    setIsEditing(false)
  }

  const handleChange = (field: keyof FoodItem, value: string | number) => {
    if (editedFood) {
      setEditedFood({ ...editedFood, [field]: value })
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800/50 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{categoryInfo?.emoji}</span>
            <div>
              <h2 className="text-lg font-medium text-zinc-200">{currentFood.name}</h2>
              <p className="text-sm text-zinc-500">{categoryInfo?.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-cyan-400"
                aria-label="Modifier"
                title="Modifier les valeurs"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 text-sm bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Valeurs nutritionnelles pour 100g */}
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-4">Valeurs nutritionnelles (pour 100g)</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Calories */}
                <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-800/50">
                  <label className="text-xs text-zinc-500 block mb-2">Calories (kcal)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedFood?.caloriesPer100g || 0}
                      onChange={(e) => handleChange('caloriesPer100g', parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-orange-400 font-bold focus:outline-none focus:border-orange-500/50"
                      step="0.1"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-orange-400">{Math.round(currentFood.caloriesPer100g)}</p>
                  )}
                </div>

                {/* Protéines */}
                <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-800/50">
                  <label className="text-xs text-zinc-500 block mb-2">Protéines (g)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedFood?.proteinPer100g || 0}
                      onChange={(e) => handleChange('proteinPer100g', parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-rose-400 font-bold focus:outline-none focus:border-rose-500/50"
                      step="0.1"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-rose-400">{Math.round(currentFood.proteinPer100g * 10) / 10}g</p>
                  )}
                </div>

                {/* Glucides */}
                <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-800/50">
                  <label className="text-xs text-zinc-500 block mb-2">Glucides (g)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedFood?.carbsPer100g || 0}
                      onChange={(e) => handleChange('carbsPer100g', parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-amber-400 font-bold focus:outline-none focus:border-amber-500/50"
                      step="0.1"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-amber-400">{Math.round(currentFood.carbsPer100g * 10) / 10}g</p>
                  )}
                </div>

                {/* Lipides */}
                <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-800/50">
                  <label className="text-xs text-zinc-500 block mb-2">Lipides (g)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedFood?.fatPer100g || 0}
                      onChange={(e) => handleChange('fatPer100g', parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-yellow-400 font-bold focus:outline-none focus:border-yellow-500/50"
                      step="0.1"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-yellow-400">{Math.round(currentFood.fatPer100g * 10) / 10}g</p>
                  )}
                </div>

                {/* Fibres */}
                {(currentFood.fiberPer100g !== undefined || isEditing) && (
                  <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-800/50">
                    <label className="text-xs text-zinc-500 block mb-2">Fibres (g)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedFood?.fiberPer100g || 0}
                        onChange={(e) => handleChange('fiberPer100g', parseFloat(e.target.value) || 0)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-emerald-400 font-bold focus:outline-none focus:border-emerald-500/50"
                        step="0.1"
                      />
                    ) : (
                      <p className="text-2xl font-bold text-emerald-400">{Math.round((currentFood.fiberPer100g || 0) * 10) / 10}g</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Unité commune */}
            {(currentFood.commonUnit || isEditing) && (
              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-4">Unité de mesure commune</h3>
                <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-800/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-zinc-500 block mb-2">Unité</label>
                      {isEditing ? (
                        <select
                          value={editedFood?.commonUnit || ''}
                          onChange={(e) => handleChange('commonUnit', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-300 focus:outline-none focus:border-cyan-500/50"
                        >
                          <option value="">Aucune</option>
                          <option value="piece">Pièce</option>
                          <option value="cup">Tasse</option>
                          <option value="tbsp">Cuillère à soupe</option>
                          <option value="tsp">Cuillère à café</option>
                        </select>
                      ) : (
                        <p className="text-lg font-medium text-zinc-300">
                          {currentFood.commonUnit === 'piece' ? 'Pièce' : currentFood.commonUnit}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 block mb-2">Grammes par unité</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedFood?.gramsPerUnit || 0}
                          onChange={(e) => handleChange('gramsPerUnit', parseFloat(e.target.value) || 0)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-300 font-medium focus:outline-none focus:border-cyan-500/50"
                          step="1"
                        />
                      ) : (
                        <p className="text-lg font-medium text-zinc-300">{currentFood.gramsPerUnit}g</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
              <p className="text-xs text-cyan-400">
                💡 <strong>Astuce :</strong> Les modifications sont enregistrées localement dans votre navigateur. 
                Elles ne modifient pas la base de données originale.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

