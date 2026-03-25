import { useEffect, useRef } from 'react'

/**
 * VideoCanvas
 * Renders the live webcam feed via an HTML <video> element.
 * Receives the raw MediaStream via prop (not a ref) – we assign it
 * to video.srcObject inside a useEffect so React stays in control.
 */
export default function VideoCanvas({ stream }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (stream) {
      video.srcObject = stream
      video.play().catch(() => {/* autoplay policy – silently ignore */})
    } else {
      video.srcObject = null
    }
  }, [stream])

  return (
    <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden">
      {/* Live camera feed */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Placeholder shown before camera starts */}
      {!stream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.893L15 14M4 8a2 2 0 012-2h9a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <p className="text-white/40 text-sm font-medium tracking-wide">
            Camera preview will appear here
          </p>
        </div>
      )}
    </div>
  )
}
