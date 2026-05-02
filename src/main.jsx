import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Capacitor } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'

import ErrorBoundary from './components/ErrorBoundary.jsx'

// Notify Capgo that the app is ready to prevent rollback
if (Capacitor.isNativePlatform()) {
  CapacitorUpdater.notifyAppReady()
}

// Register SW is handled by vite-plugin-pwa virtual import in ReloadPrompt usually, 
// but we just need to stop actively killing it here.

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
