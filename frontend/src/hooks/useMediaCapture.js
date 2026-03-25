import { useEffect, useRef, useCallback } from 'react'
import { useAppContext } from '../context/AppContext'

export function useMediaCapture() {
  const { dispatch } = useAppContext()

  const videoTrackRef = useRef(null)
  const audioTrackRef = useRef(null)
  const streamRef     = useRef(null)

  const socketRef = useRef(null)
  // New refs for the raw audio pipeline
  const audioContextRef = useRef(null)
  const processorRef = useRef(null)

  const startCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true },
      })

      const [videoTrack] = stream.getVideoTracks()
      const [audioTrack] = stream.getAudioTracks()
      videoTrackRef.current = videoTrack
      audioTrackRef.current = audioTrack
      streamRef.current     = stream

      dispatch({ type: 'SET_STREAM', payload: stream })

      socketRef.current = new WebSocket('ws://localhost:8000/ws/audio')

      socketRef.current.onopen = () => {
        console.log("[useMediaCapture] WebSocket connected. Starting RAW PCM stream...")
        
        // 1. Create an Audio Context strictly at 16kHz (Whisper's required rate)
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 16000
        });

        // 2. Create the source from our isolated microphone track
        const source = audioContextRef.current.createMediaStreamSource(new MediaStream([audioTrackRef.current]));
        
        // 3. Create a processor that grabs chunks of 4096 samples at a time
        processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

        source.connect(processorRef.current);
        processorRef.current.connect(audioContextRef.current.destination);

        // 4. This fires continuously, sending pure mathematical frames to Python
        processorRef.current.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0); // This is a Float32Array
          
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            // Send the raw binary buffer directly
            socketRef.current.send(inputData.buffer);
          }
        };
      }

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'transcription') {
          console.log(`[Whisper]: ${data.text}`)
        }
      }

      return stream
    } catch (err) {
      console.error('[useMediaCapture] getUserMedia failed:', err)
      throw err
    }
  }, [dispatch])

  const stopCapture = useCallback(() => {
    // Graceful teardown of the audio nodes
    if (processorRef.current && audioContextRef.current) {
      processorRef.current.disconnect();
      audioContextRef.current.close();
    }
    if (socketRef.current) {
      socketRef.current.close()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current     = null
      videoTrackRef.current = null
      audioTrackRef.current = null
    }
    dispatch({ type: 'SET_STREAM', payload: null })
  }, [dispatch])

  useEffect(() => {
    return () => {
      if (processorRef.current && audioContextRef.current) {
        processorRef.current.disconnect();
      }
      if (socketRef.current) socketRef.current.close()
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
    }
  }, [])

  return {
    startCapture,
    stopCapture,
    videoTrackRef,
    audioTrackRef,
  }
}