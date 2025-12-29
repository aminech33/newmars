import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

console.log('🚀 NewMars starting...')

// Service Worker is registered in index.html

// Initialiser le monitoring de manière asynchrone (ne bloque pas le rendu)
;(async () => {
  try {
    const { initSentry, initWebVitals } = await import('./utils/monitoring')
    initSentry()
    initWebVitals()
  } catch (error) {
    console.warn('⚠️ Monitoring non disponible:', error)
  }
})()

console.log('🎨 Rendering App...')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

console.log('✅ App rendered')
