/**
 * Monitoring et analytics
 * Sentry pour tracking d'erreurs + Web Vitals pour performance
 */

import * as Sentry from '@sentry/react'
import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals'

// ═══════════════════════════════════════════════════════════════
// SENTRY CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || ''
const ENVIRONMENT = import.meta.env.VITE_ENV || import.meta.env.MODE || 'development'
const ENABLE_SENTRY = import.meta.env.VITE_ENABLE_SENTRY === 'true' // Désactivé par défaut

/**
 * Initialise Sentry pour le tracking d'erreurs
 */
export function initSentry() {
  if (!ENABLE_SENTRY) {
    console.log('📊 Sentry désactivé (VITE_ENABLE_SENTRY non défini ou false)')
    return
  }

  if (!SENTRY_DSN) {
    console.warn('⚠️ Sentry DSN manquant. Ajoutez VITE_SENTRY_DSN dans .env')
    console.log('📊 Sentry désactivé')
    return
  }

  try {

    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENVIRONMENT,
      
      // Sample rate (production)
      tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
      
      // Replay sessions (optionnel, pour debug)
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      
      // Intégrations
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
    
    // Filtrer les données sensibles
    beforeSend(event) {
      // Anonymiser les données utilisateur
      if (event.user) {
        delete event.user.email
        delete event.user.ip_address
      }
      
      // Filtrer les erreurs de développement
      if (ENVIRONMENT === 'development' && event.exception) {
        const errorMessage = event.exception.values?.[0]?.value || ''
        
        // Ignorer certaines erreurs en dev
        if (
          errorMessage.includes('ResizeObserver') ||
          errorMessage.includes('ChunkLoadError')
        ) {
          return null
        }
      }
      
      return event
    },
    
    // Ignorer certaines erreurs
    ignoreErrors: [
      // Erreurs réseau (hors de notre contrôle)
      'NetworkError',
      'Failed to fetch',
      'Network request failed',
      
      // Erreurs navigateur
      'ResizeObserver loop',
      'Non-Error promise rejection',
      
      // Extensions navigateur
      'chrome-extension://',
      'moz-extension://',
    ],
    })

    console.log('✅ Sentry initialisé :', ENVIRONMENT)
  } catch (error) {
    console.error('❌ Erreur initialisation Sentry:', error)
    console.log('📊 Sentry désactivé suite à l\'erreur')
  }
}

/**
 * Capture une erreur manuellement
 */
export function captureError(error: Error, context?: Record<string, any>) {
  if (!ENABLE_SENTRY) return
  
  Sentry.captureException(error, {
    extra: context,
  })
}

/**
 * Capture un message (non-erreur)
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!ENABLE_SENTRY) return
  
  Sentry.captureMessage(message, level)
}

/**
 * Ajoute du contexte utilisateur (anonymisé)
 */
export function setUserContext(userId?: string) {
  if (!ENABLE_SENTRY) return
  
  Sentry.setUser(userId ? { id: userId } : null)
}

// ═══════════════════════════════════════════════════════════════
// WEB VITALS MONITORING
// ═══════════════════════════════════════════════════════════════

const ENABLE_WEB_VITALS = import.meta.env.VITE_ENABLE_WEB_VITALS !== 'false'

/**
 * Envoie une métrique Web Vitals à Sentry
 */
function sendToSentry(metric: Metric) {
  if (!ENABLE_SENTRY || !ENABLE_WEB_VITALS) return
  
  // Envoyer à Sentry comme mesure personnalisée
  Sentry.setMeasurement(metric.name, metric.value, metric.unit)
  
  // Log en développement
  if (ENVIRONMENT === 'development') {
    console.log(`📊 ${metric.name}:`, metric.value, metric.unit)
  }
}

/**
 * Initialise le monitoring Web Vitals
 */
export function initWebVitals() {
  if (!ENABLE_WEB_VITALS) {
    console.log('📊 Web Vitals désactivé')
    return
  }

  // Core Web Vitals
  onCLS(sendToSentry)  // Cumulative Layout Shift
  onINP(sendToSentry)  // Interaction to Next Paint
  onLCP(sendToSentry)  // Largest Contentful Paint
  
  // Autres métriques
  onFCP(sendToSentry)  // First Contentful Paint
  onTTFB(sendToSentry) // Time to First Byte
  
  console.log('✅ Web Vitals monitoring actif')
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Wrapper pour capturer les erreurs async
 */
export function withErrorCapture<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Record<string, any>
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      captureError(error as Error, context)
      throw error
    }
  }) as T
}

/**
 * Vérifie si le monitoring est actif
 */
export function isMonitoringEnabled(): boolean {
  return ENABLE_SENTRY && !!SENTRY_DSN
}

/**
 * Statistiques de monitoring
 */
export function getMonitoringStats() {
  return {
    sentryEnabled: ENABLE_SENTRY && !!SENTRY_DSN,
    webVitalsEnabled: ENABLE_WEB_VITALS,
    environment: ENVIRONMENT,
  }
}

