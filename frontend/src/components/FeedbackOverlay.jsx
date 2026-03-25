import { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'

// Map feedback type → border color classes
const BORDER_STYLES = {
  posture:  'border-yellow-400/70 shadow-[inset_0_0_40px_rgba(250,204,21,0.15)]',
  pacing:   'border-blue-400/70   shadow-[inset_0_0_40px_rgba(96,165,250,0.15)]',
  filler:   'border-purple-400/70 shadow-[inset_0_0_40px_rgba(192,132,252,0.15)]',
  warning:  'border-orange-400/70 shadow-[inset_0_0_40px_rgba(251,146,60,0.15)]',
  info:     'border-emerald-400/70 shadow-[inset_0_0_40px_rgba(52,211,153,0.15)]',
}

// Map feedback type → badge color
const BADGE_COLORS = {
  posture: 'bg-yellow-400/20 text-yellow-300  border-yellow-400/40',
  pacing:  'bg-blue-400/20   text-blue-300    border-blue-400/40',
  filler:  'bg-purple-400/20 text-purple-300  border-purple-400/40',
  warning: 'bg-orange-400/20 text-orange-300  border-orange-400/40',
  info:    'bg-emerald-400/20 text-emerald-300 border-emerald-400/40',
}

const TYPE_LABELS = {
  posture: '🧍 Posture',
  pacing:  '⏱ Pacing',
  filler:  '💬 Filler Word',
  warning: '⚠️ Warning',
  info:    'ℹ️ Tip',
}

export default function FeedbackOverlay() {
  const { state } = useAppContext()
  const { currentFeedback, activeFlags, sessionStatus } = state

  // Track subtitle visibility state for fade-in / fade-out
  const [visible, setVisible] = useState(false)
  const [displayed, setDisplayed] = useState(null) // what's actually rendered

  useEffect(() => {
    if (currentFeedback) {
      setDisplayed(currentFeedback)
      // Tiny delay lets React paint the element before triggering the enter anim
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
      // Keep displayed text around long enough for the fade-out to finish
      const t = setTimeout(() => setDisplayed(null), 600)
      return () => clearTimeout(t)
    }
  }, [currentFeedback])

  // Determine active border style
  const borderStyle = (() => {
    if (activeFlags.showPostureWarning) return BORDER_STYLES.posture
    if (activeFlags.showPacingWarning)  return BORDER_STYLES.pacing
    if (activeFlags.showFillerAlert)    return BORDER_STYLES.filler
    if (displayed?.type)                return BORDER_STYLES[displayed.type] ?? ''
    return 'border-transparent'
  })()

  const hasBorder = activeFlags.showPostureWarning ||
                    activeFlags.showPacingWarning  ||
                    activeFlags.showFillerAlert     ||
                    !!displayed

  if (sessionStatus === 'idle') return null

  return (
    /* Absolutely positioned overlay matching the parent bounds */
    <div className="absolute inset-0 pointer-events-none select-none rounded-2xl overflow-hidden">

      {/* ── Peripheral border ─────────────────────────────────────────── */}
      <div
        className={[
          'absolute inset-0 rounded-2xl border-4 feedback-border',
          hasBorder ? borderStyle : 'border-transparent',
          hasBorder ? 'border-pulse' : '',
        ].join(' ')}
      />

      {/* ── Subtitle bar ──────────────────────────────────────────────── */}
      {displayed && (
        <div
          className={[
            'absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg',
            'flex flex-col items-center gap-2',
            visible ? 'subtitle-enter' : 'subtitle-exit',
          ].join(' ')}
        >
          {/* Type badge */}
          <span
            className={[
              'text-xs font-semibold px-3 py-0.5 rounded-full border',
              BADGE_COLORS[displayed.type] ?? BADGE_COLORS.info,
            ].join(' ')}
          >
            {TYPE_LABELS[displayed.type] ?? 'Feedback'}
          </span>

          {/* Main subtitle text */}
          <div className="px-5 py-2.5 rounded-xl bg-black/70 backdrop-blur-md text-center">
            <p className="text-white text-sm font-medium leading-snug tracking-wide">
              {displayed.text}
            </p>
          </div>
        </div>
      )}

      {/* ── "Recording" pulse indicator ───────────────────────────────── */}
      {sessionStatus === 'active' && (
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 border-pulse" />
          <span className="text-white/70 text-xs font-medium tracking-widest uppercase">
            Live
          </span>
        </div>
      )}
    </div>
  )
}
