"""
audio_preprocessing.py
Standardized audio ingestion, resampling, mono conversion,
normalization, silence trimming (VAD), and pre-emphasis filtering.
"""

import os
import wave
import struct
import math
from typing import Tuple, List, Union, Optional

# Optional fast scientific libraries with standard library fallback
try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    np = None
    HAS_NUMPY = False


class AudioPreprocessor:
    """
    Handles end-to-end audio ingestion, cleaning, and normalization
    for voice clone detection.
    """

    def __init__(self, target_sr: int = 16000, pre_emphasis_coeff: float = 0.97):
        self.target_sr = target_sr
        self.pre_emphasis_coeff = pre_emphasis_coeff

    def load_wav(self, file_path: str, max_duration_sec: Optional[float] = None, offset_sec: float = 0.0) -> Tuple[List[float], int]:
        """
        Loads an audio file (WAV, MP3, M4A, AAC, FLAC, OGG) into a normalized list of float samples [-1.0, 1.0].
        Supports librosa, soundfile, and standard wave fallbacks.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Audio file not found: {file_path}")

        # 1. Primary decoder: librosa (handles WAV, MP3, M4A, AAC, FLAC, OGG)
        try:
            import librosa
            y, sr = librosa.load(
                file_path,
                sr=self.target_sr,
                mono=True,
                offset=offset_sec,
                duration=max_duration_sec
            )
            return y.tolist(), int(sr)
        except Exception:
            pass

        # 2. Secondary decoder: soundfile
        try:
            import soundfile as sf
            data, orig_sr = sf.read(file_path, dtype='float32')
            if data.ndim > 1:
                data = data.mean(axis=1)
            samples = data.tolist()
            if offset_sec > 0 or max_duration_sec is not None:
                start = int(orig_sr * offset_sec)
                end = int(orig_sr * (offset_sec + max_duration_sec)) if max_duration_sec else len(samples)
                samples = samples[start:end]
            if orig_sr != self.target_sr:
                samples = self.resample(samples, orig_sr, self.target_sr)
            return samples, self.target_sr
        except Exception:
            pass

        # 3. Fallback decoder: standard library wave module (WAV format only)
        try:
            with wave.open(file_path, 'rb') as wf:
                n_channels = wf.getnchannels()
                sampwidth = wf.getsampwidth()
                orig_sr = wf.getframerate()
                total_frames = wf.getnframes()

                if offset_sec > 0:
                    start_frame = min(int(orig_sr * offset_sec), max(0, total_frames - 1))
                    wf.setpos(start_frame)
                else:
                    start_frame = 0

                if max_duration_sec is not None and max_duration_sec > 0:
                    n_frames = min(int(orig_sr * max_duration_sec), total_frames - start_frame)
                else:
                    n_frames = total_frames - start_frame

                raw_data = wf.readframes(n_frames)

            if sampwidth == 2:  # 16-bit PCM
                total_samples = n_frames * n_channels
                fmt = f"<{total_samples}h"
                unpacked = struct.unpack(fmt, raw_data)
                max_val = 32768.0
                samples = [s / max_val for s in unpacked]
            elif sampwidth == 1:  # 8-bit PCM
                total_samples = n_frames * n_channels
                fmt = f"<{total_samples}B"
                unpacked = struct.unpack(fmt, raw_data)
                samples = [(s - 128) / 128.0 for s in unpacked]
            elif sampwidth == 4:  # 32-bit PCM
                total_samples = n_frames * n_channels
                fmt = f"<{total_samples}i"
                unpacked = struct.unpack(fmt, raw_data)
                samples = [s / 2147483648.0 for s in unpacked]
            else:
                raise ValueError(f"Unsupported sample width: {sampwidth * 8} bits")

            # Convert stereo to mono if necessary
            if n_channels > 1:
                mono_samples = []
                for i in range(0, len(samples), n_channels):
                    avg_val = sum(samples[i:i + n_channels]) / n_channels
                    mono_samples.append(avg_val)
                samples = mono_samples

            # Resample if sample rate differs from target_sr
            if orig_sr != self.target_sr:
                samples = self.resample(samples, orig_sr, self.target_sr)

            return samples, self.target_sr
        except Exception as e:
            raise ValueError(f"Could not decode audio file '{os.path.basename(file_path)}': {str(e)}")

    def resample(self, samples: List[float], orig_sr: int, target_sr: int) -> List[float]:
        """
        Resamples a 1D audio sample list using linear interpolation.
        """
        if orig_sr == target_sr:
            return samples
        duration = len(samples) / orig_sr
        target_length = int(duration * target_sr)
        if target_length <= 0:
            return []

        resampled = []
        ratio = orig_sr / target_sr
        for i in range(target_length):
            orig_idx = i * ratio
            idx_floor = int(orig_idx)
            idx_ceil = min(idx_floor + 1, len(samples) - 1)
            weight = orig_idx - idx_floor
            val = (1.0 - weight) * samples[idx_floor] + weight * samples[idx_ceil]
            resampled.append(val)
        return resampled

    def remove_dc_offset(self, samples: List[float]) -> List[float]:
        """Removes DC bias / zero-frequency offset."""
        if not samples:
            return []
        mean_val = sum(samples) / len(samples)
        return [s - mean_val for s in samples]

    def normalize_peak(self, samples: List[float], target_peak: float = 0.95) -> List[float]:
        """Scales audio to prevent clipping and ensure standard amplitude scale."""
        if not samples:
            return []
        peak = max(abs(s) for s in samples)
        if peak < 1e-6:
            return samples
        gain = target_peak / peak
        return [s * gain for s in samples]

    def trim_silence(self, samples: List[float], threshold: float = 0.015, frame_size: int = 512) -> List[float]:
        """
        Lightweight energy-based Voice Activity Detection (VAD) / silence trimming.
        Removes leading and trailing silence.
        """
        if len(samples) < frame_size:
            return samples

        # Find start
        start_idx = 0
        for i in range(0, len(samples) - frame_size, frame_size):
            frame = samples[i:i + frame_size]
            rms = math.sqrt(sum(x * x for x in frame) / frame_size)
            if rms >= threshold:
                start_idx = max(0, i - frame_size)
                break

        # Find end
        end_idx = len(samples)
        for i in range(len(samples) - frame_size, 0, -frame_size):
            frame = samples[i:i + frame_size]
            rms = math.sqrt(sum(x * x for x in frame) / frame_size)
            if rms >= threshold:
                end_idx = min(len(samples), i + 2 * frame_size)
                break

        if start_idx >= end_idx:
            return samples
        return samples[start_idx:end_idx]

    def apply_pre_emphasis(self, samples: List[float]) -> List[float]:
        """
        Applies pre-emphasis high-pass filter: y[n] = x[n] - alpha * x[n-1]
        Amplifies high frequencies to balance the natural spectral tilt of human speech.
        """
        if not samples:
            return []
        emphasized = [samples[0]]
        alpha = self.pre_emphasis_coeff
        for i in range(1, len(samples)):
            emphasized.append(samples[i] - alpha * samples[i - 1])
        return emphasized

    def preprocess_pipeline(self, file_path: str, max_duration_sec: Optional[float] = None, offset_sec: float = 0.0) -> Tuple[List[float], int]:
        """
        Executes full preprocessing pipeline:
        Load -> Resample -> DC Removal -> Trim Silence -> Normalize -> Pre-emphasis.
        """
        samples, sr = self.load_wav(file_path, max_duration_sec=max_duration_sec, offset_sec=offset_sec)
        samples = self.remove_dc_offset(samples)
        samples = self.trim_silence(samples)
        samples = self.normalize_peak(samples)
        samples = self.apply_pre_emphasis(samples)
        return samples, sr
