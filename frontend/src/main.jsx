import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode removed intentionally: it double-invokes effects in dev,
// which would trigger getUserMedia twice and cause issues with stream refs.
createRoot(document.getElementById('root')).render(<App />)
