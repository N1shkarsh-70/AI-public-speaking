from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from faster_whisper import WhisperModel
import numpy as np
import time

app = FastAPI()

# 1. Load the Whisper Model
print("Loading Whisper Model...")
# You can change "base" to "small" if you want slightly higher accuracy
model = WhisperModel("base", device="cpu", compute_type="int8",cpu_threads=2,num_workers=1)
print("Model loaded successfully.")

# Target Filler Words
FILLER_WORDS = {"um", "uh", "like", "basically", "literally"}

@app.websocket("/ws/audio")
async def audio_stream_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Frontend connected to RAW PCM continuous stream.")
    
    # --- State Variables for Speech Analysis ---
    session_start_time = time.time()
    total_words_spoken = 0
    last_speech_time = time.time()
    
    # Whisper Buffer State
    audio_buffer = np.array([], dtype=np.float32)
    SAMPLE_RATE = 16000
    # Process audio every 5 seconds to give Whisper enough context to form words
    CHUNK_SAMPLES = int(SAMPLE_RATE * 5.0) 
    
    try:
        while True:
            # 1. Frame Chunking: Receive continuous float32 frames from React
            data = await websocket.receive_bytes()
            float32_array = np.frombuffer(data, dtype=np.float32)
            
            # 2. Append the 20ms frame to our buffer
            audio_buffer = np.concatenate((audio_buffer, float32_array))
            
            # 3. Speech Analysis: Feed the chunk into Whisper when buffer is full
            if len(audio_buffer) >= CHUNK_SAMPLES:
                
                # Transcribe the buffered audio
                segments, info = model.transcribe(
                    audio_buffer,
                    beam_size=2,
                    language="en",
                    vad_filter=True, # Built-in VAD prevents hallucinations on silence
                    vad_parameters=dict(min_silence_duration_ms=500)
                )
                
                text = " ".join([seg.text for seg in segments]).strip()
                
                if text:
                    print(f"[Transcribed]: {text}")
                    
                    # Logic Hook: Pause Detection
                    # If the time since the last final result is > 3 seconds, flag a long pause
                    current_time = time.time()
                    pause_duration = current_time - last_speech_time
                    if pause_duration > 3.0:
                         print(f"--> [Warning] Long pause detected: {pause_duration:.1f}s")
                    
                    last_speech_time = current_time
                    
                    # Clean punctuation for word analysis
                    clean_text = text.lower().replace(".", "").replace(",", "").replace("?", "")
                    words = clean_text.split()
                    
                    # Logic Hook: Filler Word Detection
                    for word in words:
                        if word in FILLER_WORDS:
                            print(f"--> [Feedback] Filler word caught: '{word}'")
                            await websocket.send_json({
                                "type": "feedback", 
                                "warning": "filler", 
                                "text": f"Try replacing '{word}' with a pause."
                            })
                    
                    # Logic Hook: WPM / Speaking Speed
                    total_words_spoken += len(words)
                    # (You can calculate total words / session duration here)
                
                # Slide the window: keep the last 0.5 seconds of audio so words aren't cut in half
                overlap = int(SAMPLE_RATE * 0.5)
                audio_buffer = audio_buffer[-overlap:]
                    
    except WebSocketDisconnect:
        print("Frontend disconnected.")
    except Exception as e:
        print(f"Pipeline error: {e}")