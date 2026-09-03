import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ExerciseProvider } from './contexts/exerciseProvider.tsx'
import { SessionProvider } from './contexts/sessionProvider.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ExerciseProvider>
      <SessionProvider>
        <App />
      </SessionProvider>
    </ExerciseProvider>
  </StrictMode>,
)
