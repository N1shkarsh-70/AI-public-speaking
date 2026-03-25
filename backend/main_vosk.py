from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from vosk import Model, KaldiRecognizer
import numpy as np
import json
import time

app = FastAPI()

# 1. Load the Vosk Streaming Model
print("Loading Vosk Acoustic Model...")
model = Model("model") # Ensure the extracted folder is named 'model' in your directory
print("Model loaded successfully.")

# Target Filler Words
FILLER_WORDS = {"um", "uh", "like", "basically", "literally"}

@app.websocket("/ws/audio")
async def audio_stream_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Frontend connected to RAW PCM continuous stream.")
    
    # Initialize the recognizer for 16kHz audio
    recognizer = KaldiRecognizer(model, 16000)
    
    # --- State Variables for Speech Analysis ---
    session_start_time = time.time()
    total_words_spoken = 0
    last_speech_time = time.time()
    
    try:
        while True:
            # 1. Frame Chunking: Receive continuous float32 frames from React
            data = await websocket.receive_bytes()
            float32_array = np.frombuffer(data, dtype=np.float32)
            
            # 2. Feature Extraction Prep: Vosk requires Int16 PCM, not Float32
            int16_array = (float32_array * 32767).astype(np.int16)
            
            # 3. Speech Analysis: Feed the 20ms frames directly into the acoustic model
            if recognizer.AcceptWaveform(int16_array.tobytes()):
                # --- FINAL RESULT (Triggered when the user pauses/takes a breath) ---
                result = json.loads(recognizer.Result())
                text = result.get("text", "")
                
                if text:
                    print(f"[Final Sentence]: {text}")
                    
                    # Logic Hook: Pause Detection
                    # If the time since the last final result is > 3 seconds, flag a long pause
                    current_time = time.time()
                    pause_duration = current_time - last_speech_time
                    if pause_duration > 3.0:
                         print(f"--> [Warning] Long pause detected: {pause_duration:.1f}s")
                    
                    last_speech_time = current_time
            else:
                # --- PARTIAL RESULT (Triggered word-by-word in real-time) ---
                partial = json.loads(recognizer.PartialResult())
                partial_text = partial.get("partial", "")
                
                if partial_text:
                    words = partial_text.split()
                    latest_word = words[-1] if words else ""
                    
                    # Logic Hook: Filler Word Detection
                    if latest_word in FILLER_WORDS:
                        print(f"--> [Feedback] Filler word caught: '{latest_word}'")
                        await websocket.send_json({
                            "type": "feedback", 
                            "warning": "filler", 
                            "text": f"Try replacing '{latest_word}' with a pause."
                        })
                    
                    # Logic Hook: WPM / Speaking Speed
                    # (You can calculate total words / session duration here)
                    
    except WebSocketDisconnect:
        print("Frontend disconnected.")
    except Exception as e:
        print(f"Pipeline error: {e}")