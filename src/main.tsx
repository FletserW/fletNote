import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { installConsoleHygiene, bootLog } from './services/systemLog'

installConsoleHygiene()

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
    bootLog('Service worker registrado.')
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    
  </React.StrictMode>
)
