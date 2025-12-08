import { useState } from 'react'
import { X, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react'
import { useStore, DEFAULT_CATEGORIES } from '../../store/useStore'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface CategoriesManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CategoriesManagementModal({ isOpen, onClose }: CategoriesManagementModalProps) {
  const { customCategories, addCategory, updateCategory, deleteCategory, tasks } = useStore()
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories]
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editEmoji, setEditEmoji] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newEmoji, setNewEmoji] = useState('📁')

  const handleAddCategory = () => {
    if (!newLabel.trim()) return
    addCategory(newLabel.trim(), newEmoji)
    setNewLabel('')
    setNewEmoji('📁')
  }

  const handleStartEdit = (id: string, label: string, emoji: string) => {
    setEditingId(id)
    setEditLabel(label)
    setEditEmoji(emoji)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editLabel.trim()) return
    updateCategory(editingId, editLabel.trim(), editEmoji)
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    deleteCategory(id)
  }

  const getCategoryUsage = (id: string) => {
    return tasks.filter(t => t.category === id).length
  }

  const isDefaultCategory = (id: string) => {
    return DEFAULT_CATEGORIES.some(cat => cat.id === id)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gérer les catégories"
      size="md"
    >
      <div className="space-y-6">
        {/* Add New Category */}
        <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
          <h3 className="text-sm font-medium text-zinc-300 mb-3">Nouvelle catégorie</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              placeholder="📁"
              maxLength={2}
              className="w-14 text-center bg-zinc-900/50 text-white px-2 py-2 rounded-lg border border-white/5 focus:border-indigo-500/50 focus:outline-none"
            />
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              placeholder="Nom de la catégorie..."
              className="flex-1 bg-zinc-900/50 text-white px-3 py-2 rounded-lg border border-white/5 focus:border-indigo-500/50 focus:outline-none text-sm"
            />
            <Button
              variant="primary"
              onClick={handleAddCategory}
              disabled={!newLabel.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Categories List */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Toutes les catégories</h3>
          {allCategories.map((cat) => {
            const usage = getCategoryUsage(cat.id)
            const isDefault = isDefaultCategory(cat.id)
            const isEditing = editingId === cat.id

            return (
              <div
                key={cat.id}
                className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/5 hover:bg-white/[0.04] transition-colors"
              >
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editEmoji}
                      onChange={(e) => setEditEmoji(e.target.value)}
                      maxLength={2}
                      className="w-10 text-center bg-zinc-900/50 text-white px-2 py-1 rounded border border-white/5 focus:border-indigo-500/50 focus:outline-none text-sm"
                    />
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                      className="flex-1 bg-zinc-900/50 text-white px-3 py-1 rounded border border-white/5 focus:border-indigo-500/50 focus:outline-none text-sm"
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded text-sm hover:bg-indigo-500/30 transition-colors"
                    >
                      Sauver
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
                    >
                      Annuler
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-xl">{cat.emoji}</span>
                    <span className="flex-1 text-sm text-zinc-300">{cat.label}</span>
                    {usage > 0 && (
                      <span className="text-xs text-zinc-600 bg-white/5 px-2 py-1 rounded">
                        {usage} tâche{usage > 1 ? 's' : ''}
                      </span>
                    )}
                    {isDefault && (
                      <span className="text-xs text-zinc-600 bg-white/5 px-2 py-1 rounded">
                        Par défaut
                      </span>
                    )}
                    {!isDefault && (
                      <>
                        <button
                          onClick={() => handleStartEdit(cat.id, cat.label, cat.emoji)}
                          className="p-2 text-zinc-500 hover:text-indigo-400 transition-colors"
                          title="Éditer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="p-2 text-zinc-500 hover:text-rose-400 transition-colors"
                          title="Supprimer"
                          disabled={usage > 0}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-300">
            Les catégories par défaut ne peuvent pas être modifiées ou supprimées.
            Vous ne pouvez supprimer une catégorie que si aucune tâche ne l'utilise.
          </p>
        </div>
      </div>
    </Modal>
  )
}

