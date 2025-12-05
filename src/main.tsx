import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerServiceWorker } from './utils/serviceWorker'

// Register Service Worker for offline support
registerServiceWorker({
  onSuccess: () => {
    console.log('✅ IKU is ready for offline use')
  },
  onUpdate: () => {
    console.log('🔄 New version available! Refresh to update.')
  },
  onOffline: () => {
    console.log('📴 You are offline. IKU will continue to work.')
  },
  onOnline: () => {
    console.log('🌐 Back online!')
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
