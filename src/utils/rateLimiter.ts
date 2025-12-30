/**
 * Rate limiter for API calls
 * Prevents excessive requests and quota exhaustion
 */

interface RateLimitConfig {
  maxRequests: number  // Nombre max de requêtes
  windowMs: number     // Fenêtre de temps (ms)
}

interface RequestRecord {
  timestamps: number[]
}

class RateLimiter {
  private records: Map<string, RequestRecord> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  /**
   * Vérifie si une requête est autorisée
   * @param key - Identifiant unique (ex: 'gemini_api', 'user_123')
   * @returns true si la requête est autorisée
   */
  canMakeRequest(key: string): boolean {
    const now = Date.now()
    const record = this.records.get(key) || { timestamps: [] }

    // Nettoyer les timestamps hors de la fenêtre
    record.timestamps = record.timestamps.filter(
      timestamp => now - timestamp < this.config.windowMs
    )

    // Vérifier si on peut faire une nouvelle requête
    if (record.timestamps.length >= this.config.maxRequests) {
      return false
    }

    return true
  }

  /**
   * Enregistre une nouvelle requête
   * @param key - Identifiant unique
   */
  recordRequest(key: string): void {
    const now = Date.now()
    const record = this.records.get(key) || { timestamps: [] }

    record.timestamps.push(now)
    this.records.set(key, record)
  }

  /**
   * Calcule le temps d'attente avant la prochaine requête
   * @param key - Identifiant unique
   * @returns Temps d'attente en ms (0 si requête autorisée)
   */
  getWaitTime(key: string): number {
    const now = Date.now()
    const record = this.records.get(key)

    if (!record || record.timestamps.length < this.config.maxRequests) {
      return 0
    }

    // Nettoyer les timestamps hors de la fenêtre
    record.timestamps = record.timestamps.filter(
      timestamp => now - timestamp < this.config.windowMs
    )

    if (record.timestamps.length < this.config.maxRequests) {
      return 0
    }

    // Calculer quand le plus ancien timestamp sortira de la fenêtre
    const oldestTimestamp = record.timestamps[0]
    const waitTime = this.config.windowMs - (now - oldestTimestamp)

    return Math.max(0, waitTime)
  }

  /**
   * Réinitialise le compteur pour une clé
   * @param key - Identifiant unique
   */
  reset(key: string): void {
    this.records.delete(key)
  }

  /**
   * Réinitialise tous les compteurs
   */
  resetAll(): void {
    this.records.clear()
  }
}

// ═══════════════════════════════════════════════════════════════
// INSTANCES PRÉ-CONFIGURÉES
// ═══════════════════════════════════════════════════════════════

/**
 * Rate limiter pour l'API Gemini
 * Limite: 10 requêtes par minute (ajustable selon ton quota)
 */
export const geminiRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
})

/**
 * Rate limiter pour l'API Withings
 * Limite: 120 requêtes par minute (limite officielle Withings)
 */
export const withingsRateLimiter = new RateLimiter({
  maxRequests: 120,
  windowMs: 60 * 1000, // 1 minute
})

/**
 * Rate limiter pour les actions utilisateur (anti-spam)
 * Limite: 30 actions par minute
 */
export const userActionRateLimiter = new RateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
})

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Wrapper pour exécuter une fonction avec rate limiting
 * @param limiter - Instance du rate limiter
 * @param key - Identifiant unique
 * @param fn - Fonction à exécuter
 * @returns Résultat de la fonction
 * @throws Error si rate limit atteint
 */
export async function withRateLimit<T>(
  limiter: RateLimiter,
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!limiter.canMakeRequest(key)) {
    const waitTime = limiter.getWaitTime(key)
    const waitSeconds = Math.ceil(waitTime / 1000)
    
    throw new Error(
      `⚠️ Limite de requêtes atteinte. Réessayez dans ${waitSeconds} seconde${waitSeconds > 1 ? 's' : ''}.`
    )
  }

  limiter.recordRequest(key)
  return await fn()
}

/**
 * Wrapper avec retry automatique après le délai
 * @param limiter - Instance du rate limiter
 * @param key - Identifiant unique
 * @param fn - Fonction à exécuter
 * @param maxRetries - Nombre max de tentatives
 * @returns Résultat de la fonction
 */
export async function withRateLimitRetry<T>(
  limiter: RateLimiter,
  key: string,
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let attempts = 0

  while (attempts < maxRetries) {
    if (limiter.canMakeRequest(key)) {
      limiter.recordRequest(key)
      return await fn()
    }

    const waitTime = limiter.getWaitTime(key)
    
    if (attempts === maxRetries - 1) {
      throw new Error(
        `⚠️ Limite de requêtes atteinte après ${maxRetries} tentatives. Réessayez plus tard.`
      )
    }

    console.log(`⏳ Rate limit atteint. Attente de ${Math.ceil(waitTime / 1000)}s...`)
    await new Promise(resolve => setTimeout(resolve, waitTime))
    attempts++
  }

  throw new Error('Rate limit retry failed')
}

/**
 * Debounce avec rate limiting intégré
 * Utile pour les inputs utilisateur
 */
export function createRateLimitedDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number,
  limiter: RateLimiter,
  key: string
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    
    timeoutId = setTimeout(() => {
      if (limiter.canMakeRequest(key)) {
        limiter.recordRequest(key)
        fn(...args)
      } else {
        const waitTime = limiter.getWaitTime(key)
        console.warn(`⚠️ Rate limit atteint. Réessayez dans ${Math.ceil(waitTime / 1000)}s`)
      }
    }, delayMs)
  }
}

export default RateLimiter


