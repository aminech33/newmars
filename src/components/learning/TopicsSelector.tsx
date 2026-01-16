/**
 * TopicsSelector - Sélection des topics pour révision avec interleaving
 * Permet de choisir les topics et démarrer une session
 */

import { useState } from 'react'
import { Check, Zap, Play, Info } from 'lucide-react'
import type { CourseTopic } from '../../types/learning'
import { API_URLS } from '../../services/api'

interface TopicsSelectorProps {
  courseId: string
  topics: CourseTopic[]
  onStartSession: (selectedTopics: string[], useInterleaving: boolean) => Promise<void>
}

const API_BASE = API_URLS.LEARNING

export function TopicsSelector({ courseId, topics, onStartSession }: TopicsSelectorProps) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [useInterleaving, setUseInterleaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    )
  }

  const selectAll = () => {
    setSelectedTopics(topics.map(t => t.id))
  }

  const clearAll = () => {
    setSelectedTopics([])
  }

  const handleStart = async () => {
    if (selectedTopics.length === 0) return
    
    setLoading(true)
    try {
      await onStartSession(selectedTopics, useInterleaving)
    } catch (error) {
      console.error('Erreur démarrage session:', error)
    } finally {
      setLoading(false)
    }
  }

  const canUseInterleaving = selectedTopics.length >= 2

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">
          Sélectionne les topics à réviser
        </h2>
        <p className="text-gray-400">
          Choisis un ou plusieurs sujets pour ta session de révision
        </p>
      </div>

      {/* Actions rapides */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={selectAll}
          className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Tout sélectionner
        </button>
        <button
          onClick={clearAll}
          className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Tout effacer
        </button>
      </div>

      {/* Liste des topics */}
      <div className="space-y-2">
        {topics.map(topic => (
          <button
            key={topic.id}
            onClick={() => toggleTopic(topic.id)}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              selectedTopics.includes(topic.id)
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                selectedTopics.includes(topic.id)
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-600'
              }`}>
                {selectedTopics.includes(topic.id) && (
                  <Check className="w-4 h-4 text-white" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="font-medium text-white">{topic.name}</div>
                <div className="text-sm text-gray-400 capitalize">
                  {topic.status === 'completed' && '✓ Complété'}
                  {topic.status === 'in_progress' && '⏳ En cours'}
                  {topic.status === 'pending' && '○ À faire'}
                </div>
              </div>

              {topic.status === 'completed' && (
                <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                  Maîtrisé
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Option Interleaving */}
      {canUseInterleaving && (
        <div className="bg-purple-500/10 border-2 border-purple-500/30 rounded-xl p-4">
          <button
            onClick={() => setUseInterleaving(!useInterleaving)}
            className="w-full flex items-start gap-3"
          >
            <div className={`w-6 h-6 mt-0.5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
              useInterleaving
                ? 'border-purple-500 bg-purple-500'
                : 'border-purple-500/50'
            }`}>
              {useInterleaving && (
                <Check className="w-4 h-4 text-white" />
              )}
            </div>
            
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-purple-400" />
                <span className="font-medium text-purple-400">
                  Mode Interleaving (Avancé)
                </span>
              </div>
              <p className="text-sm text-gray-300">
                Alterne automatiquement entre topics pour +10-15% de rétention.
                Recommandé pour révisions.
              </p>
            </div>
          </button>

          {useInterleaving && (
            <div className="mt-3 flex items-start gap-2 text-xs text-purple-300 bg-purple-500/10 rounded-lg p-3">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                Le système alternera entre tes {selectedTopics.length} topics sélectionnés 
                toutes les 2-3 questions pour maximiser la rétention à long terme.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Bouton démarrer */}
      <button
        onClick={handleStart}
        disabled={selectedTopics.length === 0 || loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-medium text-lg transition-colors"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Démarrage...
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            Démarrer la session
            {selectedTopics.length > 0 && (
              <span className="text-sm opacity-80">
                ({selectedTopics.length} topic{selectedTopics.length > 1 ? 's' : ''})
              </span>
            )}
          </>
        )}
      </button>

      {/* Info */}
      {selectedTopics.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          Sélectionne au moins un topic pour commencer
        </p>
      )}
    </div>
  )
}

