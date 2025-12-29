import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initSentry, initWebVitals } from './utils/monitoring'

// Initialiser le monitoring
initSentry()
initWebVitals()

// Service Worker is registered in index.html

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
