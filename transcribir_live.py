#!/usr/bin/env python3
"""Transcribe a short LIVE audio window with faster-whisper."""
import json
import os
import sys
import wave
import numpy as np
from faster_whisper import WhisperModel

def main():
    if len(sys.argv) != 2:
        raise SystemExit("Uso: python transcribir_live.py <audio.wav>")
    wav_path = sys.argv[1]
    with wave.open(wav_path, "rb") as audio:
        channels = audio.getnchannels()
        rate = audio.getframerate()
        frames = audio.getnframes()
        raw = audio.readframes(frames)
    samples = np.frombuffer(raw, dtype=np.int16)
    if channels > 1:
        samples = samples.reshape(-1, channels).mean(axis=1).astype(np.int16)
    duration = len(samples) / float(rate or 1)
    if duration < 8:
        raise RuntimeError("Ventana de audio demasiado corta para transcribir.")
    model_name = os.getenv("CLIPRD_WHISPER_MODEL", "small")
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segments, info = model.transcribe(
        wav_path, language="es", beam_size=3, vad_filter=True,
        condition_on_previous_text=False
    )
    parts = []
    for segment in segments:
        text = (segment.text or "").strip()
        if text:
            parts.append({"start": round(segment.start, 2), "end": round(segment.end, 2), "text": text})
    print(json.dumps({
        "language": info.language,
        "duration": round(duration, 2),
        "text": " ".join(item["text"] for item in parts),
        "segments": parts
    }, ensure_ascii=False))

if __name__ == "__main__":
    main()
