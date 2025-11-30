import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { useStore } from './store/useStore'

// Expose store globally for debugging
if (typeof window !== 'undefined') {
  (window as any).useStore = useStore
  console.log('🔍 Debug: useStore exposed globally. Try: useStore.getState()')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
