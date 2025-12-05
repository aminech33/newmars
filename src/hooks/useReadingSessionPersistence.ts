import { useEffect } from 'react'

interface SessionData {
  bookId: string
  startTime: number
}

const SESSION_KEY = 'reading-session-active'

/**
 * Hook pour persister les sessions de lecture actives
 */
export function useReadingSessionPersistence(
  isReadingSession: boolean,
  currentReadingBookId: string | null,
  readingSessionStart: number | null,
  startReadingSession: (bookId: string) => void,
  _endReadingSession: (pagesRead?: number) => void
) {
  // Sauvegarder la session active
  useEffect(() => {
    if (isReadingSession && currentReadingBookId && readingSessionStart) {
      const sessionData: SessionData = {
        bookId: currentReadingBookId,
        startTime: readingSessionStart
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData))
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  }, [isReadingSession, currentReadingBookId, readingSessionStart])

  // Restaurer la session au chargement
  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_KEY)
    if (savedSession && !isReadingSession) {
      try {
        const sessionData: SessionData = JSON.parse(savedSession)
        const now = Date.now()
        const elapsed = now - sessionData.startTime
        
        // Si la session a moins de 6 heures, la restaurer
        if (elapsed < 6 * 60 * 60 * 1000) {
          startReadingSession(sessionData.bookId)
        } else {
          // Session trop ancienne, la supprimer
          localStorage.removeItem(SESSION_KEY)
        }
      } catch {
        localStorage.removeItem(SESSION_KEY)
      }
    }
  }, []) // Seulement au montage

  // Nettoyer avant fermeture de la page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isReadingSession) {
        e.preventDefault()
        e.returnValue = 'Vous avez une session de lecture en cours. Voulez-vous vraiment quitter ?'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isReadingSession])
}

