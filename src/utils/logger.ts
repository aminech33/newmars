/**
 * Logger conditionnel pour le développement
 * Les logs sont désactivés en production
 */

const isDev = import.meta.env.DEV

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args)
  },
  
  error: (...args: unknown[]) => {
    if (isDev) console.error(...args)
  },
  
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args)
  },
  
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args)
  },
  
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args)
  },
  
  // Pour les erreurs critiques qu'on veut toujours voir
  critical: (...args: unknown[]) => {
    console.error('[CRITICAL]', ...args)
  }
}

export default logger





