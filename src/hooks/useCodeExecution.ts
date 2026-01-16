/**
 * 🚀 useCodeExecution - Hook pour exécuter du code avec streaming
 * 
 * Philosophie :
 * - Simple et direct
 * - Feedback temps réel
 * - Gestion erreurs élégante
 */

import { useState, useCallback, useRef } from 'react'
import { useStore } from '../store/useStore'
import { API_URLS } from '../services/api'

interface ExecutionResult {
  stdout: string
  stderr: string
  exit_code: number
  error?: string
}

interface CodeExecutionState {
  isExecuting: boolean
  result: ExecutionResult | null
  statusMessage: string
}

export function useCodeExecution() {
  const { addToast } = useStore()
  const [state, setState] = useState<CodeExecutionState>({
    isExecuting: false,
    result: null,
    statusMessage: ''
  })
  
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Exécute du code avec streaming en temps réel
   */
  const executeCode = useCallback(async (
    code: string,
    language: string
  ): Promise<ExecutionResult | null> => {
    if (!code.trim()) {
      addToast('Code vide', 'error')
      return null
    }

    // Reset state
    setState({
      isExecuting: true,
      result: null,
      statusMessage: 'Préparation...'
    })

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch(`${API_URLS.CODE}/execute/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          language,
          stdin: ''
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`)
      }

      // Lire le stream ligne par ligne
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Stream non disponible')
      }

      let finalResult: ExecutionResult | null = null

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const event = JSON.parse(line)

            if (event.type === 'status') {
              // Mise à jour du statut
              setState(prev => ({
                ...prev,
                statusMessage: event.data
              }))
            } 
            else if (event.type === 'result') {
              // Résultat final
              finalResult = event.data
              setState(prev => ({
                ...prev,
                result: finalResult,
                statusMessage: 'Terminé'
              }))

              // Toast selon le résultat
              if (event.data.exit_code === 0) {
                addToast('✅ Exécution réussie', 'success')
              } else {
                addToast('⚠️ Erreur d\'exécution', 'error')
              }
            } 
            else if (event.type === 'error') {
              // Erreur
              finalResult = {
                stdout: '',
                stderr: event.data,
                exit_code: 1,
                error: event.data
              }
              setState(prev => ({
                ...prev,
                result: finalResult,
                statusMessage: 'Erreur'
              }))

              addToast(`❌ ${event.data}`, 'error')
            }
          } catch (parseError) {
            console.error('Erreur parsing event:', parseError)
          }
        }
      }

      setState(prev => ({ ...prev, isExecuting: false }))
      return finalResult

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          addToast('Exécution annulée', 'info')
        } else if (error.message.includes('Failed to fetch')) {
          addToast('❌ Backend inaccessible', 'error')
        } else {
          addToast(`❌ ${error.message}`, 'error')
        }
      }

      setState({
        isExecuting: false,
        result: {
          stdout: '',
          stderr: error instanceof Error ? error.message : 'Erreur inconnue',
          exit_code: 1,
          error: error instanceof Error ? error.message : undefined
        },
        statusMessage: 'Erreur'
      })

      return null
    }
  }, [addToast])

  /**
   * Annule l'exécution en cours
   */
  const cancelExecution = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setState(prev => ({
      ...prev,
      isExecuting: false,
      statusMessage: 'Annulé'
    }))
  }, [])

  /**
   * Reset le résultat
   */
  const clearResult = useCallback(() => {
    setState({
      isExecuting: false,
      result: null,
      statusMessage: ''
    })
  }, [])

  return {
    // State
    isExecuting: state.isExecuting,
    result: state.result,
    statusMessage: state.statusMessage,
    
    // Actions
    executeCode,
    cancelExecution,
    clearResult
  }
}


