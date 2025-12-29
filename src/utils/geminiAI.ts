/**
 * Gemini AI Integration
 * Handles communication with Google's Gemini API
 * Includes rate limiting for quota protection
 */

import { geminiRateLimiter, withRateLimit } from './rateLimiter'

// Gemini 2.0 Flash - Latest official model (December 2024)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash-exp'

// Vérification de sécurité
if (!API_KEY && typeof window !== 'undefined') {
  console.warn('⚠️ VITE_GEMINI_API_KEY manquante. Ajoutez-la dans votre fichier .env')
}

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
}

/**
 * Generate a response from Gemini AI
 * @param context - System context or course information
 * @param userMessage - User's message
 * @param history - Conversation history (optional)
 * @returns AI-generated response
 */
export async function generateGeminiResponse(
  context: string,
  userMessage: string,
  history: ConversationMessage[] = []
): Promise<string> {
  // Validate API key
  if (!API_KEY) {
    throw new Error('❌ Clé API Gemini manquante. Vérifiez votre fichier .env')
  }

  // Apply rate limiting
  return withRateLimit(geminiRateLimiter, 'gemini_api', async () => {
    try {
    // Build conversation history for Gemini format
    const contents = [
      // Add conversation history
      ...history.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      // Add current message with context
      {
        role: 'user' as const,
        parts: [{ text: `${context}\n\n${userMessage}` }],
      },
    ]

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
          ],
        }),
      }
    )

    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      if (response.status === 429) {
        throw new Error('⚠️ Limite de requêtes atteinte. Réessayez dans quelques secondes.')
      }
      
      if (response.status === 403) {
        throw new Error('❌ Clé API invalide ou expirée. Vérifiez votre configuration.')
      }
      
      throw new Error(
        `❌ Erreur API Gemini (${response.status}): ${errorData.error?.message || 'Erreur inconnue'}`
      )
    }

    // Parse response
    const data: GeminiResponse = await response.json()

    // Extract text from response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      throw new Error('❌ Réponse vide de Gemini. Réessayez.')
    }

    return generatedText
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('❌ Erreur de connexion. Vérifiez votre connexion internet.')
    }

    // Re-throw known errors
    if (error instanceof Error) {
      throw error
    }

    // Unknown error
    throw new Error('❌ Erreur inattendue lors de la communication avec Gemini.')
    }
  })
}

/**
 * Test the Gemini API connection
 * @returns true if connection successful, false otherwise
 */
export async function testGeminiConnection(): Promise<boolean> {
  try {
    await generateGeminiResponse('Test de connexion', 'Réponds simplement "OK"')
    return true
  } catch {
    return false
  }
}

/**
 * Get current model information
 */
export function getModelInfo() {
  return {
    model: MODEL,
    apiKeyConfigured: !!API_KEY,
    isExperimental: MODEL.includes('exp') || MODEL.includes('experimental'),
  }
}

/**
 * Generate a STREAMING response from Gemini AI
 * @param context - System context or course information
 * @param userMessage - User's message
 * @param history - Conversation history (optional)
 * @param onChunk - Callback called for each text chunk received
 * @returns Full AI-generated response
 */
export async function generateGeminiStreamingResponse(
  context: string,
  userMessage: string,
  history: ConversationMessage[] = [],
  onChunk: (chunk: string) => void
): Promise<string> {
  // Validate API key
  if (!API_KEY) {
    throw new Error('❌ Clé API Gemini manquante. Vérifiez votre fichier .env')
  }

  // Apply rate limiting
  return withRateLimit(geminiRateLimiter, 'gemini_api', async () => {
    try {
    // Build conversation history for Gemini format
    const contents = [
      ...history.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user' as const,
        parts: [{ text: `${context}\n\n${userMessage}` }],
      },
    ]

    // Call Gemini STREAMING API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?key=${API_KEY}&alt=sse`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      if (response.status === 429) {
        throw new Error('⚠️ Limite de requêtes atteinte. Réessayez dans quelques secondes.')
      }
      
      if (response.status === 403) {
        throw new Error('❌ Clé API invalide ou expirée. Vérifiez votre configuration.')
      }
      
      throw new Error(
        `❌ Erreur API Gemini (${response.status}): ${errorData.error?.message || 'Erreur inconnue'}`
      )
    }

    // Read the stream
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('❌ Impossible de lire le stream')
    }

    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      
      // Parse SSE data line by line
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim()
          if (jsonStr && jsonStr !== '[DONE]') {
            try {
              const data = JSON.parse(jsonStr)
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text
              if (text) {
                fullText += text
                onChunk(text) // ✅ Call callback IMMEDIATELY with each chunk
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    }

    if (!fullText) {
      throw new Error('❌ Réponse vide de Gemini. Réessayez.')
    }

    return fullText
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('❌ Erreur de connexion. Vérifiez votre connexion internet.')
    }

    if (error instanceof Error) {
      throw error
    }

    throw new Error('❌ Erreur inattendue lors de la communication avec Gemini.')
    }
  })
}

