import { createContext, useContext, useReducer } from 'react'

// ─── Initial State ────────────────────────────────────────────────────────────
const initialState = {
  // Raw MediaStream from getUserMedia
  mediaStream: null,

  // 'idle' | 'active' | 'analyzing'
  sessionStatus: 'idle',

  // { text: string, type: 'info'|'warning'|'pacing'|'posture'|'filler' }
  currentFeedback: null,

  // Visual flag toggles (bind to border colors, icons, etc.)
  activeFlags: {
    showPostureWarning: false,
    showPacingWarning: false,
    showFillerAlert: false,
  },
}

// ─── Reducer ─────────────────────────────────────────────────────────────────
function appReducer(state, action) {
  switch (action.type) {
    case 'SET_STREAM':
      return { ...state, mediaStream: action.payload }

    case 'SET_SESSION_STATUS':
      return { ...state, sessionStatus: action.payload }

    case 'SET_FEEDBACK':
      return { ...state, currentFeedback: action.payload }

    case 'CLEAR_FEEDBACK':
      return { ...state, currentFeedback: null }

    case 'SET_FLAGS':
      return {
        ...state,
        activeFlags: { ...state.activeFlags, ...action.payload },
      }

    case 'RESET_FLAGS':
      return {
        ...state,
        activeFlags: initialState.activeFlags,
      }

    default:
      return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used inside <AppProvider>')
  return ctx
}
