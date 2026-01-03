/**
 * VocabularyReview - Révision vocabulaire avec Spaced Repetition (SM-2)
 * Utilise useVocabularyReview hook
 */

import { useState, useEffect } from 'react'
import { useVocabularyReview } from '../../hooks/useVocabularyReview'
import { Volume2, Check, X, RefreshCw, Trophy, TrendingUp } from 'lucide-react'
import type { VocabularyWord } from '../../types/languages'

interface VocabularyReviewProps {
  courseId: string
  userId?: string
}

export function VocabularyReview({ courseId, userId = 'current-user' }: VocabularyReviewProps) {
  const { dueWords, stats, submitReview, loadDueWords } = useVocabularyReview(courseId, userId)
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [reviewedToday, setReviewedToday] = useState(0)

  const currentWord = dueWords[currentIndex]

  const handleReview = async (quality: number) => {
    if (!currentWord) return
    
    const success = await submitReview(currentWord.id, quality)
    
    if (success) {
      setReviewedToday(prev => prev + 1)
      setShowAnswer(false)
      
      // Passer au mot suivant
      if (currentIndex < dueWords.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        // Recharger les mots à réviser
        await loadDueWords()
        setCurrentIndex(0)
      }
    }
  }

  if (!currentWord) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Aucun mot à réviser ! 🎉
          </h3>
          <p className="text-gray-400 mb-6">
            Reviens demain pour de nouvelles révisions
          </p>
          <div className="inline-flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats?.total || 0}</div>
              <div className="text-gray-400">Total mots</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats?.mastered || 0}</div>
              <div className="text-gray-400">Maîtrisés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{reviewedToday}</div>
              <div className="text-gray-400">Aujourd'hui</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Stats en haut */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-gray-400">
            {currentIndex + 1} / {dueWords.length}
          </span>
          <div className="h-2 w-32 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${((currentIndex + 1) / dueWords.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-blue-400">
            <RefreshCw className="w-4 h-4" />
            <span>{reviewedToday}</span>
          </div>
          <div className="flex items-center gap-1 text-green-400">
            <TrendingUp className="w-4 h-4" />
            <span>{currentWord.masteryLevel}%</span>
          </div>
        </div>
      </div>

      {/* Carte de vocabulaire */}
      <div 
        className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-12 border-2 border-gray-700 cursor-pointer hover:border-gray-600 transition-colors min-h-[300px] flex flex-col items-center justify-center"
        onClick={() => setShowAnswer(!showAnswer)}
      >
        {!showAnswer ? (
          // Face : Mot étranger
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-white mb-2">
              {currentWord.word}
            </div>
            {currentWord.pronunciation && (
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <Volume2 className="w-5 h-5" />
                <span className="text-lg">{currentWord.pronunciation}</span>
              </div>
            )}
            {currentWord.context && (
              <div className="text-sm text-gray-500 mt-4">
                {currentWord.context}
              </div>
            )}
            <div className="text-sm text-gray-500 mt-8">
              Cliquez pour voir la réponse
            </div>
          </div>
        ) : (
          // Face : Traduction
          <div className="text-center space-y-4">
            <div className="text-3xl text-gray-400 mb-2">
              {currentWord.word}
            </div>
            <div className="text-4xl font-bold text-blue-400 mb-4">
              {currentWord.translation}
            </div>
            {currentWord.example && (
              <div className="text-sm text-gray-400 italic mt-6 max-w-md">
                « {currentWord.example} »
              </div>
            )}
          </div>
        )}

        {/* Indicateur de flip */}
        <div className="absolute bottom-4 right-4 text-xs text-gray-600">
          {showAnswer ? 'Retourner' : 'Voir réponse'}
        </div>
      </div>

      {/* Boutons de qualité (SM-2) */}
      {showAnswer && (
        <div className="space-y-3">
          <p className="text-center text-sm text-gray-400 mb-4">
            Évaluez votre réponse :
          </p>
          
          <div className="grid grid-cols-3 gap-3">
            {/* Facile (5) */}
            <button
              onClick={() => handleReview(5)}
              className="p-4 bg-green-600/20 hover:bg-green-600/30 border-2 border-green-600 rounded-lg transition-colors group"
            >
              <Check className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <div className="text-sm font-medium text-green-400">Parfait</div>
              <div className="text-xs text-gray-400 mt-1">Immédiat</div>
            </button>

            {/* Moyen (3) */}
            <button
              onClick={() => handleReview(3)}
              className="p-4 bg-yellow-600/20 hover:bg-yellow-600/30 border-2 border-yellow-600 rounded-lg transition-colors group"
            >
              <RefreshCw className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <div className="text-sm font-medium text-yellow-400">Hésitant</div>
              <div className="text-xs text-gray-400 mt-1">Avec effort</div>
            </button>

            {/* Difficile (1) */}
            <button
              onClick={() => handleReview(1)}
              className="p-4 bg-red-600/20 hover:bg-red-600/30 border-2 border-red-600 rounded-lg transition-colors group"
            >
              <X className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <div className="text-sm font-medium text-red-400">Oublié</div>
              <div className="text-xs text-gray-400 mt-1">À revoir</div>
            </button>
          </div>

          {/* Boutons qualité détaillés */}
          <details className="mt-4">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 text-center">
              Options avancées
            </summary>
            <div className="grid grid-cols-6 gap-2 mt-3">
              {[0, 1, 2, 3, 4, 5].map(quality => (
                <button
                  key={quality}
                  onClick={() => handleReview(quality)}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white transition-colors"
                >
                  {quality}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              0=Oublié • 5=Parfait
            </p>
          </details>
        </div>
      )}

      {/* Stats globales en bas */}
      {stats && (
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
          <div className="grid grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-gray-400">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{stats.mastered}</div>
              <div className="text-gray-400">Maîtrisés</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{stats.dueToday}</div>
              <div className="text-gray-400">À réviser</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">{stats.avgMastery}%</div>
              <div className="text-gray-400">Moyenne</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

