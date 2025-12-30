/**
 * Secure storage for sensitive data (API tokens, credentials)
 * Uses encryption for localStorage
 */

import { encrypt, decrypt, encryptedSetItem, encryptedGetItem, encryptedRemoveItem } from './encryption'

// Clés de stockage pour données sensibles
const SECURE_KEYS = {
  WITHINGS_TOKENS: 'withings_tokens_secure',
  GEMINI_HISTORY: 'gemini_history_secure', // Optionnel: chiffrer l'historique des conversations
} as const

/**
 * Sauvegarde les tokens Withings de manière sécurisée
 */
export function saveWithingsTokens(tokens: {
  access_token: string
  refresh_token: string
  expires_at: number
  user_id: string
}): void {
  encryptedSetItem(SECURE_KEYS.WITHINGS_TOKENS, tokens)
  console.log('✅ Tokens Withings sauvegardés (chiffrés)')
}

/**
 * Récupère les tokens Withings
 */
export function getWithingsTokens(): {
  access_token: string
  refresh_token: string
  expires_at: number
  user_id: string
} | null {
  return encryptedGetItem(SECURE_KEYS.WITHINGS_TOKENS)
}

/**
 * Supprime les tokens Withings
 */
export function clearWithingsTokens(): void {
  encryptedRemoveItem(SECURE_KEYS.WITHINGS_TOKENS)
  console.log('🗑️ Tokens Withings supprimés')
}

/**
 * Vérifie si les tokens Withings sont valides (non expirés)
 */
export function areWithingsTokensValid(): boolean {
  const tokens = getWithingsTokens()
  
  if (!tokens) {
    return false
  }
  
  // Vérifier si le token n'est pas expiré (avec marge de 5 minutes)
  const now = Date.now()
  const expiresAt = tokens.expires_at
  const fiveMinutes = 5 * 60 * 1000
  
  return expiresAt > now + fiveMinutes
}

/**
 * Migration: Convertit les anciens tokens non chiffrés en tokens chiffrés
 */
export function migrateWithingsTokens(): void {
  const OLD_KEY = 'withings_tokens'
  const oldTokens = localStorage.getItem(OLD_KEY)
  
  if (oldTokens) {
    try {
      const parsed = JSON.parse(oldTokens)
      saveWithingsTokens(parsed)
      localStorage.removeItem(OLD_KEY)
      console.log('✅ Migration des tokens Withings terminée (maintenant chiffrés)')
    } catch (error) {
      console.error('❌ Erreur lors de la migration des tokens:', error)
    }
  }
}

/**
 * Sauvegarde sécurisée de l'historique de conversation (optionnel)
 * Utile si les conversations contiennent des données sensibles
 */
export function saveSecureConversationHistory(courseId: string, messages: any[]): void {
  const key = `${SECURE_KEYS.GEMINI_HISTORY}_${courseId}`
  encryptedSetItem(key, messages)
}

/**
 * Récupère l'historique de conversation sécurisé
 */
export function getSecureConversationHistory(courseId: string): any[] | null {
  const key = `${SECURE_KEYS.GEMINI_HISTORY}_${courseId}`
  return encryptedGetItem(key)
}

/**
 * Nettoie toutes les données sensibles (déconnexion complète)
 */
export function clearAllSecureData(): void {
  clearWithingsTokens()
  
  // Nettoyer tous les historiques de conversation
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(SECURE_KEYS.GEMINI_HISTORY)) {
      encryptedRemoveItem(key)
    }
  })
  
  console.log('🗑️ Toutes les données sensibles ont été supprimées')
}


