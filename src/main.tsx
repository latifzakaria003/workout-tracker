import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ExerciseProvider } from './contexts/exerciseProvider.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ExerciseProvider>
      <App />
    </ExerciseProvider>
  </StrictMode>,
)
