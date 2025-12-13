// Service Worker Registration Utility

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void
  onUpdate?: (registration: ServiceWorkerRegistration) => void
  onOffline?: () => void
  onOnline?: () => void
}

export function registerServiceWorker(config: ServiceWorkerConfig = {}) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[App] Service Worker registered:', registration.scope)

          // Check for updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing
            if (!installingWorker) return

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content available
                  console.log('[App] New content available, refresh to update')
                  config.onUpdate?.(registration)
                } else {
                  // Content cached for offline use
                  console.log('[App] Content cached for offline use')
                  config.onSuccess?.(registration)
                }
              }
            }
          }
        })
        .catch((error) => {
          console.error('[App] Service Worker registration failed:', error)
        })
    })

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('[App] Back online')
      config.onOnline?.()
    })

    window.addEventListener('offline', () => {
      console.log('[App] Offline mode')
      config.onOffline?.()
    })
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister()
        console.log('[App] Service Worker unregistered')
      })
      .catch((error) => {
        console.error('[App] Service Worker unregistration failed:', error)
      })
  }
}

export function isOnline(): boolean {
  return navigator.onLine
}

export function clearServiceWorkerCache() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' })
  }
}

export function skipWaiting() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
  }
}





