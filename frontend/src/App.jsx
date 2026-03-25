import './index.css'
import { AppProvider } from './context/AppContext'
import PracticeDashboard from './components/PracticeDashboard'

export default function App() {
  return (
    <AppProvider>
      <PracticeDashboard />
    </AppProvider>
  )
}
