import { useCallback } from 'react'
import { useStore } from '../store/useStore'
import { Message } from '../types/learning'

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

/**
 * Hook pour la gestion des messages et interaction IA
 */
export function useCourseMessages() {
  const {
    learningCourses,
    updateLearningCourse,
    addLearningMessage,
    deleteLearningMessage
  } = useStore()

  // ============================================
  // ACTIONS - MESSAGES
  // ============================================

  const sendMessage = useCallback(async (
    courseId: string,
    content: string
  ): Promise<Message> => {
    const course = learningCourses.find(c => c.id === courseId)
    if (!course) throw new Error('Course not found')

    const message: Message = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now()
    }

    addLearningMessage(courseId, message)
    
    // Update last active time
    updateLearningCourse(courseId, {
      lastActiveAt: Date.now(),
      messagesCount: course.messagesCount + 1
    })

    return message
  }, [learningCourses, addLearningMessage, updateLearningCourse])

  const addAIResponse = useCallback(async (
    courseId: string,
    userMessage: string
  ): Promise<Message> => {
    const course = learningCourses.find(c => c.id === courseId)
    if (!course) throw new Error('Course not found')

    try {
      // Appel au backend avec contexte SQLite
      const response = await fetch(`${API_BASE_URL}/api/chat/simple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          course_name: course.name,
          course_description: course.description,
          course_level: course.level,
          user_message: userMessage,
          conversation_history: course.messages.slice(-20).map(m => ({
            role: m.role,
            content: m.content
          })),
          system_prompt: course.systemPrompt
        })
      })

      if (!response.ok) throw new Error('Erreur serveur')
      const data = await response.json()

      const aiMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: data.response,
        timestamp: Date.now()
      }

      addLearningMessage(courseId, aiMessage)

      updateLearningCourse(courseId, {
        messagesCount: course.messagesCount + 1
      })

      return aiMessage
    } catch (error) {
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        timestamp: Date.now()
      }
      addLearningMessage(courseId, errorMessage)
      throw error
    }
  }, [learningCourses, addLearningMessage, updateLearningCourse])

  const deleteMessage = useCallback((courseId: string, messageId: string) => {
    deleteLearningMessage(courseId, messageId)
  }, [deleteLearningMessage])

  const toggleMessageLike = useCallback((courseId: string, messageId: string) => {
    const course = learningCourses.find(c => c.id === courseId)
    if (!course) return

    const message = course.messages.find(m => m.id === messageId)
    if (!message) return

    const updatedMessages = course.messages.map(m =>
      m.id === messageId ? { ...m, liked: !m.liked } : m
    )

    updateLearningCourse(courseId, { messages: updatedMessages } as any)
  }, [learningCourses, updateLearningCourse])

  // ============================================
  // STREAMING IA - Avec contexte enrichi
  // ============================================

  const sendMessageWithStreaming = useCallback(async (
    courseId: string,
    content: string,
    codeContext?: { code: string; language: string },
    terminalContext?: { recentCommands: string[]; recentOutput: string },
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    const course = learningCourses.find(c => c.id === courseId)
    if (!course) throw new Error('Course not found')

    // Préparer l'historique de conversation
    const MAX_HISTORY_MESSAGES = 20
    const recentMessages = course.messages.slice(-MAX_HISTORY_MESSAGES)
    const conversationHistory = recentMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

    // Adapter le message utilisateur selon le contexte
    let userPrompt = content
    if (codeContext && codeContext.code.trim()) {
      if (content === '▶ Exécuter') {
        userPrompt = `Analyse ce code et donne-moi :
1. Ce que fait le code (explication simple)
2. Le résultat attendu de l'exécution
3. Les erreurs ou problèmes éventuels

Réponds de façon concise. Ne répète pas le code dans ta réponse.`
      } else if (content === '💡 Aide sur mon code') {
        userPrompt = `J'ai besoin d'aide avec mon code. Analyse-le et dis-moi :
1. Ce qui pourrait être amélioré
2. Les erreurs potentielles
3. Des suggestions concrètes

Réponds de façon concise. Ne répète pas le code dans ta réponse.`
      } else {
        userPrompt = `Ma question : ${content}

Réponds à ma question en tenant compte de mon code actuel. Ne répète pas le code dans ta réponse sauf si nécessaire pour montrer une correction.`
      }
    }

    // Appel au backend avec streaming SSE
    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_id: courseId,
        course_name: course.name,
        course_description: course.description,
        course_level: course.level,
        user_message: userPrompt,
        conversation_history: conversationHistory,
        code_context: codeContext?.code,
        code_language: codeContext?.language,
        system_prompt: course.systemPrompt
      })
    })

    if (!response.ok) throw new Error('Erreur serveur')

    const reader = response.body?.getReader()
    if (!reader) throw new Error('Streaming non supporté')

    const decoder = new TextDecoder()
    let fullResponse = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.content) {
              fullResponse += data.content
              onChunk?.(data.content)
            }
            if (data.error) {
              throw new Error(data.error)
            }
          } catch (e) {
            // Ignorer les erreurs de parsing JSON pour les lignes vides
          }
        }
      }
    }

    return fullResponse
  }, [learningCourses])

  return {
    sendMessage,
    addAIResponse,
    deleteMessage,
    toggleMessageLike,
    sendMessageWithStreaming
  }
}

