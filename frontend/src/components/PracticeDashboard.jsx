import { useAppContext } from '../context/AppContext'
import VideoCanvas from './VideoCanvas'
import FeedbackOverlay from './FeedbackOverlay'
import ControlPanel from './ControlPanel'

/**
 * PracticeDashboard
 *
 * The parent container. Manages layout and passes the media stream down.
 * Component hierarchy:
 *   PracticeDashboard
 *     └── Header
 *     └── VideoCanvas  ← live camera feed
 *         └── FeedbackOverlay  ← absolute positioned on top of video
 *     └── ControlPanel  ← start/stop + status
 *     └── StatusBar
 */
export default function PracticeDashboard() {
  const { state } = useAppContext()
  const { mediaStream, sessionStatus, currentFeedback } = state

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0d1a] via-[#111128] to-[#0a0a18] flex flex-col items-center px-4 py-6 gap-6 font-sans">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="w-full max-w-4xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none tracking-tight">SpeakAI</h1>
            <p className="text-white/40 text-xs">AI Public Speaking Coach</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <span className={`w-2 h-2 rounded-full ${sessionStatus === 'active' ? 'bg-green-400' : 'bg-white/20'}`} />
          <span className="text-white/50 text-xs capitalize tracking-wide">{sessionStatus}</span>
        </div>
      </header>

      {/* ── Main video area ─────────────────────────────────────────────── */}
      <main className="w-full max-w-4xl flex-1 relative">
        {/* Glow ring behind the video */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent blur-xl" />

        {/* Video + overlay wrapper */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
          <VideoCanvas stream={mediaStream} />
          <FeedbackOverlay />
        </div>
      </main>

      {/* ── Control panel ───────────────────────────────────────────────── */}
      <div className="w-full max-w-4xl">
        <ControlPanel />
      </div>

      {/* ── Status / tip bar ────────────────────────────────────────────── */}
      <div className="w-full max-w-4xl px-1">
        {sessionStatus === 'idle' && (
          <p className="text-center text-white/25 text-xs tracking-wide">
            Click <span className="text-indigo-400 font-medium">Start Practice</span> to begin. You will be asked for camera & microphone permission.
          </p>
        )}
        {sessionStatus === 'active' && currentFeedback && (
          <p className="text-center text-white/30 text-xs tracking-wide">
            Simulated AI feedback active · Real AI will replace this in Phase 2
          </p>
        )}
      </div>

      {/* ── Decorative background blobs ─────────────────────────────────── */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-[100px]" />
      </div>
    </div>
  )
}
