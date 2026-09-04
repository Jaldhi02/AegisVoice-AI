#!/usr/bin/env python3
"""
generate_sample_data.py
Generates sample synthetic/cloned and genuine audio waveform (.wav) files
for testing and training the Voice Fraud Detection pipeline.
Uses standard Python library (wave, struct, math, random) for zero-dependency execution.
"""

import os
import math
import wave
import struct
import random

SAMPLE_RATE = 16000  # 16 kHz canonical sample rate
DURATION_SEC = 3.0   # 3 seconds sample
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))


def generate_genuine_voice(filename: str, f0_base: float = 140.0):
    """
    Simulates a natural human voice with micro-pitch modulations (prosody),
    natural formants (F1, F2, F3), and smooth breathy envelope.
    """
    filepath = os.path.join(OUTPUT_DIR, filename)
    num_samples = int(SAMPLE_RATE * DURATION_SEC)
    samples = []

    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Natural pitch variation (prosody / vibrato / sentence cadence)
        f0 = f0_base + 12.0 * math.sin(2 * math.pi * 1.5 * t) + 3.0 * math.sin(2 * math.pi * 5.0 * t)
        
        # Vocal tract formants
        # Fundamental
        s = 0.5 * math.sin(2 * math.pi * f0 * t)
        # 1st formant (~500 Hz)
        s += 0.3 * math.sin(2 * math.pi * 500.0 * t)
        # 2nd formant (~1500 Hz)
        s += 0.2 * math.sin(2 * math.pi * 1500.0 * t)
        # 3rd formant (~2500 Hz)
        s += 0.1 * math.sin(2 * math.pi * 2500.0 * t)
        
        # Natural slight aspiration noise
        noise = (random.random() - 0.5) * 0.02
        s += noise

        # Amplitude envelope (natural fading in/out)
        env = math.sin(math.pi * t / DURATION_SEC) ** 0.8
        sample_val = s * env * 0.7

        # Convert to 16-bit PCM integer
        pcm_val = int(max(-32767, min(32767, sample_val * 32767)))
        samples.append(pcm_val)

    with wave.open(filepath, 'w') as wav_file:
        wav_file.setnchannels(1)       # Mono
        wav_file.setsampwidth(2)       # 16-bit
        wav_file.setframerate(SAMPLE_RATE)
        data = struct.pack(f'<{len(samples)}h', *samples)
        wav_file.writeframes(data)

    print(f"[+] Created genuine voice sample: {filepath}")
    return filepath


def generate_cloned_voice(filename: str, f0_base: float = 140.0):
    """
    Simulates a synthetic / deepfake / cloned voice with characteristic
    vocoder artifacts: robotic pitch rigidity, metallic harmonics,
    phase discontinuities, and unnatural spectral peaks.
    """
    filepath = os.path.join(OUTPUT_DIR, filename)
    num_samples = int(SAMPLE_RATE * DURATION_SEC)
    samples = []

    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Synthetic flat pitch (typical of lower-tier TTS / vocoders) with abrupt micro-steps
        step = int(t * 10)
        f0 = f0_base + (2.0 if step % 2 == 0 else -2.0)
        
        # Vocoder-like pulse train / metallic high-frequency harmonics
        s = 0.4 * math.sin(2 * math.pi * f0 * t)
        # Strong unnatural harmonic overtones
        for harmonic in range(2, 9):
            s += (0.25 / harmonic) * math.sin(2 * math.pi * (f0 * harmonic) * t)
        
        # Vocoder buzz artifact at 3200 Hz
        s += 0.15 * math.sin(2 * math.pi * 3200.0 * t)

        # Abrupt unnatural envelope
        env = 0.9 if 0.1 < t < (DURATION_SEC - 0.1) else 0.2
        sample_val = s * env * 0.65

        pcm_val = int(max(-32767, min(32767, sample_val * 32767)))
        samples.append(pcm_val)

    with wave.open(filepath, 'w') as wav_file:
        wav_file.setnchannels(1)       # Mono
        wav_file.setsampwidth(2)       # 16-bit
        wav_file.setframerate(SAMPLE_RATE)
        data = struct.pack(f'<{len(samples)}h', *samples)
        wav_file.writeframes(data)

    print(f"[+] Created cloned/synthetic voice sample: {filepath}")
    return filepath


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("Generating synthetic benchmark audio samples...")
    generate_genuine_voice("genuine_sample_1.wav", f0_base=130.0)
    generate_genuine_voice("genuine_sample_2.wav", f0_base=210.0)
    generate_cloned_voice("cloned_sample_1.wav", f0_base=130.0)
    generate_cloned_voice("cloned_sample_2.wav", f0_base=210.0)
    print("Sample audio dataset successfully generated!")


if __name__ == "__main__":
    main()
