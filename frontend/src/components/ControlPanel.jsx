import { useCallback, useEffect, useRef } from 'react'
import { useAppContext } from '../context/AppContext'
import { useMediaCapture } from '../hooks/useMediaCapture'

// ─── Mock Feedback Pool ───────────────────────────────────────────────────────
const MOCK_EVENTS = [
  { text: 'Try slowing down slightly — your audience needs time to absorb that point.', type: 'pacing' },
  { text: 'You said "um" three times in the last 30 seconds. Try pausing instead.', type: 'filler' },
  { text: 'Great energy! Maintain that eye contact with the camera.', type: 'info' },
  { text: 'Check your posture — try sitting or standing a little taller.', type: 'posture' },
  { text: 'Good pacing on that last point. Keep it up!', type: 'info' },
  { text: 'Your voice is trailing off at the end of sentences. Project a bit more.', type: 'warning' },
  { text: 'Excellent use of a pause there — very effective for emphasis.', type: 'info' },
  { text: 'You\'re speaking a bit fast. Take a breath between your main points.', type: 'pacing' },
]

// Map feedback type → flag to set
const TYPE_TO_FLAG = {
  posture: 'showPostureWarning',
  pacing:  'showPacingWarning',
  filler:  'showFillerAlert',
}

export default function ControlPanel() {
  const { state, dispatch } = useAppContext()
  const { startCapture, stopCapture } = useMediaCapture()
  const intervalRef = useRef(null)
  const feedbackTimerRef = useRef(null)

  const { sessionStatus } = state
  const isActive = sessionStatus === 'active'
  const isIdle   = sessionStatus === 'idle'

  // ── Dispatch a single mock feedback event ─────────────────────────────────
  const fireMockEvent = useCallback(() => {
    const event = MOCK_EVENTS[Math.floor(Math.random() * MOCK_EVENTS.length)]

    // Set feedback text → triggers subtitle
    dispatch({ type: 'SET_FEEDBACK', payload: event })

    // Set border flag if applicable
    const flag = TYPE_TO_FLAG[event.type]
    if (flag) {
      dispatch({ type: 'SET_FLAGS', payload: { [flag]: true } })
    }

    // Clear feedback + flags after 3 s of reading time
    clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => {
      dispatch({ type: 'CLEAR_FEEDBACK' })
      dispatch({ type: 'RESET_FLAGS' })
    }, 3000)
  }, [dispatch])

  // ── Start session ─────────────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    try {
      await startCapture()
      dispatch({ type: 'SET_SESSION_STATUS', payload: 'active' })
      // Fire first event after a short warm-up, then every 4 s
      setTimeout(fireMockEvent, 1500)
      intervalRef.current = setInterval(fireMockEvent, 4000)
    } catch {
      alert('Could not access camera/microphone. Please allow permissions and try again.')
    }
  }, [startCapture, dispatch, fireMockEvent])

  // ── Stop session ──────────────────────────────────────────────────────────
  const handleStop = useCallback(() => {
    clearInterval(intervalRef.current)
    clearTimeout(feedbackTimerRef.current)
    intervalRef.current    = null
    feedbackTimerRef.current = null

    stopCapture()
    dispatch({ type: 'SET_SESSION_STATUS', payload: 'idle' })
    dispatch({ type: 'CLEAR_FEEDBACK' })
    dispatch({ type: 'RESET_FLAGS' })
  }, [stopCapture, dispatch])

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current)
      clearTimeout(feedbackTimerRef.current)
    }
  }, [])

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
      {/* Left: status badge */}
      <div className="flex items-center gap-3">
        <span
          className={[
            'w-2.5 h-2.5 rounded-full transition-colors duration-500',
            isActive ? 'bg-red-500 border-pulse' : 'bg-white/20',
          ].join(' ')}
        />
        <span className="text-sm font-medium text-white/60 tracking-wide">
          {isActive ? 'Session Active' : 'Ready to Practice'}
        </span>
      </div>

      {/* Center: main action button */}
      <div className="flex gap-3">
        {isIdle ? (
          <button
            id="start-session-btn"
            onClick={handleStart}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 active:scale-95 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-500/30"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Start Practice
          </button>
        ) : (
          <button
            id="stop-session-btn"
            onClick={handleStop}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 active:scale-95 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-red-500/20"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
            Stop Session
          </button>
        )}
      </div>

      {/* Right: toggle settings */}
      <div className="flex items-center gap-4 text-xs text-white/40">
        <span className="hidden sm:inline">Simulated Feedback</span>
        <div className="flex gap-1.5">
          {['Posture', 'Pacing', 'Filler'].map(label => (
            <span key={label} className="px-2 py-1 rounded-md bg-white/5 border border-white/10">
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
