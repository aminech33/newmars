import { useCallback } from 'react'
import { useStore } from '../store/useStore'
import { Message } from '../types/learning'
import { 
  generateGeminiResponse, 
  generateEnrichedLearningResponse,
  type LearningContext
} from '../utils/geminiAI'

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

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
      const context = course.systemPrompt || `Tu es un assistant expert en ${course.name}.`
      const response = await generateGeminiResponse(context, userMessage)

      const aiMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: response,
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
    const conversationHistory = course.messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

    // 🔥 CHARGER LES CONCEPTS PERTINENTS DEPUIS SQLITE
    let relevantConcepts: any[] = []
    try {
      const response = await fetch(`http://localhost:8000/api/knowledge/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          courseId, 
          query: content,
          limit: 5 
        })
      })
      if (response.ok) {
        const data = await response.json()
        relevantConcepts = data.concepts || []
      }
    } catch (err) {
      console.warn('⚠️ Concepts search failed, continuing without them')
    }

    // Construire le contexte d'apprentissage enrichi
    const learningContext: LearningContext = {
      courseName: course.name,
      courseDescription: course.description,
      level: course.level,
      systemPrompt: course.systemPrompt,
      currentMastery: course.currentMastery,
      totalTimeSpent: course.totalTimeSpent,
      sessionsCount: course.sessionsCount,
      topics: course.topics,
      progress: course.progress,
      // 3 dernières notes pour contexte
      recentNotes: course.notes.slice(-3).map(n => ({
        title: n.title,
        content: n.content
      })),
      // 🔥 CONCEPTS SQLITE
      relevantConcepts: relevantConcepts.map(c => ({
        concept: c.concept,
        definition: c.definition,
        masteryLevel: c.masteryLevel
      })),
      // Contexte code si fourni
      codeContext: codeContext ? {
        code: codeContext.code,
        language: codeContext.language
      } : undefined,
      // Contexte terminal si fourni
      terminalContext: terminalContext
    }

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

    // Appel avec contexte enrichi
    const fullResponse = await generateEnrichedLearningResponse(
      learningContext,
      userPrompt,
      conversationHistory,
      (chunk) => {
        onChunk?.(chunk)
      }
    )

    // 🧠 NOUVEAU: Tracker l'usage actif des concepts après l'envoi du message
    try {
      await fetch('http://localhost:8000/api/knowledge/track-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          userMessage: content,
          codeContext: codeContext?.code
        })
      })
      // Pas besoin d'attendre la réponse, c'est juste pour tracking
    } catch (error) {
      console.debug('⚠️ Concept tracking failed (non-blocking):', error)
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

