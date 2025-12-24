import { useState, useCallback } from 'react'
import { X, Plus, RotateCcw, Check, ChevronLeft, ChevronRight, Brain, Sparkles, Download } from 'lucide-react'
import { Flashcard, Course } from '../../types/learning'
import { exportFlashcards, getFlashcardsStats } from '../../utils/flashcardExport'
import { useStore } from '../../store/useStore'

interface FlashcardModalProps {
  isOpen: boolean
  onClose: () => void
  flashcards: Flashcard[]
  onAddFlashcard: (front: string, back: string) => void
  onDeleteFlashcard: (id: string) => void
  courseName: string
  course: Course  // Ajout du cours complet pour l'export
}

type ModalMode = 'list' | 'create' | 'review'

export function FlashcardModal({
  isOpen,
  onClose,
  flashcards,
  onAddFlashcard,
  onDeleteFlashcard,
  courseName,
  course
}: FlashcardModalProps) {
  const { addToast } = useStore()
  const [mode, setMode] = useState<ModalMode>('list')
  const [newFront, setNewFront] = useState('')
  const [newBack, setNewBack] = useState('')
  const [showExportMenu, setShowExportMenu] = useState(false)
  
  // Review state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [reviewStats, setReviewStats] = useState({ correct: 0, incorrect: 0 })
  
  // Export handler
  const handleExport = useCallback((format: 'json' | 'markdown' | 'csv' | 'anki') => {
    exportFlashcards(course, format)
    addToast(`✅ Flashcards exportées en ${format.toUpperCase()}`, 'success')
    setShowExportMenu(false)
  }, [course, addToast])

  const handleCreate = useCallback(() => {
    if (newFront.trim() && newBack.trim()) {
      onAddFlashcard(newFront.trim(), newBack.trim())
      setNewFront('')
      setNewBack('')
      setMode('list')
    }
  }, [newFront, newBack, onAddFlashcard])

  const handleStartReview = useCallback(() => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setReviewStats({ correct: 0, incorrect: 0 })
    setMode('review')
  }, [])

  const handleFlip = useCallback(() => {
    setIsFlipped(!isFlipped)
  }, [isFlipped])

  const handleAnswer = useCallback((correct: boolean) => {
    setReviewStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1)
    }))
    
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setIsFlipped(false)
    } else {
      // Review complete
      setMode('list')
    }
  }, [currentIndex, flashcards.length])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setIsFlipped(false)
    }
  }, [currentIndex])

  const handleNext = useCallback(() => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setIsFlipped(false)
    }
  }, [currentIndex, flashcards.length])

  if (!isOpen) return null

  const currentCard = flashcards[currentIndex]
  const dueCards = flashcards.filter(f => {
    const today = new Date().toISOString().split('T')[0]
    return f.nextReview <= today
  })

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-violet-400" />
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Flashcards</h2>
              <p className="text-xs text-zinc-500">{courseName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Export Button */}
            {flashcards.length > 0 && mode === 'list' && (
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Exporter"
                >
                  <Download className="w-5 h-5" />
                </button>
                
                {/* Export Menu */}
                {showExportMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-10 py-1">
                    <button
                      onClick={() => handleExport('markdown')}
                      className="w-full px-4 py-2 text-sm text-left text-zinc-300 hover:bg-zinc-700 transition-colors"
                    >
                      📝 Markdown (.md)
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full px-4 py-2 text-sm text-left text-zinc-300 hover:bg-zinc-700 transition-colors"
                    >
                      📄 JSON (.json)
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full px-4 py-2 text-sm text-left text-zinc-300 hover:bg-zinc-700 transition-colors"
                    >
                      📊 CSV (.csv)
                    </button>
                    <button
                      onClick={() => handleExport('anki')}
                      className="w-full px-4 py-2 text-sm text-left text-zinc-300 hover:bg-zinc-700 transition-colors"
                    >
                      🎴 Anki (.txt)
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={onClose}
              className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Mode: List */}
          {mode === 'list' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-zinc-200">{flashcards.length}</p>
                  <p className="text-xs text-zinc-500">Total</p>
                </div>
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-violet-400">{dueCards.length}</p>
                  <p className="text-xs text-violet-400/70">À réviser</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-400">
                    {flashcards.length > 0 
                      ? Math.round((flashcards.reduce((sum, f) => sum + f.correctCount, 0) / 
                          Math.max(1, flashcards.reduce((sum, f) => sum + f.reviewCount, 0))) * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-emerald-400/70">Réussite</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setMode('create')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Créer une carte
                </button>
                {flashcards.length > 0 && (
                  <button
                    onClick={handleStartReview}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30 rounded-xl transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Réviser ({dueCards.length > 0 ? dueCards.length : flashcards.length})
                  </button>
                )}
              </div>

              {/* Cards List */}
              {flashcards.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {flashcards.map((card, index) => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300 truncate">{card.front}</p>
                        <p className="text-xs text-zinc-500 truncate">{card.back}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <span className="text-xs text-zinc-600">
                          {card.reviewCount}x
                        </span>
                        <button
                          onClick={() => onDeleteFlashcard(card.id)}
                          className="p-1 text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">Aucune flashcard</p>
                  <p className="text-xs text-zinc-600">Créez votre première carte pour commencer</p>
                </div>
              )}
            </div>
          )}

          {/* Mode: Create */}
          {mode === 'create' && (
            <div className="space-y-4">
              <button
                onClick={() => setMode('list')}
                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Retour
              </button>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Question (recto)</label>
                <textarea
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  placeholder="Ex: Qu'est-ce qu'une variable ?"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  rows={3}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Réponse (verso)</label>
                <textarea
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  placeholder="Ex: Un espace mémoire nommé qui stocke une valeur"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  rows={3}
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={!newFront.trim() || !newBack.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-500 hover:bg-violet-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                Créer la carte
              </button>
            </div>
          )}

          {/* Mode: Review */}
          {mode === 'review' && currentCard && (
            <div className="space-y-6">
              {/* Progress */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">
                  Carte {currentIndex + 1} / {flashcards.length}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400">✓ {reviewStats.correct}</span>
                  <span className="text-rose-400">✗ {reviewStats.incorrect}</span>
                </div>
              </div>

              {/* Card */}
              <div 
                onClick={handleFlip}
                className="relative h-64 cursor-pointer perspective-1000"
              >
                <div className={`absolute inset-0 transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                  {/* Front */}
                  <div className={`absolute inset-0 backface-hidden bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/30 rounded-2xl p-6 flex items-center justify-center ${isFlipped ? 'invisible' : ''}`}>
                    <p className="text-xl text-center text-zinc-200">{currentCard.front}</p>
                  </div>
                  
                  {/* Back */}
                  <div className={`absolute inset-0 backface-hidden bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-6 flex items-center justify-center rotate-y-180 ${!isFlipped ? 'invisible' : ''}`}>
                    <p className="text-xl text-center text-zinc-200">{currentCard.back}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {!isFlipped ? (
                <div className="text-center">
                  <p className="text-sm text-zinc-500 mb-3">Cliquez pour révéler la réponse</p>
                  <button
                    onClick={handleFlip}
                    className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
                  >
                    Retourner
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAnswer(false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Incorrect
                  </button>
                  <button
                    onClick={() => handleAnswer(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Correct
                  </button>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </button>
                <button
                  onClick={() => setMode('list')}
                  className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Terminer
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === flashcards.length - 1}
                  className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS for 3D flip effect */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  )
}

