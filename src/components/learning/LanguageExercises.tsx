/**
 * 🗣️ LanguageExercises - Exercices interactifs pour l'apprentissage des langues
 * Types: fill-blank, translate, multiple-choice, reorder
 */

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, ArrowRight, RefreshCw, Award, Loader2 } from 'lucide-react'
import { API_URLS } from '../../services/api'

interface Exercise {
  id: string
  type: 'fill-blank' | 'translate' | 'multiple-choice' | 'reorder'
  question: string
  options?: string[]
  correctAnswer: string | string[]
  explanation?: string
  difficulty: 'easy' | 'medium' | 'hard'
  topic: string
}

interface LanguageExercisesProps {
  courseId: string
  level?: string
  userId?: string
}

const API_BASE = API_URLS.LANGUAGES

export function LanguageExercises({ 
  courseId, 
  level = 'A1',
  userId = 'current-user' 
}: LanguageExercisesProps) {
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [userAnswer, setUserAnswer] = useState<string>('')
  const [reorderWords, setReorderWords] = useState<string[]>([])
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ completed: 0, correct: 0, streak: 0 })

  // Charger un nouvel exercice
  const loadExercise = async () => {
    setLoading(true)
    setShowFeedback(false)
    setUserAnswer('')
    setSelectedWords([])
    
    try {
      const response = await fetch(`${API_BASE}/generate-exercise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          user_id: userId,
          level: level
        })
      })
      
      if (!response.ok) throw new Error('Failed to generate exercise')
      
      const data = await response.json()
      setExercise(data.exercise)
      
      // Si type reorder, mélanger les mots
      if (data.exercise.type === 'reorder' && Array.isArray(data.exercise.correctAnswer)) {
        const words = [...data.exercise.correctAnswer]
        setReorderWords(words.sort(() => Math.random() - 0.5))
      }
    } catch (error) {
      console.error('Error loading exercise:', error)
    } finally {
      setLoading(false)
    }
  }

  // Vérifier la réponse
  const checkAnswer = async () => {
    if (!exercise) return
    
    let finalAnswer = userAnswer
    
    // Pour reorder, joindre les mots sélectionnés
    if (exercise.type === 'reorder') {
      finalAnswer = selectedWords.join(' ')
    }
    
    setLoading(true)
    
    try {
      const response = await fetch(`${API_BASE}/check-exercise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: exercise.id,
          user_answer: finalAnswer,
          course_id: courseId,
          user_id: userId
        })
      })
      
      if (!response.ok) throw new Error('Failed to check answer')
      
      const data = await response.json()
      setIsCorrect(data.is_correct)
      setShowFeedback(true)
      
      // Mettre à jour stats
      if (data.is_correct) {
        setStats({
          completed: stats.completed + 1,
          correct: stats.correct + 1,
          streak: stats.streak + 1
        })
      } else {
        setStats({
          ...stats,
          completed: stats.completed + 1,
          streak: 0
        })
      }
    } catch (error) {
      console.error('Error checking answer:', error)
    } finally {
      setLoading(false)
    }
  }

  // Charger le premier exercice au montage
  useEffect(() => {
    loadExercise()
  }, [courseId])

  // Gestion drag & drop pour reorder
  const addWord = (word: string) => {
    setSelectedWords([...selectedWords, word])
    setReorderWords(reorderWords.filter(w => w !== word))
  }

  const removeWord = (index: number) => {
    const word = selectedWords[index]
    setSelectedWords(selectedWords.filter((_, i) => i !== index))
    setReorderWords([...reorderWords, word])
  }

  if (loading && !exercise) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-400 mx-auto mb-3" />
          <p className="text-zinc-400">Génération d'exercice...</p>
        </div>
      </div>
    )
  }

  if (!exercise) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-zinc-500">
          <p>Impossible de charger l'exercice</p>
          <button
            onClick={loadExercise}
            className="mt-4 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-zinc-900 p-6 overflow-y-auto">
      {/* Header avec stats */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-zinc-400">
              {stats.correct}/{stats.completed} corrects
            </span>
          </div>
          {stats.streak > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <span className="text-orange-400">🔥</span>
              <span className="text-orange-400 font-medium">{stats.streak}</span>
            </div>
          )}
        </div>
        <div className="text-xs text-zinc-500 px-2 py-1 bg-zinc-800 rounded">
          {exercise.difficulty.toUpperCase()}
        </div>
      </div>

      {/* Question */}
      <div className="bg-zinc-800 rounded-xl p-6 mb-6">
        <div className="text-sm text-zinc-400 mb-2">{exercise.type === 'fill-blank' ? 'Complète la phrase' : exercise.type === 'translate' ? 'Traduis' : exercise.type === 'reorder' ? 'Remets dans l\'ordre' : 'Choisis la bonne réponse'}</div>
        <div className="text-xl text-white font-medium">{exercise.question}</div>
      </div>

      {/* Zone de réponse selon le type */}
      <div className="flex-1">
        {/* Fill-blank */}
        {exercise.type === 'fill-blank' && (
          <div>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !showFeedback && checkAnswer()}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
              placeholder="Ta réponse..."
              disabled={showFeedback}
            />
          </div>
        )}

        {/* Translate */}
        {exercise.type === 'translate' && (
          <div>
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors resize-none"
              rows={3}
              placeholder="Ta traduction..."
              disabled={showFeedback}
            />
          </div>
        )}

        {/* Multiple-choice */}
        {exercise.type === 'multiple-choice' && exercise.options && (
          <div className="space-y-3">
            {exercise.options.map((option, index) => (
              <button
                key={index}
                onClick={() => !showFeedback && setUserAnswer(option)}
                disabled={showFeedback}
                className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                  userAnswer === option
                    ? showFeedback && isCorrect
                      ? 'bg-green-500/20 border-2 border-green-500 text-green-400'
                      : showFeedback && !isCorrect
                      ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
                      : 'bg-pink-500/20 border-2 border-pink-500 text-pink-400'
                    : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-zinc-600'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {/* Reorder */}
        {exercise.type === 'reorder' && (
          <div className="space-y-4">
            {/* Zone de construction */}
            <div className="min-h-[80px] p-4 bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-lg">
              <div className="flex flex-wrap gap-2">
                {selectedWords.length === 0 ? (
                  <span className="text-zinc-500 text-sm">Clique sur les mots dans le bon ordre...</span>
                ) : (
                  selectedWords.map((word, index) => (
                    <button
                      key={index}
                      onClick={() => !showFeedback && removeWord(index)}
                      className="px-3 py-1.5 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm font-medium"
                      disabled={showFeedback}
                    >
                      {word}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Mots disponibles */}
            <div className="flex flex-wrap gap-2">
              {reorderWords.map((word, index) => (
                <button
                  key={index}
                  onClick={() => addWord(word)}
                  className="px-3 py-1.5 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 transition-colors text-sm font-medium"
                  disabled={showFeedback}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Feedback */}
        {showFeedback && (
          <div className={`mt-6 p-4 rounded-lg ${isCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className={`font-medium mb-1 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {isCorrect ? '✅ Correct !' : '❌ Incorrect'}
                </div>
                {!isCorrect && (
                  <div className="text-sm text-zinc-400 mb-2">
                    <span className="font-medium text-zinc-300">Réponse correcte :</span> {Array.isArray(exercise.correctAnswer) ? exercise.correctAnswer.join(' ') : exercise.correctAnswer}
                  </div>
                )}
                {exercise.explanation && (
                  <div className="text-sm text-zinc-400">
                    💡 {exercise.explanation}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        {!showFeedback ? (
          <button
            onClick={checkAnswer}
            disabled={
              loading ||
              (!userAnswer && selectedWords.length === 0)
            }
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Vérification...
              </>
            ) : (
              <>
                Vérifier
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={loadExercise}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Exercice suivant
          </button>
        )}
      </div>
    </div>
  )
}

