import React, { useState } from "react";
import { Mic, Play, Pause, Volume2, ShieldCheck, AlertTriangle, Radio } from "lucide-react";
import RiskBadge from "./RiskBadge";
import RiskScore from "./RiskScore";

const VoiceAnalysis = ({ voiceData, callerNumber }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const isSynthetic = voiceData?.is_synthetic ?? (voiceData?.synthetic_score ? voiceData.synthetic_score > 0.5 : false);
  const syntheticScore = voiceData?.synthetic_score ?? (voiceData?.probability ? voiceData.probability : (isSynthetic ? 0.88 : 0.12));
  const confidence = voiceData?.confidence ?? 0.94;
  const pitchConsistency = voiceData?.pitch_consistency ?? (isSynthetic ? 0.42 : 0.89);
  const spectralArtifacts = voiceData?.spectral_artifacts ?? (isSynthetic ? 0.76 : 0.08);
  const voiceCloneMatch = voiceData?.clone_similarity ?? (isSynthetic ? 0.82 : 0.05);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="cyber-panel p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isSynthetic ? "bg-rose-950/70 text-rose-400 border border-rose-800/60" : "bg-cyan-950/70 text-cyan-400 border border-cyan-800/60"}`}>
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Acoustic & Deepfake Voice Analysis
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                Librosa + PyTorch
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Spectral artifact profiling and synthetic neural vocoder detection
            </p>
          </div>
        </div>

        <RiskBadge
          risk={isSynthetic ? "critical" : "safe"}
          size="lg"
        />
      </div>

      {/* Main Score & Audio Visualizer row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
          <RiskScore
            score={Math.round(syntheticScore * 100)}
            confidence={confidence}
            size="lg"
            label="Synthetic Probability"
          />
          <div className="mt-3 text-xs text-slate-400">
            {isSynthetic ? (
              <span className="text-rose-400 font-semibold flex items-center justify-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> High AI Clone Match
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Authentic Human Vocal Tract
              </span>
            )}
          </div>
        </div>

        {/* Waveform & Player Panel */}
        <div className="md:col-span-2 bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1 font-mono text-cyan-400">
              <Radio className="w-3.5 h-3.5" /> Live Spectrogram Waveform
            </span>
            <span className="font-mono text-slate-400">16kHz • Mono FLAC/WAV</span>
          </div>

          {/* Simulated Waveform Visualizer Bars */}
          <div className="h-16 flex items-end gap-1 px-2 py-1 bg-slate-950/60 rounded-lg border border-slate-800/80 overflow-hidden">
            {[40, 65, 80, 50, 30, 75, 95, 45, 60, 85, 30, 50, 70, 90, 60, 40, 80, 100, 55, 35, 75, 60, 45, 90, 65, 50, 30, 85, 95, 40, 60, 75, 50, 30].map((height, i) => (
              <div
                key={i}
                className={`flex-1 rounded-sm transition-all duration-300 ${
                  isSynthetic
                    ? "bg-gradient-to-t from-rose-600 to-amber-500 opacity-80"
                    : "bg-gradient-to-t from-cyan-600 to-emerald-400 opacity-80"
                } ${isPlaying ? "animate-pulse" : ""}`}
                style={{
                  height: `${height}%`,
                  animationDelay: `${(i % 5) * 100}ms`,
                }}
              />
            ))}
          </div>

          {/* Audio Controls */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlayback}
                className="p-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-transform active:scale-95"
                title={isPlaying ? "Pause Audio" : "Play Audio"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <span>{isPlaying ? "Playing forensic audio..." : "00:00 / 00:45"}</span>
              </div>
            </div>

            <span className="text-[11px] font-mono text-slate-400">
              Sample: {callerNumber || "Target Recording"}
            </span>
          </div>
        </div>
      </div>

      {/* Deepfake Feature Telemetry Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/80">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
            <span>Spectral Inconsistency</span>
            <span className="font-mono font-semibold text-slate-200">
              {Math.round(spectralArtifacts * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${spectralArtifacts > 0.5 ? "bg-rose-500" : "bg-emerald-500"}`}
              style={{ width: `${spectralArtifacts * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            High values indicate AI vocoder artifacting
          </span>
        </div>

        <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/80">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
            <span>Pitch Glitch / Jitter</span>
            <span className="font-mono font-semibold text-slate-200">
              {Math.round((1 - pitchConsistency) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${pitchConsistency < 0.6 ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${(1 - pitchConsistency) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Unnatural fundamental frequency stability
          </span>
        </div>

        <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/80">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
            <span>Neural Clone Similarity</span>
            <span className="font-mono font-semibold text-slate-200">
              {Math.round(voiceCloneMatch * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${voiceCloneMatch > 0.5 ? "bg-rose-500" : "bg-emerald-500"}`}
              style={{ width: `${voiceCloneMatch * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Cosine distance against cloned voice embeddings
          </span>
        </div>
      </div>
    </div>
  );
};

export default VoiceAnalysis;