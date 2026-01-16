/**
 * QuizPanel - Interface de quiz/révisions interactive
 * Utilise le backend /next-question et /submit-answer
 */

import { useState, useEffect } from 'react'
import { Brain, CheckCircle, XCircle, ArrowRight, Trophy, Loader2 } from 'lucide-react'
import { API_URLS } from '../../services/api'

interface Question {
  question: string
  options: string[]
  correctAnswer?: string
  difficulty: 'easy' | 'medium' | 'hard'
  topic: string
  explanation?: string
}

interface QuizPanelProps {
  sessionId: string
  onComplete?: () => void
}

const API_BASE = API_URLS.LEARNING

export function QuizPanel({ sessionId, onComplete }: QuizPanelProps) {
  const [question, setQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ answered: 0, correct: 0, xp: 0 })

  // Charger prochaine question
  const loadNextQuestion = async () => {
    setLoading(true)
    setShowFeedback(false)
    setSelectedAnswer(null)
    
    try {
      const response = await fetch(`${API_BASE}/next-question/${sessionId}`)
      const data = await response.json()
      
      setQuestion({
        question: data.question,
        options: data.options || [],
        difficulty: data.difficulty,
        topic: data.topic
      })
    } catch (error) {
      console.error('Erreur chargement question:', error)
    } finally {
      setLoading(false)
    }
  }

  // Soumettre réponse
  const submitAnswer = async () => {
    if (!selectedAnswer || !question) return
    
    setLoading(true)
    
    try {
      const response = await fetch(`${API_BASE}/submit-answer/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: `q-${Date.now()}`,
          user_answer: selectedAnswer,
          time_taken: 30
        })
      })
      
      const data = await response.json()
      
      setIsCorrect(data.is_correct)
      setFeedback(data.encouragement || '')
      setShowFeedback(true)
      setStats({
        answered: stats.answered + 1,
        correct: stats.correct + (data.is_correct ? 1 : 0),
        xp: stats.xp + (data.xp_earned || 0)
      })
    } catch (error) {
      console.error('Erreur soumission:', error)
    } finally {
      setLoading(false)
    }
  }

  // Charger première question
  useEffect(() => {
    loadNextQuestion()
  }, [sessionId])

  if (loading && !question) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (!question) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Aucune question disponible</p>
      </div>
    )
  }

  const difficultyColors = {
    easy: 'text-green-400',
    medium: 'text-yellow-400',
    hard: 'text-red-400'
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Stats en haut */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="text-gray-400">Topic:</span>
          <span className="text-white font-medium">{question.topic}</span>
        </div>
        <div className={`flex items-center gap-2 ${difficultyColors[question.difficulty]}`}>
          <span className="font-medium capitalize">{question.difficulty}</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-gray-400">
            {stats.answered} Q • {stats.correct}/{stats.answered} ✓
          </span>
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-500 font-bold">{stats.xp} XP</span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl text-white font-medium mb-6">
          {question.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => !showFeedback && setSelectedAnswer(option)}
              disabled={showFeedback}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedAnswer === option
                  ? showFeedback
                    ? isCorrect
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-red-500 bg-red-500/10'
                    : 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
              } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700 text-sm font-medium">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-white">{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div className={`rounded-xl p-6 border-2 ${
          isCorrect
            ? 'bg-green-500/10 border-green-500'
            : 'bg-red-500/10 border-red-500'
        }`}>
          <div className="flex items-start gap-3">
            {isCorrect ? (
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
            )}
            <div className="flex-1">
              <h4 className={`font-semibold mb-2 ${
                isCorrect ? 'text-green-400' : 'text-red-400'
              }`}>
                {isCorrect ? 'Correct !' : 'Pas tout à fait...'}
              </h4>
              <p className="text-gray-300">{feedback}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!showFeedback ? (
          <button
            onClick={submitAnswer}
            disabled={!selectedAnswer || loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Valider
                <CheckCircle className="w-5 h-5" />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={loadNextQuestion}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Question suivante
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}

