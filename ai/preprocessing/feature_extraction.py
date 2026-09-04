"""
feature_extraction.py
Extracts discriminative acoustic features for detecting cloned/synthetic voices:
- Mel-Frequency Cepstral Coefficients (MFCCs: 13 bands) + Delta coefficients
- Spectral moments (Centroid, Spread/Bandwidth, Rolloff, Flatness)
- Temporal statistics (RMS energy, Zero-Crossing Rate)
- Voice quality metrics (F0 pitch mean/std, Jitter, Shimmer, High-frequency energy ratio)
"""

import math
from typing import List, Dict, Any, Optional

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    np = None
    HAS_NUMPY = False


class AudioFeatureExtractor:
    """
    Extracts acoustic feature vectors from preprocessed audio signals.
    """

    FEATURE_NAMES = [
        "rms_mean", "rms_std",
        "zcr_mean", "zcr_std",
        "spectral_centroid_mean", "spectral_centroid_std",
        "spectral_bandwidth_mean",
        "spectral_rolloff_mean",
        "spectral_flatness_mean",
        "high_freq_ratio",
        "f0_mean", "f0_std",
        "jitter_local",
        "shimmer_local"
    ] + [f"mfcc_{i}_mean" for i in range(1, 14)] + [f"mfcc_delta_{i}_mean" for i in range(1, 14)]

    def __init__(self, sample_rate: int = 16000, frame_size: int = 512, hop_size: int = 256):
        self.sample_rate = sample_rate
        self.frame_size = frame_size
        self.hop_size = hop_size
        self.n_mfcc = 13

    def frame_signal(self, samples: List[float]) -> List[List[float]]:
        """Splits 1D signal into overlapping frames with a Hann window."""
        frames = []
        n_samples = len(samples)
        if n_samples < self.frame_size:
            # Pad with zeros
            padded = samples + [0.0] * (self.frame_size - n_samples)
            return [padded]

        # Hann window
        window = [0.5 * (1.0 - math.cos(2 * math.pi * n / (self.frame_size - 1))) for n in range(self.frame_size)]

        for start in range(0, n_samples - self.frame_size + 1, self.hop_size):
            frame = [samples[start + i] * window[i] for i in range(self.frame_size)]
            frames.append(frame)
        return frames

    def compute_fft_magnitude(self, frame: List[float]) -> List[float]:
        """
        Computes magnitude spectrum for a frame using FFT.
        Uses numpy if available, otherwise fast Cooley-Tukey Radix-2 FFT.
        """
        if HAS_NUMPY:
            arr = np.array(frame, dtype=np.float32)
            mags = np.abs(np.fft.rfft(arr)).tolist()
            return mags

        N = len(frame)
        # Check if power of 2
        if (N & (N - 1)) != 0:
            # Fallback pad to next power of 2
            p = 1
            while p < N:
                p <<= 1
            frame = frame + [0.0] * (p - N)
            N = p

        # Cooley-Tukey Radix-2 FFT
        def fft(x):
            n = len(x)
            if n <= 1:
                return x
            even = fft(x[0::2])
            odd = fft(x[1::2])
            t = [math.cos(-2 * math.pi * k / n) + 1j * math.sin(-2 * math.pi * k / n) for k in range(n // 2)]
            return [even[k] + t[k] * odd[k] for k in range(n // 2)] + \
                   [even[k] - t[k] * odd[k] for k in range(n // 2)]

        complex_spec = fft([complex(s, 0.0) for s in frame])
        num_bins = N // 2 + 1
        return [abs(c) for c in complex_spec[:num_bins]]

    def compute_rms(self, frames: List[List[float]]) -> Tuple[float, float]:
        """Computes mean and standard deviation of frame RMS energies."""
        rms_vals = []
        for frame in frames:
            energy = sum(x * x for x in frame) / len(frame)
            rms_vals.append(math.sqrt(energy))
        if not rms_vals:
            return 0.0, 0.0
        mean = sum(rms_vals) / len(rms_vals)
        variance = sum((x - mean) ** 2 for x in rms_vals) / len(rms_vals)
        return mean, math.sqrt(variance)

    def compute_zcr(self, frames: List[List[float]]) -> Tuple[float, float]:
        """Computes mean and standard deviation of Zero Crossing Rate."""
        zcr_vals = []
        for frame in frames:
            crossings = sum(1 for i in range(1, len(frame)) if (frame[i] >= 0 > frame[i - 1]) or (frame[i] < 0 <= frame[i - 1]))
            zcr_vals.append(crossings / len(frame))
        if not zcr_vals:
            return 0.0, 0.0
        mean = sum(zcr_vals) / len(zcr_vals)
        variance = sum((x - mean) ** 2 for x in zcr_vals) / len(zcr_vals)
        return mean, math.sqrt(variance)

    def compute_spectral_features(self, frames: List[List[float]]) -> Dict[str, float]:
        """Computes Spectral Centroid, Bandwidth, Rolloff, and Flatness."""
        centroids = []
        bandwidths = []
        rolloffs = []
        flatnesses = []
        high_freq_energies = []
        total_energies = []

        bin_freq_step = (self.sample_rate / 2.0) / (self.frame_size // 2)
        high_freq_cutoff_bin = int(3000.0 / bin_freq_step)  # > 3000 Hz

        for frame in frames:
            mags = self.compute_fft_magnitude(frame)
            total_mag = sum(mags) + 1e-10

            # Spectral Centroid
            weighted_sum = sum(i * bin_freq_step * mags[i] for i in range(len(mags)))
            centroid = weighted_sum / total_mag
            centroids.append(centroid)

            # Spectral Bandwidth
            bw = math.sqrt(sum(((i * bin_freq_step - centroid) ** 2) * mags[i] for i in range(len(mags))) / total_mag)
            bandwidths.append(bw)

            # Spectral Rolloff (85% energy)
            threshold = 0.85 * total_mag
            cumulative = 0.0
            rolloff = self.sample_rate / 2.0
            for i, m in enumerate(mags):
                cumulative += m
                if cumulative >= threshold:
                    rolloff = i * bin_freq_step
                    break
            rolloffs.append(rolloff)

            # Spectral Flatness: geometric_mean / arithmetic_mean
            arithmetic_mean = total_mag / len(mags)
            log_sum = sum(math.log(max(m, 1e-10)) for m in mags)
            geometric_mean = math.exp(log_sum / len(mags))
            flatnesses.append(geometric_mean / (arithmetic_mean + 1e-10))

            # High Frequency Energy (> 3000 Hz)
            hf_mag = sum(mags[high_freq_cutoff_bin:]) if high_freq_cutoff_bin < len(mags) else 0.0
            high_freq_energies.append(hf_mag)
            total_energies.append(total_mag)

        c_mean = sum(centroids) / len(centroids) if centroids else 0.0
        c_std = math.sqrt(sum((x - c_mean) ** 2 for x in centroids) / len(centroids)) if centroids else 0.0
        bw_mean = sum(bandwidths) / len(bandwidths) if bandwidths else 0.0
        ro_mean = sum(rolloffs) / len(rolloffs) if rolloffs else 0.0
        flat_mean = sum(flatnesses) / len(flatnesses) if flatnesses else 0.0
        hf_ratio = sum(high_freq_energies) / (sum(total_energies) + 1e-10)

        return {
            "spectral_centroid_mean": c_mean,
            "spectral_centroid_std": c_std,
            "spectral_bandwidth_mean": bw_mean,
            "spectral_rolloff_mean": ro_mean,
            "spectral_flatness_mean": flat_mean,
            "high_freq_ratio": hf_ratio
        }

    def compute_pitch_and_perturbations(self, samples: List[float]) -> Dict[str, float]:
        """
        Estimates Fundamental Frequency (F0) using autocorrelation,
        and computes Jitter and Shimmer (vital indicators of vocoder / cloned speech).
        """
        if len(samples) < self.sample_rate // 10:
            return {"f0_mean": 0.0, "f0_std": 0.0, "jitter_local": 0.0, "shimmer_local": 0.0}

        # Pitch range for human speech: 60 Hz to 400 Hz
        min_lag = int(self.sample_rate / 400.0)
        max_lag = int(self.sample_rate / 60.0)

        frame_len = 512
        step = 1024
        f0_estimates = []
        amplitudes = []

        for start in range(0, len(samples) - frame_len - max_lag, step):
            segment = samples[start:start + frame_len]
            best_corr = -1.0
            best_lag = 0

            # Autocorrelation
            energy_0 = sum(x * x for x in segment)
            if energy_0 < 1e-4:
                continue

            for lag in range(min_lag, max_lag, 2):
                corr = sum(segment[n] * samples[start + n + lag] for n in range(0, frame_len, 2))
                norm_corr = corr / (energy_0 / 2.0 + 1e-6)
                if norm_corr > best_corr:
                    best_corr = norm_corr
                    best_lag = lag

            if best_corr > 0.35 and best_lag > 0:
                f0 = self.sample_rate / best_lag
                f0_estimates.append(f0)
                amplitudes.append(math.sqrt(energy_0 / frame_len))

        if not f0_estimates:
            return {"f0_mean": 0.0, "f0_std": 0.0, "jitter_local": 0.0, "shimmer_local": 0.0}

        f0_mean = sum(f0_estimates) / len(f0_estimates)
        f0_std = math.sqrt(sum((f - f0_mean) ** 2 for f in f0_estimates) / len(f0_estimates))

        # Jitter: cycle-to-cycle F0 relative variation
        if len(f0_estimates) > 1:
            diffs = [abs(f0_estimates[i] - f0_estimates[i - 1]) for i in range(1, len(f0_estimates))]
            jitter = (sum(diffs) / len(diffs)) / (f0_mean + 1e-6)
        else:
            jitter = 0.0

        # Shimmer: cycle-to-cycle peak amplitude relative variation
        if len(amplitudes) > 1:
            amp_mean = sum(amplitudes) / len(amplitudes)
            amp_diffs = [abs(amplitudes[i] - amplitudes[i - 1]) for i in range(1, len(amplitudes))]
            shimmer = (sum(amp_diffs) / len(amp_diffs)) / (amp_mean + 1e-6)
        else:
            shimmer = 0.0

        return {
            "f0_mean": f0_mean,
            "f0_std": f0_std,
            "jitter_local": jitter,
            "shimmer_local": shimmer
        }

    def compute_mfcc(self, frames: List[List[float]]) -> Dict[str, float]:
        """
        Computes 13 Mel-Frequency Cepstral Coefficients and their delta derivatives.
        """
        n_filters = 20
        min_hz = 0
        max_hz = self.sample_rate / 2.0

        def hz_to_mel(hz):
            return 2595.0 * math.log10(1.0 + hz / 700.0)

        def mel_to_hz(mel):
            return 700.0 * (10.0 ** (mel / 2595.0) - 1.0)

        min_mel = hz_to_mel(min_hz)
        max_mel = hz_to_mel(max_hz)
        mel_points = [min_mel + i * (max_mel - min_mel) / (n_filters + 1) for i in range(n_filters + 2)]
        hz_points = [mel_to_hz(m) for m in mel_points]
        bin_step = (self.sample_rate / 2.0) / (self.frame_size // 2)
        bin_points = [int(h / bin_step) for h in hz_points]

        # Compute filterbank energies
        mfcc_frame_matrix = []
        for frame in frames:
            mags = self.compute_fft_magnitude(frame)
            filter_energies = []
            for m in range(1, n_filters + 1):
                f_energy = 0.0
                left, center, right = bin_points[m - 1], bin_points[m], bin_points[m + 1]
                for k in range(left, center):
                    if center > left and k < len(mags):
                        f_energy += mags[k] * ((k - left) / (center - left))
                for k in range(center, right):
                    if right > center and k < len(mags):
                        f_energy += mags[k] * ((right - k) / (right - center))
                filter_energies.append(math.log(max(f_energy, 1e-6)))

            # Discrete Cosine Transform (DCT-II) for first 13 cepstral coefficients
            ceps = []
            for i in range(self.n_mfcc):
                c = sum(filter_energies[j] * math.cos(math.pi * i * (j + 0.5) / n_filters) for j in range(n_filters))
                ceps.append(c)
            mfcc_frame_matrix.append(ceps)

        # Compute Mean MFCCs
        result = {}
        for i in range(self.n_mfcc):
            coeff_vals = [f[i] for f in mfcc_frame_matrix]
            mean_c = sum(coeff_vals) / len(coeff_vals) if coeff_vals else 0.0
            result[f"mfcc_{i+1}_mean"] = mean_c

        # Compute Delta MFCCs (frame[t+1] - frame[t-1])
        for i in range(self.n_mfcc):
            deltas = []
            for t in range(1, len(mfcc_frame_matrix) - 1):
                d = (mfcc_frame_matrix[t + 1][i] - mfcc_frame_matrix[t - 1][i]) / 2.0
                deltas.append(d)
            delta_mean = sum(deltas) / len(deltas) if deltas else 0.0
            result[f"mfcc_delta_{i+1}_mean"] = delta_mean

        return result

    def extract_features(self, samples: List[float]) -> Dict[str, float]:
        """
        Runs complete feature extraction and returns a dictionary of all features.
        """
        frames = self.frame_signal(samples)

        rms_mean, rms_std = self.compute_rms(frames)
        zcr_mean, zcr_std = self.compute_zcr(frames)
        spectral = self.compute_spectral_features(frames)
        pitch = self.compute_pitch_and_perturbations(samples)
        mfccs = self.compute_mfcc(frames)

        features = {
            "rms_mean": rms_mean,
            "rms_std": rms_std,
            "zcr_mean": zcr_mean,
            "zcr_std": zcr_std,
            **spectral,
            **pitch,
            **mfccs
        }
        return features

    def extract_feature_vector(self, samples: List[float]) -> List[float]:
        """
        Extracts features and returns ordered list of float values matching FEATURE_NAMES.
        """
        feat_dict = self.extract_features(samples)
        return [feat_dict.get(name, 0.0) for name in self.FEATURE_NAMES]
